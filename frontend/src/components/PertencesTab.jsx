import { useEffect, useRef, useState } from 'react';
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

const IconeLixeira = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

/**
 * Editor de pertences do acolhido, usado na aba "Pertences" do formulário.
 *
 * - Modo pendente (sem acolhidoId, cadastro novo): mantém a lista em memória
 *   (controlada pelo pai via `pendentes`/`onChangePendentes`). Os pertences e
 *   suas fotos são criados após o cadastro do acolhido.
 * - Modo ao vivo (com acolhidoId, edição): CRUD completo direto na API, tanto
 *   dos pertences quanto de suas fotos (PNG/JPG).
 */
export default function PertencesTab({
  acolhidoId = null,
  pendentes = [],
  onChangePendentes,
  onMensagem,
  onPertencesAlterados,
}) {
  const aoVivo = acolhidoId != null;

  const [novoQtd, setNovoQtd] = useState('1');
  const [novoItem, setNovoItem] = useState('');
  const [erro, setErro] = useState('');

  // Modo ao vivo
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFotoId, setEnviandoFotoId] = useState(null);

  const pendentesRef = useRef(pendentes);
  useEffect(() => {
    pendentesRef.current = pendentes;
  }, [pendentes]);

  // Revoga as URLs de pré-visualização das fotos pendentes ao desmontar.
  useEffect(
    () => () => {
      if (!aoVivo) {
        pendentesRef.current.forEach((p) =>
          (p.fotos || []).forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl))
        );
      }
    },
    [aoVivo]
  );

  const carregar = async () => {
    if (!aoVivo) return;
    setCarregando(true);
    try {
      const dados = await pertenceService.listar(acolhidoId);
      setItens(Array.isArray(dados) ? dados : []);
    } catch (err) {
      onMensagem?.('erro', extrairErro(err, 'Erro ao carregar os pertences.'));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!aoVivo) return;
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acolhidoId]);

  const validarNovo = () => {
    const qtd = parseInt(novoQtd, 10);
    if (!Number.isFinite(qtd) || qtd < 1) {
      setErro('Informe uma quantidade de pelo menos 1.');
      return null;
    }
    const item = novoItem.trim();
    if (item.length < 1) {
      setErro('Informe a descrição do item.');
      return null;
    }
    setErro('');
    return { quantidade: qtd, item };
  };

  const limparNovo = () => {
    setNovoQtd('1');
    setNovoItem('');
  };

  const handleAdicionar = async () => {
    const dados = validarNovo();
    if (!dados) return;

    if (aoVivo) {
      setSalvando(true);
      try {
        await pertenceService.criar(acolhidoId, dados);
        limparNovo();
        await carregar();
        onPertencesAlterados?.();
      } catch (err) {
        onMensagem?.('erro', extrairErro(err, 'Erro ao adicionar o pertence.'));
      } finally {
        setSalvando(false);
      }
      return;
    }

    onChangePendentes?.([
      ...pendentes,
      { localId: gerarLocalId(), quantidade: dados.quantidade, item: dados.item, fotos: [] },
    ]);
    limparNovo();
  };

  // ===== Modo ao vivo: edição/exclusão de pertences =====

  const atualizarCampoLocal = (id, campo, valor) => {
    setItens((atual) =>
      atual.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  const salvarPertence = async (p) => {
    const qtd = parseInt(p.quantidade, 10);
    if (!Number.isFinite(qtd) || qtd < 1) {
      onMensagem?.('erro', 'A quantidade deve ser de pelo menos 1.');
      return;
    }
    const item = String(p.item || '').trim();
    if (!item) {
      onMensagem?.('erro', 'Informe a descrição do item.');
      return;
    }
    setSalvando(true);
    try {
      await pertenceService.atualizar(acolhidoId, p.id, { quantidade: qtd, item });
      onMensagem?.('sucesso', 'Pertence atualizado.');
      await carregar();
      onPertencesAlterados?.();
    } catch (err) {
      onMensagem?.('erro', extrairErro(err, 'Erro ao atualizar o pertence.'));
    } finally {
      setSalvando(false);
    }
  };

  const excluirPertence = async (id) => {
    setSalvando(true);
    try {
      await pertenceService.deletar(acolhidoId, id);
      await carregar();
      onPertencesAlterados?.();
    } catch (err) {
      onMensagem?.('erro', extrairErro(err, 'Erro ao excluir o pertence.'));
    } finally {
      setSalvando(false);
    }
  };

  const handleSelecionarFotoAoVivo = async (pertenceId, fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setEnviandoFotoId(pertenceId);
    try {
      for (const file of files) {
        const erroArquivo = validarArquivoFoto(file);
        if (erroArquivo) {
          onMensagem?.('erro', erroArquivo);
          continue;
        }
        await pertenceService.adicionarFoto(acolhidoId, pertenceId, file);
      }
      await carregar();
      onPertencesAlterados?.();
    } catch (err) {
      onMensagem?.('erro', extrairErro(err, 'Erro ao enviar a foto.'));
    } finally {
      setEnviandoFotoId(null);
    }
  };

  const excluirFotoAoVivo = async (pertenceId, fotoId) => {
    setSalvando(true);
    try {
      await pertenceService.deletarFoto(acolhidoId, pertenceId, fotoId);
      await carregar();
      onPertencesAlterados?.();
    } catch (err) {
      onMensagem?.('erro', extrairErro(err, 'Erro ao excluir a foto.'));
    } finally {
      setSalvando(false);
    }
  };

  // ===== Modo pendente: edição/exclusão em memória =====

  const atualizarPendente = (localId, campo, valor) => {
    onChangePendentes?.(
      pendentes.map((p) => (p.localId === localId ? { ...p, [campo]: valor } : p))
    );
  };

  const excluirPendente = (localId) => {
    const alvo = pendentes.find((p) => p.localId === localId);
    (alvo?.fotos || []).forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    onChangePendentes?.(pendentes.filter((p) => p.localId !== localId));
  };

  const handleSelecionarFotoPendente = (localId, fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const novasFotos = [];
    for (const file of files) {
      const erroArquivo = validarArquivoFoto(file);
      if (erroArquivo) {
        onMensagem?.('erro', erroArquivo);
        continue;
      }
      novasFotos.push({
        localId: gerarLocalId(),
        file,
        nomeArquivo: file.name,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (novasFotos.length === 0) return;
    onChangePendentes?.(
      pendentes.map((p) =>
        p.localId === localId ? { ...p, fotos: [...(p.fotos || []), ...novasFotos] } : p
      )
    );
  };

  const excluirFotoPendente = (localId, fotoLocalId) => {
    onChangePendentes?.(
      pendentes.map((p) => {
        if (p.localId !== localId) return p;
        const alvo = (p.fotos || []).find((f) => f.localId === fotoLocalId);
        if (alvo?.previewUrl) URL.revokeObjectURL(alvo.previewUrl);
        return { ...p, fotos: (p.fotos || []).filter((f) => f.localId !== fotoLocalId) };
      })
    );
  };

  const lista = aoVivo ? itens : pendentes;
  const chaveDe = (p) => (aoVivo ? p.id : p.localId);

  return (
    <div className="campo campo-largo pertences-editor">
      <label>Registro de pertences em posse do acolhido</label>
      <span className="campo-ajuda">
        Cadastre os itens que o acolhido trouxe (quantidade e descrição) e, se
        quiser, anexe fotos (JPG ou PNG) de cada item.
        {aoVivo
          ? ' As alterações são salvas na hora.'
          : ' Os pertences e as fotos são criados após o cadastro do acolhido.'}
      </span>

      <div className="pertence-form">
        <div className="campo pertence-form-qtd">
          <label htmlFor="pertence-novo-qtd">Quantidade</label>
          <input
            id="pertence-novo-qtd"
            type="number"
            min="1"
            value={novoQtd}
            onChange={(e) => setNovoQtd(e.target.value)}
            disabled={salvando}
          />
        </div>
        <div className="campo pertence-form-item">
          <label htmlFor="pertence-novo-item">Item</label>
          <input
            id="pertence-novo-item"
            type="text"
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            placeholder="Ex.: Camiseta, Celular, Documento..."
            maxLength={200}
            disabled={salvando}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdicionar();
              }
            }}
          />
        </div>
        <button
          type="button"
          className="btn btn-secundario"
          onClick={handleAdicionar}
          disabled={salvando}
        >
          Adicionar
        </button>
      </div>
      {erro && <span className="erro">{erro}</span>}

      {aoVivo && carregando ? (
        <p className="detalhes-vazio">Carregando pertences...</p>
      ) : lista.length === 0 ? (
        <p className="detalhes-vazio">Nenhum pertence registrado.</p>
      ) : (
        <ul className="pertences-lista">
          {lista.map((p) => {
            const chave = chaveDe(p);
            const fotos = p.fotos || [];
            const enviandoFoto = aoVivo && enviandoFotoId === p.id;
            return (
              <li key={chave} className="pertence-item">
                <div className="pertence-linha">
                  <div className="campo pertence-linha-qtd">
                    <label htmlFor={`pertence-qtd-${chave}`}>Qtd.</label>
                    <input
                      id={`pertence-qtd-${chave}`}
                      type="number"
                      min="1"
                      value={p.quantidade}
                      onChange={(e) =>
                        aoVivo
                          ? atualizarCampoLocal(p.id, 'quantidade', e.target.value)
                          : atualizarPendente(p.localId, 'quantidade', e.target.value)
                      }
                      disabled={salvando}
                    />
                  </div>
                  <div className="campo pertence-linha-item">
                    <label htmlFor={`pertence-item-${chave}`}>Item</label>
                    <input
                      id={`pertence-item-${chave}`}
                      type="text"
                      value={p.item}
                      maxLength={200}
                      onChange={(e) =>
                        aoVivo
                          ? atualizarCampoLocal(p.id, 'item', e.target.value)
                          : atualizarPendente(p.localId, 'item', e.target.value)
                      }
                      disabled={salvando}
                    />
                  </div>
                  <div className="pertence-linha-acoes">
                    {aoVivo && (
                      <button
                        type="button"
                        className="btn btn-secundario btn-pequeno"
                        onClick={() => salvarPertence(p)}
                        disabled={salvando}
                      >
                        Salvar
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-icone btn-perigo"
                      onClick={() =>
                        aoVivo ? excluirPertence(p.id) : excluirPendente(p.localId)
                      }
                      disabled={salvando}
                      title="Excluir pertence"
                      aria-label="Excluir pertence"
                    >
                      <IconeLixeira />
                    </button>
                  </div>
                </div>

                <div className="pertence-fotos">
                  {fotos.map((f) => {
                    const src = aoVivo ? f.url : f.previewUrl;
                    const fotoChave = aoVivo ? f.id : f.localId;
                    return (
                      <div key={fotoChave} className="pertence-foto">
                        {src ? (
                          <img src={src} alt={f.nomeArquivo || 'Foto do pertence'} />
                        ) : (
                          <span className="pertence-foto-vazia">IMG</span>
                        )}
                        <button
                          type="button"
                          className="pertence-foto-remover"
                          onClick={() =>
                            aoVivo
                              ? excluirFotoAoVivo(p.id, f.id)
                              : excluirFotoPendente(p.localId, f.localId)
                          }
                          disabled={salvando}
                          title="Remover foto"
                          aria-label="Remover foto"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  <label
                    className={`pertence-foto-add ${enviandoFoto ? 'enviando' : ''}`}
                  >
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
                      disabled={salvando || enviandoFotoId != null}
                      onChange={(e) => {
                        if (aoVivo) {
                          handleSelecionarFotoAoVivo(p.id, e.target.files);
                        } else {
                          handleSelecionarFotoPendente(p.localId, e.target.files);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
