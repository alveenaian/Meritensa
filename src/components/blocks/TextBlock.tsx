import Markdown from "markdown-to-jsx";
import type { TextBlock as TextBlockType } from "./types";

export function TextBlock({ data }: { data: TextBlockType["data"] }) {
  const align = data.align || "left";
  const maxWidth = data.maxWidth || "xl";

  const alignClass = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  };

  const maxWidthClass = {
    sm: "max-w-2xl",
    md: "max-w-3xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
    full: "max-w-full",
  };

  return (
    <div className="bg-white py-16 fade-in">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${maxWidthClass[maxWidth]} ${alignClass[align]}`}>
          <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700 prose-a:font-medium prose-strong:text-gray-900 prose-strong:font-semibold prose-code:text-primary-600 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-pre:bg-gray-900 prose-pre:shadow-lg">
            <Markdown>{data.content}</Markdown>
          </article>
        </div>
      </div>
    </div>
  );
}
