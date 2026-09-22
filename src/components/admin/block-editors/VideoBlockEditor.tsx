import { Info } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface VideoBlockEditorProps {
  block: Extract<Block, { type: "video" }>;
  setBlock: (block: Block) => void;
}

export function VideoBlockEditor({ block, setBlock }: VideoBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Video URL</label>
        <input
          type="text"
          value={block.data.url}
          onChange={(e) => updateData("url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Supports YouTube, Vimeo, and direct video URLs (.mp4, .webm, .ogg)
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Caption (optional)</label>
        <input
          type="text"
          value={block.data.caption || ""}
          onChange={(e) => updateData("caption", e.target.value)}
          placeholder="Video caption or credit"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Aspect Ratio</label>
        <select
          value={block.data.aspectRatio || "16:9"}
          onChange={(e) => updateData("aspectRatio", e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        >
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="4:3">4:3 (Standard)</option>
          <option value="1:1">1:1 (Square)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={block.data.autoplay || false}
            onChange={(e) => updateData("autoplay", e.target.checked)}
            className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700">Auto-play video</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={block.data.controls !== false}
            onChange={(e) => updateData("controls", e.target.checked)}
            className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700">Show controls</span>
        </label>
      </div>
    </div>
  );
}
