import type { UserRole } from '@prisma/client';

export type Permission = 'users:manage' | 'auth:self' | 'auth:session' | 'logs:view' | 'dashboard:view' | 'announcements:send';

const rolePermissions: Record<UserRole, Permission[]> = {
  employee: ['auth:self', 'auth:session'],
  agent: ['auth:self', 'auth:session'],
  supervisor: ['auth:self', 'auth:session'],
  admin: ['users:manage', 'auth:self', 'auth:session', 'logs:view', 'dashboard:view', 'announcements:send']
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function getRolePermissions(role: UserRole) {
  return rolePermissions[role];
}
