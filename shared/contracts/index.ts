export type ID = string;
export type ISODateTime = string;
export type URLString = string;
export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "INR"
  | "AED"
  | "AUD"
  | "CAD"
  | (string & {});

export type Environment = "development" | "staging" | "production";
export type ShowcaseStatus = "draft" | "active" | "archived";
export type InstanceStatus = "draft" | "active" | "paused" | "archived";
export type InstallationStatus = "pending" | "installed" | "uninstalled" | "suspended";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired";
export type ValidationSeverity = "info" | "warning" | "error";
export type ValidationStatus = "pass" | "warning" | "error";
export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "archived";
export type WebhookProcessingStatus = "received" | "processed" | "ignored" | "failed";
export type PresetScope = "system" | "merchant";
export type PresetCategory =
  | "fashion"
  | "luxury"
  | "beauty"
  | "electronics"
  | "furniture"
  | "grocery"
  | "sports"
  | "custom";
export type ThemeTarget = "app_embed" | "theme_extension" | "editor_preview";
export type ShopifyThemeRole = "MAIN" | "UNPUBLISHED" | "DEMO" | "DEVELOPMENT" | (string & {});
export type SurfaceType =
  | "grid"
  | "carousel"
  | "spotlight"
  | "search_results"
  | "collection_page"
  | "recommendation"
  | "quick_view";
export type DeviceType = "desktop" | "tablet" | "mobile";
export type CardVariant = "essential" | "premium" | "express" | "discovery" | "bold";
export type Density = "compact" | "balanced" | "detailed";
export type MotionProfile = "none" | "subtle_hover" | "image_swap" | "micro_scale" | "button_elevation" | "card_lift";
export type ImageBehavior =
  | "static"
  | "zoom_on_hover"
  | "swap_on_hover"
  | "subtle_hover"
  | "micro_scale"
  | "card_lift";
export type CTAStyle = "filled" | "outlined" | "floating";
export type MerchantConfidenceLevel = "high" | "medium" | "low";
export type ShowcaseLayoutMode = "grid" | "carousel" | "spotlight";

