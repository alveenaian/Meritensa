import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/Button";
import { Card, CardContent } from "~/components/ui/Card";
import { useTRPC } from "~/trpc/react";
import { Scale, CheckCircle, XCircle } from "lucide-react";
import { BRAND } from "~/lib/config/brand";

export const Route = createFileRoute("/verify-email/")({
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || "",
    };
  },
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token } = Route.useSearch();

  const verifyEmailMutation = useMutation(
    trpc.verifyEmail.mutationOptions({
      onSuccess: () => {
        toast.success("Email verified successfully!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to verify email");
      },
    })
  );

  useEffect(() => {
    if (token && !verifyEmailMutation.isPending && !verifyEmailMutation.isSuccess && !verifyEmailMutation.isError) {
      verifyEmailMutation.mutate({ token });
    }
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <Link to="/" className="mb-8 block text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary-600 p-3">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{BRAND.name}</h1>
        </Link>

        <Card>
          <CardContent className="py-8">
            {verifyEmailMutation.isPending && (
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verifying your email...
                </h3>
                <p className="text-sm text-gray-600">Please wait a moment.</p>
              </div>
            )}

            {verifyEmailMutation.isSuccess && (
              <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email Verified!
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Your email has been successfully verified. You can now access all features.
                </p>
                <Button onClick={() => navigate({ to: "/dashboard" })}>
                  Go to Dashboard
                </Button>
              </div>
            )}

            {verifyEmailMutation.isError && (
              <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verification Failed
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {verifyEmailMutation.error?.message || "The verification link is invalid or has expired."}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/dashboard">
                    <Button variant="secondary">Go to Dashboard</Button>
                  </Link>
                  <Link to="/login">
                    <Button>Sign In</Button>
                  </Link>
                </div>
              </div>
            )}

            {!token && !verifyEmailMutation.isPending && (
              <div className="text-center">
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Invalid Link
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  The verification link is missing or invalid.
                </p>
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
