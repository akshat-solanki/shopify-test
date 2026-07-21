import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  Heart,
  ImageIcon,
  Info,
  Layout,
  Layers,
  Lock,
  Monitor,
  Moon,
  Minus,
  Palette,
  PlayCircle,
  Plus,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Tablet,
  Tag,
  Truck,
  Type,
  X,
  Zap,
} from "lucide-react";
import type { ProductDomainModel, ShowcaseCardViewModel, ShowcaseConfiguration } from "../../../shared/contracts";
import { buildShowcaseCardViewModels } from "../../../shared/helpers/showcase-card-view-model";
import { generateShowcaseConfig } from "../../services/showcaseAi";
import {
  applyStudioSettingsPatch,
  DEFAULT_STUDIO_SETTINGS,
  type StudioSettings,
  type StudioSettingsPatch,
} from "../../lib/studio-settings";
import { configurationFromStudioSettings } from "../../lib/studio-settings-mapping";
import { useShowcaseProducts } from "../../hooks/useShowcaseProducts";

type ShowcaseStyle = StudioSettings["showcaseStyle"];
type Motion = StudioSettings["motion"];
type Density = StudioSettings["density"];
type ImageBehaviour = StudioSettings["imageBehaviour"];
type CTAStyle = StudioSettings["ctaStyle"];
type CardWidth = StudioSettings["cardWidth"];
type Theme = StudioSettings["theme"];
type Device = "desktop" | "tablet" | "mobile";
type SurfaceMode = "grid" | "carousel" | "spotlight" | "stress" | "search" | "collection" | "recommendation";
type CurrencyCode = StudioSettings["currency"];
type LayoutBucket = "xs" | "sm" | "md" | "lg";
type StressSweep = "styles" | "media" | "density" | "cta";
type QAStatus = "pass" | "info" | "warn" | "fail";
type VariantDisplayStyle = StudioSettings["variantDisplay"];
type VariantOverflowBehaviour = StudioSettings["variantOverflow"];
type CustomAttributeStyle = StudioSettings["customAttributeStyle"];
type AccessibilityFontSize = StudioSettings["fontSize"];
type SettingsAccordionId = "workspace" | "appearance" | "commerce" | "interaction";
type SettingsSectionId =
  | "presets"
  | "preview"
  | "style"
  | "motion"
  | "imagery"
  | "information"
  | "cta"
  | "accessibility"
  | "customAttributes"
  | "schema";

type CommerceAttributeId =
  | "brand"
  | "vendor"
  | "productType"
  | "rating"
  | "reviewCount"
  | "price"
  | "compareAtPrice"
  | "discountBadge"
  | "deliveryPromise"
  | "inventoryCount"
  | "stockStatus"
  | "sku"
  | "variantCount"
  | "collectionLabel"
  | "pickupAvailability"
  | "localDelivery"
  | "unitPricing"
  | "sellingPlan";

type AttributeSlot = "eyebrow" | "trust" | "price" | "detail" | "badge";

type ProductMetafield = {
  id: string;
  namespace: string;
  key: string;
  label: string;
  value: string;
};

type ProductMedia =
  | {
      id: string;
      type: "image";
      src: string;
      alt: string;
      kind: "lifestyle" | "studio" | "detail" | "cutout";
      fit?: "cover" | "contain";
    }
  | {
      id: string;
      type: "video";
      src: string;
      alt: string;
      poster: string;
    }
  | {
      id: string;
      type: "spin";
      alt: string;
      frames: string[];
    }
  | {
      id: string;
      type: "model";
      alt: string;
      poster: string;
      label: string;
    };

type ProductVariant = {
  id: string;
  label: string;
  sku: string;
  colorName?: string;
  swatchColor?: string;
  swatchImage?: string;
  imageIndex?: number;
  price?: number;
  compareAtPrice?: number;
  inventory?: number;
  badges?: Partial<Settings["badges"]>;
};

type AttributeContext = {
  product: Product;
  settings: Settings;
  variant: ProductVariant;
  density: Density;
  currency: CurrencyCode;
};

type AttributeRegistryEntry = {
  id: CommerceAttributeId | `metafield:${string}`;
  label: string;
  icon: React.ElementType;
  slot: AttributeSlot;
  priority: number;
  supportedDensity: Density[];
  supportedCardVariants: ShowcaseStyle[];
  defaultEnabled: boolean;
  visibility: (context: AttributeContext) => boolean;
  renderComponent: (context: AttributeContext) => React.ReactNode;
};

type Settings = StudioSettings;

type DesignQACheck = {
  id: string;
  label: string;
  status: QAStatus;
  reason: string;
};

type DesignQAReport = {
  checks: DesignQACheck[];
  status: QAStatus;
  score: number;
};


type Product = {
  id: string;
  brand: string;
  vendor?: string;
  productType?: string;
  collectionLabel?: string;
  name: string;
  shortName: string;
  subtitle: string;
  description?: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  stock: number;
  delivery: string;
  pickupAvailability?: string;
  localDelivery?: string;
  unitPricing?: string;
  sellingPlan?: string;
  images: {
    src: string;
    alt: string;
    kind: "lifestyle" | "studio" | "detail" | "cutout";
    fit?: "cover" | "contain";
  }[];
  media?: ProductMedia[];
  colors: { name: string; hex: string }[];
  variants: string[];
  variantOptions?: ProductVariant[];
  metafields?: ProductMetafield[];
  transparentHero?: boolean;
};

const ACCENT_COLOR_PRESETS = [
  { name: "Copper", color: "#C46A3A" },
  { name: "Terracotta", color: "#C96B4B" },
  { name: "Amber", color: "#D97706" },
  { name: "Olive", color: "#6B7A38" },
  { name: "Forest", color: "#17785D" },
  { name: "Teal", color: "#0F766E" },
  { name: "Cobalt", color: "#2563EB" },
  { name: "Electric", color: "#246BFD" },
  { name: "Berry", color: "#BC3B5E" },
  { name: "Ruby", color: "#E11D48" },
  { name: "Plum", color: "#7C3AED" },
  { name: "Graphite", color: "#374151" },
  { name: "Charcoal", color: "#111827" },
  { name: "Stone", color: "#78716C" },
  { name: "Sand", color: "#B08968" },
  { name: "Rosewood", color: "#8C3B35" },
];

