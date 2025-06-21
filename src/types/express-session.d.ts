// Type definitions for express-session
declare module 'express-session' {
  import { RequestHandler, Request } from 'express';

  interface SessionData {
    [key: string]: any;
  }

  interface Session {
    id: string;
    regenerate(callback: (err: any) => void): void;
    destroy(callback: (err: any) => void): void;
    reload(callback: (err: any) => void): void;
    save(callback: (err: any) => void): void;
    touch(): void;
    cookie: any;
  }

  interface SessionOptions {
    secret: string | string[];
    resave: boolean;
    saveUninitialized: boolean;
    cookie?: {
      secure?: boolean;
      httpOnly?: boolean;
      domain?: string;
      path?: string;
      maxAge?: number;
    };
    store?: any;
    genid?: (req: Request) => string;
    name?: string;
    proxy?: boolean;
    rolling?: boolean;
    unset?: string;
  }

  declare function session(options: SessionOptions): RequestHandler;
  
  export = session;
}
