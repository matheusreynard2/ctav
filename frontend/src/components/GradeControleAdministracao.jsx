import {
  PERIODOS_CONTROLE,
  chaveRegistroAdministracao,
  formatarDiaControle,
} from '../utils/controleMedicamentos';

export default function GradeControleAdministracao({
  dias = [],
  prescricoesComDose = [],
  registros = {},
  rotuloMesAno = '',
  somenteLeitura = false,
  carregandoRegistros = false,
  salvando,
  onAlternarTomado,
}) {
  if (prescricoesComDose.length === 0 || dias.length === 0) {
    return null;
  }

  return (
    <div className="controle-grade-mes">
      <div className="controle-grade-topo">
        <h3 className="controle-grade-titulo">{rotuloMesAno}</h3>
        {carregandoRegistros && (
          <span className="controle-carregando">Carregando marcações...</span>
        )}
      </div>

      <div className="tabela-wrapper">
        <table className="tabela tabela-controle-mes">
          <thead>
            <tr>
              <th className="col-dia">Dia</th>
              <th className="col-medicamento">Medicamento</th>
              {PERIODOS_CONTROLE.map((p) => (
                <th key={p.chave} className="col-periodo">
                  {p.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dias.map((dataIso) =>
              prescricoesComDose.map((presc, idx) => (
                <tr
                  key={`${dataIso}-${presc.medicamentoId}`}
                  className={idx === 0 ? 'controle-linha-inicio-dia' : ''}
                >
                  {idx === 0 && (
                    <th
                      scope="row"
                      rowSpan={prescricoesComDose.length}
                      className="controle-dia-celula"
                    >
                      {formatarDiaControle(dataIso)}
                    </th>
                  )}
                  <th scope="row" className="controle-med-celula">
                    <span className="controle-med-nome">{presc.medicamentoNome}</span>
                  </th>
                  {PERIODOS_CONTROLE.map((p) => {
                    const dose = presc[p.campoDose] || 0;
                    const chave = chaveRegistroAdministracao(
                      dataIso,
                      presc.medicamentoId,
                      p.chave
                    );
                    const tomado = Boolean(registros[chave]);

                    if (dose <= 0) {
                      return (
                        <td key={p.chave} className="controle-sem-dose">
                          —
                        </td>
                      );
                    }

                    if (somenteLeitura) {
                      return (
                        <td key={p.chave}>
                          <span className="controle-celula controle-celula-compacta">
                            <span className="controle-dose">
                              {dose} {dose === 1 ? 'comp.' : 'comps.'}
                            </span>
                            <span
                              className={`controle-status ${tomado ? 'tomou' : 'pendente'}`}
                            >
                              {tomado ? 'Tomou' : 'Não tomou'}
                            </span>
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={p.chave}>
                        <label className="controle-celula controle-celula-compacta">
                          <span className="controle-dose">
                            {dose} {dose === 1 ? 'comp.' : 'comps.'}
                          </span>
                          <input
                            type="checkbox"
                            checked={tomado}
                            disabled={salvando?.has(chave) || carregandoRegistros}
                            onChange={() =>
                              onAlternarTomado?.(
                                dataIso,
                                presc.medicamentoId,
                                p.chave,
                                tomado
                              )
                            }
                            aria-label={`${formatarDiaControle(dataIso)} — ${presc.medicamentoNome} — ${p.rotulo}`}
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