export interface AuditFields {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ShopifyResourceRef {
  shopifyId: ID;
  adminGraphqlApiId?: string;
  storefrontId?: ID;
  handle?: string;
}

export interface MoneyAmount {
  amount: string;
  currency: CurrencyCode;
}

export interface MoneyRange {
  min: MoneyAmount;
  max: MoneyAmount;
}

export interface Merchant extends AuditFields {
  id: ID;
  ownerEmail: string;
  defaultStoreId: ID;
  timezone?: string;
  locale?: string;
}

export interface Store extends AuditFields {
  id: ID;
  merchantId: ID;
  shop: string;
  displayName: string;
  primaryDomain?: string;
  currencyCode: CurrencyCode;
  locale: string;
  timeZone: string;
  shopify: ShopifyResourceRef;
}

export interface Installation extends AuditFields {
  id: ID;
  merchantId: ID;
  storeId: ID;
  status: InstallationStatus;
  scopes: string[];
  installedAt?: ISODateTime;
  uninstalledAt?: ISODateTime;
  accessTokenRef?: string;
  apiVersion: string;
}

export interface Subscription extends AuditFields {
  id: ID;
  merchantId: ID;
  storeId: ID;
  status: SubscriptionStatus;
  planKey: string;
  planName: string;
  billingInterval: "monthly" | "annual";
  trialEndsAt?: ISODateTime;
  renewalAt?: ISODateTime;
  shopifyAppSubscriptionId?: ID;
}

export interface Showcase extends AuditFields {
  id: ID;
  merchantId: ID;
  storeId: ID;
  name: string;
  description?: string;
  status: ShowcaseStatus;
  latestVersion: number;
  defaultPresetId?: ID;
}

export interface ShowcaseInstance extends AuditFields {
  instanceId: ID;
  merchantId: ID;
  storeId: ID;
  showcaseId: ID;
  configuration: ShowcaseConfiguration;
  preset?: PresetReference;
  version: number;
  status: InstanceStatus;
  placement: ShowcasePlacement;
  themeConfigurationId?: ID;
}

export interface Configuration extends AuditFields {
  id: ID;
  merchantId: ID;
  storeId: ID;
  ownerType: "showcase" | "instance" | "preset";
  ownerId: ID;
  version: number;
  value: ShowcaseConfiguration;
}

export interface Preset extends AuditFields {
  id: ID;
  merchantId?: ID;
  storeId?: ID;
  name: string;
  handle: string;
  scope: PresetScope;
  category: PresetCategory;
  description?: string;
  configuration: PresetConfiguration;
  tags: string[];
  isDefault?: boolean;
}

export interface PresetReference {
  id: ID;
  name: string;
  version?: number;
}

export interface Validation extends AuditFields {
  id: ID;
  merchantId: ID;
  storeId: ID;
  showcaseInstanceId: ID;
  status: ValidationStatus;
  checks: ValidationCheck[];
  summary: ValidationSummary;
}

export interface Analytics extends AuditFields {
  id: ID;
  merchantId: ID;
  storeId: ID;
  showcaseInstanceId: ID;
  rangeStart: ISODateTime;
  rangeEnd: ISODateTime;
  metrics: AnalyticsMetrics;
}

export interface Experiment extends AuditFields {
  id: ID;
  merchantId: ID;
  storeId: ID;
  showcaseId: ID;
  name: string;
  hypothesis?: string;
  status: ExperimentStatus;
  controlInstanceId: ID;
  variantInstanceIds: ID[];
  primaryMetric: ExperimentMetricKey;
  startAt?: ISODateTime;
  endAt?: ISODateTime;
}

export interface WebhookEvent extends AuditFields {
  id: ID;
  merchantId?: ID;
  storeId?: ID;
  topic: string;
  shopDomain: string;
  shopifyWebhookId?: string;
  payloadHash: string;
  status: WebhookProcessingStatus;
  receivedAt: ISODateTime;
  processedAt?: ISODateTime;
  errorMessage?: string;
}

export interface ThemeConfiguration extends AuditFields {
  id: ID;
  merchantId: ID;
  storeId: ID;
  target: ThemeTarget;
  themeId?: ID;
  appEmbedUuid?: string;
  blockHandle?: string;
  placementKey: string;
  published: boolean;
  settingsSchemaVersion: number;
}

export interface ShopifyThemeSummary {
  id: ID;
  themeId: string;
  name: string;
  role: ShopifyThemeRole;
  processing: boolean;
  editorUrl: string;
  previewUrl: string;
  supportsAppBlocks: "unknown" | "likely_supported" | "requires_check";
}

export interface ShowcasePlacement {
  surface: SurfaceType;
  pageType?: "home" | "collection" | "search" | "product" | "cart" | "custom";
  containerWidth?: number;
  locale?: string;
  market?: string;
}

export interface ProductDomainModel {
  identity: ProductIdentity;
  pricing: ProductPricing;
  media: ProductMediaSet;
  inventory: ProductInventory;
  commerce: ProductCommerce;
  socialProof: ProductSocialProof;
  taxonomy: ProductTaxonomy;
  merchantExtensions: ProductMerchantExtensions;
  seo: ProductSEO;
  descriptions: ProductDescriptions;
  delivery: ProductDelivery;
  rawReferences?: ProductSourceReferences;
}

export interface ProductIdentity {
  id: ID;
  handle: string;
  title: string;
  vendor: string;
  productType?: string;
}

export interface ProductPricing {
  price: MoneyAmount;
  compareAtPrice?: MoneyAmount;
  discountPercentage?: number;
  priceRange?: MoneyRange;
  compareAtPriceRange?: MoneyRange;
  currency: CurrencyCode;
}

export interface ProductMediaSet {
  featuredImage?: ProductImageMedia;
  galleryImages: ProductImageMedia[];
  videos: ProductVideoMedia[];
  media: ProductMedia[];
  models3d: ProductModel3DMedia[];
}

export type ProductMedia = ProductImageMedia | ProductVideoMedia | ProductModel3DMedia | ProductExternalVideoMedia;

export interface ProductBaseMedia {
  id: ID;
  alt?: string;
  previewImage?: ProductImageMedia;
}

export interface ProductImageMedia extends ProductBaseMedia {
  type: "image";
  url: URLString;
  width?: number;
  height?: number;
}

export interface ProductVideoMedia extends ProductBaseMedia {
  type: "video";
  sources: ProductVideoSource[];
  durationSeconds?: number;
}

export interface ProductExternalVideoMedia extends ProductBaseMedia {
  type: "external_video";
  embedUrl: URLString;
  host: "youtube" | "vimeo" | "other";
}

export interface ProductModel3DMedia extends ProductBaseMedia {
  type: "model_3d";
  sources: ProductModelSource[];
}

export interface ProductVideoSource {
  mimeType: string;
  url: URLString;
}

export interface ProductModelSource {
  mimeType: string;
  url: URLString;
}

export interface ProductInventory {
  availableForSale: boolean;
  inventoryQuantity?: number;
  inventoryStatus?: "in_stock" | "low_stock" | "out_of_stock" | "backorder" | "preorder";
}

export interface ProductCommerce {
  variants: ProductVariantModel[];
  options: ProductOption[];
  optionValues: ProductOptionValue[];
  sellingPlans: ProductSellingPlanGroup[];
  bundles: ProductBundleReference[];
  pickupAvailability: PickupAvailability[];
}

export interface ProductVariantModel {
  id: ID;
  title: string;
  sku?: string;
  barcode?: string;
  availableForSale: boolean;
  currentlyNotInStock?: boolean;
  price: MoneyAmount;
  compareAtPrice?: MoneyAmount;
  image?: ProductImageMedia;
  selectedOptions: ProductSelectedOption[];
  inventoryQuantity?: number;
  metafields?: ProductMetafield[];
  requiresComponents?: boolean;
  components?: ProductBundleComponent[];
}

export interface ProductOption {
  id?: ID;
  name: string;
  values: ProductOptionValue[];
}

export interface ProductOptionValue {
  optionName: string;
  value: string;
  swatch?: ProductSwatch;
}

export interface ProductSelectedOption {
  name: string;
  value: string;
}

export interface ProductSwatch {
  color?: string;
  image?: URLString;
}

export interface ProductSellingPlanGroup {
  id: ID;
  name: string;
  options: ProductSellingPlanOption[];
  plans: ProductSellingPlan[];
}

export interface ProductSellingPlanOption {
  name: string;
  values: string[];
}

export interface ProductSellingPlan {
  id: ID;
  name: string;
  description?: string;
}

export interface ProductBundleReference {
  productId?: ID;
  variantId?: ID;
  title: string;
  quantity?: number;
}

export interface ProductBundleComponent {
  productId?: ID;
  variantId?: ID;
  quantity?: number;
}

export interface PickupAvailability {
  locationId: ID;
  locationName: string;
  available: boolean;
  pickupTime?: string;
}

export interface ProductSocialProof {
  rating?: number;
  reviewCount?: number;
}

export interface ProductTaxonomy {
  collections: ProductCollectionReference[];
  tags: string[];
  category?: string;
}

export interface ProductCollectionReference {
  id: ID;
  handle?: string;
  title: string;
}

export interface ProductMerchantExtensions {
  metafields: ProductMetafield[];
}

export interface ProductMetafield {
  id?: ID;
  namespace: string;
  key: string;
  type?: string;
  value: string;
  referenceType?: string;
}

export interface ProductSEO {
  seoTitle?: string;
  seoDescription?: string;
}

export interface ProductDescriptions {
  description?: string;
  shortDescription?: string;
}

export interface ProductDelivery {
  deliveryPromise?: string;
}

export interface ProductSourceReferences {
  product: ShopifyResourceRef;
  variants: ShopifyResourceRef[];
}

export interface DisplayBlock {
  id: string;
  kind:
    | "media"
    | "title"
    | "subtitle"
    | "price"
    | "rating"
    | "badge"
    | "swatches"
    | "variant_picker"
    | "delivery"
    | "inventory"
    | "cta"
    | "metafield"
    | "custom";
  label: string;
  required: boolean;
  priority: number;
  visibility: DisplayVisibilityRule[];
}

export interface DisplayVisibilityRule {
  surface?: SurfaceType[];
  device?: DeviceType[];
  density?: Density[];
  variant?: CardVariant[];
  minWidth?: number;
  maxWidth?: number;
}

export interface AttributeRegistry {
  version: number;
  attributes: AttributeDefinition[];
}

export interface AttributeDefinition {
  id: string;
  source:
    | "product.identity"
    | "product.pricing"
    | "product.media"
    | "product.inventory"
    | "product.commerce"
    | "product.socialProof"
    | "product.taxonomy"
    | "product.merchantExtensions"
    | "product.seo"
    | "product.descriptions"
    | "product.delivery";
  label: string;
  blockKind: DisplayBlock["kind"];
  defaultEnabled: boolean;
  fallbackBehavior: "hide" | "collapse" | "substitute";
}

export interface ThemeContract {
  mode: "light" | "dark" | "inherit";
  inheritStoreFonts: boolean;
  fontHeading?: string;
  fontBody?: string;
  borderRadius: "soft" | "rounded" | "sharp";
  shadowDepth: "none" | "low" | "medium";
}

export interface MotionContract {
  profile: MotionProfile;
  durationMs: number;
  easing: "standard" | "decelerate" | "accelerate";
  respectsReducedMotion: boolean;
}

export interface BadgeContract {
  id: string;
  kind: "sale" | "inventory" | "social_proof" | "shipping" | "custom";
  text: string;
  priority: number;
  maxVisible?: number;
}

export interface CTAContract {
  style: CTAStyle;
  label: string;
  behavior: "add_to_cart" | "select_options" | "quick_view" | "view_product";
  stickyInCard?: boolean;
  showIcon?: boolean;
}

export interface ValidationContract {
  ruleId: string;
  title: string;
  severity: ValidationSeverity;
  category:
    | "grid_safe"
    | "carousel_safe"
    | "mobile_safe"
    | "typography"
    | "badge_overflow"
    | "cta_overflow"
    | "image_crop"
    | "title_overflow"
    | "contrast"
    | "accessibility";
  reason: string;
  recommendation?: string;
}

export interface CommerceScoreContract {
  score: number;
  scoreBand: "low" | "medium" | "high";
  drivers: CommerceScoreDriver[];
}

export interface CommerceScoreDriver {
  key:
    | "price_clarity"
    | "cta_visibility"
    | "trust_signals"
    | "media_quality"
    | "variant_discoverability"
    | "mobile_readability";
  impact: "positive" | "negative" | "neutral";
  summary: string;
}

export interface MerchantConfidenceContract {
  level: MerchantConfidenceLevel;
  summary: string;
  signals: MerchantConfidenceSignal[];
}

export interface MerchantConfidenceSignal {
  id: string;
  status: "pass" | "warning" | "info" | "error";
  title: string;
  message: string;
}

export interface ShowcaseConfiguration {
  source: ShowcaseSourceConfiguration;
  appearance: AppearanceConfiguration;
  commerce: CommerceConfiguration;
  accessibility: AccessibilityConfiguration;
  motion: MotionConfiguration;
  media: MediaConfiguration;
  cta: CTAConfiguration;
  theme: ThemeConfigurationModel;
  validation: ValidationConfiguration;
  quickView: QuickViewConfiguration;
  density: DensityConfiguration;
  studio?: StudioEditorConfiguration;
}

export interface StudioEditorConfiguration {
  showcaseStyle: "Essential" | "Premium" | "Express" | "Discovery" | "Bold";
  motion: "None" | "Subtle" | "Dynamic";
  density: "Compact" | "Balanced" | "Detailed";
  imageBehaviour: "Static" | "Zoom on Hover" | "Tilt & Lift" | "Hover Swap" | "Video Preview" | "360 Preview" | "3D Model";
  tiltDegrees: number;
  liftHeight: number;
  ctaStyle: "Filled" | "Outlined" | "Floating";
  theme: "Light" | "Dark";
  accentColor: string;
  ctaColor: string;
  borderRadius: number;
  shadowIntensity: number;
  cardWidth: "Compact" | "Standard" | "Spacious";
  currency: CurrencyCode;
  badges: {
    bestSeller: boolean;
    sale: boolean;
    newArrival: boolean;
    limitedStock: boolean;
  };
  productInfo: {
    brand: boolean;
    vendor: boolean;
    productType: boolean;
    ratings: boolean;
    reviewCount: boolean;
    deliveryPromise: boolean;
    stockCount: boolean;
    stockStatus: boolean;
    sku: boolean;
    variantCount: boolean;
    collectionLabel: boolean;
    pickupAvailability: boolean;
    localDelivery: boolean;
    unitPricing: boolean;
    sellingPlan: boolean;
  };
  variantDisplay: "Color Swatches" | "Image Swatches" | "Pills" | "Chips" | "Dropdown" | "Variant Count" | "Hidden";
  variantOverflow: "Wrap" | "Count";
  maxVisibleVariants: number;
  customAttributeStyle: "Badge" | "Pill" | "Chip" | "Inline Text" | "Key Value Pair";
  customAttributeLimit: number;
  enabledMetafields: string[];
  reducedMotion: boolean;
  fontSize: "Small" | "Medium" | "Large";
  highContrast: boolean;
  ctaText: string;
  secondaryCtaEnabled: boolean;
  secondaryCtaText: string;
}

export interface ShowcaseSourceConfiguration {
  mode: "collection";
  collectionHandle?: string;
  heading?: string;
  subheading?: string;
  productsToShow: number;
  layout: ShowcaseLayoutMode;
  ctaLabel: string;
  showVendor: boolean;
  showPrice: boolean;
  showBadges: boolean;
  showSecondaryImage: boolean;
}

export interface AppearanceConfiguration {
  cardVariant: CardVariant;
  surfaceDefaults?: Partial<Record<SurfaceType, SurfaceAppearanceRule>>;
  spacingScale: "tight" | "balanced" | "airy";
  borderRadius: "soft" | "rounded" | "sharp";
  shadowDepth: "none" | "low" | "medium";
}

export interface SurfaceAppearanceRule {
  showSecondaryMeta?: boolean;
  prioritizeMedia?: boolean;
  clampTitleLines?: number;
}

export interface CommerceConfiguration {
  enabledBlocks: string[];
  priceEmphasis: "standard" | "strong";
  showCompareAtPrice: boolean;
  showDiscountBadge: boolean;
  showRating: boolean;
  showReviewCount: boolean;
  showInventoryStatus: boolean;
  showDeliveryPromise: boolean;
  variantDisplay: "swatches" | "pills" | "dropdown" | "count" | "hidden";
}

export interface AccessibilityConfiguration {
  fontScale: "small" | "medium" | "large";
  highContrast: boolean;
  reducedMotionFallback: boolean;
  enforceMinimumTapTargets: boolean;
  announcePriceChanges: boolean;
}

export interface MotionConfiguration {
  profile: MotionProfile;
  hoverDurationMs: number;
  imageSwapEnabled: boolean;
  microScaleAmount?: number;
  cardLiftAmount?: number;
}

export interface MediaConfiguration {
  imageBehavior: ImageBehavior;
  imageFit: "cover" | "contain" | "adaptive";
  aspectRatioStrategy: "product_aware" | "square" | "portrait" | "landscape" | "auto";
  hoverSecondaryMedia: boolean;
  videoPreview: "off" | "muted_on_hover";
  prioritizeTransparentMedia: boolean;
}

export interface CTAConfiguration {
  style: CTAStyle;
  primaryAction: CTAContract["behavior"];
  labelOverrides?: Partial<Record<CTAContract["behavior"], string>>;
  stickyOnSmallCards: boolean;
  fullWidth: boolean;
}

export interface ThemeConfigurationModel {
  mode: "light" | "dark" | "inherit";
  inheritStoreFonts: boolean;
  customHeadingFont?: string;
  customBodyFont?: string;
  accentColor?: string;
}

export interface ValidationConfiguration {
  enabled: boolean;
  surfaces: SurfaceType[];
  devices: DeviceType[];
  minimumContrastRatio?: number;
  badgeLimit?: number;
}

export interface QuickViewConfiguration {
  enabled: boolean;
  showGallery: boolean;
  showVariantPicker: boolean;
  showQuantitySelector: boolean;
}

export interface DensityConfiguration {
  defaultDensity: Density;
  densityBySurface?: Partial<Record<SurfaceType, Density>>;
  compactReductionOrder: string[];
}

export interface PresetConfiguration {
  base: ShowcaseConfiguration;
  overrideablePaths: string[];
}

export interface ValidationCheck {
  id: string;
  category: ValidationContract["category"];
  severity: ValidationSeverity;
  status: ValidationStatus;
  title: string;
  reason: string;
  recommendation?: string;
}

export interface ValidationSummary {
  errors: number;
  warnings: number;
  infos: number;
}

export interface AnalyticsMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  addToCart: number;
  addToCartRate: number;
  quickViewOpenRate?: number;
  variantSelectionRate?: number;
}

