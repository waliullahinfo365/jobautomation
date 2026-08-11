import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingSectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingSectionCard({ title, description, children }: SettingSectionCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 border-b border-[var(--border-subtle)] p-4 sm:p-5 lg:p-6">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {description ? <CardDescription className="max-w-3xl">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="p-4 sm:p-5 lg:p-6">{children}</CardContent>
    </Card>
  );
}
