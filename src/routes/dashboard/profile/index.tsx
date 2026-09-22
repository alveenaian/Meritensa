import { createFileRoute, redirect } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { User, Lock, Mail, MapPin, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/dashboard/profile/")({
  component: ProfilePage,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
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

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  state: z.string().min(1, "Please select your state"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function ProfilePage() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Fetch fresh user data
  const userQuery = useQuery(
    trpc.getCurrentUser.queryOptions({
      token: token!,
    })
  );

  const currentUser = userQuery.data || user;

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: currentUser?.name || "",
      state: currentUser?.state || "",
    },
  });

  const updateProfileMutation = useMutation(
    trpc.updateProfile.mutationOptions({
      onSuccess: (data) => {
        // Update auth store with new user data
        setAuth(data, token!);
        toast.success("Profile updated successfully!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    })
  );

  const onSubmitProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate({
      token: token!,
      name: data.name,
      state: data.state,
    });
  };

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const changePasswordMutation = useMutation(
    trpc.changePassword.mutationOptions({
      onSuccess: () => {
        // Password changed successfully - server has revoked all sessions
        // Clear local auth state and redirect to login
        clearAuth();
        toast.success("Password changed successfully! Please log in again.");
        navigate({ to: '/login', replace: true });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to change password");
      },
    })
  );

  const onSubmitPassword = (data: PasswordFormData) => {
    changePasswordMutation.mutate({
      token: token!,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const deleteAccountMutation = useMutation(
    trpc.deleteAccount.mutationOptions({
      onSuccess: () => {
        toast.success("Account deleted successfully");
        clearAuth();
        navigate({ to: "/" });
      },
      onError: (error) => {
        setDeleteError(error.message || "Failed to delete account");
      },
    })
  );

  const handleDeleteAccount = () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password");
      return;
    }
    
    setDeleteError("");
    deleteAccountMutation.mutate({
      token: token!,
      password: deletePassword,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account information
          </p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              <CardTitle>Personal Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                error={profileErrors.name?.message}
                {...registerProfile("name")}
              />

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  helperText="Email cannot be changed"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4" />
                  State <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20"
                  {...registerProfile("state")}
                >
                  <option value="">Select your state</option>
                  {US_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
                {profileErrors.state && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {profileErrors.state.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary-600" />
              <CardTitle>Change Password</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                error={passwordErrors.currentPassword?.message}
                {...registerPassword("currentPassword")}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                helperText="At least 8 characters, 1 uppercase, 1 number"
                error={passwordErrors.newPassword?.message}
                {...registerPassword("newPassword")}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword("confirmPassword")}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={changePasswordMutation.isPending}
                >
                  Change Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Account Type
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {currentUser?.role === "ADMIN" ? "Administrator" : "Plaintiff"}
                </p>
                {currentUser?.state && (
                  <p className="mt-2 text-xs text-gray-500">
                    Registered in {currentUser.state}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-red-900">Delete Account</h3>
                <p className="mt-1 text-sm text-red-700">
                  Once you delete your account, there is no going back. This will permanently delete:
                </p>
                <ul className="mt-2 ml-4 list-disc text-sm text-red-700 space-y-1">
                  <li>Your profile and account information</li>
                  <li>All your cases and case data</li>
                  <li>All uploaded documents and files</li>
                  <li>All messages and conversation history</li>
                </ul>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(true)}
                className="border-red-300 bg-white text-red-700 hover:bg-red-100 hover:text-red-800"
              >
                Delete My Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
              </div>
              
              <p className="mb-4 text-sm text-gray-600">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              
              <div className="mb-4">
                <Input
                  label="Enter your password to confirm"
                  type="password"
                  placeholder="••••••••"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError("");
                  }}
                  error={deleteError}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  className="flex-1"
                  disabled={deleteAccountMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  isLoading={deleteAccountMutation.isPending}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
