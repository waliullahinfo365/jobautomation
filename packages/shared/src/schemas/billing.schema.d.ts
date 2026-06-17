import { z } from "zod";
export declare const billingSchema: z.ZodObject<{
    tenantId: z.ZodString;
    plan: z.ZodEnum<["Free Trial", "Starter", "Pro", "Agency", "Enterprise"]>;
    status: z.ZodEnum<["Trialing", "Active", "Past Due", "Cancelled"]>;
    stripeCustomerId: z.ZodOptional<z.ZodString>;
    stripeSubscriptionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    plan: "Free Trial" | "Starter" | "Pro" | "Agency" | "Enterprise";
    status: "Active" | "Trialing" | "Past Due" | "Cancelled";
    tenantId: string;
    stripeCustomerId?: string | undefined;
    stripeSubscriptionId?: string | undefined;
}, {
    plan: "Free Trial" | "Starter" | "Pro" | "Agency" | "Enterprise";
    status: "Active" | "Trialing" | "Past Due" | "Cancelled";
    tenantId: string;
    stripeCustomerId?: string | undefined;
    stripeSubscriptionId?: string | undefined;
}>;
