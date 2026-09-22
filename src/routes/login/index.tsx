import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Scale } from "lucide-react";
import { BRAND } from "~/lib/config/brand";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'ADMIN') {
        throw redirect({ to: '/admin' });
      } else {
        throw redirect({ to: '/dashboard' });
      }
    }
  },
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation(
    trpc.login.mutationOptions({
      onSuccess: (data) => {
        setAuth(data.user, data.token);
        toast.success("Welcome back!");
        
        // Redirect based on role
        if (data.user.role === 'ADMIN') {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/dashboard" });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Login failed");
      },
    })
  );

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <Link to="/" className="mb-8 block text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-4 shadow-md">
            <Scale className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-secondary-900">{BRAND.name}</h1>
          <p className="mt-2 text-lg text-secondary-600">
            {BRAND.tagline}
          </p>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />

              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                />
                <div className="mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={loginMutation.isPending}
              >
                Sign in
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-secondary-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Legal disclaimer */}
        <p className="mt-6 text-center text-xs text-secondary-500 leading-relaxed max-w-md mx-auto">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="text-primary-600 hover:text-primary-700 underline transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary-600 hover:text-primary-700 underline transition-colors">
            Privacy Policy
          </Link>
          . {BRAND.name} provides legal information, not legal advice.
        </p>
      </div>
    </div>
  );
}
