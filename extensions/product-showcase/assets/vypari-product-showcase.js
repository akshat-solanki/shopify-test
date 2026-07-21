(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatMoney(pricing) {
    if (!pricing || !pricing.price) {
      return "";
    }

    const amount = Number(pricing.price.amount || 0);
    const currency = pricing.currency || pricing.price.currency || "USD";

    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(amount);
    } catch (_error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function ctaLabel(source, configuration) {
    return (
      (configuration &&
        configuration.cta &&
        configuration.cta.labelOverrides &&
        configuration.cta.labelOverrides.view_product) ||
      source.ctaLabel ||
      "Shop now"
    );
  }

  function studioSettings(configuration) {
    return (configuration && configuration.studio) || {};
  }

  function normalizeSetting(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
  }

  function optionValues(product) {
    return (product.commerce && Array.isArray(product.commerce.optionValues) ? product.commerce.optionValues : []).filter(Boolean);
  }

  function variants(product) {
    return (product.commerce && Array.isArray(product.commerce.variants) ? product.commerce.variants : []).filter(Boolean);
  }

  function selectedMetafields(product, configuration) {
    const studio = studioSettings(configuration);
    const enabled = Array.isArray(studio.enabledMetafields) ? studio.enabledMetafields : [];
    const limit = Number(studio.customAttributeLimit || 0) || 0;
    const metafields =
      product.merchantExtensions && Array.isArray(product.merchantExtensions.metafields)
        ? product.merchantExtensions.metafields
        : [];

    return metafields
      .filter(function (metafield) {
        const id = metafield && (metafield.id || `${metafield.namespace}-${metafield.key}`);
        return id && enabled.includes(id);
      })
      .slice(0, Math.max(limit, 0));
  }

  function inventoryStatusLabel(product) {
    const raw = product.inventory && product.inventory.inventoryStatus;
    if (!raw) {
      return "";
    }
    return String(raw)
      .replace(/_/g, " ")
      .replace(/\b\w/g, function (part) {
        return part.toUpperCase();
      });
  }

  function compactTitle(value) {
    const text = String(value || "").trim();
    if (text.length <= 28) {
      return text;
    }

    return `${text.split(/\s+/).slice(0, 3).join(" ")}`.trim();
  }

  function productSubtitle(product) {
    if (product.descriptions && product.descriptions.shortDescription) {
      return product.descriptions.shortDescription;
    }

    const vendor = product.identity && product.identity.vendor ? product.identity.vendor : "";
    const productType = product.identity && product.identity.productType ? product.identity.productType : "";
    return [vendor, productType].filter(Boolean).join(" ");
  }

  function resolvedPriceNumber(product) {
    return Number((product.pricing && product.pricing.price && product.pricing.price.amount) || 0);
  }

  function resolvedCompareAtNumber(product) {
    return Number((product.pricing && product.pricing.compareAtPrice && product.pricing.compareAtPrice.amount) || 0);
  }

  function savingsPercent(product) {
    const price = resolvedPriceNumber(product);
    const compare = resolvedCompareAtNumber(product);

    if (!(compare > price && compare > 0)) {
      return 0;
    }

    return Math.round(((compare - price) / compare) * 100);
  }

  function savingsAmount(product) {
    const price = resolvedPriceNumber(product);
    const compare = resolvedCompareAtNumber(product);

    if (!(compare > price)) {
      return 0;
    }

    return compare - price;
  }

  function tagList(product) {
    return product.taxonomy && Array.isArray(product.taxonomy.tags) ? product.taxonomy.tags.map(function (tag) {
      return String(tag || "").toLowerCase();
    }) : [];
  }

  function hasTag(product, terms) {
    const tags = tagList(product);
    return terms.some(function (term) {
      const value = String(term).toLowerCase();
      return tags.some(function (tag) {
        return tag.includes(value);
      });
    });
  }

  function shouldShowCompareAt(product, configuration) {
    if (configuration && configuration.commerce && configuration.commerce.showCompareAtPrice === false) {
      return false;
    }
    return Boolean(product.pricing && product.pricing.compareAtPrice);
  }

  function shouldShowSaleBadge(product, source, configuration) {
    if (!source.showBadges) {
      return false;
    }
    if (configuration && configuration.commerce && configuration.commerce.showDiscountBadge === false) {
      return false;
    }
    return Boolean(product.pricing && product.pricing.discountPercentage);
  }

  function ratingMarkup(product, configuration) {
    const commerce = configuration && configuration.commerce ? configuration.commerce : {};
    const rating = product.socialProof && product.socialProof.rating;
    const reviewCount = product.socialProof && product.socialProof.reviewCount;
    const showRating = commerce.showRating !== false && typeof rating === "number";
    const showReviewCount = commerce.showReviewCount !== false && typeof reviewCount === "number";

    if (!showRating && !showReviewCount) {
      return "";
    }

    return `<div class="vypari-showcase__trust">
      ${showRating ? `<span class="vypari-showcase__rating">★ ${escapeHtml(Number(rating).toFixed(1))}</span>` : ""}
      ${showReviewCount ? `<span class="vypari-showcase__reviews">(${escapeHtml(String(reviewCount))})</span>` : ""}
    </div>`;
  }

  function trustChipsMarkup(product, configuration) {
    const studio = studioSettings(configuration);
    const productInfo = studio.productInfo || {};
    const chips = [];

    if (productInfo.ratings && product.socialProof && typeof product.socialProof.rating === "number") {
      let label = `★ ${Number(product.socialProof.rating).toFixed(1)}`;
      if (productInfo.reviewCount && typeof product.socialProof.reviewCount === "number" && product.socialProof.reviewCount > 0) {
        label += ` (${product.socialProof.reviewCount})`;
      }
      chips.push(`<span class="vypari-showcase__trust-chip vypari-showcase__trust-chip--strong">${escapeHtml(label)}</span>`);
    }

    if (productInfo.deliveryPromise && product.delivery && product.delivery.deliveryPromise) {
      chips.push(`<span class="vypari-showcase__trust-chip">${escapeHtml(product.delivery.deliveryPromise)}</span>`);
    }

    if (productInfo.stockCount && product.inventory && typeof product.inventory.inventoryQuantity === "number") {
      chips.push(`<span class="vypari-showcase__trust-chip">${escapeHtml(`Only ${product.inventory.inventoryQuantity} left`)}</span>`);
    }

    return chips.length ? `<div class="vypari-showcase__trust-row">${chips.join("")}</div>` : "";
  }

  function badgeMarkup(product, source, configuration) {
    if (!source.showBadges) {
      return "";
    }

    const studio = studioSettings(configuration);
    const badges = [];
    const soldOut = product.inventory && product.inventory.availableForSale === false;
    const lowStock = product.inventory && product.inventory.inventoryStatus === "low_stock";

    if (shouldShowSaleBadge(product, source, configuration)) {
      badges.push('<span class="vypari-showcase__badge vypari-showcase__badge--sale">Sale</span>');
    }
    if (studio.badges && studio.badges.bestSeller && hasTag(product, ["best seller", "bestseller", "best-seller"])) {
      badges.push('<span class="vypari-showcase__badge vypari-showcase__badge--neutral">Best seller</span>');
    }
    if (studio.badges && studio.badges.newArrival && hasTag(product, ["new arrival", "new", "fresh drop"])) {
      badges.push('<span class="vypari-showcase__badge vypari-showcase__badge--neutral">New</span>');
    }
    if (studio.badges && studio.badges.limitedStock && lowStock) {
      badges.push('<span class="vypari-showcase__badge vypari-showcase__badge--warning">Limited stock</span>');
    }
    if (soldOut) {
      badges.push('<span class="vypari-showcase__badge vypari-showcase__badge--muted">Sold out</span>');
    }

    return badges.length ? `<div class="vypari-showcase__badges">${badges.join("")}</div>` : "";
  }

  function productMetaMarkup(product, configuration) {
    const studio = studioSettings(configuration);
    const productInfo = studio.productInfo || {};
    const parts = [];

    if (productInfo.brand && product.identity && product.identity.vendor) {
      parts.push(`<span class="vypari-showcase__meta-chip">${escapeHtml(product.identity.vendor)}</span>`);
    }
    if (productInfo.vendor && product.identity && product.identity.vendor && !productInfo.brand) {
      parts.push(`<span class="vypari-showcase__meta-chip">${escapeHtml(product.identity.vendor)}</span>`);
    }
    if (productInfo.productType && product.identity && product.identity.productType) {
      parts.push(`<span class="vypari-showcase__meta-chip">${escapeHtml(product.identity.productType)}</span>`);
    }
    if (productInfo.collectionLabel && product.taxonomy && Array.isArray(product.taxonomy.collections) && product.taxonomy.collections[0]) {
      parts.push(`<span class="vypari-showcase__meta-chip">${escapeHtml(product.taxonomy.collections[0].title)}</span>`);
    }
    if (productInfo.sellingPlan && product.commerce && Array.isArray(product.commerce.sellingPlans) && product.commerce.sellingPlans[0]) {
      parts.push(`<span class="vypari-showcase__meta-chip">${escapeHtml(product.commerce.sellingPlans[0].name)}</span>`);
    }

    return parts.length ? `<div class="vypari-showcase__meta-row">${parts.join("")}</div>` : "";
  }

  function deliveryMarkup(product, configuration) {
    const studio = studioSettings(configuration);
    const productInfo = studio.productInfo || {};
    const lines = [];

    if (productInfo.deliveryPromise && product.delivery && product.delivery.deliveryPromise) {
      lines.push(product.delivery.deliveryPromise);
    }
    if (productInfo.pickupAvailability && product.commerce && Array.isArray(product.commerce.pickupAvailability) && product.commerce.pickupAvailability[0] && product.commerce.pickupAvailability[0].pickupTime) {
      lines.push(product.commerce.pickupAvailability[0].pickupTime);
    }
    if (productInfo.localDelivery && product.delivery && product.delivery.deliveryPromise) {
      lines.push(product.delivery.deliveryPromise);
    }
    if (productInfo.stockStatus && product.inventory && product.inventory.inventoryStatus) {
      lines.push(inventoryStatusLabel(product));
    }
    if (productInfo.stockCount && product.inventory && typeof product.inventory.inventoryQuantity === "number") {
      lines.push(`${product.inventory.inventoryQuantity} in stock`);
    }
    if (productInfo.sku) {
      var firstVariant = variants(product)[0];
      if (firstVariant && firstVariant.sku) {
        lines.push(`SKU ${firstVariant.sku}`);
      }
    }
    if (productInfo.variantCount) {
      const count = variants(product).length;
      if (count > 0) {
        lines.push(`${count} variants`);
      }
    }
    if (productInfo.sellingPlan && product.commerce && Array.isArray(product.commerce.sellingPlans) && product.commerce.sellingPlans[0] && product.commerce.sellingPlans[0].plans && product.commerce.sellingPlans[0].plans[0]) {
      lines.push(product.commerce.sellingPlans[0].plans[0].name);
    }

    return lines.length ? `<div class="vypari-showcase__detail">${escapeHtml(lines.join(" · "))}</div>` : "";
  }

  function metafieldsMarkup(product, configuration) {
    const studio = studioSettings(configuration);
    const metafields = selectedMetafields(product, configuration);

    if (!metafields.length) {
      return "";
    }

    return `<div class="vypari-showcase__attributes" data-attribute-style="${escapeAttribute(normalizeSetting(studio.customAttributeStyle || "chip"))}">
      ${metafields.map(function (metafield) {
        const id = metafield && (metafield.id || `${metafield.namespace}-${metafield.key}`);
        const label = String(metafield.key || id || "Attribute")
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, function (part) {
            return part.toUpperCase();
          });
        const value = metafield.value || "";

        return `<div class="vypari-showcase__attribute">
          <span class="vypari-showcase__attribute-label">${escapeHtml(label)}</span>
          <span class="vypari-showcase__attribute-value">${escapeHtml(value)}</span>
        </div>`;
      }).join("")}
    </div>`;
  }

  function stockMeterMarkup(product, configuration) {
    const studio = studioSettings(configuration);
    const productInfo = studio.productInfo || {};
    const quantity = product.inventory && typeof product.inventory.inventoryQuantity === "number" ? product.inventory.inventoryQuantity : null;

    if (!productInfo.stockCount || quantity === null || !quantity) {
      return "";
    }

    const activeBars = Math.max(1, Math.min(6, Math.round(quantity / 5)));
    const bars = Array.from({ length: 6 }).map(function (_, index) {
      return `<span class="vypari-showcase__stock-bar${index < activeBars ? " is-active" : ""}"></span>`;
    }).join("");

    return `<div class="vypari-showcase__stock-meter">
      <div class="vypari-showcase__stock-bars">${bars}</div>
      <span class="vypari-showcase__stock-copy">${escapeHtml(`Only ${quantity} left`)}</span>
    </div>`;
  }

  function assuranceMarkup() {
    return `<div class="vypari-showcase__assurance">
      <span class="vypari-showcase__assurance-item">Fast shipping</span>
      <span class="vypari-showcase__assurance-item">Easy returns</span>
      <span class="vypari-showcase__assurance-item">Secure checkout</span>
    </div>`;
  }

  function pricePanelMarkup(product, source, configuration) {
    if (!source.showPrice) {
      return "";
    }

    const price = formatMoney(product.pricing);
    const compareAt = shouldShowCompareAt(product, configuration)
      ? formatMoney({ price: product.pricing.compareAtPrice, currency: product.pricing.currency })
      : "";
    const savings = savingsAmount(product);
    const showSavings = savings > 0;
    const percent = savingsPercent(product);

    return `<div class="vypari-showcase__price-panel">
      <div class="vypari-showcase__pricing">
        <span class="vypari-showcase__price">${escapeHtml(price)}</span>
        ${compareAt ? `<span class="vypari-showcase__compare">${escapeHtml(compareAt)}</span>` : ""}
        ${showSavings ? `<span class="vypari-showcase__saving-pill">Save ${escapeHtml(formatMoney({ price: { amount: String(savings), currency: product.pricing.currency }, currency: product.pricing.currency }))}</span>` : ""}
      </div>
      ${compareAt && percent > 0 ? `<div class="vypari-showcase__pricing-note">${escapeHtml(`${percent}% off original price`)}</div>` : ""}
    </div>`;
  }

  function variantMarkup(product, configuration) {
    const studio = studioSettings(configuration);
    const display = studio.variantDisplay || "Color Swatches";
    const values = optionValues(product).slice(0, Math.max(Number(studio.maxVisibleVariants || 4), 1));

    if (!values.length || display === "Hidden") {
      return "";
    }

    if (display === "Variant Count") {
      return `<div class="vypari-showcase__variants vypari-showcase__variants--count">${escapeHtml(String(variants(product).length))} options</div>`;
    }

    if (display === "Dropdown") {
      return `<div class="vypari-showcase__variants"><select class="vypari-showcase__variant-select" aria-label="Variant options">
        ${values.map(function (value) {
          return `<option>${escapeHtml(value.value)}</option>`;
        }).join("")}
      </select></div>`;
    }

    return `<div class="vypari-showcase__variants" data-variant-style="${escapeAttribute(normalizeSetting(display))}">
      ${values.map(function (value) {
        const swatch = value.swatch && value.swatch.color ? ` style="--swatch:${escapeAttribute(value.swatch.color)}"` : "";
        return `<span class="vypari-showcase__variant"${swatch}>${escapeHtml(value.value)}</span>`;
      }).join("")}
    </div>`;
  }

  function secondaryCtaMarkup(product, configuration) {
    const studio = studioSettings(configuration);
    if (!studio.secondaryCtaEnabled) {
      return "";
    }

    const label = studio.secondaryCtaText || "Quick View";
    return `<a class="vypari-showcase__cta vypari-showcase__cta--secondary" href="/products/${escapeHtml(product.identity.handle)}">${escapeHtml(label)}</a>`;
  }

  function applyRuntimeConfiguration(root, configuration) {
    const theme = configuration && configuration.theme ? configuration.theme : {};
    const appearance = configuration && configuration.appearance ? configuration.appearance : {};
    const cta = configuration && configuration.cta ? configuration.cta : {};
    const media = configuration && configuration.media ? configuration.media : {};
    const studio = studioSettings(configuration);
    const motion = configuration && configuration.motion ? configuration.motion : {};

    if (theme.accentColor) {
      root.style.setProperty("--vypari-accent", theme.accentColor);
    }
    if (studio.ctaColor) {
      root.style.setProperty("--vypari-cta", studio.ctaColor);
    } else if (theme.accentColor) {
      root.style.setProperty("--vypari-cta", theme.accentColor);
    }

    const radiusMap = {
      soft: "18px",
      rounded: "24px",
      sharp: "10px",
    };
    const shadowMap = {
      none: "0 0 0 rgba(15, 23, 42, 0)",
      low: "0 12px 30px rgba(15, 23, 42, 0.06)",
      medium: "0 18px 40px rgba(15, 23, 42, 0.12)",
    };

    if (appearance.borderRadius && radiusMap[appearance.borderRadius]) {
      root.style.setProperty("--vypari-radius", radiusMap[appearance.borderRadius]);
    }
    if (appearance.shadowDepth && shadowMap[appearance.shadowDepth]) {
      root.style.setProperty("--vypari-card-shadow", shadowMap[appearance.shadowDepth]);
    }

    if (motion.hoverDurationMs) {
      root.style.setProperty("--vypari-motion-duration", `${motion.hoverDurationMs}ms`);
    }
    if (motion.cardLiftAmount) {
      root.style.setProperty("--vypari-lift-height", `${motion.cardLiftAmount}px`);
    }
    if (motion.microScaleAmount) {
      root.style.setProperty("--vypari-hover-scale", String(motion.microScaleAmount));
    }

    root.dataset.themeMode = theme.mode || (studio.theme ? String(studio.theme).toLowerCase() : "inherit");
    root.dataset.ctaStyle = cta.style || (studio.ctaStyle ? String(studio.ctaStyle).toLowerCase() : "filled");
    root.dataset.ctaFullWidth = cta.fullWidth ? "true" : "false";
    root.dataset.imageBehavior = media.imageBehavior || "zoom_on_hover";
    root.dataset.density = studio.density ? String(studio.density).toLowerCase() : "balanced";
    root.dataset.cardWidth = studio.cardWidth ? String(studio.cardWidth).toLowerCase() : "standard";
    root.dataset.fontSize = studio.fontSize ? String(studio.fontSize).toLowerCase() : "medium";
    root.dataset.highContrast = studio.highContrast ? "true" : "false";
    root.dataset.reducedMotion = studio.reducedMotion ? "true" : "false";
    root.dataset.showcaseStyle = studio.showcaseStyle ? String(studio.showcaseStyle).toLowerCase() : "premium";
    root.dataset.cardVariant = appearance.cardVariant || "premium";
    root.dataset.variantOverflow = studio.variantOverflow ? String(studio.variantOverflow).toLowerCase() : "wrap";
  }

  function renderCard(product, source, configuration) {
    const featured = product.media && product.media.featuredImage ? product.media.featuredImage.url : "";
    const secondary =
      source.showSecondaryImage && product.media && Array.isArray(product.media.galleryImages) && product.media.galleryImages[1]
        ? product.media.galleryImages[1].url
        : "";
    const buttonLabel = ctaLabel(source, configuration);
    const studio = studioSettings(configuration);
    const productInfo = studio.productInfo || {};
    const eyebrow = productInfo.brand || productInfo.vendor ? product.identity.vendor : "";
    const title = studio.showcaseStyle === "Bold" ? compactTitle(product.identity.title).toUpperCase() : product.identity.title;
    const subtitle = productSubtitle(product);
    const trustChips = trustChipsMarkup(product, configuration);

    return `
      <article class="vypari-showcase__card">
        <a href="/products/${escapeHtml(product.identity.handle)}" class="vypari-showcase__media-link">
          <div class="vypari-showcase__media">
            ${
              featured
                ? `<img class="vypari-showcase__image vypari-showcase__image--primary" loading="lazy" src="${escapeHtml(featured)}" alt="${escapeHtml(product.identity.title)}">`
                : `<div class="vypari-showcase__image vypari-showcase__image--placeholder"></div>`
            }
            ${
              secondary
                ? `<img class="vypari-showcase__image vypari-showcase__image--secondary" loading="lazy" src="${escapeHtml(secondary)}" alt="${escapeHtml(product.identity.title)}">`
                : ""
            }
            ${
              badgeMarkup(product, source, configuration)
            }
          </div>
        </a>
        <div class="vypari-showcase__content">
          ${eyebrow ? `<div class="vypari-showcase__eyebrow">${escapeHtml(eyebrow)}</div>` : ""}
          <h3 class="vypari-showcase__title">
            <a href="/products/${escapeHtml(product.identity.handle)}">${escapeHtml(title)}</a>
          </h3>
          ${subtitle ? `<p class="vypari-showcase__subtitle">${escapeHtml(subtitle)}</p>` : ""}
          ${trustChips}
          ${trustChips ? "" : ratingMarkup(product, configuration)}
          ${pricePanelMarkup(product, source, configuration)}
          ${productMetaMarkup(product, configuration)}
          ${variantMarkup(product, configuration)}
          ${deliveryMarkup(product, configuration)}
          ${metafieldsMarkup(product, configuration)}
          ${stockMeterMarkup(product, configuration)}
          <div class="vypari-showcase__footer">
            <div class="vypari-showcase__cta-group">
              <a class="vypari-showcase__cta" href="/products/${escapeHtml(product.identity.handle)}">${escapeHtml(buttonLabel)}</a>
              ${secondaryCtaMarkup(product, configuration)}
            </div>
          </div>
          ${assuranceMarkup()}
        </div>
      </article>
    `;
  }

  function renderCardModel(card) {
    return `
      <article class="vypari-showcase__card">
        <a href="/products/${escapeHtml(card.productHandle)}" class="vypari-showcase__media-link">
          <div class="vypari-showcase__media">
            ${
              card.featuredImageUrl
                ? `<img class="vypari-showcase__image vypari-showcase__image--primary" loading="lazy" src="${escapeHtml(card.featuredImageUrl)}" alt="${escapeHtml(card.imageAlt || card.title)}">`
                : `<div class="vypari-showcase__image vypari-showcase__image--placeholder"></div>`
            }
            ${
              card.secondaryImageUrl
                ? `<img class="vypari-showcase__image vypari-showcase__image--secondary" loading="lazy" src="${escapeHtml(card.secondaryImageUrl)}" alt="${escapeHtml(card.imageAlt || card.title)}">`
                : ""
            }
            ${
              Array.isArray(card.badges) && card.badges.length
                ? `<div class="vypari-showcase__badges">${card.badges.map(function (badge) {
                    return `<span class="vypari-showcase__badge vypari-showcase__badge--${escapeAttribute(badge.tone || "neutral")}">${escapeHtml(badge.label)}</span>`;
                  }).join("")}</div>`
                : ""
            }
          </div>
        </a>
        <div class="vypari-showcase__content">
          ${card.eyebrow ? `<div class="vypari-showcase__eyebrow">${escapeHtml(card.eyebrow)}</div>` : ""}
          <h3 class="vypari-showcase__title">
            <a href="/products/${escapeHtml(card.productHandle)}">${escapeHtml(card.title)}</a>
          </h3>
          ${card.subtitle ? `<p class="vypari-showcase__subtitle">${escapeHtml(card.subtitle)}</p>` : ""}
          ${
            Array.isArray(card.trustChips) && card.trustChips.length
              ? `<div class="vypari-showcase__trust-row">${card.trustChips.map(function (chip) {
                  return `<span class="vypari-showcase__trust-chip${chip.strong ? " vypari-showcase__trust-chip--strong" : ""}">${escapeHtml(chip.label)}</span>`;
                }).join("")}</div>`
              : ""
          }
          ${
            card.price
              ? `<div class="vypari-showcase__price-panel">
                  <div class="vypari-showcase__pricing">
                    <span class="vypari-showcase__price">${escapeHtml(card.price.current)}</span>
                    ${card.price.compareAt ? `<span class="vypari-showcase__compare">${escapeHtml(card.price.compareAt)}</span>` : ""}
                    ${card.price.savingsLabel ? `<span class="vypari-showcase__saving-pill">${escapeHtml(card.price.savingsLabel)}</span>` : ""}
                  </div>
                  ${card.price.note ? `<div class="vypari-showcase__pricing-note">${escapeHtml(card.price.note)}</div>` : ""}
                </div>`
              : ""
          }
          ${
            Array.isArray(card.metaChips) && card.metaChips.length
              ? `<div class="vypari-showcase__meta-row">${card.metaChips.map(function (chip) {
                  return `<span class="vypari-showcase__meta-chip">${escapeHtml(chip)}</span>`;
                }).join("")}</div>`
              : ""
          }
          ${
            Array.isArray(card.variantOptions) && card.variantOptions.length
              ? `<div class="vypari-showcase__variants" data-variant-style="${escapeAttribute(normalizeSetting(card.variantDisplay || "Color Swatches"))}">
                  ${card.variantOptions.map(function (option) {
                    const swatch = option.swatchColor ? ` style="--swatch:${escapeAttribute(option.swatchColor)}"` : "";
                    return `<span class="vypari-showcase__variant"${swatch}>${escapeHtml(option.label)}</span>`;
                  }).join("")}
                </div>`
              : ""
          }
          ${Array.isArray(card.detailLines) && card.detailLines.length ? `<div class="vypari-showcase__detail">${escapeHtml(card.detailLines.join(" · "))}</div>` : ""}
          ${
            Array.isArray(card.attributes) && card.attributes.length
              ? `<div class="vypari-showcase__attributes">${card.attributes.map(function (attribute) {
                  return `<div class="vypari-showcase__attribute">
                    <span class="vypari-showcase__attribute-label">${escapeHtml(attribute.label)}</span>
                    <span class="vypari-showcase__attribute-value">${escapeHtml(attribute.value)}</span>
                  </div>`;
                }).join("")}</div>`
              : ""
          }
          ${
            card.stockMeter
              ? `<div class="vypari-showcase__stock-meter">
                  <div class="vypari-showcase__stock-bars">${Array.from({ length: card.stockMeter.totalBars || 6 }).map(function (_, index) {
                    return `<span class="vypari-showcase__stock-bar${index < (card.stockMeter.activeBars || 0) ? " is-active" : ""}"></span>`;
                  }).join("")}</div>
                  <span class="vypari-showcase__stock-copy">${escapeHtml(card.stockMeter.label)}</span>
                </div>`
              : ""
          }
          <div class="vypari-showcase__footer">
            <div class="vypari-showcase__cta-group">
              <a class="vypari-showcase__cta" href="/products/${escapeHtml(card.productHandle)}">${escapeHtml(card.ctaLabel || "Shop now")}</a>
              ${card.secondaryCtaLabel ? `<a class="vypari-showcase__cta vypari-showcase__cta--secondary" href="/products/${escapeHtml(card.productHandle)}">${escapeHtml(card.secondaryCtaLabel)}</a>` : ""}
            </div>
          </div>
          ${
            Array.isArray(card.assurance) && card.assurance.length
              ? `<div class="vypari-showcase__assurance">${card.assurance.map(function (item) {
                  return `<span class="vypari-showcase__assurance-item">${escapeHtml(item)}</span>`;
                }).join("")}</div>`
              : ""
          }
        </div>
      </article>
    `;
  }

  function bindCarouselControls(root) {
    const track = root.querySelector("[data-vypari-track]");
    const previous = root.querySelector("[data-vypari-prev]");
    const next = root.querySelector("[data-vypari-next]");

    if (!(track instanceof HTMLElement)) {
      return;
    }

    const step = function () {
      return Math.max(track.clientWidth * 0.82, 240);
    };

    if (previous instanceof HTMLElement) {
      previous.onclick = function () {
        track.scrollBy({ left: step() * -1, behavior: "smooth" });
      };
    }

    if (next instanceof HTMLElement) {
      next.onclick = function () {
        track.scrollBy({ left: step(), behavior: "smooth" });
      };
    }
  }

  async function hydrateFromRuntime(root, instanceId, proxyBaseUrl, shopDomain) {
    const runtimeContainer = root.querySelector("[data-vypari-runtime]");
    if (!(runtimeContainer instanceof HTMLElement)) {
      return;
    }

    try {
      const runtimeUrl = new URL(`${proxyBaseUrl}/${encodeURIComponent(instanceId)}`, window.location.origin);
      if (shopDomain) {
        runtimeUrl.searchParams.set("shop", shopDomain);
      }

      const response = await fetch(runtimeUrl.toString(), {
        credentials: "same-origin",
      });

      if (!response.ok) {
        let message = `Runtime request failed with ${response.status}`;

        try {
          const payload = await response.json();
          if (payload && payload.message) {
            message = `${message}: ${payload.message}`;
          }
        } catch (_parseError) {
          try {
            const text = await response.text();
            if (text) {
              message = `${message}: ${text}`;
            }
          } catch (_textError) {
            // Ignore response parsing failures and keep the status-only message.
          }
        }

        throw new Error(message);
      }

      const payload = await response.json();
      const runtime = payload && payload.data ? payload.data : payload;
      const source = runtime.source || {};
      const configuration = runtime.configuration || {};
      const products = Array.isArray(runtime.products) ? runtime.products : [];
      const cardModels = Array.isArray(runtime.cardModels) ? runtime.cardModels : [];

      root.classList.remove("vypari-showcase--grid", "vypari-showcase--carousel", "vypari-showcase--spotlight");
      root.classList.add(`vypari-showcase--${source.layout || "grid"}`);
      applyRuntimeConfiguration(root, configuration);

      const heading = root.querySelector(".vypari-showcase__heading");
      const subheading = root.querySelector(".vypari-showcase__subheading");

      if (heading) {
        heading.textContent = source.heading || "";
      }
      if (subheading) {
        subheading.textContent = source.subheading || "";
      }

      runtimeContainer.innerHTML = products.length
        ? `<div class="vypari-showcase__track" data-vypari-track>${(cardModels.length ? cardModels : products).map(function (entry, index) {
            return cardModels.length ? renderCardModel(entry) : renderCard(products[index], source, configuration);
          }).join("")}</div>`
        : `<div class="vypari-showcase__empty"><h3>No products found for this synced instance</h3><p>Update the collection handle in the Vypari app and refresh the theme editor preview.</p></div>`;

      bindCarouselControls(root);
    } catch (error) {
      runtimeContainer.innerHTML = `<div class="vypari-showcase__empty"><h3>Unable to load synced showcase</h3><p>${escapeHtml(
        error && error.message ? error.message : "Unknown runtime error",
      )}</p></div>`;
    }
  }

  function mountShowcase(root) {
    if (!root) {
      return;
    }

    const instanceId = root.getAttribute("data-vypari-instance-id");
    const proxyBaseUrl = root.getAttribute("data-vypari-proxy-url");
    const shopDomain = root.getAttribute("data-vypari-shop");

    if (instanceId && proxyBaseUrl) {
      hydrateFromRuntime(root, instanceId, proxyBaseUrl, shopDomain);
      return;
    }

    bindCarouselControls(root);
  }

  function boot() {
    document.querySelectorAll(".vypari-showcase").forEach(function (root) {
      mountShowcase(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener("shopify:section:load", boot);
  document.addEventListener("shopify:block:select", boot);
})();
