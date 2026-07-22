export const LIMITE_COMPRIMIDOS_CRITICO = 8;

export const NIVEL_ESTOQUE = {
  CRITICO: 'critico', // vermelho: menos de 8 comprimidos
  BAIXO: 'baixo', // amarelo: >= 8 comprimidos e uma caixa ou menos
};

export const totalComprimidos = (medicamento) => {
  // Fonte de verdade: total_comprimidos. Registros antigos podem não tê-lo;
  // nesse caso deriva de caixas × comprimidos por caixa.
  const total = Number(medicamento?.total_comprimidos);
  if (Number.isFinite(total) && medicamento?.total_comprimidos != null) {
    return total;
  }
  const caixas = Number(medicamento?.quantidade_caixas) || 0;
  return caixas * porCaixaEfetivo(medicamento);
};

export const porCaixaEfetivo = (medicamento) => {
  const porCaixa = Number(medicamento?.quantidade_por_caixa) || 0;
  return porCaixa > 0 ? porCaixa : 1;
};

/** Retorna 'critico', 'baixo' ou null (vermelho tem prioridade sobre amarelo). */
export const nivelAlertaEstoque = (medicamento) => {
  const total = totalComprimidos(medicamento);
  if (total < LIMITE_COMPRIMIDOS_CRITICO) {
    return NIVEL_ESTOQUE.CRITICO;
  }
  // >= 8 comprimidos e com uma caixa ou menos em estoque.
  if (total <= porCaixaEfetivo(medicamento)) {
    return NIVEL_ESTOQUE.BAIXO;
  }
  return null;
};

export const medicamentoComAlertaEstoque = (medicamento) =>
  nivelAlertaEstoque(medicamento) != null;

export const filtrarMedicamentosEstoqueBaixo = (medicamentos) =>
  (Array.isArray(medicamentos) ? medicamentos : [])
    .filter(medicamentoComAlertaEstoque)
    .sort((a, b) => {
      const ordem = { [NIVEL_ESTOQUE.CRITICO]: 0, [NIVEL_ESTOQUE.BAIXO]: 1 };
      const na = ordem[nivelAlertaEstoque(a)] ?? 2;
      const nb = ordem[nivelAlertaEstoque(b)] ?? 2;
      if (na !== nb) return na - nb;
      return totalComprimidos(a) - totalComprimidos(b);
    });

/**
 * Monta os alertas de estoque baixo por acolhido a partir da lista de acolhidos
 * (cada um com suas prescrições). Considera apenas medicamentos em uso (com
 * alguma dose > 0) e cujo estoque RESERVADO para o acolhido está baixo/crítico.
 * Cada item traz o nome do acolhido e do medicamento que está faltando.
 */
export const filtrarAlertasEstoquePorAcolhido = (acolhidos) => {
  const itens = [];
  (Array.isArray(acolhidos) ? acolhidos : []).forEach((acolhido) => {
    const prescricoes = Array.isArray(acolhido?.prescricoes)
      ? acolhido.prescricoes
      : [];
    prescricoes.forEach((p) => {
      const dose =
        (Number(p.doseManha) || 0) +
        (Number(p.doseTarde) || 0) +
        (Number(p.doseNoite) || 0);
      if (dose <= 0) return; // só alerta medicamentos que o acolhido toma
      const referencia = {
        total_comprimidos: Number(p.totalComprimidos) || 0,
        quantidade_por_caixa: Number(p.quantidadePorCaixa) || 0,
      };
      const nivel = nivelAlertaEstoque(referencia);
      if (!nivel) return;
      itens.push({
        chave: `${acolhido.id}-${p.medicamentoId}`,
        acolhidoId: acolhido.id,
        acolhidoNome: acolhido.nome ?? 'Acolhido',
        medicamentoId: p.medicamentoId,
        medicamentoNome: p.medicamentoNome ?? 'Medicamento',
        totalComprimidos: referencia.total_comprimidos,
        quantidadePorCaixa: referencia.quantidade_por_caixa,
        nivel,
      });
    });
  });

  return itens.sort((a, b) => {
    const ordem = { [NIVEL_ESTOQUE.CRITICO]: 0, [NIVEL_ESTOQUE.BAIXO]: 1 };
    const na = ordem[a.nivel] ?? 2;
    const nb = ordem[b.nivel] ?? 2;
    if (na !== nb) return na - nb;
    return a.totalComprimidos - b.totalComprimidos;
  });
};

export const rotuloNivelEstoque = (nivel) => {
  if (nivel === NIVEL_ESTOQUE.CRITICO) {
    return 'Crítico: menos de 8 comprimidos';
  }
  if (nivel === NIVEL_ESTOQUE.BAIXO) {
    return 'Baixo: uma caixa ou menos';
  }
  return '';
};
