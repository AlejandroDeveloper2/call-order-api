/** Tipos de dominio */
import type { PaginatedResponse } from '../../../../shared/domain/types';

/** Modelos de lectura */
import { AccountWithoutSensitiveDataModel } from '../../../domain/models';

/** Puertos */
import { AccountRepositoryPort } from '../../../domain/ports';

/** Commands */
import { FindAccountsQueryCommand } from '../../commands';

export class FindAccountsUseCase {
  constructor(private readonly accountRepository: AccountRepositoryPort) {}
  async run(
    query: FindAccountsQueryCommand,
  ): Promise<PaginatedResponse<AccountWithoutSensitiveDataModel>> {
    return await this.accountRepository.find(query);
  }
}
