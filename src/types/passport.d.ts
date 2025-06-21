// Declaration file for passport + express integration
import 'express';
import { IUser } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      isUnauthenticated(): boolean;
      logout(callback: (err: Error) => void): void;
      user?: IUser;
    }
  }
}

// Type definitions for passport
declare module 'passport' {
  import express = require('express');

  interface AuthenticateOptions {
    successRedirect?: string;
    failureRedirect?: string;
    session?: boolean;
    scope?: string | string[];
    prompt?: string;
    authType?: string;
    [key: string]: any;
  }

  interface Authenticator {
    initialize(): express.RequestHandler;
    session(): express.RequestHandler;
    authenticate(strategy: string | string[], options?: AuthenticateOptions): express.RequestHandler;
    serializeUser(fn: (user: any, done: (err: any, id?: any) => void) => void): void;
    deserializeUser(fn: (id: any, done: (err: any, user?: any) => void) => void): void;
    use(strategy: any): this;
  }

  const passport: Authenticator;
  
  export = passport;
}

export {};
