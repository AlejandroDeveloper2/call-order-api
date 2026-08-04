import 'express';

import { JwtPayload } from './';

declare module 'express' {
  interface Request {
    account?: JwtPayload;
  }
}
