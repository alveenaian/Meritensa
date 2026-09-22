import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { useTRPC } from "~/trpc/react";
import { Scale, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { BRAND } from "~/lib/config/brand";

export const Route = createFileRoute("/forgot-password/")({
  component: ForgotPasswordPage,
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation(
    trpc.forgotPassword.mutationOptions({
      onSuccess: () => {
        setSubmitted(true);
        toast.success("Password reset instructions sent!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send reset email");
      },
    })
  );

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <Link to="/" className="mb-8 block text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary-600 p-3">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{BRAND.name}</h1>
          <p className="mt-2 text-gray-600">Reset Your Password</p>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  Enter your email address and we'll send you instructions to
                  reset your password.
                </p>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={forgotPasswordMutation.isPending}
                  >
                    Send Reset Instructions
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-100 p-3">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  If an account exists with that email, you'll receive password
                  reset instructions shortly.
                </p>
                <p className="text-xs text-gray-500">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
