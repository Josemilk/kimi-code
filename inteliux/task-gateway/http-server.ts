import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { TaskGateway, type TaskRequest } from './task-gateway';
import { KimiCliRuntime } from './kimi-runtime-adapter';

const port = Number(process.env.INTELIUX_GATEWAY_PORT ?? 8787);
const host = process.env.INTELIUX_GATEWAY_HOST ?? '127.0.0.1';
const token = process.env.INTELIUX_GATEWAY_TOKEN;
const gateway = new TaskGateway(new KimiCliRuntime());

function json(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

async function body(req: IncomingMessage): Promise<any> {
  let raw = '';
  for await (const chunk of req) raw += chunk.toString();
  return raw ? JSON.parse(raw) : {};
}

function authorized(req: IncomingMessage): boolean {
  if (!token) return process.env.NODE_ENV !== 'production';
  return req.headers.authorization === `Bearer ${token}`;
}

const server = createServer(async (req, res) => {
  try {
    if (!authorized(req)) return json(res, 401, { error: 'unauthorized' });
    if (req.method === 'POST' && req.url === '/v1/tasks') {
      const request = await body(req) as TaskRequest;
      const session = await gateway.start(request);
      return json(res, 202, session);
    }

    const match = req.url?.match(/^\/v1\/tasks\/([^/]+)$/);
    if (req.method === 'GET' && match) {
      const session = gateway.get(match[1]);
      return session ? json(res, 200, session) : json(res, 404, { error: 'task_not_found' });
    }

    const cancel = req.url?.match(/^\/v1\/tasks\/([^/]+)\/cancel$/);
    if (req.method === 'POST' && cancel) {
      await gateway.cancel(cancel[1]);
      return json(res, 202, { status: 'cancelled' });
    }

    return json(res, 404, { error: 'not_found' });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, host, () => {
  console.log(`INTELIUX Task Gateway listening on http://${host}:${port}`);
});
