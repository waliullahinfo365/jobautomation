"use client";

import Link from "next/link";
import { Zap, Twitter, Github, Linkedin, Mail } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
    { label: "Roadmap", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Status Page", href: "#" },
    { label: "Help Center", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
  Connect: [
    { label: "Contact Us", href: "mailto:hello@newjobguru.com" },
    { label: "Twitter / X", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "GitHub", href: "#" },
    { label: "Discord Community", href: "#" },
  ],
};

const SOCIAL_LINKS = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@newjobguru.com", label: "Email" },
];

export function LandingFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--lp-bd)", background: "var(--lp-card3)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Zap size={15} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-[17px] tracking-tight" style={{ color: "var(--lp-t1)" }}>
                NewJob <span className="text-blue-500">Guru</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5 max-w-[220px]" style={{ color: "var(--lp-t4)" }}>
              AI-powered job search automation. Stop managing. Start landing.
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:text-blue-500 hover:scale-110"
                  style={{ color: "var(--lp-t4)", border: "1px solid var(--lp-bd)", background: "var(--lp-card2)" }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--lp-t3)" }}>{category}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-sm hover:text-blue-500 transition-colors" style={{ color: "var(--lp-t5)" }}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid var(--lp-bd3)" }}>
          <p className="text-sm" style={{ color: "var(--lp-t5)" }}>
            © {new Date().getFullYear()} NewJob Guru. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: "var(--lp-t5)" }}>All systems operational</span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <a key={l} href="#" className="text-xs hover:text-blue-500 transition-colors" style={{ color: "var(--lp-t5)" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
