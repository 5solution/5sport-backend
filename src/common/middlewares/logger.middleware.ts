import * as morgan from 'morgan';

// ── ANSI helpers ──────────────────────────────────────────────────────────────
const R = '\x1b[0m';          // reset
const bold  = (s: string) => `\x1b[1m${s}${R}`;
const dim   = (s: string) => `\x1b[2m${s}${R}`;
const green = (s: string) => `\x1b[32m${s}${R}`;
const cyan  = (s: string) => `\x1b[36m${s}${R}`;
const yellow= (s: string) => `\x1b[33m${s}${R}`;
const red   = (s: string) => `\x1b[31m${s}${R}`;
const white = (s: string) => `\x1b[37m${s}${R}`;

function colorMethod(method: string): string {
  switch (method) {
    case 'GET':    return cyan(method.padEnd(7));
    case 'POST':   return green(method.padEnd(7));
    case 'PATCH':
    case 'PUT':    return yellow(method.padEnd(7));
    case 'DELETE': return red(method.padEnd(7));
    default:       return white(method.padEnd(7));
  }
}

function colorStatus(status: number): string {
  const s = String(status);
  if (status >= 500) return bold(red(s));
  if (status >= 400) return yellow(s);
  if (status >= 300) return cyan(s);
  return bold(green(s));
}

function colorTime(ms: string): string {
  const n = parseFloat(ms);
  if (n >= 1000) return red(`${ms}ms`);
  if (n >= 300)  return yellow(`${ms}ms`);
  return dim(`${ms}ms`);
}

function formatBytes(bytes: string | undefined): string {
  if (!bytes || bytes === '-') return dim('-');
  const n = parseInt(bytes, 10);
  if (n >= 1024 * 1024) return dim(`${(n / 1024 / 1024).toFixed(1)}mb`);
  if (n >= 1024)        return dim(`${(n / 1024).toFixed(1)}kb`);
  return dim(`${n}b`);
}

// Custom morgan token: local time  HH:MM:SS
morgan.token('localtime', () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return dim(`[${hh}:${mm}:${ss}]`);
});

// Custom morgan format function
export const httpLogger = morgan(
  (tokens, req, res) => {
    const method  = tokens['method'](req, res) ?? '';
    const url     = tokens['url'](req, res) ?? '';
    const status  = parseInt(tokens['status'](req, res) ?? '0', 10);
    const time    = tokens['response-time'](req, res, 0) ?? '0';
    const bytes   = tokens['res'](req, res, 'content-length');
    const time_   = tokens['localtime'](req, res);

    const icon = status >= 400 ? red('✗') : green('✓');

    return [
      time_,
      colorMethod(method),
      white(url.padEnd(40)),
      colorStatus(status),
      icon,
      colorTime(time),
      formatBytes(bytes),
    ].join('  ');
  },
);
