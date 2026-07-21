import { useEffect, useState } from "react";
import type { ShopifyThemeSummary } from "../../shared/contracts";
import { fetchShopifyThemes } from "../services/shopifyThemes";

export function useShopifyThemes() {
  const [themes, setThemes] = useState<ShopifyThemeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadThemes() {
      try {
        setIsLoading(true);
        const data = await fetchShopifyThemes();
        if (!cancelled) {
          setThemes(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setThemes([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load themes");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadThemes();
    return () => {
      cancelled = true;
    };
  }, []);

  return { themes, isLoading, error };
}
