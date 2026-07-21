import { useEffect, useState } from "react";
import type { ShowcaseInstanceSummaryDto } from "../../shared/contracts";
import { fetchShowcaseInstances } from "../services/showcaseInstances";

export function useShowcaseInstances() {
  const [instances, setInstances] = useState<ShowcaseInstanceSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setIsLoading(true);
      const data = await fetchShowcaseInstances();
      setInstances(data);
      setError(null);
    } catch (loadError) {
      setInstances([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load showcase instances");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { instances, isLoading, error, refresh, setInstances };
}
