import * as LucideIcons from "lucide-react";
import type { FeaturesBlock as FeaturesBlockType } from "./types";

// Helper to get icon component by name
function getIcon(iconName: string) {
  const Icon = (LucideIcons as any)[iconName];
  return Icon ? <Icon className="h-8 w-8 text-primary-600" /> : null;
}

export function FeaturesBlock({ data }: { data: FeaturesBlockType["data"] }) {
  const columns = data.columns || 3;
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(data.title || data.subtitle) && (
          <div className="text-center mb-16 fade-in">
            {data.title && (
              <h2 className="text-4xl font-bold text-secondary-900 sm:text-5xl">
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p className="mt-4 text-lg text-secondary-600 max-w-2xl mx-auto">{data.subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid gap-8 ${gridCols[columns]}`}>
          {data.features.map((feature, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border-2 border-secondary-100 bg-white p-8 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary-200 hover:-translate-y-2 fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                {getIcon(feature.icon)}
              </div>
              <h3 className="mb-3 text-xl font-semibold text-secondary-900 group-hover:text-primary-700 transition-colors">
                {feature.title}
              </h3>
              <p className="text-secondary-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
