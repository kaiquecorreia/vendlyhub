import { Request } from 'express';

declare module 'passport-jwt' {
  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken(): (request: Request) => string | null;
  };
}
