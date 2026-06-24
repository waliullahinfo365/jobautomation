import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingSectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingSectionCard({ title, description, children }: SettingSectionCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-1 p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">{children}</CardContent>
    </Card>
  );
}
