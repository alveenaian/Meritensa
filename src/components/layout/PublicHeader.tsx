import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { BRAND } from "~/lib/config/brand";

export function PublicHeader() {
  const trpc = useTRPC();

  const settingsQuery = useQuery(
    trpc.getSiteSettings.queryOptions()
  );

  const navigationQuery = useQuery(
    trpc.listNavigationItems.queryOptions({
      includeDisabled: false,
    })
  );

  const settings = settingsQuery.data;
  const navItems = navigationQuery.data || [];

  return (
    <nav className="sticky top-0 z-50 border-b border-secondary-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Scale className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-2xl font-bold text-secondary-900">
              {settings?.siteName || BRAND.name}
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              if (item.isExternal) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-secondary-700 hover:text-secondary-900 transition-colors"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link key={item.id} to={item.href}>
                  <Button variant="ghost">{item.label}</Button>
                </Link>
              );
            })}
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
