#!/usr/bin/env node

/**
 * @sequential/sequential-wrapped-services
 *
 * Runtime-agnostic wrapped services for sequential-runner.
 *
 * Primary usage: CLI tool for starting services
 *   npx sequential-wrapped-services [--port 3100] [--services gapi,keystore]
 *
 * Programmatic usage: Import specific utilities
 *   import '@sequential/sequential-wrapped-services/shared/core/base-service.ts';
 *
 * Note: This package uses TypeScript for Deno compatibility.
 * For Node.js usage, import from /shared/core/*.ts directly or use Deno runtime.
 *
 * Available modules:
 *   - shared/core/base-service.ts       - BaseService abstract class
 *   - shared/core/service-registry.ts   - ServiceRegistry singleton
 *   - shared/core/logging-service.ts    - logger, log, perf, context
 *   - shared/core/database-service.ts   - DatabaseService
 *   - shared/core/http-client.ts        - HttpClient
 *   - shared/core/http-handler.ts       - BaseHttpHandler
 *   - shared/core/config-service.ts     - ConfigService
 *   - shared/core/utils.ts              - Utility functions
 *   - shared/core/cors.ts               - CORS utilities
 *
 * CLI tool: Import from './cli.js'
 */

// This package primarily exports TypeScript modules for Deno runtime
// For programmatic access, use direct imports:
//   import { BaseService } from '@sequential/sequential-wrapped-services/shared/core/base-service.ts';

export default {
  cli: './cli.js',
  shared: {
    baseService: './shared/core/base-service.ts',
    serviceRegistry: './shared/core/service-registry.ts',
    loggingService: './shared/core/logging-service.ts',
    databaseService: './shared/core/database-service.ts',
    httpClient: './shared/core/http-client.ts',
    httpHandler: './shared/core/http-handler.ts',
    configService: './shared/core/config-service.ts',
    utils: './shared/core/utils.ts',
    cors: './shared/core/cors.ts'
  }
};
