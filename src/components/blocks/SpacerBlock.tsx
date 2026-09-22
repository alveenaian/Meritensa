import type { SpacerBlock as SpacerBlockType } from "./types";

export function SpacerBlock({ data }: { data: SpacerBlockType["data"] }) {
  const heightClass = {
    sm: "h-8",
    md: "h-16",
    lg: "h-24",
    xl: "h-32",
  };

  return <div className={heightClass[data.height]} />;
}
