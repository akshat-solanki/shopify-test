import type {
  ApiResponse,
  ShowcaseConfiguration,
  ShowcaseInstanceDetailDto,
  ShowcaseInstanceSummaryDto,
  ShowcaseSourceConfiguration,
} from "../../shared/contracts";

function resolveShopParam() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("shop");
}

export async function fetchShowcaseInstances() {
  const shop = resolveShopParam();
  if (!shop) {
    throw new Error("Missing shop query parameter");
  }

  const response = await fetch(`/api/showcase/instances?shop=${encodeURIComponent(shop)}`);
  if (!response.ok) {
    throw new Error(`Unable to load showcase instances (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<ShowcaseInstanceSummaryDto[]>;
  return payload.data;
}

export async function updateShowcaseInstanceSource(instanceId: string, source: Partial<ShowcaseSourceConfiguration>) {
  const response = await fetch(`/api/showcase/instances/${encodeURIComponent(instanceId)}/source`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(source),
  });

  if (!response.ok) {
    throw new Error(`Unable to update showcase instance (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<ShowcaseInstanceDetailDto>;
  return payload.data;
}

export async function updateShowcaseInstanceConfiguration(instanceId: string, configuration: Partial<ShowcaseConfiguration>) {
  const response = await fetch(`/api/showcase/instances/${encodeURIComponent(instanceId)}/configuration`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ configuration }),
  });

  if (!response.ok) {
    throw new Error(`Unable to update showcase configuration (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<ShowcaseInstanceDetailDto>;
  return payload.data;
}
