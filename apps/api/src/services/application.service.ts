import { ApplicationModel } from "@jobflow/database/models";
export async function list(){ return ApplicationModel.find().limit(20); }
export async function getById(id:string){ return ApplicationModel.findById(id); }
export async function create(payload:Record<string,unknown>){ return ApplicationModel.create(payload); }
export async function update(id:string,payload:Record<string,unknown>){ return ApplicationModel.findByIdAndUpdate(id,payload,{new:true}); }
