import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { X, Sparkles } from "lucide-react";
import type { Block } from "~/components/blocks/types";
import { HeroBlockEditor } from "~/components/admin/block-editors/HeroBlockEditor";
import { FeaturesBlockEditor } from "~/components/admin/block-editors/FeaturesBlockEditor";
import { TextBlockEditor } from "~/components/admin/block-editors/TextBlockEditor";
import { CTABlockEditor } from "~/components/admin/block-editors/CTABlockEditor";
import { StatsBlockEditor } from "~/components/admin/block-editors/StatsBlockEditor";
import { ImageBlockEditor } from "~/components/admin/block-editors/ImageBlockEditor";
import { SpacerBlockEditor } from "~/components/admin/block-editors/SpacerBlockEditor";
import { CardGridBlockEditor } from "~/components/admin/block-editors/CardGridBlockEditor";
import { FAQBlockEditor } from "~/components/admin/block-editors/FAQBlockEditor";
import { VideoBlockEditor } from "~/components/admin/block-editors/VideoBlockEditor";
import { PricingBlockEditor } from "~/components/admin/block-editors/PricingBlockEditor";

interface BlockEditorModalProps {
  block: Block;
  onSave: (block: Block) => void;
  onClose: () => void;
}

export function BlockEditorModal({ block, onSave, onClose }: BlockEditorModalProps) {
  const [editedBlock, setEditedBlock] = useState<Block>(block);

  const handleSave = () => {
    onSave(editedBlock);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-sm fade-in">
      <Card className="max-w-4xl w-full my-8 shadow-2xl border-0 slide-in-bottom">
        <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Edit {block.type} Block</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Customize your block content and appearance</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto p-6">
          {renderBlockEditor(editedBlock, setEditedBlock)}
          <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="shadow-md hover:shadow-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Save Block
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Render appropriate editor based on block type
function renderBlockEditor(block: Block, setBlock: (block: Block) => void) {
  switch (block.type) {
    case "hero":
      return <HeroBlockEditor block={block} setBlock={setBlock} />;
    case "features":
      return <FeaturesBlockEditor block={block} setBlock={setBlock} />;
    case "text":
      return <TextBlockEditor block={block} setBlock={setBlock} />;
    case "cta":
      return <CTABlockEditor block={block} setBlock={setBlock} />;
    case "stats":
      return <StatsBlockEditor block={block} setBlock={setBlock} />;
    case "image":
      return <ImageBlockEditor block={block} setBlock={setBlock} />;
    case "spacer":
      return <SpacerBlockEditor block={block} setBlock={setBlock} />;
    case "card-grid":
      return <CardGridBlockEditor block={block} setBlock={setBlock} />;
    case "faq":
      return <FAQBlockEditor block={block} setBlock={setBlock} />;
    case "video":
      return <VideoBlockEditor block={block} setBlock={setBlock} />;
    case "pricing":
      return <PricingBlockEditor block={block} setBlock={setBlock} />;
    default:
      return <div>Unknown block type</div>;
  }
}
