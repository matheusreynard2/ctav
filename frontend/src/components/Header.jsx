import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.jsx';

// Ícones (linha, 24x24) dos itens de topo do menu — mesmo estilo dos atalhos da
// página inicial. As ramificações (submenus) não recebem ícone.
const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const ICONES = {
  inicio: (
    <svg {...svgProps}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  listas: (
    <svg {...svgProps}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  cadastros: (
    <svg {...svgProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  medicamentos: (
    <svg {...svgProps}>
      <path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  ),
  historico: (
    <svg {...svgProps}>
      <path d="M3 8a9 9 0 1 0 2.6-4.4L3 6" />
      <path d="M3 3v3h3" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  relatorios: (
    <svg {...svgProps}>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" rx="0.5" />
      <rect x="12" y="8" width="3" height="10" rx="0.5" />
      <rect x="17" y="5" width="3" height="13" rx="0.5" />
    </svg>
  ),
  documentos: (
    <svg {...svgProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  consultas: (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  ),
};

const ITENS_MENU = [
  { id: 'inicio', label: 'Início', icone: ICONES.inicio },
  {
    id: 'grupo-listas',
    label: 'Listas',
    icone: ICONES.listas,
    filhos: [
      { id: 'acolhidos', label: 'Lista de acolhidos' },
      { id: 'motivos-adesao', label: 'Lista de adesões' },
      { id: 'motivos-desistencia', label: 'Lista de desistências' },
      { id: 'medicamentos', label: 'Lista de medicamentos' },
      { id: 'combinados', label: 'Lista de combinados' },
      { id: 'consultas', label: 'Lista de consultas' },
      { id: 'ocorrencias', label: 'Lista de ocorrências' },
      { id: 'pertences', label: 'Lista de pertences' },
      { id: 'responsaveis', label: 'Lista de responsáveis' },
    ],
  },
  {
    id: 'grupo-cadastros',
    label: 'Cadastros',
    icone: ICONES.cadastros,
    filhos: [
      { id: 'cadastro-acolhido', label: 'Cadastrar acolhido' },
      { id: 'cadastro-motivo-adesao', label: 'Cadastrar motivo de adesão' },
      { id: 'cadastro-motivo-desistencia', label: 'Cadastrar motivo de desistência' },
      { id: 'cadastro-medicamento', label: 'Cadastrar medicamento' },
      { id: 'cadastro-combinado', label: 'Cadastrar combinado' },
      { id: 'cadastro-consulta', label: 'Agendar consulta' },
      { id: 'cadastro-ocorrencia', label: 'Cadastrar ocorrência' },
      { id: 'cadastro-pertence', label: 'Cadastrar pertence' },
      { id: 'cadastro-responsavel', label: 'Cadastrar responsável' },
    ],
  },
  {
    id: 'grupo-medicamentos',
    label: 'Medicamentos',
    icone: ICONES.medicamentos,
    filhos: [
      { id: 'gestao-medicacao', label: 'Controle total (por acolhido)' },
      { id: 'controle-medicamentos', label: 'Controle de administração' },
    ],
  },
  {
    id: 'grupo-historico',
    label: 'Histórico',
    icone: ICONES.historico,
    filhos: [
      { id: 'historico', label: 'Arquivo morto' },
      { id: 'cadastro-historico', label: 'Cadastrar' },
    ],
  },
  { id: 'relatorios', label: 'Relatórios', icone: ICONES.relatorios },
  { id: 'documentos', label: 'Documentos', icone: ICONES.documentos },
];

// Itens de menu visíveis para perfis sem acesso total (psicólogo/advogado):
// somente a página inicial e a de relatórios.
const ITENS_MENU_NAO_ADMIN = [
  { id: 'inicio', label: 'Início', icone: ICONES.inicio },
  { id: 'relatorios', label: 'Relatórios', icone: ICONES.relatorios },
];

// Grupo de agendamento de consultas, liberado tambem para o psicologo (2).
const GRUPO_CONSULTAS = {
  id: 'grupo-consultas',
  label: 'Consultas',
  icone: ICONES.consultas,
  filhos: [
    { id: 'consultas', label: 'Lista de consultas' },
    { id: 'cadastro-consulta', label: 'Agendar consulta' },
  ],
};

// Monta os itens de menu conforme a permissao do usuario.
const montarItensMenu = (ehAdmin, permissaoId) => {
  if (ehAdmin) return ITENS_MENU;
  if (permissaoId === 2) {
    return [ITENS_MENU_NAO_ADMIN[0], GRUPO_CONSULTAS, ITENS_MENU_NAO_ADMIN[1]];
  }
  return ITENS_MENU_NAO_ADMIN;
};

const FECHAR_DELAY_MS = 180;

// Rótulos amigáveis das permissões (o backend guarda em minúsculas/sem acento).
const ROTULO_PERMISSAO = {
  administrador: 'Administrador',
  psicologo: 'Psicólogo',
  advogado: 'Advogado',
  financeiro: 'Financeiro',
};

const rotularPermissao = (permissao) =>
  ROTULO_PERMISSAO[permissao] || (permissao ? permissao : '—');

export default function Header({
  pagina,
  onNavegar,
  usuario,
  onLogout,
  ehAdmin = true,
  permissaoId = 1,
}) {
  const itensMenu = montarItensMenu(ehAdmin, permissaoId);
  const [aberto, setAberto] = useState(false);
  const [submenuAberto, setSubmenuAberto] = useState(null);
  const menuRef = useRef(null);
  const botaoRef = useRef(null);
  const menuDesktopRef = useRef(null);
  const fecharSubmenuTimeout = useRef(null);

  useEffect(() => {
    if (!aberto) return;

    const handleClickFora = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !botaoRef.current?.contains(e.target)
      ) {
        setAberto(false);
        setSubmenuAberto(null);
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setAberto(false);
        setSubmenuAberto(null);
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [aberto]);

  useEffect(() => {
    return () => {
      if (fecharSubmenuTimeout.current) {
        clearTimeout(fecharSubmenuTimeout.current);
      }
    };
  }, []);

  // Fecha o submenu do menu horizontal (desktop) ao clicar fora dele.
  useEffect(() => {
    if (aberto || !submenuAberto) return undefined;
    const handleClickFora = (e) => {
      if (!menuDesktopRef.current?.contains(e.target)) {
        setSubmenuAberto(null);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aberto, submenuAberto]);

  const ir = (id) => {
    onNavegar(id);
    setAberto(false);
    setSubmenuAberto(null);
  };

  const abrirSubmenu = (id) => {
    if (fecharSubmenuTimeout.current) {
      clearTimeout(fecharSubmenuTimeout.current);
      fecharSubmenuTimeout.current = null;
    }
    setSubmenuAberto(id);
  };

  const agendarFechamentoSubmenu = () => {
    if (fecharSubmenuTimeout.current) {
      clearTimeout(fecharSubmenuTimeout.current);
    }
    fecharSubmenuTimeout.current = setTimeout(() => {
      setSubmenuAberto(null);
    }, FECHAR_DELAY_MS);
  };

  const itemAtivo = (item) => {
    if (item.filhos) {
      return item.filhos.some((f) => f.id === pagina);
    }
    return item.id === pagina;
  };

  return (
    <>
    <header className="topo">
      <div className="container topo-conteudo">
        <div className="topo-titulo">
          <span className="topo-logo" aria-hidden="true">
            <Logo className="topo-logo-img" />
          </span>
          <h1>
            <span className="topo-titulo-extenso">Comunidade Terapêutica Águas Vivas</span>
          </h1>
        </div>

        {usuario && (
          <div className="topo-usuario">
            <span className="topo-usuario-nome">
              Nome: {usuario.nome?.trim() || usuario.username}
              {usuario.permissao && (
                <>
                  {' '}
                  <span className="topo-usuario-sep">|</span> Permissão:{' '}
                  <span className="topo-usuario-permissao">
                    {rotularPermissao(usuario.permissao)}
                  </span>
                </>
              )}
            </span>
            <button
              type="button"
              className={`btn-config ${pagina === 'configuracoes' ? 'ativo' : ''}`}
              onClick={() => ir('configuracoes')}
              title="Configurações do usuário"
              aria-label="Configurações do usuário"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              type="button"
              className="btn-sair"
              onClick={onLogout}
              title="Sair"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair
            </button>
          </div>
        )}

        <button
          ref={botaoRef}
          type="button"
          className={`hamburger ${aberto ? 'aberto' : ''}`}
          onClick={() => {
            setAberto((a) => !a);
            setSubmenuAberto(null);
          }}
          aria-label="Abrir menu"
          aria-expanded={aberto}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {aberto && (
          <nav ref={menuRef} className="menu" role="menu">
            {itensMenu.map((item) =>
              item.filhos ? (
                <div
                  key={item.id}
                  className="menu-grupo"
                  onMouseEnter={() => abrirSubmenu(item.id)}
                  onMouseLeave={agendarFechamentoSubmenu}
                >
                  <button
                    type="button"
                    role="menuitem"
                    aria-haspopup="menu"
                    aria-expanded={submenuAberto === item.id}
                    className={`menu-item menu-item-com-filhos ${itemAtivo(item) ? 'ativo' : ''}`}
                    onClick={() =>
                      setSubmenuAberto((atual) => (atual === item.id ? null : item.id))
                    }
                  >
                    <span className="menu-item-rotulo">
                      {item.icone && (
                        <span className="menu-item-icone" aria-hidden="true">
                          {item.icone}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </span>
                    <span className="menu-seta" aria-hidden="true">▸</span>
                  </button>

                  {submenuAberto === item.id && (
                    <div
                      className="submenu"
                      role="menu"
                      onMouseEnter={() => abrirSubmenu(item.id)}
                      onMouseLeave={agendarFechamentoSubmenu}
                    >
                      {item.filhos.map((filho) => (
                        <button
                          key={filho.id}
                          type="button"
                          role="menuitem"
                          className={`menu-item ${pagina === filho.id ? 'ativo' : ''}`}
                          onClick={() => ir(filho.id)}
                        >
                          {filho.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`menu-item ${item.icone ? 'menu-item-topo' : ''} ${itemAtivo(item) ? 'ativo' : ''}`}
                  onClick={() => ir(item.id)}
                  onMouseEnter={() => setSubmenuAberto(null)}
                >
                  {item.icone && (
                    <span className="menu-item-icone" aria-hidden="true">
                      {item.icone}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              )
            )}
          </nav>
        )}
      </div>
    </header>

    <nav className="menu-desktop" aria-label="Menu principal" ref={menuDesktopRef}>
      <div className="container menu-desktop-conteudo">
        {itensMenu.map((item) =>
          item.filhos ? (
            <div
              key={item.id}
              className="menu-desktop-grupo"
              onMouseEnter={() => abrirSubmenu(item.id)}
              onMouseLeave={agendarFechamentoSubmenu}
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={submenuAberto === item.id}
                className={`menu-desktop-item ${itemAtivo(item) ? 'ativo' : ''}`}
                onClick={() =>
                  setSubmenuAberto((atual) => (atual === item.id ? null : item.id))
                }
              >
                {item.icone && (
                  <span className="menu-item-icone" aria-hidden="true">
                    {item.icone}
                  </span>
                )}
                <span>{item.label}</span>
                <span className="menu-desktop-seta" aria-hidden="true">▾</span>
              </button>

              {submenuAberto === item.id && (
                <div
                  className="menu-desktop-submenu"
                  role="menu"
                  onMouseEnter={() => abrirSubmenu(item.id)}
                  onMouseLeave={agendarFechamentoSubmenu}
                >
                  {item.filhos.map((filho) => (
                    <button
                      key={filho.id}
                      type="button"
                      role="menuitem"
                      className={`menu-item ${pagina === filho.id ? 'ativo' : ''}`}
                      onClick={() => ir(filho.id)}
                    >
                      {filho.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              key={item.id}
              type="button"
              className={`menu-desktop-item ${itemAtivo(item) ? 'ativo' : ''}`}
              onClick={() => ir(item.id)}
              onMouseEnter={() => setSubmenuAberto(null)}
            >
              {item.icone && (
                <span className="menu-item-icone" aria-hidden="true">
                  {item.icone}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          )
        )}
      </div>
    </nav>
    </>
  );
}
