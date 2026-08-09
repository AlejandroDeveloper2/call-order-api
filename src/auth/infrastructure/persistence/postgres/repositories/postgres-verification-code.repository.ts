import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Puertos */
import { VerificationCodeRepositoryPort } from '../../../../domain/ports';
/** Entidad de dominio */
import { VerificationCode } from '../../../../domain/entities';
/** Utilidades */
import { handleServerError } from '../../../../../shared/domain/utils/handleServerError';

/** Esquemas */
import { PostgresVerificationCodeSchema } from '../schemas';
/** Mappers */
import { VerificationCodeMapper } from '../mappers';

@Injectable()
export class PostgresVerificationCodeRepository implements VerificationCodeRepositoryPort {
  constructor(
    @InjectRepository(PostgresVerificationCodeSchema)
    private readonly repository: Repository<PostgresVerificationCodeSchema>,
  ) {}
  async findByAccountId(accountId: string): Promise<VerificationCode | null> {
    try {
      const verificationCode = await this.repository.findOneBy({
        accountId,
      });
      if (!verificationCode) return null;
      return VerificationCodeMapper.toDomain(verificationCode);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async create(verificationCode: VerificationCode): Promise<void> {
    try {
      const schema = VerificationCodeMapper.toPersistence(verificationCode);
      await this.repository.save(schema);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async updateCodeHash(
    verificationCodeId: string,
    attempts: number,
    codeHash: string,
  ): Promise<number> {
    try {
      const result = await this.repository.update(
        { id: verificationCodeId },
        { attempts, codeHash },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async invalidateCode(
    verificationCodeId: string,
    usedAt: Date,
  ): Promise<number> {
    try {
      const result = await this.repository.update(
        { id: verificationCodeId },
        { usedAt },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
}
