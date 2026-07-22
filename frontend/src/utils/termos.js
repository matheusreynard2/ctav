// Fonte única dos textos dos termos exibidos antes do cadastro do acolhido
// (modal com abas) e na página "Documentos" (geração de ODF).
//
// Cada termo é composto por blocos:
//  { texto }                     -> parágrafo comum (pode conter tokens {{chave}})
//  { rotulo, texto }             -> rótulo em negrito no início da linha
//  { secao }                     -> título de cláusula (linha própria em negrito)
//  { opcaoImagem, texto }        -> opção marcável de uso de imagem

export const TITULO_CONCORDANCIA =
  'TERMO DE CONCORDÂNCIA E COLABORAÇÃO TERAPÊUTICA';
export const TITULO_ACORDO = 'TERMO DE ACOLHIMENTO';
export const TITULO_CELULAR = 'TERMO DE ENTREGA DE CELULAR';
export const TITULO_PERTENCES = 'TERMO DE RESPONSABILIDADE SOBRE PERTENCES';

// Marcador padrão para lacunas não preenchidas.
export const LACUNA = '____________';

// Monta um parágrafo com segmentos. Cada parte é { texto } ou
// { texto, preenchivel }. O `texto` completo é derivado (para PDF/ODT/imagem) e
// as `partes` permitem destacar as lacunas na tela (preenchidas ou vazias).
const paragrafoComCampos = (partes) => ({
  texto: partes.map((p) => p.texto).join(''),
  partes,
});

export const construirParagrafosConcordancia = (nome, cpf) => [
  paragrafoComCampos([
    { texto: 'Eu, ' },
    { texto: nome || LACUNA, preenchivel: true },
    { texto: ', CPF nº ' },
    { texto: cpf || LACUNA, preenchivel: true },
    {
      texto:
        ', acolhido voluntariamente na Casa Terapêutica Águas Vivas, declaro estar ciente e em plena concordância com minha participação em atividades externas de Reinserção Social, a partir da segunda fase do tratamento (45 dias), conforme demanda da instituição e disponibilidade do cronograma terapêutico.',
    },
  ]),
  { texto: 'Declaro estar ciente de que:' },
  {
    rotulo: 'Natureza das atividades:',
    texto:
      'As atividades incluem, mas não se limitam a: jardinagem, manutenção e pintura, auxílio na produção interna e externa, bem como divulgação institucional da casa.',
  },
  {
    rotulo: 'Objetivo Terapêutico:',
    texto:
      'As referidas tarefas têm como finalidade o desenvolvimento de novas habilidades, disciplina, convivência social e preparação para o mercado de trabalho, fazendo parte integrante do processo de recuperação.',
  },
  {
    rotulo: 'Caráter não remunerado:',
    texto:
      'Compreendo que tais atividades possuem caráter terapêutico, não configuram vínculo empregatício e não serão remuneradas.',
  },
  {
    rotulo: 'Destinação dos Recursos:',
    texto:
      'Declaro estar ciente que eventuais recursos obtidos por meio dessas atividades, incluindo doações e vendas de produtos, serão integralmente destinados à manutenção da Instituição, melhorias estruturais e aquisição de itens essenciais, como alimentação e materiais de higiene de uso coletivo dos acolhidos.',
  },
  {
    rotulo: 'Flexibilidade:',
    texto:
      'Autorizo minha participação nessas atividades em locais e horários variados, sempre sob supervisão e orientação da equipe técnica da instituição.',
  },
  {
    rotulo: 'Segurança e conduta:',
    texto:
      'Comprometo-me a seguir as normas de segurança e o código de ética da instituição durante a execução das tarefas, mantendo a postura adequada ao ambiente externo.',
  },
  {
    texto:
      'Este termo tem validade durante todo o período de minha permanência no acolhimento, podendo ser revogado por mim a qualquer momento, mediante comunicação à equipe técnica.',
  },
];