export type ExperimentMetricKey =
  | "click_through_rate"
  | "add_to_cart_rate"
  | "quick_view_open_rate"
  | "variant_selection_rate";

export interface CreateShowcaseDto {
  merchantId: ID;
  storeId: ID;
  name: string;
  description?: string;
  presetId?: ID;
  configuration?: Partial<ShowcaseConfiguration>;
}

export interface UpdateShowcaseDto {
  showcaseId: ID;
  name?: string;
  description?: string;
  status?: ShowcaseStatus;
}

export interface CreateShowcaseInstanceDto {
  merchantId: ID;
  storeId: ID;
  showcaseId: ID;
  presetId?: ID;
  placement: ShowcasePlacement;
  configuration?: Partial<ShowcaseConfiguration>;
}

export interface UpdateShowcaseInstanceConfigurationDto {
  instanceId: ID;
  expectedVersion: number;
  configuration: ShowcaseConfiguration;
}

export interface CreatePresetDto {
  merchantId?: ID;
  storeId?: ID;
  name: string;
  handle: string;
  category: PresetCategory;
  configuration: PresetConfiguration;
}

export interface RunValidationDto {
  merchantId: ID;
  storeId: ID;
  showcaseInstanceId: ID;
  surfaces?: SurfaceType[];
  devices?: DeviceType[];
}

