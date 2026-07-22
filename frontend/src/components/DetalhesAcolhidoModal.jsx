import { useEffect, useState } from 'react';
import { anexoService, pertenceService } from '../api';
import { rotuloTipoCombinado, TIPO_RESSOCIALIZACAO } from '../utils/combinados';

const formatarData = (data) => {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
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

const formatarSexo = (sexo) => {
  if (!sexo) return '-';
  const mapa = { MASCULINO: 'Masculino', FEMININO: 'Feminino', OUTRO: 'Outro' };
  return mapa[sexo] ?? sexo;
};

const formatarTamanho = (bytes) => {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

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

const ROTULOS_TIPO_ANEXO = {
  ATESTADO: 'Atestado',
  RECEITA: 'Receita',
  DOCUMENTO: 'Documento',
  OUTRO: 'Outro',
};

const rotuloTipoAnexo = (tipo) => ROTULOS_TIPO_ANEXO[tipo] ?? tipo ?? '-';

const Campo = ({ label, valor, largo = false }) => (
  <div className={`detalhes-campo ${largo ? 'detalhes-campo-largo' : ''}`}>
    <span className="detalhes-label">{label}</span>
    <span className="detalhes-valor">{valor ?? '-'}</span>
  </div>
);

export default function DetalhesAcolhidoModal({
  acolhido,
  combinados = [],
  ocorrencias = [],
  onFechar,
}) {
  const acolhidoId = acolhido?.id ?? null;

  const [aba, setAba] = useState('dados');
  const [anexos, setAnexos] = useState([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [thumbs, setThumbs] = useState({});
  const [baixandoId, setBaixandoId] = useState(null);
  const [erroAnexos, setErroAnexos] = useState('');
  const [pertences, setPertences] = useState([]);
  const [carregandoPertences, setCarregandoPertences] = useState(false);
  const [erroPertences, setErroPertences] = useState('');

  useEffect(() => {
    if (!acolhido) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [acolhido, onFechar]);

  // Ao trocar de acolhido, volta para a primeira aba.
  useEffect(() => {
    setAba('dados');
  }, [acolhidoId]);

  // Carrega os anexos (e as miniaturas das imagens) do acolhido selecionado.
  useEffect(() => {
    if (!acolhidoId) {
      setAnexos([]);
      setThumbs({});
      return undefined;
    }
    let ativo = true;
    setCarregandoAnexos(true);
    setErroAnexos('');
    setThumbs({});
    anexoService
      .listar(acolhidoId)
      .then(async (dados) => {
        if (!ativo) return;
        const lista = Array.isArray(dados) ? dados : [];
        setAnexos(lista);
        const imagens = lista.filter((a) => a.contentType?.startsWith('image/'));
        if (imagens.length === 0) return;
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
        if (ativo) setThumbs(mapa);
      })
      .catch(() => {
        if (ativo) setErroAnexos('Não foi possível carregar os anexos.');
      })
      .finally(() => {
        if (ativo) setCarregandoAnexos(false);
      });
    return () => {
      ativo = false;
    };
  }, [acolhidoId]);

  // Carrega os pertences (com as fotos) do acolhido selecionado.
  useEffect(() => {
    if (!acolhidoId) {
      setPertences([]);
      return undefined;
    }
    let ativo = true;
    setCarregandoPertences(true);
    setErroPertences('');
    pertenceService
      .listar(acolhidoId)
      .then((dados) => {
        if (ativo) setPertences(Array.isArray(dados) ? dados : []);
      })
      .catch(() => {
        if (ativo) setErroPertences('Não foi possível carregar os pertences.');
      })
      .finally(() => {
        if (ativo) setCarregandoPertences(false);
      });
    return () => {
      ativo = false;
    };
  }, [acolhidoId]);

  if (!acolhido) return null;

  const prescricoes = Array.isArray(acolhido.prescricoes)
    ? acolhido.prescricoes
    : [];

  const listaCombinados = Array.isArray(combinados) ? combinados : [];

  const listaOcorrencias = Array.isArray(ocorrencias) ? ocorrencias : [];

  const temDoses = (p) =>
    (p.doseManha ?? 0) > 0 || (p.doseTarde ?? 0) > 0 || (p.doseNoite ?? 0) > 0;

  const handleBaixar = async (anexo) => {
    setBaixandoId(anexo.id);
    setErroAnexos('');
    try {
      const url = await anexoService.linkDownload(acolhidoId, anexo.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setErroAnexos('Erro ao gerar o link de download.');
    } finally {
      setBaixandoId(null);
    }
  };

  const abas = [
    { id: 'dados', rotulo: 'Dados' },
    { id: 'medicacoes', rotulo: `Medicações (${prescricoes.length})` },
    { id: 'combinados', rotulo: `Combinados (${listaCombinados.length})` },
    { id: 'ocorrencias', rotulo: `Ocorrências (${listaOcorrencias.length})` },
    {
      id: 'pertences',
      rotulo: `Pertences${carregandoPertences ? '' : ` (${pertences.length})`}`,
    },
    {
      id: 'anexos',
      rotulo: `Anexos${carregandoAnexos ? '' : ` (${anexos.length})`}`,
    },
  ];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onFechar}
    >
      <div
        className="modal modal-detalhes modal-detalhes-grande"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detalhes-cabecalho">
          <div className="detalhes-cabecalho-info">
            <div className="detalhes-foto">
              {acolhido.fotoUrl ? (
                <img src={acolhido.fotoUrl} alt={`Foto de ${acolhido.nome}`} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div>
              <span className="detalhes-eyebrow">Acolhido</span>
              <h3 className="modal-titulo detalhes-nome">{acolhido.nome}</h3>
            </div>
          </div>
          <button
            type="button"
            className="modal-fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="detalhes-abas" role="tablist" aria-label="Informações do acolhido">
          {abas.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={aba === item.id}
              className={`form-aba-btn ${aba === item.id ? 'ativo' : ''}`}
              onClick={() => setAba(item.id)}
            >
              {item.rotulo}
            </button>
          ))}
        </div>

        <div className="detalhes-corpo">
          {aba === 'dados' && (
            <>
              <section className="detalhes-secao">
                <h4 className="detalhes-secao-titulo">Dados pessoais</h4>
                <div className="detalhes-grid">
                  <Campo label="CPF" valor={acolhido.cpf} />
                  <Campo label="Data de nascimento" valor={formatarData(acolhido.dataNascimento)} />
                  <Campo label="Sexo" valor={formatarSexo(acolhido.sexo)} />
                </div>
              </section>

              <section className="detalhes-secao">
                <h4 className="detalhes-secao-titulo">Instituição CTAV</h4>
                <div className="detalhes-grid">
                  <Campo
                    label="Data de acolhimento (entrada)"
                    valor={formatarData(acolhido.dataAcolhimentoCtav)}
                  />
                  <Campo label="Quarto" valor={acolhido.quarto} />
                  <Campo
                    label="Motivo de adesão"
                    valor={acolhido.motivoAdesaoNome}
                  />
                  <Campo
                    label="Responsável"
                    valor={
                      acolhido.responsavelNome
                        ? `${acolhido.responsavelNome}${
                            acolhido.responsavelConveniado ? ' (conveniado)' : ''
                          }`
                        : null
                    }
                  />
                </div>
              </section>

              {acolhido.alta && (
                <section className="detalhes-secao">
                  <h4 className="detalhes-secao-titulo">Alta</h4>
                  <div className="detalhes-grid">
                    <Campo label="Data da alta" valor={formatarData(acolhido.dataAlta)} />
                    <Campo
                      label="Tipo de alta"
                      valor={acolhido.tipoAltaRotulo ?? acolhido.tipoAlta}
                    />
                    {acolhido.tipoAlta === 'DESISTENCIA' && (
                      <Campo
                        label="Motivo da desistência"
                        valor={acolhido.motivoDesistenciaNome}
                      />
                    )}
                    <Campo
                      label="Descrição da alta"
                      valor={acolhido.descricaoAlta}
                      largo
                    />
                  </div>
                </section>
              )}

              <section className="detalhes-secao">
                <h4 className="detalhes-secao-titulo">Contato</h4>
                <div className="detalhes-grid">
                  <Campo label="Email" valor={acolhido.email} />
                  <Campo label="Celular" valor={acolhido.telefone} />
                  <Campo label="Endereço" valor={acolhido.endereco} largo />
                </div>
              </section>

              <section className="detalhes-secao">
                <h4 className="detalhes-secao-titulo">
                  Assinaturas do termo de concordância
                </h4>
                {acolhido.assinaturaAcolhido || acolhido.assinaturaResponsavel ? (
                  <div className="assinaturas-visualizacao">
                    <div className="assinatura-visualizacao-item">
                      <span className="detalhes-label">Acolhido</span>
                      {acolhido.assinaturaAcolhido ? (
                        <img
                          className="assinatura-imagem"
                          src={acolhido.assinaturaAcolhido}
                          alt="Assinatura do acolhido"
                        />
                      ) : (
                        <span className="detalhes-valor">Não assinado</span>
                      )}
                    </div>
                    <div className="assinatura-visualizacao-item">
                      <span className="detalhes-label">Responsável</span>
                      {acolhido.assinaturaResponsavel ? (
                        <img
                          className="assinatura-imagem"
                          src={acolhido.assinaturaResponsavel}
                          alt="Assinatura do responsável"
                        />
                      ) : (
                        <span className="detalhes-valor">Não assinado</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="detalhes-vazio">
                    Nenhuma assinatura do termo registrada.
                  </p>
                )}
              </section>

              <section className="detalhes-secao detalhes-auditoria">
                <Campo label="Cadastrado em" valor={formatarDataHora(acolhido.criadoEm)} />
                <Campo label="Última atualização" valor={formatarDataHora(acolhido.atualizadoEm)} />
              </section>
            </>
          )}

          {aba === 'medicacoes' && (
            <section className="detalhes-secao">
              <h4 className="detalhes-secao-titulo">Medicamentos prescritos</h4>
              {prescricoes.length > 0 ? (
                <ul className="detalhes-medicamentos">
                  {prescricoes.map((p, i) => {
                    const nome = p?.medicamentoNome ?? '-';
                    const desc = p?.medicamentoDescricao
                      ? String(p.medicamentoDescricao).trim()
                      : '';
                    const chave = p?.id ?? p?.medicamentoId ?? `${nome}-${i}`;
                    return (
                      <li key={chave}>
                        <span className="detalhes-medicamento-nome">{nome}</span>
                        {desc ? (
                          <span className="detalhes-medicamento-descricao">{desc}</span>
                        ) : null}
                        {temDoses(p) ? (
                          <div className="detalhes-doses">
                            <span className="detalhes-dose">
                              <span className="detalhes-dose-periodo">Manhã</span>
                              <span className="detalhes-dose-qtd">
                                {p.doseManha ?? 0} comp.
                              </span>
                            </span>
                            <span className="detalhes-dose">
                              <span className="detalhes-dose-periodo">Tarde</span>
                              <span className="detalhes-dose-qtd">
                                {p.doseTarde ?? 0} comp.
                              </span>
                            </span>
                            <span className="detalhes-dose">
                              <span className="detalhes-dose-periodo">Noite</span>
                              <span className="detalhes-dose-qtd">
                                {p.doseNoite ?? 0} comp.
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span className="detalhes-medicamento-dose">
                            Doses não definidas no controle de administração.
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="detalhes-vazio">Nenhum medicamento prescrito.</p>
              )}
            </section>
          )}

          {aba === 'combinados' && (
            <section className="detalhes-secao">
              <h4 className="detalhes-secao-titulo">Combinados</h4>
              {listaCombinados.length > 0 ? (
                <ul className="detalhes-combinados">
                  {listaCombinados.map((c, i) => {
                    const ehRessocializacao = c.tipo === TIPO_RESSOCIALIZACAO;
                    const desc = c?.descricao ? String(c.descricao).trim() : '';
                    const chave = c?.id ?? `${c?.tipo ?? 'combinado'}-${i}`;
                    return (
                      <li key={chave}>
                        <span className="detalhes-combinado-tipo">
                          {rotuloTipoCombinado(c.tipo)}
                        </span>
                        {ehRessocializacao && (c.dataIda || c.dataVolta) ? (
                          <span className="detalhes-combinado-datas">
                            {`Ida: ${formatarData(c.dataIda)} · Volta: ${formatarData(c.dataVolta)}`}
                          </span>
                        ) : c.dataCombinado ? (
                          <span className="detalhes-combinado-datas">
                            {`Data: ${formatarData(c.dataCombinado)}`}
                          </span>
                        ) : null}
                        {desc ? (
                          <span className="detalhes-combinado-descricao">{desc}</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="detalhes-vazio">Nenhum combinado registrado.</p>
              )}
            </section>
          )}

          {aba === 'ocorrencias' && (
            <section className="detalhes-secao">
              <h4 className="detalhes-secao-titulo">Ocorrências</h4>
              {listaOcorrencias.length > 0 ? (
                <ul className="detalhes-ocorrencias">
                  {listaOcorrencias.map((o, i) => {
                    const desc = o?.descricao ? String(o.descricao).trim() : '';
                    const chave = o?.id ?? `${o?.titulo ?? 'ocorrencia'}-${i}`;
                    const envolvidos = (o.acolhidoIds?.length ?? 0) > 1
                      ? o.acolhidosResumo
                      : null;
                    return (
                      <li key={chave}>
                        <span className="detalhes-ocorrencia-titulo">
                          {o.titulo ?? '-'}
                        </span>
                        {o.dataOcorrencia ? (
                          <span className="detalhes-ocorrencia-data">
                            {`Data: ${formatarData(o.dataOcorrencia)}`}
                          </span>
                        ) : null}
                        {envolvidos ? (
                          <span className="detalhes-ocorrencia-data">
                            {`Envolvidos: ${envolvidos}`}
                          </span>
                        ) : null}
                        {desc ? (
                          <span className="detalhes-ocorrencia-descricao">{desc}</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="detalhes-vazio">Nenhuma ocorrência registrada.</p>
              )}
            </section>
          )}

          {aba === 'pertences' && (
            <section className="detalhes-secao">
              <h4 className="detalhes-secao-titulo">
                Registro de pertences em posse do acolhido
              </h4>
              {erroPertences && <p className="detalhes-vazio">{erroPertences}</p>}
              {carregandoPertences ? (
                <p className="detalhes-vazio">Carregando pertences...</p>
              ) : pertences.length === 0 ? (
                <p className="detalhes-vazio">Nenhum pertence registrado.</p>
              ) : (
                <ul className="detalhes-pertences">
                  {pertences.map((p) => {
                    const fotos = Array.isArray(p.fotos) ? p.fotos : [];
                    return (
                      <li key={p.id} className="detalhes-pertence">
                        <div className="detalhes-pertence-cabecalho">
                          <span className="detalhes-pertence-qtd">{p.quantidade}x</span>
                          <span className="detalhes-pertence-item">{p.item}</span>
                        </div>
                        {fotos.length > 0 && (
                          <div className="detalhes-pertence-fotos">
                            {fotos.map((f) => (
                              <a
                                key={f.id}
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="detalhes-pertence-foto"
                                title={f.nomeArquivo || 'Foto do pertence'}
                              >
                                <img src={f.url} alt={f.nomeArquivo || 'Foto do pertence'} />
                              </a>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {aba === 'anexos' && (
            <section className="detalhes-secao">
              <h4 className="detalhes-secao-titulo">Anexos</h4>
              {erroAnexos && <p className="detalhes-vazio">{erroAnexos}</p>}
              {carregandoAnexos ? (
                <p className="detalhes-vazio">Carregando anexos...</p>
              ) : anexos.length === 0 ? (
                <p className="detalhes-vazio">Nenhum anexo cadastrado.</p>
              ) : (
                <ul className="anexos-lista">
                  {anexos.map((a) => (
                    <li key={a.id} className="anexo-item">
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
                      <div className="anexo-info">
                        <span className="anexo-nome">{a.nomeArquivo}</span>
                        <span className="anexo-meta">
                          {rotuloTipoAnexo(a.tipo)} · {formatarTamanho(a.tamanhoBytes)} ·{' '}
                          {formatarDataHora(a.enviadoEm)}
                        </span>
                      </div>
                      <div className="anexo-acoes">
                        <button
                          type="button"
                          className="btn btn-icone btn-exibir"
                          onClick={() => handleBaixar(a)}
                          disabled={baixandoId === a.id}
                          title="Baixar / visualizar"
                          aria-label="Baixar anexo"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <div className="modal-acoes detalhes-acoes">
          <button
            type="button"
            className="btn btn-primario"
            onClick={onFechar}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
