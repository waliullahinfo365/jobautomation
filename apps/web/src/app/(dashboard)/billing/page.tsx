import { redirect } from "next/navigation";

type BillingPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BillingPage({ searchParams }: BillingPageProps) {
  const params = new URLSearchParams({ section: "Billing" });
  const checkout = searchParams?.checkout;
  if (typeof checkout === "string") {
    params.set("checkout", checkout);
  }
  redirect(`/settings?${params.toString()}`);
}
