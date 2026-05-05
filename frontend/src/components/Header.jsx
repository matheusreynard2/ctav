import { useEffect, useRef, useState } from 'react';

const ITENS_MENU = [
  { id: 'inicio', label: 'Início' },
  { id: 'cadastro', label: 'Cadastrar Paciente' },
  { id: 'pacientes', label: 'Pacientes' },
];

export default function Header({ pagina, onNavegar }) {
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef(null);
  const botaoRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;

    const handleClickFora = (e) => {
      if (
        !menuRef.current?.contains(e.target) &&
        !botaoRef.current?.contains(e.target)
      ) {
        setAberto(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') setAberto(false);
    };

    document.addEventListener('mousedown', handleClickFora);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [aberto]);

  const ir = (id) => {
    onNavegar(id);
    setAberto(false);
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
          onClick={() => setAberto((a) => !a)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {aberto && (
          <nav ref={menuRef} className="menu" role="menu">
            {ITENS_MENU.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className={`menu-item ${pagina === item.id ? 'ativo' : ''}`}
                onClick={() => ir(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
