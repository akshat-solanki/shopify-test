import type { Request, Response } from "express";
import { z } from "zod";
import {
  updateShowcaseConfiguration,
  getShowcaseInstanceDetail,
  getShowcaseRuntime,
  listShowcaseInstancesForShop,
  updateShowcaseSource,
} from "../services/showcase-instance.service";

const shopQuerySchema = z.object({
  shop: z.string().min(1, "shop is required"),
});

const instanceParamSchema = z.object({
  instanceId: z.string().min(1, "instanceId is required"),
});

const updateSourceSchema = z.object({
  collectionHandle: z.string().trim().optional(),
  heading: z.string().trim().optional(),
  subheading: z.string().trim().optional(),
  productsToShow: z.number().int().min(1).max(24).optional(),
  layout: z.enum(["grid", "carousel", "spotlight"]).optional(),
  ctaLabel: z.string().trim().optional(),
  showVendor: z.boolean().optional(),
  showPrice: z.boolean().optional(),
  showBadges: z.boolean().optional(),
  showSecondaryImage: z.boolean().optional(),
});

const updateConfigurationSchema = z.object({
  configuration: z.any(),
});

export async function listShowcaseInstancesController(request: Request, response: Response) {
  const { shop } = shopQuerySchema.parse(request.query);
  const instances = await listShowcaseInstancesForShop(shop);

  response.json({
    data: instances,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function getShowcaseInstanceController(request: Request, response: Response) {
  const { instanceId } = instanceParamSchema.parse(request.params);
  const instance = await getShowcaseInstanceDetail(instanceId);

  response.json({
    data: instance,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function updateShowcaseSourceController(request: Request, response: Response) {
  const { instanceId } = instanceParamSchema.parse(request.params);
  const source = updateSourceSchema.parse(request.body);
  const instance = await updateShowcaseSource({ instanceId, source });

  response.json({
    data: instance,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function updateShowcaseConfigurationController(request: Request, response: Response) {
  const { instanceId } = instanceParamSchema.parse(request.params);
  const { configuration } = updateConfigurationSchema.parse(request.body);
  const instance = await updateShowcaseConfiguration({ instanceId, configuration });

  response.json({
    data: instance,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function getShowcaseRuntimeController(request: Request, response: Response) {
  const { instanceId } = instanceParamSchema.parse(request.params);
  const { shop } = z.object({ shop: z.string().optional() }).parse(request.query);
  const runtime = await getShowcaseRuntime(instanceId, shop);

  response.json({
    data: runtime,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}
