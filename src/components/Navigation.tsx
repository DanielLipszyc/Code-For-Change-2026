"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useLanguage } from "@/components/LanguageProvider";
import { isLanguage } from "@/lib/translation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/submit", label: "Submit" },
  { href: "/guide", label: "Invasive Plant Guide" },
  { href: "/log", label: "My Log" },
  { href: "/map", label: "Map"},
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const languageSelector = (
    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
      <span className="sr-only">{t("Select language")}</span>
      <select
        aria-label={t("Select language")}
        data-testid="language-selector"
        value={language}
        onChange={(event) => {
          if (isLanguage(event.target.value)) setLanguage(event.target.value);
        }}
        className="min-w-32 rounded-md border border-gray-300 bg-white px-2 py-2 text-center text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 [text-align-last:center]"
      >
        <option value="en">🇺🇸 English</option>
        <option value="es">🇪🇸 Español</option>
        <option value="pt">🇧🇷 Português</option>
      </select>
    </label>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
            <img style= {{
                  width: '10%',
                  height: 'auto',
                  objectFit: "contain",
                  display: "block"
                }} 
                src="/logo.png" alt="Home"/>
              <span className="text-xl font-bold">
                <span
                  className="inline-block"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #f59e0b 0%, #38bdf8 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Swamp
                </span>
                <span
                  className="ml-1 inline-block"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Spotter
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {t(item.label)}
              </Link>
            ))}

            {/* Authentication UI */}
            <SignedOut>
              <Link
                href="/sign-in"
                className="inline-flex min-w-[108px] items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold bg-[#136207] text-white shadow-sm hover:bg-[#0d4705] transition-colors"
              >
                {t("Sign In")}
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
            </SignedIn>
            {languageSelector}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded="false"
            >
              <span className="sr-only">{t("Open main menu")}</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === item.href
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {t(item.label)}
            </Link>
          ))}

          {/* Mobile Authentication UI */}
          <div className="pt-4 pb-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2 px-3">
              <SignedOut>
                <Link
                  href="/sign-in"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 rounded-md bg-[#136207] px-3 py-2 text-center text-base font-medium text-white transition-colors hover:bg-[#0d4705]"
                >
                  {t("Sign In")}
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                    },
                  }}
                />
              </SignedIn>
              {languageSelector}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
