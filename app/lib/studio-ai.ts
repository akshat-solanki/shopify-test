import { z } from "zod";
import type { ShowcaseConfiguration } from "../../shared/contracts";
import { configurationFromStudioSettings } from "./studio-settings-mapping";
import {
  applyStudioSettingsPatch,
  cloneStudioSettings,
  DEFAULT_STUDIO_SETTINGS,
  type StudioSettings,
  type StudioSettingsPatch,
} from "./studio-settings";

const badgesPatchSchema = z
  .object({
    bestSeller: z.boolean().optional(),
    sale: z.boolean().optional(),
    newArrival: z.boolean().optional(),
    limitedStock: z.boolean().optional(),
  })
  .strict();

const productInfoPatchSchema = z
  .object({
    brand: z.boolean().optional(),
    vendor: z.boolean().optional(),
    productType: z.boolean().optional(),
    ratings: z.boolean().optional(),
    reviewCount: z.boolean().optional(),
    deliveryPromise: z.boolean().optional(),
    stockCount: z.boolean().optional(),
    stockStatus: z.boolean().optional(),
    sku: z.boolean().optional(),
    variantCount: z.boolean().optional(),
    collectionLabel: z.boolean().optional(),
    pickupAvailability: z.boolean().optional(),
    localDelivery: z.boolean().optional(),
    unitPricing: z.boolean().optional(),
    sellingPlan: z.boolean().optional(),
  })
  .strict();

const studioSettingsShape = {
  showcaseStyle: z.enum(["Essential", "Premium", "Express", "Discovery", "Bold"]),
  motion: z.enum(["None", "Subtle", "Dynamic"]),
  density: z.enum(["Compact", "Balanced", "Detailed"]),
  imageBehaviour: z.enum(["Static", "Zoom on Hover", "Tilt & Lift", "Hover Swap", "Video Preview", "360 Preview", "3D Model"]),
  tiltDegrees: z.number().int().min(2).max(10),
  liftHeight: z.number().int().min(4).max(12),
  ctaStyle: z.enum(["Filled", "Outlined", "Floating"]),
  theme: z.enum(["Light", "Dark"]),
  accentColor: z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  ctaColor: z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  borderRadius: z.number().int().min(12).max(34),
  shadowIntensity: z.number().int().min(0).max(100),
  cardWidth: z.enum(["Compact", "Standard", "Spacious"]),
  currency: z.enum(["USD", "EUR", "GBP", "INR", "AED", "AUD", "CAD"]),
  badges: z.object({
    bestSeller: z.boolean(),
    sale: z.boolean(),
    newArrival: z.boolean(),
    limitedStock: z.boolean(),
  }),
  productInfo: z.object({
    brand: z.boolean(),
    vendor: z.boolean(),
    productType: z.boolean(),
    ratings: z.boolean(),
    reviewCount: z.boolean(),
    deliveryPromise: z.boolean(),
    stockCount: z.boolean(),
    stockStatus: z.boolean(),
    sku: z.boolean(),
    variantCount: z.boolean(),
    collectionLabel: z.boolean(),
    pickupAvailability: z.boolean(),
    localDelivery: z.boolean(),
    unitPricing: z.boolean(),
    sellingPlan: z.boolean(),
  }),
  variantDisplay: z.enum(["Color Swatches", "Image Swatches", "Pills", "Chips", "Dropdown", "Variant Count", "Hidden"]),
  variantOverflow: z.enum(["Wrap", "Count"]),
  maxVisibleVariants: z.number().int().min(1).max(6),
  customAttributeStyle: z.enum(["Badge", "Pill", "Chip", "Inline Text", "Key Value Pair"]),
  customAttributeLimit: z.number().int().min(1).max(6),
  enabledMetafields: z.array(z.string().min(1)).max(12),
  reducedMotion: z.boolean(),
  fontSize: z.enum(["Small", "Medium", "Large"]),
  highContrast: z.boolean(),
  ctaText: z.string().min(1).max(40),
  secondaryCtaEnabled: z.boolean(),
  secondaryCtaText: z.string().min(1).max(40),
} satisfies Record<keyof StudioSettings, z.ZodTypeAny>;

export const studioSettingsSchema = z.object(studioSettingsShape);

