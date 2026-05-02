import { JobModel } from "@database/models";
export async function list(){ return JobModel.find().limit(20); }
export async function getById(id:string){ return JobModel.findById(id); }
export async function create(payload:Record<string,unknown>){ return JobModel.create(payload); }
export async function update(id:string,payload:Record<string,unknown>){ return JobModel.findByIdAndUpdate(id,payload,{new:true}); }
