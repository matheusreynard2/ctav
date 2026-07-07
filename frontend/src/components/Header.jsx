import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.jsx';

const ITENS_MENU = [
  { id: 'inicio', label: 'Início' },
  {
    id: 'grupo-acolhidos',
    label: 'Acolhidos',
    filhos: [
      { id: 'acolhidos', label: 'Lista de acolhidos' },
      { id: 'cadastro-acolhido', label: 'Cadastrar acolhido' },
    ],
  },
  {
    id: 'grupo-motivos',
    label: 'Motivos',
    filhos: [
      { id: 'motivos-adesao', label: 'Lista de adesões' },
      { id: 'cadastro-motivo-adesao', label: 'Cadastrar motivo de adesão' },
      { id: 'motivos-desistencia', label: 'Lista de desistências' },
      { id: 'cadastro-motivo-desistencia', label: 'Cadastrar motivo de desistência' },
    ],
  },
  {
    id: 'grupo-historico',
    label: 'Histórico',
    filhos: [
      { id: 'historico', label: 'Arquivo morto' },
      { id: 'cadastro-historico', label: 'Cadastrar' },
    ],
  },
  {
    id: 'grupo-medicamentos',
    label: 'Medicamentos',
    filhos: [
      { id: 'medicamentos', label: 'Lista de medicamentos' },
      { id: 'cadastro-medicamento', label: 'Cadastrar medicamento' },
      { id: 'controle-medicamentos', label: 'Controle de administração' },
    ],
  },
  {
    id: 'grupo-combinados',
    label: 'Combinados',
    filhos: [
      { id: 'combinados', label: 'Lista de combinados' },
      { id: 'cadastro-combinado', label: 'Cadastrar combinado' },
    ],
  },
  { id: 'relatorios', label: 'Relatórios' },
];

const FECHAR_DELAY_MS = 180;

export default function Header({ pagina, onNavegar, usuario, onLogout }) {
  const [aberto, setAberto] = useState(false);
  const [submenuAberto, setSubmenuAberto] = useState(null);
  const menuRef = useRef(null);
  const botaoRef = useRef(null);
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
              {usuario.nome?.trim() || usuario.username}
            </span>
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
            {ITENS_MENU.map((item) =>
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
                    <span>{item.label}</span>
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
                  className={`menu-item ${itemAtivo(item) ? 'ativo' : ''}`}
                  onClick={() => ir(item.id)}
                  onMouseEnter={() => setSubmenuAberto(null)}
                >
                  {item.label}
                </button>
              )
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