export const studioSettingsPatchSchema = z
  .object({
    showcaseStyle: studioSettingsShape.showcaseStyle.optional(),
    motion: studioSettingsShape.motion.optional(),
    density: studioSettingsShape.density.optional(),
    imageBehaviour: studioSettingsShape.imageBehaviour.optional(),
    tiltDegrees: studioSettingsShape.tiltDegrees.optional(),
    liftHeight: studioSettingsShape.liftHeight.optional(),
    ctaStyle: studioSettingsShape.ctaStyle.optional(),
    theme: studioSettingsShape.theme.optional(),
    accentColor: studioSettingsShape.accentColor.optional(),
    ctaColor: studioSettingsShape.ctaColor.optional(),
    borderRadius: studioSettingsShape.borderRadius.optional(),
    shadowIntensity: studioSettingsShape.shadowIntensity.optional(),
    cardWidth: studioSettingsShape.cardWidth.optional(),
    currency: studioSettingsShape.currency.optional(),
    badges: badgesPatchSchema.optional(),
    productInfo: productInfoPatchSchema.optional(),
    variantDisplay: studioSettingsShape.variantDisplay.optional(),
    variantOverflow: studioSettingsShape.variantOverflow.optional(),
    maxVisibleVariants: studioSettingsShape.maxVisibleVariants.optional(),
    customAttributeStyle: studioSettingsShape.customAttributeStyle.optional(),
    customAttributeLimit: studioSettingsShape.customAttributeLimit.optional(),
    enabledMetafields: studioSettingsShape.enabledMetafields.optional(),
    reducedMotion: studioSettingsShape.reducedMotion.optional(),
    fontSize: studioSettingsShape.fontSize.optional(),
    highContrast: studioSettingsShape.highContrast.optional(),
    ctaText: studioSettingsShape.ctaText.optional(),
    secondaryCtaEnabled: studioSettingsShape.secondaryCtaEnabled.optional(),
    secondaryCtaText: studioSettingsShape.secondaryCtaText.optional(),
  })
  .strict();

export const studioAiRequestSchema = z
  .object({
    prompt: z.string().trim().min(12).max(1200),
    currentSettings: studioSettingsSchema,
  })
  .strict();

export const studioAiModelResponseSchema = z
  .object({
    summary: z.string().trim().min(1).max(220),
    settingsPatch: studioSettingsPatchSchema,
  })
  .strict();

export const studioAiResultSchema = z
  .object({
    summary: z.string().trim().min(1).max(220),
    settingsPatch: studioSettingsPatchSchema,
    settings: studioSettingsSchema,
    configuration: z.custom<ShowcaseConfiguration>(),
  })
  .strict();

export type StudioAiResult = z.infer<typeof studioAiResultSchema>;

export const GEMINI_STUDIO_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    settingsPatch: {
      type: "object",
      additionalProperties: false,
      properties: {
        showcaseStyle: { type: "string", enum: ["Essential", "Premium", "Express", "Discovery", "Bold"] },
        motion: { type: "string", enum: ["None", "Subtle", "Dynamic"] },
        density: { type: "string", enum: ["Compact", "Balanced", "Detailed"] },
        imageBehaviour: { type: "string", enum: ["Static", "Zoom on Hover", "Tilt & Lift", "Hover Swap", "Video Preview", "360 Preview", "3D Model"] },
        tiltDegrees: { type: "integer", minimum: 2, maximum: 10 },
        liftHeight: { type: "integer", minimum: 4, maximum: 12 },
        ctaStyle: { type: "string", enum: ["Filled", "Outlined", "Floating"] },
        theme: { type: "string", enum: ["Light", "Dark"] },
        accentColor: { type: "string" },
        ctaColor: { type: "string" },
        borderRadius: { type: "integer", minimum: 12, maximum: 34 },
        shadowIntensity: { type: "integer", minimum: 0, maximum: 100 },
        cardWidth: { type: "string", enum: ["Compact", "Standard", "Spacious"] },
        currency: { type: "string", enum: ["USD", "EUR", "GBP", "INR", "AED", "AUD", "CAD"] },
        badges: {
          type: "object",
          additionalProperties: false,
          properties: {
            bestSeller: { type: "boolean" },
            sale: { type: "boolean" },
            newArrival: { type: "boolean" },
            limitedStock: { type: "boolean" },
          },
        },
        productInfo: {
          type: "object",
          additionalProperties: false,
          properties: {
            brand: { type: "boolean" },
            vendor: { type: "boolean" },
            productType: { type: "boolean" },
            ratings: { type: "boolean" },
            reviewCount: { type: "boolean" },
            deliveryPromise: { type: "boolean" },
            stockCount: { type: "boolean" },
            stockStatus: { type: "boolean" },
            sku: { type: "boolean" },
            variantCount: { type: "boolean" },
            collectionLabel: { type: "boolean" },
            pickupAvailability: { type: "boolean" },
            localDelivery: { type: "boolean" },
            unitPricing: { type: "boolean" },
            sellingPlan: { type: "boolean" },
          },
        },
        variantDisplay: { type: "string", enum: ["Color Swatches", "Image Swatches", "Pills", "Chips", "Dropdown", "Variant Count", "Hidden"] },
        variantOverflow: { type: "string", enum: ["Wrap", "Count"] },
        maxVisibleVariants: { type: "integer", minimum: 1, maximum: 6 },
        customAttributeStyle: { type: "string", enum: ["Badge", "Pill", "Chip", "Inline Text", "Key Value Pair"] },
        customAttributeLimit: { type: "integer", minimum: 1, maximum: 6 },
        enabledMetafields: {
          type: "array",
          items: { type: "string" },
          maxItems: 12,
        },
        reducedMotion: { type: "boolean" },
        fontSize: { type: "string", enum: ["Small", "Medium", "Large"] },
        highContrast: { type: "boolean" },
        ctaText: { type: "string" },
        secondaryCtaEnabled: { type: "boolean" },
        secondaryCtaText: { type: "string" },
      },
      required: [],
    },
  },
  required: ["summary", "settingsPatch"],
} as const;

