export class User {
  constructor(
    private readonly userId: string,
    private fullname: string,
    private readonly roleId: string,
    private avatar?: string,
    private phone?: string,
    private isActive: boolean = true,
  ) {}

  static create(
    userId: string,
    fullname: string,
    roleId: string,
    avatar?: string,
    phone?: string,
    isActive: boolean = true,
  ): User {
    return new User(userId, fullname, roleId, avatar, phone, isActive);
  }

  toggleState(isActive: boolean): void {
    this.isActive = isActive;
  }

  get getUserId(): string {
    return this.userId;
  }

  get getFullname(): string {
    return this.fullname;
  }

  get getRoleId(): string {
    return this.roleId;
  }

  get getAvatar(): string | undefined {
    return this.avatar;
  }

  get getPhone(): string | undefined {
    return this.phone;
  }

  get getIsActive(): boolean {
    return this.isActive;
  }
}
