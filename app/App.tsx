import ProductShowcaseStudio from "./pages/ProductShowcaseStudio";
import ShopifyWorkspacePage from "./pages/ShopifyWorkspace";

function hasShopifyContext() {
  if (typeof window === "undefined") {
    return false;
  }

  const search = new URLSearchParams(window.location.search);
  return search.has("shop");
}

export default function App() {
  return hasShopifyContext() ? <ShopifyWorkspacePage /> : <ProductShowcaseStudio />;
}
