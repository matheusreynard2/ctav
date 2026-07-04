export default function InputArquivoCustomizado({
  id,
  inputRef,
  accept,
  onChange,
  disabled = false,
  nomeArquivoSelecionado = '',
  textoBotao = 'Selecionar arquivo',
  textoVazio = 'Nenhum arquivo selecionado',
}) {
  const handleAbrir = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className="arquivo-upload-custom">
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        disabled={disabled}
        className="arquivo-upload-input-oculto"
        tabIndex={-1}
      />
      <div className="arquivo-upload-linha">
        <button
          type="button"
          className="btn btn-secundario arquivo-upload-btn"
          onClick={handleAbrir}
          disabled={disabled}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {textoBotao}
        </button>
        <span
          className={`arquivo-upload-nome ${
            !nomeArquivoSelecionado ? 'arquivo-upload-nome-vazio' : ''
          }`}
          title={nomeArquivoSelecionado || textoVazio}
        >
          {nomeArquivoSelecionado || textoVazio}
        </span>
      </div>
    </div>
  );
}
