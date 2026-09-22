import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Checkbox } from "~/components/ui/Checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Scale } from "lucide-react";
import { BRAND } from "~/lib/config/brand";

export const Route = createFileRoute("/register/")({
  component: RegisterPage,
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

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
] as const;

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  state: z.string().min(1, "Please select your state"),
  termsAgreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms of Service and Privacy Policy" }),
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation(
    trpc.register.mutationOptions({
      onSuccess: (data) => {
        setAuth(data.user, data.token);
        toast.success("Account created successfully!");
        
        // Redirect based on role (though new registrations are typically PLAINTIFF)
        if (data.user.role === 'ADMIN') {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/dashboard" });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Registration failed");
      },
    })
  );

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
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
            <CardTitle className="text-center">Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                helperText="At least 8 characters, 1 uppercase, 1 number"
                error={errors.password?.message}
                {...register("password")}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-secondary-700">
                  State <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  className="block w-full rounded-xl border border-secondary-300 px-4 py-2.5 text-secondary-900 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  {...register("state")}
                >
                  <option value="">Select your state</option>
                  {US_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <Checkbox
                label={
                  <span className="text-sm text-secondary-700">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary-600 hover:text-primary-700 underline transition-colors" target="_blank">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary-600 hover:text-primary-700 underline transition-colors" target="_blank">
                      Privacy Policy
                    </Link>
                  </span>
                }
                error={errors.termsAgreed?.message}
                {...register("termsAgreed")}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={registerMutation.isPending}
              >
                Create account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-secondary-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Legal disclaimer is now part of the form as a required checkbox */}
      </div>
    </div>
  );
}
