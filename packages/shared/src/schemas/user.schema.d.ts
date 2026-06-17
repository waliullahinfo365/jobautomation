import { z } from "zod";
export declare const userCreateSchema: z.ZodObject<{
    tenantId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    passwordHash: z.ZodString;
    role: z.ZodEnum<["Owner", "Admin", "Member", "Viewer"]>;
    status: z.ZodDefault<z.ZodEnum<["Active", "Invited", "Suspended", "Removed"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: "Active" | "Suspended" | "Invited" | "Removed";
    tenantId: string;
    email: string;
    passwordHash: string;
    role: "Owner" | "Admin" | "Member" | "Viewer";
}, {
    name: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    role: "Owner" | "Admin" | "Member" | "Viewer";
    status?: "Active" | "Suspended" | "Invited" | "Removed" | undefined;
}>;
export declare const userUpdateSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    passwordHash: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["Owner", "Admin", "Member", "Viewer"]>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["Active", "Invited", "Suspended", "Removed"]>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    status?: "Active" | "Suspended" | "Invited" | "Removed" | undefined;
    tenantId?: string | undefined;
    email?: string | undefined;
    passwordHash?: string | undefined;
    role?: "Owner" | "Admin" | "Member" | "Viewer" | undefined;
}, {
    name?: string | undefined;
    status?: "Active" | "Suspended" | "Invited" | "Removed" | undefined;
    tenantId?: string | undefined;
    email?: string | undefined;
    passwordHash?: string | undefined;
    role?: "Owner" | "Admin" | "Member" | "Viewer" | undefined;
}>;