export const construirParagrafosAcordo = (nome, cpf) => [
  paragrafoComCampos([
    {
      texto:
        'Pelo presente instrumento particular, de um lado a CASA TERAPÊUTICA ÁGUAS VIVAS, associação privada sem fins lucrativos, inscrita no CNPJ nº 05.876.703/0001-00, situada à Estrada Ribeirão do Tigre, nº 1313, bairro Tigre, Quatro Barras/PR, doravante denominada INSTITUIÇÃO, e de outro lado o ACOLHIDO ',
    },
    { texto: nome || LACUNA, preenchivel: true },
    { texto: ', CPF nº ' },
    { texto: cpf || LACUNA, preenchivel: true },
    { texto: ':' },
  ]),
  {
    texto:
      'Têm entre si justo e acordado o presente ACORDO DE ACOLHIMENTO, que se regerá pelas cláusulas e condições abaixo:',
  },
  { secao: 'DO OBJETO' },
  {
    texto:
      'O presente termo tem por objeto o acolhimento do ACOLHIDO na CASA TERAPÊUTICA ÁGUAS VIVAS, com a finalidade de apoio, cuidado, orientação e acompanhamento no processo de recuperação e reinserção social, conforme as normas internas da instituição, bem como o caráter voluntário de acolhimento.',
  },
  { secao: 'DAS CONDIÇÕES DO ACOLHIMENTO' },
  {
    texto:
      'O ACOLHIDO compromete-se a respeitar o Estatuto Social, o Regimento Interno, as normas de convivência, horários, atividades terapêuticas, disciplinares, espirituais e laborais estabelecidas pela INSTITUIÇÃO.',
  },
  {
    texto:
      'O descumprimento das normas poderá acarretar advertência ou desligamento, conforme avaliação da coordenação.',
  },
  { secao: 'DAS ATIVIDADES' },
  {
    texto:
      'O ACOLHIDO poderá participar de atividades internas e externas, terapêuticas, ocupacionais e de convivência, sempre supervisionadas pela INSTITUIÇÃO, não gerando vínculo empregatício ou remuneração.',
  },
  { secao: 'DOS DOCUMENTOS PESSOAIS DO ACOLHIDO' },
  {
    texto:
      'Fica expressamente acordado que os documentos pessoais do ACOLHIDO (RG, CPF, Cartão SUS, Certidão de Nascimento ou Casamento, entre outros) permanecerão sempre em sua posse, sendo de responsabilidade exclusiva do próprio acolhido.',
  },
  {
    texto:
      'A INSTITUIÇÃO manterá apenas cópias simples dos documentos pessoais para fins administrativos, cadastrais e legais, não ficando, em nenhuma hipótese, de posse dos documentos originais.',
  },
  { secao: 'DO USO DE IMAGEM' },
  {
    texto:
      'O ACOLHIDO declara estar ciente de que, durante sua permanência na comunidade terapêutica, poderão ser realizados registros de imagem (fotografias, vídeos e áudios) em atividades institucionais. Dessa forma, manifesta sua decisão quanto ao uso de sua imagem para fins institucionais, educativos e de divulgação (redes sociais, materiais informativos e institucionais):',
  },
  {
    opcaoImagem: 'AUTORIZA',
    texto: 'AUTORIZO o uso da minha imagem, de forma gratuita, para os fins acima descritos.',
  },
  {
    opcaoImagem: 'NAO_AUTORIZA',
    texto: 'NÃO AUTORIZO o uso da minha imagem.',
  },
  { secao: 'DO PRAZO' },
  {
    texto:
      'O presente termo entra em vigor na data de sua assinatura e terá prazo indeterminado, podendo ser rescindido a qualquer tempo por qualquer das partes, mediante comunicação verbal ou escrita.',
  },
  { secao: 'DA AUSÊNCIA DE VÍNCULO EMPREGATÍCIO' },
  {
    texto:
      'Pelo presente termo de adesão de prestação de serviço voluntário, nos termos da Lei nº 9.608/98, que entre si fazem de um lado a CTAV – Casa Terapêutica Águas Vivas, casa de recuperação para dependentes químicos, instituição pública, sem fins lucrativos de assistência social, estabelecida em setembro de 2014, na cidade de Quatro Barras/PR, inscrita no CNPJ sob nº 05.876.703/0001-00, e do outro lado o voluntário, o presente contrato não gera vínculo empregatício, previdenciário ou trabalhista entre o ACOLHIDO e a INSTITUIÇÃO, ainda que haja participação em atividades ocupacionais.',
  },
  { secao: 'DISPOSIÇÕES GERAIS' },
  {
    texto:
      'O ACOLHIDO declara que ingressa de forma voluntária na INSTITUIÇÃO, estando ciente das regras e condições aqui estabelecidas.',
  },
  {
    texto:
      'E, por estarem de pleno acordo, assinam o presente termo em uma via, podendo solicitar cópia a qualquer momento.',
  },
];

