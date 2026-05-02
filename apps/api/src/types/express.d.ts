export {};
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      tenantId?: string;
      user?: {
        id: string;
        tenantId?: string;
        role?: string;
        email?: string;
      };
    }
  }
}
