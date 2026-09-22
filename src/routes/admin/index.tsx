import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { 
  Users, 
  Briefcase, 
  FileText, 
  Activity,
  TrendingUp,
  BarChart3,
  Clock,
  Handshake,
  Database,
  AlertCircle
} from "lucide-react";
import { formatDate } from "~/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== "ADMIN") {
      throw redirect({ to: '/login' });
    }
  },
});

function AdminDashboardPage() {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);

  const summaryQuery = useQuery(
    trpc.getAnalyticsSummary.queryOptions({
      token: token!,
    })
  );

  const activityQuery = useQuery(
    trpc.getRecentActivity.queryOptions({
      token: token!,
      limit: 10,
    })
  );

  const healthQuery = useQuery(
    trpc.getSystemHealth.queryOptions({
      token: token!,
    })
  );

  if (summaryQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const summary = summaryQuery.data;

  if (!summary) {
    return (
      <AdminLayout>
        <div className="text-center">
          <p className="text-red-600">Failed to load analytics</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of platform activity and case management
          </p>
        </div>

        {/* Key metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={summary.totalUsers}
            icon={<Users className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Total Cases"
            value={summary.totalCases}
            icon={<Briefcase className="h-6 w-6" />}
            color="purple"
            subtitle={`${summary.recentCases} this week`}
          />
          <MetricCard
            title="Referral Requests"
            value={summary.referralRequestsCount}
            icon={<Handshake className="h-6 w-6" />}
            color="green"
            subtitle="Pending review"
          />
          <MetricCard
            title="Avg Score"
            value={summary.averageScore.toFixed(1)}
            icon={<TrendingUp className="h-6 w-6" />}
            color="orange"
          />
        </div>

        {/* Database Access Instructions for TrySolid Preview */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-blue-900">Database Access</CardTitle>
                <p className="text-sm text-blue-700 mt-1">
                  How to access the database in preview environments
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">
                    If the database button gives an "ERR_ADDRESS_INVALID" error:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-1">
                    <li>Navigate directly to <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">/codapt/db/</code> in your browser</li>
                    <li>Enter username: <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">admin</code></li>
                    <li>Enter the password from your <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">ADMIN_PASSWORD</code> environment variable</li>
                  </ol>
                  <p className="mt-3 text-xs text-blue-600">
                    <strong>Why this happens:</strong> Modern browsers block URLs with embedded credentials 
                    (like https://user:pass@domain.com) for security reasons. This is a browser security 
                    feature, not a bug in the application. The direct navigation method above works around 
                    this limitation.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <a
                  href="/codapt/db/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
                >
                  <Database className="h-4 w-4" />
                  Open Database Admin Panel
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Health</CardTitle>
              <button
                onClick={() => healthQuery.refetch()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Refresh
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {healthQuery.isLoading ? (
              <div className="text-center py-4">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"></div>
              </div>
            ) : healthQuery.data ? (
              <div className="space-y-3">
                <HealthStatusItem
                  label="Database"
                  status={healthQuery.data.database.status}
                  message={healthQuery.data.database.message}
                />
                <HealthStatusItem
                  label="Object Storage (Minio)"
                  status={healthQuery.data.minio.status}
                  message={healthQuery.data.minio.message}
                />
                <HealthStatusItem
                  label="AI API (Anthropic)"
                  status={healthQuery.data.anthropic.status}
                  message={healthQuery.data.anthropic.message}
                />
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Last checked: {new Date(healthQuery.data.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Failed to load health status</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cases by status */}
          <Card>
            <CardHeader>
              <CardTitle>Cases by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.casesByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(item.status)}`} />
                      <span className="text-sm text-gray-700">
                        {formatStatus(item.status)}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Score distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.scoreDistribution.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-primary-600"
                        style={{
                          width: `${(item.count / summary.totalCases) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {activityQuery.data?.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <Activity className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {event.event}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activityQuery.data || activityQuery.data.length === 0) && (
                  <p className="text-center text-sm text-gray-500 py-8">
                    No recent activity
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "green" | "orange";
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    INTAKE: "bg-blue-500",
    INTAKE_COMPLETE: "bg-green-500",
    UNDER_REVIEW: "bg-yellow-500",
    REFERRAL_PENDING: "bg-purple-500",
    REFERRED: "bg-indigo-500",
    CLOSED: "bg-gray-500",
  };
  return colors[status] || "bg-gray-500";
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function HealthStatusItem({
  label,
  status,
  message,
}: {
  label: string;
  status: "healthy" | "unhealthy" | "unknown";
  message: string;
}) {
  const statusConfig = {
    healthy: { color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" },
    unhealthy: { color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
    unknown: { color: "bg-gray-500", textColor: "text-gray-700", bgColor: "bg-gray-50" },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bgColor}`}>
      <div className={`h-3 w-3 rounded-full ${config.color} mt-1 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className={`text-xs ${config.textColor} mt-0.5`}>{message}</p>
      </div>
    </div>
  );
}
