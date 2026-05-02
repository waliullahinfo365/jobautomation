import type { Metadata } from "next";
import { ContactsPageClient } from "@/components/contacts/ContactsPageClient";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return <ContactsPageClient />;
}
