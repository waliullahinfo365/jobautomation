import { z } from "zod";
export declare const tenantCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    ownerId: z.ZodString;
    plan: z.ZodEnum<["Free Trial", "Starter", "Pro", "Agency", "Enterprise"]>;
    status: z.ZodDefault<z.ZodEnum<["Active", "Trialing", "Past Due", "Suspended", "Cancelled"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    ownerId: string;
    plan: "Free Trial" | "Starter" | "Pro" | "Agency" | "Enterprise";
    status: "Active" | "Trialing" | "Past Due" | "Suspended" | "Cancelled";
}, {
    name: string;
    slug: string;
    ownerId: string;
    plan: "Free Trial" | "Starter" | "Pro" | "Agency" | "Enterprise";
    status?: "Active" | "Trialing" | "Past Due" | "Suspended" | "Cancelled" | undefined;
}>;
export declare const tenantUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    ownerId: z.ZodOptional<z.ZodString>;
    plan: z.ZodOptional<z.ZodEnum<["Free Trial", "Starter", "Pro", "Agency", "Enterprise"]>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["Active", "Trialing", "Past Due", "Suspended", "Cancelled"]>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    slug?: string | undefined;
    ownerId?: string | undefined;
    plan?: "Free Trial" | "Starter" | "Pro" | "Agency" | "Enterprise" | undefined;
    status?: "Active" | "Trialing" | "Past Due" | "Suspended" | "Cancelled" | undefined;
}, {
    name?: string | undefined;
    slug?: string | undefined;
    ownerId?: string | undefined;
    plan?: "Free Trial" | "Starter" | "Pro" | "Agency" | "Enterprise" | undefined;
    status?: "Active" | "Trialing" | "Past Due" | "Suspended" | "Cancelled" | undefined;
}>;
