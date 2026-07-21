import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

const schemaOptions = {
  timestamps: true,
  versionKey: false,
  typeKey: "type",
  id: true,
  _id: true,
} as const;

const merchantSchema = new Schema(
  {
    ownerEmail: { type: String, required: true, index: true },
    defaultStoreId: { type: String, required: true },
    timezone: String,
    locale: String,
  },
  schemaOptions,
);

const storeSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    shop: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    primaryDomain: String,
    currencyCode: { type: String, required: true },
    locale: { type: String, required: true },
    timeZone: { type: String, required: true },
    shopify: { type: Schema.Types.Mixed, required: true },
  },
  schemaOptions,
);

const installationSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    status: { type: String, required: true },
    scopes: { type: [String], default: [] },
    installedAt: Date,
    uninstalledAt: Date,
    accessTokenRef: String,
    apiVersion: { type: String, required: true },
  },
  schemaOptions,
);

const showcaseSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    status: { type: String, required: true },
    latestVersion: { type: Number, required: true, default: 1 },
    defaultPresetId: String,
  },
  schemaOptions,
);

const showcaseInstanceSchema = new Schema(
  {
    instanceId: { type: String, required: true, unique: true },
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    showcaseId: { type: String, required: true, index: true },
    configuration: { type: Schema.Types.Mixed, required: true },
    preset: Schema.Types.Mixed,
    version: { type: Number, required: true, default: 1 },
    status: { type: String, required: true },
    placement: { type: Schema.Types.Mixed, required: true },
    themeConfigurationId: String,
  },
  schemaOptions,
);

const configurationSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    ownerType: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    version: { type: Number, required: true, default: 1 },
    value: { type: Schema.Types.Mixed, required: true },
  },
  schemaOptions,
);

const presetSchema = new Schema(
  {
    merchantId: String,
    storeId: String,
    name: { type: String, required: true },
    handle: { type: String, required: true, unique: true },
    scope: { type: String, required: true },
    category: { type: String, required: true },
    description: String,
    configuration: { type: Schema.Types.Mixed, required: true },
    tags: { type: [String], default: [] },
    isDefault: Boolean,
  },
  schemaOptions,
);

const validationResultSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    showcaseInstanceId: { type: String, required: true, index: true },
    status: { type: String, required: true },
    checks: { type: [Schema.Types.Mixed], default: [] },
    summary: { type: Schema.Types.Mixed, required: true },
  },
  schemaOptions,
);

const analyticsSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    showcaseInstanceId: { type: String, required: true, index: true },
    rangeStart: { type: Date, required: true },
    rangeEnd: { type: Date, required: true },
    metrics: { type: Schema.Types.Mixed, required: true },
  },
  schemaOptions,
);

const experimentSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    showcaseId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    hypothesis: String,
    status: { type: String, required: true },
    controlInstanceId: { type: String, required: true },
    variantInstanceIds: { type: [String], default: [] },
    primaryMetric: { type: String, required: true },
    startAt: Date,
    endAt: Date,
  },
  schemaOptions,
);

const webhookEventSchema = new Schema(
  {
    merchantId: String,
    storeId: String,
    topic: { type: String, required: true, index: true },
    shopDomain: { type: String, required: true, index: true },
    shopifyWebhookId: String,
    payloadHash: { type: String, required: true },
    status: { type: String, required: true },
    receivedAt: { type: Date, required: true },
    processedAt: Date,
    errorMessage: String,
  },
  schemaOptions,
);

const themeConfigurationSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    target: { type: String, required: true },
    themeId: String,
    appEmbedUuid: String,
    blockHandle: String,
    placementKey: { type: String, required: true, index: true },
    published: { type: Boolean, required: true, default: false },
    settingsSchemaVersion: { type: Number, required: true, default: 1 },
  },
  schemaOptions,
);

export const MerchantModel = models.Merchant || model("Merchant", merchantSchema);
export const StoreModel = models.Store || model("Store", storeSchema);
export const InstallationModel = models.Installation || model("Installation", installationSchema);
export const ShowcaseModel = models.Showcase || model("Showcase", showcaseSchema);
export const ShowcaseInstanceModel = models.ShowcaseInstance || model("ShowcaseInstance", showcaseInstanceSchema);
export const ConfigurationModel = models.Configuration || model("Configuration", configurationSchema);
export const PresetModel = models.Preset || model("Preset", presetSchema);
export const ValidationResultModel = models.ValidationResult || model("ValidationResult", validationResultSchema);
export const AnalyticsModel = models.Analytics || model("Analytics", analyticsSchema);
export const ExperimentModel = models.Experiment || model("Experiment", experimentSchema);
export const WebhookEventModel = models.WebhookEvent || model("WebhookEvent", webhookEventSchema);
export const ThemeConfigurationModel = models.ThemeConfiguration || model("ThemeConfiguration", themeConfigurationSchema);
