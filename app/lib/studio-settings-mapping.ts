import type { ShowcaseConfiguration, StudioEditorConfiguration } from "../../shared/contracts";
import { DEFAULT_STUDIO_SETTINGS, type StudioSettings } from "./studio-settings";

const DEFAULT_SHOWCASE_CONFIGURATION: ShowcaseConfiguration = {
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

function titleCase<T extends string>(value: T) {
  return value
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapCardVariantToStudio(value: ShowcaseConfiguration["appearance"]["cardVariant"]): StudioSettings["showcaseStyle"] {
  return titleCase(value) as StudioSettings["showcaseStyle"];
}

function mapDensityToStudio(value: ShowcaseConfiguration["density"]["defaultDensity"]): StudioSettings["density"] {
  return titleCase(value) as StudioSettings["density"];
}

function mapThemeModeToStudio(value: ShowcaseConfiguration["theme"]["mode"]): StudioSettings["theme"] {
  return value === "dark" ? "Dark" : "Light";
}

function mapMotionProfileToStudio(value: ShowcaseConfiguration["motion"]["profile"]): StudioSettings["motion"] {
  if (value === "none") return "None";
  if (value === "micro_scale" || value === "card_lift") return "Dynamic";
  return "Subtle";
}

function mapImageBehaviorToStudio(value: ShowcaseConfiguration["media"]["imageBehavior"]): StudioSettings["imageBehaviour"] {
  switch (value) {
    case "static":
      return "Static";
    case "zoom_on_hover":
      return "Zoom on Hover";
    case "swap_on_hover":
      return "Hover Swap";
    case "micro_scale":
    case "card_lift":
      return "Tilt & Lift";
    default:
      return "Zoom on Hover";
  }
}

function mapVariantDisplayToStudio(value: ShowcaseConfiguration["commerce"]["variantDisplay"]): StudioSettings["variantDisplay"] {
  switch (value) {
    case "swatches":
      return "Color Swatches";
    case "pills":
      return "Pills";
    case "dropdown":
      return "Dropdown";
    case "count":
      return "Variant Count";
    case "hidden":
      return "Hidden";
    default:
      return "Color Swatches";
  }
}

function mapBorderRadiusToNumeric(value: ShowcaseConfiguration["appearance"]["borderRadius"]) {
  switch (value) {
    case "soft":
      return 16;
    case "rounded":
      return 22;
    case "sharp":
      return 12;
    default:
      return DEFAULT_STUDIO_SETTINGS.borderRadius;
  }
}

function mapShadowDepthToNumeric(value: ShowcaseConfiguration["appearance"]["shadowDepth"]) {
  switch (value) {
    case "none":
      return 0;
    case "low":
      return 35;
    case "medium":
      return 70;
    default:
      return DEFAULT_STUDIO_SETTINGS.shadowIntensity;
  }
}

function mapSpacingScaleToCardWidth(value: ShowcaseConfiguration["appearance"]["spacingScale"]): StudioSettings["cardWidth"] {
  switch (value) {
    case "tight":
      return "Compact";
    case "airy":
      return "Spacious";
    default:
      return "Standard";
  }
}

export function studioSettingsFromConfiguration(configuration?: ShowcaseConfiguration): StudioSettings {
  const studio = configuration?.studio;
  if (studio) {
    return {
      ...DEFAULT_STUDIO_SETTINGS,
      ...studio,
      currency: (studio.currency ?? DEFAULT_STUDIO_SETTINGS.currency) as StudioSettings["currency"],
      badges: {
        ...DEFAULT_STUDIO_SETTINGS.badges,
        ...studio.badges,
      },
      productInfo: {
        ...DEFAULT_STUDIO_SETTINGS.productInfo,
        ...studio.productInfo,
      },
    };
  }

  const source = configuration?.source ?? DEFAULT_SHOWCASE_CONFIGURATION.source;
  const appearance = configuration?.appearance ?? DEFAULT_SHOWCASE_CONFIGURATION.appearance;
  const commerce = configuration?.commerce ?? DEFAULT_SHOWCASE_CONFIGURATION.commerce;
  const accessibility = configuration?.accessibility ?? DEFAULT_SHOWCASE_CONFIGURATION.accessibility;
  const motion = configuration?.motion ?? DEFAULT_SHOWCASE_CONFIGURATION.motion;
  const media = configuration?.media ?? DEFAULT_SHOWCASE_CONFIGURATION.media;
  const cta = configuration?.cta ?? DEFAULT_SHOWCASE_CONFIGURATION.cta;
  const theme = configuration?.theme ?? DEFAULT_SHOWCASE_CONFIGURATION.theme;
  const density = configuration?.density ?? DEFAULT_SHOWCASE_CONFIGURATION.density;

  return {
    ...DEFAULT_STUDIO_SETTINGS,
    showcaseStyle: mapCardVariantToStudio(appearance.cardVariant),
    motion: mapMotionProfileToStudio(motion.profile),
    density: mapDensityToStudio(density.defaultDensity),
    imageBehaviour: mapImageBehaviorToStudio(media.imageBehavior),
    tiltDegrees: Math.round((motion.microScaleAmount ?? DEFAULT_SHOWCASE_CONFIGURATION.motion.microScaleAmount ?? 1.02) * 5),
    liftHeight: motion.cardLiftAmount ?? DEFAULT_STUDIO_SETTINGS.liftHeight,
    ctaStyle: titleCase(cta.style) as StudioSettings["ctaStyle"],
    theme: mapThemeModeToStudio(theme.mode),
    accentColor: theme.accentColor ?? DEFAULT_STUDIO_SETTINGS.accentColor,
    ctaColor: theme.accentColor ?? DEFAULT_STUDIO_SETTINGS.ctaColor,
    borderRadius: mapBorderRadiusToNumeric(appearance.borderRadius),
    shadowIntensity: mapShadowDepthToNumeric(appearance.shadowDepth),
    cardWidth: mapSpacingScaleToCardWidth(appearance.spacingScale),
    currency: DEFAULT_STUDIO_SETTINGS.currency as StudioSettings["currency"],
    badges: {
      ...DEFAULT_STUDIO_SETTINGS.badges,
      sale: source.showBadges,
      limitedStock: commerce.showInventoryStatus,
    },
    productInfo: {
      ...DEFAULT_STUDIO_SETTINGS.productInfo,
      vendor: source.showVendor,
      ratings: commerce.showRating,
      reviewCount: commerce.showReviewCount,
      deliveryPromise: commerce.showDeliveryPromise,
      stockStatus: commerce.showInventoryStatus,
    },
    variantDisplay: mapVariantDisplayToStudio(commerce.variantDisplay),
    reducedMotion: accessibility.reducedMotionFallback,
    fontSize: titleCase(accessibility.fontScale) as StudioSettings["fontSize"],
    highContrast: accessibility.highContrast,
    ctaText: source.ctaLabel || DEFAULT_STUDIO_SETTINGS.ctaText,
  };
}

function mapStudioMotionToProfile(settings: StudioSettings): ShowcaseConfiguration["motion"]["profile"] {
  if (settings.motion === "None") return "none";
  if (settings.imageBehaviour === "Tilt & Lift") return "card_lift";
  if (settings.imageBehaviour === "Hover Swap") return "image_swap";
  return "subtle_hover";
}

function mapStudioImageBehaviour(settings: StudioSettings): ShowcaseConfiguration["media"]["imageBehavior"] {
  switch (settings.imageBehaviour) {
    case "Static":
      return "static";
    case "Zoom on Hover":
      return "zoom_on_hover";
    case "Hover Swap":
      return "swap_on_hover";
    case "Tilt & Lift":
      return "card_lift";
    default:
      return "zoom_on_hover";
  }
}

function mapStudioCardWidth(value: StudioSettings["cardWidth"]): ShowcaseConfiguration["appearance"]["spacingScale"] {
  switch (value) {
    case "Compact":
      return "tight";
    case "Spacious":
      return "airy";
    default:
      return "balanced";
  }
}

function mapStudioRadius(value: number): ShowcaseConfiguration["appearance"]["borderRadius"] {
  if (value <= 14) return "sharp";
  if (value >= 22) return "rounded";
  return "soft";
}

function mapStudioShadow(value: number): ShowcaseConfiguration["appearance"]["shadowDepth"] {
  if (value <= 10) return "none";
  if (value >= 55) return "medium";
  return "low";
}

function mapStudioVariantDisplay(value: StudioSettings["variantDisplay"]): ShowcaseConfiguration["commerce"]["variantDisplay"] {
  switch (value) {
    case "Pills":
    case "Chips":
      return "pills";
    case "Dropdown":
      return "dropdown";
    case "Variant Count":
      return "count";
    case "Hidden":
      return "hidden";
    default:
      return "swatches";
  }
}

export function configurationFromStudioSettings(
  settings: StudioSettings,
  currentConfiguration?: ShowcaseConfiguration,
): ShowcaseConfiguration {
  const base = currentConfiguration ?? DEFAULT_SHOWCASE_CONFIGURATION;

  const studio: StudioEditorConfiguration = {
    ...settings,
    badges: { ...settings.badges },
    productInfo: { ...settings.productInfo },
    enabledMetafields: [...settings.enabledMetafields],
  };

  return {
    ...base,
    source: {
      ...base.source,
      ctaLabel: settings.ctaText,
      showVendor: settings.productInfo.vendor,
      showPrice: true,
      showBadges: Object.values(settings.badges).some(Boolean),
      showSecondaryImage: settings.imageBehaviour === "Hover Swap" || settings.imageBehaviour === "Zoom on Hover" || settings.imageBehaviour === "Tilt & Lift",
    },
    appearance: {
      ...base.appearance,
      cardVariant: settings.showcaseStyle.toLowerCase() as ShowcaseConfiguration["appearance"]["cardVariant"],
      spacingScale: mapStudioCardWidth(settings.cardWidth),
      borderRadius: mapStudioRadius(settings.borderRadius),
      shadowDepth: mapStudioShadow(settings.shadowIntensity),
    },
    commerce: {
      ...base.commerce,
      enabledBlocks: [
        settings.productInfo.vendor ? "vendor" : null,
        "price",
        settings.productInfo.ratings ? "rating" : null,
        "cta",
      ].filter(Boolean) as string[],
      showDiscountBadge: settings.badges.sale,
      showRating: settings.productInfo.ratings,
      showReviewCount: settings.productInfo.reviewCount,
      showInventoryStatus: settings.productInfo.stockStatus,
      showDeliveryPromise: settings.productInfo.deliveryPromise,
      variantDisplay: mapStudioVariantDisplay(settings.variantDisplay),
    },
    accessibility: {
      ...base.accessibility,
      fontScale: settings.fontSize.toLowerCase() as ShowcaseConfiguration["accessibility"]["fontScale"],
      highContrast: settings.highContrast,
      reducedMotionFallback: settings.reducedMotion,
    },
    motion: {
      ...base.motion,
      profile: mapStudioMotionToProfile(settings),
      imageSwapEnabled: settings.imageBehaviour === "Hover Swap",
      microScaleAmount: 1 + settings.tiltDegrees / 100,
      cardLiftAmount: settings.liftHeight,
    },
    media: {
      ...base.media,
      imageBehavior: mapStudioImageBehaviour(settings),
      hoverSecondaryMedia: settings.imageBehaviour === "Hover Swap",
      prioritizeTransparentMedia: settings.imageBehaviour === "3D Model",
      videoPreview: settings.imageBehaviour === "Video Preview" ? "muted_on_hover" : "off",
    },
    cta: {
      ...base.cta,
      style: settings.ctaStyle.toLowerCase() as ShowcaseConfiguration["cta"]["style"],
      labelOverrides: {
        ...(base.cta.labelOverrides ?? {}),
        view_product: settings.ctaText,
      },
    },
    theme: {
      ...base.theme,
      mode: settings.theme.toLowerCase() as ShowcaseConfiguration["theme"]["mode"],
      accentColor: settings.accentColor,
    },
    density: {
      ...base.density,
      defaultDensity: settings.density.toLowerCase() as ShowcaseConfiguration["density"]["defaultDensity"],
    },
    quickView: {
      ...base.quickView,
      enabled: settings.secondaryCtaEnabled,
    },
    studio,
  };
}
