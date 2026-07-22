import { useEffect, useMemo, useState } from 'react';
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
import { baixarOdt } from '../utils/odt.js';
import { baixarPdf } from '../utils/pdf.js';
import { pertenceService } from '../api.js';

const slug = (nome) =>
  (nome ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40);

// Converte a data ISO (YYYY-MM-DD) para o formato dd/mm/aaaa. Retorna vazio
// quando não houver data.
const formatarData = (iso) => {
  if (!iso) return '';
  const partes = String(iso).slice(0, 10).split('-');
  if (partes.length !== 3) return '';
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
};

const rotuloImagem = (valor) => {
  if (valor === true) return 'Autorizado';
  if (valor === false) return 'Não autorizado';
  return 'Não informado';
};

const rotuloEntrega = (valor) => {
  if (valor === true) return 'Sim, entregou o aparelho';
  if (valor === false) return 'Não entregou o aparelho';
  return 'Não informado';
};

const rotuloConcorda = (valor) => {
  if (valor === true) return 'Assumiu a responsabilidade';
  if (valor === false) return 'Não assumiu a responsabilidade';
  return 'Não informado';
};

const previewLinhas = (paragrafos) =>
  paragrafos.map((p) => {
    if (p.secao) return { tipo: 'secao', texto: p.secao };
    if (p.rotulo) return { tipo: 'rotulo', rotulo: p.rotulo, texto: p.texto };
    return { tipo: 'texto', texto: p.texto, partes: p.partes };
  });

// Renderiza os segmentos de um parágrafo destacando as lacunas (preenchidas ou
// vazias) em azul.
const renderPartes = (partes) =>
  partes.map((parte, i) =>
    parte.preenchivel ? (
      <mark key={i} className="campo-preenchivel">
        {parte.texto}
      </mark>
    ) : (
      <span key={i}>{parte.texto}</span>
    )
  );

