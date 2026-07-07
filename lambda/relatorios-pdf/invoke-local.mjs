import { handler } from './index.mjs';

// Invoca o handler lendo JSON do stdin (usado pelo backend em modo dev local).
const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}
const entrada = JSON.parse(Buffer.concat(chunks).toString('utf8'));
const resultado = await handler(entrada);
process.stdout.write(JSON.stringify(resultado));
