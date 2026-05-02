import type { FilterQuery, Model } from "mongoose";
import { ApiError } from "../utils/errors";
export function assertTenantId(tenantId?: string): string { if(!tenantId) throw new ApiError("Tenant context is required",400,"TENANT_REQUIRED"); return tenantId; }
export function buildTenantFilter<T>(tenantId: string, extraFilter: FilterQuery<T> = {}) { return { tenantId, ...extraFilter } as FilterQuery<T>; }
export function applyPagination<T>(query:T,page:number,limit:number){ const skip=(page-1)*limit; // @ts-expect-error mongoose chain
 return query.skip(skip).limit(limit); }
export async function createTenantScopedRecord<T extends { tenantId:string; createdBy?:string }>(ModelRef:Model<T>,tenantId:string,userId:string,payload:Partial<T>){ return ModelRef.create({ ...payload, tenantId, createdBy: payload.createdBy ?? userId }); }
export async function findTenantScopedById<T extends { tenantId:string }>(ModelRef:Model<T>,tenantId:string,id:string){ return ModelRef.findOne({_id:id,tenantId}); }
export async function updateTenantScopedById<T extends { tenantId:string }>(ModelRef:Model<T>,tenantId:string,id:string,payload:Partial<T>){ return ModelRef.findOneAndUpdate({_id:id,tenantId},payload,{new:true}); }
export async function archiveTenantScopedById<T extends { tenantId:string; archivedAt?:Date }>(ModelRef:Model<T>,tenantId:string,id:string,payload:Partial<T>={}){ return ModelRef.findOneAndUpdate({_id:id,tenantId},{...payload,archivedAt:new Date()},{new:true}); }
