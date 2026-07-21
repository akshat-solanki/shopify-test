import type {
  ProductDomainModel,
  ShowcaseCardAttributeViewModel,
  ShowcaseCardBadgeViewModel,
  ShowcaseCardPriceViewModel,
  ShowcaseCardTrustChipViewModel,
  ShowcaseCardVariantOptionViewModel,
  ShowcaseCardViewModel,
  ShowcaseConfiguration,
  ShowcaseSourceConfiguration,
  StudioEditorConfiguration,
} from "../contracts";

function studioSettings(configuration: ShowcaseConfiguration): Partial<StudioEditorConfiguration> {
  return configuration.studio ?? {};
}

function money(amount?: string, currency = "USD") {
  const value = Number(amount ?? "0");

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(value);
  } catch (_error) {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function compactTitle(value: string) {
  if (value.length <= 28) {
    return value;
  }

  return value.split(/\s+/).slice(0, 3).join(" ");
}

function subtitleForProduct(product: ProductDomainModel) {
  return (
    product.descriptions.shortDescription ??
    [product.identity.vendor, product.identity.productType].filter(Boolean).join(" ")
  );
}

function tagList(product: ProductDomainModel) {
  return (product.taxonomy.tags ?? []).map((tag) => String(tag).toLowerCase());
}

function hasTag(product: ProductDomainModel, needles: string[]) {
  const tags = tagList(product);
  return needles.some((needle) => tags.some((tag) => tag.includes(needle.toLowerCase())));
}

function compareAtEnabled(product: ProductDomainModel, configuration: ShowcaseConfiguration) {
  return configuration.commerce.showCompareAtPrice !== false && Boolean(product.pricing.compareAtPrice);
}

function savingsAmount(product: ProductDomainModel) {
  const current = Number(product.pricing.price.amount ?? "0");
  const compareAt = Number(product.pricing.compareAtPrice?.amount ?? "0");

  if (!(compareAt > current)) {
    return 0;
  }

  return compareAt - current;
}

function savingsPercent(product: ProductDomainModel) {
  const current = Number(product.pricing.price.amount ?? "0");
  const compareAt = Number(product.pricing.compareAtPrice?.amount ?? "0");

  if (!(compareAt > current && compareAt > 0)) {
    return 0;
  }

  return Math.round(((compareAt - current) / compareAt) * 100);
}

function normalizeAttributeLabel(key: string) {
  return key.replace(/[_-]/g, " ").replace(/\b\w/g, (part) => part.toUpperCase());
}

function merchantMetafieldValue(product: ProductDomainModel, key: string) {
  return product.merchantExtensions.metafields.find((metafield) => metafield.key === key)?.value;
}

function buildBadges(
  product: ProductDomainModel,
  source: ShowcaseSourceConfiguration,
  configuration: ShowcaseConfiguration,
): ShowcaseCardBadgeViewModel[] {
  if (!source.showBadges) {
    return [];
  }

  const studio = studioSettings(configuration);
  const badges: ShowcaseCardBadgeViewModel[] = [];

  if (configuration.commerce.showDiscountBadge !== false && product.pricing.discountPercentage) {
    badges.push({ label: "Sale", tone: "sale" });
  }
  if (studio.badges?.bestSeller && hasTag(product, ["best seller", "bestseller", "best-seller"])) {
    badges.push({ label: "Best seller", tone: "neutral" });
  }
  if (studio.badges?.newArrival && hasTag(product, ["new arrival", "new", "fresh drop"])) {
    badges.push({ label: "New", tone: "neutral" });
  }
  if (studio.badges?.limitedStock && product.inventory.inventoryStatus === "low_stock") {
    badges.push({ label: "Limited stock", tone: "warning" });
  }
  if (product.inventory.availableForSale === false) {
    badges.push({ label: "Sold out", tone: "muted" });
  }

  return badges;
}

function buildTrustChips(product: ProductDomainModel, configuration: ShowcaseConfiguration): ShowcaseCardTrustChipViewModel[] {
  const studio = studioSettings(configuration);
  const chips: ShowcaseCardTrustChipViewModel[] = [];

  if (studio.productInfo?.ratings && typeof product.socialProof.rating === "number") {
    let label = `★ ${product.socialProof.rating.toFixed(1)}`;
    if (studio.productInfo.reviewCount && typeof product.socialProof.reviewCount === "number" && product.socialProof.reviewCount > 0) {
      label += ` (${product.socialProof.reviewCount})`;
    }
    chips.push({ label, strong: true });
  }

  if (studio.productInfo?.deliveryPromise && product.delivery.deliveryPromise) {
    chips.push({ label: product.delivery.deliveryPromise });
  }

  if (studio.productInfo?.stockCount && typeof product.inventory.inventoryQuantity === "number") {
    chips.push({ label: `Only ${product.inventory.inventoryQuantity} left` });
  }

  return chips;
}

function buildPrice(product: ProductDomainModel, source: ShowcaseSourceConfiguration, configuration: ShowcaseConfiguration): ShowcaseCardPriceViewModel | undefined {
  if (!source.showPrice) {
    return undefined;
  }

  const currency = product.pricing.currency;
  const current = money(product.pricing.price.amount, currency);
  const compareAt = compareAtEnabled(product, configuration) && product.pricing.compareAtPrice
    ? money(product.pricing.compareAtPrice.amount, currency)
    : undefined;
  const savings = savingsAmount(product);
  const percent = savingsPercent(product);

  return {
    current,
    compareAt,
    savingsLabel: savings > 0 ? `Save ${money(String(savings), currency)}` : undefined,
    note: compareAt && percent > 0 ? `${percent}% off original price` : undefined,
  };
}

function buildMetaChips(product: ProductDomainModel, configuration: ShowcaseConfiguration) {
  const studio = studioSettings(configuration);
  const chips: string[] = [];

  if (studio.productInfo?.brand && product.identity.vendor) {
    chips.push(product.identity.vendor);
  } else if (studio.productInfo?.vendor && product.identity.vendor) {
    chips.push(product.identity.vendor);
  }
  if (studio.productInfo?.productType && product.identity.productType) {
    chips.push(product.identity.productType);
  }
  if (studio.productInfo?.collectionLabel && product.taxonomy.collections[0]?.title) {
    chips.push(product.taxonomy.collections[0].title);
  }
  if (studio.productInfo?.sellingPlan && product.commerce.sellingPlans[0]?.name) {
    chips.push(product.commerce.sellingPlans[0].name);
  }

  return chips;
}

function buildVariantOptions(product: ProductDomainModel, configuration: ShowcaseConfiguration): ShowcaseCardVariantOptionViewModel[] {
  const studio = studioSettings(configuration);
  const maxVisible = Math.max(Number(studio.maxVisibleVariants ?? 4), 1);

  return (product.commerce.optionValues ?? [])
    .slice(0, maxVisible)
    .map(
      (option): ShowcaseCardVariantOptionViewModel => ({
        label: option.value,
        swatchColor: option.swatch?.color,
      }),
    );
}

function buildDetailLines(product: ProductDomainModel, configuration: ShowcaseConfiguration) {
  const studio = studioSettings(configuration);
  const lines: string[] = [];
  const firstVariant = product.commerce.variants[0];

  if (studio.productInfo?.deliveryPromise && product.delivery.deliveryPromise) {
    lines.push(product.delivery.deliveryPromise);
  }
  if (studio.productInfo?.pickupAvailability && product.commerce.pickupAvailability[0]?.pickupTime) {
    lines.push(product.commerce.pickupAvailability[0].pickupTime);
  } else if (studio.productInfo?.pickupAvailability) {
    const pickupValue = merchantMetafieldValue(product, "pickup_availability");
    if (pickupValue) {
      lines.push(pickupValue);
    }
  }
  if (studio.productInfo?.localDelivery) {
    const localDeliveryValue = merchantMetafieldValue(product, "local_delivery");
    if (localDeliveryValue) {
      lines.push(localDeliveryValue);
    }
  }
  if (studio.productInfo?.stockStatus && product.inventory.inventoryStatus) {
    lines.push(product.inventory.inventoryStatus.replace(/_/g, " ").replace(/\b\w/g, (part) => part.toUpperCase()));
  }
  if (studio.productInfo?.stockCount && typeof product.inventory.inventoryQuantity === "number") {
    lines.push(`${product.inventory.inventoryQuantity} in stock`);
  }
  if (studio.productInfo?.sku && firstVariant?.sku) {
    lines.push(`SKU ${firstVariant.sku}`);
  }
  if (studio.productInfo?.variantCount && product.commerce.variants.length) {
    lines.push(`${product.commerce.variants.length} variants`);
  }
  if (studio.productInfo?.sellingPlan && product.commerce.sellingPlans[0]?.plans[0]?.name) {
    lines.push(product.commerce.sellingPlans[0].plans[0].name);
  }
  if (studio.productInfo?.unitPricing) {
    const unitPricingValue = merchantMetafieldValue(product, "unit_pricing");
    if (unitPricingValue) {
      lines.push(unitPricingValue);
    }
  }

  return lines;
}

function buildAttributes(product: ProductDomainModel, configuration: ShowcaseConfiguration): ShowcaseCardAttributeViewModel[] {
  const studio = studioSettings(configuration);
  const enabled = new Set(studio.enabledMetafields ?? []);
  const limit = Math.max(Number(studio.customAttributeLimit ?? 0), 0);

  return product.merchantExtensions.metafields
    .filter((metafield) => enabled.has(metafield.id ?? `${metafield.namespace}-${metafield.key}`))
    .slice(0, limit)
    .map((metafield) => ({
      label: normalizeAttributeLabel(metafield.key),
      value: metafield.value,
    }));
}

export function buildShowcaseCardViewModels(
  products: ProductDomainModel[],
  source: ShowcaseSourceConfiguration,
  configuration: ShowcaseConfiguration,
): ShowcaseCardViewModel[] {
  const studio = studioSettings(configuration);

  return products.map((product) => ({
    productHandle: product.identity.handle,
    title: studio.showcaseStyle === "Bold" ? compactTitle(product.identity.title).toUpperCase() : product.identity.title,
    subtitle: subtitleForProduct(product) || undefined,
    eyebrow: studio.productInfo?.brand || studio.productInfo?.vendor ? product.identity.vendor : undefined,
    featuredImageUrl: product.media.featuredImage?.url,
    secondaryImageUrl: source.showSecondaryImage ? product.media.galleryImages[1]?.url : undefined,
    imageAlt: product.media.featuredImage?.alt ?? product.identity.title,
    badges: buildBadges(product, source, configuration),
    trustChips: buildTrustChips(product, configuration),
    price: buildPrice(product, source, configuration),
    metaChips: buildMetaChips(product, configuration),
    variantDisplay: studio.variantDisplay,
    variantOptions: buildVariantOptions(product, configuration),
    detailLines: buildDetailLines(product, configuration),
    attributes: buildAttributes(product, configuration),
    stockMeter:
      studio.productInfo?.stockCount && typeof product.inventory.inventoryQuantity === "number" && product.inventory.inventoryQuantity > 0
        ? {
            label: `Only ${product.inventory.inventoryQuantity} left`,
            activeBars: Math.max(1, Math.min(6, Math.round(product.inventory.inventoryQuantity / 5))),
            totalBars: 6,
          }
        : undefined,
    ctaLabel:
      configuration.cta.labelOverrides?.view_product ??
      source.ctaLabel ??
      "Shop now",
    secondaryCtaLabel: studio.secondaryCtaEnabled ? studio.secondaryCtaText || "Quick View" : undefined,
    assurance: ["Fast shipping", "Easy returns", "Secure checkout"],
  }));
}
