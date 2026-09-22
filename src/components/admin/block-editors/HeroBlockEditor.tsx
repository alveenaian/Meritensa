import { Button } from "~/components/ui/Button";
import { Plus, Trash2, Info } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface HeroBlockEditorProps {
  block: Extract<Block, { type: "hero" }>;
  setBlock: (block: Block) => void;
}

export function HeroBlockEditor({ block, setBlock }: HeroBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  const addButton = () => {
    const buttons = block.data.buttons || [];
    buttons.push({ text: "Button", href: "/", variant: "primary" });
    updateData("buttons", buttons);
  };

  const updateButton = (index: number, key: string, value: any) => {
    const buttons = [...(block.data.buttons || [])];
    buttons[index] = { ...buttons[index], [key]: value };
    updateData("buttons", buttons);
  };

  const deleteButton = (index: number) => {
    const buttons = (block.data.buttons || []).filter((_, i) => i !== index);
    updateData("buttons", buttons);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
        <textarea
          value={block.data.title}
          onChange={(e) => updateData("title", e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 min-h-[100px] focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all text-lg font-semibold"
          placeholder="Your Hero Title&#10;Second Line (optional)"
        />
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Use line breaks for multi-line titles with gradient effects
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Subtitle</label>
        <textarea
          value={block.data.subtitle}
          onChange={(e) => updateData("subtitle", e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 min-h-[80px] focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
          placeholder="A compelling subtitle that describes your offering"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Gradient Style</label>
          <select
            value={block.data.gradient || "primary"}
            onChange={(e) => updateData("gradient", e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
          >
            <option value="primary">Primary (Indigo)</option>
            <option value="secondary">Secondary (Gray)</option>
            <option value="accent">Accent (Purple/Pink)</option>
            <option value="warm">Warm (Orange/Red)</option>
            <option value="cool">Cool (Blue/Cyan)</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={block.data.showPattern !== false}
              onChange={(e) => updateData("showPattern", e.target.checked)}
              className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Show grid pattern</span>
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-900">Call-to-Action Buttons</label>
          <Button size="sm" onClick={addButton} variant="secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Button
          </Button>
        </div>
        <div className="space-y-3">
          {(block.data.buttons || []).map((button, i) => (
            <div key={i} className="card-premium fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Button {i + 1}</span>
                <button 
                  onClick={() => deleteButton(i)} 
                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={button.text}
                  onChange={(e) => updateButton(i, "text", e.target.value)}
                  placeholder="Button text"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <input
                  type="text"
                  value={button.href}
                  onChange={(e) => updateButton(i, "href", e.target.value)}
                  placeholder="/link or https://example.com"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <select
                  value={button.variant}
                  onChange={(e) => updateButton(i, "variant", e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                >
                  <option value="primary">Primary (Filled)</option>
                  <option value="secondary">Secondary (Outlined)</option>
                </select>
              </div>
            </div>
          ))}
          {(block.data.buttons || []).length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No buttons yet. Click "Add Button" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
