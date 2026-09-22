import { Button } from "~/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface StatsBlockEditorProps {
  block: Extract<Block, { type: "stats" }>;
  setBlock: (block: Block) => void;
}

export function StatsBlockEditor({ block, setBlock }: StatsBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  const addStat = () => {
    const stats = [...block.data.stats];
    stats.push({ value: "100+", label: "Stat Label", description: "" });
    updateData("stats", stats);
  };

  const updateStat = (index: number, key: string, value: any) => {
    const stats = [...block.data.stats];
    stats[index] = { ...stats[index], [key]: value };
    updateData("stats", stats);
  };

  const deleteStat = (index: number) => {
    const stats = block.data.stats.filter((_, i) => i !== index);
    updateData("stats", stats);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Title</label>
        <input
          type="text"
          value={block.data.title || ""}
          onChange={(e) => updateData("title", e.target.value)}
          placeholder="Our Impact"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-900">Statistics</label>
          <Button size="sm" onClick={addStat} variant="secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Stat
          </Button>
        </div>
        <div className="space-y-3">
          {block.data.stats.map((stat, i) => (
            <div key={i} className="card-premium fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Stat {i + 1}</span>
                <button 
                  onClick={() => deleteStat(i)} 
                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) => updateStat(i, "value", e.target.value)}
                  placeholder="100+"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => updateStat(i, "label", e.target.value)}
                  placeholder="Label"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <input
                  type="text"
                  value={stat.description || ""}
                  onChange={(e) => updateStat(i, "description", e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
              </div>
            </div>
          ))}
          {block.data.stats.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No statistics yet. Click "Add Stat" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
