import { useEffect, useState } from "react";
import type { ProductDomainModel } from "../../shared/contracts";
import { fetchProductCatalog } from "../services/productCatalog";

export function useShowcaseProducts() {
  const [products, setProducts] = useState<ProductDomainModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setIsLoading(true);
        const data = await fetchProductCatalog();
        if (!cancelled) {
          setProducts(data.map((entry) => entry.product));
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load products");
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, isLoading, error };
}
