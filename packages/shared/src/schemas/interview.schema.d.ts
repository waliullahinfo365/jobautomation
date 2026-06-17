import { z } from "zod";
export declare const interviewCreateSchema: z.ZodObject<{
    tenantId: z.ZodString;
    createdBy: z.ZodString;
    company: z.ZodString;
    position: z.ZodString;
    interviewType: z.ZodEnum<["Recruiter Screen", "Technical", "Behavioral", "Hiring Manager", "Panel", "Final Round", "Offer Discussion"]>;
    status: z.ZodDefault<z.ZodEnum<["Scheduled", "Awaiting Confirmation", "Rescheduled", "Completed", "Cancelled", "No Show"]>>;
    dateTime: z.ZodString;
    prepStatus: z.ZodDefault<z.ZodEnum<["Not Started", "In Progress", "Ready", "Overdue"]>>;
}, "strip", z.ZodTypeAny, {
    status: "Cancelled" | "Completed" | "Scheduled" | "Awaiting Confirmation" | "Rescheduled" | "No Show";
    position: string;
    tenantId: string;
    createdBy: string;
    company: string;
    interviewType: "Hiring Manager" | "Recruiter Screen" | "Technical" | "Behavioral" | "Panel" | "Final Round" | "Offer Discussion";
    dateTime: string;
    prepStatus: "Ready" | "Not Started" | "In Progress" | "Overdue";
}, {
    position: string;
    tenantId: string;
    createdBy: string;
    company: string;
    interviewType: "Hiring Manager" | "Recruiter Screen" | "Technical" | "Behavioral" | "Panel" | "Final Round" | "Offer Discussion";
    dateTime: string;
    status?: "Cancelled" | "Completed" | "Scheduled" | "Awaiting Confirmation" | "Rescheduled" | "No Show" | undefined;
    prepStatus?: "Ready" | "Not Started" | "In Progress" | "Overdue" | undefined;
}>;
export declare const interviewUpdateSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    interviewType: z.ZodOptional<z.ZodEnum<["Recruiter Screen", "Technical", "Behavioral", "Hiring Manager", "Panel", "Final Round", "Offer Discussion"]>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["Scheduled", "Awaiting Confirmation", "Rescheduled", "Completed", "Cancelled", "No Show"]>>>;
    dateTime: z.ZodOptional<z.ZodString>;
    prepStatus: z.ZodOptional<z.ZodDefault<z.ZodEnum<["Not Started", "In Progress", "Ready", "Overdue"]>>>;
}, "strip", z.ZodTypeAny, {
    status?: "Cancelled" | "Completed" | "Scheduled" | "Awaiting Confirmation" | "Rescheduled" | "No Show" | undefined;
    position?: string | undefined;
    tenantId?: string | undefined;
    createdBy?: string | undefined;
    company?: string | undefined;
    interviewType?: "Hiring Manager" | "Recruiter Screen" | "Technical" | "Behavioral" | "Panel" | "Final Round" | "Offer Discussion" | undefined;
    dateTime?: string | undefined;
    prepStatus?: "Ready" | "Not Started" | "In Progress" | "Overdue" | undefined;
}, {
    status?: "Cancelled" | "Completed" | "Scheduled" | "Awaiting Confirmation" | "Rescheduled" | "No Show" | undefined;
    position?: string | undefined;
    tenantId?: string | undefined;
    createdBy?: string | undefined;
    company?: string | undefined;
    interviewType?: "Hiring Manager" | "Recruiter Screen" | "Technical" | "Behavioral" | "Panel" | "Final Round" | "Offer Discussion" | undefined;
    dateTime?: string | undefined;
    prepStatus?: "Ready" | "Not Started" | "In Progress" | "Overdue" | undefined;
}>;
