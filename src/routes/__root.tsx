import {
  Outlet,
  createRootRoute,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { TRPCReactProvider } from "~/trpc/react";
import { CookieConsent } from "~/components/ui/CookieConsent";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootLayout() {
  const trpc = useTRPC();
  
  // Fetch site settings for theme customization
  const settingsQuery = useQuery(
    trpc.getSiteSettings.queryOptions()
  );

  // Apply theme CSS variables when settings load
  useEffect(() => {
    if (settingsQuery.data) {
      const settings = settingsQuery.data;
      const root = document.documentElement;

      // Apply primary color if set
      if (settings.primaryColor) {
        root.style.setProperty('--primary-600', settings.primaryColor);
        // Generate lighter/darker shades based on the primary color
        // For simplicity, we'll just set the main color
        root.style.setProperty('--primary-500', settings.primaryColor);
        root.style.setProperty('--primary-700', settings.primaryColor);
      }

      // Apply accent color if set
      if (settings.accentColor) {
        root.style.setProperty('--accent-purple', settings.accentColor);
      }

      // Apply font families if set
      if (settings.fontFamily) {
        root.style.setProperty('font-family', settings.fontFamily);
      }

      if (settings.headingFont) {
        // Check if we already have a heading font style element
        let styleEl = document.getElementById('heading-font-style');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'heading-font-style';
          document.head.appendChild(styleEl);
        }
        // Update the style content
        styleEl.textContent = `
          h1, h2, h3, h4, h5, h6 {
            font-family: ${settings.headingFont} !important;
          }
        `;
      }
    }
  }, [settingsQuery.data]);

  return (
    <>
      <Outlet />
      <CookieConsent />
    </>
  );
}

function RootComponent() {
  // Note: Error tracking (Sentry) can be initialized here if SENTRY_DSN is configured
  // Example:
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && import.meta.env.VITE_SENTRY_DSN) {
  //     Sentry.init({
  //       dsn: import.meta.env.VITE_SENTRY_DSN,
  //       environment: import.meta.env.MODE,
  //       integrations: [new Sentry.BrowserTracing()],
  //       tracesSampleRate: 1.0,
  //     });
  //   }
  // }, []);

  return (
    <TRPCReactProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <RootLayout />
    </TRPCReactProvider>
  );
}
