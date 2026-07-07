# Lambda — Relatórios PDF (CTAV)

Gera os PDFs de relatórios (quadro mensal, acolhidos com alta, controle de
administração e consolidado) usando `jsPDF` + `jspdf-autotable`. É invocada
pelo backend Quarkus (`POST /api/relatorios/pdf`), nunca diretamente pelo
navegador.

- **Runtime:** Node.js 20.x
- **Handler:** `index.handler`
- **Região:** `sa-east-1`
- **Nome padrão da função:** `ctav-relatorios-pdf`

## Contrato

Entrada (event):

```json
{ "tipo": "quadro-mensal | altas | controle | todos | tutorial", "dados": { ... } }
```

Para `tutorial`, `dados` pode ser `{}` (documento estático com guia completo do sistema).

## Desenvolvimento local (sem invocar Lambda)

Com `%dev.app.relatorios.local-node.enabled=true` (já configurado), o backend Quarkus
executa `invoke-local.mjs` via Node.js em vez de chamar a AWS. Requisitos:

- Node.js instalado no PATH
- `npm install` já rodado nesta pasta

Saída:

```json
{ "pdfBase64": "<PDF em base64>" }
```

## Testar localmente

```powershell
npm install
node test-local.mjs   # gera saida-*.pdf na pasta
```

## Empacotar para deploy (Windows PowerShell)

```powershell
cd lambda/relatorios-pdf
npm install --omit=dev
Compress-Archive -Path index.mjs,package.json,node_modules -DestinationPath ctav-relatorios-pdf.zip -Force
```

O zip deve ter `index.mjs` e `node_modules` na RAIZ (não dentro de subpasta).

## Atualizar o código da função (via AWS CLI)

```powershell
aws lambda update-function-code `
  --function-name ctav-relatorios-pdf `
  --zip-file fileb://ctav-relatorios-pdf.zip `
  --region sa-east-1
```
