import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Scale, Mail, Linkedin, Twitter, Facebook } from "lucide-react";
import { useTRPC } from "~/trpc/react";
import Markdown from "markdown-to-jsx";

export function PublicFooter() {
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

  const footerContent = settings?.footerText || settings?.description || "AI-powered case preparation for plaintiffs seeking justice.";

  return (
    <footer className="border-t border-secondary-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center">
              <Scale className="h-6 w-6 text-primary-600" />
              <span className="ml-2 text-lg font-bold text-secondary-900">
                {settings?.siteName || "Kairav.ai"}
              </span>
            </div>
            <div className="mt-4 text-sm text-secondary-600 leading-relaxed prose prose-sm max-w-none">
              <Markdown>{footerContent}</Markdown>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              {navItems.map((item) => {
                if (item.isExternal) {
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-secondary-600 hover:text-primary-600 transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={item.id}>
                    <Link
                      to={item.href}
                      className="text-sm text-secondary-600 hover:text-primary-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 uppercase tracking-wider">
              Connect
            </h3>
            <ul className="mt-4 space-y-3">
              {settings?.contactEmail && (
                <li>
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings?.linkedinUrl && (
                <li>
                  <a
                    href={settings.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    Follow us on LinkedIn
                  </a>
                </li>
              )}
              {settings?.twitterUrl && (
                <li>
                  <a
                    href={settings.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    Follow us on Twitter
                  </a>
                </li>
              )}
              {settings?.facebookUrl && (
                <li>
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors"
                  >
                    <Facebook className="h-4 w-4" />
                    Follow us on Facebook
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-secondary-200 pt-8">
          <p className="text-center text-sm text-secondary-500">
            © {settings?.copyrightYear || new Date().getFullYear()} {settings?.companyName || "Kairav.ai"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