export interface StartExperimentDto {
  merchantId: ID;
  storeId: ID;
  showcaseId: ID;
  name: string;
  controlInstanceId: ID;
  variantInstanceIds: ID[];
  primaryMetric: ExperimentMetricKey;
}

export interface SyncThemeConfigurationDto {
  merchantId: ID;
  storeId: ID;
  showcaseInstanceId: ID;
  target: ThemeTarget;
  placementKey: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: ISODateTime;
  version?: string;
}

export interface MerchantSummaryDto {
  merchant: Merchant;
  stores: Store[];
  activeSubscription?: Subscription;
}

export interface ShowcaseDetailDto {
  showcase: Showcase;
  instances: ShowcaseInstance[];
  presets: PresetReference[];
}

export interface ShowcaseInstanceDetailDto {
  instance: ShowcaseInstance;
  latestValidation?: Validation;
  themeConfiguration?: ThemeConfiguration;
}

export interface ShopifyOnboardingBootstrapDto {
  showcase: Showcase;
  instance: ShowcaseInstance;
  themeConfiguration: ThemeConfiguration;
}

export interface ShowcaseInstanceSummaryDto {
  instance: ShowcaseInstance;
  themeConfiguration?: ThemeConfiguration;
}

export interface UpdateShowcaseSourceDto {
  instanceId: ID;
  source: Partial<ShowcaseSourceConfiguration>;
}

