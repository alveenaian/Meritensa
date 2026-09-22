import type { Block } from "~/components/blocks/types";

interface ImageBlockEditorProps {
  block: Extract<Block, { type: "image" }>;
  setBlock: (block: Block) => void;
}

export function ImageBlockEditor({ block, setBlock }: ImageBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Image URL</label>
        <input
          type="text"
          value={block.data.src}
          onChange={(e) => updateData("src", e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
        {block.data.src && (
          <div className="mt-3 rounded-xl overflow-hidden border-2 border-gray-200">
            <img src={block.data.src} alt="Preview" className="w-full h-48 object-cover" />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Alt Text</label>
        <input
          type="text"
          value={block.data.alt}
          onChange={(e) => updateData("alt", e.target.value)}
          placeholder="Descriptive text for accessibility"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Caption (optional)</label>
        <input
          type="text"
          value={block.data.caption || ""}
          onChange={(e) => updateData("caption", e.target.value)}
          placeholder="Image caption or credit"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Display Size</label>
          <select
            value={block.data.size || "lg"}
            onChange={(e) => updateData("size", e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="full">Full Width</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={block.data.rounded !== false}
              onChange={(e) => updateData("rounded", e.target.checked)}
              className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Rounded corners</span>
          </label>
        </div>
      </div>
    </div>
  );
}