const CTA_COLOR_PRESETS = [
  { name: "Copper CTA", color: "#C46A3A" },
  { name: "Burnt Orange", color: "#C2410C" },
  { name: "Crimson", color: "#DC2626" },
  { name: "Berry CTA", color: "#BE185D" },
  { name: "Royal Blue", color: "#2563EB" },
  { name: "Indigo", color: "#4338CA" },
  { name: "Emerald", color: "#059669" },
  { name: "Forest CTA", color: "#15803D" },
  { name: "Teal CTA", color: "#0F766E" },
  { name: "Slate", color: "#334155" },
  { name: "Onyx", color: "#111827" },
  { name: "Mocha", color: "#7C5A43" },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    brand: "Vypari Audio",
    vendor: "Vypari Labs",
    productType: "Headphones",
    collectionLabel: "Travel essentials",
    name: "VX-01 Adaptive Noise-Cancelling Headphones",
    shortName: "VX-01",
    subtitle: "Studio-grade clarity with 40-hour battery life",
    description: "Wireless over-ear headphones with adaptive noise cancelling, fast charging, and a fold-flat travel case for premium daily listening.",
    price: 289,
    originalPrice: 349,
    discount: 17,
    rating: 4.8,
    reviews: 1284,
    stock: 14,
    delivery: "Arrives by Tue, Jul 14",
    images: [
      {
        src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
        alt: "VX-01 headphones lifestyle view",
        kind: "lifestyle",
      },
      {
        src: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80",
        alt: "VX-01 headphones alternate angle",
        kind: "studio",
      },
      {
        src: "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80",
        alt: "VX-01 headphones front product view",
        kind: "cutout",
        fit: "contain",
      },
    ],
    colors: [
      { name: "Midnight", hex: "#16181D" },
      { name: "Stone", hex: "#CDD2DB" },
      { name: "Copper", hex: "#B46A3E" },
    ],
    variants: ["Standard", "Studio Pack"],
    variantOptions: [
      { id: "vx-std", label: "Standard", sku: "VX-01-STD", colorName: "Midnight", swatchColor: "#16181D", imageIndex: 0, price: 289, compareAtPrice: 349, inventory: 14 },
      { id: "vx-stone", label: "Stone", sku: "VX-01-STN", colorName: "Stone", swatchColor: "#CDD2DB", imageIndex: 1, price: 289, compareAtPrice: 349, inventory: 9 },
      { id: "vx-studio", label: "Studio Pack", sku: "VX-01-STP", colorName: "Copper", swatchColor: "#B46A3E", imageIndex: 2, price: 329, compareAtPrice: 389, inventory: 5, badges: { limitedStock: true } },
    ],
    media: [
      { id: "vx-image", type: "image", src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", alt: "VX-01 headphones lifestyle view", kind: "lifestyle" },
      { id: "vx-video", type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", poster: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80", alt: "VX-01 product video preview" },
      { id: "vx-model", type: "model", poster: "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80", alt: "VX-01 3D model poster", label: "View in 3D" },
    ],
    metafields: [
      { id: "battery-life", namespace: "specs", key: "battery_life", label: "Battery Life", value: "40 hours" },
      { id: "driver-size", namespace: "specs", key: "driver_size", label: "Driver Size", value: "40mm" },
      { id: "country-origin", namespace: "details", key: "country_origin", label: "Country Of Origin", value: "Japan" },
    ],
    pickupAvailability: "Pickup ready in 2 hours",
    localDelivery: "Local delivery by tomorrow",
    unitPricing: "$72.25 / device",
    sellingPlan: "Save 10% with annual protection",
    transparentHero: true,
  },
  {
    id: "2",
    brand: "Vypari Motion",
    vendor: "Vypari Motion",
    productType: "Running Shoes",
    collectionLabel: "Performance running",
    name: "AeroRun Knit Performance Sneakers",
    shortName: "AeroRun",
    subtitle: "Featherlight build for all-day comfort",
    description: "Breathable knit runners with responsive foam, flex grooves, and a quick-buy color range designed for mobile-first merchandising.",
    price: 142,
    originalPrice: 178,
    discount: 20,
    rating: 4.6,
    reviews: 834,
    stock: 8,
    delivery: "Delivery in 2 days",
    images: [
      {
        src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        alt: "AeroRun sneaker hero",
        kind: "studio",
      },
      {
        src: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
        alt: "AeroRun sneaker on-foot angle",
        kind: "lifestyle",
      },
      {
        src: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
        alt: "AeroRun sneaker close detail",
        kind: "detail",
      },
    ],
    colors: [
      { name: "Coral", hex: "#F97360" },
      { name: "Sand", hex: "#D7C0A8" },
      { name: "Onyx", hex: "#1B1B1B" },
    ],
    variants: ["Daily", "Runner Pro"],
    variantOptions: [
      { id: "aero-daily", label: "Daily", sku: "AR-DAILY-CORAL", colorName: "Coral", swatchColor: "#F97360", imageIndex: 0, price: 142, compareAtPrice: 178, inventory: 8 },
      { id: "aero-sand", label: "Sand", sku: "AR-DAILY-SAND", colorName: "Sand", swatchColor: "#D7C0A8", imageIndex: 1, price: 142, compareAtPrice: 178, inventory: 12 },
      { id: "aero-pro", label: "Runner Pro", sku: "AR-PRO-ONYX", colorName: "Onyx", swatchColor: "#1B1B1B", imageIndex: 2, price: 156, compareAtPrice: 196, inventory: 4, badges: { newArrival: true, limitedStock: true } },
    ],
    media: [
      { id: "aero-image", type: "image", src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80", alt: "AeroRun sneaker hero", kind: "studio" },
      { id: "aero-spin", type: "spin", alt: "AeroRun 360 spin preview", frames: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80"
      ] },
      { id: "aero-video", type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm", poster: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80", alt: "AeroRun product video preview" },
    ],
    metafields: [
      { id: "fabric", namespace: "specs", key: "fabric", label: "Fabric", value: "Engineered knit upper" },
      { id: "drop", namespace: "specs", key: "heel_drop", label: "Heel Drop", value: "8mm" },
      { id: "terrain", namespace: "details", key: "terrain", label: "Terrain", value: "Road running" },
    ],
    pickupAvailability: "Pickup today after 4 PM",
    localDelivery: "Get it tonight in select zones",
    unitPricing: "$71 / pair",
    sellingPlan: "Buy 2 pairs and save 12%",
  },
  {
    id: "3",
    brand: "Vypari Home",
    vendor: "Vypari Home",
    productType: "Coffee Set",
    collectionLabel: "Kitchen rituals",
    name: "Ridge Ceramic Pour-Over Set",
    shortName: "Ridge Set",
    subtitle: "Countertop statement piece for slow mornings",
    description: "A ceramic pour-over bundle with dripper, server, and matching cups designed for premium home and gifting collections.",
    price: 96,
    originalPrice: 120,
    discount: 20,
    rating: 4.9,
    reviews: 417,
    stock: 25,
    delivery: "Ships free today",
    images: [
      {
        src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
        alt: "Ridge ceramic set lifestyle scene",
        kind: "lifestyle",
      },
      {
        src: "https://images.unsplash.com/photo-1517701550927-30cf4ba1f846?auto=format&fit=crop&w=900&q=80",
        alt: "Ridge ceramic set closeup",
        kind: "detail",
      },
      {
        src: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80",
        alt: "Ridge ceramic set studio view",
        kind: "studio",
      },
    ],
    colors: [
      { name: "Bone", hex: "#E8E0D2" },
      { name: "Clay", hex: "#C9734F" },
      { name: "Moss", hex: "#64755D" },
    ],
    variants: ["2-Cup", "4-Cup"],
    variantOptions: [
      { id: "ridge-2", label: "2-Cup", sku: "RIDGE-2-BONE", colorName: "Bone", swatchColor: "#E8E0D2", imageIndex: 0, price: 96, compareAtPrice: 120, inventory: 25 },
      { id: "ridge-4", label: "4-Cup", sku: "RIDGE-4-CLAY", colorName: "Clay", swatchColor: "#C9734F", imageIndex: 1, price: 114, compareAtPrice: 138, inventory: 11 },
      { id: "ridge-moss", label: "Moss", sku: "RIDGE-4-MOSS", colorName: "Moss", swatchColor: "#64755D", imageIndex: 2, price: 114, compareAtPrice: 138, inventory: 7 },
    ],
    media: [
      { id: "ridge-image", type: "image", src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80", alt: "Ridge ceramic set lifestyle scene", kind: "lifestyle" },
      { id: "ridge-model", type: "model", poster: "https://images.unsplash.com/photo-1517701550927-30cf4ba1f846?auto=format&fit=crop&w=900&q=80", alt: "Ridge ceramic 3D preview", label: "View in 3D" },
    ],
    metafields: [
      { id: "material", namespace: "specs", key: "material", label: "Material", value: "Stoneware ceramic" },
      { id: "capacity", namespace: "specs", key: "capacity", label: "Capacity", value: "600 ml" },
      { id: "origin", namespace: "details", key: "origin", label: "Country Of Origin", value: "Portugal" },
    ],
    pickupAvailability: "Available for pickup this weekend",
    unitPricing: "$48 / serving set",
  },
  {
    id: "4",
    brand: "Vypari Skin",
    vendor: "Vypari Skin",
    productType: "Skincare Set",
    collectionLabel: "Night repair",
    name: "Recovery Night Serum Set",
    shortName: "Night Serum",
    subtitle: "Barrier support and overnight hydration",
    description: "An overnight recovery serum set with ceramides and peptide support, built for repeat-purchase beauty storefronts and routine bundles.",
    price: 74,
    originalPrice: 92,
    discount: 20,
    rating: 4.7,
    reviews: 592,
    stock: 6,
    delivery: "Delivery by tomorrow",
    images: [
      {
        src: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
        alt: "Night serum hero shot",
        kind: "studio",
      },
      {
        src: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80",
        alt: "Night serum shelf lifestyle image",
        kind: "lifestyle",
      },
      {
        src: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=80",
        alt: "Night serum isolated product angle",
        kind: "cutout",
        fit: "contain",
      },
    ],
    colors: [
      { name: "Amber", hex: "#A66737" },
      { name: "Pearl", hex: "#EAE3D9" },
      { name: "Smoke", hex: "#72737B" },
    ],
    variants: ["Single", "2-Month Set"],
    variantOptions: [
      { id: "serum-single", label: "Single", sku: "SERUM-30ML", colorName: "Amber", swatchColor: "#A66737", imageIndex: 0, price: 74, compareAtPrice: 92, inventory: 6 },
      { id: "serum-duo", label: "2-Month Set", sku: "SERUM-2PK", colorName: "Pearl", swatchColor: "#EAE3D9", imageIndex: 2, price: 138, compareAtPrice: 168, inventory: 13 },
      { id: "serum-clinic", label: "Clinic Pair", sku: "SERUM-CLINIC", colorName: "Smoke", swatchColor: "#72737B", imageIndex: 1, price: 148, compareAtPrice: 178, inventory: 4, badges: { bestSeller: true } },
    ],
    media: [
      { id: "serum-image", type: "image", src: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80", alt: "Night serum hero shot", kind: "studio" },
      { id: "serum-video", type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", poster: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80", alt: "Night serum video preview" },
    ],
    metafields: [
      { id: "organic", namespace: "claims", key: "organic", label: "Organic", value: "Dermatologist tested" },
      { id: "material", namespace: "formula", key: "material", label: "Key Ingredient", value: "Ceramide complex" },
      { id: "country-origin", namespace: "details", key: "country_origin", label: "Country Of Origin", value: "South Korea" },
    ],
    localDelivery: "Same-day delivery in metro areas",
    sellingPlan: "Subscribe and save 15%",
    transparentHero: true,
  },
];

let runtimeProducts: Product[] = MOCK_PRODUCTS;

function getRuntimeProducts() {
  return runtimeProducts.length ? runtimeProducts : MOCK_PRODUCTS;
}

function parseMoneyAmount(amount?: string) {
  if (!amount) return 0;
  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function compactTitle(title: string) {
  return title
    .split(" ")
    .slice(0, 2)
    .join(" ");
}

function variantColorName(variant: ProductDomainModel["commerce"]["variants"][number]) {
  return variant.selectedOptions.find((option) => /color|colour/i.test(option.name))?.value;
}

function productColors(product: ProductDomainModel) {
  const colorOption = product.commerce.options.find((option) => /color|colour/i.test(option.name));
  if (colorOption?.values.length) {
    return colorOption.values.map((value) => ({
      name: value.value,
      hex: value.swatch?.color ?? "#D1D5DB",
    }));
  }

  const fromVariants = product.commerce.variants
    .map((variant) => variantColorName(variant))
    .filter(Boolean) as string[];

  return Array.from(new Set(fromVariants)).map((name, index) => ({
    name,
    hex: ["#111827", "#C46A3A", "#64748B", "#E5E7EB"][index % 4],
  }));
}

function normalizeProductForStudio(product: ProductDomainModel): Product {
  const price = parseMoneyAmount(product.pricing.price.amount);
  const originalPrice = parseMoneyAmount(product.pricing.compareAtPrice?.amount) || price;
  const galleryImages = [product.media.featuredImage, ...product.media.galleryImages]
    .filter((image): image is NonNullable<typeof image> => Boolean(image))
    .filter((image, index, images) => images.findIndex((entry) => entry.id === image.id) === index)
    .map((image) => ({
      src: image.url,
      alt: image.alt ?? product.identity.title,
      kind: "studio" as const,
      fit: "cover" as const,
    }));

  const media = product.media.media.map((item) => {
    if (item.type === "image") {
      return {
        id: item.id,
        type: "image" as const,
        src: item.url,
        alt: item.alt ?? product.identity.title,
        kind: "studio" as const,
        fit: "cover" as const,
      };
    }

    if (item.type === "video") {
      return {
        id: item.id,
        type: "video" as const,
        src: item.sources[0]?.url ?? "",
        alt: item.alt ?? product.identity.title,
        poster: item.previewImage?.url ?? galleryImages[0]?.src ?? "",
      };
    }

    if (item.type === "external_video") {
      return {
        id: item.id,
        type: "video" as const,
        src: item.embedUrl,
        alt: item.alt ?? product.identity.title,
        poster: item.previewImage?.url ?? galleryImages[0]?.src ?? "",
      };
    }

    return {
      id: item.id,
      type: "model" as const,
      alt: item.alt ?? product.identity.title,
      poster: item.previewImage?.url ?? galleryImages[0]?.src ?? "",
      label: "View in 3D",
    };
  });

  const colors = productColors(product);
  const metafields = product.merchantExtensions.metafields.map((metafield) => ({
    id: metafield.id ?? `${metafield.namespace}-${metafield.key}`,
    namespace: metafield.namespace,
    key: metafield.key,
    label: metafield.key.replace(/[_-]/g, " ").replace(/\b\w/g, (part) => part.toUpperCase()),
    value: metafield.value,
  }));
  const pickupAvailabilityValue = metafields.find((metafield) => metafield.key === "pickup_availability")?.value;
  const localDeliveryValue = metafields.find((metafield) => metafield.key === "local_delivery")?.value;
  const unitPricingValue = metafields.find((metafield) => metafield.key === "unit_pricing")?.value;

  const variantOptions = product.commerce.variants.map((variant, index) => ({
    id: variant.id,
    label: variant.title,
    sku: variant.sku ?? `${product.identity.handle}-${index + 1}`.toUpperCase(),
    colorName: variantColorName(variant),
    swatchColor:
      colors.find((color) => color.name === variantColorName(variant))?.hex ??
      colors[index % Math.max(colors.length, 1)]?.hex,
    imageIndex: index % Math.max(galleryImages.length, 1),
    price: parseMoneyAmount(variant.price.amount),
    compareAtPrice: parseMoneyAmount(variant.compareAtPrice?.amount) || parseMoneyAmount(variant.price.amount),
    inventory: variant.inventoryQuantity ?? product.inventory.inventoryQuantity ?? 0,
  }));

  return {
    id: product.identity.id,
    brand: product.identity.vendor,
    vendor: product.identity.vendor,
    productType: product.identity.productType,
    collectionLabel: product.taxonomy.collections[0]?.title,
    name: product.identity.title,
    shortName: compactTitle(product.identity.title),
    subtitle:
      product.descriptions.shortDescription ??
      `${product.identity.vendor}${product.identity.productType ? ` ${product.identity.productType}` : ""}`,
    description: product.descriptions.description ?? undefined,
    price,
    originalPrice,
    discount:
      product.pricing.discountPercentage ??
      (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0),
    rating: product.socialProof.rating ?? 0,
    reviews: product.socialProof.reviewCount ?? 0,
    stock: product.inventory.inventoryQuantity ?? variantOptions[0]?.inventory ?? 0,
    delivery: product.delivery.deliveryPromise ?? "Ships soon",
    pickupAvailability: product.commerce.pickupAvailability[0]?.pickupTime ?? pickupAvailabilityValue,
    localDelivery: localDeliveryValue ?? product.delivery.deliveryPromise,
    unitPricing: unitPricingValue,
    sellingPlan: product.commerce.sellingPlans[0]?.plans[0]?.name,
    images: galleryImages.length
      ? galleryImages
      : [
          {
            src: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
            alt: product.identity.title,
            kind: "studio",
            fit: "cover",
          },
        ],
    media,
    colors: colors.length ? colors : [{ name: "Default", hex: "#D1D5DB" }],
    variants: variantOptions.map((variant) => variant.label),
    variantOptions,
    metafields,
    transparentHero: false,
  };
}

const CURRENCIES: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: "USD", label: "US Dollar", locale: "en-US" },
  { code: "EUR", label: "Euro", locale: "de-DE" },
  { code: "GBP", label: "British Pound", locale: "en-GB" },
  { code: "INR", label: "Indian Rupee", locale: "en-IN" },
  { code: "AED", label: "UAE Dirham", locale: "en-AE" },
  { code: "AUD", label: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar", locale: "en-CA" },
];

const STOREFRONT_FONT_STACK =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type PresetPatch = StudioSettingsPatch;

const INTELLIGENT_PRESETS: Array<{
  id: string;
  name: string;
  tagline: string;
  summary: string;
  focus: string[];
  patch: PresetPatch;
}> = [
  {
    id: "fashion",
    name: "Fashion",
    tagline: "Visual first",
    summary: "Balanced browsing with stronger imagery, clear sizing context, and quick add-to-cart flow.",
    focus: ["Spacing", "Imagery", "CTA"],
    patch: {
      showcaseStyle: "Premium",
      density: "Balanced",
      imageBehaviour: "Zoom on Hover",
      ctaStyle: "Filled",
      motion: "Subtle",
      ctaText: "Quick Add",
      cardWidth: "Standard",
      shadowIntensity: 46,
      borderRadius: 20,
      accentColor: "#111827",
      badges: { bestSeller: true, sale: true, newArrival: true, limitedStock: false },
      productInfo: { brand: true, ratings: true, reviewCount: true, deliveryPromise: false, stockCount: false },
    },
  },
  {
    id: "luxury",
    name: "Luxury",
    tagline: "High AOV",
    summary: "Editorial spacing, restrained actions, and premium presentation for considered purchases.",
    focus: ["Typography", "Spacing", "Motion"],
    patch: {
      showcaseStyle: "Bold",
      density: "Detailed",
      imageBehaviour: "Zoom on Hover",
      ctaStyle: "Outlined",
      motion: "Subtle",
      ctaText: "Explore",
      cardWidth: "Spacious",
      shadowIntensity: 68,
      borderRadius: 26,
      accentColor: "#6F4E37",
      badges: { bestSeller: true, sale: false, newArrival: false, limitedStock: true },
      productInfo: { brand: true, ratings: true, reviewCount: true, deliveryPromise: false, stockCount: false },
    },
  },
  {
    id: "beauty",
    name: "Beauty",
    tagline: "Trust led",
    summary: "Soft presentation with trust signals, reviews, and set-friendly product context.",
    focus: ["Trust", "Density", "CTA"],
    patch: {
      showcaseStyle: "Premium",
      density: "Detailed",
      imageBehaviour: "Zoom on Hover",
      ctaStyle: "Filled",
      motion: "Subtle",
      cardWidth: "Standard",
      shadowIntensity: 50,
      borderRadius: 24,
      accentColor: "#A66737",
      badges: { bestSeller: true, sale: true, newArrival: true, limitedStock: true },
      productInfo: { brand: true, ratings: true, reviewCount: true, deliveryPromise: true, stockCount: true },
    },
  },
  {
    id: "electronics",
    name: "Electronics",
    tagline: "Spec clarity",
    summary: "Sharper hierarchy, stronger pricing, and low-friction actions for comparison-heavy shopping.",
    focus: ["Pricing", "Trust", "Clarity"],
    patch: {
      showcaseStyle: "Essential",
      density: "Detailed",
      imageBehaviour: "Static",
      ctaStyle: "Filled",
      motion: "None",
      ctaText: "Add to Cart",
      cardWidth: "Standard",
      shadowIntensity: 34,
      borderRadius: 18,
      accentColor: "#2563EB",
      badges: { bestSeller: true, sale: true, newArrival: false, limitedStock: true },
      productInfo: { brand: true, ratings: true, reviewCount: true, deliveryPromise: true, stockCount: true },
    },
  },
  {
    id: "furniture",
    name: "Furniture",
    tagline: "Browse first",
    summary: "Roomier cards and calmer motion for considered browsing with stronger visual presence.",
    focus: ["Spacing", "Imagery", "Browse"],
    patch: {
      showcaseStyle: "Discovery",
      density: "Balanced",
      imageBehaviour: "Zoom on Hover",
      ctaStyle: "Outlined",
      motion: "Subtle",
      ctaText: "View details",
      cardWidth: "Spacious",
      shadowIntensity: 40,
      borderRadius: 18,
      accentColor: "#64755D",
      badges: { bestSeller: true, sale: false, newArrival: false, limitedStock: false },
      productInfo: { brand: true, ratings: true, reviewCount: true, deliveryPromise: true, stockCount: false },
    },
  },
  {
    id: "grocery",
    name: "Grocery",
    tagline: "Fast repeat",
    summary: "Compact layouts, stronger CTA visibility, and high-speed recognition for repeat buying.",
    focus: ["Speed", "CTA", "Density"],
    patch: {
      showcaseStyle: "Express",
      density: "Compact",
      imageBehaviour: "Static",
      ctaStyle: "Floating",
      motion: "None",
      ctaText: "Quick Add",
      cardWidth: "Compact",
      shadowIntensity: 28,
      borderRadius: 16,
      accentColor: "#15803D",
      badges: { bestSeller: true, sale: true, newArrival: false, limitedStock: false },
      productInfo: { brand: true, ratings: false, reviewCount: false, deliveryPromise: true, stockCount: false },
    },
  },
  {
    id: "sports",
    name: "Sports",
    tagline: "Performance",
    summary: "Higher-energy motion, stronger urgency, and quick decision support for activewear and gear.",
    focus: ["Motion", "Urgency", "Quick add"],
    patch: {
      showcaseStyle: "Express",
      density: "Balanced",
      imageBehaviour: "Hover Swap",
      ctaStyle: "Filled",
      motion: "Subtle",
      ctaText: "Quick Add",
      cardWidth: "Standard",
      shadowIntensity: 56,
      borderRadius: 18,
      accentColor: "#C2410C",
      badges: { bestSeller: true, sale: true, newArrival: true, limitedStock: true },
      productInfo: { brand: true, ratings: true, reviewCount: true, deliveryPromise: true, stockCount: true, variantCount: true },
    },
  },
  {
    id: "food",
    name: "Food",
    tagline: "Ingredient trust",
    summary: "Ingredient-first cards with tighter content, strong trust markers, and repeat-purchase friendly CTAs.",
    focus: ["Metafields", "Trust", "CTA"],
    patch: {
      showcaseStyle: "Essential",
      density: "Balanced",
      imageBehaviour: "Static",
      ctaStyle: "Filled",
      motion: "None",
      ctaText: "Add to Cart",
      cardWidth: "Standard",
      shadowIntensity: 32,
      borderRadius: 18,
      accentColor: "#9A3412",
      badges: { bestSeller: true, sale: false, newArrival: false, limitedStock: false },
      productInfo: { brand: true, deliveryPromise: true, collectionLabel: true },
      customAttributeStyle: "Key Value Pair",
      enabledMetafields: ["organic", "material", "capacity"],
    },
  },
  {
    id: "jewellery",
    name: "Jewellery",
    tagline: "Premium details",
    summary: "More whitespace, minimal badges, and elevated product detail for high-consideration luxury catalogues.",
    focus: ["Spacing", "Price", "Trust"],
    patch: {
      showcaseStyle: "Bold",
      density: "Detailed",
      imageBehaviour: "Zoom on Hover",
      ctaStyle: "Outlined",
      motion: "Subtle",
      ctaText: "Explore",
      cardWidth: "Spacious",
      shadowIntensity: 64,
      borderRadius: 26,
      accentColor: "#7C5A43",
      badges: { bestSeller: true, sale: false, newArrival: false, limitedStock: true },
      productInfo: { brand: true, vendor: true, ratings: true, reviewCount: true, sku: true },
      variantDisplay: "Image Swatches",
    },
  },
  {
    id: "quick-commerce",
    name: "Quick Commerce",
    tagline: "Under 3 seconds",
    summary: "Aggressive CTA visibility, short content, and fulfilment-first messaging for urgent purchases.",
    focus: ["Speed", "Delivery", "Mobile"],
    patch: {
      showcaseStyle: "Express",
      density: "Compact",
      imageBehaviour: "Hover Swap",
      ctaStyle: "Filled",
      motion: "Subtle",
      ctaText: "Buy Now",
      cardWidth: "Compact",
      shadowIntensity: 24,
      borderRadius: 16,
      accentColor: "#047857",
      badges: { bestSeller: false, sale: true, newArrival: false, limitedStock: false },
      productInfo: { brand: true, deliveryPromise: true, localDelivery: true, stockCount: false, ratings: false, reviewCount: false },
    },
  },
];

const SHOWCASE_STYLE_OPTIONS: Array<{
  value: ShowcaseStyle;
  label: string;
  description: string;
  tier: "ship" | "advanced";
}> = [
  { value: "Essential", label: "Essential", description: "Minimal", tier: "ship" },
  { value: "Premium", label: "Premium", description: "Complete", tier: "ship" },
  { value: "Express", label: "Express", description: "Fast buy", tier: "ship" },
  { value: "Discovery", label: "Discovery", description: "Browse-first", tier: "advanced" },
  { value: "Bold", label: "Bold", description: "Impact", tier: "advanced" },
];

const IMAGE_BEHAVIOUR_OPTIONS: Array<{
  value: ImageBehaviour;
  tier: "ship" | "advanced";
}> = [
  { value: "Static", tier: "ship" },
  { value: "Zoom on Hover", tier: "ship" },
  { value: "Hover Swap", tier: "ship" },
  { value: "Video Preview", tier: "advanced" },
  { value: "360 Preview", tier: "advanced" },
  { value: "3D Model", tier: "advanced" },
];

const MOTION_OPTIONS: Array<{
  value: Motion;
  tier: "ship" | "advanced";
}> = [
  { value: "None", tier: "ship" },
  { value: "Subtle", tier: "ship" },
];

const STRESS_WIDTHS = [200, 240, 280, 320, 360, 420] as const;

const STRESS_SWEEPS: Array<{
  id: StressSweep;
  label: string;
  description: string;
}> = [
  { id: "styles", label: "Styles", description: "See each card direction side by side." },
  { id: "media", label: "Media", description: "Compare different image interactions." },
  { id: "density", label: "Density", description: "Review lighter and richer information layouts." },
  { id: "cta", label: "CTA", description: "Preview button treatments across sizes." },
];

const PREVIEW_SURFACE_OPTIONS: Array<{
  id: SurfaceMode;
  label: string;
}> = [
  { id: "grid", label: "Grid" },
  { id: "carousel", label: "Carousel" },
  { id: "spotlight", label: "Spotlight" },
  { id: "stress", label: "Stress Test" },
  { id: "search", label: "Search Results" },
  { id: "collection", label: "Collection Page" },
  { id: "recommendation", label: "Product Recommendation" },
];

const DEVICE_OPTIONS: Array<{
  value: Device;
  label: string;
  icon: React.ElementType;
}> = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];

const SETTINGS_NAV_ITEMS: Array<{
  id: SettingsSectionId;
  icon: React.ElementType;
  label: string;
}> = [
  { id: "presets", icon: Sparkles, label: "Presets" },
  { id: "preview", icon: Layout, label: "Preview" },
  { id: "style", icon: Palette, label: "Style" },
  { id: "motion", icon: Zap, label: "Motion" },
  { id: "imagery", icon: ImageIcon, label: "Images" },
  { id: "information", icon: ShoppingBag, label: "Info" },
  { id: "cta", icon: Tag, label: "CTA" },
  { id: "customAttributes", icon: Layers, label: "Custom" },
  { id: "schema", icon: Info, label: "Schema" },
  { id: "accessibility", icon: Sun, label: "Access" },
];

const VARIANT_DISPLAY_OPTIONS: VariantDisplayStyle[] = ["Color Swatches", "Image Swatches", "Pills", "Chips", "Dropdown", "Variant Count", "Hidden"];
const VARIANT_OVERFLOW_OPTIONS: VariantOverflowBehaviour[] = ["Wrap", "Count"];
const CUSTOM_ATTRIBUTE_STYLE_OPTIONS: CustomAttributeStyle[] = ["Badge", "Pill", "Chip", "Inline Text", "Key Value Pair"];
const ACCESSIBILITY_FONT_OPTIONS: AccessibilityFontSize[] = ["Small", "Medium", "Large"];

function formatCurrency(value: number, currency: CurrencyCode) {
  const currencyMeta = CURRENCIES.find((entry) => entry.code === currency) ?? CURRENCIES[0];
  return new Intl.NumberFormat(currencyMeta.locale, {
    style: "currency",
    currency: currencyMeta.code,
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(value);
}

function alpha(hex: string, opacity: string) {
  return `${hex}${opacity}`;
}

function resolveProductDescription(product: Product) {
  return product.description ?? product.subtitle;
}

function getVariantOptions(product: Product): ProductVariant[] {
  if (product.variantOptions?.length) return product.variantOptions;
  return product.variants.map((label, index) => ({
    id: `${product.id}-${label.toLowerCase().replace(/\s+/g, "-")}`,
    label,
    sku: `${product.shortName.toUpperCase().replace(/\s+/g, "-")}-${index + 1}`,
    colorName: product.colors[index]?.name,
    swatchColor: product.colors[index]?.hex,
    imageIndex: index % product.images.length,
    price: product.price,
    compareAtPrice: product.originalPrice,
    inventory: Math.max(1, product.stock - index * 2),
  }));
}

function getProductMedia(product: Product): ProductMedia[] {
  if (product.media?.length) return product.media;
  return product.images.map((image, index) => ({
    id: `${product.id}-image-${index}`,
    type: "image" as const,
    src: image.src,
    alt: image.alt,
    kind: image.kind,
    fit: image.fit,
  }));
}

function attributeChipStyle(style: CustomAttributeStyle, accent: string, dark: boolean): CSSProperties {
  if (style === "Badge") {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 9px",
      borderRadius: 999,
      background: accent,
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    };
  }
  if (style === "Pill") {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      borderRadius: 999,
      background: dark ? "rgba(255,255,255,0.08)" : alpha(accent, "12"),
      color: dark ? "#F5F7FA" : accent,
      fontSize: 11,
      fontWeight: 700,
    };
  }
  if (style === "Inline Text") {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: dark ? "rgba(245,247,250,0.72)" : "#4B5563",
      fontSize: 12,
      fontWeight: 600,
    };
  }
  if (style === "Key Value Pair") {
    return {
      display: "grid",
      gap: 2,
      padding: "8px 10px",
      borderRadius: 12,
      background: dark ? "rgba(255,255,255,0.04)" : "#F9FAFB",
      border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
      minWidth: 0,
    };
  }
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 12,
    background: dark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
    color: dark ? "#F5F7FA" : "#111827",
    fontSize: 11,
    fontWeight: 700,
  };
}

