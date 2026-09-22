import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "~/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
    
    const variants = {
      primary: "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md focus:ring-primary-500 active:scale-[0.98]",
      secondary: "bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 hover:border-primary-300 focus:ring-primary-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus:ring-red-500 active:scale-[0.98]",
      ghost: "text-secondary-700 hover:bg-secondary-100 focus:ring-secondary-500",
    };
    
    const sizes = {
      sm: "px-3.5 py-2 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-6 py-3 text-lg",
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
