import type {
  MoneyAmount,
  ProductCollectionReference,
  ProductDomainModel,
  ProductImageMedia,
  ProductProjectionDto,
  ProductVariantModel,
} from "../../../shared/contracts";

type AdminProductResponse = {
  products: {
    nodes: Array<Record<string, any>>;
  };
};

function money(amount?: string, currency = "USD"): MoneyAmount {
  return {
    amount: amount ?? "0",
    currency,
  };
}

function toImageMedia(image?: Record<string, any> | null): ProductImageMedia | undefined {
  if (!image?.url) return undefined;
  return {
    id: image.id ?? image.url,
    type: "image",
    url: image.url,
    alt: image.altText ?? "",
    width: image.width ?? undefined,
    height: image.height ?? undefined,
  };
}

function toRatingValue(value?: string) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function productMetafield(product: Record<string, any>, namespace: string, key: string) {
  const directFields = [
    product.reviewsRating,
    product.reviewsRatingCount,
    product.deliveryPromise,
    product.shortDescription,
    product.pickupAvailabilityInfo,
    product.localDeliveryInfo,
    product.unitPricingInfo,
  ].filter(Boolean);

  return directFields.find((metafield: Record<string, any>) => metafield?.namespace === namespace && metafield?.key === key);
}

function inventoryStatus(quantity?: number, availableForSale?: boolean): ProductDomainModel["inventory"]["inventoryStatus"] {
  if (!availableForSale || quantity === 0) return "out_of_stock";
  if (typeof quantity === "number" && quantity <= 5) return "low_stock";
  return "in_stock";
}

