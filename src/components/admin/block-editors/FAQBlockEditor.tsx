import { Button } from "~/components/ui/Button";
import { Plus, Trash2, Info } from "lucide-react";
import type { Block } from "~/components/blocks/types";

interface FAQBlockEditorProps {
  block: Extract<Block, { type: "faq" }>;
  setBlock: (block: Block) => void;
}

export function FAQBlockEditor({ block, setBlock }: FAQBlockEditorProps) {
  const updateData = (key: string, value: any) => {
    setBlock({ ...block, data: { ...block.data, [key]: value } });
  };

  const addFAQ = () => {
    const faqs = [...block.data.faqs];
    faqs.push({ question: "Your question?", answer: "Your answer here." });
    updateData("faqs", faqs);
  };

  const updateFAQ = (index: number, key: string, value: any) => {
    const faqs = [...block.data.faqs];
    faqs[index] = { ...faqs[index], [key]: value };
    updateData("faqs", faqs);
  };

  const deleteFAQ = (index: number) => {
    const faqs = block.data.faqs.filter((_, i) => i !== index);
    updateData("faqs", faqs);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Title</label>
        <input
          type="text"
          value={block.data.title || ""}
          onChange={(e) => updateData("title", e.target.value)}
          placeholder="Frequently Asked Questions"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Section Subtitle</label>
        <input
          type="text"
          value={block.data.subtitle || ""}
          onChange={(e) => updateData("subtitle", e.target.value)}
          placeholder="Everything you need to know"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-900">FAQ Items</label>
          <Button size="sm" onClick={addFAQ} variant="secondary">
            <Plus className="h-4 w-4 mr-1" /> Add FAQ
          </Button>
        </div>
        <div className="space-y-3">
          {block.data.faqs.map((faq, i) => (
            <div key={i} className="card-premium fade-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">FAQ {i + 1}</span>
                <button 
                  onClick={() => deleteFAQ(i)} 
                  className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFAQ(i, "question", e.target.value)}
                  placeholder="Question"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                />
                <div>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFAQ(i, "answer", e.target.value)}
                    placeholder="Answer (supports markdown)"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm min-h-[80px] font-mono focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Supports markdown formatting
                  </p>
                </div>
              </div>
            </div>
          ))}
          {block.data.faqs.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No FAQ items yet. Click "Add FAQ" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
