import { Injectable, isDevMode } from '@angular/core';

export type ClientLogLevel = 'info' | 'warn' | 'error';
export type ClientLogIndex = 'applogs' | 'accesslogs';

interface ClientLogEntry {
  level: ClientLogLevel;
  index: ClientLogIndex;
  message: string;
  source: string;
  timestamp: string;
  environment?: 'dev' | 'pro';
  context?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class ClientLogsService {
  private readonly endpoint = '/api/logs/client';
  private readonly maxMessageLength = 4000;
  private readonly environment: 'dev' | 'pro' = isDevMode() ? 'dev' : 'pro';
  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.patchConsole();
    this.attachGlobalErrorHandlers();
    this.info('Client logger initialized', 'bootstrap');

    this.initialized = true;
  }

  info(message: string, source = 'ui', context?: Record<string, unknown>, index: ClientLogIndex = 'applogs'): void {
    this.send({ level: 'info', index, message, source, context, timestamp: new Date().toISOString() });
  }

  warn(message: string, source = 'ui', context?: Record<string, unknown>, index: ClientLogIndex = 'applogs'): void {
    this.send({ level: 'warn', index, message, source, context, timestamp: new Date().toISOString() });
  }

  error(message: string, source = 'ui', context?: Record<string, unknown>, index: ClientLogIndex = 'applogs'): void {
    this.send({ level: 'error', index, message, source, context, timestamp: new Date().toISOString() });
  }

  private patchConsole(): void {
    const originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };

    console.log = (...args: unknown[]) => {
      originalConsole.log(...args);
      this.info(this.toMessage(args), 'console');
    };

    console.info = (...args: unknown[]) => {
      originalConsole.info(...args);
      this.info(this.toMessage(args), 'console');
    };

    console.warn = (...args: unknown[]) => {
      originalConsole.warn(...args);
      this.warn(this.toMessage(args), 'console');
    };

    console.error = (...args: unknown[]) => {
      originalConsole.error(...args);
      this.error(this.toMessage(args), 'console');
    };
  }

  private attachGlobalErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      this.error(event.message || 'Unhandled window error', 'window.error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', 'window.unhandledrejection', {
        reason: this.toMessage([event.reason]),
      });
    });
  }

  private send(entry: ClientLogEntry): void {
    try {
      const payload: ClientLogEntry = {
        ...entry,
        environment: entry.environment || this.environment,
        message: this.truncateMessage(entry.message),
        context: {
          ...entry.context,
          href: window.location.href,
          userAgent: navigator.userAgent,
        },
      };

      const body = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(this.endpoint, blob);
        return;
      }

      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // No-op: logging must never break UX.
      });
    } catch {
      // No-op: logging must never break UX.
    }
  }

  private toMessage(args: unknown[]): string {
    if (!args.length) {
      return '';
    }

    if (args.length === 1) {
      return this.stringifySingle(args[0]);
    }

    return args.map((arg) => this.stringifySingle(arg)).join(' ');
  }

  private stringifySingle(value: unknown): string {
    if (value instanceof Error) {
      return value.stack || value.message;
    }

    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private truncateMessage(value: string): string {
    const message = String(value || '').trim();
    if (!message) {
      return 'Log without message';
    }

    if (message.length <= this.maxMessageLength) {
      return message;
    }

    return `${message.slice(0, this.maxMessageLength - 18)}... [truncated]`;
  }
}
