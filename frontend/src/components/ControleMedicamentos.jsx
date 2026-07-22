import { useEffect, useMemo, useState } from 'react';
import { administracaoService, prescricaoService } from '../api';
import {
  MESES_CONTROLE,
  PERIODOS_CONTROLE,
  chaveRegistroAdministracao,
  diasDoMes,
  mapaRegistrosAdministracao,
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
      totalComprimidos: p.totalComprimidos ?? 0,
    }));

export default function ControleMedicamentos({
  acolhidos = [],
  carregando = false,
  onErro,
  onSucesso,
  onRecarregarAcolhidos,
  onRecarregarMedicamentos,
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
  // Estado das marcações como está no servidor (base para detectar pendências).
  const [registrosBase, setRegistrosBase] = useState({});
  // Marcações alteradas e ainda não salvas: chave -> { medicamentoId, data, periodo }.
  const [pendentes, setPendentes] = useState(() => new Map());
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  const [salvandoAdmin, setSalvandoAdmin] = useState(false);
  const [salvandoDoses, setSalvandoDoses] = useState(false);
  // Início (índice) da semana exibida na grade — múltiplo de 7 dentro do mês.
  const [semanaInicio, setSemanaInicio] = useState(0);

  const acolhidoSelecionado = useMemo(
    () => acolhidosOrdenados.find((a) => String(a.id) === String(acolhidoId)) ?? null,
    [acolhidosOrdenados, acolhidoId]
  );

  // Data de hoje (YYYY-MM-DD, local). Dias anteriores a hoje ficam bloqueados
  // para administração; a comparação de strings ISO já é cronológica.
  const hojeIso = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  // Doses efetivamente salvas no acolhido (fonte usada pelo backend para o
  // débito de estoque). O editor abaixo usa prescricoesLocais (edição livre).
  const prescricoesSalvas = useMemo(
    () => normalizarPrescricoes(acolhidoSelecionado),
    [acolhidoSelecionado]
  );

  useEffect(() => {
    setPrescricoesLocais(normalizarPrescricoes(acolhidoSelecionado));
  }, [acolhidoSelecionado]);

  // Medicamentos que possuem alguma marcação no mês exibido. A chave tem o
  // formato "YYYY-MM-DD-<medId>-<PERIODO>", então o id fica na posição 3.
  const medsComRegistroMes = useMemo(() => {
    const set = new Set();
    Object.keys(registros).forEach((chave) => {
      const partes = chave.split('-');
      if (partes.length >= 5) {
        const medId = Number(partes[3]);
        if (Number.isFinite(medId)) set.add(medId);
      }
    });
    return set;
  }, [registros]);

  // A grade reflete as doses JÁ SALVAS. Além dos medicamentos com dose atual,
  // inclui os que possuem marcações no mês (para que períodos zerados continuem
  // aparecendo nos dias passados que já tinham registro).
  const prescricoesGrade = useMemo(
    () =>
      prescricoesSalvas.filter((p) => {
        const temDose =
          (Number(p.doseManha) || 0) +
            (Number(p.doseTarde) || 0) +
            (Number(p.doseNoite) || 0) >
          0;
        return temDose || medsComRegistroMes.has(p.medicamentoId);
      }),
    [prescricoesSalvas, medsComRegistroMes]
  );

  const dias = useMemo(() => {
    const a = Number(ano);
    const m = Number(mes);
    if (!a || !m) return [];
    return diasDoMes(a, m);
  }, [ano, mes]);

  // A grade é exibida por semana (7 dias por vez) para não ficar muito longa.
  const totalSemanas = Math.max(1, Math.ceil(dias.length / 7));
  const diasSemana = useMemo(
    () => dias.slice(semanaInicio, semanaInicio + 7),
    [dias, semanaInicio]
  );

  // Ao trocar de mês/ano, posiciona a semana na que contém hoje (mês vigente)
  // ou na primeira semana do mês.
  useEffect(() => {
    if (dias.length === 0) {
      setSemanaInicio(0);
      return;
    }
    let inicio = 0;
    if (Number(ano) === anoAtual && Number(mes) === mesAtual) {
      const idx = dias.indexOf(hojeIso);
      if (idx >= 0) inicio = Math.floor(idx / 7) * 7;
    }
    setSemanaInicio(inicio);
  }, [dias, ano, mes, anoAtual, mesAtual, hojeIso]);

  const irSemanaAnterior = () =>
    setSemanaInicio((s) => Math.max(0, s - 7));
  const irProximaSemana = () =>
    setSemanaInicio((s) => Math.min((totalSemanas - 1) * 7, s + 7));

  const rotuloSemana = useMemo(() => {
    if (diasSemana.length === 0) return '';
    const primeiro = diasSemana[0].slice(8, 10);
    const ultimo = diasSemana[diasSemana.length - 1].slice(8, 10);
    const numeroSemana = Math.floor(semanaInicio / 7) + 1;
    return `Dias ${primeiro}–${ultimo} (semana ${numeroSemana} de ${totalSemanas})`;
  }, [diasSemana, semanaInicio, totalSemanas]);

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
      setRegistrosBase({});
      setPendentes(new Map());
      return () => {
        ativo = false;
      };
    }
    setCarregandoRegistros(true);
    administracaoService
      .listarMes(acolhidoId, a, m)
      .then((lista) => {
        if (!ativo) return;
        const mapa = mapaRegistrosAdministracao(lista);
        setRegistros(mapa);
        setRegistrosBase(mapa);
        setPendentes(new Map());
      })
      .catch(() => {
        if (!ativo) return;
        setRegistros({});
        setRegistrosBase({});
        setPendentes(new Map());
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
      // As marcações dos períodos sem alteração são preservadas; os períodos
      // cuja dose mudou têm as marcações limpas no servidor (checkbox volta a
      // ficar vazio). Recarrega a grade para refletir o estado atual.
      const a = Number(ano);
      const m = Number(mes);
      if (a && m) {
        const lista = await administracaoService.listarMes(acolhidoId, a, m);
        const mapa = mapaRegistrosAdministracao(lista);
        setRegistros(mapa);
        setRegistrosBase(mapa);
        setPendentes(new Map());
      }
      onRecarregarAcolhidos?.();
      // O estoque pode ter sido reposto ao limpar marcações de períodos alterados.
      onRecarregarMedicamentos?.();
      onSucesso?.('Doses salvas com sucesso.');
    } catch (err) {
      onErro?.(
        err?.response?.data?.message
          || 'Não foi possível salvar as doses. Tente novamente.'
      );
    } finally {
      setSalvandoDoses(false);
    }
  };

  // Alterna a marcação apenas localmente (não persiste). As mudanças ficam
  // pendentes até o usuário clicar em "Salvar administração".
  const alternarTomado = (data, medicamentoId, periodo, valorAtual) => {
    // Dias anteriores a hoje ficam bloqueados: só é possível administrar
    // (marcar/desmarcar) em dias de hoje em diante.
    if (data < hojeIso) {
      onErro?.(
        'Não é possível alterar a administração de dias anteriores a hoje.'
      );
      return;
    }

    const chave = chaveRegistroAdministracao(data, medicamentoId, periodo);
    const novoValor = !valorAtual;

    setRegistros((atual) => ({ ...atual, [chave]: novoValor }));
    setPendentes((atual) => {
      const novo = new Map(atual);
      const base = Boolean(registrosBase[chave]);
      // Se voltou ao valor do servidor, deixa de ser uma pendência.
      if (novoValor === base) novo.delete(chave);
      else novo.set(chave, { medicamentoId, data, periodo });
      return novo;
    });
  };

  // Persiste todas as marcações pendentes de uma vez. O débito/crédito de
  // estoque reservado ocorre no servidor a cada marcação.
  const salvarAdministracao = async () => {
    if (salvandoAdmin || pendentes.size === 0) return;
    setSalvandoAdmin(true);
    const erros = [];
    try {
      for (const [chave, info] of pendentes) {
        try {
          await administracaoService.marcar(acolhidoId, {
            medicamentoId: info.medicamentoId,
            data: info.data,
            periodo: info.periodo,
            tomado: Boolean(registros[chave]),
          });
        } catch (err) {
          erros.push(
            err?.response?.data?.message
              || 'Não foi possível salvar uma das marcações.'
          );
        }
      }
      // Recarrega do servidor para refletir o estado real (e o estoque).
      const a = Number(ano);
      const m = Number(mes);
      if (a && m) {
        const lista = await administracaoService.listarMes(acolhidoId, a, m);
        const mapa = mapaRegistrosAdministracao(lista);
        setRegistros(mapa);
        setRegistrosBase(mapa);
      }
      setPendentes(new Map());
      onRecarregarAcolhidos?.();
      onRecarregarMedicamentos?.();
      if (erros.length > 0) onErro?.(erros[0]);
      else onSucesso?.('Administração salva com sucesso.');
    } finally {
      setSalvandoAdmin(false);
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
                  <div className="controle-semana-nav">
                    <button
                      type="button"
                      className="btn btn-secundario btn-pequeno"
                      onClick={irSemanaAnterior}
                      disabled={semanaInicio === 0}
                    >
                      ◀ Semana anterior
                    </button>
                    <span className="controle-semana-rotulo">{rotuloSemana}</span>
                    <button
                      type="button"
                      className="btn btn-secundario btn-pequeno"
                      onClick={irProximaSemana}
                      disabled={semanaInicio + 7 >= dias.length}
                    >
                      Próxima semana ▶
                    </button>
                  </div>
                  <div className="controle-admin-salvar">
                    <button
                      type="button"
                      className="btn btn-primario btn-pequeno"
                      onClick={salvarAdministracao}
                      disabled={salvandoAdmin || pendentes.size === 0}
                    >
                      {salvandoAdmin
                        ? 'Salvando...'
                        : `Salvar administração${
                            pendentes.size ? ` (${pendentes.size})` : ''
                          }`}
                    </button>
                  </div>
                  <GradeControleAdministracao
                    dias={diasSemana}
                    prescricoesComDose={prescricoesGrade}
                    registros={registros}
                    rotuloMesAno={rotulo}
                    hoje={hojeIso}
                    carregandoRegistros={carregandoRegistros}
                    salvando={salvandoAdmin ? { has: () => true } : undefined}
                    onAlternarTomado={alternarTomado}
                  />
                  <p className="relatorios-legenda">
                    Marque as caixas conforme o acolhido tomar o medicamento e clique
                    em <strong>Salvar administração</strong> para gravar todas as
                    marcações de uma vez. Os dias anteriores a hoje ficam bloqueados
                    (apenas leitura). Use os botões acima para navegar entre as
                    semanas do mês.
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
