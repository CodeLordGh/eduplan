declare module 'pino' {
    export interface Logger {
      level: string;
      fatal: (...args: any[]) => void;
      error: (...args: any[]) => void;
      warn: (...args: any[]) => void;
      info: (...args: any[]) => void;
      debug: (...args: any[]) => void;
      trace: (...args: any[]) => void;
    }
  
    export interface LoggerOptions {
      level?: string;
    }
  
    export default function pino(options?: LoggerOptions): Logger;
  } 