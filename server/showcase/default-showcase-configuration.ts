import type { ShowcaseConfiguration } from "../../shared/contracts";

export const DEFAULT_SHOWCASE_CONFIGURATION: ShowcaseConfiguration = {
  source: {
    mode: "collection",
    heading: "Featured products",
    subheading: "A synced product showcase powered by your app-owned instance configuration.",
    productsToShow: 8,
    layout: "grid",
    ctaLabel: "Shop now",
    showVendor: true,
    showPrice: true,
    showBadges: true,
    showSecondaryImage: true,
  },
  appearance: {
    cardVariant: "premium",
    spacingScale: "balanced",
    borderRadius: "rounded",
    shadowDepth: "low",
    surfaceDefaults: {
      grid: {
        showSecondaryMeta: true,
        prioritizeMedia: false,
        clampTitleLines: 2,
      },
      carousel: {
        showSecondaryMeta: false,
        prioritizeMedia: true,
        clampTitleLines: 2,
      },
    },
  },
  commerce: {
    enabledBlocks: ["vendor", "price", "rating", "cta"],
    priceEmphasis: "strong",
    showCompareAtPrice: true,
    showDiscountBadge: true,
    showRating: true,
    showReviewCount: true,
    showInventoryStatus: false,
    showDeliveryPromise: false,
    variantDisplay: "swatches",
  },
  accessibility: {
    fontScale: "medium",
    highContrast: false,
    reducedMotionFallback: true,
    enforceMinimumTapTargets: true,
    announcePriceChanges: false,
  },
  motion: {
    profile: "subtle_hover",
    hoverDurationMs: 220,
    imageSwapEnabled: true,
    microScaleAmount: 1.02,
    cardLiftAmount: 6,
  },
  media: {
    imageBehavior: "swap_on_hover",
    imageFit: "cover",
    aspectRatioStrategy: "product_aware",
    hoverSecondaryMedia: true,
    videoPreview: "off",
    prioritizeTransparentMedia: false,
  },
  cta: {
    style: "filled",
    primaryAction: "view_product",
    labelOverrides: {
      view_product: "Shop now",
    },
    stickyOnSmallCards: false,
    fullWidth: false,
  },
  theme: {
    mode: "inherit",
    inheritStoreFonts: true,
    accentColor: "#111827",
  },
  validation: {
    enabled: true,
    surfaces: ["grid", "carousel", "spotlight"],
    devices: ["desktop", "tablet", "mobile"],
    minimumContrastRatio: 4.5,
    badgeLimit: 3,
  },
  quickView: {
    enabled: false,
    showGallery: true,
    showVariantPicker: true,
    showQuantitySelector: true,
  },
  density: {
    defaultDensity: "balanced",
    densityBySurface: {
      spotlight: "detailed",
      carousel: "compact",
    },
    compactReductionOrder: ["reviewCount", "vendor", "inventory", "deliveryPromise"],
  },
};
