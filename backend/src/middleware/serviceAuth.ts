import { Request, Response, NextFunction } from 'express';

export function authenticateService(req: Request, res: Response, next: NextFunction): void {
  const serviceKey = req.headers['x-service-key'] as string;
  const expectedKey = process.env.SERVICE_API_KEY;

  if (!expectedKey) {
    next();
    return;
  }

  if (serviceKey && serviceKey === expectedKey) {
    (req as any).isServiceCall = true;
    (req as any).user = { id: 0, email: 'system@servicetsunami.com', name: 'ServiceTsunami', role: 'admin' };
    next();
    return;
  }

  next();
}
