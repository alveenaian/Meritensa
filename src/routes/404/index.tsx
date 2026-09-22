import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Scale, Home, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useAuthStore } from "~/lib/stores/auth.store";
import { BRAND } from "~/lib/config/brand";

export const Route = createFileRoute("/404/")({
  component: NotFoundPage,
});

function NotFoundPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const handleGoBack = () => {
    router.history.back();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 py-12">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary-600 p-3">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{BRAND.name}</h1>
        </div>

        {/* 404 Message */}
        <div className="mb-8">
          <h2 className="text-9xl font-extrabold text-primary-600">404</h2>
          <h3 className="mt-4 text-3xl font-bold text-gray-900">Page Not Found</h3>
          <p className="mt-4 text-lg text-gray-600 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
