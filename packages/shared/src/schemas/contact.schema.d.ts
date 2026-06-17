import { z } from "zod";
export declare const contactCreateSchema: z.ZodObject<{
    tenantId: z.ZodString;
    createdBy: z.ZodString;
    name: z.ZodString;
    relationship: z.ZodEnum<["Recruiter", "Hiring Manager", "Referral", "Employee", "Networking", "Other"]>;
    email: z.ZodOptional<z.ZodString>;
    followUpStatus: z.ZodDefault<z.ZodEnum<["Not Needed", "Scheduled", "Due Today", "Overdue", "Sent"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    tenantId: string;
    createdBy: string;
    followUpStatus: "Not Needed" | "Scheduled" | "Due Today" | "Overdue" | "Sent";
    relationship: "Recruiter" | "Hiring Manager" | "Referral" | "Employee" | "Networking" | "Other";
    email?: string | undefined;
}, {
    name: string;
    tenantId: string;
    createdBy: string;
    relationship: "Recruiter" | "Hiring Manager" | "Referral" | "Employee" | "Networking" | "Other";
    email?: string | undefined;
    followUpStatus?: "Not Needed" | "Scheduled" | "Due Today" | "Overdue" | "Sent" | undefined;
}>;
export declare const contactUpdateSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    relationship: z.ZodOptional<z.ZodEnum<["Recruiter", "Hiring Manager", "Referral", "Employee", "Networking", "Other"]>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    followUpStatus: z.ZodOptional<z.ZodDefault<z.ZodEnum<["Not Needed", "Scheduled", "Due Today", "Overdue", "Sent"]>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    tenantId?: string | undefined;
    email?: string | undefined;
    createdBy?: string | undefined;
    followUpStatus?: "Not Needed" | "Scheduled" | "Due Today" | "Overdue" | "Sent" | undefined;
    relationship?: "Recruiter" | "Hiring Manager" | "Referral" | "Employee" | "Networking" | "Other" | undefined;
}, {
    name?: string | undefined;
    tenantId?: string | undefined;
    email?: string | undefined;
    createdBy?: string | undefined;
    followUpStatus?: "Not Needed" | "Scheduled" | "Due Today" | "Overdue" | "Sent" | undefined;
    relationship?: "Recruiter" | "Hiring Manager" | "Referral" | "Employee" | "Networking" | "Other" | undefined;
}>;
