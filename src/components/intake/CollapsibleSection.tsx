import { Disclosure } from "@headlessui/react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  sectionNumber: number;
  isComplete: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  sectionNumber,
  isComplete,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <Disclosure.Button className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  isComplete
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  sectionNumber
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-gray-500 transition-transform",
                open && "rotate-180"
              )}
            />
          </Disclosure.Button>
          <Disclosure.Panel className="px-6 py-4 border-t border-gray-200">
            {children}
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}
