import type { UserRole, Department } from '../../generated/prisma/client.js';

declare global {
  namespace Express {
    interface UserContext {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      department: Department;
      isActive: boolean;
      lastLoginAt: Date | null;
      lastFailedLoginAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }

    interface Request {
      user?: UserContext;
      authToken?: string;
    }
  }
}

export {};
