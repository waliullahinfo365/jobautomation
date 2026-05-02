import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { errorResponse } from "../utils/apiResponse";
export function validateBody(schema: ZodSchema){ return (req:Request,res:Response,next:NextFunction)=>{ const r=schema.safeParse(req.body); if(!r.success) return errorResponse(res,"Invalid request body","VALIDATION_ERROR",422,r.error.flatten()); req.body=r.data; next(); }; }
export function validateParams(schema: ZodSchema){ return (req:Request,res:Response,next:NextFunction)=>{ const r=schema.safeParse(req.params); if(!r.success) return errorResponse(res,"Invalid route params","VALIDATION_ERROR",422,r.error.flatten()); req.params=r.data; next(); }; }
export function validateQuery(schema: ZodSchema){ return (req:Request,res:Response,next:NextFunction)=>{ const r=schema.safeParse(req.query); if(!r.success) return errorResponse(res,"Invalid query params","VALIDATION_ERROR",422,r.error.flatten()); req.query=r.data; next(); }; }
