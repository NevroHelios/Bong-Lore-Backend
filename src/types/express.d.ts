// types/express.d.ts
import { IUser } from '../models/User.js';

declare global {
  namespace Express {
    // By extending IUser, the User property on Express's Request object
    // will have all the properties of our User model.
    interface User extends IUser {}
  }
}

export {};