export interface UpdateShowcaseConfigurationDto {
  instanceId: ID;
  configuration: Partial<ShowcaseConfiguration>;
}

export interface ShowcaseRuntimeDto {
  instanceId: ID;
  placementKey: string;
  source: ShowcaseSourceConfiguration;
  theme: ThemeConfigurationModel;
  configuration: ShowcaseConfiguration;
  products: ProductDomainModel[];
  cardModels?: ShowcaseCardViewModel[];
  themeConfiguration?: ThemeConfiguration;
}

export interface ShowcaseCardViewModel {
  productHandle: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  featuredImageUrl?: URLString;
  secondaryImageUrl?: URLString;
  imageAlt?: string;
  badges: ShowcaseCardBadgeViewModel[];
  trustChips: ShowcaseCardTrustChipViewModel[];
  price?: ShowcaseCardPriceViewModel;
  metaChips: string[];
  variantDisplay?: string;
  variantOptions: ShowcaseCardVariantOptionViewModel[];
  detailLines: string[];
  attributes: ShowcaseCardAttributeViewModel[];
  stockMeter?: ShowcaseCardStockMeterViewModel;
  ctaLabel: string;
  secondaryCtaLabel?: string;
  assurance: string[];
}

export interface ShowcaseCardBadgeViewModel {
  label: string;
  tone: "sale" | "neutral" | "warning" | "muted";
}

