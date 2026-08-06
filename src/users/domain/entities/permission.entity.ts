export class Permission {
  constructor(
    public readonly permissionId: string,
    public readonly code: string,
    public readonly description: string,
  ) {}
}