// Converte as opções de uso de imagem em texto marcado com (X). Quando
// autorizaImagem é null (ex.: modelo em branco), ambas ficam desmarcadas.
export const resolverParagrafosAcordoParaImagem = (paragrafos, autorizaImagem) =>
  paragrafos.map((p) => {
    if (!p.opcaoImagem) return p;
    const marcado =
      (p.opcaoImagem === 'AUTORIZA' && autorizaImagem === true) ||
      (p.opcaoImagem === 'NAO_AUTORIZA' && autorizaImagem === false);
    return { texto: `(${marcado ? 'X' : '  '}) ${p.texto}` };
  });

// Termo de entrega de celular: texto informativo e coeso. Ao final, registra a
// decisão do acolhido quanto à entrega do aparelho (opção marcável).
export const construirParagrafosCelular = (nome, cpf) => [
  paragrafoComCampos([
    { texto: 'O ACOLHIDO ' },
    { texto: nome || LACUNA, preenchivel: true },
    { texto: ', CPF nº ' },
    { texto: cpf || LACUNA, preenchivel: true },
    {
      texto:
        ', ao ingressar na Casa Terapêutica Águas Vivas, declara estar ciente das condições de guarda do seu aparelho de telefone celular durante todo o período do seu acolhimento.',
    },
  ]),
  {
    texto:
      'O aparelho, quando entregue, permanecerá guardado em local reservado e sob responsabilidade da coordenação, sendo devolvido ao ACOLHIDO no momento da sua saída ou quando expressamente autorizado pela equipe técnica, nas mesmas condições em que foi entregue.',
  },
  {
    texto:
      'O ACOLHIDO compreende que a medida possui caráter exclusivamente terapêutico, tendo por finalidade favorecer a sua concentração no tratamento, o convívio comunitário e o distanciamento de estímulos externos que possam prejudicar a sua recuperação.',
  },
  {
    texto:
      'A INSTITUIÇÃO compromete-se a zelar pela integridade do aparelho, não se responsabilizando, contudo, por defeitos de funcionamento preexistentes, desgastes naturais ou danos decorrentes de caso fortuito ou força maior.',
  },
  {
    texto: 'Quanto à entrega do aparelho celular, o ACOLHIDO manifesta que:',
  },
  {
    opcaoCelular: 'ENTREGA',
    texto:
      'FAÇO a entrega voluntária do meu aparelho celular à INSTITUIÇÃO para guarda durante o acolhimento.',
  },
  {
    opcaoCelular: 'NAO_ENTREGA',
    texto: 'NÃO faço a entrega do meu aparelho celular.',
  },
  {
    texto:
      'O ACOLHIDO declara estar ciente e de pleno acordo com as condições aqui estabelecidas, firmando o presente termo de forma livre e espontânea.',
  },
];

