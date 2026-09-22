import { Button } from "~/components/ui/Button";
import { Plus, Trash2, Info } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface FeaturesBlockEditorProps {
  block: Extract<Block, { type: "features" }>;
  setBlock: (block: Block) => void;
}

export function FeaturesBlockEditor({ block, setBlock }: FeaturesBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  const addFeature = () => {
    const features = [...block.data.features];
    features.push({ icon: "CheckCircle", title: "Feature", description: "Description" });
    updateData("features", features);
  };

  const updateFeature = (index: number, key: string, value: any) => {
    const features = [...block.data.features];
    features[index] = { ...features[index], [key]: value };
    updateData("features", features);
  };

  const deleteFeature = (index: number) => {
    const features = block.data.features.filter((_, i) => i !== index);
    updateData("features", features);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Title</label>
        <input
          type="text"
          value={block.data.title || ""}
          onChange={(e) => updateData("title", e.target.value)}
          placeholder="Features that matter"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Subtitle</label>
        <input
          type="text"
          value={block.data.subtitle || ""}
          onChange={(e) => updateData("subtitle", e.target.value)}
          placeholder="Everything you need to succeed"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Grid Columns</label>
        <select
          value={block.data.columns || 3}
          onChange={(e) => updateData("columns", parseInt(e.target.value))}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        >
          <option value="2">2 columns</option>
          <option value="3">3 columns</option>
          <option value="4">4 columns</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-900">Features</label>
          <Button size="sm" onClick={addFeature} variant="secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Feature
          </Button>
        </div>
        <div className="space-y-3">
          {block.data.features.map((feature, i) => (
            <div key={i} className="card-premium fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Feature {i + 1}</span>
                <button 
                  onClick={() => deleteFeature(i)} 
                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={feature.icon}
                    onChange={(e) => updateFeature(i, "icon", e.target.value)}
                    placeholder="Icon name (e.g., CheckCircle, Star, Zap)"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Lucide icon name (e.g., CheckCircle, Star, Zap, Shield)
                  </p>
                </div>
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) => updateFeature(i, "title", e.target.value)}
                  placeholder="Feature title"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(i, "description", e.target.value)}
                  placeholder="Feature description"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm min-h-[60px] focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
              </div>
            </div>
          ))}
          {block.data.features.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No features yet. Click "Add Feature" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
