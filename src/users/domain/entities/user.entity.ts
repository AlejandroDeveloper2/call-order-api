import { Account } from './account.entity';
import { Role } from './role.entity';

export class User {
  constructor(
    public readonly userId: string,
    public fullname: string,
    public readonly accountId: string,
    public readonly roleId: string,
    public avatar?: string,
    public phone?: string,
    public isActive: boolean = true,
    public readonly account?: Account,
    public readonly role?: Role,
  ) {}

  updateUserStatus(isActive: boolean): void {
    this.isActive = isActive;
  }
}
