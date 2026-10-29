"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { useSavedReports } from "@/client/offline/hooks";
import { isUiLanguage } from "@/lib/uiTranslations";
import { useLanguage } from "@/components/LanguageProvider";
import logo from "../../public/logo.png";

// Home is the logo. signIn: the page requires sign-in (lib/routeAccess.ts).
const navItems = [
  { href: "/map", label: "Map", signIn: false },
  { href: "/guide", label: "Plant Guide", signIn: false },
  { href: "/submit", label: "Submit", signIn: true },
  { href: "/drafts", label: "Drafts", signIn: true },
  { href: "/log", label: "My Log", signIn: true },
  { href: "/dashboard", label: "Dashboard", signIn: true },
];

function NavLink({
  href,
  active,
  mobile,
  prefetch,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  mobile?: boolean;
  prefetch?: false;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`rounded-md font-medium transition-colors ${
        mobile ? "block px-3 py-2 text-base" : "whitespace-nowrap px-2 py-2 text-sm"
      } ${
        active
          ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Reports saved on this device, shown as a count next to Drafts
  const savedCount = useSavedReports()?.length ?? 0;
  // Drafts is for signed-in users, and for anyone with reports waiting on this device
  const items = navItems.filter((item) => item.href !== "/drafts" || isSignedIn || savedCount > 0);

  const links = (mobile: boolean) => (
    <>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          active={pathname === item.href}
          mobile={mobile}
          // Prefetching a sign-in page while signed out only fetches a redirect
          prefetch={item.signIn && !isSignedIn ? false : undefined}
          onClick={mobile ? () => setIsMenuOpen(false) : undefined}
        >
          {t(item.label)}
          {item.href === "/drafts" && savedCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
              {savedCount}
            </span>
          )}
        </NavLink>
      ))}
    </>
  );

  const languageSelector = (
    <label className="inline-flex flex-col items-center justify-center gap-0.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-200">
      <select
        aria-label={t("Language")}
        data-testid="language-selector"
        value={language}
        onChange={(event) => {
          if (isUiLanguage(event.target.value)) setLanguage(event.target.value);
        }}
        className="max-w-[148px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <option value="en">🇺🇸 English</option>
        <option value="es">🇪🇸 Español</option>
        <option value="pt">🇧🇷 Português</option>
      </select>
    </label>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <Image src={logo} alt="" width={40} height={40} priority />
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {links(false)}
            <SignedOut>
              <Link
                href="/sign-in"
                className="inline-flex min-w-[108px] items-center justify-center rounded-md bg-[#136207] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0d4705]"
              >
                {t("Sign In")}
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            </SignedIn>
            {languageSelector}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:hover:bg-gray-800"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">
                {isMenuOpen ? t("Close main menu") : t("Open main menu")}
              </span>
              <svg
                className="block h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div id="mobile-menu" className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
        <div className="space-y-1 border-t bg-white px-2 pb-3 pt-2 dark:border-gray-800 dark:bg-gray-900 sm:px-3">
          {links(true)}
          <div className="flex flex-wrap items-center justify-center gap-4 border-t border-gray-200 pb-2 pt-4 dark:border-gray-700">
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md bg-[#136207] px-3 py-2 text-center text-base font-medium text-white transition-colors hover:bg-[#0d4705]"
              >
                {t("Sign In")}
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
            </SignedIn>
            {languageSelector}
          </div>
        </div>
      </div>
    </nav>
  );
}