export function buildStudioAiPrompt(input: { prompt: string; currentSettings: StudioSettings }) {
  const { prompt, currentSettings } = input;

  return [
    "You are configuring a production-ready ecommerce product-card studio.",
    "Return JSON only.",
    "Do not return unsupported fields.",
    "Generate a practical settingsPatch for StudioSettings fields only.",
    "Prefer shippable card decisions over experimental or decorative ideas.",
    "Keep search and merchandising contexts compact, legible, and conversion-oriented.",
    "Only change fields that are relevant to the user's brief.",
    "Preserve useful current settings when the brief does not require a change.",
    "",
    "Supported fields:",
    "- showcaseStyle",
    "- motion",
    "- density",
    "- imageBehaviour",
    "- tiltDegrees",
    "- liftHeight",
    "- ctaStyle",
    "- theme",
    "- accentColor",
    "- ctaColor",
    "- borderRadius",
    "- shadowIntensity",
    "- cardWidth",
    "- currency",
    "- badges.bestSeller",
    "- badges.sale",
    "- badges.newArrival",
    "- badges.limitedStock",
    "- productInfo.brand",
    "- productInfo.vendor",
    "- productInfo.productType",
    "- productInfo.ratings",
    "- productInfo.reviewCount",
    "- productInfo.deliveryPromise",
    "- productInfo.stockCount",
    "- productInfo.stockStatus",
    "- productInfo.sku",
    "- productInfo.variantCount",
    "- productInfo.collectionLabel",
    "- productInfo.pickupAvailability",
    "- productInfo.localDelivery",
    "- productInfo.unitPricing",
    "- productInfo.sellingPlan",
    "- variantDisplay",
    "- variantOverflow",
    "- maxVisibleVariants",
    "- customAttributeStyle",
    "- customAttributeLimit",
    "- enabledMetafields",
    "- reducedMotion",
    "- fontSize",
    "- highContrast",
    "- ctaText",
    "- secondaryCtaEnabled",
    "- secondaryCtaText",
    "",
    `Current settings JSON: ${JSON.stringify(cloneStudioSettings(currentSettings))}`,
    `Default settings JSON: ${JSON.stringify(cloneStudioSettings(DEFAULT_STUDIO_SETTINGS))}`,
    "",
    `User brief: ${prompt}`,
    "",
    "Return this exact shape:",
    '{"summary":"short rationale","settingsPatch":{}}',
  ].join("\n");
}

export function extractJsonObject(rawText: string) {
  const trimmed = rawText.trim();
  const directParse = trimmed.startsWith("{") && trimmed.endsWith("}") ? trimmed : null;
  if (directParse) {
    return directParse;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Gemini did not return a JSON object.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

export function resolveStudioAiResult(input: { currentSettings: StudioSettings; rawText: string }): StudioAiResult {
  const parsed = studioAiModelResponseSchema.parse(JSON.parse(extractJsonObject(input.rawText)));
  const settings = applyStudioSettingsPatch(input.currentSettings, parsed.settingsPatch);
  const configuration = configurationFromStudioSettings(settings);

  return studioAiResultSchema.parse({
    summary: parsed.summary,
    settingsPatch: parsed.settingsPatch,
    settings,
    configuration,
  });
}
