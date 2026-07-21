import type { StudioEditorConfiguration } from "../../shared/contracts";

export type StudioSettings = StudioEditorConfiguration;

export type StudioSettingsPatch = Omit<Partial<StudioSettings>, "badges" | "productInfo"> & {
  badges?: Partial<StudioSettings["badges"]>;
  productInfo?: Partial<StudioSettings["productInfo"]>;
};

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  showcaseStyle: "Premium",
  motion: "Subtle",
  density: "Balanced",
  imageBehaviour: "Zoom on Hover",
  tiltDegrees: 6,
  liftHeight: 8,
  ctaStyle: "Filled",
  theme: "Light",
  accentColor: "#C46A3A",
  ctaColor: "#C46A3A",
  borderRadius: 22,
  shadowIntensity: 58,
  cardWidth: "Standard",
  currency: "USD",
  badges: { bestSeller: true, sale: true, newArrival: false, limitedStock: true },
  productInfo: {
    brand: true,
    vendor: false,
    productType: false,
    ratings: true,
    reviewCount: true,
    deliveryPromise: true,
    stockCount: true,
    stockStatus: false,
    sku: false,
    variantCount: false,
    collectionLabel: false,
    pickupAvailability: false,
    localDelivery: false,
    unitPricing: false,
    sellingPlan: false,
  },
  variantDisplay: "Color Swatches",
  variantOverflow: "Count",
  maxVisibleVariants: 4,
  customAttributeStyle: "Chip",
  customAttributeLimit: 3,
  enabledMetafields: ["material", "battery-life", "organic", "capacity"],
  reducedMotion: false,
  fontSize: "Medium",
  highContrast: false,
  ctaText: "Add to Cart",
  secondaryCtaEnabled: false,
  secondaryCtaText: "Quick View",
};

export function cloneStudioSettings(settings: StudioSettings): StudioSettings {
  return {
    ...settings,
    badges: { ...settings.badges },
    productInfo: { ...settings.productInfo },
    enabledMetafields: [...settings.enabledMetafields],
  };
}

export function applyStudioSettingsPatch(base: StudioSettings, patch: StudioSettingsPatch): StudioSettings {
  return {
    ...base,
    ...patch,
    badges: patch.badges ? { ...base.badges, ...patch.badges } : { ...base.badges },
    productInfo: patch.productInfo ? { ...base.productInfo, ...patch.productInfo } : { ...base.productInfo },
    enabledMetafields: patch.enabledMetafields ? [...new Set(patch.enabledMetafields)] : [...base.enabledMetafields],
    ctaColor: patch.ctaColor ?? patch.accentColor ?? base.ctaColor,
  };
}
