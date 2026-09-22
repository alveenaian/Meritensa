import type { ImageBlock as ImageBlockType } from "./types";

export function ImageBlock({ data }: { data: ImageBlockType["data"] }) {
  const size = data.size || "lg";
  const rounded = data.rounded !== false;

  const sizeClass = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    full: "max-w-full",
  };

  return (
    <div className="bg-white py-12">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${sizeClass[size]} mx-auto`}>
          <img
            src={data.src}
            alt={data.alt}
            className={`w-full h-auto shadow-lg ${rounded ? "rounded-2xl" : ""}`}
          />
          {data.caption && (
            <p className="mt-4 text-center text-sm text-secondary-600 italic">
              {data.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
