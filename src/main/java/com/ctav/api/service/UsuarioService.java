package com.ctav.api.service;

import com.ctav.api.dto.AlterarSenhaRequestDTO;
import com.ctav.api.dto.AtualizarPerfilRequestDTO;
import com.ctav.api.dto.AtualizarUsuarioRequestDTO;
import com.ctav.api.dto.CriarUsuarioRequestDTO;
import com.ctav.api.dto.UsuarioPerfilResponseDTO;
import com.ctav.api.dto.UsuarioResumoDTO;
import com.ctav.api.entity.Usuario;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.PermissaoUsuarioRepository;
import com.ctav.api.repository.UsuarioRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;

// Gerencia o perfil do proprio usuario logado (nome, nome de usuario e senha).
// O id nunca e alterado: e a chave que liga o usuario a todos os seus registros.
@ApplicationScoped
public class UsuarioService {

    @Inject
    UsuarioRepository usuarioRepository;

    @Inject
    UsuarioContext usuarioContext;

    @Inject
    AuthService authService;

    @Inject
    PermissaoUsuarioRepository permissaoRepository;

    @Inject
    EntityManager em;

    public UsuarioPerfilResponseDTO buscarPerfil() {
        return UsuarioPerfilResponseDTO.fromEntity(usuarioAtual());
    }

    @Transactional
    public UsuarioPerfilResponseDTO atualizarPerfil(AtualizarPerfilRequestDTO dto) {
        Usuario usuario = usuarioAtual();
        String novoUsername = dto.getUsername().trim();

        usuarioRepository.findByUsername(novoUsername).ifPresent(existente -> {
            if (!existente.getId().equals(usuario.getId())) {
                throw new BusinessException("Já existe um usuário com este nome de usuário.");
            }
        });

        usuario.setUsername(novoUsername);
        usuario.setNome(dto.getNome() != null && !dto.getNome().isBlank()
                ? dto.getNome().trim()
                : null);
        usuarioRepository.persist(usuario);
        return UsuarioPerfilResponseDTO.fromEntity(usuario);
    }

    @Transactional
    public void alterarSenha(AlterarSenhaRequestDTO dto) {
        Usuario usuario = usuarioAtual();

        if (!authService.verificarSenha(dto.getSenhaAtual(), usuario.getSenhaHash())) {
            throw new BusinessException("A senha atual está incorreta.");
        }

        usuario.setSenhaHash(authService.gerarHash(dto.getNovaSenha()));
        usuarioRepository.persist(usuario);
    }

    // ===== Gestão de permissões (somente administrador) =====

    public List<UsuarioResumoDTO> listarUsuariosDaConta() {
        exigirAdministrador();
        Long identidadeId = usuarioContext.identidadeId();
        return usuarioRepository.listByConta(usuarioContext.id()).stream()
                .map(u -> UsuarioResumoDTO.fromEntity(u, identidadeId))
                .toList();
    }

    @Transactional
    public UsuarioResumoDTO criarUsuario(CriarUsuarioRequestDTO dto) {
        exigirAdministrador();
        String username = dto.getUsername().trim();

        usuarioRepository.findByUsername(username).ifPresent(u -> {
            throw new BusinessException("Já existe um usuário com este nome de usuário.");
        });
        if (permissaoRepository.findByIdOptional(dto.getPermissaoId()).isEmpty()) {
            throw new BusinessException("Permissão inválida.");
        }

        Usuario novo = Usuario.builder()
                .username(username)
                .nome(dto.getNome() != null && !dto.getNome().isBlank()
                        ? dto.getNome().trim() : null)
                .senhaHash(authService.gerarHash(dto.getSenha()))
                .permissao(permissaoRepository.findById(dto.getPermissaoId()))
                // Novo usuário compartilha a conta de dados do administrador.
                .contaId(usuarioContext.id())
                .build();
        usuarioRepository.persist(novo);
        return UsuarioResumoDTO.fromEntity(novo, usuarioContext.identidadeId());
    }

