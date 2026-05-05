import { z } from "zod";
export const idParamSchema=z.object({id:z.string().min(1)});
export const jobIdParamSchema = z.object({ id: z.string().min(1) });
export const documentIdParamSchema = z.object({ id: z.string().min(1) });
export const interviewIdParamSchema = z.object({ id: z.string().min(1) });
export const moduleKeyParamSchema=z.object({moduleKey:z.string().min(1)});
export const providerParamSchema=z.object({provider:z.enum(["gmail","google-drive","google-calendar","notion","slack","smtp","manual"])});
export const listQuerySchema=z.object({page:z.coerce.number().optional(),limit:z.coerce.number().optional(),search:z.string().optional(),status:z.string().optional(),sortBy:z.string().optional(),sortOrder:z.enum(["asc","desc"]).optional(),jobId:z.string().optional(),workspaceProfile:z.enum(["true","false"]).optional()});
