export interface CvTemplateData {
  // Personal info
  fullName: string;
  headline: string;
  summary: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  photoUrl?: string;

  // Content sections
  skills?: string[];
  experience?: Array<{
    role: string;
    company: string;
    period?: string;
    bullets: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  languages?: Array<{ name: string; level?: string }>;
  certifications?: string[];
}

export type CvTemplateId = "modern-no-photo" | "modern-with-photo" | "classic-no-photo" | "classic-with-photo";

export interface CvTemplateOption {
  id: CvTemplateId;
  label: string;
  description: string;
  hasPhoto: boolean;
}

export const CV_TEMPLATE_OPTIONS: CvTemplateOption[] = [
  { id: "modern-no-photo",    label: "Modern",            description: "Clean two-column, no photo",         hasPhoto: false },
  { id: "modern-with-photo",  label: "Modern + Photo",    description: "Clean two-column with profile photo", hasPhoto: true  },
  { id: "classic-no-photo",   label: "Classic",           description: "Single-column, no photo",            hasPhoto: false },
  { id: "classic-with-photo", label: "Classic + Photo",   description: "Single-column with profile photo",   hasPhoto: true  },
];
