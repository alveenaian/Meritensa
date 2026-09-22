import * as LucideIcons from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { CardGridBlock as CardGridBlockType } from "./types";

// Helper to get icon component by name
function getIcon(iconName: string) {
  const Icon = (LucideIcons as any)[iconName];
  return Icon ? <Icon className="h-6 w-6 text-primary-600" /> : null;
}

export function CardGridBlock({ data }: { data: CardGridBlockType["data"] }) {
  const columns = data.columns || 3;
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className="bg-secondary-50/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(data.title || data.subtitle) && (
          <div className="text-center mb-12 fade-in">
            {data.title && (
              <h2 className="text-3xl font-bold text-secondary-900 sm:text-4xl">
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p className="mt-4 text-lg text-secondary-600 max-w-2xl mx-auto">{data.subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid gap-6 ${gridCols[columns]}`}>
          {data.cards.map((card, i) => {
            const CardWrapper = card.link ? Link : "div";
            const cardProps = card.link ? { to: card.link } : {};

            return (
              <CardWrapper
                key={i}
                {...cardProps}
                className={`
                  group rounded-2xl border-2 border-secondary-100 bg-white p-6 shadow-md 
                  transition-all duration-300 hover:shadow-xl hover:border-primary-200 hover:-translate-y-2 
                  fade-in
                  ${card.link ? 'cursor-pointer' : ''}
                `}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {card.image && (
                  <div className="mb-4 overflow-hidden rounded-xl">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                {card.icon && !card.image && (
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                    {getIcon(card.icon)}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-secondary-600 text-sm leading-relaxed">
                  {card.description}
                </p>
                {card.link && (
                  <div className="mt-4 flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700">
                    Learn more
                    <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </div>
  );
}
