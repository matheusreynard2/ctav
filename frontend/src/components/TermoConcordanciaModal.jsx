import { useEffect, useRef, useState } from 'react';
import AssinaturaPad from './AssinaturaPad.jsx';
import {
  TITULO_ACORDO,
  TITULO_CELULAR,
  TITULO_CONCORDANCIA,
  TITULO_PERTENCES,
  construirParagrafosAcordo,
  construirParagrafosCelular,
  construirParagrafosConcordancia,
  construirParagrafosPertences,
  resolverParagrafosAcordoParaImagem,
  resolverParagrafosCelular,
  resolverParagrafosPertences,
} from '../utils/termos.js';

// Compõe uma imagem PNG (largura A4 em 96dpi) contendo o documento preenchido,
// a data e as assinaturas capturadas. É devolvida como File para ser anexada.
const gerarImagemDocumento = async ({
  titulo,
  paragrafos,
  data,
  nome,
  nomeResponsavel,
  assinaturaAcolhidoUrl,
  assinaturaResponsavelUrl,
  nomeArquivo,
}) => {
  const LARGURA = 794;
  const MARGEM = 48;
  const larguraTexto = LARGURA - MARGEM * 2;

  const medidor = document.createElement('canvas').getContext('2d');
  const fonteCorpo = '15px Arial';
  const fonteRotulo = 'bold 15px Arial';

  const quebrarLinhas = (ctx, texto, maxLargura) => {
    const palavras = texto.split(/\s+/);
    const linhas = [];
    let atual = '';
    palavras.forEach((palavra) => {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (ctx.measureText(teste).width > maxLargura && atual) {
        linhas.push(atual);
        atual = palavra;
      } else {
        atual = teste;
      }
    });
    if (atual) linhas.push(atual);
    return linhas;
  };

  const alturaLinha = 22;
  const espacoParagrafo = 12;

  // Mede a altura total do corpo.
  let alturaCorpo = 0;
  paragrafos.forEach((p) => {
    const textoCompleto = p.secao
      ? p.secao
      : p.rotulo
        ? `${p.rotulo} ${p.texto}`
        : p.texto;
    medidor.font = p.secao ? fonteRotulo : fonteCorpo;
    const linhas = quebrarLinhas(medidor, textoCompleto, larguraTexto);
    alturaCorpo += linhas.length * alturaLinha + espacoParagrafo;
  });

  const alturaCabecalho = 90;
  const alturaData = 44;
  const alturaAssinaturas = 200;
  const alturaTotal =
    alturaCabecalho + alturaCorpo + alturaData + alturaAssinaturas + MARGEM;

  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = Math.max(1123, alturaTotal); // pelo menos uma página A4
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111827';

  let y = MARGEM + 10;

  // Cabeçalho / título centralizado.
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(titulo, LARGURA / 2, y);
  ctx.textAlign = 'left';
  y += 40;

  // Corpo.
  paragrafos.forEach((p) => {
    if (p.secao) {
      ctx.font = fonteRotulo;
      const linhas = quebrarLinhas(ctx, p.secao, larguraTexto);
      linhas.forEach((linha) => {
        ctx.fillText(linha, MARGEM, y);
        y += alturaLinha;
      });
      y += espacoParagrafo;
      return;
    }
    const textoCompleto = p.rotulo ? `${p.rotulo} ${p.texto}` : p.texto;
    ctx.font = fonteCorpo;
    const linhas = quebrarLinhas(ctx, textoCompleto, larguraTexto);
    linhas.forEach((linha, idx) => {
      if (p.rotulo && idx === 0) {
        ctx.font = fonteRotulo;
        ctx.fillText(p.rotulo, MARGEM, y);
        const larguraRotulo = ctx.measureText(`${p.rotulo} `).width;
        ctx.font = fonteCorpo;
        ctx.fillText(linha.slice(p.rotulo.length + 1), MARGEM + larguraRotulo, y);
      } else {
        ctx.font = fonteCorpo;
        ctx.fillText(linha, MARGEM, y);
      }
      y += alturaLinha;
    });
    y += espacoParagrafo;
  });

  // Data.
  ctx.font = fonteCorpo;
  y += 10;
  ctx.fillText(`Data do acolhimento: ${data || '____/____/______'}`, MARGEM, y);
  y += alturaData;

  // Assinaturas lado a lado.
  const carregarImagem = (url) =>
    new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const [imgAcolhido, imgResponsavel] = await Promise.all([
    carregarImagem(assinaturaAcolhidoUrl),
    carregarImagem(assinaturaResponsavelUrl),
  ]);

  const larguraAssinatura = (larguraTexto - 40) / 2;
  const alturaImagem = 90;
  const xEsquerda = MARGEM;
  const xDireita = MARGEM + larguraAssinatura + 40;
  const yImagem = y;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;

  if (imgAcolhido) {
    ctx.drawImage(imgAcolhido, xEsquerda, yImagem, larguraAssinatura, alturaImagem);
  }
  if (imgResponsavel) {
    ctx.drawImage(imgResponsavel, xDireita, yImagem, larguraAssinatura, alturaImagem);
  }

  const yLinha = yImagem + alturaImagem + 6;
  ctx.beginPath();
  ctx.moveTo(xEsquerda, yLinha);
  ctx.lineTo(xEsquerda + larguraAssinatura, yLinha);
  ctx.moveTo(xDireita, yLinha);
  ctx.lineTo(xDireita + larguraAssinatura, yLinha);
  ctx.stroke();

  ctx.font = '13px Arial';
  ctx.fillStyle = '#374151';
  ctx.fillText('Assinatura do acolhido', xEsquerda, yLinha + 20);
  ctx.fillText('Assinatura do responsável', xDireita, yLinha + 20);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(nome || '', xEsquerda, yLinha + 38);
  ctx.fillText(nomeResponsavel || '', xDireita, yLinha + 38);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) return null;
  return new File([blob], nomeArquivo, { type: 'image/png' });
};

