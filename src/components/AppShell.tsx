import Link from "next/link";
import { APP_NAME, NAV_LINKS } from "@/constants";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topnav">
        <div className="topnav-inner">
          <Link href="/" className="brand">
            {APP_NAME}
          </Link>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
