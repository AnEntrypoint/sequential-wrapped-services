# Sequential Wrapped Services

Runtime-agnostic HTTP service implementations for sequential-ecosystem. Run on Deno, Node.js, or Bun.

## Services

- **deno-executor** - Task execution runtime with automatic suspend/resume
- **simple-stack-processor** - Processes pending service calls in FIFO order
- **task-executor** - Task submission and lifecycle management
- **gapi** - Google Workspace APIs (Gmail, Admin, etc.)
- **keystore** - Secure credential storage
- **supabase** - Database operation proxy
- **openai** - OpenAI API integration
- **websearch** - Web search integration

## Quick Start

```bash
npm start
npm start -- --services deno-executor,gapi,keystore
npm start -- --port 3100
```

## Adding a Service

```typescript
export async function handler(req: Request): Promise<Response> {
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

if (import.meta.main) {
  const port = parseInt(Deno.env.get('PORT') || '3000');
  serve(handler, { port });
}
```

## Service Discovery

CLI auto-discovers services in `services/` directory and creates `.service-registry.json`.

## Integration

Services are called via `__callHostTool__`:

```javascript
const users = await __callHostTool__('database', 'getUsers', { limit: 10 });
const email = await __callHostTool__('gapi', 'sendEmail', { to: 'user@example.com' });
```

## Environment

```bash
PORT=3100
DEBUG=true
SUPABASE_URL=...
OPENAI_API_KEY=...
GAPI_KEY=...
```

## License

MIT
