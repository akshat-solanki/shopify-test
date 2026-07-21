import crypto from "node:crypto";
import type { ShopifyOnboardingBootstrapDto, SurfaceType, ThemeTarget } from "../../shared/contracts";
import {
  ShowcaseModel,
  ShowcaseInstanceModel,
  StoreModel,
  ThemeConfigurationModel,
} from "../repositories/models";
import { HttpError } from "../utils/http-error";
import { DEFAULT_SHOWCASE_CONFIGURATION } from "../showcase/default-showcase-configuration";

type BootstrapInput = {
  shop: string;
  themeId?: string;
  target?: ThemeTarget;
  surface?: SurfaceType;
};

export async function bootstrapShowcaseForThemeEditor(input: BootstrapInput): Promise<ShopifyOnboardingBootstrapDto> {
  const store = await StoreModel.findOne({ shop: input.shop });
  if (!store) {
    throw new HttpError(404, "No Shopify store installation found for this shop", { shop: input.shop });
  }

  let showcase = await ShowcaseModel.findOne({
    merchantId: store.merchantId,
    storeId: store.id,
    name: "Primary product showcase",
  });

  if (!showcase) {
    showcase = await ShowcaseModel.create({
      merchantId: store.merchantId,
      storeId: store.id,
      name: "Primary product showcase",
      description: "Default showcase used for theme editor onboarding and first block placements.",
      status: "draft",
      latestVersion: 1,
    });
  }

  const instanceId = crypto.randomUUID();
  const placementKey = `theme-editor:${input.themeId ?? "current"}:${instanceId}`;

  const themeConfiguration = await ThemeConfigurationModel.create({
    merchantId: store.merchantId,
    storeId: store.id,
    target: input.target ?? "theme_extension",
    themeId: input.themeId,
    blockHandle: "product-showcase",
    placementKey,
    published: false,
    settingsSchemaVersion: 1,
  });

  const instance = await ShowcaseInstanceModel.create({
    instanceId,
    merchantId: store.merchantId,
    storeId: store.id,
    showcaseId: showcase.id,
    configuration: DEFAULT_SHOWCASE_CONFIGURATION,
    version: 1,
    status: "draft",
    placement: {
      surface: input.surface ?? "grid",
      target: input.target ?? "theme_extension",
      themeId: input.themeId,
      placementKey,
    },
    themeConfigurationId: themeConfiguration.id,
  });

  return {
    showcase,
    instance,
    themeConfiguration,
  };
}
