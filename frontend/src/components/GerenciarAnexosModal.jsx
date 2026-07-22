import { useEffect, useRef, useState } from 'react';
import { anexoService } from '../api';
import InputArquivoCustomizado from './InputArquivoCustomizado.jsx';

const TIPOS = [
  { valor: 'ATESTADO', rotulo: 'Atestado' },
  { valor: 'RECEITA', rotulo: 'Receita' },
  { valor: 'DOCUMENTO', rotulo: 'Documento' },
  { valor: 'OUTRO', rotulo: 'Outro' },
];

const ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.xlsx,application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const TAMANHO_MAX = 10 * 1024 * 1024;

const formatarTamanho = (bytes) => {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const formatarDataHora = (valor) => {
  if (!valor) return '-';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '-';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const rotuloTipo = (tipo) =>
  TIPOS.find((t) => t.valor === tipo)?.rotulo ?? tipo ?? '-';

const extensaoPorContentType = (contentType) => {
  if (contentType === 'application/pdf') return 'PDF';
  if (contentType === 'image/jpeg') return 'JPG';
  if (contentType === 'image/png') return 'PNG';
  if (
    contentType ===
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return 'XLSX';
  return 'ARQ';
};

const extensaoPorArquivo = (file) => {
  if (!file?.name) return 'ARQ';
  const ext = file.name.split('.').pop();
  return ext ? ext.toUpperCase() : 'ARQ';
};

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

const nomePadraoArquivo = (nomeArquivo) => {
  if (!nomeArquivo) return '';
  const ponto = nomeArquivo.lastIndexOf('.');
  return ponto > 0 ? nomeArquivo.substring(0, ponto) : nomeArquivo;
};

export default function GerenciarAnexosModal({ acolhido, onFechar, onMensagem }) {
  const acolhidoId = acolhido?.id ?? null;

  const [existentes, setExistentes] = useState([]);
  const [novos, setNovos] = useState([]);
  const [excluirIds, setExcluirIds] = useState([]);
  const [thumbs, setThumbs] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [baixandoId, setBaixandoId] = useState(null);

  const [tipo, setTipo] = useState('DOCUMENTO');
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [arquivo, setArquivo] = useState(null);

  const inputRef = useRef(null);
  const novosRef = useRef([]);

  useEffect(() => {
    novosRef.current = novos;
  }, [novos]);

  useEffect(
    () => () => {
      novosRef.current.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    },
    []
  );

  const mostrarMensagem = (tipoMsg, texto) => onMensagem?.(tipoMsg, texto);

  const limparFormulario = () => {
    setArquivo(null);
    setNomeArquivo('');
    setTipo('DOCUMENTO');
    if (inputRef.current) inputRef.current.value = '';
  };

  const carregarThumbs = async (lista) => {
    const imagens = lista.filter((a) => a.contentType?.startsWith('image/'));
    if (imagens.length === 0) {
      setThumbs({});
      return;
    }
    const mapa = {};
    await Promise.all(
      imagens.map(async (a) => {
        try {
          mapa[a.id] = await anexoService.linkDownload(acolhidoId, a.id);
        } catch {
          /* miniatura opcional */
        }
      })
    );
    setThumbs(mapa);
  };

  const carregar = async () => {
    if (!acolhidoId) return;
    setCarregando(true);
    try {
      const dados = await anexoService.listar(acolhidoId);
      const lista = Array.isArray(dados) ? dados : [];
      setExistentes(
        lista.map((a) => ({
          ...a,
          nomeArquivoOriginal: a.nomeArquivo,
          tipoOriginal: a.tipo,
        }))
      );
      carregarThumbs(lista);
    } catch (err) {
      mostrarMensagem('erro', extrairErro(err, 'Erro ao carregar anexos.'));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!acolhidoId) return;
    setExistentes([]);
    setNovos([]);
    setExcluirIds([]);
    setThumbs({});
    limparFormulario();
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acolhidoId]);

  useEffect(() => {
    if (!acolhido) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !salvando) onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [acolhido, onFechar, salvando]);

  if (!acolhido) return null;

  const temAlteracoes =
    novos.length > 0 ||
    excluirIds.length > 0 ||
    existentes.some(
      (a) =>
        !excluirIds.includes(a.id) &&
        (a.nomeArquivo !== a.nomeArquivoOriginal || a.tipo !== a.tipoOriginal)
    );

  const handleSelecionarArquivo = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setArquivo(null);
      return;
    }
    if (f.size > TAMANHO_MAX) {
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = '';
      mostrarMensagem('erro', 'Arquivo excede o limite de 10 MB.');
      return;
    }
    setArquivo(f);
    setNomeArquivo((atual) => atual.trim() || nomePadraoArquivo(f.name));
  };

  const handleAdicionarLista = (e) => {
    e.preventDefault();
    const nomeArquivoFinal = nomeArquivo.trim();
    if (!nomeArquivoFinal || nomeArquivoFinal.length < 2) {
      mostrarMensagem('erro', 'Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    if (!arquivo) {
      mostrarMensagem('erro', 'Selecione um arquivo (PDF, JPG, PNG ou Excel .xlsx).');
      return;
    }

    const ehImagem = arquivo.type?.startsWith('image/');
    setNovos((atual) => [
      ...atual,
      {
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: arquivo,
        nomeArquivo: nomeArquivoFinal,
        tipo,
        ehImagem,
        previewUrl: ehImagem ? URL.createObjectURL(arquivo) : null,
        tamanhoBytes: arquivo.size,
      },
    ]);
    limparFormulario();
  };

  const removerNovo = (localId) => {
    setNovos((atual) => {
      const alvo = atual.find((a) => a.localId === localId);
      if (alvo?.previewUrl) URL.revokeObjectURL(alvo.previewUrl);
      return atual.filter((a) => a.localId !== localId);
    });
  };

  const marcarExclusao = (id) => {
    setExcluirIds((atual) => [...new Set([...atual, id])]);
  };

  const desmarcarExclusao = (id) => {
    setExcluirIds((atual) => atual.filter((x) => x !== id));
  };

  const atualizarExistente = (id, campo, valor) => {
    setExistentes((atual) =>
      atual.map((a) => (a.id === id ? { ...a, [campo]: valor } : a))
    );
  };

  const handleBaixar = async (anexo) => {
    setBaixandoId(anexo.id);
    try {
      const url = await anexoService.linkDownload(acolhidoId, anexo.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      mostrarMensagem('erro', extrairErro(err, 'Erro ao gerar o link de download.'));
    } finally {
      setBaixandoId(null);
    }
  };

  const validarAntesSalvar = () => {
    for (const n of novos) {
      if (!n.nomeArquivo?.trim() || n.nomeArquivo.trim().length < 2) {
        return 'Todos os anexos novos precisam de um nome com pelo menos 2 caracteres.';
      }
    }
    for (const a of existentes) {
      if (excluirIds.includes(a.id)) continue;
      if (!a.nomeArquivo?.trim() || a.nomeArquivo.trim().length < 2) {
        return 'Todos os anexos precisam de um nome com pelo menos 2 caracteres.';
      }
    }
    return null;
  };

  const handleSalvar = async () => {
    const erroValidacao = validarAntesSalvar();
    if (erroValidacao) {
      mostrarMensagem('erro', erroValidacao);
      return;
    }
    if (!temAlteracoes) {
      mostrarMensagem('erro', 'Nenhuma alteração para salvar.');
      return;
    }

    setSalvando(true);
    try {
      for (const id of excluirIds) {
        await anexoService.deletar(acolhidoId, id);
      }

      for (const a of existentes) {
        if (excluirIds.includes(a.id)) continue;
        if (a.nomeArquivo !== a.nomeArquivoOriginal || a.tipo !== a.tipoOriginal) {
          await anexoService.atualizar(acolhidoId, a.id, {
            nomeArquivo: a.nomeArquivo.trim(),
            tipo: a.tipo,
          });
        }
      }

      for (const n of novos) {
        await anexoService.enviar(acolhidoId, n.file, n.tipo, n.nomeArquivo.trim());
      }

      novos.forEach((n) => {
        if (n.previewUrl) URL.revokeObjectURL(n.previewUrl);
      });
      setNovos([]);
      setExcluirIds([]);
      mostrarMensagem('sucesso', 'Anexos salvos com sucesso.');
      await carregar();
    } catch (err) {
      mostrarMensagem('erro', extrairErro(err, 'Erro ao salvar os anexos.'));
    } finally {
      setSalvando(false);
    }
  };

  const totalVisivel =
    existentes.filter((a) => !excluirIds.includes(a.id)).length + novos.length;

  const renderItemExistente = (a) => {
    const marcadoExclusao = excluirIds.includes(a.id);
    return (
      <li
        key={a.id}
        className={`anexo-item ${marcadoExclusao ? 'anexo-item-excluido' : ''}`}
      >
        <div className="anexo-miniatura">
          {thumbs[a.id] ? (
            <img src={thumbs[a.id]} alt={a.nomeArquivo} />
          ) : a.contentType?.startsWith('image/') ? (
            <span className="anexo-miniatura-spinner" aria-hidden="true" />
          ) : (
            <span className="anexo-miniatura-ext">
              {extensaoPorContentType(a.contentType)}
            </span>
          )}
        </div>

        <div className="anexo-info anexo-info-editavel">
          <div className="campo campo-compacto">
            <label htmlFor={`anexo-nomeArquivo-${a.id}`}>Nome do arquivo</label>
            <input
              id={`anexo-nomeArquivo-${a.id}`}
              type="text"
              value={a.nomeArquivo ?? ''}
              onChange={(e) => atualizarExistente(a.id, 'nomeArquivo', e.target.value)}
              disabled={marcadoExclusao || salvando}
              maxLength={120}
            />
          </div>
          <div className="campo campo-compacto">
            <label htmlFor={`anexo-tipo-${a.id}`}>Tipo</label>
            <select
              id={`anexo-tipo-${a.id}`}
              value={a.tipo ?? 'DOCUMENTO'}
              onChange={(e) => atualizarExistente(a.id, 'tipo', e.target.value)}
              disabled={marcadoExclusao || salvando}
            >
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </div>
          <span className="anexo-meta">
            {formatarTamanho(a.tamanhoBytes)} · {formatarDataHora(a.enviadoEm)}
          </span>
        </div>

        <div className="anexo-acoes">
          {!marcadoExclusao && (
            <button
              type="button"
              className="btn btn-icone btn-exibir"
              onClick={() => handleBaixar(a)}
              disabled={baixandoId === a.id || salvando}
              title="Baixar / visualizar"
              aria-label="Baixar anexo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          )}
          {marcadoExclusao ? (
            <button
              type="button"
              className="btn btn-secundario btn-pequeno"
              onClick={() => desmarcarExclusao(a.id)}
              disabled={salvando}
            >
              Desfazer
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-icone btn-perigo"
              onClick={() => marcarExclusao(a.id)}
              disabled={salvando}
              title="Marcar para exclusão"
              aria-label="Marcar anexo para exclusão"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </li>
    );
  };

  const renderItemNovo = (a) => (
    <li key={a.localId} className="anexo-item anexo-item-novo">
      <div className="anexo-miniatura">
        {a.ehImagem && a.previewUrl ? (
          <img src={a.previewUrl} alt={a.nomeArquivo} />
        ) : (
          <span className="anexo-miniatura-ext">
            {extensaoPorArquivo(a.file)}
          </span>
        )}
      </div>

      <div className="anexo-info anexo-info-editavel">
        <div className="campo campo-compacto">
          <label htmlFor={`anexo-novo-nomeArquivo-${a.localId}`}>Nome do arquivo</label>
          <input
            id={`anexo-novo-nomeArquivo-${a.localId}`}
            type="text"
            value={a.nomeArquivo}
            onChange={(e) =>
              setNovos((atual) =>
                atual.map((x) =>
                  x.localId === a.localId ? { ...x, nomeArquivo: e.target.value } : x
                )
              )
            }
            disabled={salvando}
            maxLength={120}
          />
        </div>
        <div className="campo campo-compacto">
          <label htmlFor={`anexo-novo-tipo-${a.localId}`}>Tipo</label>
          <select
            id={`anexo-novo-tipo-${a.localId}`}
            value={a.tipo}
            onChange={(e) =>
              setNovos((atual) =>
                atual.map((x) =>
                  x.localId === a.localId ? { ...x, tipo: e.target.value } : x
                )
              )
            }
            disabled={salvando}
          >
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </div>
        <span className="anexo-meta anexo-meta-novo">
          Novo · {formatarTamanho(a.tamanhoBytes)}
        </span>
      </div>

      <div className="anexo-acoes">
        <button
          type="button"
          className="btn btn-icone btn-perigo"
          onClick={() => removerNovo(a.localId)}
          disabled={salvando}
          title="Remover da lista"
          aria-label="Remover anexo da lista"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </li>
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onFechar}>
      <div className="modal modal-detalhes" onClick={(e) => e.stopPropagation()}>
        <div className="detalhes-cabecalho">
          <div>
            <span className="detalhes-eyebrow">Anexos</span>
            <h3 className="modal-titulo detalhes-nome">{acolhido.nome}</h3>
          </div>
          <button
            type="button"
            className="modal-fechar"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="detalhes-corpo">
          <section className="detalhes-secao">
            <h4 className="detalhes-secao-titulo">Adicionar anexo</h4>
            <form className="anexo-upload" onSubmit={handleAdicionarLista}>
              <div className="anexo-upload-campos anexo-upload-campos-vertical">
                <div className="campo">
                  <label htmlFor="anexo-nomeArquivo">Nome do arquivo</label>
                  <input
                    id="anexo-nomeArquivo"
                    type="text"
                    value={nomeArquivo}
                    onChange={(e) => setNomeArquivo(e.target.value)}
                    placeholder="Nome do anexo"
                    maxLength={120}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="anexo-tipo">Tipo</label>
                  <select
                    id="anexo-tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    {TIPOS.map((t) => (
                      <option key={t.valor} value={t.valor}>
                        {t.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor="anexo-arquivo">Arquivo (PDF, JPG, PNG ou Excel .xlsx — máx. 10 MB)</label>
                  <InputArquivoCustomizado
                    id="anexo-arquivo"
                    inputRef={inputRef}
                    accept={ACCEPT}
                    onChange={handleSelecionarArquivo}
                    disabled={salvando}
                    nomeArquivoSelecionado={arquivo?.name ?? ''}
                  />
                </div>
              </div>
              <div className="anexo-upload-acoes">
                <button type="submit" className="btn btn-secundario" disabled={salvando}>
                  Adicionar à lista
                </button>
              </div>
            </form>
          </section>

          <section className="detalhes-secao">
            <h4 className="detalhes-secao-titulo">
              Anexos ({totalVisivel})
            </h4>

            {carregando ? (
              <p className="detalhes-vazio">Carregando anexos...</p>
            ) : existentes.length === 0 && novos.length === 0 ? (
              <p className="detalhes-vazio">Nenhum anexo cadastrado.</p>
            ) : (
              <ul className="anexos-lista">
                {existentes.map(renderItemExistente)}
                {novos.map(renderItemNovo)}
              </ul>
            )}
          </section>
        </div>

        <div className="modal-acoes detalhes-acoes">
          <button
            type="button"
            className="btn btn-secundario"
            onClick={onFechar}
            disabled={salvando}
          >
            Fechar
          </button>
          <button
            type="button"
            className="btn btn-primario"
            onClick={handleSalvar}
            disabled={salvando || !temAlteracoes}
          >
            {salvando ? 'Salvando...' : 'Salvar anexos'}
          </button>
        </div>
      </div>
    </div>
  );
}