// Converte as opções de entrega de celular em texto marcado com (X). Quando
// entregaCelular é null, ambas ficam desmarcadas.
export const resolverParagrafosCelular = (paragrafos, entregaCelular) =>
  paragrafos.map((p) => {
    if (!p.opcaoCelular) return p;
    const marcado =
      (p.opcaoCelular === 'ENTREGA' && entregaCelular === true) ||
      (p.opcaoCelular === 'NAO_ENTREGA' && entregaCelular === false);
    return { texto: `(${marcado ? 'X' : '  '}) ${p.texto}` };
  });

// Formata um pertence para uma linha do registro (ex.: "•  2x Camiseta").
const linhaPertence = (p) => {
  const qtd = p?.quantidade;
  const item = (p?.item ?? '').trim();
  const prefixo = qtd != null && qtd !== '' ? `${qtd}x ` : '';
  return { texto: `•  ${prefixo}${item}`.trimEnd() };
};

// Termo de responsabilidade sobre pertences: relaciona os itens em posse do
// acolhido e registra sua concordância em assumir a guarda/responsabilidade.
export const construirParagrafosPertences = (nome, cpf, pertences = []) => {
  const lista = Array.isArray(pertences) ? pertences : [];
  const itens = lista.length
    ? lista.map(linhaPertence)
    : [{ texto: 'Nenhum pertence relacionado no ato do acolhimento.' }];
  return [
    paragrafoComCampos([
      { texto: 'Eu, ' },
      { texto: nome || LACUNA, preenchivel: true },
      { texto: ', CPF nº ' },
      { texto: cpf || LACUNA, preenchivel: true },
      {
        texto:
          ', acolhido na Casa Terapêutica Águas Vivas, declaro o registro dos pertences pessoais em minha posse no ato do acolhimento, conforme a relação abaixo:',
      },
    ]),
    { secao: 'REGISTRO DE PERTENCES EM POSSE DO ACOLHIDO' },
    ...itens,
    {
      texto:
        'Declaro, para os devidos fins, que os pertences acima relacionados foram conferidos no ato do meu acolhimento nesta Comunidade Terapêutica.',
    },
    {
      texto:
        'Estou ciente de que os itens permanecem sob minha guarda e responsabilidade exclusiva, sendo de minha inteira responsabilidade sua conservação, organização e integridade.',
    },
    { texto: 'Declaro ainda estar ciente de que a instituição:' },
    {
      texto:
        '•  não se responsabiliza por perdas, extravios ou danos de objetos de uso pessoal mantidos sob minha posse;',
    },
    {
      texto:
        '•  orienta quanto ao uso adequado e guarda dos pertences, conforme normas internas;',
    },
    {
      texto:
        '•  poderá intervir apenas em casos que envolvam segurança, organização coletiva ou descumprimento das regras.',
    },
    {
      texto:
        'Quanto à responsabilidade pelos pertences, o acolhido manifesta que:',
    },
    {
      opcaoPertences: 'CONCORDA',
      texto:
        'ESTOU DE ACORDO com as normas estabelecidas e assumo total responsabilidade pelos meus pertences durante todo o período de acolhimento.',
    },
    {
      opcaoPertences: 'DISCORDA',
      texto:
        'NÃO CONCORDO com as condições acima e não assumo a responsabilidade pelos pertences relacionados.',
    },
  ];
};

// Converte as opções de responsabilidade sobre pertences em texto marcado com
// (X). Quando concordaPertences é null, ambas ficam desmarcadas.
export const resolverParagrafosPertences = (paragrafos, concordaPertences) =>
  paragrafos.map((p) => {
    if (!p.opcaoPertences) return p;
    const marcado =
      (p.opcaoPertences === 'CONCORDA' && concordaPertences === true) ||
      (p.opcaoPertences === 'DISCORDA' && concordaPertences === false);
    return { texto: `(${marcado ? 'X' : '  '}) ${p.texto}` };
  });
