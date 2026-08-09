import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Entidad de dominio */
import { Session } from '../../../../domain/entities';
/** Puertos */
import { SessionRepositoryPort } from '../../../../domain/ports';
/** Utilidades */
import { handleServerError } from '../../../../../shared/domain/utils/handleServerError';

/** Esquemas */
import { PostgresSessionSchema } from '../schemas';
/** Mappers */
import { SessionMapper } from '../mappers';

@Injectable()
export class PostgresSessionRepository implements SessionRepositoryPort {
  constructor(
    @InjectRepository(PostgresSessionSchema)
    private readonly sessionRepository: Repository<PostgresSessionSchema>,
  ) {}
  async findById(sessionId: string): Promise<Session | null> {
    try {
      const session = await this.sessionRepository.findOneBy({ id: sessionId });
      if (!session) return null;
      return SessionMapper.toDomain(session);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async create(session: Session): Promise<void> {
    try {
      const schema = SessionMapper.toPersistence(session);
      await this.sessionRepository.save(schema);
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async revoke(sessionId: string, revokedAt: Date): Promise<number> {
    try {
      const result = await this.sessionRepository.update(
        { id: sessionId },
        { revokedAt },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async updateRefresh(
    sessionId: string,
    refreshTokenHash: string,
  ): Promise<number> {
    try {
      const result = await this.sessionRepository.update(
        { id: sessionId },
        { refreshTokenHash },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async updateExpiration(sessionId: string, expiresAt: Date): Promise<number> {
    try {
      const result = await this.sessionRepository.update(
        { id: sessionId },
        { expiresAt },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
  async updateLastActivity(
    sessionId: string,
    lastActivityAt: Date,
  ): Promise<number> {
    try {
      const result = await this.sessionRepository.update(
        { id: sessionId },
        { lastActivityAt },
      );
      return result.affected || 0;
    } catch (error: unknown) {
      return handleServerError(error);
    }
  }
}
