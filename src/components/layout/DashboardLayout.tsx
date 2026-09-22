import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Scale, Home, Briefcase, FileText, User, LogOut, Menu, X, HelpCircle } from "lucide-react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { cn } from "~/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { BRAND } from "~/lib/config/brand";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const trpc = useTRPC();

  const logoutMutation = useMutation(
    trpc.logout.mutationOptions()
  );

  const handleLogout = async () => {
    if (!token) {
      // If no token, just clear local state and redirect
      clearAuth();
      toast.success("Logged out successfully");
      navigate({ to: "/login", replace: true });
      return;
    }

    try {
      // Call server-side logout to revoke session
      await logoutMutation.mutateAsync({
        token: token,
      });
    } catch (error) {
      // Continue with logout even if server call fails (e.g., network error)
      console.error("Server-side logout failed:", error);
    } finally {
      // Always clear local state
      clearAuth();
      toast.success("Logged out successfully");
      navigate({ to: "/login", replace: true });
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Cases", href: "/dashboard/cases", icon: Briefcase },
    { name: "Documents", href: "/dashboard/documents", icon: FileText },
    { name: "Profile", href: "/dashboard/profile", icon: User },
    { name: "Help & FAQ", href: "/dashboard/help", icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-elevated transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          "border-r border-secondary-200/60",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <Link to="/dashboard" className="flex h-16 items-center border-b border-secondary-200/60 px-6 bg-gradient-to-r from-primary-50/50 to-transparent">
            <Scale className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-secondary-900">
              {BRAND.name}
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-secondary-200/60 p-4 bg-secondary-50/50">
            <div className="mb-3 flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-secondary-900 truncate">{user?.name}</p>
                <p className="text-xs text-secondary-600 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-secondary-700 transition-all duration-200 hover:bg-white hover:text-secondary-900 hover:shadow-sm"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center border-b border-secondary-200/60 bg-white/80 backdrop-blur-sm px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-secondary-500 hover:text-secondary-700 lg:hidden rounded-lg p-2 hover:bg-secondary-100 transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <div className="flex-1" />
          {user?.state && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-100 text-sm text-secondary-700 font-medium">
              <div className="h-2 w-2 rounded-full bg-primary-500"></div>
              {user.state} Resident
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-secondary-50 via-white to-secondary-50/50 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
