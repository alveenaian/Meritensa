// Base block interface
export interface BaseBlock {
  id: string;
  type: string;
}

// Hero Block - Large hero section with title, subtitle, and CTAs
export interface HeroBlock extends BaseBlock {
  type: "hero";
  data: {
    title: string;
    subtitle: string;
    gradient?: "primary" | "secondary" | "accent" | "warm" | "cool";
    buttons?: Array<{
      text: string;
      href: string;
      variant: "primary" | "secondary";
    }>;
    showPattern?: boolean;
  };
}

// Features Block - Grid of feature cards
export interface FeaturesBlock extends BaseBlock {
  type: "features";
  data: {
    title?: string;
    subtitle?: string;
    features: Array<{
      icon: string; // Lucide icon name
      title: string;
      description: string;
    }>;
    columns?: 2 | 3 | 4;
  };
}

// Text Block - Rich text content with markdown support
export interface TextBlock extends BaseBlock {
  type: "text";
  data: {
    content: string; // Markdown content
    align?: "left" | "center" | "right";
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  };
}

// CTA Block - Call-to-action section
export interface CTABlock extends BaseBlock {
  type: "cta";
  data: {
    title: string;
    subtitle?: string;
    gradient?: "primary" | "secondary" | "accent" | "warm" | "cool";
    buttons?: Array<{
      text: string;
      href: string;
      variant: "primary" | "secondary";
    }>;
  };
}

// Stats Block - Statistics/metrics display
export interface StatsBlock extends BaseBlock {
  type: "stats";
  data: {
    title?: string;
    stats: Array<{
      value: string;
      label: string;
      description?: string;
    }>;
  };
}

// Image Block - Image display
export interface ImageBlock extends BaseBlock {
  type: "image";
  data: {
    src: string;
    alt: string;
    caption?: string;
    size?: "sm" | "md" | "lg" | "full";
    rounded?: boolean;
  };
}

// Video Block - Embed videos from YouTube, Vimeo, or direct URLs
export interface VideoBlock extends BaseBlock {
  type: "video";
  data: {
    url: string; // YouTube, Vimeo, or direct video URL
    caption?: string;
    aspectRatio?: "16:9" | "4:3" | "1:1";
    autoplay?: boolean;
    controls?: boolean;
  };
}

// Pricing Block - Pricing tables with multiple tiers
export interface PricingBlock extends BaseBlock {
  type: "pricing";
  data: {
    title?: string;
    subtitle?: string;
    tiers: Array<{
      name: string;
      price: string;
      period?: string;
      description?: string;
      features: string[];
      highlighted?: boolean;
      ctaText: string;
      ctaLink: string;
    }>;
  };
}

// Spacer Block - Vertical spacing
export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  data: {
    height: "sm" | "md" | "lg" | "xl";
  };
}

// Card Grid Block - Grid of cards with images/icons
export interface CardGridBlock extends BaseBlock {
  type: "card-grid";
  data: {
    title?: string;
    subtitle?: string;
    cards: Array<{
      icon?: string; // Lucide icon name
      image?: string;
      title: string;
      description: string;
      link?: string;
    }>;
    columns?: 2 | 3 | 4;
  };
}

// FAQ Block - Frequently Asked Questions with accordion
export interface FAQBlock extends BaseBlock {
  type: "faq";
  data: {
    title?: string;
    subtitle?: string;
    faqs: Array<{
      question: string;
      answer: string; // Markdown content
    }>;
  };
}

// Union type of all blocks
export type Block =
  | HeroBlock
  | FeaturesBlock
  | TextBlock
  | CTABlock
  | StatsBlock
  | ImageBlock
  | SpacerBlock
  | CardGridBlock
  | FAQBlock
  | VideoBlock
  | PricingBlock;