export interface ShowcaseCardTrustChipViewModel {
  label: string;
  strong?: boolean;
}

export interface ShowcaseCardPriceViewModel {
  current: string;
  compareAt?: string;
  savingsLabel?: string;
  note?: string;
}

export interface ShowcaseCardVariantOptionViewModel {
  label: string;
  swatchColor?: string;
}

export interface ShowcaseCardAttributeViewModel {
  label: string;
  value: string;
}

export interface ShowcaseCardStockMeterViewModel {
  label: string;
  activeBars: number;
  totalBars: number;
}

export interface ProductProjectionDto {
  product: ProductDomainModel;
  source: "shopify_storefront_api" | "shopify_admin_api" | "cache";
  fetchedAt: ISODateTime;
}

export interface ValidationResultDto {
  validation: Validation;
  confidence?: MerchantConfidenceContract;
  commerceScore?: CommerceScoreContract;
}

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface MerchantService {
  getMerchantSummary(merchantId: ID): Promise<ServiceResult<MerchantSummaryDto>>;
  getMerchantStores(merchantId: ID): Promise<ServiceResult<Store[]>>;
}

export interface ShowcaseService {
  createShowcase(input: CreateShowcaseDto): Promise<ServiceResult<Showcase>>;
  updateShowcase(input: UpdateShowcaseDto): Promise<ServiceResult<Showcase>>;
  getShowcase(showcaseId: ID): Promise<ServiceResult<ShowcaseDetailDto>>;
  createInstance(input: CreateShowcaseInstanceDto): Promise<ServiceResult<ShowcaseInstance>>;
  getInstance(instanceId: ID): Promise<ServiceResult<ShowcaseInstanceDetailDto>>;
}