    @Transactional
    public UsuarioResumoDTO atualizarUsuario(Long usuarioId, AtualizarUsuarioRequestDTO dto) {
        exigirAdministrador();
        Usuario alvo = usuarioDaContaOuFalha(usuarioId);
        String username = dto.getUsername().trim();

        usuarioRepository.findByUsername(username).ifPresent(existente -> {
            if (!existente.getId().equals(alvo.getId())) {
                throw new BusinessException("Já existe um usuário com este nome de usuário.");
            }
        });

        boolean ehProprio = alvo.getId().equals(usuarioContext.identidadeId());
        if (!ehProprio) {
            if (permissaoRepository.findByIdOptional(dto.getPermissaoId()).isEmpty()) {
                throw new BusinessException("Permissão inválida.");
            }
            alvo.setPermissao(permissaoRepository.findById(dto.getPermissaoId()));
        } else if (!dto.getPermissaoId().equals(alvo.getPermissaoId())) {
            throw new BusinessException("Você não pode alterar a sua própria permissão.");
        }

        alvo.setUsername(username);
        alvo.setNome(dto.getNome() != null && !dto.getNome().isBlank()
                ? dto.getNome().trim() : null);
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            alvo.setSenhaHash(authService.gerarHash(dto.getSenha()));
        }
        usuarioRepository.persist(alvo);
        return UsuarioResumoDTO.fromEntity(alvo, usuarioContext.identidadeId());
    }

    @Transactional
    public void excluirUsuario(Long usuarioId) {
        exigirAdministrador();
        Usuario alvo = usuarioDaContaOuFalha(usuarioId);

        if (alvo.getId().equals(usuarioContext.identidadeId())) {
            throw new BusinessException("Você não pode excluir o seu próprio usuário.");
        }

        // Se o usuário é o dono da conta de dados (contaId nulo ou apontando para
        // si mesmo) e ainda há outros usuários vinculados a essa conta, não pode
        // ser excluído: isso deixaria os demais usuários órfãos e apagaria os
        // dados compartilhados. Exclua primeiro os usuários vinculados.
        boolean ehDonoDaConta = alvo.getContaIdEfetiva().equals(alvo.getId());
        if (ehDonoDaConta) {
            long vinculados = usuarioRepository.count("contaId = ?1 and id <> ?1", alvo.getId());
            if (vinculados > 0) {
                throw new BusinessException(
                        "Este usuário é o dono da conta de dados e possui outros usuários "
                        + "vinculados. Exclua os usuários vinculados antes de removê-lo.");
            }
        }

        // Remove todos os registros pertencentes a ESTE usuário. O escopo é sempre
        // o usuario_id (a identidade do usuário), NUNCA o conta_id compartilhado:
        // assim, ao excluir um usuário comum (que apenas compartilha a conta), os
        // dados do administrador dono da conta permanecem intactos; e ao excluir
        // um administrador dono da conta, apagamos apenas os dados dele — nunca os
        // de outro administrador (que possuem usuario_id diferente).
        apagarDadosDoUsuario(alvo.getId());

        usuarioRepository.delete(alvo);
        // Garante que a exclusão seja aplicada imediatamente no banco (e que
        // eventuais erros de integridade apareçam ainda dentro da transação).
        usuarioRepository.flush();
    }

    // Apaga, na ordem correta de dependências (chaves estrangeiras), todos os
    // registros cujo usuario_id seja o do usuário informado.
    private void apagarDadosDoUsuario(Long usuarioId) {
        // Registros que dependem de acolhido/medicamento (filhos mais profundos).
        executarDelete("DELETE FROM administracoes_medicamento WHERE usuario_id = :uid", usuarioId);
        executarDelete("DELETE FROM acolhido_medicamento WHERE usuario_id = :uid", usuarioId);
        executarDelete("DELETE FROM combinados WHERE usuario_id = :uid", usuarioId);
        executarDelete("DELETE FROM consultas WHERE usuario_id = :uid", usuarioId);
        // Anexos e vínculos de ocorrência (não possuem usuario_id: escopo via acolhido/ocorrência).
        executarDelete(
                "DELETE FROM anexos WHERE acolhido_id IN "
                + "(SELECT id FROM acolhidos WHERE usuario_id = :uid)", usuarioId);
        executarDelete(
                "DELETE FROM ocorrencia_acolhidos WHERE ocorrencia_id IN "
                + "(SELECT id FROM ocorrencias WHERE usuario_id = :uid)", usuarioId);
        executarDelete(
                "DELETE FROM ocorrencia_acolhidos WHERE acolhido_id IN "
                + "(SELECT id FROM acolhidos WHERE usuario_id = :uid)", usuarioId);
        executarDelete("DELETE FROM ocorrencias WHERE usuario_id = :uid", usuarioId);
        // Acolhidos (referenciam motivos e responsáveis) antes desses pais.
        executarDelete("DELETE FROM acolhidos WHERE usuario_id = :uid", usuarioId);
        executarDelete("DELETE FROM responsaveis WHERE usuario_id = :uid", usuarioId);
        executarDelete("DELETE FROM medicamentos WHERE usuario_id = :uid", usuarioId);
        executarDelete("DELETE FROM motivos WHERE usuario_id = :uid", usuarioId);
    }

    private void executarDelete(String sql, Long usuarioId) {
        em.createNativeQuery(sql).setParameter("uid", usuarioId).executeUpdate();
    }

    private Usuario usuarioDaContaOuFalha(Long usuarioId) {
        return usuarioRepository.findByIdOptional(usuarioId)
                .filter(u -> u.getContaIdEfetiva().equals(usuarioContext.id()))
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    @Transactional
    public UsuarioResumoDTO alterarPermissao(Long usuarioId, Integer permissaoId) {
        exigirAdministrador();

        if (usuarioId != null && usuarioId.equals(usuarioContext.identidadeId())) {
            throw new BusinessException("Você não pode alterar a sua própria permissão.");
        }

        Usuario alvo = usuarioRepository.findByIdOptional(usuarioId)
                .filter(u -> u.getContaIdEfetiva().equals(usuarioContext.id()))
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        if (permissaoRepository.findByIdOptional(permissaoId).isEmpty()) {
            throw new BusinessException("Permissão inválida.");
        }

        alvo.setPermissao(permissaoRepository.findById(permissaoId));
        usuarioRepository.persist(alvo);
        return UsuarioResumoDTO.fromEntity(alvo, usuarioContext.identidadeId());
    }

    private void exigirAdministrador() {
        if (!usuarioContext.isAdministrador()) {
            throw new BusinessException("Apenas administradores podem gerenciar permissões.");
        }
    }

    private Usuario usuarioAtual() {
        // Perfil/senha operam sobre a IDENTIDADE do usuário logado (nunca sobre
        // a conta de dados compartilhada).
        return usuarioRepository.findByIdOptional(usuarioContext.identidadeId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }
}
