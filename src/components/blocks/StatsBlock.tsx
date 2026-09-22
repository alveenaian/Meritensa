import type { StatsBlock as StatsBlockType } from "./types";

export function StatsBlock({ data }: { data: StatsBlockType["data"] }) {
  return (
    <div className="bg-gradient-to-br from-secondary-50 to-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {data.title && (
          <h2 className="text-center text-3xl font-bold text-secondary-900 sm:text-4xl mb-12">
            {data.title}
          </h2>
        )}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {data.stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border border-primary-200 bg-white p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-xl font-semibold text-secondary-900 mb-2">
                {stat.label}
              </div>
              {stat.description && (
                <div className="text-sm text-secondary-600">
                  {stat.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
