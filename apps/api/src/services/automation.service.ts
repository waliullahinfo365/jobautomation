import { AutomationModuleModel } from "@jobflow/database/models";
export async function list(){ return AutomationModuleModel.find().limit(20); }
export async function getById(id:string){ return AutomationModuleModel.findById(id); }
export async function create(payload:Record<string,unknown>){ return AutomationModuleModel.create(payload); }
export async function update(id:string,payload:Record<string,unknown>){ return AutomationModuleModel.findByIdAndUpdate(id,payload,{new:true}); }
