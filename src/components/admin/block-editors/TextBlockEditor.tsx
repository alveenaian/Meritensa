import { Info } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface TextBlockEditorProps {
  block: Extract<Block, { type: "text" }>;
  setBlock: (block: Block) => void;
}

export function TextBlockEditor({ block, setBlock }: TextBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Content (Markdown)</label>
        <textarea
          value={block.data.content}
          onChange={(e) => updateData("content", e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-mono text-sm min-h-[300px] focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
          placeholder="# Your Heading&#10;&#10;Write your content here using **markdown** formatting."
        />
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Supports markdown: **bold**, *italic*, [links](url), # headings, etc.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Text Alignment</label>
          <select
            value={block.data.align || "left"}
            onChange={(e) => updateData("align", e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Max Width</label>
          <select
            value={block.data.maxWidth || "xl"}
            onChange={(e) => updateData("maxWidth", e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
          >
            <option value="sm">Small (640px)</option>
            <option value="md">Medium (768px)</option>
            <option value="lg">Large (1024px)</option>
            <option value="xl">Extra Large (1280px)</option>
            <option value="full">Full Width</option>
          </select>
        </div>
      </div>
    </div>
  );
}
