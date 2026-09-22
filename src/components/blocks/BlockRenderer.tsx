import type { Block } from "./types";
import { HeroBlock } from "./HeroBlock";
import { FeaturesBlock } from "./FeaturesBlock";
import { TextBlock } from "./TextBlock";
import { CTABlock } from "./CTABlock";
import { StatsBlock } from "./StatsBlock";
import { ImageBlock } from "./ImageBlock";
import { SpacerBlock } from "./SpacerBlock";
import { CardGridBlock } from "./CardGridBlock";
import { FAQBlock } from "./FAQBlock";
import { VideoBlock } from "./VideoBlock";
import { PricingBlock } from "./PricingBlock";

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return <HeroBlock key={block.id} data={block.data} />;
          case "features":
            return <FeaturesBlock key={block.id} data={block.data} />;
          case "text":
            return <TextBlock key={block.id} data={block.data} />;
          case "cta":
            return <CTABlock key={block.id} data={block.data} />;
          case "stats":
            return <StatsBlock key={block.id} data={block.data} />;
          case "image":
            return <ImageBlock key={block.id} data={block.data} />;
          case "spacer":
            return <SpacerBlock key={block.id} data={block.data} />;
          case "card-grid":
            return <CardGridBlock key={block.id} data={block.data} />;
          case "faq":
            return <FAQBlock key={block.id} data={block.data} />;
          case "video":
            return <VideoBlock key={block.id} data={block.data} />;
          case "pricing":
            return <PricingBlock key={block.id} data={block.data} />;
          default:
            console.warn(`Unknown block type: ${(block as any).type}`);
            return null;
        }
      })}
    </div>
  );
}