export function normalizeAdminProducts(
  payload: AdminProductResponse,
): ProductProjectionDto[] {
  return payload.products.nodes.map((product) => {
    const featuredImage = toImageMedia(product.featuredImage);
    const imageNodes = (product.images?.nodes ?? [])
      .map((image: Record<string, any>) => toImageMedia(image))
      .filter(Boolean) as ProductImageMedia[];
    const mediaNodes: ProductDomainModel["media"]["media"] = (product.media?.nodes ?? []).flatMap((media: Record<string, any>) => {
      if (media.mediaContentType === "IMAGE" && media.image?.url) {
        return [
          {
            id: media.id,
            type: "image" as const,
            url: media.image.url,
            alt: media.image.altText ?? "",
            width: media.image.width ?? undefined,
            height: media.image.height ?? undefined,
          },
        ];
      }

      if (media.mediaContentType === "VIDEO") {
        return [
          {
            id: media.id,
            type: "video" as const,
            alt: "",
            previewImage: toImageMedia(media.preview?.image),
            sources: (media.sources ?? []).map((source: Record<string, any>) => ({
              mimeType: source.mimeType,
              url: source.url,
            })),
          },
        ];
      }

      if (media.mediaContentType === "EXTERNAL_VIDEO") {
        return [
          {
            id: media.id,
            type: "external_video" as const,
            alt: "",
            embedUrl: media.embeddedUrl,
            host: String(media.host ?? "other").toLowerCase(),
            previewImage: toImageMedia(media.previewImage),
          },
        ];
      }

      if (media.mediaContentType === "MODEL_3D") {
        return [
          {
            id: media.id,
            type: "model_3d" as const,
            alt: "",
            previewImage: toImageMedia(media.preview?.image),
            sources: (media.sources ?? []).map((source: Record<string, any>) => ({
              mimeType: source.mimeType,
              url: source.url,
            })),
          },
        ];
      }

      return [];
    });

    const variants = (product.variants?.nodes ?? []).map((variant: Record<string, any>): ProductVariantModel => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku ?? undefined,
      barcode: variant.barcode ?? undefined,
      availableForSale: Boolean(variant.availableForSale),
      price: money(variant.price, product.priceRangeV2?.minVariantPrice?.currencyCode ?? "USD"),
      compareAtPrice: variant.compareAtPrice ? money(variant.compareAtPrice, product.priceRangeV2?.minVariantPrice?.currencyCode ?? "USD") : undefined,
      image: toImageMedia(variant.image),
      selectedOptions: (variant.selectedOptions ?? []).map((option: Record<string, any>) => ({
        name: option.name,
        value: option.value,
      })),
      inventoryQuantity: variant.inventoryQuantity ?? undefined,
      requiresComponents: variant.requiresComponents ?? false,
    }));

    const collections = (product.collections?.nodes ?? []).map(
      (collection: Record<string, any>): ProductCollectionReference => ({
        id: collection.id,
        handle: collection.handle ?? undefined,
        title: collection.title,
      }),
    );

    const minPrice = product.priceRangeV2?.minVariantPrice;
    const maxPrice = product.priceRangeV2?.maxVariantPrice;
    const minCompare = product.compareAtPriceRange?.minVariantCompareAtPrice;
    const maxCompare = product.compareAtPriceRange?.maxVariantCompareAtPrice;
    const basePrice = Number.parseFloat(minPrice?.amount ?? "0");
    const baseCompare = Number.parseFloat(minCompare?.amount ?? "0");
    const discountPercentage =
      baseCompare > basePrice ? Math.round(((baseCompare - basePrice) / baseCompare) * 100) : undefined;

    const ratingMetafield = productMetafield(product, "reviews", "rating");
    const ratingCountMetafield = productMetafield(product, "reviews", "rating_count");
    const deliveryMetafield = productMetafield(product, "custom", "delivery_promise");
    const shortDescriptionMetafield = productMetafield(product, "custom", "short_description");
    const pickupAvailabilityMetafield = productMetafield(product, "custom", "pickup_availability");
    const unitPricingMetafield = productMetafield(product, "custom", "unit_pricing");

    const normalized: ProductDomainModel = {
      identity: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productType: product.productType,
      },
      pricing: {
        price: money(minPrice?.amount, minPrice?.currencyCode),
        compareAtPrice: minCompare?.amount ? money(minCompare.amount, minCompare.currencyCode) : undefined,
        discountPercentage,
        currency: minPrice?.currencyCode ?? "USD",
        priceRange: {
          min: money(minPrice?.amount, minPrice?.currencyCode),
          max: money(maxPrice?.amount, maxPrice?.currencyCode),
        },
        compareAtPriceRange: minCompare?.amount && maxCompare?.amount
          ? {
              min: money(minCompare.amount, minCompare.currencyCode),
              max: money(maxCompare.amount, maxCompare.currencyCode),
            }
          : undefined,
      },
      media: {
        featuredImage,
        galleryImages: imageNodes,
        videos: mediaNodes.filter((media): media is ProductDomainModel["media"]["videos"][number] => media.type === "video"),
        media: mediaNodes,
        models3d: mediaNodes.filter((media): media is ProductDomainModel["media"]["models3d"][number] => media.type === "model_3d"),
      },
      inventory: {
        availableForSale: variants.some((variant: ProductVariantModel) => variant.availableForSale),
        inventoryQuantity: product.totalInventory ?? undefined,
        inventoryStatus: inventoryStatus(
          product.totalInventory ?? undefined,
          variants.some((variant: ProductVariantModel) => variant.availableForSale),
        ),
      },
      commerce: {
        variants,
        options: (product.options ?? []).map((option: Record<string, any>) => ({
          id: option.id ?? undefined,
          name: option.name,
          values: (option.optionValues ?? []).map((value: Record<string, any>) => ({
            optionName: option.name,
            value: value.name,
            swatch: value.swatch
              ? {
                  color: value.swatch.color ?? undefined,
                }
              : undefined,
          })),
        })),
        optionValues: (product.options ?? []).flatMap((option: Record<string, any>) =>
          (option.optionValues ?? []).map((value: Record<string, any>) => ({
            optionName: option.name,
            value: value.name,
            swatch: value.swatch
              ? {
                  color: value.swatch.color ?? undefined,
                }
              : undefined,
          })),
        ),
        sellingPlans: (product.sellingPlanGroups?.nodes ?? []).map((group: Record<string, any>) => ({
          id: group.id,
          name: group.name,
          options: (group.options ?? []).map((option: string) => ({
            name: "Option",
            values: [option],
          })),
          plans: (group.sellingPlans?.nodes ?? []).map((plan: Record<string, any>) => ({
            id: plan.id,
            name: plan.name,
            description: plan.description ?? undefined,
          })),
        })),
        bundles: (product.bundleComponents?.nodes ?? []).map((component: Record<string, any>) => ({
          productId: component.componentProduct?.id ?? undefined,
          title: component.componentProduct?.title ?? "Bundle component",
          quantity: component.quantity ?? undefined,
        })),
        pickupAvailability: pickupAvailabilityMetafield?.value
          ? [
              {
                locationId: "custom-pickup",
                locationName: "Store pickup",
                available: true,
                pickupTime: pickupAvailabilityMetafield.value,
              },
            ]
          : [],
      },
      socialProof: {
        rating: toRatingValue(ratingMetafield?.value),
        reviewCount: ratingCountMetafield?.value ? Number.parseInt(ratingCountMetafield.value, 10) : undefined,
      },
      taxonomy: {
        collections,
        tags: product.tags ?? [],
        category: product.category?.fullName ?? undefined,
      },
      merchantExtensions: {
        metafields: [
          product.reviewsRating,
          product.reviewsRatingCount,
          product.deliveryPromise,
          product.shortDescription,
          product.pickupAvailabilityInfo,
          product.localDeliveryInfo,
          product.unitPricingInfo,
        ]
          .filter(Boolean)
          .map((metafield: Record<string, any>) => ({
          id: metafield.id ?? undefined,
          namespace: metafield.namespace,
          key: metafield.key,
          type: metafield.type ?? undefined,
          value: metafield.value,
        })),
      },
      seo: {
        seoTitle: product.seo?.title ?? undefined,
        seoDescription: product.seo?.description ?? undefined,
      },
      descriptions: {
        description: product.description ?? undefined,
        shortDescription: shortDescriptionMetafield?.value ?? undefined,
      },
      delivery: {
        deliveryPromise: deliveryMetafield?.value ?? undefined,
      },
      rawReferences: {
        product: {
          shopifyId: product.id,
          adminGraphqlApiId: product.id,
          handle: product.handle,
        },
        variants: variants.map((variant: ProductVariantModel) => ({
          shopifyId: variant.id,
          adminGraphqlApiId: variant.id,
        })),
      },
    };

    return {
      product: normalized,
      source: "shopify_admin_api",
      fetchedAt: new Date().toISOString(),
    };
  });
}
