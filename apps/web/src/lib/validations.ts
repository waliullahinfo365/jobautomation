// Re-exports Zod schemas from /schemas for convenience.
// Use these in both API route handlers and client-side forms.

export { jobSchema, updateJobSchema }      from "@/schemas/job.schema";
export { applicationSchema }               from "@/schemas/application.schema";
export { contactSchema }                   from "@/schemas/contact.schema";
export { documentSchema }                  from "@/schemas/document.schema";
export { integrationSchema }               from "@/schemas/integration.schema";
