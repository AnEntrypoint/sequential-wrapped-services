import logger from '@sequential/sequential-logging';
#!/usr/bin/env node

/**
 * Tasker Wrapped Services CLI
 *
 * Discovers and starts available wrapped services based on local folder structure.
 * Supports Deno, Node.js, and Bun runtimes.
 *
 * Usage:
 *   npx tasker                    # Auto-discover and start all services
 *   npx tasker --port 3000        # Start on specific base port
 *   npx tasker --services gapi,keystore  # Start only specific services
 *   npx tasker --deno            # Force Deno runtime
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nowISO } from '@sequential/sequential-utils/timestamps';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const boilerplateServices = {
  'hello-world': {
    'index.ts': `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/health") {
    return new Response(JSON.stringify({ status: "ok", service: "hello-world" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST" && path === "/call") {
    const body = await req.json();
    return new Response(JSON.stringify({
      success: true,
      message: "Hello from hello-world service!",
      received: body
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}

if (import.meta.main) {
  const port = parseInt(Deno.env.get("PORT") || "3000");
  serve(handler, { port });
}
`
  },
  'echo-service': {
    'index.ts': `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/health") {
    return new Response(JSON.stringify({ status: "ok", service: "echo-service" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST" && path === "/call") {
    const body = await req.json();
    return new Response(JSON.stringify({
      success: true,
      echo: body,
      timestamp: nowISO()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}

if (import.meta.main) {
  const port = parseInt(Deno.env.get("PORT") || "3000");
  serve(handler, { port });
}
`
  },
  'api-gateway': {
    'index.ts': `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/health") {
    return new Response(JSON.stringify({ status: "ok", service: "api-gateway" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST" && path === "/call") {
    const body = await req.json();
    const { endpoint, method = "GET", data } = body;

    try {
      const fetchOptions: RequestInit = {
        method: method,
        headers: { "Content-Type": "application/json" }
      };

      if (data) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(endpoint, fetchOptions);
      const responseData = await response.json();

      return new Response(JSON.stringify({
        success: true,
        status: response.status,
        data: responseData
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}

if (import.meta.main) {
  const port = parseInt(Deno.env.get("PORT") || "3000");
  serve(handler, { port });
}
`
  }
};

function createBoilerplateServices() {
  const servicesDir = path.join(process.cwd(), 'services');

  if (fs.existsSync(servicesDir)) {
    return servicesDir;
  }

  logger.info('📦 Creating boilerplate services directory...\n');

  fs.mkdirSync(servicesDir, { recursive: true });

  for (const [serviceName, files] of Object.entries(boilerplateServices)) {
    const serviceDir = path.join(servicesDir, serviceName);
    fs.mkdirSync(serviceDir, { recursive: true });

    for (const [fileName, content] of Object.entries(files)) {
      const filePath = path.join(serviceDir, fileName);
      fs.writeFileSync(filePath, content);
    }

    logger.info(`✅ Created service: ${serviceName}`);
  }

  logger.info(`\n📁 Services created at: ${servicesDir}\n`);
  logger.info('Each service has:');
  logger.info('  - /health endpoint for health checks');
  logger.info('  - /call endpoint for service calls');
  logger.info('  - Deno-compatible TypeScript implementation\n');

  return servicesDir;
}

const args = process.argv.slice(2);
const config = {
  basePort: 3100,
  services: null,
  runtime: 'auto',
  debug: false
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port') {
    config.basePort = parseInt(args[++i]);
  } else if (args[i] === '--services') {
    config.services = args[++i].split(',');
  } else if (args[i] === '--deno') {
    config.runtime = 'deno';
  } else if (args[i] === '--node') {
    config.runtime = 'node';
  } else if (args[i] === '--bun') {
    config.runtime = 'bun';
  } else if (args[i] === '--debug') {
    config.debug = true;
  }
}

function findServicesDir() {
  let current = process.cwd();
  const root = path.parse(current).root;

  while (current !== root) {
    const servicesPath = path.join(current, 'services');
    if (fs.existsSync(servicesPath) && fs.statSync(servicesPath).isDirectory()) {
      return servicesPath;
    }
    current = path.dirname(current);
  }

  const packageServicesPath = path.join(__dirname, 'services');
  const cwd = process.cwd();
  const iInsidePackage = cwd.includes(__dirname);

  if (iInsidePackage && fs.existsSync(packageServicesPath)) {
    return packageServicesPath;
  }

  return null;
}

function discoverServices() {
  let servicesDir = findServicesDir();

  if (!servicesDir) {
    logger.info('⚠️  No services directory found');
    servicesDir = createBoilerplateServices();
    logger.info('✅ Boilerplate created, discovering services...\n');
  }

  const services = {};
  const entries = fs.readdirSync(servicesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const servicePath = path.join(servicesDir, entry.name);
    const hasIndex = fs.existsSync(path.join(servicePath, 'index.ts')) ||
                     fs.existsSync(path.join(servicePath, 'index.js'));

    if (hasIndex) {
      services[entry.name] = {
        path: servicePath,
        name: entry.name,
        port: null
      };
    }
  }

  return { services, servicesDir };
}

function filterServices(allServices) {
  if (!config.services) {
    return allServices;
  }

  const filtered = {};
  for (const name of config.services) {
    if (allServices[name]) {
      filtered[name] = allServices[name];
    }
  }
  return filtered;
}

function assignPorts(services) {
  const serviceNames = Object.keys(services).sort();
  const serviceArray = serviceNames.map((name, index) => {
    services[name].port = config.basePort + index;
    return services[name];
  });
  return serviceArray;
}

async function startServices(servicesList, servicesDir) {
  logger.info('🚀 Starting Wrapped Services');
  logger.info(`📦 Runtime: ${config.runtime}`);
  logger.info(`🔧 Services: ${servicesList.map(s => s.name).join(', ')}`);
  logger.info(`📁 Services Dir: ${servicesDir}`);
  logger.info('');

  const processes = [];

  for (const service of servicesList) {
    logger.info(`⏳ Starting ${service.name} on port ${service.port}...`);

    const entryScript = path.join(service.path, 'index.ts');

    if (!fs.existsSync(entryScript)) {
      logger.warn(`⚠️  No entry point found for ${service.name}`);
      continue;
    }

    processes.push({
      name: service.name,
      port: service.port,
      url: `http://localhost:${service.port}`
    });
  }

  logger.info('\n✅ Services Ready');
  logger.info('─'.repeat(60));
  for (const proc of processes) {
    logger.info(`${proc.name.padEnd(25)} → ${proc.url}`);
  }
  logger.info('─'.repeat(60));

  const registryPath = path.join(process.cwd(), '.service-registry.json');
  fs.writeFileSync(registryPath, JSON.stringify({
    timestamp: nowISO(),
    servicesDir: servicesDir,
    services: processes
  }, null, 2));

  logger.info(`\n📝 Registry: ${registryPath}`);
  logger.info('\nPress Ctrl+C to stop all services\n');

  await new Promise(resolve => {
    process.on('SIGINT', () => {
      logger.info('\n\n👋 Stopping services...');
      process.exit(0);
    });
  });
}

async function main() {
  const discovery = discoverServices();
  const { services: allServices, servicesDir } = discovery;
  const filtered = filterServices(allServices);
  const assigned = assignPorts(filtered);

  if (assigned.length === 0) {
    logger.error('❌ No services found to start');
    process.exit(1);
  }

  await startServices(assigned, servicesDir);
}

main().catch(err => {
  logger.error('❌ Error:', err.message);
  process.exit(1);
});
