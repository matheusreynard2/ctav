import { useEffect, useRef, useState } from 'react';

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
    id: 'grupo-remedios',
    label: 'Remédios',
    filhos: [
      { id: 'remedios', label: 'Lista de remédios' },
      { id: 'cadastro-remedio', label: 'Cadastrar remédio' },
    ],
  },
];

const FECHAR_DELAY_MS = 180;

export default function Header({ pagina, onNavegar }) {
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
          <h1>
            C T A V
            <span className="topo-titulo-extenso">Comunidade Terapêutica Águas Vivas</span>
          </h1>
        </div>

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
