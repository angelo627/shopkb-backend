import { UserRole, UserStatus } from "../shared/constants/auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        sessionId: string;
      };
    }
  }
}

export {};