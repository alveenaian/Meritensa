import { Button } from "~/components/ui/Button";
import { Plus, Trash2, Info } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface CardGridBlockEditorProps {
  block: Extract<Block, { type: "card-grid" }>;
  setBlock: (block: Block) => void;
}

export function CardGridBlockEditor({ block, setBlock }: CardGridBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  const addCard = () => {
    const cards = [...block.data.cards];
    cards.push({ icon: "Star", title: "Card Title", description: "Card description" });
    updateData("cards", cards);
  };

  const updateCard = (index: number, key: string, value: any) => {
    const cards = [...block.data.cards];
    cards[index] = { ...cards[index], [key]: value };
    updateData("cards", cards);
  };

  const deleteCard = (index: number) => {
    const cards = block.data.cards.filter((_, i) => i !== index);
    updateData("cards", cards);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Title</label>
        <input
          type="text"
          value={block.data.title || ""}
          onChange={(e) => updateData("title", e.target.value)}
          placeholder="Our Services"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Subtitle</label>
        <input
          type="text"
          value={block.data.subtitle || ""}
          onChange={(e) => updateData("subtitle", e.target.value)}
          placeholder="What we offer"
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
          <label className="block text-sm font-semibold text-gray-900">Cards</label>
          <Button size="sm" onClick={addCard} variant="secondary">
            <Plus className="h-4 w-4 mr-1" /> Add Card
          </Button>
        </div>
        <div className="space-y-3">
          {block.data.cards.map((card, i) => (
            <div key={i} className="card-premium fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Card {i + 1}</span>
                <button 
                  onClick={() => deleteCard(i)} 
                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={card.icon || ""}
                    onChange={(e) => updateCard(i, "icon", e.target.value)}
                    placeholder="Icon name (e.g., Star, Heart, Zap)"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Lucide icon name
                  </p>
                </div>
                <input
                  type="text"
                  value={card.image || ""}
                  onChange={(e) => updateCard(i, "image", e.target.value)}
                  placeholder="Image URL (optional, replaces icon)"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => updateCard(i, "title", e.target.value)}
                  placeholder="Card title"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <textarea
                  value={card.description}
                  onChange={(e) => updateCard(i, "description", e.target.value)}
                  placeholder="Card description"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm min-h-[60px] focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <input
                  type="text"
                  value={card.link || ""}
                  onChange={(e) => updateCard(i, "link", e.target.value)}
                  placeholder="Link URL (optional)"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
              </div>
            </div>
          ))}
          {block.data.cards.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No cards yet. Click "Add Card" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
