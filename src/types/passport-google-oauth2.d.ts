// Type definitions for passport-google-oauth2
declare module 'passport-google-oauth2' {
  import { Request } from 'express';
  import { Strategy as PassportStrategy } from 'passport';

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    passReqToCallback?: boolean;
  }

  export interface VerifyCallback {
    (
      request: Request,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: (error: any, user?: any, info?: any) => void
    ): void;
  }

  export class Strategy implements PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: VerifyCallback
    );
    name: string;
    authenticate(req: Request, options?: any): void;
  }
}
