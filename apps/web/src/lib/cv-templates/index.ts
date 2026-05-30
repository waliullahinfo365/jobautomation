import React from "react";
import type { CvTemplateData, CvTemplateId } from "./types";

export { CV_TEMPLATE_OPTIONS } from "./types";
export type { CvTemplateData, CvTemplateId, CvTemplateOption } from "./types";

export async function renderCvToPdf(templateId: CvTemplateId, data: CvTemplateData): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");

  let element: React.ReactElement;

  switch (templateId) {
    case "modern-with-photo": {
      const { ModernWithPhotoCv } = await import("./modern-with-photo");
      element = React.createElement(ModernWithPhotoCv, { data });
      break;
    }
    case "classic-no-photo": {
      const { ClassicNoPhotoCv } = await import("./classic-no-photo");
      element = React.createElement(ClassicNoPhotoCv, { data });
      break;
    }
    case "classic-with-photo": {
      const { ClassicWithPhotoCv } = await import("./classic-with-photo");
      element = React.createElement(ClassicWithPhotoCv, { data });
      break;
    }
    default: {
      const { ModernNoPhotoCv } = await import("./modern-no-photo");
      element = React.createElement(ModernNoPhotoCv, { data });
    }
  }

  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