export default function Documentos({ acolhidos = [], responsaveis = [], onErro }) {
  const [acolhidoId, setAcolhidoId] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [gerando, setGerando] = useState(null); // `${id}-odf` | `${id}-pdf`
  const [pertences, setPertences] = useState([]);

  const acolhidosOrdenados = useMemo(
    () =>
      [...acolhidos].sort((a, b) =>
        String(a.nome ?? '').localeCompare(String(b.nome ?? ''))
      ),
    [acolhidos]
  );
  const responsaveisOrdenados = useMemo(
    () =>
      [...responsaveis].sort((a, b) =>
        String(a.nome ?? '').localeCompare(String(b.nome ?? ''))
      ),
    [responsaveis]
  );

  const acolhido = acolhidosOrdenados.find(
    (a) => String(a.id) === String(acolhidoId)
  );
  const responsavel = responsaveisOrdenados.find(
    (r) => String(r.id) === String(responsavelId)
  );

  // Ao escolher o acolhido, seleciona automaticamente o responsável vinculado.
  useEffect(() => {
    if (acolhido?.responsavelId != null) {
      setResponsavelId(String(acolhido.responsavelId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acolhidoId]);

  // Carrega os pertences do acolhido selecionado para relacioná-los no Termo de
  // Responsabilidade sobre Pertences. Sem seleção, a lista fica vazia.
  useEffect(() => {
    if (!acolhidoId) {
      setPertences([]);
      return;
    }
    let ativo = true;
    pertenceService
      .listar(acolhidoId)
      .then((lista) => {
        if (ativo) setPertences(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (ativo) setPertences([]);
      });
    return () => {
      ativo = false;
    };
  }, [acolhidoId]);

  const nome = acolhido?.nome || '';
  const cpf = acolhido?.cpf || '';
  const dataAcolhimento = formatarData(acolhido?.dataAcolhimentoCtav);
  const autorizaUsoImagem = acolhido ? acolhido.autorizaUsoImagem ?? null : null;
  const entregaCelular = acolhido ? acolhido.entregaCelular ?? null : null;
  const concordaPertences = acolhido ? acolhido.concordaPertences ?? null : null;
  const assinaturaAcolhidoUrl = acolhido?.assinaturaAcolhido || null;
  const assinaturaResponsavelUrl =
    responsavel?.assinatura ?? acolhido?.assinaturaResponsavel ?? null;
  const nomeResponsavel = responsavel?.nome || acolhido?.responsavelNome || '';

  // Documentos preenchidos com os dados do acolhido/responsável selecionados.
  // Sem seleção, as lacunas ficam em branco (____) e as opções desmarcadas.
  const documentos = useMemo(
    () => [
      {
        id: 'concordancia',
        titulo: TITULO_CONCORDANCIA,
        descricao:
          'Concordância do acolhido com as atividades terapêuticas de reinserção social.',
        arquivoBase: 'termo-concordancia-colaboracao',
        paragrafos: construirParagrafosConcordancia(nome, cpf),
      },
      {
        id: 'acolhimento',
        titulo: TITULO_ACORDO,
        descricao:
          'Acordo de acolhimento voluntário na Casa Terapêutica Águas Vivas.',
        arquivoBase: 'termo-acolhimento',
        paragrafos: resolverParagrafosAcordoParaImagem(
          construirParagrafosAcordo(nome, cpf),
          autorizaUsoImagem
        ),
      },
      {
        id: 'celular',
        titulo: TITULO_CELULAR,
        descricao:
          'Registro da entrega e guarda do aparelho celular durante o acolhimento.',
        arquivoBase: 'termo-entrega-celular',
        paragrafos: resolverParagrafosCelular(
          construirParagrafosCelular(nome, cpf),
          entregaCelular
        ),
      },
      {
        id: 'pertences',
        titulo: TITULO_PERTENCES,
        descricao:
          'Relação e termo de responsabilidade pelos pertences pessoais em posse do acolhido.',
        arquivoBase: 'termo-responsabilidade-pertences',
        paragrafos: resolverParagrafosPertences(
          construirParagrafosPertences(nome, cpf, pertences),
          concordaPertences
        ),
      },
    ],
    [nome, cpf, autorizaUsoImagem, entregaCelular, concordaPertences, pertences]
  );

  const gerar = async (doc, formato) => {
    setGerando(`${doc.id}-${formato}`);
    try {
      const opcoes = {
        data: dataAcolhimento || null,
        nomeAcolhido: nome || null,
        nomeResponsavel: nomeResponsavel || null,
        assinaturaAcolhidoUrl,
        assinaturaResponsavelUrl,
      };
      const sufixo = acolhido && slug(nome) ? `-${slug(nome)}` : '';
      if (formato === 'pdf') {
        await baixarPdf(
          doc.titulo,
          doc.paragrafos,
          `${doc.arquivoBase}${sufixo}.pdf`,
          opcoes
        );
      } else {
        baixarOdt(
          doc.titulo,
          doc.paragrafos,
          `${doc.arquivoBase}${sufixo}.odt`,
          opcoes
        );
      }
    } catch (e) {
      onErro?.(
        e?.message ||
          `Não foi possível gerar o documento em ${formato.toUpperCase()}. Tente novamente.`
      );
    } finally {
      setGerando(null);
    }
  };

  const iconeDownload = (
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
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  return (
    <div className="card">
      <div className="form-cabecalho">
        <h2>Documentos</h2>
      </div>

      <p className="documentos-intro">
        Selecione um acolhido e o responsável para visualizar os quatro termos já
        preenchidos com os dados do cadastro, as opções escolhidas e as
        assinaturas. Sem seleção, os modelos ficam em branco (
        <code>____</code>) para preenchimento manual. Gere cada documento em ODF
        (.odt) ou PDF.
      </p>

      <div className="documento-seletores">
        <div className="campo">
          <label htmlFor="doc-acolhido-sel">Acolhido</label>
          <select
            id="doc-acolhido-sel"
            value={acolhidoId}
            onChange={(e) => setAcolhidoId(e.target.value)}
          >
            <option value="">Modelo em branco</option>
            {acolhidosOrdenados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
                {a.cpf ? ` — ${a.cpf}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="doc-responsavel-sel">Responsável</label>
          <select
            id="doc-responsavel-sel"
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {responsaveisOrdenados.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
                {r.cpf ? ` — ${r.cpf}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {acolhido && (
        <section className="documento-resumo">
          <h3 className="documento-resumo-titulo">
            Opções e assinaturas registradas
          </h3>
          <div className="documento-resumo-grade">
            <div className="documento-resumo-item">
              <span className="documento-resumo-rotulo">Uso de imagem</span>
              <span className="documento-resumo-valor">
                {rotuloImagem(autorizaUsoImagem)}
              </span>
            </div>
            <div className="documento-resumo-item">
              <span className="documento-resumo-rotulo">Entrega de celular</span>
              <span className="documento-resumo-valor">
                {rotuloEntrega(entregaCelular)}
              </span>
            </div>
            <div className="documento-resumo-item">
              <span className="documento-resumo-rotulo">
                Responsabilidade sobre pertences
              </span>
              <span className="documento-resumo-valor">
                {rotuloConcorda(concordaPertences)}
              </span>
            </div>
            <div className="documento-resumo-item">
              <span className="documento-resumo-rotulo">
                Assinatura do acolhido
              </span>
              {assinaturaAcolhidoUrl ? (
                <img
                  className="assinatura-imagem"
                  src={assinaturaAcolhidoUrl}
                  alt="Assinatura do acolhido"
                />
              ) : (
                <span className="documento-resumo-valor">Sem assinatura</span>
              )}
            </div>
            <div className="documento-resumo-item">
              <span className="documento-resumo-rotulo">
                Assinatura do responsável ({nomeResponsavel || '—'})
              </span>
              {assinaturaResponsavelUrl ? (
                <img
                  className="assinatura-imagem"
                  src={assinaturaResponsavelUrl}
                  alt="Assinatura do responsável"
                />
              ) : (
                <span className="documento-resumo-valor">Sem assinatura</span>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="documentos-grade">
        {documentos.map((doc) => (
          <section key={doc.id} className="documento-card">
            <div className="documento-card-cabecalho">
              <div>
                <h3 className="documento-titulo">{doc.titulo}</h3>
                <p className="documento-descricao">{doc.descricao}</p>
              </div>
              <div className="documento-card-acoes">
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => gerar(doc, 'odf')}
                  disabled={gerando === `${doc.id}-odf`}
                >
                  {iconeDownload}
                  {gerando === `${doc.id}-odf` ? 'Gerando...' : 'Gerar ODF'}
                </button>
                <button
                  type="button"
                  className="btn btn-primario"
                  onClick={() => gerar(doc, 'pdf')}
                  disabled={gerando === `${doc.id}-pdf`}
                >
                  {iconeDownload}
                  {gerando === `${doc.id}-pdf` ? 'Gerando...' : 'Gerar PDF'}
                </button>
              </div>
            </div>

            <div className="documento-preview termo-texto">
              {previewLinhas(doc.paragrafos).map((linha, idx) => {
                if (linha.tipo === 'secao') {
                  return (
                    <h4 key={idx} className="termo-secao-titulo">
                      {linha.texto}
                    </h4>
                  );
                }
                return (
                  <p key={idx}>
                    {linha.rotulo && <strong>{linha.rotulo} </strong>}
                    {linha.partes ? renderPartes(linha.partes) : linha.texto}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
