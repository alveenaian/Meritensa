import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Plus, Trash2, ChevronUp, ChevronDown, Edit, GripVertical, Sparkles, Type, Image, Layout, BarChart, MessageSquare, Grid3x3, HelpCircle, Space, Play, DollarSign } from "lucide-react";
import type { Block } from "~/components/blocks/types";
import { BlockEditorModal } from "./BlockEditorModal";

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [editingBlock, setEditingBlock] = useState<{ index: number; block: Block } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addBlock = (type: Block["type"]) => {
    const newBlock = createEmptyBlock(type);
    setEditingBlock({ index: blocks.length, block: newBlock });
    setShowAddModal(false);
  };

  const updateBlock = (index: number, block: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    onChange(newBlocks);
    setEditingBlock(null);
  };

  const deleteBlock = (index: number) => {
    if (confirm("Are you sure you want to delete this block?")) {
      const newBlocks = blocks.filter((_, i) => i !== index);
      onChange(newBlocks);
    }
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    onChange(newBlocks);
  };

  const saveNewBlock = (block: Block) => {
    const newBlocks = [...blocks, block];
    onChange(newBlocks);
    setEditingBlock(null);
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", ""); // Required for Firefox
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[draggedIndex];
    
    // Remove from old position
    newBlocks.splice(draggedIndex, 1);
    
    // Insert at new position
    newBlocks.splice(index, 0, draggedBlock);
    
    onChange(newBlocks);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Page Blocks</h3>
          <p className="text-sm text-gray-500 mt-1">Build your page with customizable blocks</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="shadow-md hover:shadow-lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Block
        </Button>
      </div>

      {blocks.length === 0 ? (
        <div className="card-premium text-center py-16 fade-in">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
            <Layout className="h-8 w-8 text-primary-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Start building your page</h4>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add your first block to create a beautiful, engaging page. Choose from hero sections, features, content, and more.
          </p>
          <Button onClick={() => setShowAddModal(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add First Block
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            Tip: Use ⌘+K to quickly add blocks
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => {
            const typeInfo = getBlockTypeInfo(block.type);
            return (
              <div
                key={block.id}
                draggable
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`group card-premium hover-lift cursor-move fade-in ${
                  draggedIndex === index ? "opacity-50" : ""
                } ${
                  dragOverIndex === index ? "border-2 border-primary-500 bg-primary-50" : ""
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Drag handle - now functional! */}
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-primary-500 transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  {/* Block type icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${typeInfo.bgColor} flex items-center justify-center ${typeInfo.color}`}>
                    {typeInfo.icon}
                  </div>
                  
                  {/* Block info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-lg ${typeInfo.bgColor} px-2.5 py-0.5 text-xs font-semibold ${typeInfo.color}`}>
                        {block.type}
                      </span>
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate">
                      {getBlockPreview(block)}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingBlock({ index, block })}
                      className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit block"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteBlock(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Add block button at the end */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all group"
          >
            <Plus className="h-5 w-5 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Add another block</span>
          </button>
        </div>
      )}

      {/* Add Block Modal */}
      {showAddModal && (
        <AddBlockModal
          onClose={() => setShowAddModal(false)}
          onSelect={addBlock}
        />
      )}

      {/* Edit Block Modal */}
      {editingBlock && (
        <BlockEditorModal
          block={editingBlock.block}
          onSave={(block) => {
            if (editingBlock.index < blocks.length) {
              updateBlock(editingBlock.index, block);
            } else {
              saveNewBlock(block);
            }
          }}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
}

// Helper to create empty blocks with default values
function createEmptyBlock(type: Block["type"]): Block {
  const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  switch (type) {
    case "hero":
      return {
        id,
        type: "hero",
        data: {
          title: "Your Hero Title",
          subtitle: "Your hero subtitle goes here",
          gradient: "primary",
          showPattern: true,
          buttons: [],
        },
      };
    case "features":
      return {
        id,
        type: "features",
        data: {
          title: "Features",
          subtitle: "Discover what makes us great",
          features: [],
          columns: 3,
        },
      };
    case "text":
      return {
        id,
        type: "text",
        data: {
          content: "# Your Content\n\nWrite your content here using **markdown**.",
          align: "left",
          maxWidth: "xl",
        },
      };
    case "cta":
      return {
        id,
        type: "cta",
        data: {
          title: "Ready to get started?",
          subtitle: "Join us today",
          gradient: "primary",
          buttons: [],
        },
      };
    case "stats":
      return {
        id,
        type: "stats",
        data: {
          title: "By the numbers",
          stats: [],
        },
      };
    case "image":
      return {
        id,
        type: "image",
        data: {
          src: "https://via.placeholder.com/1200x600",
          alt: "Placeholder image",
          size: "lg",
          rounded: true,
        },
      };
    case "spacer":
      return {
        id,
        type: "spacer",
        data: {
          height: "md",
        },
      };
    case "card-grid":
      return {
        id,
        type: "card-grid",
        data: {
          title: "Card Grid",
          subtitle: "Explore our offerings",
          cards: [],
          columns: 3,
        },
      };
    case "faq":
      return {
        id,
        type: "faq",
        data: {
          title: "Frequently Asked Questions",
          subtitle: "Find answers to common questions",
          faqs: [],
        },
      };
    case "video":
      return {
        id,
        type: "video",
        data: {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          aspectRatio: "16:9",
          controls: true,
          autoplay: false,
        },
      };
    case "pricing":
      return {
        id,
        type: "pricing",
        data: {
          title: "Choose Your Plan",
          subtitle: "Select the perfect plan for your needs",
          tiers: [],
        },
      };
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}

// Helper to get a preview of block content
function getBlockPreview(block: Block): string {
  switch (block.type) {
    case "hero":
      return block.data.title;
    case "features":
      return block.data.title || `${block.data.features.length} features`;
    case "text":
      return block.data.content.substring(0, 50) + "...";
    case "cta":
      return block.data.title;
    case "stats":
      return block.data.title || `${block.data.stats.length} stats`;
    case "image":
      return block.data.alt;
    case "spacer":
      return `${block.data.height} spacing`;
    case "card-grid":
      return block.data.title || `${block.data.cards.length} cards`;
    case "faq":
      return block.data.title || `${block.data.faqs.length} FAQs`;
    case "video":
      return block.data.caption || "Video embed";
    case "pricing":
      return block.data.title || `${block.data.tiers.length} pricing tiers`;
    default:
      return "Unknown block";
  }
}

// Helper to get icon and color for each block type
function getBlockTypeInfo(type: Block["type"]): { icon: React.ReactNode; color: string; bgColor: string } {
  const iconClass = "h-5 w-5";
  switch (type) {
    case "hero":
      return { 
        icon: <Sparkles className={iconClass} />, 
        color: "text-purple-700", 
        bgColor: "bg-purple-100" 
      };
    case "features":
      return { 
        icon: <Grid3x3 className={iconClass} />, 
        color: "text-blue-700", 
        bgColor: "bg-blue-100" 
      };
    case "text":
      return { 
        icon: <Type className={iconClass} />, 
        color: "text-gray-700", 
        bgColor: "bg-gray-100" 
      };
    case "cta":
      return { 
        icon: <MessageSquare className={iconClass} />, 
        color: "text-green-700", 
        bgColor: "bg-green-100" 
      };
    case "stats":
      return { 
        icon: <BarChart className={iconClass} />, 
        color: "text-indigo-700", 
        bgColor: "bg-indigo-100" 
      };
    case "image":
      return { 
        icon: <Image className={iconClass} />, 
        color: "text-pink-700", 
        bgColor: "bg-pink-100" 
      };
    case "card-grid":
      return { 
        icon: <Layout className={iconClass} />, 
        color: "text-teal-700", 
        bgColor: "bg-teal-100" 
      };
    case "faq":
      return { 
        icon: <HelpCircle className={iconClass} />, 
        color: "text-orange-700", 
        bgColor: "bg-orange-100" 
      };
    case "spacer":
      return { 
        icon: <Space className={iconClass} />, 
        color: "text-gray-500", 
        bgColor: "bg-gray-50" 
      };
    case "video":
      return { 
        icon: <Play className={iconClass} />, 
        color: "text-red-700", 
        bgColor: "bg-red-100" 
      };
    case "pricing":
      return { 
        icon: <DollarSign className={iconClass} />, 
        color: "text-emerald-700", 
        bgColor: "bg-emerald-100" 
      };
    default:
      return { 
        icon: <Layout className={iconClass} />, 
        color: "text-gray-700", 
        bgColor: "bg-gray-100" 
      };
  }
}

// Add Block Modal Component
function AddBlockModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (type: Block["type"]) => void;
}) {
  const blockTypes: Array<{ 
    type: Block["type"]; 
    label: string; 
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }> = [
    { 
      type: "hero", 
      label: "Hero Section", 
      description: "Large header with title, subtitle, and CTAs",
      icon: <Sparkles className="h-6 w-6" />,
      color: "text-purple-700",
      bgColor: "bg-purple-50"
    },
    { 
      type: "features", 
      label: "Features Grid", 
      description: "Grid of feature cards with icons",
      icon: <Grid3x3 className="h-6 w-6" />,
      color: "text-blue-700",
      bgColor: "bg-blue-50"
    },
    { 
      type: "text", 
      label: "Text Content", 
      description: "Rich text content with markdown support",
      icon: <Type className="h-6 w-6" />,
      color: "text-gray-700",
      bgColor: "bg-gray-50"
    },
    { 
      type: "cta", 
      label: "Call to Action", 
      description: "Conversion-focused section with buttons",
      icon: <MessageSquare className="h-6 w-6" />,
      color: "text-green-700",
      bgColor: "bg-green-50"
    },
    { 
      type: "stats", 
      label: "Statistics", 
      description: "Display key metrics and numbers",
      icon: <BarChart className="h-6 w-6" />,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50"
    },
    { 
      type: "card-grid", 
      label: "Card Grid", 
      description: "Grid of cards with images/icons",
      icon: <Layout className="h-6 w-6" />,
      color: "text-teal-700",
      bgColor: "bg-teal-50"
    },
    { 
      type: "image", 
      label: "Image", 
      description: "Full-width or contained image",
      icon: <Image className="h-6 w-6" />,
      color: "text-pink-700",
      bgColor: "bg-pink-50"
    },
    { 
      type: "video", 
      label: "Video Embed", 
      description: "Embed YouTube, Vimeo, or direct video",
      icon: <Play className="h-6 w-6" />,
      color: "text-red-700",
      bgColor: "bg-red-50"
    },
    { 
      type: "faq", 
      label: "FAQ Section", 
      description: "Accordion-style frequently asked questions",
      icon: <HelpCircle className="h-6 w-6" />,
      color: "text-orange-700",
      bgColor: "bg-orange-50"
    },
    { 
      type: "pricing", 
      label: "Pricing Table", 
      description: "Display pricing tiers and plans",
      icon: <DollarSign className="h-6 w-6" />,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50"
    },
    { 
      type: "spacer", 
      label: "Spacer", 
      description: "Add vertical spacing",
      icon: <Space className="h-6 w-6" />,
      color: "text-gray-500",
      bgColor: "bg-gray-50"
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm fade-in">
      <div className="max-w-3xl w-full max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl slide-in-bottom">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Add a Block</h3>
              <p className="text-sm text-gray-500 mt-1">Choose a block type to add to your page</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {blockTypes.map((blockType, index) => (
              <button
                key={blockType.type}
                onClick={() => onSelect(blockType.type)}
                className="group text-left rounded-xl border-2 border-gray-200 p-4 hover:border-primary-400 hover:shadow-lg transition-all hover:-translate-y-1 fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl ${blockType.bgColor} flex items-center justify-center ${blockType.color} mb-3 group-hover:scale-110 transition-transform`}>
                  {blockType.icon}
                </div>
                <div className="font-semibold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                  {blockType.label}
                </div>
                <div className="text-sm text-gray-600 leading-snug">
                  {blockType.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
