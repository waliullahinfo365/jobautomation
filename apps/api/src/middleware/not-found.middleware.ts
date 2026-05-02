import type { Request, Response } from "express";
export function notFoundMiddleware(req: Request, res: Response) { res.status(404).json({ success:false, error:{ message:`Route not found: ${req.method} ${req.originalUrl}`, code:"NOT_FOUND", requestId:req.requestId } }); }
