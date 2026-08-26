import 'express';
import { Multer } from 'multer';

import { AccessTokenPayload } from '../../../auth/domain/types';

declare module 'express' {
  interface Request {
    user?: AccessTokenPayload & { permissions: string[] };
    file?: Multer.File;
    files?: Multer.File[];
    fileUrl?: string;
  }
}
