import type {
  ProductProjectionDto,
  ShowcaseConfiguration,
  ShowcaseInstanceDetailDto,
  ShowcaseInstanceSummaryDto,
  ShowcaseRuntimeDto,
  UpdateShowcaseConfigurationDto,
  UpdateShowcaseSourceDto,
} from "../../shared/contracts";
import { ShowcaseInstanceModel, StoreModel, ThemeConfigurationModel } from "../repositories/models";
import { HttpError } from "../utils/http-error";
import { getProductCatalog } from "./product-catalog.service";
import { env } from "../config/env";
import { adminCollectionProductsQuery } from "../shopify/admin/queries";
import { shopifyAdminGraphQL } from "../shopify/admin/admin-client";
import { normalizeAdminProducts } from "../shopify/admin/product-normalizer";
import { buildShowcaseCardViewModels } from "../../shared/helpers/showcase-card-view-model";

type AdminCollectionProductsPayload = {
  collections: {
    nodes: Array<{
      id: string;
      handle: string;
      title: string;
      products: {
        nodes: Array<Record<string, unknown>>;
      };
    }>;
  };
};

async function resolveStoreForShop(shop: string) {
  const store = await StoreModel.findOne({ shop });
  if (!store) {
    throw new HttpError(404, "No Shopify store installation found for this shop", { shop });
  }
  return store;
}

async function getThemeConfiguration(themeConfigurationId?: string) {
  if (!themeConfigurationId) {
    return undefined;
  }

  return ThemeConfigurationModel.findById(themeConfigurationId);
}

async function getCollectionProducts(shop: string, collectionHandle: string, limit: number): Promise<ProductProjectionDto[]> {
  const data = await shopifyAdminGraphQL<AdminCollectionProductsPayload>(
    adminCollectionProductsQuery,
    {
      first: limit,
      query: `handle:${collectionHandle}`,
    },
    { shop },
  );

  const collection = data.collections.nodes[0];
  if (!collection) {
    return [];
  }

  return normalizeAdminProducts({
    products: {
      nodes: collection.products.nodes,
    },
  });
}

export async function listShowcaseInstancesForShop(shop: string): Promise<ShowcaseInstanceSummaryDto[]> {
  const store = await resolveStoreForShop(shop);
  const instances = await ShowcaseInstanceModel.find({
    merchantId: store.merchantId,
    storeId: store.id,
  }).sort({ updatedAt: -1 });

  const themeConfigurations = await ThemeConfigurationModel.find({
    merchantId: store.merchantId,
    storeId: store.id,
  });

  const themeConfigMap = new Map(themeConfigurations.map((entry) => [String(entry.id), entry]));

  return instances.map((instance) => ({
    instance,
    themeConfiguration: instance.themeConfigurationId ? themeConfigMap.get(instance.themeConfigurationId) : undefined,
  }));
}

export async function getShowcaseInstanceDetail(instanceId: string): Promise<ShowcaseInstanceDetailDto> {
  const instance = await ShowcaseInstanceModel.findOne({ instanceId });
  if (!instance) {
    throw new HttpError(404, "Showcase instance not found", { instanceId });
  }

  return {
    instance,
    themeConfiguration: await getThemeConfiguration(instance.themeConfigurationId),
  };
}

export async function updateShowcaseSource(input: UpdateShowcaseSourceDto) {
  const instance = await ShowcaseInstanceModel.findOne({ instanceId: input.instanceId });
  if (!instance) {
    throw new HttpError(404, "Showcase instance not found", { instanceId: input.instanceId });
  }

  const currentConfiguration = instance.configuration ?? {};
  const nextSource = {
    ...(currentConfiguration.source ?? {}),
    ...input.source,
  };

  instance.configuration = {
    ...currentConfiguration,
    source: nextSource,
  };
  instance.version = (instance.version ?? 1) + 1;
  await instance.save();

  return {
    instance,
    themeConfiguration: await getThemeConfiguration(instance.themeConfigurationId),
  } satisfies ShowcaseInstanceDetailDto;
}

export async function updateShowcaseConfiguration(input: UpdateShowcaseConfigurationDto) {
  const instance = await ShowcaseInstanceModel.findOne({ instanceId: input.instanceId });
  if (!instance) {
    throw new HttpError(404, "Showcase instance not found", { instanceId: input.instanceId });
  }

  const currentConfiguration = (instance.configuration ?? {}) as ShowcaseConfiguration;
  instance.configuration = {
    ...currentConfiguration,
    ...input.configuration,
  };
  instance.version = (instance.version ?? 1) + 1;
  await instance.save();

  return {
    instance,
    themeConfiguration: await getThemeConfiguration(instance.themeConfigurationId),
  } satisfies ShowcaseInstanceDetailDto;
}

export async function getShowcaseRuntime(instanceId: string, shop?: string): Promise<ShowcaseRuntimeDto> {
  const instance = await ShowcaseInstanceModel.findOne({ instanceId });
  if (!instance) {
    throw new HttpError(404, "Showcase instance not found", { instanceId });
  }

  const store = await StoreModel.findById(instance.storeId);
  if (!store) {
    throw new HttpError(404, "Store for showcase instance not found", { instanceId, storeId: instance.storeId });
  }

  const resolvedShop = shop ?? store.shop;
  const source = instance.configuration?.source;
  if (!source) {
    throw new HttpError(400, "Showcase instance source configuration is missing", { instanceId });
  }

  const productPayload =
    source.collectionHandle
      ? await getCollectionProducts(resolvedShop, source.collectionHandle, source.productsToShow)
      : await getProductCatalog(Math.min(source.productsToShow, env.SHOPIFY_PRODUCT_LIMIT), env.SHOPIFY_PRODUCT_QUERY, resolvedShop);
  const products = productPayload.map((entry) => entry.product);

  return {
    instanceId: instance.instanceId,
    placementKey: instance.placement?.placementKey ?? instance.themeConfigurationId ?? instance.instanceId,
    source,
    theme: instance.configuration.theme,
    configuration: instance.configuration,
    products,
    cardModels: buildShowcaseCardViewModels(products, source, instance.configuration),
    themeConfiguration: await getThemeConfiguration(instance.themeConfigurationId),
  };
}
