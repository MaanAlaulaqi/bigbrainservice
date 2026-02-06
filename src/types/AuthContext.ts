export type AuthContext = {
  orgId: string;
  employeeId: string;
  roles: string[];
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
