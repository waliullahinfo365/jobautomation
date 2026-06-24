import { redirect } from "next/navigation";

type BillingSuccessPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BillingSuccessPage({ searchParams }: BillingSuccessPageProps) {
  const params = new URLSearchParams({ section: "Billing", checkout: "success" });
  const sessionId = searchParams?.session_id;
  if (typeof sessionId === "string") params.set("session_id", sessionId);
  redirect(`/settings?${params.toString()}`);
}
