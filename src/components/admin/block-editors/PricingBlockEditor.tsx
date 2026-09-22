import { Button } from "~/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface PricingBlockEditorProps {
  block: Extract<Block, { type: "pricing" }>;
  setBlock: (block: Block) => void;
}

export function PricingBlockEditor({ block, setBlock }: PricingBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  const addTier = () => {
    const tiers = [...block.data.tiers];
    tiers.push({
      name: "Plan Name",
      price: "$99",
      period: "/month",
      description: "Perfect for getting started",
      features: ["Feature 1", "Feature 2", "Feature 3"],
      highlighted: false,
      ctaText: "Get Started",
      ctaLink: "/register",
    });
    updateData("tiers", tiers);
  };

  const updateTier = (index: number, key: string, value: any) => {
    const tiers = [...block.data.tiers];
    tiers[index] = { ...tiers[index], [key]: value };
    updateData("tiers", tiers);
  };

  const deleteTier = (index: number) => {
    const tiers = block.data.tiers.filter((_, i) => i !== index);
    updateData("tiers", tiers);
  };

  const addFeature = (tierIndex: number) => {
    const tiers = [...block.data.tiers];
    tiers[tierIndex].features.push("New feature");
    updateData("tiers", tiers);
  };

  const updateFeature = (tierIndex: number, featureIndex: number, value: string) => {
    const tiers = [...block.data.tiers];
    tiers[tierIndex].features[featureIndex] = value;
    updateData("tiers", tiers);
  };

  const deleteFeature = (tierIndex: number, featureIndex: number) => {
    const tiers = [...block.data.tiers];
    tiers[tierIndex].features = tiers[tierIndex].features.filter((_, i) => i !== featureIndex);
    updateData("tiers", tiers);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Title</label>
        <input
          type="text"
          value={block.data.title || ""}
          onChange={(e) => updateData("title", e.target.value)}
          placeholder="Choose Your Plan"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Subtitle</label>
        <input
          type="text"
          value={block.data.subtitle || ""}
          onChange={(e) => updateData("subtitle", e.target.value)}
          placeholder="Select the perfect plan for your needs"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-900">Pricing Tiers</label>
          <Button size="sm" onClick={addTier} variant="secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Tier
          </Button>
        </div>
        <div className="space-y-4">
          {block.data.tiers.map((tier, i) => (
            <div key={i} className="card-premium fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Tier {i + 1}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tier.highlighted || false}
                      onChange={(e) => updateTier(i, "highlighted", e.target.checked)}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-xs font-medium text-gray-600">Highlight as recommended</span>
                  </label>
                </div>
                <button 
                  onClick={() => deleteTier(i)} 
                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateTier(i, "name", e.target.value)}
                  placeholder="Plan name (e.g., Starter, Pro, Enterprise)"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={tier.price}
                    onChange={(e) => updateTier(i, "price", e.target.value)}
                    placeholder="$99"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={tier.period || ""}
                    onChange={(e) => updateTier(i, "period", e.target.value)}
                    placeholder="/month (optional)"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                  />
                </div>

                <textarea
                  value={tier.description || ""}
                  onChange={(e) => updateTier(i, "description", e.target.value)}
                  placeholder="Brief description (optional)"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm min-h-[60px] focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-700">Features</label>
                    <button
                      type="button"
                      onClick={() => addFeature(i)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Feature
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tier.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(i, fi, e.target.value)}
                          placeholder="Feature description"
                          className="flex-1 rounded-lg border-2 border-gray-200 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => deleteFeature(i, fi)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <input
                    type="text"
                    value={tier.ctaText}
                    onChange={(e) => updateTier(i, "ctaText", e.target.value)}
                    placeholder="Button text"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={tier.ctaLink}
                    onChange={(e) => updateTier(i, "ctaLink", e.target.value)}
                    placeholder="/register"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
          {block.data.tiers.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No pricing tiers yet. Click "Add Tier" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
