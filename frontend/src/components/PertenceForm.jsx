import { useEffect, useMemo, useRef, useState } from 'react';
import { pertenceService } from '../api';

const FOTO_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png';
const FOTO_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png'];
const FOTO_TAMANHO_MAX = 10 * 1024 * 1024; // 10 MB (espelha o backend)

const extrairErro = (err, padrao) => {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (data?.fields) {
    return Object.entries(data.fields)
      .map(([campo, msg]) => `${campo}: ${msg}`)
      .join(' | ');
  }
  if (!err?.response && err?.message) return err.message;
  return padrao;
};

const gerarLocalId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const validarArquivoFoto = (file) => {
  if (!FOTO_TIPOS_PERMITIDOS.includes(file.type)) {
    return 'A foto deve ser uma imagem JPG ou PNG.';
  }
  if (file.size > FOTO_TAMANHO_MAX) {
    return 'A imagem excede o limite de 10 MB.';
  }
  return null;
};

export default function PertenceForm({
  pertenceEditando,
  acolhidosDisponiveis = [],
  onSalvar,
  onCancelar,
  onVerLista,
  onMensagem,
  salvando,
}) {
  const editando = Boolean(pertenceEditando);

  const [acolhidoId, setAcolhidoId] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [item, setItem] = useState('');
  const [erros, setErros] = useState({});

  // Fotos: no cadastro novo ficam pendentes (arquivos em memória); na edição são
  // gerenciadas ao vivo (o pertence já existe).
  const [fotosPendentes, setFotosPendentes] = useState([]);
  const [fotosExistentes, setFotosExistentes] = useState([]);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const fotosPendentesRef = useRef([]);

  useEffect(() => {
    fotosPendentesRef.current = fotosPendentes;
  }, [fotosPendentes]);

  useEffect(
    () => () => {
      fotosPendentesRef.current.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    },
    []
  );

  useEffect(() => {
    if (pertenceEditando) {
      setAcolhidoId(
        pertenceEditando.acolhidoId != null ? String(pertenceEditando.acolhidoId) : ''
      );
      setQuantidade(String(pertenceEditando.quantidade ?? 1));
      setItem(pertenceEditando.item ?? '');
      setFotosExistentes(
        Array.isArray(pertenceEditando.fotos) ? pertenceEditando.fotos : []
      );
    } else {
      setAcolhidoId('');
      setQuantidade('1');
      setItem('');
      setFotosExistentes([]);
    }
    // Limpa fotos pendentes ao trocar de registro.
    fotosPendentesRef.current.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    setFotosPendentes([]);
    setErros({});
  }, [pertenceEditando]);

  const acolhidosOrdenados = useMemo(
    () =>
      [...acolhidosDisponiveis].sort((a, b) =>
        String(a.nome ?? '').localeCompare(String(b.nome ?? ''))
      ),
    [acolhidosDisponiveis]
  );

  const recarregarFotos = async () => {
    if (!editando || !pertenceEditando?.acolhidoId) return;
    try {
      const lista = await pertenceService.listar(pertenceEditando.acolhidoId);
      const atual = (Array.isArray(lista) ? lista : []).find(
        (p) => p.id === pertenceEditando.id
      );
      setFotosExistentes(Array.isArray(atual?.fotos) ? atual.fotos : []);
    } catch {
      /* mantém as fotos atuais em caso de falha */
    }
  };

  const handleSelecionarFotoPendente = (fileList) => {
    const files = Array.from(fileList || []);
    const novas = [];
    for (const file of files) {
      const erroArquivo = validarArquivoFoto(file);
      if (erroArquivo) {
        onMensagem?.('erro', erroArquivo);
        continue;
      }
      novas.push({
        localId: gerarLocalId(),
        file,
        nomeArquivo: file.name,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (novas.length > 0) setFotosPendentes((atual) => [...atual, ...novas]);
  };

  const removerFotoPendente = (localId) => {
    setFotosPendentes((atual) => {
      const alvo = atual.find((f) => f.localId === localId);
      if (alvo?.previewUrl) URL.revokeObjectURL(alvo.previewUrl);
      return atual.filter((f) => f.localId !== localId);
    });
  };

  const handleSelecionarFotoAoVivo = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setEnviandoFoto(true);
    try {
      for (const file of files) {
        const erroArquivo = validarArquivoFoto(file);
        if (erroArquivo) {
          onMensagem?.('erro', erroArquivo);
          continue;
        }
        await pertenceService.adicionarFoto(
          pertenceEditando.acolhidoId,
          pertenceEditando.id,
          file
        );
      }
      await recarregarFotos();
    } catch (err) {
      onMensagem?.('erro', extrairErro(err, 'Erro ao enviar a foto.'));
    } finally {
      setEnviandoFoto(false);
    }
  };

  const removerFotoAoVivo = async (fotoId) => {
    setEnviandoFoto(true);
    try {
      await pertenceService.deletarFoto(
        pertenceEditando.acolhidoId,
        pertenceEditando.id,
        fotoId
      );
      await recarregarFotos();
    } catch (err) {
      onMensagem?.('erro', extrairErro(err, 'Erro ao excluir a foto.'));
    } finally {
      setEnviandoFoto(false);
    }
  };

  const validar = () => {
    const novosErros = {};
    if (!acolhidoId) novosErros.acolhidoId = 'Selecione o acolhido.';
    const qtd = parseInt(quantidade, 10);
    if (!Number.isFinite(qtd) || qtd < 1) {
      novosErros.quantidade = 'Informe uma quantidade de pelo menos 1.';
    }
    if (!item.trim()) novosErros.item = 'Informe o item.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    const payload = {
      acolhidoId: Number(acolhidoId),
      quantidade: parseInt(quantidade, 10),
      item: item.trim(),
    };
    await onSalvar(payload, editando ? [] : fotosPendentes);
  };

  const fotosParaExibir = editando
    ? fotosExistentes.map((f) => ({ chave: f.id, src: f.url, nome: f.nomeArquivo, aoVivo: true }))
    : fotosPendentes.map((f) => ({
        chave: f.localId,
        src: f.previewUrl,
        nome: f.nomeArquivo,
        aoVivo: false,
      }));

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-cabecalho">
        <h2>{editando ? 'Editar pertence' : 'Cadastrar pertence'}</h2>
        <div className="form-cabecalho-acoes">
          <button
            type="button"
            className="btn btn-secundario btn-novo"
            onClick={onVerLista}
            title="Ver lista de pertences"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Ver lista
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="campo campo-largo">
          <label htmlFor="pertence-acolhido">Acolhido *</label>
          <select
            id="pertence-acolhido"
            value={acolhidoId}
            onChange={(e) => setAcolhidoId(e.target.value)}
            disabled={editando}
          >
            <option value="">Selecione o acolhido...</option>
            {acolhidosOrdenados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
                {a.cpf ? ` — CPF ${a.cpf}` : ''}
              </option>
            ))}
          </select>
          {acolhidosOrdenados.length === 0 && (
            <span className="campo-ajuda">
              Nenhum acolhido cadastrado. Cadastre um acolhido antes de registrar um
              pertence.
            </span>
          )}
          {editando && (
            <span className="campo-ajuda">
              O acolhido de um pertence não pode ser alterado. Para mudar, exclua e
              cadastre novamente.
            </span>
          )}
          {erros.acolhidoId && <span className="erro">{erros.acolhidoId}</span>}
        </div>

        <div className="campo">
          <label htmlFor="pertence-quantidade">Quantidade *</label>
          <input
            id="pertence-quantidade"
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          {erros.quantidade && <span className="erro">{erros.quantidade}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="pertence-item">Item *</label>
          <input
            id="pertence-item"
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Ex.: Camiseta, Celular, Documento..."
            maxLength={200}
          />
          {erros.item && <span className="erro">{erros.item}</span>}
        </div>

        <div className="campo campo-largo">
          <label>Fotos (JPG ou PNG)</label>
          <span className="campo-ajuda">
            {editando
              ? 'As fotos são salvas na hora.'
              : 'As fotos são enviadas após o cadastro do pertence.'}
          </span>
          <div className="pertence-fotos">
            {fotosParaExibir.map((f) => (
              <div key={f.chave} className="pertence-foto">
                {f.src ? (
                  <img src={f.src} alt={f.nome || 'Foto do pertence'} />
                ) : (
                  <span className="pertence-foto-vazia">IMG</span>
                )}
                <button
                  type="button"
                  className="pertence-foto-remover"
                  onClick={() =>
                    f.aoVivo ? removerFotoAoVivo(f.chave) : removerFotoPendente(f.chave)
                  }
                  disabled={enviandoFoto}
                  title="Remover foto"
                  aria-label="Remover foto"
                >
                  ×
                </button>
              </div>
            ))}

            <label className={`pertence-foto-add ${enviandoFoto ? 'enviando' : ''}`}>
              {enviandoFoto ? (
                <span className="pertence-foto-spinner" aria-hidden="true" />
              ) : (
                <>
                  <span className="pertence-foto-add-icone">+</span>
                  <span className="pertence-foto-add-texto">Foto</span>
                </>
              )}
              <input
                type="file"
                accept={FOTO_ACCEPT}
                multiple
                hidden
                disabled={enviandoFoto}
                onChange={(e) => {
                  if (editando) handleSelecionarFotoAoVivo(e.target.files);
                  else handleSelecionarFotoPendente(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="acoes">
        <button type="submit" className="btn btn-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Cadastrar'}
        </button>
        {editando && (
          <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