// Renderiza o texto de um parágrafo destacando as lacunas preenchíveis em azul.
const renderTextoTermo = (p) =>
  p.partes
    ? p.partes.map((parte, i) =>
        parte.preenchivel ? (
          <mark key={i} className="campo-preenchivel">
            {parte.texto}
          </mark>
        ) : (
          <span key={i}>{parte.texto}</span>
        )
      )
    : p.texto;

export default function TermoConcordanciaModal({
  nome,
  cpf,
  data,
  nomeResponsavel,
  pertences = [],
  onConfirmar,
  onCancelar,
  onErro,
  processando = false,
  assinaturaAcolhidoInicial = null,
  assinaturaResponsavelInicial = null,
  textoConfirmar = 'Confirmar e cadastrar',
}) {
  const [abaAtiva, setAbaAtiva] = useState('concordancia');
  const [aceitaConcordancia, setAceitaConcordancia] = useState(false);
  const [aceitaAcolhimento, setAceitaAcolhimento] = useState(false);
  const [aceitaCelular, setAceitaCelular] = useState(false);
  const [aceitaPertences, setAceitaPertences] = useState(false);
  const [autorizaImagem, setAutorizaImagem] = useState(null); // null | true | false
  const [entregaCelular, setEntregaCelular] = useState(null); // null | true | false
  const [concordaPertences, setConcordaPertences] = useState(null); // null | true | false
  const [assinouAcolhido, setAssinouAcolhido] = useState(
    Boolean(assinaturaAcolhidoInicial)
  );
  const [assinouResponsavel, setAssinouResponsavel] = useState(
    Boolean(assinaturaResponsavelInicial)
  );

  const canvasAcolhidoRef = useRef(null);
  const canvasResponsavelRef = useRef(null);

  const paragrafosConcordancia = construirParagrafosConcordancia(nome, cpf);
  const paragrafosAcordo = construirParagrafosAcordo(nome, cpf);
  const paragrafosCelular = construirParagrafosCelular(nome, cpf);
  const paragrafosPertences = construirParagrafosPertences(nome, cpf, pertences);

  const abas = [
    { id: 'concordancia', rotulo: 'Termo de Concordância e Colaboração' },
    { id: 'acolhimento', rotulo: 'Acordo de Acolhimento' },
    { id: 'celular', rotulo: 'Termo de Entrega de Celular' },
    { id: 'pertences', rotulo: 'Responsabilidade sobre Pertences' },
  ];

  // Permite aceitar os quatro termos de uma vez (além dos checkboxes por aba).
  const todosAceitos =
    aceitaConcordancia && aceitaAcolhimento && aceitaCelular && aceitaPertences;

  const alternarTodos = (aceitar) => {
    setAceitaConcordancia(aceitar);
    setAceitaAcolhimento(aceitar);
    setAceitaCelular(aceitar);
    setAceitaPertences(aceitar);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !processando) onCancelar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancelar, processando]);

  const handleConfirmar = async () => {
    if (
      !aceitaConcordancia ||
      !aceitaAcolhimento ||
      !aceitaCelular ||
      !aceitaPertences
    ) {
      onErro?.('É necessário ler e aceitar os quatro termos para prosseguir.');
      return;
    }

    if (autorizaImagem === null) {
      onErro?.('Informe a decisão sobre o uso de imagem no Acordo de Acolhimento.');
      setAbaAtiva('acolhimento');
      return;
    }

    if (entregaCelular === null) {
      onErro?.('Informe a decisão sobre a entrega do celular no respectivo termo.');
      setAbaAtiva('celular');
      return;
    }

    if (concordaPertences === null) {
      onErro?.(
        'Informe a decisão sobre a responsabilidade pelos pertences no respectivo termo.'
      );
      setAbaAtiva('pertences');
      return;
    }

    if (!assinouAcolhido || !assinouResponsavel) {
      onErro?.('Colete a assinatura do acolhido e do responsável.');
      return;
    }

    const assinaturaAcolhido = canvasAcolhidoRef.current?.toDataURL('image/png');
    const assinaturaResponsavel =
      canvasResponsavelRef.current?.toDataURL('image/png');

    const [arquivoConcordancia, arquivoAcordo, arquivoCelular, arquivoPertences] =
      await Promise.all([
        gerarImagemDocumento({
          titulo: TITULO_CONCORDANCIA,
          paragrafos: paragrafosConcordancia,
          data,
          nome,
          nomeResponsavel,
          assinaturaAcolhidoUrl: assinaturaAcolhido,
          assinaturaResponsavelUrl: assinaturaResponsavel,
          nomeArquivo: 'termo-concordancia-terapeutica.png',
        }),
        gerarImagemDocumento({
          titulo: TITULO_ACORDO,
          paragrafos: resolverParagrafosAcordoParaImagem(
            paragrafosAcordo,
            autorizaImagem
          ),
          data,
          nome,
          nomeResponsavel,
          assinaturaAcolhidoUrl: assinaturaAcolhido,
          assinaturaResponsavelUrl: assinaturaResponsavel,
          nomeArquivo: 'termo-acolhimento.png',
        }),
        gerarImagemDocumento({
          titulo: TITULO_CELULAR,
          paragrafos: resolverParagrafosCelular(
            paragrafosCelular,
            entregaCelular
          ),
          data,
          nome,
          nomeResponsavel,
          assinaturaAcolhidoUrl: assinaturaAcolhido,
          assinaturaResponsavelUrl: assinaturaResponsavel,
          nomeArquivo: 'termo-entrega-celular.png',
        }),
        gerarImagemDocumento({
          titulo: TITULO_PERTENCES,
          paragrafos: resolverParagrafosPertences(
            paragrafosPertences,
            concordaPertences
          ),
          data,
          nome,
          nomeResponsavel,
          assinaturaAcolhidoUrl: assinaturaAcolhido,
          assinaturaResponsavelUrl: assinaturaResponsavel,
          nomeArquivo: 'termo-responsabilidade-pertences.png',
        }),
      ]);

    onConfirmar({
      assina: true,
      autorizaImagem,
      entregaCelular,
      concordaPertences,
      arquivos: [
        arquivoConcordancia && {
          file: arquivoConcordancia,
          nomeArquivo: 'Termo de Concordância Terapêutica',
        },
        arquivoAcordo && {
          file: arquivoAcordo,
          nomeArquivo: 'Termo de Acolhimento',
        },
        arquivoCelular && {
          file: arquivoCelular,
          nomeArquivo: 'Termo de Entrega de Celular',
        },
        arquivoPertences && {
          file: arquivoPertences,
          nomeArquivo: 'Termo de Responsabilidade sobre Pertences',
        },
      ].filter(Boolean),
      assinaturaAcolhido,
      assinaturaResponsavel,
    });
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={() => !processando && onCancelar()}
    >
      <div
        className="modal modal-detalhes modal-detalhes-grande"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detalhes-cabecalho">
          <div>
            <span className="detalhes-eyebrow">Termos</span>
            <h3 className="modal-titulo detalhes-nome">
              Termos de acolhimento
            </h3>
          </div>
          <button
            type="button"
            className="modal-fechar"
            onClick={onCancelar}
            disabled={processando}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="detalhes-corpo">
          <div className="form-abas" role="tablist" aria-label="Termos">
            {abas.map((aba) => (
              <button
                key={aba.id}
                type="button"
                role="tab"
                aria-selected={abaAtiva === aba.id}
                className={`form-aba-btn ${abaAtiva === aba.id ? 'ativo' : ''}`}
                onClick={() => setAbaAtiva(aba.id)}
              >
                {aba.rotulo}
              </button>
            ))}
          </div>

          <section className="detalhes-secao">
            <label className="campo-check campo-check-todos">
              <input
                type="checkbox"
                checked={todosAceitos}
                onChange={(e) => alternarTodos(e.target.checked)}
                disabled={processando}
              />
              <span>
                <strong>Li e concordo com os quatro termos</strong> (Concordância
                e Colaboração, Acolhimento, Entrega de Celular e Responsabilidade
                sobre Pertences).
              </span>
            </label>
          </section>

          {abaAtiva === 'concordancia' && (
            <>
              <section className="detalhes-secao">
                <div className="termo-texto">
                  {paragrafosConcordancia.map((p, idx) => (
                    <p key={idx}>
                      {p.rotulo && <strong>{p.rotulo} </strong>}
                      {renderTextoTermo(p)}
                    </p>
                  ))}
                </div>
              </section>

              <section className="detalhes-secao">
                <label className="campo-check">
                  <input
                    type="checkbox"
                    checked={aceitaConcordancia}
                    onChange={(e) => {
                      setAceitaConcordancia(e.target.checked);
                    }}
                    disabled={processando}
                  />
                  <span>
                    Li e concordo com o Termo de Concordância e Colaboração
                    Terapêutica.
                  </span>
                </label>
              </section>
            </>
          )}

          {abaAtiva === 'acolhimento' && (
            <>
              <section className="detalhes-secao">
                <div className="termo-texto">
                  {paragrafosAcordo.map((p, idx) => {
                    if (p.secao) {
                      return (
                        <h4 key={idx} className="termo-secao-titulo">
                          {p.secao}
                        </h4>
                      );
                    }
                    if (p.opcaoImagem) {
                      const valor = p.opcaoImagem === 'AUTORIZA';
                      return (
                        <label key={idx} className="campo-check termo-opcao-imagem">
                          <input
                            type="radio"
                            name="uso-imagem"
                            checked={autorizaImagem === valor}
                            onChange={() => {
                              setAutorizaImagem(valor);
                            }}
                            disabled={processando}
                          />
                          <span>{p.texto}</span>
                        </label>
                      );
                    }
                    return <p key={idx}>{renderTextoTermo(p)}</p>;
                  })}
                </div>
              </section>

              <section className="detalhes-secao">
                <label className="campo-check">
                  <input
                    type="checkbox"
                    checked={aceitaAcolhimento}
                    onChange={(e) => {
                      setAceitaAcolhimento(e.target.checked);
                    }}
                    disabled={processando}
                  />
                  <span>Li e concordo com o Termo de Acolhimento.</span>
                </label>
              </section>
            </>
          )}

          {abaAtiva === 'celular' && (
            <>
              <section className="detalhes-secao">
                <div className="termo-texto">
                  {paragrafosCelular.map((p, idx) => {
                    if (p.opcaoCelular) {
                      const valor = p.opcaoCelular === 'ENTREGA';
                      return (
                        <label key={idx} className="campo-check termo-opcao-imagem">
                          <input
                            type="radio"
                            name="entrega-celular"
                            checked={entregaCelular === valor}
                            onChange={() => {
                              setEntregaCelular(valor);
                            }}
                            disabled={processando}
                          />
                          <span>{p.texto}</span>
                        </label>
                      );
                    }
                    return (
                      <p key={idx}>
                        {p.rotulo && <strong>{p.rotulo} </strong>}
                        {renderTextoTermo(p)}
                      </p>
                    );
                  })}
                </div>
              </section>

              <section className="detalhes-secao">
                <label className="campo-check">
                  <input
                    type="checkbox"
                    checked={aceitaCelular}
                    onChange={(e) => {
                      setAceitaCelular(e.target.checked);
                    }}
                    disabled={processando}
                  />
                  <span>Li e concordo com o Termo de Entrega de Celular.</span>
                </label>
              </section>
            </>
          )}

          {abaAtiva === 'pertences' && (
            <>
              <section className="detalhes-secao">
                <div className="termo-texto">
                  {paragrafosPertences.map((p, idx) => {
                    if (p.secao) {
                      return (
                        <h4 key={idx} className="termo-secao-titulo">
                          {p.secao}
                        </h4>
                      );
                    }
                    if (p.opcaoPertences) {
                      const valor = p.opcaoPertences === 'CONCORDA';
                      return (
                        <label
                          key={idx}
                          className="campo-check termo-opcao-imagem"
                        >
                          <input
                            type="radio"
                            name="responsabilidade-pertences"
                            checked={concordaPertences === valor}
                            onChange={() => {
                              setConcordaPertences(valor);
                            }}
                            disabled={processando}
                          />
                          <span>{p.texto}</span>
                        </label>
                      );
                    }
                    return (
                      <p key={idx}>
                        {p.rotulo && <strong>{p.rotulo} </strong>}
                        {renderTextoTermo(p)}
                      </p>
                    );
                  })}
                </div>
              </section>

              <section className="detalhes-secao">
                <label className="campo-check">
                  <input
                    type="checkbox"
                    checked={aceitaPertences}
                    onChange={(e) => {
                      setAceitaPertences(e.target.checked);
                    }}
                    disabled={processando}
                  />
                  <span>
                    Li e concordo com o Termo de Responsabilidade sobre
                    Pertences.
                  </span>
                </label>
              </section>
            </>
          )}

          <section className="detalhes-secao">
            <div className="termo-data">
              <strong>Data do acolhimento:</strong> {data || 'Não informada'}
            </div>

            <div className="assinaturas-grid">
              <div className="campo">
                <label>Assinatura do acolhido</label>
                <span className="campo-ajuda">{nome || '—'}</span>
                <AssinaturaPad
                  id="assinatura-acolhido"
                  canvasRef={canvasAcolhidoRef}
                  onMudar={setAssinouAcolhido}
                  disabled={processando}
                  valorInicial={assinaturaAcolhidoInicial}
                />
              </div>

              <div className="campo">
                <label>Assinatura do responsável</label>
                <span className="campo-ajuda">{nomeResponsavel || '—'}</span>
                <AssinaturaPad
                  id="assinatura-responsavel"
                  canvasRef={canvasResponsavelRef}
                  onMudar={setAssinouResponsavel}
                  disabled={processando}
                  valorInicial={assinaturaResponsavelInicial}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="modal-acoes detalhes-acoes">
          <button
            type="button"
            className="btn btn-secundario"
            onClick={onCancelar}
            disabled={processando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primario"
            onClick={handleConfirmar}
            disabled={processando}
          >
            {processando ? 'Salvando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
