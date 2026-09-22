import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import type { CTABlock as CTABlockType } from "./types";

const gradientMap = {
  primary: "from-primary-600 to-primary-700",
  secondary: "from-secondary-600 to-secondary-700",
  accent: "from-purple-600 to-pink-600",
  warm: "from-orange-600 to-red-600",
  cool: "from-blue-600 to-cyan-600",
};

export function CTABlock({ data }: { data: CTABlockType["data"] }) {
  const gradient = data.gradient || "primary";

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradientMap[gradient]} py-20`}>
      <div className="absolute inset-0 bg-grid opacity-10"></div>
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="fade-in">
          <h2 className="text-4xl font-bold text-white sm:text-5xl slide-in-bottom">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="mt-6 text-xl text-white/90 max-w-2xl mx-auto slide-in-bottom" style={{ animationDelay: "100ms" }}>
              {data.subtitle}
            </p>
          )}
          {data.buttons && data.buttons.length > 0 && (
            <div className="mt-10 flex justify-center gap-4 flex-wrap slide-in-bottom" style={{ animationDelay: "200ms" }}>
              {data.buttons.map((button, i) => (
                <Link key={i} to={button.href}>
                  <Button
                    size="lg"
                    variant={button.variant}
                    className={`
                      ${button.variant === "secondary" 
                        ? "bg-white text-primary-600 hover:bg-primary-50 border-2 border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-0.5" 
                        : "bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                      }
                      transition-all duration-300
                    `}
                  >
                    {button.text}
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
