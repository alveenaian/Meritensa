import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Scale, Home, Briefcase, BarChart3, Users, Shield, LogOut, Menu, X, FileText, Navigation, Settings } from "lucide-react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { cn } from "~/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";

export function AdminLayout({ children }: { children: React.ReactNode }) {
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
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "All Cases", href: "/admin/cases", icon: Briefcase },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Features", href: "/admin/features", icon: Shield },
    { name: "Pages", href: "/admin/pages", icon: FileText },
    { name: "Navigation", href: "/admin/navigation", icon: Navigation },
    { name: "Settings", href: "/admin/settings", icon: Settings },
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
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-to-b from-secondary-900 via-secondary-800 to-secondary-900 shadow-elevated transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <Link to="/admin" className="flex h-16 items-center border-b border-secondary-700/50 px-6 bg-secondary-800/50">
            <Shield className="h-8 w-8 text-primary-400" />
            <span className="ml-2 text-xl font-bold text-white">
              Admin Portal
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href !== "/admin" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-secondary-300 hover:bg-secondary-700/50 hover:text-white"
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
          <div className="border-t border-secondary-700/50 p-4 bg-secondary-800/50">
            <div className="mb-3 flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-secondary-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-secondary-300 transition-all duration-200 hover:bg-secondary-700/50 hover:text-white"
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
            <Shield className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">Admin Access</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-secondary-50 via-white to-secondary-50/50 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
