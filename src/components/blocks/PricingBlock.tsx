import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "~/components/ui/Button";
import type { PricingBlock as PricingBlockType } from "./types";

export function PricingBlock({ data }: { data: PricingBlockType["data"] }) {
  return (
    <div className="bg-gradient-to-br from-secondary-50 via-white to-secondary-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(data.title || data.subtitle) && (
          <div className="text-center mb-16 fade-in">
            {data.title && (
              <h2 className="text-4xl font-bold text-secondary-900 sm:text-5xl">
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p className="mt-4 text-xl text-secondary-600 max-w-2xl mx-auto">
                {data.subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`grid gap-8 ${
          data.tiers.length === 2 ? "md:grid-cols-2 max-w-4xl mx-auto" :
          data.tiers.length === 3 ? "md:grid-cols-3" :
          "md:grid-cols-2 lg:grid-cols-4"
        }`}>
          {data.tiers.map((tier, index) => (
            <div
              key={index}
              className={`
                relative rounded-2xl p-8 transition-all duration-300 fade-in
                ${tier.highlighted 
                  ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-2xl scale-105 border-4 border-primary-400" 
                  : "bg-white shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-primary-300"
                }
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1 text-sm font-semibold text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${tier.highlighted ? "text-white" : "text-secondary-900"}`}>
                  {tier.name}
                </h3>
                {tier.description && (
                  <p className={`text-sm ${tier.highlighted ? "text-primary-100" : "text-secondary-600"}`}>
                    {tier.description}
                  </p>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className={`text-5xl font-bold ${tier.highlighted ? "text-white" : "text-secondary-900"}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={`ml-2 text-lg ${tier.highlighted ? "text-primary-100" : "text-secondary-600"}`}>
                      {tier.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      tier.highlighted ? "text-primary-200" : "text-primary-600"
                    }`} />
                    <span className={`text-sm ${tier.highlighted ? "text-white" : "text-secondary-700"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to={tier.ctaLink}>
                <Button
                  className={`w-full ${
                    tier.highlighted
                      ? "bg-white text-primary-700 hover:bg-primary-50 shadow-lg"
                      : "bg-primary-600 text-white hover:bg-primary-700 shadow-md"
                  }`}
                  size="lg"
                >
                  {tier.ctaText}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
