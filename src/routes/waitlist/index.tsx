import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { Scale, CheckCircle, ArrowRight, Users, TrendingUp, Shield } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card, CardContent } from "~/components/ui/Card";
import { useTRPC } from "~/trpc/react";
import { BRAND } from "~/lib/config/brand";

export const Route = createFileRoute("/waitlist/")({
  component: WaitlistPage,
});

const stepOneSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const stepTwoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  interest: z.enum(["PLAINTIFF", "LAWYER", "INVESTOR", "OTHER"], {
    errorMap: () => ({ message: "Please select an option" }),
  }),
  comments: z.string().max(500, "Comments must be 500 characters or less").optional(),
});

type StepOneFormData = z.infer<typeof stepOneSchema>;
type StepTwoFormData = z.infer<typeof stepTwoSchema>;

function WaitlistPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [waitlistId, setWaitlistId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const trpc = useTRPC();

  const stepOneForm = useForm<StepOneFormData>({
    resolver: zodResolver(stepOneSchema),
  });

  const stepTwoForm = useForm<StepTwoFormData>({
    resolver: zodResolver(stepTwoSchema),
  });

  const stepOneMutation = useMutation(
    trpc.joinWaitlistStepOne.mutationOptions({
      onSuccess: (data) => {
        setWaitlistId(data.id);
        setEmail(data.email);
        setStep(2);
        if (data.alreadyExists) {
          toast.success("Welcome back! Please complete your information.");
        } else {
          toast.success("Great! Just one more step...");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong. Please try again.");
      },
    })
  );

  const stepTwoMutation = useMutation(
    trpc.updateWaitlistStepTwo.mutationOptions({
      onSuccess: () => {
        toast.success("🎉 You're on the waitlist! We'll notify you when we launch.");
        // Show success state
        setStep(2); // Stay on step 2 but show success message
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong. Please try again.");
      },
    })
  );

  const onStepOneSubmit = (data: StepOneFormData) => {
    stepOneMutation.mutate(data);
  };

  const onStepTwoSubmit = (data: StepTwoFormData) => {
    stepTwoMutation.mutate({
      id: waitlistId,
      ...data,
    });
  };

  // Show success state after step 2 is complete
  if (step === 2 && stepTwoMutation.isSuccess) {
    return <SuccessView email={email} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="border-b border-secondary-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center">
              <Scale className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-secondary-900">
                {BRAND.name}
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        {step === 1 ? (
          <StepOne
            form={stepOneForm}
            onSubmit={onStepOneSubmit}
            isLoading={stepOneMutation.isPending}
          />
        ) : (
          <StepTwo
            form={stepTwoForm}
            onSubmit={onStepTwoSubmit}
            isLoading={stepTwoMutation.isPending}
            email={email}
          />
        )}
      </div>

      {/* Trust Indicators */}
      <div className="border-t border-secondary-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <TrustIndicator
              icon={<Shield className="h-6 w-6 text-primary-600" />}
              title="Your data is secure"
              description="We use industry-standard encryption to protect your information"
            />
            <TrustIndicator
              icon={<Users className="h-6 w-6 text-primary-600" />}
              title="Join the movement"
              description="Be among the first to experience the future of legal tech"
            />
            <TrustIndicator
              icon={<TrendingUp className="h-6 w-6 text-primary-600" />}
              title="Early access benefits"
              description="Waitlist members get priority access and exclusive features"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepOne({
  form,
  onSubmit,
  isLoading,
}: {
  form: ReturnType<typeof useForm<StepOneFormData>>;
  onSubmit: (data: StepOneFormData) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <div className="text-center">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-4 shadow-lg">
          <Scale className="h-12 w-12 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-secondary-900 sm:text-5xl lg:text-6xl">
          Join the Waitlist for
          <span className="mt-2 block bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            {BRAND.name}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-secondary-600">
          Be the first to experience the Plaintiff Operating System. AI-powered case preparation
          that helps you organize evidence, understand your legal options, and connect with the
          right attorneys.
        </p>
      </div>

      {/* Benefits */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <BenefitCard
          icon={<CheckCircle className="h-5 w-5 text-primary-600" />}
          text="Early access to the platform"
        />
        <BenefitCard
          icon={<CheckCircle className="h-5 w-5 text-primary-600" />}
          text="Exclusive launch features"
        />
        <BenefitCard
          icon={<CheckCircle className="h-5 w-5 text-primary-600" />}
          text="Priority support"
        />
      </div>

      {/* Email Form */}
      <Card className="mx-auto max-w-md">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Enter your email address"
                error={errors.email?.message}
                {...register("email")}
                className="text-center text-lg"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Join the Waitlist <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
          <p className="mt-4 text-sm text-secondary-500">
            No credit card required • Free to join
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StepTwo({
  form,
  onSubmit,
  isLoading,
  email,
}: {
  form: ReturnType<typeof useForm<StepTwoFormData>>;
  onSubmit: (data: StepTwoFormData) => void;
  isLoading: boolean;
  email: string;
}) {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <div>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">
              <CheckCircle className="h-6 w-6" />
            </div>
            <span className="ml-2 text-sm font-medium text-secondary-900">Email</span>
          </div>
          <div className="h-1 w-16 bg-primary-600"></div>
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-semibold">
              2
            </div>
            <span className="ml-2 text-sm font-medium text-secondary-900">Details</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-bold text-secondary-900 sm:text-4xl">
          Almost there!
        </h2>
        <p className="text-lg text-secondary-600">
          Help us personalize your experience
        </p>
        <p className="mt-2 text-sm text-secondary-500">
          Joining as: <span className="font-medium text-secondary-700">{email}</span>
        </p>
      </div>

      {/* Form */}
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                placeholder="John"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                I'm interested as a... <span className="ml-1 text-red-500">*</span>
              </label>
              <select
                className="block w-full rounded-xl border border-secondary-300 px-4 py-2.5 text-secondary-900 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                {...register("interest")}
              >
                <option value="">Select an option</option>
                <option value="PLAINTIFF">Plaintiff (seeking legal help)</option>
                <option value="LAWYER">Lawyer (interested in referrals)</option>
                <option value="INVESTOR">Investor (business opportunities)</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.interest && (
                <p className="mt-2 text-sm text-red-600">{errors.interest.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                Any comments or feedback? (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Tell us what you're most excited about or any questions you have..."
                className="block w-full rounded-xl border border-secondary-300 px-4 py-2.5 text-secondary-900 placeholder-secondary-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none"
                {...register("comments")}
              />
              {errors.comments && (
                <p className="mt-2 text-sm text-red-600">{errors.comments.message}</p>
              )}
              <p className="mt-2 text-xs text-secondary-500">
                Maximum 500 characters (2-3 sentences)
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Complete Registration <CheckCircle className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SuccessView({ email }: { email: string }) {
  return (
    <div className="text-center">
      <div className="mb-8 inline-flex items-center justify-center rounded-full bg-green-100 p-6">
        <CheckCircle className="h-16 w-16 text-green-600" />
      </div>
      <h2 className="mb-4 text-4xl font-bold text-secondary-900">
        You're on the list!
      </h2>
      <p className="mx-auto mb-8 max-w-lg text-lg text-secondary-600">
        Thank you for joining our waitlist. We'll send updates to{" "}
        <span className="font-medium text-secondary-900">{email}</span> as we get closer to launch.
      </p>
      
      <div className="mb-12 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-8">
        <h3 className="mb-4 text-xl font-semibold text-secondary-900">
          What happens next?
        </h3>
        <ul className="space-y-3 text-left text-secondary-700">
          <li className="flex items-start">
            <CheckCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
            <span>You'll receive a confirmation email shortly</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
            <span>We'll keep you updated on our progress</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
            <span>You'll get early access when we launch</span>
          </li>
        </ul>
      </div>

      <div className="space-x-4">
        <Link to="/">
          <Button variant="secondary" size="lg">
            Back to Home
          </Button>
        </Link>
        <Link to="/login">
          <Button size="lg">
            Already have an account? Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}

function BenefitCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center space-x-2 rounded-xl border border-primary-200 bg-white px-4 py-3 shadow-sm">
      {icon}
      <span className="text-sm font-medium text-secondary-700">{text}</span>
    </div>
  );
}

function TrustIndicator({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-primary-50 p-3">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-secondary-900">{title}</h3>
      <p className="text-sm text-secondary-600">{description}</p>
    </div>
  );
}
