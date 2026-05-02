import type { Response } from "express";
export function successResponse<T>(res: Response, data: T, message = "Success", statusCode = 200) { return res.status(statusCode).json({ success: true, message, data }); }
export function errorResponse(res: Response, message: string, code = "BAD_REQUEST", statusCode = 400, details?: unknown) { return res.status(statusCode).json({ success: false, error: { message, code, details } }); }
export function paginatedResponse<T>(res: Response, data: T[], pagination: { page:number; limit:number; total:number; totalPages:number }, message = "Success") { return res.status(200).json({ success: true, message, data, pagination }); }