function metafieldRegistryEntry(metafield: ProductMetafield): AttributeRegistryEntry {
  return {
    id: `metafield:${metafield.id}`,
    label: metafield.label,
    icon: Layers,
    slot: "detail",
    priority: 90,
    supportedDensity: ["Compact", "Balanced", "Detailed"],
    supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
    defaultEnabled: true,
    visibility: ({ settings }) => settings.enabledMetafields.includes(metafield.id),
    renderComponent: ({ settings }) => {
      const dark = settings.theme === "Dark" || settings.showcaseStyle === "Bold";
      const style = attributeChipStyle(settings.customAttributeStyle, settings.accentColor, dark);
      if (settings.customAttributeStyle === "Key Value Pair") {
        return (
          <span style={style}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: dark ? "rgba(245,247,250,0.56)" : "#6D7175" }}>
              {metafield.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: dark ? "#F5F7FA" : "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {metafield.value}
            </span>
          </span>
        );
      }
      return (
        <span style={style}>
          <Layers size={12} />
          <span>{settings.customAttributeStyle === "Inline Text" ? `${metafield.label}: ${metafield.value}` : metafield.value}</span>
        </span>
      );
    },
  };
}

function buildAttributeRegistry(context: AttributeContext): AttributeRegistryEntry[] {
  const { product, settings, variant } = context;
  const vendor = product.vendor ?? product.brand;
  const productType = product.productType ?? "Product";
  const collectionLabel = product.collectionLabel ?? "Featured";
  const price = variant.price ?? product.price;
  const compareAtPrice = variant.compareAtPrice ?? product.originalPrice;
  const inventory = variant.inventory ?? product.stock;
  const variantCount = getVariantOptions(product).length;

  const entries: AttributeRegistryEntry[] = [
    {
      id: "brand",
      label: "Brand",
      icon: Award,
      slot: "eyebrow",
      priority: 10,
      supportedDensity: ["Compact", "Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: true,
      visibility: ({ settings: current }) => current.productInfo.brand,
      renderComponent: () => product.brand,
    },
    {
      id: "vendor",
      label: "Vendor",
      icon: ShoppingBag,
      slot: "detail",
      priority: 30,
      supportedDensity: ["Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.vendor,
      renderComponent: () => vendor,
    },
    {
      id: "productType",
      label: "Product Type",
      icon: Type,
      slot: "detail",
      priority: 31,
      supportedDensity: ["Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.productType,
      renderComponent: () => productType,
    },
    {
      id: "collectionLabel",
      label: "Collection",
      icon: Layers,
      slot: "detail",
      priority: 32,
      supportedDensity: ["Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.collectionLabel,
      renderComponent: () => collectionLabel,
    },
    {
      id: "rating",
      label: "Rating",
      icon: Star,
      slot: "trust",
      priority: 12,
      supportedDensity: ["Compact", "Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: true,
      visibility: ({ settings: current, product: currentProduct }) => current.productInfo.ratings && currentProduct.rating > 0,
      renderComponent: () => `${product.rating.toFixed(1)}`,
    },
    {
      id: "reviewCount",
      label: "Review Count",
      icon: Star,
      slot: "trust",
      priority: 13,
      supportedDensity: ["Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: true,
      visibility: ({ settings: current, product: currentProduct }) => current.productInfo.reviewCount && currentProduct.reviews > 0,
      renderComponent: () => `(${product.reviews})`,
    },
    {
      id: "price",
      label: "Price",
      icon: Tag,
      slot: "price",
      priority: 1,
      supportedDensity: ["Compact", "Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: true,
      visibility: () => true,
      renderComponent: () => formatCurrency(price, settings.currency),
    },
    {
      id: "compareAtPrice",
      label: "Compare At Price",
      icon: Tag,
      slot: "price",
      priority: 2,
      supportedDensity: ["Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: true,
      visibility: () => compareAtPrice > price,
      renderComponent: () => formatCurrency(compareAtPrice, settings.currency),
    },
    {
      id: "discountBadge",
      label: "Discount",
      icon: Tag,
      slot: "badge",
      priority: 2,
      supportedDensity: ["Compact", "Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: true,
      visibility: ({ settings: current }) => current.badges.sale && compareAtPrice > price,
      renderComponent: () => `-${Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% OFF`,
    },
    {
      id: "deliveryPromise",
      label: "Delivery Promise",
      icon: Truck,
      slot: "detail",
      priority: 20,
      supportedDensity: ["Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: true,
      visibility: ({ settings: current }) => current.productInfo.deliveryPromise,
      renderComponent: () => product.delivery,
    },
    {
      id: "inventoryCount",
      label: "Inventory Count",
      icon: Tag,
      slot: "detail",
      priority: 21,
      supportedDensity: ["Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: true,
      visibility: ({ settings: current }) => current.productInfo.stockCount,
      renderComponent: () => `${inventory} left`,
    },
    {
      id: "stockStatus",
      label: "Stock Status",
      icon: CheckCircle2,
      slot: "detail",
      priority: 22,
      supportedDensity: ["Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.stockStatus,
      renderComponent: () => (inventory > 10 ? "In stock" : inventory > 0 ? "Low stock" : "Sold out"),
    },
    {
      id: "sku",
      label: "SKU",
      icon: Info,
      slot: "detail",
      priority: 23,
      supportedDensity: ["Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.sku,
      renderComponent: () => variant.sku,
    },
    {
      id: "variantCount",
      label: "Variant Count",
      icon: Layers,
      slot: "detail",
      priority: 24,
      supportedDensity: ["Balanced", "Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Express", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.variantCount,
      renderComponent: () => `${variantCount} options`,
    },
    {
      id: "pickupAvailability",
      label: "Pickup",
      icon: ShoppingBag,
      slot: "detail",
      priority: 25,
      supportedDensity: ["Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.pickupAvailability && Boolean(product.pickupAvailability),
      renderComponent: () => product.pickupAvailability ?? "",
    },
    {
      id: "localDelivery",
      label: "Local Delivery",
      icon: Truck,
      slot: "detail",
      priority: 26,
      supportedDensity: ["Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.localDelivery && Boolean(product.localDelivery),
      renderComponent: () => product.localDelivery ?? "",
    },
    {
      id: "unitPricing",
      label: "Unit Pricing",
      icon: Tag,
      slot: "detail",
      priority: 27,
      supportedDensity: ["Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.unitPricing && Boolean(product.unitPricing),
      renderComponent: () => product.unitPricing ?? "",
    },
    {
      id: "sellingPlan",
      label: "Selling Plan",
      icon: RotateCcw,
      slot: "detail",
      priority: 28,
      supportedDensity: ["Detailed"],
      supportedCardVariants: ["Essential", "Premium", "Discovery", "Bold"],
      defaultEnabled: false,
      visibility: ({ settings: current }) => current.productInfo.sellingPlan && Boolean(product.sellingPlan),
      renderComponent: () => product.sellingPlan ?? "",
    },
  ];

  const metafieldEntries = (product.metafields ?? []).map(metafieldRegistryEntry);
  return [...entries, ...metafieldEntries].sort((left, right) => left.priority - right.priority);
}

function visibleAttributesForSlot(slot: AttributeSlot, context: AttributeContext) {
  return buildAttributeRegistry(context).filter(
    (attribute) =>
      attribute.slot === slot &&
      attribute.supportedDensity.includes(context.settings.density) &&
      attribute.supportedCardVariants.includes(context.settings.showcaseStyle) &&
      attribute.visibility(context),
  );
}

function SectionLabel({
  icon: Icon,
  label,
  dark,
}: {
  icon: React.ElementType;
  label: string;
  dark?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <Icon size={12} style={{ color: dark ? "rgba(255,255,255,0.5)" : "rgba(24,22,26,0.5)" }} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: dark ? "rgba(255,255,255,0.5)" : "rgba(24,22,26,0.5)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Divider({ dark }: { dark?: boolean }) {
  return <div style={{ height: 1, background: dark ? "rgba(255,255,255,0.08)" : "rgba(24,22,26,0.08)" }} />;
}

function SettingsGroup({
  icon: Icon,
  title,
  expanded,
  onToggle,
  children,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <section style={{ padding: "18px 0" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          padding: 0,
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background: "#F6F6F7",
              color: "#4B5563",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={15} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.25, fontWeight: 600, color: "#111827" }}>{title}</h3>
              {badge ? (
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "#F6F6F7",
                    color: "#6D7175",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {badge}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            background: expanded ? "#F6F6F7" : "transparent",
            color: "#6D7175",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 180ms ease",
          }}
        >
          <ChevronDown size={16} style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 180ms ease" }} />
        </div>
      </button>
      <div style={{ display: "grid", gridTemplateRows: expanded ? "1fr" : "0fr", transition: "grid-template-rows 220ms ease" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <Divider />
      </div>
    </section>
  );
}

function FieldBlock({
  eyebrow,
  label,
  value,
  children,
}: {
  eyebrow?: string;
  label: string;
  value?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      {eyebrow ? (
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6D7175", marginBottom: 8 }}>
          {eyebrow}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{label}</div>
        </div>
        {value ? <div style={{ fontSize: 11, fontWeight: 800, color: "#111827", flexShrink: 0 }}>{value}</div> : null}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  accentColor,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  accentColor: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{label}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} accentColor={accentColor} />
    </div>
  );
}

function bucketForWidth(width: number): LayoutBucket {
  if (width < 220) return "xs";
  if (width < 280) return "sm";
  if (width < 360) return "md";
  return "lg";
}

function normalizeHex(hex: string) {
  const sanitized = hex.replace("#", "").trim();
  if (sanitized.length === 3) {
    return `#${sanitized
      .split("")
      .map((part) => `${part}${part}`)
      .join("")}`;
  }
  if (sanitized.length === 6) {
    return `#${sanitized}`;
  }
  return "#000000";
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex).replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function productsForSurface(surface: SurfaceMode) {
  const products = getRuntimeProducts();
  if (surface === "spotlight") return [products[0]];
  return products;
}

function widthsForSurface(surface: SurfaceMode) {
  if (surface === "grid") return [240, 280, 320];
  if (surface === "carousel") return [220, 280, 320];
  if (surface === "spotlight") return [280, 360];
  return [...STRESS_WIDTHS];
}

function evaluateDesignQA({
  width,
  settings,
  device,
  product,
}: {
  width: number;
  settings: Settings;
  device: Device;
  product: Product;
}): DesignQAReport {
  const bucket = bucketForWidth(width);
  const badgeCount = Object.values(settings.badges).filter(Boolean).length;
  const trustCount = Object.values(settings.productInfo).filter(Boolean).length;
  const titleLength = product.name.length;
  const subtitleLength = product.subtitle.length;
  const ctaLength = settings.ctaText.trim().length;
  const isDark = settings.theme === "Dark" || settings.showcaseStyle === "Bold";
  const background = isDark ? "#121417" : "#FFFFFF";
  const foreground = isDark ? "#F5F7FA" : "#111827";
  const titleCapacity = (() => {
    const base = bucket === "xs" ? 28 : bucket === "sm" ? 40 : bucket === "md" ? 56 : 70;
    const densityBoost = settings.density === "Detailed" ? 8 : settings.density === "Compact" ? -2 : 0;
    const stylePenalty = settings.showcaseStyle === "Bold" ? -6 : settings.showcaseStyle === "Express" ? -2 : 0;
    return base + densityBoost + stylePenalty;
  })();
  const accentContrast = contrastRatio(settings.accentColor, background);
  const ctaContrast =
    settings.ctaStyle === "Filled" || settings.ctaStyle === "Floating"
      ? contrastRatio("#FFFFFF", settings.ctaColor)
      : contrastRatio(settings.ctaColor, background);
  const bodyContrast = contrastRatio(foreground, background);
  const primaryImage = product.images[0];
  const likelyCropRisk =
    (primaryImage.kind === "lifestyle" || primaryImage.kind === "detail") &&
    bucket !== "lg" &&
    settings.showcaseStyle !== "Express";

  const checks: DesignQACheck[] = [
    {
      id: "grid-safe",
      label: "Grid Safe",
      status:
        width < 220 && settings.density === "Detailed"
          ? "fail"
          : width < 240 && settings.showcaseStyle !== "Express"
            ? "warn"
            : "pass",
      reason:
        width < 220 && settings.density === "Detailed"
          ? "Dense product info leaves too little horizontal room in collection grids, so shoppers will scan fragments instead of a clean buying signal."
          : width < 240 && settings.showcaseStyle !== "Express"
            ? "This width is tight for richer card layouts, so grid browsing may feel crowded before the shopper reaches the price and CTA."
            : "The content stack stays within a grid-friendly width and preserves a clear browse rhythm.",
    },
    {
      id: "carousel-safe",
      label: "Carousel Safe",
      status:
        width < 240 && settings.ctaStyle === "Floating"
          ? "fail"
          : width < 280 && settings.density === "Detailed"
            ? "warn"
            : "pass",
      reason:
        width < 240 && settings.ctaStyle === "Floating"
          ? "Floating CTAs consume vertical emphasis inside narrow carousel cards, which pushes product information out of the first glance zone."
          : width < 280 && settings.density === "Detailed"
            ? "Carousels reward fast scanning, and this amount of detail can slow swiping because each card asks for too much reading."
            : "The card remains swipe-friendly and keeps the primary decision cues visible in horizontal rails.",
    },
    {
      id: "mobile-safe",
      label: "Mobile Safe",
      status:
        (device === "mobile" || width <= 240) && settings.imageBehaviour === "Tilt & Lift" && settings.liftHeight > 12
          ? "fail"
          : width <= 240 && badgeCount > 2
            ? "warn"
            : "pass",
      reason:
        (device === "mobile" || width <= 240) && settings.imageBehaviour === "Tilt & Lift" && settings.liftHeight > 12
          ? "Lift motion is too pronounced for a tight touch layout, which can make the card feel less stable during quick mobile scanning."
          : width <= 240 && badgeCount > 2
            ? "Too many merchandising badges on mobile compete with the product image and delay price recognition."
            : "The mobile composition keeps motion and content within a touch-friendly scanning pattern.",
    },
    {
      id: "typography-safe",
      label: "Typography Safe",
      status:
        titleLength > titleCapacity + 18
          ? "fail"
          : titleLength > titleCapacity || (settings.density === "Detailed" && subtitleLength > 70 && bucket === "sm")
            ? "warn"
            : "pass",
      reason:
        titleLength > titleCapacity + 18
          ? "The product name is long enough that typography will compress or truncate important words, which weakens fast product understanding."
          : titleLength > titleCapacity || (settings.density === "Detailed" && subtitleLength > 70 && bucket === "sm")
            ? "Text length is near the layout limit, so the shopper may need an extra beat to understand the product before deciding."
            : "Type hierarchy remains readable and gives the title enough space to do the selling work.",
    },
    {
      id: "badge-overflow",
      label: "Badge Overflow",
      status:
        badgeCount >= 4 && bucket === "xs"
          ? "fail"
          : badgeCount >= 3 && bucket !== "lg"
            ? "warn"
            : "pass",
      reason:
        badgeCount >= 4 && bucket === "xs"
          ? "This many badges will crowd the image corner and can hide the product itself, which hurts first-glance recognition."
          : badgeCount >= 3 && bucket !== "lg"
            ? "Multiple badges are competing for the same space, so merchandising labels may overpower the image and title."
            : "Badge count stays within a safe range for the available image real estate.",
    },
    {
      id: "cta-overflow",
      label: "CTA Overflow",
      status:
        ctaLength > 16 && bucket === "xs"
          ? "fail"
          : ctaLength > 12 && bucket !== "lg"
            ? "warn"
            : "pass",
      reason:
        ctaLength > 16 && bucket === "xs"
          ? "The button label is too long for a narrow card, so the CTA will either wrap or shrink and lose urgency."
          : ctaLength > 12 && bucket !== "lg"
            ? "The CTA copy is approaching the width limit, which reduces button clarity in fast browsing contexts."
            : "The call to action stays concise enough to remain dominant and readable.",
    },
    {
      id: "image-crop",
      label: "Image Crop Detection",
      status:
        likelyCropRisk && width <= 240
          ? "fail"
          : likelyCropRisk
            ? "warn"
            : "pass",
      reason:
        likelyCropRisk && width <= 240
          ? "Cover-style media at this width can crop out critical product detail, which slows recognition and reduces confidence."
          : likelyCropRisk
            ? "This image may lose useful context in tighter cards, so review whether the product remains instantly identifiable."
            : "The current media treatment is unlikely to hide important product detail.",
    },
    {
      id: "title-overflow",
      label: "Title Overflow",
      status:
        titleLength > titleCapacity + 24
          ? "fail"
          : titleLength > titleCapacity + 8
            ? "warn"
            : "pass",
      reason:
        titleLength > titleCapacity + 24
          ? "Too much of the product name will be truncated, which risks hiding differentiators like size, model, or category."
          : titleLength > titleCapacity + 8
            ? "The title will likely clamp earlier than ideal, so shoppers may not see the full product identifier."
            : "The title length fits the available headline space without hiding critical meaning.",
    },
    {
      id: "color-contrast",
      label: "Color Contrast",
      status:
        bodyContrast < 4.5 || ctaContrast < 4.5
          ? "fail"
          : accentContrast < 3
            ? "warn"
            : "pass",
      reason:
        bodyContrast < 4.5 || ctaContrast < 4.5
          ? "Text or CTA contrast is too low for reliable reading, which can directly reduce trust and add-to-cart confidence."
          : accentContrast < 3
            ? "Accent-led UI elements are readable, but they may not stand out enough for quick scanning on all storefronts."
            : "Foreground, accent, and CTA colors maintain strong contrast for quick product decisions.",
    },
    {
      id: "accessibility",
      label: "Accessibility",
      status:
        width < 220
          ? "fail"
          : trustCount >= 5 && bucket === "sm"
            ? "warn"
            : "pass",
      reason:
        width < 220
          ? "Interactive controls become too compact at this width, which increases tap risk and makes the component less inclusive."
          : trustCount >= 5 && bucket === "sm"
            ? "A high number of supporting signals can create cognitive load, so the card may feel harder to parse for assistive and quick-scan users."
            : "Touch targets, contrast, and information load stay within a more accessible range.",
    },
  ];

  const score = checks.reduce((total, check) => total + (check.status === "pass" ? 10 : check.status === "info" ? 8 : check.status === "warn" ? 6 : 2), 0);
  const status = checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass";

  return { checks, score, status };
}

function useMeasuredWidth<T extends HTMLElement>(fallbackWidth: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      if (next > 0) {
        setWidth(next);
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function RadioPills<T extends string>({
  options,
  value,
  onChange,
  dark,
  fullWidth = false,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  dark?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              flex: fullWidth ? 1 : undefined,
              border: "none",
              cursor: "pointer",
              borderRadius: 12,
              padding: "8px 11px",
              fontSize: 12,
              fontWeight: 700,
              background: active
                ? dark
                  ? "#F5EFE8"
                  : "#18161A"
                : dark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(24,22,26,0.06)",
              color: active
                ? dark
                  ? "#18161A"
                  : "#F5EFE8"
                : dark
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(24,22,26,0.68)",
              transition: "all 160ms ease",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  accentColor,
  dark,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  accentColor: string;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 42,
        height: 24,
        border: "none",
        borderRadius: 999,
        cursor: "pointer",
        background: checked ? accentColor : dark ? "rgba(255,255,255,0.14)" : "rgba(24,22,26,0.12)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "#fff",
          transition: "left 160ms ease",
        }}
      />
    </button>
  );
}

function RangeSlider({
  value,
  min,
  max,
  onChange,
  accentColor,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accentColor: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: "relative", height: 20 }}>
      <div
        style={{
          position: "absolute",
          inset: "8px 0 auto 0",
          height: 4,
          borderRadius: 999,
          background: "rgba(24,22,26,0.12)",
        }}
      >
        <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: accentColor }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%", position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
      />
    </div>
  );
}

function DeviceFrame({
  device,
  theme,
  children,
}: {
  device: Device;
  theme: Theme;
  children: React.ReactNode;
}) {
  const frameBg = theme === "Dark" ? "#1B1B1E" : "#FCF8F2";
  const chrome = theme === "Dark" ? "#121215" : "#E8DED2";

  if (device === "desktop") {
    return (
      <div style={{ width: "100%", maxWidth: 860, margin: "0 auto" }}>
        <div
          style={{
            height: 36,
            borderRadius: "16px 16px 0 0",
            background: chrome,
            borderBottom: theme === "Dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(24,22,26,0.08)",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            gap: 7,
          }}
        >
          {["#FF5F57", "#FFBD2E", "#28CA42"].map((color) => (
            <span key={color} style={{ width: 9, height: 9, borderRadius: 999, background: color }} />
          ))}
          <div
            style={{
              marginLeft: 10,
              borderRadius: 999,
              padding: "5px 10px",
              fontSize: 10,
              background: theme === "Dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)",
              color: theme === "Dark" ? "rgba(255,255,255,0.55)" : "rgba(24,22,26,0.5)",
            }}
          >
            yourstore.com/collections/featured
          </div>
        </div>
        <div
          style={{
            borderRadius: "0 0 16px 16px",
            background: frameBg,
            minHeight: 520,
            padding: 20,
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (device === "tablet") {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          margin: "0 auto",
          borderRadius: 30,
          padding: 14,
          background: "#1C1B1F",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "#2F2E34" }} />
        </div>
        <div style={{ borderRadius: 22, background: frameBg, minHeight: 500, padding: 18 }}>{children}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        margin: "0 auto",
        borderRadius: 34,
        padding: 10,
        background: "#19191C",
        boxShadow: "0 28px 70px rgba(0,0,0,0.32)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <span style={{ width: 82, height: 20, borderRadius: 999, background: "#0F0F11" }} />
      </div>
      <div style={{ borderRadius: 28, background: frameBg, minHeight: 600, padding: 14 }}>{children}</div>
    </div>
  );
}

function ProductCard({
  product,
  settings,
  device,
  surface,
  onQuickView,
}: {
  product: Product;
  settings: Settings;
  device: Device;
  surface: SurfaceMode;
  onQuickView?: (product: Product) => void;
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const variantOptions = getVariantOptions(product);
  const fallbackVariant: ProductVariant =
    variantOptions[0] ?? {
      id: `${product.id}-default`,
      label: product.variants[0] ?? "Default",
      sku: `${product.shortName}-DEFAULT`,
      price: product.price,
      compareAtPrice: product.originalPrice,
      inventory: product.stock,
    };
  const [selectedVariant, setSelectedVariant] = useState(fallbackVariant.id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageHovered, setImageHovered] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const spinFrameCount = useRef(0);

  const isDark = settings.theme === "Dark" || settings.showcaseStyle === "Bold";
  const accent = settings.accentColor;
  const ctaAccent = settings.ctaColor;
  const motionDuration = settings.motion === "None" || settings.reducedMotion ? 0 : 160;
  const cardBg = isDark ? "#121417" : "#FFFFFF";
  const fg = isDark ? "#F5F7FA" : "#111827";
  const muted = isDark ? "rgba(245,247,250,0.72)" : "#4B5563";
  const faint = isDark ? "rgba(245,247,250,0.14)" : "#E5E7EB";
  const soft = isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const isExpress = settings.showcaseStyle === "Express";
  const imageBg =
    settings.showcaseStyle === "Bold"
      ? "#1B1F24"
      : isDark
        ? "#191D23"
        : settings.showcaseStyle === "Discovery"
        ? "#F4F6F8"
          : "#F3F4F6";
  const radius = settings.borderRadius;
  const widthMap: Record<CardWidth, number> = {
    Compact: settings.showcaseStyle === "Express" ? 420 : 272,
    Standard: settings.showcaseStyle === "Express" ? 500 : 320,
    Spacious: settings.showcaseStyle === "Express" ? 580 : 376,
  };
  const fallbackCardWidth =
    surface === "grid"
      ? device === "mobile"
        ? 208
        : device === "tablet"
          ? 264
          : widthMap[settings.cardWidth]
      : surface === "carousel"
        ? widthMap[settings.cardWidth]
        : Math.min(widthMap[settings.cardWidth] + 36, 440);
  const { ref: cardRef, width: measuredCardWidth } = useMeasuredWidth<HTMLElement>(fallbackCardWidth);
  const layoutBucket = bucketForWidth(measuredCardWidth);
  const isTight = layoutBucket === "xs";
  const isCompactBucket = layoutBucket === "xs" || layoutBucket === "sm";
  const compactSurface = device === "mobile" || settings.density === "Compact" || isCompactBucket;
  const reducedMotion = motionDuration > 0 && (isCompactBucket || device === "mobile");
  const effectiveMotionDuration = reducedMotion ? Math.min(motionDuration, 140) : motionDuration;
  const fontScale = settings.fontSize === "Small" ? 0.94 : settings.fontSize === "Large" ? 1.08 : 1;
  const padding = isExpress ? (isCompactBucket ? 14 : 16) : isCompactBucket ? 14 : settings.density === "Detailed" ? 20 : 16;
  const gap = isExpress ? (isCompactBucket ? 10 : 12) : isCompactBucket ? 10 : settings.density === "Detailed" ? 14 : 12;
  const titleSize =
    settings.showcaseStyle === "Bold"
      ? isCompactBucket
        ? 20
        : settings.density === "Detailed"
          ? 28
          : 24
      : isExpress
        ? isCompactBucket
          ? 18
          : 20
        : isCompactBucket
          ? 15
        : settings.density === "Detailed"
          ? 19
          : 17;
  const priceSize = isExpress ? (isCompactBucket ? 26 : 28) : isCompactBucket ? 25 : settings.density === "Detailed" ? 31 : 28;
  const maxWidth =
    surface === "grid"
      ? "100%"
      : surface === "carousel"
        ? `${widthMap[settings.cardWidth]}px`
        : `${Math.min(widthMap[settings.cardWidth] + 36, 440)}px`;
  const expressHorizontal = isExpress && device === "desktop" && surface !== "grid" && layoutBucket === "lg";
  const selectedVariantData = variantOptions.find((variant) => variant.id === selectedVariant) ?? fallbackVariant;
  const resolvedPrice = selectedVariantData?.price ?? product.price;
  const resolvedCompareAtPrice = selectedVariantData?.compareAtPrice ?? product.originalPrice;
  const resolvedInventory = selectedVariantData?.inventory ?? product.stock;
  const variantBadges = selectedVariantData?.badges ?? {};
  const mergedBadges = { ...settings.badges, ...variantBadges };
  const selectedImageIndex = selectedVariantData?.imageIndex ?? selectedImage;
  const activeImage = product.images[selectedImageIndex] ?? product.images[0];
  const hoverImage = product.images[(selectedImageIndex + 1) % product.images.length] ?? activeImage;
  const mediaItems = getProductMedia(product);
  const videoMedia = mediaItems.find((media): media is Extract<ProductMedia, { type: "video" }> => media.type === "video");
  const spinMedia = mediaItems.find((media): media is Extract<ProductMedia, { type: "spin" }> => media.type === "spin");
  const modelMedia = mediaItems.find((media): media is Extract<ProductMedia, { type: "model" }> => media.type === "model");
  spinFrameCount.current = spinMedia?.frames.length ?? 0;
  const spinFrame = spinMedia?.frames[selectedImage % (spinMedia?.frames.length || 1)];
  const stageImage = activeImage;

  const baseShadowIntensity = settings.shadowIntensity / 100;
  const shadow = isDark
    ? `0 16px 48px rgba(0,0,0,${0.28 + 0.26 * baseShadowIntensity})`
    : `0 18px 46px rgba(94,66,37,${0.09 + 0.14 * baseShadowIntensity})`;
  const hoverShadow = isDark
    ? `0 20px 56px rgba(0,0,0,${0.32 + 0.26 * baseShadowIntensity})`
    : `0 22px 54px rgba(17,24,39,${0.12 + 0.16 * baseShadowIntensity})`;

  const resolveMediaFit = (image: Product["images"][number], fallback: "cover" | "contain" = "cover") => {
    if (image.fit === "contain" || image.kind === "cutout") return "contain";
    if (isExpress && isCompactBucket) return "contain";
    if (layoutBucket === "xs" && image.kind !== "lifestyle") return "contain";
    return image.fit ?? fallback;
  };
  const mediaPaddingForFit = (fit: "cover" | "contain") => (fit === "contain" ? (isTight ? 12 : isCompactBucket ? 14 : 16) : 0);
  const stageImageFit = resolveMediaFit(stageImage, isExpress ? "contain" : "cover");
  const activeImageFit = resolveMediaFit(activeImage, isExpress ? "contain" : "cover");
  const hoverImageFit = resolveMediaFit(hoverImage, isExpress ? "contain" : "cover");
  const tiltLiftRaise = Math.min(settings.liftHeight, 10);
  const hoverEmphasis = Math.min(settings.tiltDegrees, 10);

  const imageTransform = (() => {
    if (settings.imageBehaviour === "Zoom on Hover") return imageHovered ? "scale(1.025)" : "scale(1)";
    if (settings.imageBehaviour === "Tilt & Lift")
      return imageHovered
        ? `translateY(-${tiltLiftRaise}px) scale(${1 + hoverEmphasis * 0.0022})`
        : "translateY(0px) scale(1)";
    return "scale(1)";
  })();

  const stageTransform =
    settings.imageBehaviour === "Tilt & Lift"
      ? imageHovered
        ? `translateY(-${Math.max(2, Math.round(hoverEmphasis * 0.45))}px)`
        : "translateY(0px)"
      : "none";

  const ctaStyle: CSSProperties =
    settings.ctaStyle === "Filled"
      ? { background: ctaAccent, color: "#fff", border: "none" }
      : settings.ctaStyle === "Outlined"
        ? { background: "transparent", color: ctaAccent, border: `1.5px solid ${ctaAccent}` }
        : {
            background: ctaAccent,
            color: "#fff",
            border: "none",
            boxShadow: `0 10px 28px ${alpha(ctaAccent, "55")}`,
          };
  const secondaryCtaStyle: CSSProperties = {
    width: "100%",
    borderRadius: radius - 8,
    minHeight: compactSurface ? 42 : 46,
    padding: compactSurface ? "10px 14px" : "12px 16px",
    background: "transparent",
    border: `1px solid ${ctaAccent}`,
    color: ctaAccent,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  const attributeContext: AttributeContext = {
    product,
    settings,
    variant: selectedVariantData,
    density: settings.density,
    currency: settings.currency,
  };
  const eyebrowAttributes = visibleAttributesForSlot("eyebrow", attributeContext);
  const trustAttributes = visibleAttributesForSlot("trust", attributeContext);
  const priceAttributes = visibleAttributesForSlot("price", attributeContext);
  const detailAttributes = visibleAttributesForSlot("detail", attributeContext);
  const metafieldAttributes = detailAttributes.filter((attribute) => String(attribute.id).startsWith("metafield:")).slice(0, settings.customAttributeLimit);
  const coreDetailAttributes = detailAttributes.filter((attribute) => !String(attribute.id).startsWith("metafield:"));

  const badgeNodes = [
    mergedBadges.sale ? (
      <span key="sale" style={badgeStyle("#E11D48", "#fff")}>
        {buildAttributeRegistry(attributeContext).find((attribute) => attribute.id === "discountBadge")?.renderComponent(attributeContext)}
      </span>
    ) : null,
    mergedBadges.bestSeller ? (
      <span key="best" style={badgeStyle(isDark ? "rgba(255,255,255,0.12)" : "rgba(24,22,26,0.08)", fg)}>
        Best Seller
      </span>
    ) : null,
    mergedBadges.newArrival ? (
      <span key="new" style={badgeStyle("#17785D", "#fff")}>
        New Arrival
      </span>
    ) : null,
    mergedBadges.limitedStock && !settings.productInfo.stockCount ? (
      <span key="stock" style={badgeStyle("#F6E8D8", "#8B4A25")}>
        Only {resolvedInventory} left
      </span>
    ) : null,
  ].filter(Boolean);

  const renderTitle = settings.showcaseStyle === "Bold" ? product.shortName.toUpperCase() : product.name;
  const showVariantsBase =
    settings.showcaseStyle === "Premium" ||
    settings.showcaseStyle === "Discovery" ||
    settings.showcaseStyle === "Bold";
  const showVariants = showVariantsBase && layoutBucket !== "xs";
  const showSubtitle =
    layoutBucket !== "xs" && (settings.density === "Detailed" || surface === "spotlight" || (settings.showcaseStyle === "Discovery" && !compactSurface));
  const titleClamp = isTight ? 2 : isExpress ? 3 : settings.showcaseStyle === "Bold" ? 2 : settings.density === "Compact" ? 2 : 3;
  const subtitleClamp = 2;
  const showQuickView =
    surface === "spotlight" &&
    layoutBucket === "lg" &&
    !compactSurface &&
    !isExpress &&
    (settings.showcaseStyle === "Premium" ||
      settings.showcaseStyle === "Discovery" ||
      settings.showcaseStyle === "Bold");
  const showTrustRow = layoutBucket !== "xs" && !(compactSurface && surface !== "spotlight");
  const showThumbs = product.images.length > 1 && !isExpress && !compactSurface && layoutBucket === "lg";
  const showSwatchLabel = !isCompactBucket || surface === "spotlight";
  const showStockMeter = settings.productInfo.stockCount && !isExpress && settings.density === "Detailed" && layoutBucket !== "xs" && (!compactSurface || surface === "spotlight");
  const showPriceCompare = layoutBucket !== "xs";
  const showPriceSavings = mergedBadges.sale && layoutBucket !== "xs";
  const showDeliveryPromise = settings.productInfo.deliveryPromise && layoutBucket !== "xs";
  const showReviewCount = settings.productInfo.reviewCount && layoutBucket !== "xs";
  const expressMinimal = isExpress && (surface === "grid" || !expressHorizontal);
  const showRatingInline = (settings.productInfo.ratings || showReviewCount) && layoutBucket !== "xs";
  const visibleBadges = badgeNodes.slice(0, isTight ? 2 : compactSurface ? 2 : 3);
  const savingsAmount = Math.max(0, resolvedCompareAtPrice - resolvedPrice);
  const trustChips = [
    showRatingInline && trustAttributes.length
      ? {
          icon: Star,
          label: `${trustAttributes.map((attribute) => attribute.renderComponent(attributeContext)).join(" ")}`,
          iconColor: "#E9A62E",
          strong: true,
        }
      : null,
    showDeliveryPromise
      ? {
          icon: Truck,
          label: `${coreDetailAttributes.find((attribute) => attribute.id === "deliveryPromise")?.renderComponent(attributeContext) ?? product.delivery}`,
          iconColor: accent,
          strong: false,
        }
      : null,
    settings.productInfo.stockCount
      ? {
          icon: Tag,
          label: `Only ${resolvedInventory} left`,
          iconColor: "#B45309",
          strong: false,
        }
      : null,
  ].filter(Boolean) as Array<{ icon: React.ElementType; label: string; iconColor: string; strong: boolean }>;
  const supportingSearchLine =
    trustChips[0]?.label ??
    coreDetailAttributes.find((attribute) => attribute.id === "deliveryPromise" || attribute.id === "stockStatus" || attribute.id === "vendor")?.renderComponent(attributeContext) ??
    product.subtitle;
  const searchSwatches = variantOptions
    .filter((variant) => Boolean(variant.swatchColor))
    .slice(0, Math.min(settings.maxVisibleVariants, 4));
  const imageAspectRatio =
    isExpress
      ? layoutBucket === "xs"
        ? "1 / 1"
        : layoutBucket === "sm"
          ? "4 / 4.3"
          : "4 / 3"
      : settings.showcaseStyle === "Discovery"
      ? "4 / 5"
      : settings.showcaseStyle === "Bold"
        ? "1 / 1.08"
        : settings.showcaseStyle === "Essential"
          ? "1 / 1"
          : "1 / 0.92";

  useEffect(() => {
    if (!videoRef.current || settings.imageBehaviour !== "Video Preview") return;
    if (imageHovered) {
      videoRef.current.play().catch(() => undefined);
      return;
    }
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, [imageHovered, settings.imageBehaviour]);

  if (surface === "search") {
    const compactCtaText = settings.ctaText.length > 18 ? "View" : settings.ctaText;

    return (
      <article
        ref={cardRef}
        style={{
          width: "100%",
          maxWidth: "100%",
          borderRadius: radius,
          overflow: "hidden",
          border: `1px solid ${border}`,
          background: cardBg,
          boxShadow: shadow,
          display: "grid",
          gridTemplateColumns: device === "mobile" ? "104px minmax(0,1fr)" : "148px minmax(0,1fr)",
          gap: 0,
        }}
      >
        <div
          onMouseEnter={() => setImageHovered(true)}
          onMouseLeave={() => setImageHovered(false)}
          style={{
            position: "relative",
            minHeight: device === "mobile" ? 128 : 150,
            background: imageBg,
            overflow: "hidden",
          }}
        >
          <img
            src={stageImage.src}
            alt={stageImage.alt}
            style={{
              width: "100%",
              height: "100%",
              objectFit: stageImageFit,
              padding: mediaPaddingForFit(stageImageFit),
              transform: imageTransform,
              transition: effectiveMotionDuration === 0 ? "none" : `transform ${effectiveMotionDuration}ms ease`,
            }}
          />
          {visibleBadges[0] ? (
            <div style={{ position: "absolute", top: 10, left: 10 }}>
              {visibleBadges[0]}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: device === "mobile" ? "12px 12px 12px 13px" : "14px 16px",
            minWidth: 0,
            alignContent: "center",
          }}
        >
          <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
            {settings.productInfo.brand ? (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {product.brand}
              </div>
            ) : null}
            <div
              style={{
                fontSize: device === "mobile" ? 15 : 16,
                lineHeight: 1.2,
                fontWeight: 700,
                color: fg,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.name}
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.45,
                color: muted,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {supportingSearchLine}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
            <span style={{ fontSize: device === "mobile" ? 20 : 22, fontWeight: 800, color: fg }}>
              {formatCurrency(resolvedPrice, settings.currency)}
            </span>
            {resolvedCompareAtPrice > resolvedPrice ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: muted, textDecoration: "line-through" }}>
                {formatCurrency(resolvedCompareAtPrice, settings.currency)}
              </span>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            {searchSwatches.length && settings.variantDisplay !== "Hidden" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                {searchSwatches.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    aria-label={variant.colorName ?? variant.label}
                    onClick={() => {
                      setSelectedVariant(variant.id);
                      if (typeof variant.imageIndex === "number") {
                        setSelectedImage(variant.imageIndex);
                      }
                    }}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      border: variant.id === selectedVariant ? `2px solid ${accent}` : `1px solid ${faint}`,
                      background: variant.swatchColor ?? soft,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, fontWeight: 700, color: muted }}>
                {variantOptions.length > 1 ? `${variantOptions.length} variants` : product.productType ?? "Ready to ship"}
              </div>
            )}

            <button
              type="button"
              style={{
                ...ctaStyle,
                minHeight: 36,
                padding: "0 14px",
                borderRadius: radius - 10,
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {compactCtaText}
            </button>
          </div>
        </div>
      </article>
    );
  }

  const cardContent = (
    <>
      <div
        ref={imageRef}
        onMouseEnter={() => setImageHovered(true)}
        onMouseLeave={() => {
          setImageHovered(false);
        }}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: expressHorizontal ? radius - 8 : `${radius}px ${radius}px 0 0`,
          background: imageBg,
          minHeight: expressHorizontal ? 180 : expressMinimal ? (layoutBucket === "xs" ? 210 : 228) : undefined,
          aspectRatio: expressHorizontal ? undefined : imageAspectRatio,
          flexShrink: 0,
          isolation: "isolate",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: stageTransform,
            transition: motionDuration === 0 ? "none" : `transform ${motionDuration}ms ease`,
          }}
        >
          {settings.imageBehaviour === "Hover Swap" && product.images.length > 1 ? (
            <>
              <img
                src={activeImage.src}
                alt={activeImage.alt}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: activeImageFit,
                  padding: mediaPaddingForFit(activeImageFit),
                  opacity: imageHovered ? 0 : 1,
                  transform: imageHovered ? "scale(1.01)" : "scale(1)",
                  transition: effectiveMotionDuration === 0 ? "none" : `opacity ${effectiveMotionDuration}ms ease, transform ${effectiveMotionDuration}ms ease`,
                }}
              />
              <img
                src={hoverImage.src}
                alt={hoverImage.alt}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: hoverImageFit,
                  padding: mediaPaddingForFit(hoverImageFit),
                  opacity: imageHovered ? 1 : 0,
                  transform: imageHovered ? "scale(1.02)" : "scale(1.03)",
                  transition: effectiveMotionDuration === 0 ? "none" : `opacity ${effectiveMotionDuration}ms ease, transform ${effectiveMotionDuration}ms ease`,
                }}
              />
            </>
          ) : settings.imageBehaviour === "Video Preview" && videoMedia ? (
            <video
              ref={videoRef}
              src={videoMedia.src}
              poster={videoMedia.poster}
              muted
              loop
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : settings.imageBehaviour === "360 Preview" && spinMedia ? (
            <img
              src={spinFrame ?? activeImage.src}
              alt={spinMedia.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: stageImageFit,
                padding: mediaPaddingForFit(stageImageFit),
                transition: effectiveMotionDuration === 0 ? "none" : `transform ${effectiveMotionDuration}ms ease`,
              }}
            />
          ) : (
            <img
              src={stageImage.src}
              alt={stageImage.alt}
              style={{
                width: "100%",
                height: "100%",
                objectFit: stageImageFit,
                padding: mediaPaddingForFit(stageImageFit),
                transform: imageTransform,
                transition: effectiveMotionDuration === 0 ? "none" : `transform ${effectiveMotionDuration}ms ease`,
                filter: settings.imageBehaviour === "Tilt & Lift" ? `drop-shadow(0 16px 24px ${alpha("#000000", isDark ? "34" : "16")})` : "none",
              }}
            />
          )}
        </div>
        {settings.imageBehaviour === "Tilt & Lift" && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                border: `1px solid ${imageHovered ? alpha("#FFFFFF", isDark ? "16" : "42") : alpha("#FFFFFF", isDark ? "08" : "24")}`,
                boxShadow: imageHovered
                  ? `inset 0 1px 0 ${alpha("#FFFFFF", isDark ? "12" : "56")}, 0 10px 24px ${alpha(accent, isDark ? "14" : "10")}`
                  : `inset 0 1px 0 ${alpha("#FFFFFF", isDark ? "08" : "34")}`,
                pointerEvents: "none",
                opacity: imageHovered ? 1 : 0.72,
                transition: effectiveMotionDuration === 0 ? "none" : `opacity ${effectiveMotionDuration}ms ease, box-shadow ${effectiveMotionDuration}ms ease, border ${effectiveMotionDuration}ms ease`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "18% 14% 12%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${alpha(accent, imageHovered ? "16" : "10")} 0%, transparent 72%)`,
                filter: "blur(18px)",
                transform: imageHovered ? "translateY(10px) scale(1.02)" : "translateY(14px) scale(0.96)",
                opacity: imageHovered ? 0.78 : 0.42,
                pointerEvents: "none",
                transition: effectiveMotionDuration === 0 ? "none" : `transform ${effectiveMotionDuration}ms ease, opacity ${effectiveMotionDuration}ms ease`,
              }}
            />
          </>
        )}
        <div style={{ position: "absolute", top: 12, left: 12, display: "flex", flexWrap: "wrap", gap: 6, maxWidth: layoutBucket === "xs" ? "80%" : "72%" }}>
          {visibleBadges}
        </div>
        {settings.imageBehaviour === "3D Model" && modelMedia ? (
          <div style={{ position: "absolute", left: 12, bottom: 12, borderRadius: 999, background: "rgba(17,24,39,0.72)", color: "#FFFFFF", padding: "7px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Layers size={12} />
            <span>{modelMedia.label}</span>
          </div>
        ) : null}
        {settings.imageBehaviour === "360 Preview" && spinMedia ? (
          <div style={{ position: "absolute", left: 12, bottom: 12, borderRadius: 999, background: "rgba(17,24,39,0.72)", color: "#FFFFFF", padding: "7px 10px", fontSize: 11, fontWeight: 700 }}>
            Drag to spin
          </div>
        ) : null}
        {settings.imageBehaviour === "Video Preview" && videoMedia ? (
          <div style={{ position: "absolute", left: 12, bottom: 12, borderRadius: 999, background: "rgba(17,24,39,0.72)", color: "#FFFFFF", padding: "7px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <PlayCircle size={12} />
            <span>Preview video</span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setWishlisted((value) => !value)}
          style={{
            position: "absolute",
            top: isTight ? 10 : 12,
            right: isTight ? 10 : 12,
            width: isTight ? 28 : 36,
            height: isTight ? 28 : 36,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(17,24,39,0.08)"}`,
            borderRadius: 999,
            background: isDark ? "rgba(18,20,23,0.82)" : "rgba(255,255,255,0.94)",
            color: wishlisted ? "#E11D48" : "#18161A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: isDark ? "0 8px 18px rgba(0,0,0,0.24)" : "0 8px 18px rgba(15,23,42,0.08)",
          }}
        >
          <Heart size={isTight ? 13 : 15} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div style={{ padding, display: "flex", flexDirection: "column", gap, minWidth: 0 }}>
        {showThumbs ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {product.images.map((image, index) => {
              const active = selectedImage === index;
              return (
                <button
                  key={`${image.src}-${index}`}
                  type="button"
                  aria-label={`Show image ${index + 1}`}
                  onClick={() => setSelectedImage(index)}
                  style={{
                    width: settings.density === "Compact" ? 28 : 34,
                    height: settings.density === "Compact" ? 28 : 34,
                    borderRadius: 12,
                    border: active ? `1.5px solid ${accent}` : `1px solid ${border}`,
                    background: soft,
                    overflow: "hidden",
                    padding: 0,
                    cursor: "pointer",
                    boxShadow: active ? `0 8px 20px ${alpha(accent, "22")}` : "none",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: image.fit ?? "cover",
                      display: "block",
                    }}
                  />
                </button>
              );
            })}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexDirection: "column" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {eyebrowAttributes.length ? (
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 800, color: accent }}>
                {eyebrowAttributes.map((attribute) => attribute.renderComponent(attributeContext)).join(" · ")}
              </div>
            ) : null}
            <h3
              style={{
                margin: eyebrowAttributes.length ? "6px 0 0" : 0,
                fontSize: titleSize * fontScale,
                lineHeight: 1.18,
                letterSpacing: settings.showcaseStyle === "Bold" ? "-0.03em" : "-0.02em",
                color: fg,
                fontFamily: STOREFRONT_FONT_STACK,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: titleClamp,
                WebkitBoxOrient: "vertical",
              }}
              >
                {renderTitle}
              </h3>
            {showSubtitle ? (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 13 * fontScale,
                  lineHeight: 1.5,
                  color: muted,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: subtitleClamp,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {product.subtitle}
              </p>
            ) : null}
          </div>
          {trustChips.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {trustChips.map(({ icon: Icon, label, iconColor, strong }) => (
                <span
                  key={label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 999,
                    padding: "6px 10px",
                    background: soft,
                    color: strong ? fg : muted,
                    fontSize: 11,
                    fontWeight: strong ? 800 : 700,
                    lineHeight: 1,
                  }}
                >
                  <Icon size={12} color={iconColor} fill={Icon === Star ? iconColor : "none"} />
                  <span>{label}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            padding: compactSurface ? "10px 12px" : "12px 14px",
            borderRadius: Math.max(14, radius - 10),
            background: isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB",
            border: `1px solid ${border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: isExpress ? "flex-start" : "baseline", flexDirection: isExpress && compactSurface ? "column" : "row", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: priceSize * fontScale, fontWeight: 900, color: fg, letterSpacing: "-0.05em" }}>
            {priceAttributes.find((attribute) => attribute.id === "price")?.renderComponent(attributeContext) ?? formatCurrency(resolvedPrice, settings.currency)}
          </span>
          {showPriceCompare ? (
            <span style={{ fontSize: 14, color: muted, textDecoration: "line-through", fontWeight: 700 }}>
              {priceAttributes.find((attribute) => attribute.id === "compareAtPrice")?.renderComponent(attributeContext) ?? formatCurrency(resolvedCompareAtPrice, settings.currency)}
            </span>
          ) : null}
          {showPriceSavings ? (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", background: "#DC2626", padding: "4px 8px", borderRadius: 999 }}>
              Save {formatCurrency(Math.max(0, resolvedCompareAtPrice - resolvedPrice), settings.currency)}
            </span>
          ) : null}
          </div>
          {showPriceCompare ? (
            <div style={{ fontSize: 11, color: muted, fontWeight: 700 }}>
              {Math.round(((resolvedCompareAtPrice - resolvedPrice) / resolvedCompareAtPrice) * 100)}% off original price
            </div>
          ) : null}
        </div>

        {settings.variantDisplay === "Color Swatches" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {variantOptions.slice(0, settings.maxVisibleVariants).map((variant, index) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelectedVariant(variant.id);
                  setSelectedColor(index);
                }}
                title={variant.colorName ?? variant.label}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: variant.swatchColor ?? product.colors[index]?.hex ?? accent,
                  outline: variant.id === selectedVariant ? `2px solid ${accent}` : `1px solid ${border}`,
                  outlineOffset: 2,
                  transform: variant.id === selectedVariant ? "scale(1.08)" : "scale(1)",
                }}
              />
            ))}
            {variantOptions.length > settings.maxVisibleVariants && settings.variantOverflow === "Count" ? (
              <span style={{ fontSize: 12, color: muted, fontWeight: 700 }}>+{variantOptions.length - settings.maxVisibleVariants}</span>
            ) : null}
            {showSwatchLabel ? (
              <span style={{ fontSize: 12, color: muted, fontWeight: 700 }}>{selectedVariantData?.colorName ?? selectedVariantData?.label ?? product.colors[selectedColor].name}</span>
            ) : null}
          </div>
        ) : null}

        {showVariants && (!compactSurface || settings.showcaseStyle === "Bold") ? (
          settings.variantDisplay === "Dropdown" ? (
            <select
              value={selectedVariant}
              onChange={(event) => setSelectedVariant(event.target.value)}
              style={{ width: "100%", borderRadius: 12, border: `1px solid ${border}`, padding: "10px 12px", background: cardBg, color: fg, fontSize: 12, fontWeight: 700 }}
            >
              {variantOptions.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.label}
                </option>
              ))}
            </select>
          ) : settings.variantDisplay === "Variant Count" ? (
            <div style={{ fontSize: 12, color: muted, fontWeight: 700 }}>{variantOptions.length} variants available</div>
          ) : settings.variantDisplay === "Hidden" ? null : (
            <div style={{ display: "flex", gap: 6, flexWrap: settings.variantOverflow === "Wrap" ? "wrap" : "nowrap", overflowX: settings.variantOverflow === "Wrap" ? "visible" : "auto" }}>
              {variantOptions.slice(0, settings.maxVisibleVariants).map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariant(variant.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: settings.variantDisplay === "Chips" ? 12 : 999,
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: `1px solid ${selectedVariant === variant.id ? accent : border}`,
                    background: selectedVariant === variant.id ? alpha(accent, "1A") : soft,
                    color: selectedVariant === variant.id ? accent : muted,
                    flexShrink: 0,
                  }}
                >
                  {settings.variantDisplay === "Image Swatches" && variant.swatchColor ? (
                    <span style={{ width: 12, height: 12, borderRadius: 999, background: variant.swatchColor, border: `1px solid ${border}` }} />
                  ) : null}
                  <span>{variant.label}</span>
                </button>
              ))}
              {variantOptions.length > settings.maxVisibleVariants && settings.variantOverflow === "Count" ? (
                <span style={{ alignSelf: "center", fontSize: 11, fontWeight: 800, color: muted }}>+{variantOptions.length - settings.maxVisibleVariants}</span>
              ) : null}
            </div>
          )
        ) : null}

        {coreDetailAttributes.length || metafieldAttributes.length ? (
          <div style={{ display: "grid", gap: 8 }}>
            {coreDetailAttributes.slice(0, settings.density === "Detailed" ? 4 : 2).map((attribute) => (
              <div key={attribute.id} style={{ display: "flex", alignItems: "center", gap: 8, color: muted, fontSize: 11, fontWeight: 700 }}>
                {React.createElement(attribute.icon, { size: 12, color: accent })}
                <span>{attribute.renderComponent(attributeContext)}</span>
              </div>
            ))}
            {metafieldAttributes.length ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {metafieldAttributes.map((attribute) => (
                  <span key={attribute.id}>{attribute.renderComponent(attributeContext)}</span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {showStockMeter ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    width: 18,
                    height: 4,
                    borderRadius: 999,
                    background: index < Math.max(1, Math.round(resolvedInventory / 5)) ? accent : faint,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 11, color: muted, fontWeight: 700 }}>Only {resolvedInventory} left</span>
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns:
              settings.showcaseStyle === "Express" || settings.showcaseStyle === "Essential"
                ? "minmax(0,1fr)"
                : "minmax(0,1fr)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (settings.ctaText === "Quick View") {
                onQuickView?.(product);
              }
            }}
            style={{
              ...ctaStyle,
              width: "100%",
              borderRadius: radius - 8,
              minHeight: compactSurface ? 44 : 48,
              padding: compactSurface ? "10px 14px" : "13px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 800,
              transform: cardHovered && motionDuration > 0 ? "translateY(-1px)" : "translateY(0)",
              boxShadow:
                settings.ctaStyle === "Filled"
                  ? cardHovered && motionDuration > 0
                    ? `0 12px 26px ${alpha(accent, "28")}`
                    : `0 8px 18px ${alpha(accent, "20")}`
                  : ctaStyle.boxShadow,
              transition: motionDuration === 0 ? "none" : `transform ${effectiveMotionDuration}ms ease, box-shadow ${effectiveMotionDuration}ms ease`,
            }}
          >
            <ShoppingBag size={14} />
            <span>{settings.ctaText}</span>
          </button>
          {settings.secondaryCtaEnabled ? (
            <button
              type="button"
              onClick={() => {
                if (settings.secondaryCtaText === "Quick View") {
                  onQuickView?.(product);
                }
              }}
              style={secondaryCtaStyle}
            >
              <Eye size={14} />
              <span>{settings.secondaryCtaText}</span>
            </button>
          ) : showQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView?.(product)}
              style={{
                ...secondaryCtaStyle,
                border: `1px solid ${border}`,
                color: muted,
                fontWeight: 700,
              }}
            >
              Quick View
            </button>
          ) : null}
        </div>

        {showTrustRow ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, borderTop: `1px solid ${border}`, paddingTop: 12, flexWrap: "wrap" }}>
            {[
              { icon: Truck, label: "Fast shipping" },
              { icon: RotateCcw, label: "Easy returns" },
              { icon: Lock, label: "Secure checkout" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, color: muted, fontSize: 10, fontWeight: 700 }}>
                <Icon size={11} color={accent} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  if (settings.showcaseStyle === "Express") {
    return (
      <article
        ref={cardRef}
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
        style={{
          width: "100%",
          maxWidth,
          minWidth: 0,
          height: surface === "grid" ? "100%" : "auto",
          display: "grid",
          gridTemplateColumns: expressHorizontal ? "minmax(190px, 40%) minmax(0,1fr)" : "1fr",
          background: cardBg,
          color: fg,
          border: `1px solid ${border}`,
          borderRadius: radius,
          overflow: "hidden",
          boxShadow: cardHovered && motionDuration > 0 ? hoverShadow : shadow,
          transform: cardHovered && motionDuration > 0 ? "translateY(-3px)" : "translateY(0)",
          transition: motionDuration === 0 ? "none" : `transform ${motionDuration}ms ease, box-shadow ${motionDuration}ms ease`,
        }}
      >
        {cardContent}
      </article>
    );
  }

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
      style={{
        width: "100%",
        maxWidth,
        minWidth: 0,
        height: surface === "grid" ? "100%" : "auto",
        display: "flex",
        flexDirection: "column",
        background: cardBg,
        color: fg,
        border: `1px solid ${border}`,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: cardHovered && motionDuration > 0 ? hoverShadow : shadow,
        transform: cardHovered && motionDuration > 0 ? "translateY(-3px)" : "translateY(0)",
        transition: motionDuration === 0 ? "none" : `transform ${motionDuration}ms ease, box-shadow ${motionDuration}ms ease`,
      }}
    >
      {cardContent}
    </article>
  );
}

function StressTile({
  label,
  width,
  settings,
  device,
  product,
}: {
  label: string;
  width: number;
  settings: Settings;
  device: Device;
  product: Product;
}) {
  const report = useMemo(() => evaluateDesignQA({ width, settings, device, product }), [width, settings, device, product]);
  const statusTone =
    report.status === "pass"
      ? { bg: "#E8F5E9", fg: "#166534", border: "#BBF7D0", label: "Pass" }
      : report.status === "warn"
        ? { bg: "#FEF3C7", fg: "#92400E", border: "#FDE68A", label: "Review" }
        : { bg: "#FEE2E2", fg: "#B91C1C", border: "#FECACA", label: "Risk" };

  return (
    <div
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "inherit" }}>{width}px</div>
          <div style={{ fontSize: 11, color: "rgba(24,22,26,0.58)" }}>{label}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span
            style={{
              borderRadius: 999,
              padding: "5px 9px",
              fontSize: 10,
              fontWeight: 800,
              background: statusTone.bg,
              color: statusTone.fg,
              border: `1px solid ${statusTone.border}`,
            }}
          >
            {statusTone.label}
          </span>
          <span style={{ borderRadius: 999, padding: "5px 9px", fontSize: 10, fontWeight: 800, background: "rgba(24,22,26,0.06)", color: "rgba(24,22,26,0.7)" }}>
            {report.score}/100
          </span>
        </div>
      </div>
      <div
        style={{
          width,
          minWidth: width,
          maxWidth: width,
          minHeight: 760,
          borderRadius: 20,
          border: "1px dashed rgba(24,22,26,0.14)",
          padding: 10,
          overflow: "hidden",
          background: "rgba(255,255,255,0.72)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ProductCard product={product} settings={settings} device={device} surface="grid" />
          <div style={{ borderRadius: 16, border: "1px solid rgba(24,22,26,0.08)", background: "#FFFFFF", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(24,22,26,0.48)" }}>
                  Design QA
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginTop: 4 }}>Device baseline: {device}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(24,22,26,0.58)" }}>
                {report.checks.filter((check) => check.status === "pass").length} / {report.checks.length} pass
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {report.checks.map((check) => {
                const tone =
                  check.status === "pass"
                    ? { bg: "#F0FDF4", fg: "#166534", border: "#DCFCE7", icon: CheckCircle2 }
                    : check.status === "warn"
                      ? { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A", icon: AlertTriangle }
                      : { bg: "#FEF2F2", fg: "#B91C1C", border: "#FECACA", icon: AlertTriangle };
                const Icon = tone.icon;
                return (
                  <div
                    key={check.id}
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${tone.border}`,
                      background: tone.bg,
                      padding: "10px 11px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon size={14} color={tone.fg} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: tone.fg }}>{check.label}</span>
                    </div>
                    <p style={{ margin: "7px 0 0", fontSize: 11, lineHeight: 1.55, color: "#374151" }}>{check.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StressPreview({
  settings,
  device,
  onQuickView,
}: {
  settings: Settings;
  device: Device;
  onQuickView?: (product: Product) => void;
}) {
  const [sweep, setSweep] = useState<StressSweep>("styles");
  const canvasBg = settings.theme === "Dark" ? "#111214" : "#F3F4F6";
  const panelBg = settings.theme === "Dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.72)";
  const text = settings.theme === "Dark" ? "#F7F2EC" : "#18161A";
  const muted = settings.theme === "Dark" ? "rgba(247,242,236,0.62)" : "rgba(24,22,26,0.58)";

  const scenarios = useMemo(() => {
    const base: Array<{ label: string; settings: Settings; product: Product }> = [];

    if (sweep === "styles") {
      (["Essential", "Premium", "Express"] as ShowcaseStyle[]).forEach((style, index) => {
        base.push({
          label: `${style} style`,
          settings: { ...settings, showcaseStyle: style },
          product: getRuntimeProducts()[index % getRuntimeProducts().length],
        });
      });
    }

    if (sweep === "media") {
      (["Static", "Zoom on Hover", "Hover Swap"] as ImageBehaviour[]).forEach((imageBehaviour, index) => {
        base.push({
          label: `${imageBehaviour} media`,
          settings: { ...settings, imageBehaviour, showcaseStyle: index === 2 ? "Express" : "Premium" },
          product: getRuntimeProducts()[index % getRuntimeProducts().length],
        });
      });
    }

    if (sweep === "density") {
      (["Compact", "Balanced", "Detailed"] as Density[]).forEach((density, index) => {
        base.push({
          label: `${density} density`,
          settings: { ...settings, density, showcaseStyle: index === 0 ? "Express" : "Premium" },
          product: getRuntimeProducts()[(index + 1) % getRuntimeProducts().length],
        });
      });
    }

    if (sweep === "cta") {
      (["Filled", "Outlined", "Floating"] as CTAStyle[]).forEach((ctaStyle, index) => {
        base.push({
          label: `${ctaStyle} CTA`,
          settings: { ...settings, ctaStyle, showcaseStyle: index === 1 ? "Essential" : "Premium" },
          product: getRuntimeProducts()[(index + 2) % getRuntimeProducts().length],
        });
      });
    }

    return base;
  }, [settings, sweep]);

  const qaSummary = useMemo(() => {
    const reports = scenarios.flatMap((scenario) =>
      STRESS_WIDTHS.map((width) => evaluateDesignQA({ width, settings: scenario.settings, device, product: scenario.product })),
    );
    const allChecks = reports.flatMap((report) => report.checks);
    return {
      pass: allChecks.filter((check) => check.status === "pass").length,
      warn: allChecks.filter((check) => check.status === "warn").length,
      fail: allChecks.filter((check) => check.status === "fail").length,
      averageScore: reports.length ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0,
    };
  }, [device, scenarios]);

  return (
    <div style={{ background: canvasBg, borderRadius: 24, padding: 24, minHeight: 520 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>Stress Test</div>
          <h2 style={{ margin: "8px 0 0", color: text, fontSize: 28, letterSpacing: "-0.03em", fontFamily: STOREFRONT_FONT_STACK, fontWeight: 700 }}>
            Design QA across widths
          </h2>
          <p style={{ margin: "10px 0 0", maxWidth: 780, color: muted, fontSize: 14, lineHeight: 1.65 }}>
            Audit the card like a component health check. Every warning explains why a layout choice can reduce comprehension, trust, or add-to-cart confidence.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STRESS_SWEEPS.map((option) => {
            const active = sweep === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSweep(option.id)}
                style={{
                  border: "none",
                  borderRadius: 14,
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: active ? "#18161A" : panelBg,
                  color: active ? "#F7F2EC" : text,
                  textAlign: "left",
                  minWidth: 124,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800 }}>{option.label}</div>
                <div style={{ fontSize: 10, opacity: 0.72, marginTop: 4 }}>{option.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Average QA Score", value: `${qaSummary.averageScore}/100`, tone: panelBg, color: text },
          { label: "Passing Checks", value: `${qaSummary.pass}`, tone: "#E8F5E9", color: "#166534" },
          { label: "Needs Review", value: `${qaSummary.warn}`, tone: "#FEF3C7", color: "#92400E" },
          { label: "Critical Risks", value: `${qaSummary.fail}`, tone: "#FEE2E2", color: "#B91C1C" },
        ].map((item) => (
          <div key={item.label} style={{ borderRadius: 18, background: item.tone, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: item.color, opacity: 0.7 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: item.color, marginTop: 8 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {STRESS_WIDTHS.map((width) => (
          <span key={width} style={{ padding: "8px 12px", borderRadius: 999, background: panelBg, color: text, fontSize: 12, fontWeight: 700 }}>
            {width}px bucket
          </span>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {scenarios.map((scenario) => (
          <section key={scenario.label}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: text }}>{scenario.label}</div>
                <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>
                  {scenario.settings.showcaseStyle} · {scenario.settings.imageBehaviour} · {scenario.settings.density} · {scenario.settings.ctaStyle}
                </div>
              </div>
              <span style={{ borderRadius: 999, padding: "6px 10px", background: panelBg, color: text, fontSize: 11, fontWeight: 700 }}>
                {device}
              </span>
            </div>
            <div
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                paddingBottom: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  minWidth: "max-content",
                }}
              >
                {STRESS_WIDTHS.map((width) => (
                  <StressTile
                    key={`${scenario.label}-${width}`}
                    label={scenario.label}
                    width={width}
                    settings={scenario.settings}
                    device={device}
                    product={scenario.product}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function badgeStyle(background: string, color: string): CSSProperties {
  return {
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    background,
    color,
    backdropFilter: "blur(12px)",
  };
}

function SurfacePreview({
  settings,
  device,
  surface,
  onQuickView,
  products,
}: {
  settings: Settings;
  device: Device;
  surface: SurfaceMode;
  onQuickView?: (product: Product) => void;
  products?: ProductDomainModel[];
}) {
  if (surface !== "stress" && surface !== "search" && products && products.length) {
    return <StorefrontSurfacePreview settings={settings} surface={surface} products={products} />;
  }

  const isDark = settings.theme === "Dark";
  const canvasBg = isDark ? "#111214" : "#F3F4F6";
  const panelBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)";
  const text = isDark ? "#F7F2EC" : "#18161A";
  const muted = isDark ? "rgba(247,242,236,0.62)" : "rgba(24,22,26,0.58)";
  const searchPreviewProducts = products?.length ? products.map(normalizeProductForStudio) : getRuntimeProducts();

  if (surface === "stress") {
    return <StressPreview settings={settings} device={device} onQuickView={onQuickView} />;
  }

  if (surface === "search") {
    return (
      <div style={{ background: canvasBg, borderRadius: 24, padding: device === "mobile" ? 16 : 24, minHeight: 520 }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <div
              style={{
                width: "100%",
                maxWidth: 620,
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 999,
                padding: device === "mobile" ? "12px 14px" : "14px 18px",
                background: panelBg,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                boxShadow: isDark ? "none" : "0 10px 30px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ color: muted, fontSize: 16 }}>⌕</div>
              <div style={{ color: muted, fontSize: 14, fontWeight: 600 }}>Search for "running shoes"</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {searchPreviewProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} settings={settings} device={device} surface="search" onQuickView={onQuickView} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (surface === "collection") {
    return (
      <div style={{ background: canvasBg, borderRadius: 24, padding: 24, minHeight: 520 }}>
        <div style={{ display: "grid", gridTemplateColumns: device === "mobile" ? "1fr" : "minmax(0,1fr) auto", gap: 24, alignItems: "end", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>Collection Page</div>
            <h2 style={{ margin: "8px 0 0", color: text, fontSize: device === "mobile" ? 30 : 38, letterSpacing: "-0.04em", fontFamily: STOREFRONT_FONT_STACK, fontWeight: 700 }}>
              Seasonal collection with editorial merchandising
            </h2>
            <p style={{ margin: "10px 0 0", maxWidth: 620, color: muted, fontSize: 14, lineHeight: 1.65 }}>
              Preview how the card sits beneath category copy, collection banners, and sorting controls.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Featured", "Best sellers", "New arrivals"].map((chip) => (
              <span key={chip} style={{ padding: "8px 12px", borderRadius: 999, background: panelBg, color: text, fontSize: 12, fontWeight: 700 }}>
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div style={{ borderRadius: 20, background: panelBg, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ color: muted, fontSize: 13 }}>Showing 24 curated products</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Filter", "Sort", "View"].map((item) => (
                <span key={item} style={{ padding: "8px 12px", borderRadius: 999, background: "#FFFFFF", color: text, fontSize: 12, fontWeight: 700 }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                device === "mobile"
                  ? "1fr"
                  : device === "tablet"
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(3, minmax(0, 1fr))",
              gap: 18,
              alignItems: "start",
            }}
          >
            {getRuntimeProducts().map((product) => (
              <ProductCard key={product.id} product={product} settings={settings} device={device} surface="grid" onQuickView={onQuickView} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (surface === "recommendation") {
    return (
      <div style={{ background: canvasBg, borderRadius: 24, padding: 24, minHeight: 520 }}>
        <div style={{ display: "grid", gridTemplateColumns: device === "mobile" ? "1fr" : "minmax(0,1fr) auto", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>Product Recommendation</div>
            <h2 style={{ margin: "8px 0 0", color: text, fontSize: device === "mobile" ? 30 : 40, letterSpacing: "-0.04em", fontFamily: STOREFRONT_FONT_STACK, fontWeight: 700 }}>
              Related products beneath the main buying moment
            </h2>
            <p style={{ margin: "10px 0 0", maxWidth: 620, color: muted, fontSize: 14, lineHeight: 1.65 }}>
              Review the card where it supports cross-sell and upsell without overpowering the primary product.
            </p>
          </div>
          <div style={{ padding: "8px 12px", borderRadius: 999, background: panelBg, color: muted, fontSize: 12, fontWeight: 700 }}>
            Shoppers also bought
          </div>
        </div>
        <div style={{ marginTop: 24, borderRadius: 20, background: panelBg, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: text }}>Recommended for this shopper</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={navStyle("#FFFFFF", text)}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" style={navStyle("#FFFFFF", text)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: device === "mobile" ? "88%" : settings.cardWidth === "Compact" ? "270px" : settings.cardWidth === "Spacious" ? "350px" : "310px",
              gap: 18,
              overflowX: "auto",
              paddingBottom: 8,
              alignItems: "start",
            }}
          >
            {getRuntimeProducts().slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} settings={settings} device={device} surface="carousel" onQuickView={onQuickView} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (surface === "grid") {
    return (
      <div style={{ background: canvasBg, borderRadius: 24, padding: 24, minHeight: 520 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>Collection Grid</div>
            <h2 style={{ margin: "8px 0 0", color: text, fontSize: 28, letterSpacing: "-0.03em", fontFamily: STOREFRONT_FONT_STACK, fontWeight: 700 }}>
              Multi-card browsing view
            </h2>
          </div>
          <div style={{ padding: "8px 12px", borderRadius: 999, background: panelBg, color: muted, fontSize: 12, fontWeight: 700 }}>18 products</div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              device === "mobile"
                ? "1fr"
                : device === "tablet"
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
            alignItems: "start",
          }}
        >
          {getRuntimeProducts().map((product) => (
            <ProductCard key={product.id} product={product} settings={settings} device={device} surface="grid" onQuickView={onQuickView} />
          ))}
        </div>
      </div>
    );
  }

  if (surface === "carousel") {
    return (
      <div style={{ background: canvasBg, borderRadius: 24, padding: 24, minHeight: 520 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>Homepage Carousel</div>
            <h2 style={{ margin: "8px 0 0", color: text, fontSize: 28, letterSpacing: "-0.03em", fontFamily: STOREFRONT_FONT_STACK, fontWeight: 700 }}>
              Horizontal merchandising rail
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={navStyle(panelBg, text)}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" style={navStyle(panelBg, text)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: device === "mobile" ? "92%" : settings.cardWidth === "Compact" ? "280px" : settings.cardWidth === "Spacious" ? "360px" : "320px",
            gap: 18,
            overflowX: "auto",
            paddingBottom: 8,
            alignItems: "start",
          }}
        >
          {getRuntimeProducts().map((product) => (
            <ProductCard key={product.id} product={product} settings={settings} device={device} surface="carousel" onQuickView={onQuickView} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: canvasBg, borderRadius: 24, padding: 24, minHeight: 520 }}>
      <div style={{ display: "grid", gridTemplateColumns: device === "mobile" ? "1fr" : "minmax(0,1fr) auto", gap: 24, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>Quick Shop Spotlight</div>
          <h2 style={{ margin: "8px 0 0", color: text, fontSize: device === "mobile" ? 30 : 44, lineHeight: 1.04, letterSpacing: "-0.04em", fontFamily: STOREFRONT_FONT_STACK, fontWeight: 700 }}>
            One card, tuned for quick product decisions.
          </h2>
          <p style={{ margin: "16px 0 0", maxWidth: 560, color: muted, lineHeight: 1.7 }}>
            A focused product moment that keeps the card expressive while staying compact enough for featured placements.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            {["Featured product", "Quick actions", "Responsive layout"].map((label) => (
              <span key={label} style={{ padding: "8px 12px", borderRadius: 999, background: panelBg, color: text, fontSize: 12, fontWeight: 700 }}>
                {label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ justifySelf: "center" }}>
          <ProductCard product={getRuntimeProducts()[0]} settings={settings} device={device} surface="spotlight" onQuickView={onQuickView} />
        </div>
      </div>
    </div>
  );
}

function navStyle(background: string, color: string): CSSProperties {
  return {
    width: 38,
    height: 38,
    border: "none",
    borderRadius: 999,
    background,
    color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

function previewLayoutForSurface(surface: SurfaceMode): ShowcaseConfiguration["source"]["layout"] {
  if (surface === "carousel" || surface === "recommendation") {
    return "carousel";
  }
  if (surface === "spotlight") {
    return "spotlight";
  }
  return "grid";
}

function previewHeadingForSurface(surface: SurfaceMode) {
  switch (surface) {
    case "search":
      return "Query-driven shopping view";
    case "collection":
      return "Seasonal collection with editorial merchandising";
    case "recommendation":
      return "Recommended for this shopper";
    case "carousel":
      return "Horizontal merchandising rail";
    case "spotlight":
      return "One card, tuned for quick product decisions.";
    default:
      return "Multi-card browsing view";
  }
}

function previewSubheadingForSurface(surface: SurfaceMode) {
  switch (surface) {
    case "search":
      return "Preview the storefront renderer inside a search-results context.";
    case "collection":
      return "Review the exact storefront renderer beneath collection storytelling and controls.";
    case "recommendation":
      return "Inspect the same storefront card contract used for recommendation rails.";
    case "carousel":
      return "This preview is now driven by the same card model as the live theme extension.";
    case "spotlight":
      return "A focused product moment rendered with the shared storefront card contract.";
    default:
      return "The preview now uses the storefront card contract instead of a separate studio-only renderer.";
  }
}

function StorefrontPreviewCard({ card }: { card: ShowcaseCardViewModel }) {
  const stockMeter = card.stockMeter;

  return (
    <article className="vypari-showcase__card">
      <a href={`/products/${card.productHandle}`} className="vypari-showcase__media-link">
        <div className="vypari-showcase__media">
          {card.featuredImageUrl ? (
            <img
              className="vypari-showcase__image vypari-showcase__image--primary"
              loading="lazy"
              src={card.featuredImageUrl}
              alt={card.imageAlt || card.title}
            />
          ) : (
            <div className="vypari-showcase__image vypari-showcase__image--placeholder" />
          )}
          {card.secondaryImageUrl ? (
            <img
              className="vypari-showcase__image vypari-showcase__image--secondary"
              loading="lazy"
              src={card.secondaryImageUrl}
              alt={card.imageAlt || card.title}
            />
          ) : null}
          {card.badges.length ? (
            <div className="vypari-showcase__badges">
              {card.badges.map((badge) => (
                <span key={`${badge.tone}-${badge.label}`} className={`vypari-showcase__badge vypari-showcase__badge--${badge.tone}`}>
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </a>
      <div className="vypari-showcase__content">
        {card.eyebrow ? <div className="vypari-showcase__eyebrow">{card.eyebrow}</div> : null}
        <h3 className="vypari-showcase__title">
          <a href={`/products/${card.productHandle}`}>{card.title}</a>
        </h3>
        {card.subtitle ? <p className="vypari-showcase__subtitle">{card.subtitle}</p> : null}
        {card.trustChips.length ? (
          <div className="vypari-showcase__trust-row">
            {card.trustChips.map((chip) => (
              <span key={chip.label} className={`vypari-showcase__trust-chip${chip.strong ? " vypari-showcase__trust-chip--strong" : ""}`}>
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
        {card.price ? (
          <div className="vypari-showcase__price-panel">
            <div className="vypari-showcase__pricing">
              <span className="vypari-showcase__price">{card.price.current}</span>
              {card.price.compareAt ? <span className="vypari-showcase__compare">{card.price.compareAt}</span> : null}
              {card.price.savingsLabel ? <span className="vypari-showcase__saving-pill">{card.price.savingsLabel}</span> : null}
            </div>
            {card.price.note ? <div className="vypari-showcase__pricing-note">{card.price.note}</div> : null}
          </div>
        ) : null}
        {card.metaChips.length ? (
          <div className="vypari-showcase__meta-row">
            {card.metaChips.map((chip) => (
              <span key={chip} className="vypari-showcase__meta-chip">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        {card.variantOptions.length ? (
          <div className="vypari-showcase__variants" data-variant-style={String(card.variantDisplay || "Color Swatches").toLowerCase().replace(/[^a-z0-9]+/g, "_")}>
            {card.variantOptions.map((option) => (
              <span
                key={`${option.label}-${option.swatchColor ?? "none"}`}
                className="vypari-showcase__variant"
                style={option.swatchColor ? ({ ["--swatch" as string]: option.swatchColor } as CSSProperties) : undefined}
              >
                {option.label}
              </span>
            ))}
          </div>
        ) : null}
        {card.detailLines.length ? <div className="vypari-showcase__detail">{card.detailLines.join(" · ")}</div> : null}
        {card.attributes.length ? (
          <div className="vypari-showcase__attributes">
            {card.attributes.map((attribute) => (
              <div key={`${attribute.label}-${attribute.value}`} className="vypari-showcase__attribute">
                <span className="vypari-showcase__attribute-label">{attribute.label}</span>
                <span className="vypari-showcase__attribute-value">{attribute.value}</span>
              </div>
            ))}
          </div>
        ) : null}
        {stockMeter ? (
          <div className="vypari-showcase__stock-meter">
            <div className="vypari-showcase__stock-bars">
              {Array.from({ length: stockMeter.totalBars }).map((_, index) => (
                <span key={index} className={`vypari-showcase__stock-bar${index < stockMeter.activeBars ? " is-active" : ""}`} />
              ))}
            </div>
            <span className="vypari-showcase__stock-copy">{stockMeter.label}</span>
          </div>
        ) : null}
        <div className="vypari-showcase__footer">
          <div className="vypari-showcase__cta-group">
            <a className="vypari-showcase__cta" href={`/products/${card.productHandle}`}>
              {card.ctaLabel}
            </a>
            {card.secondaryCtaLabel ? (
              <a className="vypari-showcase__cta vypari-showcase__cta--secondary" href={`/products/${card.productHandle}`}>
                {card.secondaryCtaLabel}
              </a>
            ) : null}
          </div>
        </div>
        {card.assurance.length ? (
          <div className="vypari-showcase__assurance">
            {card.assurance.map((item) => (
              <span key={item} className="vypari-showcase__assurance-item">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function StorefrontSurfacePreview({
  settings,
  surface,
  products,
}: {
  settings: Settings;
  surface: Exclude<SurfaceMode, "stress">;
  products: ProductDomainModel[];
}) {
  const configuration = useMemo(() => {
    const next = configurationFromStudioSettings(settings);
    return {
      ...next,
      source: {
        ...next.source,
        layout: previewLayoutForSurface(surface),
        heading: previewHeadingForSurface(surface),
        subheading: previewSubheadingForSurface(surface),
      },
    } satisfies ShowcaseConfiguration;
  }, [settings, surface]);

  const cardModels = useMemo(
    () => buildShowcaseCardViewModels(products, configuration.source, configuration).slice(0, surface === "spotlight" ? 1 : 4),
    [products, configuration, surface],
  );

  return (
    <div style={{ background: settings.theme === "Dark" ? "#111214" : "#F3F4F6", borderRadius: 24, padding: 24, minHeight: 520 }}>
      <section
        className={`vypari-showcase vypari-showcase--${configuration.source.layout}`}
        style={
          {
            ["--vypari-accent" as string]: settings.accentColor,
          } as CSSProperties
        }
        data-theme-mode={settings.theme === "Dark" || settings.showcaseStyle === "Bold" ? "dark" : "light"}
        data-cta-style={settings.ctaStyle.toLowerCase()}
        data-cta-full-width="false"
        data-image-behavior={settings.imageBehaviour === "Hover Swap" ? "swap_on_hover" : settings.imageBehaviour === "Tilt & Lift" ? "card_lift" : settings.imageBehaviour === "Static" ? "static" : "zoom_on_hover"}
        data-density={settings.density.toLowerCase()}
        data-card-width={settings.cardWidth.toLowerCase()}
        data-font-size={settings.fontSize.toLowerCase()}
        data-high-contrast={settings.highContrast ? "true" : "false"}
        data-reduced-motion={settings.reducedMotion ? "true" : "false"}
        data-showcase-style={settings.showcaseStyle.toLowerCase()}
      >
        <div className="vypari-showcase__shell">
          <div className="vypari-showcase__header">
            <div>
              <h2 className="vypari-showcase__heading">{configuration.source.heading}</h2>
              <p className="vypari-showcase__subheading">{configuration.source.subheading}</p>
            </div>
            {configuration.source.layout === "carousel" ? (
              <div className="vypari-showcase__controls" aria-label="Product showcase navigation">
                <button type="button" className="vypari-showcase__control" aria-label="Scroll previous products">
                  <span aria-hidden="true">‹</span>
                </button>
                <button type="button" className="vypari-showcase__control" aria-label="Scroll next products">
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            ) : null}
          </div>
          <div className="vypari-showcase__track">
            {cardModels.map((card) => (
              <StorefrontPreviewCard key={card.productHandle} card={card} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StudioSurfaceSelector({
  surface,
  setSurface,
}: {
  surface: SurfaceMode;
  setSurface: (surface: SurfaceMode) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
        gap: 8,
      }}
    >
      {PREVIEW_SURFACE_OPTIONS.map((option) => {
        const active = surface === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setSurface(option.id)}
            style={{
              padding: "11px 12px",
              borderRadius: 12,
              border: active ? "1px solid #202223" : "1px solid #E3E3E8",
              background: active ? "#202223" : "#FFFFFF",
              color: active ? "#FFFFFF" : "#202223",
              fontSize: 12,
              fontWeight: 700,
              textAlign: "left",
              cursor: "pointer",
              boxShadow: active ? "0 1px 2px rgba(15,23,42,0.08)" : "none",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function StudioDeviceSelector({
  device,
  setDevice,
}: {
  device: Device;
  setDevice: (device: Device) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {DEVICE_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = device === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setDevice(value)}
            style={{
              border: active ? "1px solid #202223" : "1px solid #E3E3E8",
              borderRadius: 999,
              padding: "9px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              background: active ? "#202223" : "#FFFFFF",
              color: active ? "#FFFFFF" : "#6D7175",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function QuickViewModal({
  product,
  settings,
  device,
  onClose,
}: {
  product: Product | null;
  settings: Settings;
  device: Device;
  onClose: () => void;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(getVariantOptions(product ?? getRuntimeProducts()[0])[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useEffect(() => {
    if (!product) return;
    setSelectedImage(0);
    setSelectedVariant(getVariantOptions(product)[0]?.id ?? "");
    setQuantity(1);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [product, onClose]);

  if (!product) return null;

  const variantOptions = getVariantOptions(product);
  const fallbackVariant = variantOptions[0] ?? {
    id: `${product.id}-default`,
    label: product.variants[0] ?? "Default",
    sku: `${product.shortName}-DEFAULT`,
    price: product.price,
    compareAtPrice: product.originalPrice,
    inventory: product.stock,
  };
  const selectedVariantData = variantOptions.find((variant) => variant.id === selectedVariant) ?? fallbackVariant;
  const price = selectedVariantData?.price ?? product.price;
  const compareAtPrice = selectedVariantData?.compareAtPrice ?? product.originalPrice;
  const inventory = selectedVariantData?.inventory ?? product.stock;
  const activeImage = product.images[selectedVariantData?.imageIndex ?? selectedImage] ?? product.images[0];
  const isMobile = device === "mobile";
  const isDark = settings.theme === "Dark" || settings.showcaseStyle === "Bold";
  const panelBg = isDark ? "#111214" : "#FFFFFF";
  const text = isDark ? "#F5F7FA" : "#111827";
  const muted = isDark ? "rgba(245,247,250,0.72)" : "#6D7175";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const surface = isDark ? "#191D23" : "#F6F6F7";
  const subSurface = isDark ? "#13161B" : "#FFFFFF";
  const savingAmount = Math.max(0, compareAtPrice - price);
  const savingsVisible = savingAmount > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view for ${product.name}`}
      onClick={onClose}
      onTouchStart={(event) => setTouchStartY(event.touches[0]?.clientY ?? null)}
      onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientY ?? null;
        if (touchStartY !== null && end !== null && end - touchStartY > 120) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(17,24,39,0.52)",
        display: "flex",
        alignItems: device === "mobile" ? "end" : "center",
        justifyContent: "center",
        padding: device === "mobile" ? 0 : 24,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 1120,
          maxHeight: isMobile ? "92vh" : "88vh",
          overflow: "auto",
          borderRadius: isMobile ? "24px 24px 0 0" : 24,
          background: panelBg,
          color: text,
          border: `1px solid ${border}`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          padding: isMobile ? 18 : 28,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
            paddingBottom: 18,
            borderBottom: `1px solid ${border}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: muted }}>Quick View</div>
            <div
              style={{
                marginTop: 6,
                fontSize: isMobile ? 18 : 20,
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                fontFamily: STOREFRONT_FONT_STACK,
              }}
            >
              {product.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: `1px solid ${border}`,
              background: surface,
              color: text,
              cursor: "pointer",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isDark ? "none" : "0 1px 2px rgba(17,24,39,0.06)",
            }}
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.02fr) minmax(360px, 0.98fr)",
            gap: isMobile ? 18 : 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 12,
              padding: isMobile ? 12 : 16,
              borderRadius: 20,
              border: `1px solid ${border}`,
              background: surface,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                background: isDark ? "#14181D" : "#FFFFFF",
                overflow: "hidden",
                aspectRatio: "1 / 1",
                border: `1px solid ${border}`,
              }}
            >
              <img src={activeImage.src} alt={activeImage.alt} style={{ width: "100%", height: "100%", objectFit: activeImage.fit ?? "cover" }} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(Math.max(product.images.length, 1), isMobile ? 3 : 4)}, minmax(0, 1fr))`,
                gap: 8,
              }}
            >
              {product.images.map((image, index) => (
                <button
                  key={`${image.src}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1}`}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    border: index === selectedImage ? `2px solid ${settings.accentColor}` : `1px solid ${border}`,
                    padding: 0,
                    background: isDark ? "#14181D" : "#FFFFFF",
                    cursor: "pointer",
                    boxShadow: index === selectedImage ? "0 0 0 1px rgba(0,0,0,0.02)" : "none",
                  }}
                >
                  <img src={image.src} alt={image.alt} style={{ width: "100%", height: isMobile ? 68 : 76, objectFit: image.fit ?? "cover" }} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <div
              style={{
                display: "grid",
                gap: 14,
                padding: isMobile ? 16 : 18,
                borderRadius: 20,
                border: `1px solid ${border}`,
                background: subSurface,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: settings.accentColor }}>{product.brand}</span>
                  <span style={{ padding: "6px 10px", borderRadius: 999, background: surface, fontSize: 11, fontWeight: 700, color: muted }}>{product.vendor ?? product.brand}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: muted, fontSize: 13, fontWeight: 700 }}>
                  <Star size={14} color="#E9A62E" fill="#E9A62E" />
                  <span>{product.rating}</span>
                  <span>({product.reviews})</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: isMobile ? 34 : 40, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.05em" }}>{formatCurrency(price, settings.currency)}</span>
                {savingsVisible ? (
                  <span style={{ fontSize: 18, textDecoration: "line-through", color: muted, fontWeight: 700 }}>{formatCurrency(compareAtPrice, settings.currency)}</span>
                ) : null}
                {savingsVisible ? (
                  <span
                    style={{
                      padding: "7px 12px",
                      borderRadius: 999,
                      background: "#DC2626",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Save {formatCurrency(savingAmount, settings.currency)}
                  </span>
                ) : null}
              </div>

              <p style={{ margin: 0, color: muted, fontSize: 14, lineHeight: 1.65 }}>{resolveProductDescription(product)}</p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                padding: isMobile ? 16 : 18,
                borderRadius: 20,
                border: `1px solid ${border}`,
                background: subSurface,
              }}
            >
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: muted }}>Variant</div>
                <RadioPills options={variantOptions.map((variant) => variant.id) as string[]} value={selectedVariant} onChange={(value) => setSelectedVariant(value)} />
                <div style={{ fontSize: 13, color: text, fontWeight: 700 }}>{selectedVariantData?.label}</div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "auto minmax(0, 1fr)",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, borderRadius: 999, border: `1px solid ${border}`, padding: "10px 12px", width: "fit-content", background: surface }}>
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} style={{ border: "none", background: "transparent", color: text, cursor: "pointer" }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ minWidth: 20, textAlign: "center", fontSize: 13, fontWeight: 800 }}>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} style={{ border: "none", background: "transparent", color: text, cursor: "pointer" }}>
                    <Plus size={14} />
                  </button>
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 13, color: text, fontWeight: 700 }}>Inventory: {inventory} available</div>
                  <div style={{ fontSize: 12, color: muted, fontWeight: 700 }}>{product.delivery}</div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                padding: isMobile ? 16 : 18,
                borderRadius: 20,
                border: `1px solid ${border}`,
                background: subSurface,
              }}
            >
              <button type="button" style={{ border: "none", borderRadius: 14, background: settings.ctaColor, color: "#FFFFFF", minHeight: 48, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                Add to Cart
              </button>
              <button type="button" style={{ border: `1px solid ${settings.ctaColor}`, borderRadius: 14, background: "transparent", color: settings.ctaColor, minHeight: 48, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                Buy Now
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 0,
                borderRadius: 20,
                border: `1px solid ${border}`,
                background: subSurface,
                overflow: "hidden",
              }}
            >
              {[
                { label: "Product Type", value: product.productType ?? "Product" },
                { label: "Collection", value: product.collectionLabel ?? "Featured" },
                { label: "SKU", value: selectedVariantData?.sku ?? "N/A" },
                { label: "Delivery", value: product.delivery },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "132px minmax(0,1fr)",
                    gap: 10,
                    fontSize: 12,
                    padding: "13px 16px",
                    borderTop: item.label === "Product Type" ? "none" : `1px solid ${border}`,
                  }}
                >
                  <span style={{ color: muted, fontWeight: 700 }}>{item.label}</span>
                  <span style={{ color: text, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  settings,
  setSettings,
  surface,
  setSurface,
  device,
  setDevice,
  collapsed,
  onToggle,
  pendingSection,
  onSectionHandled,
  onRequestSection,
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  surface: SurfaceMode;
  setSurface: (value: SurfaceMode) => void;
  device: Device;
  setDevice: (value: Device) => void;
  collapsed: boolean;
  onToggle: () => void;
  pendingSection: SettingsSectionId | null;
  onSectionHandled: () => void;
  onRequestSection: (section: SettingsSectionId) => void;
}) {
  const panelBg = "#FFFFFF";
  const panelBorder = "1px solid #E3E3E8";
  const asideRef = useRef<HTMLElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<SettingsAccordionId[]>(["workspace", "appearance"]);
  const [designPrompt, setDesignPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [generatedConfigJson, setGeneratedConfigJson] = useState<string>("");
  const sectionRefs = useRef<Record<SettingsSectionId, HTMLElement | null>>({
    presets: null,
    preview: null,
    style: null,
    motion: null,
    imagery: null,
    information: null,
    cta: null,
    accessibility: null,
    customAttributes: null,
    schema: null,
  });
  const sectionToGroup: Record<SettingsSectionId, SettingsAccordionId> = {
    presets: "workspace",
    preview: "workspace",
    style: "appearance",
    imagery: "appearance",
    accessibility: "appearance",
    information: "commerce",
    cta: "commerce",
    customAttributes: "commerce",
    schema: "workspace",
    motion: "interaction",
  };
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const applyPreset = (patch: PresetPatch) =>
    setSettings(() => applyStudioSettingsPatch(DEFAULT_STUDIO_SETTINGS, patch));
  const toggleGroup = (id: SettingsAccordionId) =>
    setExpandedGroups((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  const handleGenerate = useCallback(async () => {
    if (!designPrompt.trim()) {
      setGenerationError("Add a short design brief before generating.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateShowcaseConfig(designPrompt, settings);
      setSettings(result.settings);
      setGeneratedSummary(result.summary);
      setGeneratedConfigJson(JSON.stringify(result.configuration, null, 2));
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Unable to generate a studio configuration.");
    } finally {
      setIsGenerating(false);
    }
  }, [designPrompt, settings, setSettings]);

  useEffect(() => {
    if (!pendingSection) return;
    const group = sectionToGroup[pendingSection];
    setExpandedGroups((current) => (current.includes(group) ? current : [...current, group]));
  }, [pendingSection]);

  useEffect(() => {
    if (collapsed || !pendingSection) return;
    const container = asideRef.current;
    const target = sectionRefs.current[pendingSection];
    if (!container || !target) return;

    const nextTop = target.offsetTop - 12;
    container.scrollTo({ top: nextTop, behavior: "smooth" });
    onSectionHandled();
  }, [collapsed, pendingSection, onSectionHandled]);

  if (collapsed) {
    return (
      <aside
        style={{
          width: 76,
          height: "100%",
          background: panelBg,
          border: panelBorder,
          borderRadius: 18,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "14px 10px",
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand settings"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid #D8D8DD",
            background: "#FFFFFF",
            color: "#202223",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronRight size={18} />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F6F6F7", color: "#202223", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={16} />
        </div>
        {SETTINGS_NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            aria-label={`Open ${label}`}
            onClick={() => onRequestSection(id)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid #E3E3E8",
              background: "#F6F6F7",
              color: "#6D7175",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon size={16} />
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside
      ref={asideRef}
      style={{
        width: 336,
        height: "100%",
        maxWidth: "100%",
        background: panelBg,
        border: panelBorder,
        borderRadius: 18,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        padding: "0 14px 14px",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "#FFFFFF", padding: "12px 0 10px", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 999, background: "#F6F6F7", border: "1px solid #E3E3E8" }}>
            <Sparkles size={14} color="#202223" />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#202223", letterSpacing: "0.04em" }}>Product Card Studio</span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse settings"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #D8D8DD",
              background: "#FFFFFF",
              color: "#202223",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <h1 style={{ margin: "12px 0 0", fontSize: 18, lineHeight: 1.15, letterSpacing: "-0.03em", color: "#111827", fontWeight: 700 }}>
          Configure the card layout
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.55, color: "#6D7175" }}>
          Update settings on the left while keeping the live preview front and center.
        </p>
      </div>

      <SettingsGroup
        icon={Sparkles}
        title="Workspace"
        expanded={expandedGroups.includes("workspace")}
        onToggle={() => toggleGroup("workspace")}
      >
        <div ref={(node) => { sectionRefs.current.presets = node; }}>
          <FieldBlock label="Intelligent presets" eyebrow="Apply one and continue customizing below">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {INTELLIGENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.patch)}
                  style={{
                    border: "1px solid #E3E3E8",
                    borderRadius: 14,
                    padding: "10px 11px",
                    background: "#FFFFFF",
                    color: "#202223",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{preset.name}</span>
                    <span style={{ padding: "3px 7px", borderRadius: 999, fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", background: "#F6F6F7", color: "#6D7175" }}>
                      {preset.tagline}
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 11, lineHeight: 1.45, color: "#6D7175" }}>{preset.summary}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                    {preset.focus.map((item) => (
                      <span
                        key={item}
                        style={{
                          padding: "3px 7px",
                          borderRadius: 999,
                          background: "#F3F4F6",
                          color: "#6D7175",
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </FieldBlock>
        </div>
        <FieldBlock label="Prompt to config" eyebrow="Describe the card direction and apply it to the studio">
          <div style={{ display: "grid", gap: 10 }}>
            <textarea
              value={designPrompt}
              onChange={(event) => setDesignPrompt(event.target.value)}
              placeholder="Example: Create a premium beauty card with softer colors, stronger trust signals, concise CTA copy, and calmer motion."
              rows={5}
              style={{
                width: "100%",
                resize: "vertical",
                borderRadius: 14,
                border: "1px solid #E3E3E8",
                background: "#FFFFFF",
                color: "#202223",
                padding: "12px 13px",
                fontSize: 12,
                lineHeight: 1.55,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={isGenerating}
                style={{
                  border: "none",
                  borderRadius: 12,
                  background: "#111827",
                  color: "#FFFFFF",
                  minHeight: 40,
                  padding: "0 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: isGenerating ? "wait" : "pointer",
                  opacity: isGenerating ? 0.72 : 1,
                }}
              >
                {isGenerating ? "Generating..." : "Generate and apply"}
              </button>
              {generatedSummary ? <div style={{ fontSize: 11, color: "#6D7175", lineHeight: 1.5 }}>{generatedSummary}</div> : null}
            </div>
            {generationError ? (
              <div style={{ borderRadius: 12, background: "#FEF2F2", color: "#B91C1C", padding: "10px 12px", fontSize: 11, fontWeight: 700 }}>
                {generationError}
              </div>
            ) : null}
            {generatedConfigJson ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6D7175" }}>
                  Generated config JSON
                </div>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: 280,
                    overflow: "auto",
                    borderRadius: 14,
                    background: "#111827",
                    color: "#E5E7EB",
                    padding: 12,
                    fontSize: 11,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {generatedConfigJson}
                </pre>
              </div>
            ) : null}
          </div>
        </FieldBlock>
        <div ref={(node) => { sectionRefs.current.schema = node; }}>
          <FieldBlock label="Product schema inspector">
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  "Images",
                  "Video",
                  "Variants",
                  "Inventory",
                  "Vendor",
                  "Product Type",
                  "Collections",
                  "Ratings",
                  "Metafields",
                  "Selling Plans",
                ].map((label) => (
                  <span key={label} style={{ padding: "5px 9px", borderRadius: 999, background: "#EEF7EE", color: "#166534", fontSize: 11, fontWeight: 700 }}>
                    {label}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Weight", "Barcode", "Gift Card", "SEO", "Bundle Components", "Tax"].map((label) => (
                  <span key={label} style={{ padding: "5px 9px", borderRadius: 999, background: "#F6F6F7", color: "#6D7175", fontSize: 11, fontWeight: 700 }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </FieldBlock>
        </div>
        <div ref={(node) => { sectionRefs.current.preview = node; }} />
      </SettingsGroup>

      <SettingsGroup
        icon={Palette}
        title="Appearance"
        expanded={expandedGroups.includes("appearance")}
        onToggle={() => toggleGroup("appearance")}
      >
        <div ref={(node) => { sectionRefs.current.style = node; }}>
          <FieldBlock label="Style direction">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
              {SHOWCASE_STYLE_OPTIONS.filter((option) => option.tier === "ship").map((option) => {
                const active = settings.showcaseStyle === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => set("showcaseStyle", option.value)}
                    style={{
                      border: active ? "1px solid #111827" : "1px solid #E3E3E8",
                      borderRadius: 12,
                      padding: "10px 11px",
                      background: active ? "#F6F6F7" : "#FFFFFF",
                      color: "#111827",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{option.label}</div>
                    <div style={{ fontSize: 10, color: "#6D7175", marginTop: 4 }}>{option.description}</div>
                  </button>
                );
              })}
            </div>
          </FieldBlock>
        </div>
        <FieldBlock label="Accent colour">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {ACCENT_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.color}
                type="button"
                title={preset.name}
                onClick={() => set("accentColor", preset.color)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: preset.color,
                  outline: settings.accentColor === preset.color ? `2px solid ${preset.color}` : "2px solid transparent",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
          <input
            type="text"
            value={settings.accentColor}
            onChange={(event) => set("accentColor", event.target.value)}
            placeholder="#C46A3A"
            style={{
              width: "100%",
              borderRadius: 12,
              border: panelBorder,
              background: "#FFFFFF",
              color: "#202223",
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
        </FieldBlock>
        <FieldBlock label="Card shape" value={`${settings.borderRadius}px`}>
          <RangeSlider value={settings.borderRadius} min={12} max={34} onChange={(value) => set("borderRadius", value)} accentColor={settings.accentColor} />
        </FieldBlock>
        <FieldBlock label="Shadow depth" value={`${settings.shadowIntensity}%`}>
          <RangeSlider value={settings.shadowIntensity} min={0} max={100} onChange={(value) => set("shadowIntensity", value)} accentColor={settings.accentColor} />
        </FieldBlock>
        <FieldBlock label="Card presence">
          <RadioPills options={["Compact", "Standard", "Spacious"] as const} value={settings.cardWidth} onChange={(value) => set("cardWidth", value)} fullWidth />
        </FieldBlock>
        <div ref={(node) => { sectionRefs.current.imagery = node; }}>
          <FieldBlock label="Image behaviour">
            <RadioPills
              options={IMAGE_BEHAVIOUR_OPTIONS.map((option) => option.value) as ImageBehaviour[]}
              value={settings.imageBehaviour}
              onChange={(value) => set("imageBehaviour", value)}
            />
          </FieldBlock>
        </div>
        <div ref={(node) => { sectionRefs.current.accessibility = node; }}>
          <FieldBlock label="Contrast mode">
            <RadioPills options={["Light", "Dark"] as const} value={settings.theme} onChange={(value) => set("theme", value)} fullWidth />
          </FieldBlock>
          <FieldBlock label="Accessibility">
            <div style={{ display: "grid", gap: 12 }}>
              <RadioPills options={ACCESSIBILITY_FONT_OPTIONS} value={settings.fontSize} onChange={(value) => set("fontSize", value)} fullWidth />
              <ToggleRow label="High contrast" checked={settings.highContrast} onChange={(value) => set("highContrast", value)} accentColor={settings.accentColor} />
              <ToggleRow label="Reduced motion" checked={settings.reducedMotion} onChange={(value) => set("reducedMotion", value)} accentColor={settings.accentColor} />
            </div>
          </FieldBlock>
        </div>
      </SettingsGroup>

      <SettingsGroup
        icon={ShoppingBag}
        title="Commerce"
        expanded={expandedGroups.includes("commerce")}
        onToggle={() => toggleGroup("commerce")}
      >
        <div ref={(node) => { sectionRefs.current.information = node; }}>
          <FieldBlock label="Information density">
            <RadioPills options={["Compact", "Balanced", "Detailed"] as const} value={settings.density} onChange={(value) => set("density", value)} fullWidth />
          </FieldBlock>
        </div>
        <FieldBlock label="Merchandising labels">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "bestSeller" as const, label: "Best Seller" },
              { key: "sale" as const, label: "Sale" },
              { key: "newArrival" as const, label: "New Arrival" },
              { key: "limitedStock" as const, label: "Limited Stock" },
            ].map(({ key, label }) => (
              <ToggleRow
                key={key}
                label={label}
                checked={settings.badges[key]}
                onChange={(value) => set("badges", { ...settings.badges, [key]: value })}
                accentColor={settings.accentColor}
              />
            ))}
          </div>
        </FieldBlock>
        <FieldBlock label="Shopper context">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "brand" as const, label: "Brand" },
              { key: "vendor" as const, label: "Vendor" },
              { key: "productType" as const, label: "Product Type" },
              { key: "ratings" as const, label: "Ratings" },
              { key: "reviewCount" as const, label: "Review Count" },
              { key: "deliveryPromise" as const, label: "Delivery Promise" },
              { key: "stockCount" as const, label: "Inventory" },
              { key: "stockStatus" as const, label: "Stock Status" },
              { key: "sku" as const, label: "SKU" },
              { key: "variantCount" as const, label: "Variant Count" },
              { key: "collectionLabel" as const, label: "Collection Label" },
              { key: "pickupAvailability" as const, label: "Pickup Availability" },
              { key: "localDelivery" as const, label: "Local Delivery" },
              { key: "unitPricing" as const, label: "Unit Pricing" },
              { key: "sellingPlan" as const, label: "Selling Plan" },
            ].map(({ key, label }) => (
              <ToggleRow
                key={key}
                label={label}
                checked={settings.productInfo[key]}
                onChange={(value) => set("productInfo", { ...settings.productInfo, [key]: value })}
                accentColor={settings.accentColor}
              />
            ))}
          </div>
        </FieldBlock>
        <FieldBlock label="Selling currency">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
            {CURRENCIES.map((currency) => {
              const active = settings.currency === currency.code;
              return (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => set("currency", currency.code)}
                  style={{
                    border: active ? "1px solid #111827" : "1px solid #E3E3E8",
                    borderRadius: 12,
                    padding: "10px 12px",
                    background: active ? "#F6F6F7" : "#FFFFFF",
                    color: "#111827",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{currency.code}</div>
                  <div style={{ fontSize: 10, color: "#6D7175", marginTop: 4 }}>{currency.label}</div>
                </button>
              );
            })}
          </div>
        </FieldBlock>
        <FieldBlock label="Variant rendering">
          <div style={{ display: "grid", gap: 12 }}>
            <RadioPills options={VARIANT_DISPLAY_OPTIONS} value={settings.variantDisplay} onChange={(value) => set("variantDisplay", value)} />
            <FieldBlock label="Visible variants" value={settings.maxVisibleVariants}>
              <RangeSlider value={settings.maxVisibleVariants} min={1} max={6} onChange={(value) => set("maxVisibleVariants", value)} accentColor={settings.accentColor} />
            </FieldBlock>
            <RadioPills options={VARIANT_OVERFLOW_OPTIONS} value={settings.variantOverflow} onChange={(value) => set("variantOverflow", value)} fullWidth />
          </div>
        </FieldBlock>
        <div ref={(node) => { sectionRefs.current.cta = node; }}>
          <FieldBlock label="Call to action">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <RadioPills options={["Filled", "Outlined", "Floating"] as const} value={settings.ctaStyle} onChange={(value) => set("ctaStyle", value)} fullWidth />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 8 }}>CTA colour</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {CTA_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      title={preset.name}
                      onClick={() => set("ctaColor", preset.color)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        border: "none",
                        cursor: "pointer",
                        background: preset.color,
                        outline: settings.ctaColor === preset.color ? `2px solid ${preset.color}` : "2px solid transparent",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={settings.ctaColor}
                  onChange={(event) => set("ctaColor", event.target.value)}
                  placeholder="#C46A3A"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: panelBorder,
                    background: "#FFFFFF",
                    color: "#202223",
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                />
              </div>
              <input
                type="text"
                value={settings.ctaText}
                onChange={(event) => set("ctaText", event.target.value)}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: panelBorder,
                  background: "#FFFFFF",
                  color: "#202223",
                  padding: "10px 12px",
                  fontSize: 13,
                fontWeight: 700,
              }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Add to Cart", "Buy Now", "Quick Add", "Explore", "Quick View"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set("ctaText", label)}
                    style={{
                      border: "1px solid #E3E3E8",
                      borderRadius: 999,
                      padding: "6px 10px",
                      background: "#FFFFFF",
                      color: "#4B5563",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <ToggleRow
                label="Enable secondary CTA"
                checked={settings.secondaryCtaEnabled}
                onChange={(value) => set("secondaryCtaEnabled", value)}
                accentColor={settings.accentColor}
              />
              {settings.secondaryCtaEnabled ? (
                <>
                  <input
                    type="text"
                    value={settings.secondaryCtaText}
                    onChange={(event) => set("secondaryCtaText", event.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      border: panelBorder,
                      background: "#FFFFFF",
                      color: "#202223",
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["Quick View", "Buy Now", "Learn More", "Compare", "Wishlist"].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => set("secondaryCtaText", label)}
                        style={{
                          border: "1px solid #E3E3E8",
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#FFFFFF",
                          color: "#4B5563",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </FieldBlock>
        </div>
        <div ref={(node) => { sectionRefs.current.customAttributes = node; }}>
          <FieldBlock label="Custom attributes">
            <div style={{ display: "grid", gap: 12 }}>
              <RadioPills options={CUSTOM_ATTRIBUTE_STYLE_OPTIONS} value={settings.customAttributeStyle} onChange={(value) => set("customAttributeStyle", value)} />
              <FieldBlock label="Visible count" value={settings.customAttributeLimit}>
                <RangeSlider value={settings.customAttributeLimit} min={1} max={6} onChange={(value) => set("customAttributeLimit", value)} accentColor={settings.accentColor} />
              </FieldBlock>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Array.from(new Map(getRuntimeProducts().flatMap((product) => (product.metafields ?? []).map((metafield) => [metafield.id, metafield]))).values()).map((metafield) => (
                  <ToggleRow
                    key={metafield.id}
                    label={metafield.label}
                    checked={settings.enabledMetafields.includes(metafield.id)}
                    onChange={(value) =>
                      set(
                        "enabledMetafields",
                        value ? [...new Set([...settings.enabledMetafields, metafield.id])] : settings.enabledMetafields.filter((entry) => entry !== metafield.id),
                      )
                    }
                    accentColor={settings.accentColor}
                  />
                ))}
              </div>
            </div>
          </FieldBlock>
        </div>
      </SettingsGroup>

      <SettingsGroup
        icon={Zap}
        title="Interaction"
        expanded={expandedGroups.includes("interaction")}
        onToggle={() => toggleGroup("interaction")}
      >
        <div ref={(node) => { sectionRefs.current.motion = node; }}>
          <FieldBlock label="Motion presence">
            <RadioPills
              options={MOTION_OPTIONS.filter((option) => option.tier === "ship").map((option) => option.value) as Motion[]}
              value={settings.motion}
              onChange={(value) => set("motion", value)}
              fullWidth
            />
          </FieldBlock>
          {settings.imageBehaviour === "Tilt & Lift" ? (
            <>
              <FieldBlock label="Hover emphasis" value={`${settings.tiltDegrees}°`}>
                <RangeSlider value={settings.tiltDegrees} min={2} max={10} onChange={(value) => set("tiltDegrees", value)} accentColor={settings.accentColor} />
              </FieldBlock>
              <FieldBlock label="Lift strength" value={`${settings.liftHeight}px`}>
                <RangeSlider value={settings.liftHeight} min={4} max={12} onChange={(value) => set("liftHeight", value)} accentColor={settings.accentColor} />
              </FieldBlock>
            </>
          ) : null}
        </div>
      </SettingsGroup>
    </aside>
  );
}

type ProductShowcaseStudioProps = {
  embedded?: boolean;
  initialSettings?: StudioSettings;
  products?: ProductDomainModel[];
  onSave?: (settings: StudioSettings) => void | Promise<void>;
  isSaving?: boolean;
  saveMessage?: string | null;
};

export default function App({
  embedded = false,
  initialSettings,
  products: providedProducts,
  onSave,
  isSaving = false,
  saveMessage = null,
}: ProductShowcaseStudioProps = {}) {
  const { products: fetchedProducts } = useShowcaseProducts();
  const [settings, setSettings] = useState<Settings>(initialSettings ?? DEFAULT_STUDIO_SETTINGS);
  const [surface, setSurface] = useState<SurfaceMode>("grid");
  const [device, setDevice] = useState<Device>("desktop");
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [pendingSection, setPendingSection] = useState<SettingsSectionId | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const shopifyProducts = providedProducts ?? fetchedProducts;
  const showcaseProducts = useMemo(
    () => (shopifyProducts.length ? shopifyProducts.map(normalizeProductForStudio) : MOCK_PRODUCTS),
    [shopifyProducts],
  );

  runtimeProducts = showcaseProducts;

  useEffect(() => {
    setSettings(initialSettings ?? DEFAULT_STUDIO_SETTINGS);
  }, [initialSettings]);

  useEffect(() => {
    if (settings.motion === "Dynamic") {
      setSettings((current) => ({
        ...current,
        motion: current.motion === "Dynamic" ? "Subtle" : current.motion,
      }));
    }
  }, [settings.motion]);

  useEffect(() => {
    if (!quickViewProduct) return;
    const next = showcaseProducts.find((product) => product.id === quickViewProduct.id);
    if (!next) {
      setQuickViewProduct(null);
      return;
    }
    if (next !== quickViewProduct) {
      setQuickViewProduct(next);
    }
  }, [quickViewProduct, showcaseProducts]);

  const isDark = settings.theme === "Dark";
  const pageBg = "#F3F4F6";
  const previewCardBg = "#FFFFFF";
  const handleRequestSection = useCallback((section: SettingsSectionId) => {
    setPendingSection(section);
    setSettingsCollapsed(false);
  }, []);

  return (
    <main
      style={{
        height: embedded ? "auto" : "100vh",
        background: embedded ? "transparent" : pageBg,
        color: "#202223",
        overflow: embedded ? "visible" : "hidden",
        padding: embedded ? 0 : 16,
      }}
    >
      <div
        style={{
          height: embedded ? "auto" : "100%",
          maxWidth: embedded ? "100%" : 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateRows: "auto minmax(0,1fr)",
          gap: 12,
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "12px 16px",
            borderRadius: 16,
            background: "#FFFFFF",
            border: "1px solid #E3E3E8",
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6D7175" }}>Product card editor</div>
            <h2 style={{ margin: "3px 0 0", fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.03em", fontFamily: STOREFRONT_FONT_STACK, fontWeight: 700, color: "#111827" }}>
              Preview and settings
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setSettings(initialSettings ?? DEFAULT_STUDIO_SETTINGS)}
              style={{
                padding: "9px 13px",
                borderRadius: 12,
                border: "1px solid #D8D8DD",
                background: "#FFFFFF",
                color: "#202223",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => void onSave?.(settings)}
              disabled={isSaving}
              style={{
                padding: "9px 14px",
                borderRadius: 12,
                border: "none",
                background: "#202223",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: isSaving ? "wait" : "pointer",
                opacity: isSaving ? 0.72 : 1,
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            {saveMessage ? <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>{saveMessage}</div> : null}
          </div>
        </div>
        <div
          style={{
            minHeight: embedded ? "auto" : 0,
            display: "grid",
            gridTemplateColumns: settingsCollapsed ? "72px minmax(0,1fr)" : "336px minmax(0,1fr)",
            gap: 14,
          }}
        >
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            surface={surface}
            setSurface={setSurface}
            device={device}
            setDevice={setDevice}
            collapsed={settingsCollapsed}
            onToggle={() => setSettingsCollapsed((current) => !current)}
            pendingSection={pendingSection}
            onSectionHandled={() => setPendingSection(null)}
            onRequestSection={handleRequestSection}
          />

          <section
            style={{
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: 4,
            }}
          >
            <div
              style={{
                marginBottom: 12,
                padding: "14px 16px",
                borderRadius: 18,
                background: previewCardBg,
                border: "1px solid #E3E3E8",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6D7175" }}>
                    Preview studio
                  </div>
                  <h3 style={{ margin: "6px 0 0", fontSize: 22, lineHeight: 1.08, letterSpacing: "-0.04em", fontFamily: STOREFRONT_FONT_STACK, fontWeight: 700, color: "#111827" }}>
                    Preview the card in real storefront contexts.
                  </h3>
                  <p style={{ margin: "6px 0 0", maxWidth: 620, color: "#6D7175", fontSize: 12, lineHeight: 1.55 }}>
                    Switch surface and device while keeping the product card in view.
                  </p>
                </div>
                <div style={{ display: "grid", gap: 8, minWidth: 480 }}>
                  <StudioDeviceSelector device={device} setDevice={setDevice} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#6D7175" }}>Storefront context</div>
                  <StudioSurfaceSelector surface={surface} setSurface={setSurface} />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 18,
                background: "#FFFFFF",
                border: "1px solid #E3E3E8",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }}
            >
              <DeviceFrame device={device} theme={settings.theme}>
                <SurfacePreview settings={settings} device={device} surface={surface} onQuickView={setQuickViewProduct} products={shopifyProducts} />
              </DeviceFrame>
            </div>
          </section>
        </div>
      </div>
      <QuickViewModal product={quickViewProduct} settings={settings} device={device} onClose={() => setQuickViewProduct(null)} />
    </main>
  );
}

export {
  ProductCard,
  QuickViewModal,
  SettingsPanel,
  StressPreview,
  StressTile,
  StudioDeviceSelector,
  StudioSurfaceSelector,
  SurfacePreview,
  evaluateDesignQA,
};