export interface ConfigurationService {
  resolveConfiguration(instanceId: ID): Promise<ServiceResult<ShowcaseConfiguration>>;
  updateInstanceConfiguration(
    input: UpdateShowcaseInstanceConfigurationDto,
  ): Promise<ServiceResult<ShowcaseInstance>>;
}

export interface PresetService {
  listPresets(storeId: ID): Promise<ServiceResult<Preset[]>>;
  createPreset(input: CreatePresetDto): Promise<ServiceResult<Preset>>;
  applyPreset(instanceId: ID, presetId: ID): Promise<ServiceResult<ShowcaseInstance>>;
}

export interface ValidationService {
  runValidation(input: RunValidationDto): Promise<ServiceResult<ValidationResultDto>>;
  getLatestValidation(instanceId: ID): Promise<ServiceResult<Validation | undefined>>;
}

export interface AnalyticsService {
  getInstanceAnalytics(instanceId: ID, rangeStart: ISODateTime, rangeEnd: ISODateTime): Promise<ServiceResult<Analytics>>;
}

export interface ExperimentService {
  startExperiment(input: StartExperimentDto): Promise<ServiceResult<Experiment>>;
  stopExperiment(experimentId: ID): Promise<ServiceResult<Experiment>>;
  getExperiment(experimentId: ID): Promise<ServiceResult<Experiment>>;
}

export interface ShopifyIntegrationService {
  getNormalizedProduct(storeId: ID, productId: ID): Promise<ServiceResult<ProductProjectionDto>>;
  getNormalizedProducts(storeId: ID, productIds: ID[]): Promise<ServiceResult<ProductProjectionDto[]>>;
  syncThemeConfiguration(input: SyncThemeConfigurationDto): Promise<ServiceResult<ThemeConfiguration>>;
}

export interface WebhookService {
  ingestWebhook(topic: string, shopDomain: string, payload: unknown): Promise<ServiceResult<WebhookEvent>>;
  processWebhookEvent(eventId: ID): Promise<ServiceResult<WebhookEvent>>;
}
