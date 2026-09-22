import { Info } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface SpacerBlockEditorProps {
  block: Extract<Block, { type: "spacer" }>;
  setBlock: (block: Block) => void;
}

export function SpacerBlockEditor({ block, setBlock }: SpacerBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Spacing Height</label>
        <select
          value={block.data.height}
          onChange={(e) => updateData("height", e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        >
          <option value="sm">Small (2rem / 32px)</option>
          <option value="md">Medium (4rem / 64px)</option>
          <option value="lg">Large (6rem / 96px)</option>
          <option value="xl">Extra Large (8rem / 128px)</option>
        </select>
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Add vertical spacing between sections
        </p>
      </div>
    </div>
  );
}
