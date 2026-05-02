import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderTreeIcon } from "@/components/icons";

export function FolderTreePreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderTreeIcon size={16} />
          Folder Tree Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-[var(--text-2)]">
        <p>Job Applications</p>
        <p className="ml-4">- Company Folder</p>
        <p className="ml-8">- Job Role Subfolder</p>
        <p className="ml-12">- CV</p>
        <p className="ml-12">- Cover Letter</p>
        <p className="ml-12">- Research</p>
        <p className="ml-12">- Exports</p>
      </CardContent>
    </Card>
  );
}
