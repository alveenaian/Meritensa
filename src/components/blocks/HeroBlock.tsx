import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/Button";
import type { HeroBlock as HeroBlockType } from "./types";

const gradientMap = {
  primary: "from-primary-50 via-white to-secondary-50",
  secondary: "from-secondary-50 via-white to-secondary-100",
  accent: "from-purple-50 via-white to-pink-50",
  warm: "from-orange-50 via-white to-red-50",
  cool: "from-blue-50 via-white to-cyan-50",
};

export function HeroBlock({ data }: { data: HeroBlockType["data"] }) {
  const gradient = data.gradient || "primary";
  const showPattern = data.showPattern !== false;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradientMap[gradient]}`}>
      {showPattern && (
        <div className="absolute inset-0 bg-grid opacity-30"></div>
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center fade-in">
          <h1 className="text-5xl font-bold tracking-tight text-secondary-900 sm:text-6xl lg:text-7xl leading-tight slide-in-bottom">
            {data.title.split("\n").map((line, i) => (
              <span 
                key={i} 
                className={i > 0 ? "block mt-2 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-700 bg-clip-text text-transparent pb-2" : "block"}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>
          {data.subtitle && (
            <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-secondary-600 slide-in-bottom" style={{ animationDelay: "200ms" }}>
              {data.subtitle}
            </p>
          )}
          {data.buttons && data.buttons.length > 0 && (
            <div className="mt-10 flex justify-center gap-4 flex-wrap slide-in-bottom" style={{ animationDelay: "300ms" }}>
              {data.buttons.map((button, i) => (
                <Link key={i} to={button.href}>
                  <Button
                    size="lg"
                    variant={button.variant}
                    className={`
                      ${button.variant === "primary" ? "px-8 shadow-lg hover:shadow-xl hover:-translate-y-0.5" : "shadow-md hover:shadow-lg"} 
                      transition-all duration-300
                    `}
                  >
                    {button.text}
                    {button.variant === "primary" && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
