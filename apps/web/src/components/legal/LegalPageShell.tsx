import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-white">
      <header className="border-b border-white/10 bg-[#0a0b10]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={BRAND.iconPath} alt={BRAND.name} className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-sm font-semibold sm:text-base">{BRAND.name}</span>
          </Link>
          <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/50">Last updated: {lastUpdated}</p>
        <article className="prose prose-invert mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-400 prose-p:text-white/75 prose-li:text-white/75 prose-strong:text-white">
          {children}
        </article>
        <footer className="mt-12 border-t border-white/10 pt-8 text-sm text-white/45">
          <p>
            Questions? Contact{" "}
            <a href="mailto:info@benjaminkueper.com" className="text-blue-400 hover:text-blue-300">
              info@benjaminkueper.com
            </a>
          </p>
          <p className="mt-3">
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              ← Back to home
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
