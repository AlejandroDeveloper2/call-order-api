import 'express';
import { Multer } from 'multer';

import { JwtPayload } from './';

declare module 'express' {
  interface Request {
    account?: JwtPayload;
    file?: Multer.File;
    files?: Multer.File[];
    fileUrl?: string;
  }
}
