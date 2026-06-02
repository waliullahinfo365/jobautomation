"use client";

import { usePDF } from "@react-pdf/renderer";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { CvTemplateData, CvTemplateId } from "@/lib/cv-templates/types";

interface Props {
  templateId: CvTemplateId;
  data: CvTemplateData;
  filename: string;
}

// Inner component — only rendered client-side (no SSR)
function PdfDownloadInner({ templateId, data, filename }: Props) {
  const [TemplateComponent, setTemplate] = React.useState<React.ComponentType<{ data: CvTemplateData }> | null>(null);

  useEffect(() => {
    // Dynamically load the template component
    const load = async () => {
      let Comp: React.ComponentType<{ data: CvTemplateData }>;
      switch (templateId) {
        case "modern-with-photo": {
          const m = await import("@/lib/cv-templates/modern-with-photo");
          Comp = m.ModernWithPhotoCv;
          break;
        }
        case "classic-no-photo": {
          const m = await import("@/lib/cv-templates/classic-no-photo");
          Comp = m.ClassicNoPhotoCv;
          break;
        }
        case "classic-with-photo": {
          const m = await import("@/lib/cv-templates/classic-with-photo");
          Comp = m.ClassicWithPhotoCv;
          break;
        }
        default: {
          const m = await import("@/lib/cv-templates/modern-no-photo");
          Comp = m.ModernNoPhotoCv;
        }
      }
      setTemplate(() => Comp);
    };
    void load();
  }, [templateId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const document = TemplateComponent ? React.createElement(TemplateComponent as any, { data }) : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [instance] = usePDF({ document: (document ?? undefined) as any });

  if (!TemplateComponent || instance.loading) {
    return (
      <Button disabled className="w-full">
        Preparing PDF…
      </Button>
    );
  }

  if (instance.error) {
    return (
      <Button disabled className="w-full bg-red-600">
        PDF error — try again
      </Button>
    );
  }

  return (
    <a
      href={instance.url ?? "#"}
      download={filename}
      className="block w-full"
    >
      <Button className="w-full">
        ⬇ Download PDF
      </Button>
    </a>
  );
}

export default PdfDownloadInner;
