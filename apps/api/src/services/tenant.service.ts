import { TenantModel } from "@jobflow/database/models";
export async function list(){ return TenantModel.find().limit(20); }
export async function getById(id:string){ return TenantModel.findById(id); }
export async function create(payload:Record<string,unknown>){ return TenantModel.create(payload); }
export async function update(id:string,payload:Record<string,unknown>){ return TenantModel.findByIdAndUpdate(id,payload,{new:true}); }
