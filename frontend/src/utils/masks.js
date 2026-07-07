export const maskCpf = (value) => {
  const n = (value ?? '').replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const maskCelular = (value) => {
  const n = (value ?? '').replace(/\D/g, '').slice(0, 11);
  if (n.length === 0) return '';
  if (n.length <= 2) return `(${n}`;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};

export const maskCep = (value) => {
  const n = (value ?? '').replace(/\D/g, '').slice(0, 8);
  if (n.length <= 5) return n;
  return `${n.slice(0, 5)}-${n.slice(5)}`;
};

export const maskData = (value) => {
  let n = (value ?? '').replace(/\D/g, '');

  if (n.length === 1 && parseInt(n[0], 10) > 3) {
    n = '0' + n;
  }
  if (n.length === 3 && parseInt(n[2], 10) > 1) {
    n = n.slice(0, 2) + '0' + n.slice(2);
  }

  n = n.slice(0, 8);

  if (n.length >= 2) {
    const dia = parseInt(n.slice(0, 2), 10);
    if (dia > 31) n = '31' + n.slice(2);
    if (dia === 0 && n.length > 2) n = '01' + n.slice(2);
  }
  if (n.length >= 4) {
    const mes = parseInt(n.slice(2, 4), 10);
    if (mes > 12) n = n.slice(0, 2) + '12' + n.slice(4);
    if (mes === 0 && n.length > 4) n = n.slice(0, 2) + '01' + n.slice(4);
  }

  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
};

export const dataParaIso = (valorMascara) => {
  const match = (valorMascara ?? '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  const d = parseInt(dia, 10);
  const m = parseInt(mes, 10);
  const a = parseInt(ano, 10);

  const data = new Date(a, m - 1, d);
  if (
    data.getFullYear() !== a ||
    data.getMonth() !== m - 1 ||
    data.getDate() !== d
  ) {
    return null;
  }

  return `${ano}-${mes}-${dia}`;
};

export const isoParaData = (valorIso) => {
  const match = (valorIso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
};
