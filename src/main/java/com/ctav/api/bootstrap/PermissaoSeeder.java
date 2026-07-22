package com.ctav.api.bootstrap;

import com.ctav.api.entity.PermissaoUsuario;
import com.ctav.api.entity.Usuario;
import com.ctav.api.repository.PermissaoUsuarioRepository;
import com.ctav.api.repository.UsuarioRepository;
import com.ctav.api.security.Permissao;
import com.ctav.api.service.AuthService;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

/**
 * Garante, na subida da aplicação, que:
 * <ul>
 *   <li>a tabela permissoes_usuarios contenha os 3 tipos (1/2/3);</li>
 *   <li>o usuário "teste" seja administrador (permissão 1);</li>
 *   <li>existam os usuários "testepsico" (permissão 2) e "testeadv" (3).</li>
 * </ul>
 * A operação é idempotente — não recria nada que já exista.
 */
@ApplicationScoped
public class PermissaoSeeder {

    private static final Logger LOG = Logger.getLogger(PermissaoSeeder.class);
    // Senha padrão dos usuários de teste caso não haja o usuário "teste" para
    // reaproveitar o hash. Deve ser trocada após o primeiro acesso.
    private static final String SENHA_PADRAO = "mudar123";

    @Inject
    PermissaoUsuarioRepository permissaoRepository;

    @Inject
    UsuarioRepository usuarioRepository;

    @Inject
    AuthService authService;

    @Transactional
    void aoIniciar(@Observes StartupEvent evento) {
        garantirPermissao(Permissao.ADMINISTRADOR, "administrador");
        garantirPermissao(Permissao.PSICOLOGO, "psicologo");
        garantirPermissao(Permissao.ADVOGADO, "advogado");
        garantirPermissao(Permissao.FINANCEIRO, "financeiro");

        // Usuário "teste" existente vira administrador e é a conta de dados
        // (tenant) compartilhada pelos usuários de teste.
        Usuario teste = usuarioRepository.findByUsername("teste").orElse(null);
        if (teste != null) {
            teste.setPermissao(permissaoRepository.findById(Permissao.ADMINISTRADOR));
            if (teste.getContaId() == null) {
                teste.setContaId(teste.getId());
            }
            usuarioRepository.persist(teste);
        }

        // Conta compartilhada e senha reaproveitada do "teste".
        Long contaCompartilhada = teste != null ? teste.getId() : null;
        String hashSenha = teste != null && teste.getSenhaHash() != null
                ? teste.getSenhaHash()
                : authService.gerarHash(SENHA_PADRAO);

        garantirUsuario("testepsico", "Usuário Psicólogo (teste)",
                Permissao.PSICOLOGO, hashSenha, contaCompartilhada);
        garantirUsuario("testeadv", "Usuário Advogado (teste)",
                Permissao.ADVOGADO, hashSenha, contaCompartilhada);
    }

    private void garantirPermissao(int id, String nome) {
        if (permissaoRepository.findByIdOptional(id).isEmpty()) {
            permissaoRepository.persist(PermissaoUsuario.builder().id(id).nome(nome).build());
            LOG.infof("Permissão criada: %d = %s", id, nome);
        }
    }

    private void garantirUsuario(String username, String nome, int permissaoId,
                                 String hashSenha, Long contaId) {
        Usuario existente = usuarioRepository.findByUsername(username).orElse(null);
        if (existente != null) {
            // Garante o vínculo de conta mesmo para usuários já criados antes.
            if (contaId != null && existente.getContaId() == null) {
                existente.setContaId(contaId);
                usuarioRepository.persist(existente);
            }
            return;
        }
        Usuario usuario = Usuario.builder()
                .username(username)
                .nome(nome)
                .senhaHash(hashSenha)
                .permissao(permissaoRepository.findById(permissaoId))
                .contaId(contaId)
                .build();
        usuarioRepository.persist(usuario);
        LOG.infof("Usuário de teste criado: %s (permissão %d)", username, permissaoId);
    }
}
