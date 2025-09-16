import { createLogger } from './observability';

const log = createLogger('process');

process.on('unhandledRejection', (reason: any, promise) => {
  log.error('unhandled_rejection', {
    reason: (reason && reason.message) || String(reason),
    stack: reason && reason.stack,
  });
});

process.on('uncaughtException', (err: any) => {
  log.error('uncaught_exception', {
    error: (err && err.message) || String(err),
    stack: err && err.stack,
  });
});

// Optional startup log
log.info('observability_initialized', { pid: process.pid });

