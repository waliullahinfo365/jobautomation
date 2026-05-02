import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // TODO: Add server-side auth guard (getServerSession / redirect to /login).
  return <DashboardShell>{children}</DashboardShell>;
}
