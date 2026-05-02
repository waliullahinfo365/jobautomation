import type { Metadata } from "next";
import { DocumentsPageClient } from "@/components/documents/DocumentsPageClient";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return <DocumentsPageClient />;
}
