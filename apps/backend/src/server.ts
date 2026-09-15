// AXIVON ONE Backend Server Entry

import { createServer } from 'node:http';
import { createApp } from './app.js';
import { createNodeRequestHandler } from '../../../modules/core/authentication/backend/index.js';

const parsePort = (raw: string): number => {
  const portNumber = Number(raw);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535');
  }
  return portNumber;
};

const app = createApp();
const port = parsePort(process.env['API_PORT'] ?? process.env['APP_PORT'] ?? '5000');

for (const warning of app.modules.authentication.warnings) {
  console.warn(`[authentication] ${warning}`);
}

const server = createServer(
  createNodeRequestHandler({
    router: app.modules.authentication.router,
    logger: (entry) => console.error(JSON.stringify(entry)),
  }),
);

server.on('error', (error) => {
  console.error(JSON.stringify({ scope: 'server', event: 'error', message: error.message }));
  process.exitCode = 1;
});

server.listen(port, '0.0.0.0', () => {
  console.log(`AXIVON ONE Server listening on 0.0.0.0:${port} — ${app.phase}`);
});
