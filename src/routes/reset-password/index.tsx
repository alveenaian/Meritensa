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
import { Scale } from "lucide-react";
import { BRAND } from "~/lib/config/brand";

export const Route = createFileRoute("/reset-password/")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || "",
    };
  },
});

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token } = Route.useSearch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPasswordMutation = useMutation(
    trpc.resetPassword.mutationOptions({
      onSuccess: () => {
        toast.success("Password reset successfully! Please sign in.");
        navigate({ to: "/login" });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reset password");
      },
    })
  );

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    resetPasswordMutation.mutate({
      token,
      password: data.password,
    });
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-red-600 mb-4">Invalid or missing reset token</p>
              <Link to="/forgot-password">
                <Button>Request New Reset Link</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <Link to="/" className="mb-8 block text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary-600 p-3">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{BRAND.name}</h1>
          <p className="mt-2 text-gray-600">Set Your New Password</p>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                helperText="At least 8 characters, 1 uppercase, 1 number"
                error={errors.password?.message}
                {...register("password")}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={resetPasswordMutation.isPending}
              >
                Reset Password
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
