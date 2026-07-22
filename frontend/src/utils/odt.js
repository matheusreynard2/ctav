// Geração de documentos ODF (.odt) no navegador, sem dependências externas.
// Um arquivo ODT é, na prática, um ZIP contendo mimetype, content.xml,
// styles.xml e o manifesto. Aqui montamos esse ZIP usando o método "store"
// (sem compressão), o suficiente para abrir em LibreOffice/Word/Google Docs.

const enc = new TextEncoder();

const tabelaCrc = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = tabelaCrc[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const u16 = (v) => [v & 0xff, (v >>> 8) & 0xff];
const u32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];

// Monta um ZIP (store) a partir de [{ nome, dados: Uint8Array }].
const criarZip = (arquivos) => {
  const partesLocais = [];
  const partesCentral = [];
  let offset = 0;
  const modTime = 0;
  const modDate = 0x21; // 1980-01-01

  arquivos.forEach(({ nome, dados }) => {
    const nomeBytes = enc.encode(nome);
    const crc = crc32(dados);
    const tam = dados.length;

    const local = [
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0),
      ...u16(0), // método: store
      ...u16(modTime),
      ...u16(modDate),
      ...u32(crc),
      ...u32(tam),
      ...u32(tam),
      ...u16(nomeBytes.length),
      ...u16(0),
      ...nomeBytes,
    ];
    partesLocais.push(new Uint8Array(local), dados);

    const central = [
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(modTime),
      ...u16(modDate),
      ...u32(crc),
      ...u32(tam),
      ...u32(tam),
      ...u16(nomeBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset),
      ...nomeBytes,
    ];
    partesCentral.push(new Uint8Array(central));

    offset += local.length + tam;
  });

  const inicioCentral = offset;
  const tamCentral = partesCentral.reduce((soma, p) => soma + p.length, 0);

  const fim = [
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(arquivos.length),
    ...u16(arquivos.length),
    ...u32(tamCentral),
    ...u32(inicioCentral),
    ...u16(0),
  ];

  return new Blob([...partesLocais, ...partesCentral, new Uint8Array(fim)], {
    type: 'application/vnd.oasis.opendocument.text',
  });
};

const escaparXml = (texto) =>
  String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Converte uma data URL (base64) em bytes para embutir a imagem no ZIP do ODT.
const dataUrlParaBytes = (dataUrl) => {
  const base64 = String(dataUrl).split(',')[1] || '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
};

const construirManifest = (imagens = []) => `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
 <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
 <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
${imagens
  .map(
    (img) =>
      ` <manifest:file-entry manifest:full-path="${img.nome}" manifest:media-type="image/png"/>`
  )
  .join('\n')}
</manifest:manifest>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
 <office:styles>
  <style:default-style style:family="paragraph">
   <style:text-properties fo:font-family="Arial" fo:font-size="11pt"/>
  </style:default-style>
 </office:styles>
</office:document-styles>`;

const paragrafoXml = (p) => {
  if (p.secao) {
    return `<text:p text:style-name="Secao">${escaparXml(p.secao)}</text:p>`;
  }
  if (p.rotulo) {
    return `<text:p text:style-name="Corpo"><text:span text:style-name="Negrito">${escaparXml(
      `${p.rotulo} `
    )}</text:span>${escaparXml(p.texto)}</text:p>`;
  }
  return `<text:p text:style-name="Corpo">${escaparXml(p.texto)}</text:p>`;
};

const blocoAssinaturaXml = (rotulo, nome, href) => {
  const imagem = href
    ? `<draw:frame text:anchor-type="as-char" svg:width="6cm" svg:height="2.2cm" draw:z-index="0"><draw:image xlink:href="${href}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame>`
    : '';
  return `<text:p text:style-name="AssinaturaImg">${imagem}</text:p>
   <text:p text:style-name="AssinaturaLinha">____________________________________</text:p>
   <text:p text:style-name="AssinaturaLinha">${escaparXml(rotulo)}${
     nome ? ` — ${escaparXml(nome)}` : ''
   }</text:p>`;
};

