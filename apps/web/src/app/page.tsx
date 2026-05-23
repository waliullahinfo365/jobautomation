import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "NewJob Guru — AI Job Application Automation Platform",
  description:
    "Automate your entire job search with AI. Track applications, generate cover letters, manage interviews, and never miss a follow-up. The intelligent job search command center.",
  openGraph: {
    title: "NewJob Guru — AI Job Application Automation Platform",
    description:
      "Stop manually managing job applications. NewJob Guru automates your entire job hunt with AI-powered tracking, cover letters, and interview scheduling.",
    type: "website",
    siteName: "NewJob Guru",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewJob Guru — AI Job Application Automation",
    description:
      "Your AI-powered job search command center. Automate applications, cover letters, follow-ups, and your entire job pipeline.",
  },
  keywords: [
    "job application automation",
    "AI cover letter generator",
    "job tracker",
    "interview scheduler",
    "career automation",
    "job search assistant",
  ],
};

export default function Page() {
  return <LandingPage />;
}
