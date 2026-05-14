import { useEffect } from 'react';

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

const Campo = ({ label, valor, largo = false }) => (
  <div className={`detalhes-campo ${largo ? 'detalhes-campo-largo' : ''}`}>
    <span className="detalhes-label">{label}</span>
    <span className="detalhes-valor">{valor ?? '-'}</span>
  </div>
);

export default function DetalhesAcolhidoModal({ acolhido, onFechar }) {
  useEffect(() => {
    if (!acolhido) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [acolhido, onFechar]);

  if (!acolhido) return null;

  const remedios = Array.isArray(acolhido.remedios_prescritos)
    ? acolhido.remedios_prescritos
    : [];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onFechar}
    >
      <div
        className="modal modal-detalhes"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detalhes-cabecalho">
          <div>
            <span className="detalhes-eyebrow">Acolhido</span>
            <h3 className="modal-titulo detalhes-nome">{acolhido.nome}</h3>
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
            <Campo
              label="Data de saída / alta"
              valor={formatarData(acolhido.dataSaidaCtav)}
            />
          </div>
        </section>

        <section className="detalhes-secao">
          <h4 className="detalhes-secao-titulo">Contato</h4>
          <div className="detalhes-grid">
            <Campo label="Email" valor={acolhido.email} />
            <Campo label="Celular" valor={acolhido.telefone} />
            <Campo label="Endereço" valor={acolhido.endereco} largo />
          </div>
        </section>

        <section className="detalhes-secao">
          <h4 className="detalhes-secao-titulo">Remédios prescritos</h4>
          {remedios.length > 0 ? (
            <ul className="detalhes-remedios">
              {remedios.map((r, i) => {
                const nome = typeof r === 'object' ? r?.nome ?? '-' : r;
                const desc =
                  typeof r === 'object' && r?.descricao ? String(r.descricao).trim() : '';
                const chave = typeof r === 'object' ? r?.id ?? `${nome}-${i}` : `${r}-${i}`;
                return (
                  <li key={chave}>
                    <span className="detalhes-remedio-nome">{nome}</span>
                    {desc ? (
                      <span className="detalhes-remedio-descricao">{desc}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="detalhes-vazio">Nenhum remédio prescrito.</p>
          )}
        </section>

        <section className="detalhes-secao detalhes-auditoria">
          <Campo label="Cadastrado em" valor={formatarDataHora(acolhido.criadoEm)} />
          <Campo label="Última atualização" valor={formatarDataHora(acolhido.atualizadoEm)} />
        </section>

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