const construirContentXml = (titulo, paragrafos, opcoes = {}) => {
  const corpo = paragrafos.map(paragrafoXml).join('\n   ');
  const dataXml = opcoes.data
    ? `<text:p text:style-name="Corpo"><text:span text:style-name="Negrito">Data do acolhimento: </text:span>${escaparXml(
        opcoes.data
      )}</text:p>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.2">
 <office:automatic-styles>
  <style:style style:name="Titulo" style:family="paragraph">
   <style:paragraph-properties fo:text-align="center" fo:margin-bottom="0.25cm"/>
   <style:text-properties fo:font-weight="bold" fo:font-size="16pt"/>
  </style:style>
  <style:style style:name="Secao" style:family="paragraph">
   <style:paragraph-properties fo:margin-top="0.3cm" fo:margin-bottom="0.1cm"/>
   <style:text-properties fo:font-weight="bold" fo:font-size="12pt"/>
  </style:style>
  <style:style style:name="Corpo" style:family="paragraph">
   <style:paragraph-properties fo:text-align="justify" fo:margin-bottom="0.15cm"/>
   <style:text-properties fo:font-size="11pt"/>
  </style:style>
  <style:style style:name="AssinaturaImg" style:family="paragraph">
   <style:paragraph-properties fo:text-align="center" fo:margin-top="1cm"/>
  </style:style>
  <style:style style:name="AssinaturaLinha" style:family="paragraph">
   <style:paragraph-properties fo:text-align="center"/>
  </style:style>
  <style:style style:name="Negrito" style:family="text">
   <style:text-properties fo:font-weight="bold"/>
  </style:style>
 </office:automatic-styles>
 <office:body>
  <office:text>
   <text:p text:style-name="Titulo">${escaparXml(titulo)}</text:p>
   ${corpo}
   <text:p text:style-name="Corpo"/>
   ${dataXml}
   ${blocoAssinaturaXml('Assinatura do acolhido', opcoes.nomeAcolhido, opcoes.hrefAcolhido)}
   <text:p text:style-name="Corpo"/>
   ${blocoAssinaturaXml(
     'Assinatura do responsável',
     opcoes.nomeResponsavel,
     opcoes.hrefResponsavel
   )}
  </office:text>
 </office:body>
</office:document-content>`;
};

const slug = (nome) =>
  (nome ?? 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'documento';

// Gera o Blob do .odt para um documento com título e parágrafos. Quando opcoes
// traz as assinaturas (data URL) e nomes, elas são embutidas no rodapé; caso
// contrário ficam apenas as linhas em branco para assinatura manual.
export const gerarOdt = (titulo, paragrafos, opcoes = {}) => {
  const imagens = [];
  const registrarImagem = (dataUrl, nomeArquivo) => {
    if (!dataUrl) return null;
    try {
      const caminho = `Pictures/${nomeArquivo}`;
      imagens.push({ nome: caminho, dados: dataUrlParaBytes(dataUrl) });
      return caminho;
    } catch {
      return null;
    }
  };

  const hrefAcolhido = registrarImagem(
    opcoes.assinaturaAcolhidoUrl,
    'assinatura-acolhido.png'
  );
  const hrefResponsavel = registrarImagem(
    opcoes.assinaturaResponsavelUrl,
    'assinatura-responsavel.png'
  );

  const contentXml = construirContentXml(titulo, paragrafos, {
    ...opcoes,
    hrefAcolhido,
    hrefResponsavel,
  });

  return criarZip([
    { nome: 'mimetype', dados: enc.encode('application/vnd.oasis.opendocument.text') },
    { nome: 'META-INF/manifest.xml', dados: enc.encode(construirManifest(imagens)) },
    { nome: 'styles.xml', dados: enc.encode(STYLES) },
    { nome: 'content.xml', dados: enc.encode(contentXml) },
    ...imagens,
  ]);
};

// Gera e dispara o download de um .odt.
export const baixarOdt = (titulo, paragrafos, nomeArquivo, opcoes = {}) => {
  const blob = gerarOdt(titulo, paragrafos, opcoes);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo || `${slug(titulo)}.odt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
