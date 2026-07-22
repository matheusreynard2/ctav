import { useEffect, useState } from 'react';
import { usuarioService } from '../api';
import { usePaginacao } from '../hooks/usePaginacao';
import Paginacao from './Paginacao.jsx';
import ModalConfirmacao from './ModalConfirmacao.jsx';

const PERMISSOES_DISPONIVEIS = [
  { id: 1, label: 'Administrador' },
  { id: 2, label: 'Psicólogo' },
  { id: 3, label: 'Advogado' },
  { id: 4, label: 'Financeiro' },
];

const rotularPermissaoId = (id) =>
  PERMISSOES_DISPONIVEIS.find((p) => p.id === id)?.label || '—';

const FORM_USUARIO_INICIAL = {
  username: '',
  nome: '',
  permissaoId: 2,
  senha: '',
};

const formatarDataHora = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Pagina de configuracoes do usuario logado: permite alterar o nome de usuario,
// o nome e a senha. O ID e exibido apenas para consulta e nunca pode ser
// alterado (e a chave que liga o usuario a todos os seus dados no sistema).
export default function ConfiguracoesUsuario({
  onErro,
  onSucesso,
  onPerfilAtualizado,
}) {
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [dados, setDados] = useState({ username: '', nome: '' });
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [errosDados, setErrosDados] = useState({});

  const [senha, setSenha] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [errosSenha, setErrosSenha] = useState({});

  const [usuarios, setUsuarios] = useState([]);
  const [modalUsuario, setModalUsuario] = useState(null); // { modo, id }
  const [formUsuario, setFormUsuario] = useState(FORM_USUARIO_INICIAL);
  const [errosUsuario, setErrosUsuario] = useState({});
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);

  const ehAdmin = perfil?.permissaoId === 1;

  const {
    paginaAtual: paginaUsuarios,
    totalPaginas: totalPaginasUsuarios,
    total: totalUsuarios,
    inicio: inicioUsuarios,
    fim: fimUsuarios,
    itensPagina: usuariosPagina,
    setPagina: setPaginaUsuarios,
  } = usePaginacao(usuarios, 10);

  useEffect(() => {
    let ativo = true;
    usuarioService
      .perfil()
      .then((p) => {
        if (!ativo) return;
        setPerfil(p);
        setDados({ username: p.username ?? '', nome: p.nome ?? '' });
      })
      .catch(() => {
        if (ativo) onErro?.('Não foi possível carregar os dados do usuário.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega os usuários da conta somente para o administrador (gestão de
  // permissões).
  useEffect(() => {
    if (!ehAdmin) return;
    let ativo = true;
    usuarioService
      .listarUsuarios()
      .then((lista) => {
        if (ativo) setUsuarios(lista);
      })
      .catch(() => {
        if (ativo) onErro?.('Não foi possível carregar os usuários.');
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehAdmin]);

  const recarregarUsuarios = async () => {
    try {
      const lista = await usuarioService.listarUsuarios();
      setUsuarios(lista);
    } catch {
      onErro?.('Não foi possível recarregar os usuários.');
    }
  };

  const abrirCriarUsuario = () => {
    setFormUsuario(FORM_USUARIO_INICIAL);
    setErrosUsuario({});
    setModalUsuario({ modo: 'criar' });
  };

  const abrirEditarUsuario = (u) => {
    setFormUsuario({
      username: u.username ?? '',
      nome: u.nome ?? '',
      permissaoId: u.permissaoId ?? 2,
      senha: '',
    });
    setErrosUsuario({});
    setModalUsuario({ modo: 'editar', id: u.id, proprio: u.proprio });
  };

  const fecharModalUsuario = () => {
    if (salvandoUsuario) return;
    setModalUsuario(null);
  };

  const validarFormUsuario = () => {
    const e = {};
    if (!formUsuario.username.trim() || formUsuario.username.trim().length < 2) {
      e.username = 'Informe o nome de usuário (mínimo 2 caracteres).';
    }
    const criando = modalUsuario?.modo === 'criar';
    if (criando) {
      if (!formUsuario.senha || formUsuario.senha.length < 4) {
        e.senha = 'Informe a senha (mínimo 4 caracteres).';
      }
    } else if (formUsuario.senha && formUsuario.senha.length < 4) {
      e.senha = 'A nova senha deve ter ao menos 4 caracteres.';
    }
    setErrosUsuario(e);
    return Object.keys(e).length === 0;
  };

  const salvarUsuario = async () => {
    if (!validarFormUsuario()) return;
    setSalvandoUsuario(true);
    try {
      if (modalUsuario.modo === 'criar') {
        await usuarioService.criarUsuario({
          username: formUsuario.username.trim(),
          nome: formUsuario.nome.trim() || null,
          senha: formUsuario.senha,
          permissaoId: Number(formUsuario.permissaoId),
        });
        onSucesso?.('Usuário criado com sucesso.');
      } else {
        const payload = {
          username: formUsuario.username.trim(),
          nome: formUsuario.nome.trim() || null,
          permissaoId: Number(formUsuario.permissaoId),
        };
        // Só envia a senha quando o admin quer redefini-la.
        if (formUsuario.senha) payload.senha = formUsuario.senha;
        await usuarioService.atualizarUsuario(modalUsuario.id, payload);
        onSucesso?.('Usuário atualizado com sucesso.');
      }
      await recarregarUsuarios();
      setModalUsuario(null);
    } catch (err) {
      onErro?.(
        err?.response?.data?.message || 'Não foi possível salvar o usuário.'
      );
    } finally {
      setSalvandoUsuario(false);
    }
  };

  const confirmarExclusaoUsuario = async () => {
    const u = usuarioParaExcluir;
    if (!u) return;
    setExcluindoId(u.id);
    try {
      await usuarioService.excluirUsuario(u.id);
      // Recarrega a lista a partir do banco para refletir o estado real da
      // tabela de usuários (em vez de remover apenas localmente).
      await recarregarUsuarios();
      onSucesso?.(`Usuário "${u.username}" excluído.`);
      setUsuarioParaExcluir(null);
    } catch (err) {
      onErro?.(
        err?.response?.data?.message || 'Não foi possível excluir o usuário.'
      );
    } finally {
      setExcluindoId(null);
    }
  };

  const handleSalvarDados = async (e) => {
    e.preventDefault();
    const erros = {};
    if (!dados.username.trim()) {
      erros.username = 'Informe o nome de usuário.';
    } else if (dados.username.trim().length < 2) {
      erros.username = 'O nome de usuário deve ter ao menos 2 caracteres.';
    }
    setErrosDados(erros);
    if (Object.keys(erros).length > 0) return;

    setSalvandoDados(true);
    try {
      const atualizado = await usuarioService.atualizarPerfil({
        username: dados.username.trim(),
        nome: dados.nome.trim() || null,
      });
      onPerfilAtualizado?.(atualizado);
      onSucesso?.('Dados atualizados com sucesso.');
    } catch (err) {
      onErro?.(
        err?.response?.data?.message || 'Não foi possível salvar os dados.'
      );
    } finally {
      setSalvandoDados(false);
    }
  };

  const handleSalvarSenha = async (e) => {
    e.preventDefault();
    const erros = {};
    if (!senha.senhaAtual) erros.senhaAtual = 'Informe a senha atual.';
    if (!senha.novaSenha) {
      erros.novaSenha = 'Informe a nova senha.';
    } else if (senha.novaSenha.length < 4) {
      erros.novaSenha = 'A nova senha deve ter ao menos 4 caracteres.';
    }
    if (senha.confirmarSenha !== senha.novaSenha) {
      erros.confirmarSenha = 'A confirmação não corresponde à nova senha.';
    }
    setErrosSenha(erros);
    if (Object.keys(erros).length > 0) return;

    setSalvandoSenha(true);
    try {
      await usuarioService.alterarSenha({
        senhaAtual: senha.senhaAtual,
        novaSenha: senha.novaSenha,
      });
      setSenha({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      onSucesso?.('Senha alterada com sucesso.');
    } catch (err) {
      onErro?.(
        err?.response?.data?.message || 'Não foi possível alterar a senha.'
      );
    } finally {
      setSalvandoSenha(false);
    }
  };

  if (carregando) {
    return (
      <div className="card">
        <div className="form-cabecalho">
          <h2>Configurações</h2>
        </div>
        <div className="auth-carregando">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="configuracoes">
      <div className="card">
        <div className="form-cabecalho">
          <h2>Configurações do usuário</h2>
        </div>

        <form className="form" onSubmit={handleSalvarDados}>
          <h3 className="detalhes-secao-titulo">Dados do usuário</h3>
          <div className="grid">
            <div className="campo">
              <label htmlFor="config-id">ID</label>
              <input
                id="config-id"
                value={perfil?.id ?? ''}
                disabled
                readOnly
              />
              <span className="campo-ajuda">
                Identificador do usuário. Não pode ser alterado, pois liga você a
                todos os dados do sistema.
              </span>
            </div>

            <div className="campo">
              <label htmlFor="config-criado">Criado em</label>
              <input
                id="config-criado"
                value={formatarDataHora(perfil?.criadoEm)}
                disabled
                readOnly
              />
            </div>

            <div className="campo">
              <label htmlFor="config-username">Nome de usuário *</label>
              <input
                id="config-username"
                value={dados.username}
                onChange={(e) =>
                  setDados((d) => ({ ...d, username: e.target.value }))
                }
                autoComplete="username"
              />
              {errosDados.username && (
                <span className="erro">{errosDados.username}</span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="config-nome">Nome</label>
              <input
                id="config-nome"
                value={dados.nome}
                onChange={(e) =>
                  setDados((d) => ({ ...d, nome: e.target.value }))
                }
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="acoes">
            <button
              type="submit"
              className="btn btn-primario"
              disabled={salvandoDados}
            >
              {salvandoDados ? 'Salvando...' : 'Salvar dados'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <form className="form" onSubmit={handleSalvarSenha}>
          <h3 className="detalhes-secao-titulo">Alterar senha</h3>
          <div className="grid">
            <div className="campo campo-largo">
              <label htmlFor="config-senha-atual">Senha atual *</label>
              <input
                id="config-senha-atual"
                type="password"
                value={senha.senhaAtual}
                onChange={(e) =>
                  setSenha((s) => ({ ...s, senhaAtual: e.target.value }))
                }
                autoComplete="current-password"
              />
              {errosSenha.senhaAtual && (
                <span className="erro">{errosSenha.senhaAtual}</span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="config-nova-senha">Nova senha *</label>
              <input
                id="config-nova-senha"
                type="password"
                value={senha.novaSenha}
                onChange={(e) =>
                  setSenha((s) => ({ ...s, novaSenha: e.target.value }))
                }
                autoComplete="new-password"
              />
              {errosSenha.novaSenha && (
                <span className="erro">{errosSenha.novaSenha}</span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="config-confirmar-senha">
                Confirmar nova senha *
              </label>
              <input
                id="config-confirmar-senha"
                type="password"
                value={senha.confirmarSenha}
                onChange={(e) =>
                  setSenha((s) => ({ ...s, confirmarSenha: e.target.value }))
                }
                autoComplete="new-password"
              />
              {errosSenha.confirmarSenha && (
                <span className="erro">{errosSenha.confirmarSenha}</span>
              )}
            </div>
          </div>

          <div className="acoes">
            <button
              type="submit"
              className="btn btn-primario"
              disabled={salvandoSenha}
            >
              {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </div>

      {ehAdmin && (
        <div className="card">
          <div className="form-cabecalho">
            <h3 className="detalhes-secao-titulo">Contas de usuário</h3>
            <div className="form-cabecalho-acoes">
              <button
                type="button"
                className="btn btn-primario"
                onClick={abrirCriarUsuario}
              >
                + Nova conta
              </button>
            </div>
          </div>
          <p className="campo-ajuda">
            Crie, edite e exclua as contas de acesso ao sistema. Todas compartilham
            os mesmos dados; a permissão define o que cada uma pode fazer. Você não
            pode alterar a própria permissão nem excluir a própria conta.
          </p>
          {usuarios.length === 0 ? (
            <p className="vazio">Nenhuma conta para gerenciar.</p>
          ) : (
            <div className="tabela-wrapper">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Nome</th>
                    <th>Permissão</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosPagina.map((u) => (
                    <tr key={u.id}>
                      <td>
                        {u.username}
                        {u.proprio && (
                          <span className="tag-proprio"> (você)</span>
                        )}
                      </td>
                      <td>{u.nome || '—'}</td>
                      <td>{rotularPermissaoId(u.permissaoId)}</td>
                      <td className="acoes-tabela">
                        <button
                          type="button"
                          className="btn btn-secundario btn-pequeno"
                          onClick={() => abrirEditarUsuario(u)}
                        >
                          Editar
                        </button>
                        {!u.proprio && (
                          <button
                            type="button"
                            className="btn btn-perigo btn-pequeno"
                            onClick={() => setUsuarioParaExcluir(u)}
                            disabled={excluindoId === u.id}
                          >
                            {excluindoId === u.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Paginacao
                paginaAtual={paginaUsuarios}
                totalPaginas={totalPaginasUsuarios}
                total={totalUsuarios}
                inicio={inicioUsuarios}
                fim={fimUsuarios}
                onMudar={setPaginaUsuarios}
              />
            </div>
          )}
        </div>
      )}

      <ModalConfirmacao
        aberto={!!usuarioParaExcluir}
        titulo="Excluir usuário"
        mensagem={
          usuarioParaExcluir
            ? `Excluir o usuário "${usuarioParaExcluir.username}"? Todos os registros criados por ele também serão removidos. Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar="Excluir"
        perigo
        onConfirmar={confirmarExclusaoUsuario}
        onCancelar={() => {
          if (excluindoId) return;
          setUsuarioParaExcluir(null);
        }}
      />

      {modalUsuario && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-usuario-titulo"
          onClick={fecharModalUsuario}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="modal-usuario-titulo" className="modal-titulo">
              {modalUsuario.modo === 'criar' ? 'Nova conta' : 'Editar conta'}
            </h3>
            <div className="grid">
              <div className="campo">
                <label htmlFor="modal-usuario-username">Nome de usuário *</label>
                <input
                  id="modal-usuario-username"
                  value={formUsuario.username}
                  onChange={(e) =>
                    setFormUsuario((f) => ({ ...f, username: e.target.value }))
                  }
                  autoComplete="off"
                />
                {errosUsuario.username && (
                  <span className="erro">{errosUsuario.username}</span>
                )}
              </div>
              <div className="campo">
                <label htmlFor="modal-usuario-nome">Nome</label>
                <input
                  id="modal-usuario-nome"
                  value={formUsuario.nome}
                  onChange={(e) =>
                    setFormUsuario((f) => ({ ...f, nome: e.target.value }))
                  }
                  placeholder="Nome da pessoa"
                  autoComplete="off"
                />
              </div>
              <div className="campo">
                <label htmlFor="modal-usuario-permissao">Permissão *</label>
                <select
                  id="modal-usuario-permissao"
                  value={formUsuario.permissaoId}
                  disabled={modalUsuario.proprio}
                  onChange={(e) =>
                    setFormUsuario((f) => ({ ...f, permissaoId: e.target.value }))
                  }
                >
                  {PERMISSOES_DISPONIVEIS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {modalUsuario.proprio && (
                  <span className="campo-ajuda">
                    Você não pode alterar a sua própria permissão.
                  </span>
                )}
              </div>
              <div className="campo">
                <label htmlFor="modal-usuario-senha">
                  {modalUsuario.modo === 'criar'
                    ? 'Senha *'
                    : 'Nova senha (opcional)'}
                </label>
                <input
                  id="modal-usuario-senha"
                  type="password"
                  value={formUsuario.senha}
                  onChange={(e) =>
                    setFormUsuario((f) => ({ ...f, senha: e.target.value }))
                  }
                  placeholder={
                    modalUsuario.modo === 'criar'
                      ? 'Senha de acesso'
                      : 'Deixe em branco para manter'
                  }
                  autoComplete="new-password"
                />
                {errosUsuario.senha && (
                  <span className="erro">{errosUsuario.senha}</span>
                )}
              </div>
            </div>
            <div className="modal-acoes">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={fecharModalUsuario}
                disabled={salvandoUsuario}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primario"
                onClick={salvarUsuario}
                disabled={salvandoUsuario}
              >
                {salvandoUsuario
                  ? 'Salvando...'
                  : modalUsuario.modo === 'criar'
                    ? 'Criar conta'
                    : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
