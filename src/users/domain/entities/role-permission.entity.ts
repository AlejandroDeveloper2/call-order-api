export class RolePermission {
  constructor(
    public readonly rolePermissionId: string,
    public readonly permissionId: string,
    public readonly roleId: string,
  ) {}
}
