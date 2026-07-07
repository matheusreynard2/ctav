import { useEffect, useMemo, useState } from 'react';
import { administracaoService, prescricaoService } from '../api';
import {
  MESES_CONTROLE,
  PERIODOS_CONTROLE,
  chaveRegistroAdministracao,
  diasDoMes,
  mapaRegistrosAdministracao,
  prescricoesComDose,
  rotuloMesAno,
} from '../utils/controleMedicamentos';
import GradeControleAdministracao from './GradeControleAdministracao';

const anoDaData = (iso) =>
  iso && iso.length >= 4 ? Number(iso.slice(0, 4)) : null;

const normalizarPrescricoes = (acolhido) =>
  (Array.isArray(acolhido?.prescricoes) ? acolhido.prescricoes : [])
    .filter((p) => p?.medicamentoId != null)
    .map((p) => ({
      medicamentoId: p.medicamentoId,
      medicamentoNome: p.medicamentoNome ?? 'Medicamento',
      doseManha: p.doseManha ?? 0,
      doseTarde: p.doseTarde ?? 0,
      doseNoite: p.doseNoite ?? 0,
    }));

export default function ControleMedicamentos({
  acolhidos = [],
  carregando = false,
  onErro,
  onSucesso,
  onRecarregarAcolhidos,
}) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const anosDisponiveis = useMemo(() => {
    const anos = new Set([anoAtual]);
    acolhidos.forEach((a) => {
      const ano = anoDaData(a.dataAcolhimentoCtav);
      if (ano) anos.add(ano);
      if (a.alta) {
        const anoAlta = anoDaData(a.dataAlta);
        if (anoAlta) anos.add(anoAlta);
      }
    });
    return [...anos].sort((x, y) => y - x);
  }, [acolhidos, anoAtual]);

  const acolhidosOrdenados = useMemo(
    () => [...acolhidos].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '')),
    [acolhidos]
  );

  const [ano, setAno] = useState(String(anoAtual));
  const [mes, setMes] = useState(String(mesAtual));
  const [acolhidoId, setAcolhidoId] = useState('');
  const [prescricoesLocais, setPrescricoesLocais] = useState([]);
  const [registros, setRegistros] = useState({});
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  const [salvando, setSalvando] = useState(() => new Set());
  const [salvandoDoses, setSalvandoDoses] = useState(false);

  const acolhidoSelecionado = useMemo(
    () => acolhidosOrdenados.find((a) => String(a.id) === String(acolhidoId)) ?? null,
    [acolhidosOrdenados, acolhidoId]
  );

  useEffect(() => {
    setPrescricoesLocais(normalizarPrescricoes(acolhidoSelecionado));
  }, [acolhidoSelecionado]);

  const prescricoesGrade = useMemo(
    () => prescricoesComDose({ prescricoes: prescricoesLocais }),
    [prescricoesLocais]
  );

  const dias = useMemo(() => {
    const a = Number(ano);
    const m = Number(mes);
    if (!a || !m) return [];
    return diasDoMes(a, m);
  }, [ano, mes]);

  const rotulo = useMemo(
    () => rotuloMesAno(Number(ano), Number(mes)),
    [ano, mes]
  );

  useEffect(() => {
    let ativo = true;
    const a = Number(ano);
    const m = Number(mes);
    if (!acolhidoId || !a || !m) {
      setRegistros({});
      return () => {
        ativo = false;
      };
    }
    setCarregandoRegistros(true);
    administracaoService
      .listarMes(acolhidoId, a, m)
      .then((lista) => {
        if (!ativo) return;
        setRegistros(mapaRegistrosAdministracao(lista));
      })
      .catch(() => {
        if (!ativo) return;
        setRegistros({});
        onErro?.('Não foi possível carregar o controle de administração do mês.');
      })
      .finally(() => {
        if (ativo) setCarregandoRegistros(false);
      });
    return () => {
      ativo = false;
    };
  }, [acolhidoId, ano, mes, onErro]);

  const alterarDose = (medicamentoId, campo, valor) => {
    const soDigitos = valor.replace(/\D/g, '');
    setPrescricoesLocais((atual) =>
      atual.map((p) =>
        p.medicamentoId === medicamentoId
          ? { ...p, [campo]: soDigitos === '' ? 0 : Number(soDigitos) }
          : p
      )
    );
  };

  const salvarDoses = async () => {
    if (!acolhidoId || prescricoesLocais.length === 0) return;
    setSalvandoDoses(true);
    try {
      const atualizadas = await prescricaoService.atualizarDoses(
        acolhidoId,
        prescricoesLocais.map((p) => ({
          medicamentoId: p.medicamentoId,
          doseManha: Number(p.doseManha) || 0,
          doseTarde: Number(p.doseTarde) || 0,
          doseNoite: Number(p.doseNoite) || 0,
        }))
      );
      setPrescricoesLocais(
        (Array.isArray(atualizadas) ? atualizadas : prescricoesLocais).map((p) => ({
          medicamentoId: p.medicamentoId,
          medicamentoNome: p.medicamentoNome ?? 'Medicamento',
          doseManha: p.doseManha ?? 0,
          doseTarde: p.doseTarde ?? 0,
          doseNoite: p.doseNoite ?? 0,
        }))
      );
      onRecarregarAcolhidos?.();
      onSucesso?.('Doses salvas com sucesso.');
    } catch {
      onErro?.('Não foi possível salvar as doses. Tente novamente.');
    } finally {
      setSalvandoDoses(false);
    }
  };

  const alternarTomado = async (data, medicamentoId, periodo, valorAtual) => {
    const chave = chaveRegistroAdministracao(data, medicamentoId, periodo);
    const novoValor = !valorAtual;
    setRegistros((atual) => ({ ...atual, [chave]: novoValor }));
    setSalvando((atual) => new Set(atual).add(chave));
    try {
      await administracaoService.marcar(acolhidoId, {
        medicamentoId,
        data,
        periodo,
        tomado: novoValor,
      });
    } catch {
      setRegistros((atual) => ({ ...atual, [chave]: valorAtual }));
      onErro?.('Não foi possível salvar a marcação. Tente novamente.');
    } finally {
      setSalvando((atual) => {
        const novo = new Set(atual);
        novo.delete(chave);
        return novo;
      });
    }
  };

  const pronto = acolhidoId && ano && mes && dias.length > 0;

  return (
    <section className="card controle-medicamentos">
      <div className="relatorios-cabecalho">
        <div>
          <h2>Controle de administração</h2>
          <p className="relatorios-subtitulo">
            Selecione o ano, o mês e o acolhido. Defina aqui quantos comprimidos
            o acolhido toma em cada período e registre dia a dia a administração.
          </p>
        </div>
      </div>

      {carregando ? (
        <p className="vazio">Carregando dados...</p>
      ) : acolhidosOrdenados.length === 0 ? (
        <p className="vazio">Nenhum acolhido cadastrado.</p>
      ) : (
        <>
          <div className="controle-filtros">
            <div className="campo">
              <label htmlFor="controle-ano">Ano</label>
              <select
                id="controle-ano"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              >
                {anosDisponiveis.map((a) => (
                  <option key={a} value={a}>
                    {a}
                    {a === anoAtual ? ' (ano vigente)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="controle-mes">Mês</label>
              <select
                id="controle-mes"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
              >
                {MESES_CONTROLE.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.rotulo}
                    {Number(ano) === anoAtual && m.valor === mesAtual
                      ? ' (mês vigente)'
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="controle-acolhido">Acolhido</label>
              <select
                id="controle-acolhido"
                value={acolhidoId}
                onChange={(e) => setAcolhidoId(e.target.value)}
              >
                <option value="">Selecione o acolhido...</option>
                {acolhidosOrdenados.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                    {a.cpf ? ` — CPF ${a.cpf}` : ''}
                    {a.quarto ? ` — Quarto ${a.quarto}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!acolhidoId ? (
            <p className="vazio">Selecione o acolhido para configurar doses e exibir a grade.</p>
          ) : prescricoesLocais.length === 0 ? (
            <p className="vazio">
              Este acolhido não possui medicamentos vinculados. Inclua medicamentos
              no cadastro ou edição do acolhido.
            </p>
          ) : (
            <>
              <div className="controle-doses-painel">
                <div className="controle-doses-topo">
                  <h3 className="controle-doses-titulo">Doses por período (comprimidos)</h3>
                  <button
                    type="button"
                    className="btn btn-primario btn-pequeno"
                    onClick={salvarDoses}
                    disabled={salvandoDoses}
                  >
                    {salvandoDoses ? 'Salvando...' : 'Salvar doses'}
                  </button>
                </div>

                <div className="tabela-wrapper">
                  <table className="tabela tabela-controle-doses">
                    <thead>
                      <tr>
                        <th>Medicamento</th>
                        {PERIODOS_CONTROLE.map((p) => (
                          <th key={p.chave}>{p.rotulo}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prescricoesLocais.map((p) => (
                        <tr key={p.medicamentoId}>
                          <th scope="row">{p.medicamentoNome}</th>
                          {PERIODOS_CONTROLE.map((periodo) => (
                            <td key={periodo.chave}>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={3}
                                className="controle-dose-input"
                                value={p[periodo.campoDose] ?? 0}
                                onChange={(e) =>
                                  alterarDose(
                                    p.medicamentoId,
                                    periodo.campoDose,
                                    e.target.value
                                  )
                                }
                                aria-label={`${periodo.rotulo} — ${p.medicamentoNome}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!pronto ? (
                <p className="vazio">Selecione ano e mês válidos.</p>
              ) : prescricoesGrade.length === 0 ? (
                <p className="vazio">
                  Informe ao menos uma dose acima e clique em Salvar doses para
                  exibir a grade de administração.
                </p>
              ) : (
                <>
                  <GradeControleAdministracao
                    dias={dias}
                    prescricoesComDose={prescricoesGrade}
                    registros={registros}
                    rotuloMesAno={rotulo}
                    carregandoRegistros={carregandoRegistros}
                    salvando={salvando}
                    onAlternarTomado={alternarTomado}
                  />
                  <p className="relatorios-legenda">
                    Marque a caixa quando o acolhido tomar o medicamento no período.
                    Só aparecem os períodos com dose definida acima.
                  </p>
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
