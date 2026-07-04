export const PERIODOS_CONTROLE = [
  { chave: 'MANHA', rotulo: 'Manhã', campoDose: 'doseManha' },
  { chave: 'TARDE', rotulo: 'Tarde', campoDose: 'doseTarde' },
  { chave: 'NOITE', rotulo: 'Noite', campoDose: 'doseNoite' },
];

export const MESES_CONTROLE = [
  { valor: 1, rotulo: 'Janeiro' },
  { valor: 2, rotulo: 'Fevereiro' },
  { valor: 3, rotulo: 'Março' },
  { valor: 4, rotulo: 'Abril' },
  { valor: 5, rotulo: 'Maio' },
  { valor: 6, rotulo: 'Junho' },
  { valor: 7, rotulo: 'Julho' },
  { valor: 8, rotulo: 'Agosto' },
  { valor: 9, rotulo: 'Setembro' },
  { valor: 10, rotulo: 'Outubro' },
  { valor: 11, rotulo: 'Novembro' },
  { valor: 12, rotulo: 'Dezembro' },
];

export const chaveRegistroAdministracao = (data, medicamentoId, periodo) =>
  `${data}-${medicamentoId}-${periodo}`;

export const diasDoMes = (ano, mes) => {
  const ultimo = new Date(ano, mes, 0).getDate();
  const mesStr = String(mes).padStart(2, '0');
  return Array.from({ length: ultimo }, (_, i) => {
    const dia = String(i + 1).padStart(2, '0');
    return `${ano}-${mesStr}-${dia}`;
  });
};

export const formatarDiaControle = (iso) => {
  const [ano, mes, dia] = iso.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const semana = data.toLocaleDateString('pt-BR', { weekday: 'short' });
  return `${dia}/${mes} (${semana})`;
};

export const rotuloMesAno = (ano, mes) => {
  const m = MESES_CONTROLE.find((x) => x.valor === Number(mes));
  return m ? `${m.rotulo} de ${ano}` : '';
};

export const prescricoesComDose = (acolhido) => {
  const presc = acolhido?.prescricoes ?? [];
  return presc.filter(
    (p) => (p.doseManha || 0) + (p.doseTarde || 0) + (p.doseNoite || 0) > 0
  );
};

export const mapaRegistrosAdministracao = (lista) => {
  const mapa = {};
  (Array.isArray(lista) ? lista : []).forEach((r) => {
    const dataIso = typeof r.data === 'string' ? r.data.slice(0, 10) : r.data;
    mapa[chaveRegistroAdministracao(dataIso, r.medicamentoId, r.periodo)] =
      Boolean(r.tomado);
  });
  return mapa;
};
