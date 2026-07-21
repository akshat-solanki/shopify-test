const adminProductFields = `
  id
  handle
  title
  vendor
  productType
  description
  featuredImage {
    id
    url
    altText
    width
    height
  }
  images(first: 10) {
    nodes {
      id
      url
      altText
      width
      height
    }
  }
  media(first: 10) {
    nodes {
      mediaContentType
      ... on MediaImage {
        id
        image {
          id
          url
          altText
          width
          height
        }
      }
      ... on Video {
        id
        preview {
          image {
            id
            url
            altText
            width
            height
          }
        }
        sources {
          mimeType
          url
        }
      }
      ... on ExternalVideo {
        id
        host
        embeddedUrl
      }
      ... on Model3d {
        id
        preview {
          image {
            id
            url
            altText
            width
            height
          }
        }
        sources {
          mimeType
          url
        }
      }
    }
  }
  collections(first: 10) {
    nodes {
      id
      handle
      title
    }
  }
  tags
  totalInventory
  category {
    fullName
  }
  seo {
    title
    description
  }
  options {
    id
    name
    optionValues {
      name
      swatch {
        color
      }
    }
  }
  priceRangeV2 {
    minVariantPrice {
      amount
      currencyCode
    }
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  compareAtPriceRange {
    minVariantCompareAtPrice {
      amount
      currencyCode
    }
    maxVariantCompareAtPrice {
      amount
      currencyCode
    }
  }
  reviewsRating: metafield(namespace: "reviews", key: "rating") {
    id
    namespace
    key
    type
    value
  }
  reviewsRatingCount: metafield(namespace: "reviews", key: "rating_count") {
    id
    namespace
    key
    type
    value
  }
  deliveryPromise: metafield(namespace: "custom", key: "delivery_promise") {
    id
    namespace
    key
    type
    value
  }
  shortDescription: metafield(namespace: "custom", key: "short_description") {
    id
    namespace
    key
    type
    value
  }
  pickupAvailabilityInfo: metafield(namespace: "custom", key: "pickup_availability") {
    id
    namespace
    key
    type
    value
  }
  localDeliveryInfo: metafield(namespace: "custom", key: "local_delivery") {
    id
    namespace
    key
    type
    value
  }
  unitPricingInfo: metafield(namespace: "custom", key: "unit_pricing") {
    id
    namespace
    key
    type
    value
  }
  sellingPlanGroups(first: 10) {
    nodes {
      id
      name
      options
      sellingPlans(first: 10) {
        nodes {
          id
          name
          description
        }
      }
    }
  }
  bundleComponents(first: 10) {
    nodes {
      quantity
      componentProduct {
        id
        title
      }
    }
  }
  variants(first: 25) {
    nodes {
      id
      title
      sku
      barcode
      availableForSale
      inventoryQuantity
      price
      compareAtPrice
      requiresComponents
      selectedOptions {
        name
        value
      }
      image {
        id
        url
        altText
        width
        height
      }
    }
  }
`;

export const adminProductsQuery = `#graphql
  query GetProducts($first: Int!, $query: String!) {
    products(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ${adminProductFields}
      }
    }
  }
`;

export const adminCollectionProductsQuery = `#graphql
  query GetCollectionProducts($first: Int!, $query: String!) {
    collections(first: 1, query: $query) {
      nodes {
        id
        handle
        title
        products(first: $first) {
          nodes {
            ${adminProductFields}
          }
        }
      }
    }
  }
`;

export const adminThemesQuery = `#graphql
  query GetThemes {
    themes(first: 20) {
      nodes {
        id
        name
        role
        processing
      }
    }
  }
`;
