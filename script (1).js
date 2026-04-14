/* ================================================
   PRODUCT VARIANT SELECTOR v2 — script.js
   ThreadLux Classic Tee

   Table of Contents
   -----------------
   1.  Product Data  (colors, images, variants)
   2.  App State
   3.  DOM References
   4.  Utility Helpers
   5.  Rendering — Swatches, Thumbnails, Sizes
   6.  Updaters — Price, Stock, Summary, Cart Button
   7.  Selection Handlers — Color, Size, Image
   8.  Lightbox (fullscreen image viewer)
       8a  Open / Close
       8b  Navigate prev / next
       8c  Keyboard & swipe support
   9.  Image Zoom (magnifier lens on desktop)
   10. Size Chart Modal
   11. Cart & Quantity Logic
   12. Toast Notification
   13. Event Wiring
   14. Init
================================================ */


/* ================================================
   1. PRODUCT DATA
   -----------------------------------------------
   To integrate with Shopify, replace these objects
   with Liquid JSON:
     const COLORS   = {{ product.options | json }};
     const variants = {{ product.variants | json }};
================================================ */

/**
 * COLORS — one entry per available color.
 * hex       : swatch background
 * border    : swatch border (adjust for light/dark fills)
 * images    : emoji representing gallery images (replace with real URLs)
 * labels    : human-readable label per thumbnail
 */
const COLORS = {
  Ivory: {
    hex: '#F5F0E8',
    border: 'rgba(0,0,0,0.13)',
    images: ['👕', '🏷️', '📦'],
    labels: ['Front', 'Tag detail', 'Packaging']
  },
  Navy: {
    hex: '#1B2A4A',
    border: 'rgba(255,255,255,0.15)',
    images: ['👔', '🧢', '📦'],
    labels: ['Front', 'Accessory', 'Packaging']
  },
  Terracotta: {
    hex: '#C0614A',
    border: 'rgba(0,0,0,0.10)',
    images: ['🧡', '🎨', '📦'],
    labels: ['Front', 'Detail', 'Packaging']
  }
};

/** Size options in order */
const SIZES = ['S', 'M', 'L', 'XL'];

/**
 * VARIANTS — every unique SKU.
 * id            : SKU string (match Shopify variant.sku)
 * color         : must be a key in COLORS
 * size          : must be in SIZES
 * price         : selling price (integer paise-free INR)
 * compare_price : original price, null = no discount shown
 * stock         : integer units (0 = out of stock)
 */
const variants = [
  // Ivory
  { id: 'TL-IVR-S',  color: 'Ivory',      size: 'S',  price: 1199, compare_price: null,  stock: 8  },
  { id: 'TL-IVR-M',  color: 'Ivory',      size: 'M',  price: 1199, compare_price: 1499,  stock: 3  },
  { id: 'TL-IVR-L',  color: 'Ivory',      size: 'L',  price: 1299, compare_price: 1599,  stock: 0  },
  { id: 'TL-IVR-XL', color: 'Ivory',      size: 'XL', price: 1399, compare_price: 1699,  stock: 5  },
  // Navy
  { id: 'TL-NVY-S',  color: 'Navy',       size: 'S',  price: 1399, compare_price: 1699,  stock: 12 },
  { id: 'TL-NVY-M',  color: 'Navy',       size: 'M',  price: 1399, compare_price: 1699,  stock: 7  },
  { id: 'TL-NVY-L',  color: 'Navy',       size: 'L',  price: 1499, compare_price: null,  stock: 2  },
  { id: 'TL-NVY-XL', color: 'Navy',       size: 'XL', price: 1499, compare_price: 1899,  stock: 0  },
  // Terracotta
  { id: 'TL-TRC-S',  color: 'Terracotta', size: 'S',  price: 1099, compare_price: null,  stock: 4  },
  { id: 'TL-TRC-M',  color: 'Terracotta', size: 'M',  price: 1099, compare_price: null,  stock: 9  },
  { id: 'TL-TRC-L',  color: 'Terracotta', size: 'L',  price: 1199, compare_price: 1499,  stock: 1  },
  { id: 'TL-TRC-XL', color: 'Terracotta', size: 'XL', price: 1299, compare_price: null,  stock: 6  },
];


/* ================================================
   2. APP STATE
================================================ */
const state = {
  selectedColor:    null,   // key in COLORS or null
  selectedSize:     null,   // value in SIZES or null
  quantity:         1,      // current qty
  currentThumbIdx:  0,      // active thumbnail index
  lightboxOpen:     false,  // is the lightbox visible
  lightboxIdx:      0,      // which image is shown in lightbox
  // Touch swipe tracking for lightbox
  touchStartX:      0,
  touchEndX:        0,
};


/* ================================================
   3. DOM REFERENCES
================================================ */
const dom = {
  // Gallery
  mainImgWrap:    document.getElementById('main-img-wrap'),
  mainImg:        document.getElementById('main-img'),
  zoomLens:       document.getElementById('zoom-lens'),
  thumbsCont:     document.getElementById('thumbs'),
  // Info
  swatchesCont:   document.getElementById('swatches'),
  sizeBtnsCont:   document.getElementById('size-btns'),
  colorLabel:     document.getElementById('color-label'),
  sizeLabel:      document.getElementById('size-label'),
  priceCurrent:   document.getElementById('price-current'),
  priceOriginal:  document.getElementById('price-original'),
  discountPill:   document.getElementById('discount-pill'),
  savedMsg:       document.getElementById('saved-msg'),
  saleBadge:      document.getElementById('sale-badge'),
  variantSummary: document.getElementById('variant-summary'),
  stockStatus:    document.getElementById('stock-status'),
  skuText:        document.getElementById('sku-text'),
  cartBtn:        document.getElementById('cart-btn'),
  qtyMinus:       document.getElementById('qty-minus'),
  qtyPlus:        document.getElementById('qty-plus'),
  qtyVal:         document.getElementById('qty-val'),
  // Lightbox
  lightbox:       document.getElementById('lightbox'),
  lbImg:          document.getElementById('lb-img'),
  lbCaption:      document.getElementById('lb-caption'),
  lbDots:         document.getElementById('lb-dots'),
  lbClose:        document.getElementById('lb-close'),
  lbPrev:         document.getElementById('lb-prev'),
  lbNext:         document.getElementById('lb-next'),
  // Size chart modal
  sizeChartModal: document.getElementById('size-chart-modal'),
  sizeChartClose: document.getElementById('size-chart-close'),
  sizeGuideBtn:   document.getElementById('size-guide-btn'),
  // Toast
  toast:          document.getElementById('toast'),
  toastTitle:     document.getElementById('toast-title'),
  toastSub:       document.getElementById('toast-sub'),
};


/* ================================================
   4. UTILITY HELPERS
================================================ */

/** Find a variant by color + size. Returns object or undefined. */
function getVariant(color, size) {
  return variants.find(v => v.color === color && v.size === size);
}

/** Format integer to Indian Rupee string. e.g. 1299 → "₹1,299" */
function formatPrice(n) {
  return '₹' + n.toLocaleString('en-IN');
}

/**
 * Determine stock level string from a variant.
 * @returns {'in'|'low'|'out'}
 */
function stockLevel(variant) {
  if (!variant || variant.stock === 0) return 'out';
  if (variant.stock <= 3) return 'low';
  return 'in';
}

/**
 * Inject a CSS ripple element into a button at pointer coordinates.
 * Creates the expanding circle click animation.
 */
function addRipple(event, element) {
  const span = document.createElement('span');
  span.classList.add('ripple');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  span.style.width  = size + 'px';
  span.style.height = size + 'px';
  span.style.left   = (event.clientX - rect.left  - size / 2) + 'px';
  span.style.top    = (event.clientY - rect.top   - size / 2) + 'px';
  element.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

/** Get the images array for the currently selected color (or empty). */
function currentImages() {
  return state.selectedColor ? COLORS[state.selectedColor].images : [];
}

/** Get the labels array for the currently selected color (or empty). */
function currentLabels() {
  return state.selectedColor ? COLORS[state.selectedColor].labels : [];
}

/**
 * Lock / unlock body scroll when a modal is open.
 * Prevents background scrolling on mobile.
 */
function lockScroll(lock) {
  document.body.style.overflow = lock ? 'hidden' : '';
}


/* ================================================
   5. RENDERING FUNCTIONS
================================================ */

/* ---- 5a. Render color swatches ---- */
function renderSwatches() {
  dom.swatchesCont.innerHTML = '';

  Object.entries(COLORS).forEach(([name, info]) => {
    const el = document.createElement('div');
    el.className = 'swatch' + (state.selectedColor === name ? ' active' : '');
    el.setAttribute('data-name', name);
    el.setAttribute('role', 'radio');
    el.setAttribute('aria-label', name + ' color');
    el.setAttribute('aria-checked', state.selectedColor === name);
    el.setAttribute('tabindex', '0');
    el.style.backgroundColor = info.hex;
    el.style.border          = '2.5px solid ' + info.border;

    el.addEventListener('click', () => selectColor(name));

    // Keyboard support for swatch selection
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectColor(name);
      }
    });

    dom.swatchesCont.appendChild(el);
  });
}

/* ---- 5b. Render thumbnail strip ---- */
function renderThumbs() {
  dom.thumbsCont.innerHTML = '';
  if (!state.selectedColor) return;

  const imgs   = currentImages();
  const labels = currentLabels();

  imgs.forEach((img, idx) => {
    const el = document.createElement('div');
    el.className = 'thumb' + (idx === state.currentThumbIdx ? ' active' : '');
    el.textContent = img;
    el.setAttribute('role', 'listitem');
    el.setAttribute('data-label', labels[idx] || '');
    el.setAttribute('aria-label', labels[idx] + ' view');
    el.setAttribute('tabindex', '0');
    el.title = labels[idx];

    el.addEventListener('click', () => setMainImage(img, idx));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') setMainImage(img, idx);
    });

    dom.thumbsCont.appendChild(el);
  });

  // Auto-display first image of the new color
  setMainImage(imgs[0], 0);
}

/* ---- 5c. Render size buttons ---- */
function renderSizes() {
  dom.sizeBtnsCont.innerHTML = '';

  SIZES.forEach(size => {
    // A size is unavailable when a color is chosen and that combo is OOS
    const unavailable = state.selectedColor
      ? !getVariant(state.selectedColor, size) || getVariant(state.selectedColor, size).stock === 0
      : false;

    const btn = document.createElement('button');
    btn.textContent = size;
    btn.setAttribute('aria-label', 'Size ' + size + (unavailable ? ' — unavailable' : ''));

    let cls = 'size-btn';
    if (state.selectedSize === size) cls += ' active';
    if (unavailable) {
      cls += ' disabled';
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.title = 'Out of stock';
    }
    btn.className = cls;

    btn.addEventListener('click', e => {
      if (btn.classList.contains('disabled')) return;
      addRipple(e, btn);
      selectSize(size);
    });

    dom.sizeBtnsCont.appendChild(btn);
  });
}


/* ================================================
   6. UPDATERS — price, stock, summary, cart
================================================ */

/* ---- 6a. Price display ---- */
function updatePrice() {
  const v = (state.selectedColor && state.selectedSize)
    ? getVariant(state.selectedColor, state.selectedSize)
    : null;

  if (v) {
    dom.priceCurrent.textContent = formatPrice(v.price);

    if (v.compare_price) {
      const pct   = Math.round((1 - v.price / v.compare_price) * 100);
      const saved = v.compare_price - v.price;

      dom.priceOriginal.style.display = '';
      dom.priceOriginal.textContent   = formatPrice(v.compare_price);
      dom.discountPill.style.display  = '';
      dom.discountPill.textContent    = pct + '% off';
      dom.savedMsg.style.display      = '';
      dom.savedMsg.textContent        = 'You save ' + formatPrice(saved) + ' on this order';
      dom.saleBadge.style.display     = '';
    } else {
      dom.priceOriginal.style.display = 'none';
      dom.discountPill.style.display  = 'none';
      dom.savedMsg.style.display      = 'none';
      dom.saleBadge.style.display     = 'none';
    }
  } else {
    // No full variant selected yet — show indicative range
    dom.priceCurrent.textContent    = 'From ₹1,099';
    dom.priceOriginal.style.display = 'none';
    dom.discountPill.style.display  = 'none';
    dom.savedMsg.style.display      = 'none';
    dom.saleBadge.style.display     = 'none';
  }
}

/* ---- 6b. Stock status indicator ---- */
function updateStock() {
  const v = (state.selectedColor && state.selectedSize)
    ? getVariant(state.selectedColor, state.selectedSize)
    : null;

  const el = dom.stockStatus;

  if (!state.selectedColor) {
    el.className = 'stock-indicator stock-in';
    el.innerHTML = '<div class="stock-dot"></div><span>Select options to check availability</span>';
    dom.skuText.textContent = 'SKU: —';
    return;
  }

  if (!state.selectedSize) {
    el.className = 'stock-indicator stock-in';
    el.innerHTML = '<div class="stock-dot"></div><span>Select a size to check stock</span>';
    dom.skuText.textContent = 'SKU: —';
    return;
  }

  dom.skuText.textContent = 'SKU: ' + (v ? v.id : '—');
  const level = stockLevel(v);

  const messages = {
    in:  `<div class="stock-dot"></div><span>In Stock &nbsp;·&nbsp; ${v.stock} units available</span>`,
    low: `<div class="stock-dot"></div><span>Low Stock — only ${v.stock} left! Order soon.</span>`,
    out: `<div class="stock-dot"></div><span>Out of Stock</span>`,
  };

  el.className = 'stock-indicator stock-' + level;
  el.innerHTML = messages[level];
}

/* ---- 6c. Variant summary banner ---- */
function updateSummary() {
  const el = dom.variantSummary;

  if (!state.selectedColor && !state.selectedSize) {
    el.innerHTML = 'Select your color and size to continue';
    return;
  }
  if (state.selectedColor && !state.selectedSize) {
    el.innerHTML = 'Color: <span>' + state.selectedColor + '</span> — now pick your size';
    return;
  }
  el.innerHTML = 'Selected: <span>' + state.selectedColor + ' / ' + state.selectedSize + '</span>';
}

/* ---- 6d. Cart button state ---- */
function updateCartBtn() {
  const v = (state.selectedColor && state.selectedSize)
    ? getVariant(state.selectedColor, state.selectedSize)
    : null;
  const level = v ? stockLevel(v) : null;

  if (!state.selectedColor || !state.selectedSize) {
    dom.cartBtn.className   = 'cart-btn unavailable';
    dom.cartBtn.textContent = state.selectedColor ? 'Select a size' : 'Select options';
  } else if (level === 'out') {
    dom.cartBtn.className   = 'cart-btn unavailable';
    dom.cartBtn.textContent = 'Out of Stock';
  } else {
    dom.cartBtn.className   = 'cart-btn available';
    dom.cartBtn.textContent = 'Add to Cart';
  }
}

/** Run all four updaters in one call. */
function updateAll() {
  updatePrice();
  updateStock();
  updateSummary();
  updateCartBtn();
}


/* ================================================
   7. SELECTION HANDLERS
================================================ */

/** Handle color swatch click. */
function selectColor(name) {
  state.selectedColor   = name;
  state.currentThumbIdx = 0;
  dom.colorLabel.textContent = name;

  // Deselect size if it's OOS for the new color
  if (state.selectedSize) {
    const v = getVariant(name, state.selectedSize);
    if (!v || v.stock === 0) {
      state.selectedSize = null;
      dom.sizeLabel.textContent = '— Select';
    }
  }

  renderSwatches();
  renderThumbs();   // also calls setMainImage(images[0], 0)
  renderSizes();
  updateAll();
}

/** Handle size button click. */
function selectSize(size) {
  state.selectedSize = size;
  dom.sizeLabel.textContent = size;
  renderSizes();
  updateAll();
}

/**
 * Switch the main image with a fade/scale transition.
 * Also syncs active state on thumbnails.
 */
function setMainImage(imgContent, idx) {
  state.currentThumbIdx = idx;

  // Fade out
  dom.mainImg.classList.add('fading');

  setTimeout(() => {
    dom.mainImg.textContent = imgContent;
    dom.mainImg.classList.remove('fading'); // fade back in
  }, 150);

  // Sync thumbnail borders
  dom.thumbsCont.querySelectorAll('.thumb').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });

  // Keep lightbox in sync if it is open
  if (state.lightboxOpen) {
    state.lightboxIdx = idx;
    renderLightboxImage(false);
  }
}


/* ================================================
   8. LIGHTBOX — fullscreen image viewer
================================================ */

/* ---- 8a. Open / Close ---- */

/**
 * Open the lightbox at a given image index.
 * Two-step: remove [hidden], then add .is-open (triggers CSS transition).
 */
function openLightbox(startIdx) {
  if (!state.selectedColor) return;   // no images to show yet

  state.lightboxOpen = true;
  state.lightboxIdx  = startIdx;

  // Render dot navigation
  buildLightboxDots();

  // Show the image immediately (no transition on open)
  renderLightboxImage(false);

  // Show the overlay
  dom.lightbox.hidden = false;
  lockScroll(true);

  // Small delay so the browser registers the display before animating opacity
  requestAnimationFrame(() => {
    requestAnimationFrame(() => dom.lightbox.classList.add('is-open'));
  });

  dom.lbClose.focus();
}

/** Close lightbox with fade-out then hide. */
function closeLightbox() {
  dom.lightbox.classList.remove('is-open');

  dom.lightbox.addEventListener('transitionend', () => {
    dom.lightbox.hidden = true;
    state.lightboxOpen  = false;
    lockScroll(false);
  }, { once: true });
}

/* ---- 8b. Navigate prev / next ---- */

/** Move lightbox to previous image (wraps around). */
function lbPrev() {
  const imgs = currentImages();
  state.lightboxIdx = (state.lightboxIdx - 1 + imgs.length) % imgs.length;
  renderLightboxImage(true);
}

/** Move lightbox to next image (wraps around). */
function lbNext() {
  const imgs = currentImages();
  state.lightboxIdx = (state.lightboxIdx + 1) % imgs.length;
  renderLightboxImage(true);
}

/**
 * Render the current lightbox image.
 * @param {boolean} animate - whether to apply fade transition
 */
function renderLightboxImage(animate) {
  const imgs   = currentImages();
  const labels = currentLabels();
  const img    = imgs[state.lightboxIdx]   || '👕';
  const label  = labels[state.lightboxIdx] || '';

  if (animate) {
    dom.lbImg.classList.add('lb-fading');
    setTimeout(() => {
      dom.lbImg.textContent    = img;
      dom.lbCaption.textContent = label;
      dom.lbImg.classList.remove('lb-fading');
    }, 140);
  } else {
    dom.lbImg.textContent    = img;
    dom.lbCaption.textContent = label;
  }

  // Update dot active state
  dom.lbDots.querySelectorAll('.lb-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === state.lightboxIdx);
  });
}

/** Build the dot indicators from the current color's image count. */
function buildLightboxDots() {
  dom.lbDots.innerHTML = '';
  currentImages().forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'lb-dot' + (i === state.lightboxIdx ? ' active' : '');
    dot.setAttribute('aria-label', 'Image ' + (i + 1));
    dot.addEventListener('click', () => {
      state.lightboxIdx = i;
      renderLightboxImage(true);
    });
    dom.lbDots.appendChild(dot);
  });
}

/* ---- 8c. Keyboard & swipe support for lightbox ---- */

/** Handle keyboard events inside the lightbox. */
document.addEventListener('keydown', e => {
  if (!state.lightboxOpen) return;
  if (e.key === 'ArrowLeft')  lbPrev();
  if (e.key === 'ArrowRight') lbNext();
  if (e.key === 'Escape')     closeLightbox();
});

/** Track touch start position for swipe detection. */
dom.lightbox.addEventListener('touchstart', e => {
  state.touchStartX = e.changedTouches[0].clientX;
}, { passive: true });

/** On touch end, determine swipe direction and navigate. */
dom.lightbox.addEventListener('touchend', e => {
  state.touchEndX = e.changedTouches[0].clientX;
  const delta = state.touchStartX - state.touchEndX;
  if (Math.abs(delta) > 50) {   // 50px swipe threshold
    delta > 0 ? lbNext() : lbPrev();
  }
}, { passive: true });

/** Clicking the dark overlay background closes the lightbox. */
dom.lightbox.addEventListener('click', e => {
  if (e.target === dom.lightbox) closeLightbox();
});


/* ================================================
   9. IMAGE ZOOM — magnifier lens (desktop)
   Shows a circular lens that follows the mouse.
   On touch devices this is hidden via CSS.
================================================ */

let zoomActive = false;

/** Show the zoom lens on mouse enter. */
dom.mainImgWrap.addEventListener('mouseenter', () => {
  if (window.innerWidth < 740) return;   // no zoom on mobile
  if (!state.selectedColor) return;
  dom.zoomLens.style.display = 'block';
  zoomActive = true;
});

/** Move the zoom lens to track cursor. */
dom.mainImgWrap.addEventListener('mousemove', e => {
  if (!zoomActive || window.innerWidth < 740) return;

  const rect = dom.mainImgWrap.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Clamp lens within the image bounds
  const halfLens = 50;   // half of lens width (100px / 2)
  const clampedX = Math.max(halfLens, Math.min(rect.width  - halfLens, x));
  const clampedY = Math.max(halfLens, Math.min(rect.height - halfLens, y));

  dom.zoomLens.style.left = clampedX + 'px';
  dom.zoomLens.style.top  = clampedY + 'px';
});

/** Hide the zoom lens on mouse leave. */
dom.mainImgWrap.addEventListener('mouseleave', () => {
  dom.zoomLens.style.display = 'none';
  zoomActive = false;
});

/** Click on main image opens the lightbox. */
dom.mainImgWrap.addEventListener('click', () => {
  openLightbox(state.currentThumbIdx);
});


/* ================================================
   10. SIZE CHART MODAL
================================================ */

/** Open size chart modal. */
function openSizeChart() {
  dom.sizeChartModal.hidden = false;
  lockScroll(true);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => dom.sizeChartModal.classList.add('is-open'));
  });
  dom.sizeChartClose.focus();
}

/** Close size chart modal. */
function closeSizeChart() {
  dom.sizeChartModal.classList.remove('is-open');
  dom.sizeChartModal.addEventListener('transitionend', () => {
    dom.sizeChartModal.hidden = true;
    lockScroll(false);
  }, { once: true });
}

/** Clicking overlay background closes the size chart. */
dom.sizeChartModal.addEventListener('click', e => {
  if (e.target === dom.sizeChartModal) closeSizeChart();
});

/** Keyboard: close size chart on Escape. */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !dom.sizeChartModal.hidden && !state.lightboxOpen) {
    closeSizeChart();
  }
});


/* ================================================
   11. CART & QUANTITY LOGIC
================================================ */

/** Decrement quantity (min = 1). */
dom.qtyMinus.addEventListener('click', () => {
  if (state.quantity > 1) {
    state.quantity--;
    dom.qtyVal.textContent = state.quantity;
  }
});

/** Increment quantity. */
dom.qtyPlus.addEventListener('click', () => {
  state.quantity++;
  dom.qtyVal.textContent = state.quantity;
});

/**
 * Cart button click.
 * Simulates: ready → loading spinner → added ✓ → ready
 *
 * Shopify integration: replace the setTimeout block with:
 *   fetch('/cart/add.js', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ id: v.shopify_variant_id, quantity: state.quantity })
 *   }).then(() => { ... show added state ... });
 */
dom.cartBtn.addEventListener('click', () => {
  if (!dom.cartBtn.classList.contains('available')) return;

  const v = getVariant(state.selectedColor, state.selectedSize);
  if (!v || v.stock === 0) return;

  // Loading state
  dom.cartBtn.className   = 'cart-btn loading';
  dom.cartBtn.textContent = '';

  // Simulate API call (~900ms)
  setTimeout(() => {
    // Success state
    dom.cartBtn.className   = 'cart-btn added';
    dom.cartBtn.textContent = '✓  Added!';

    showToast(
      'Added to cart',
      state.selectedColor + ' / ' + state.selectedSize + '  ×' + state.quantity
    );

    // Reset to available after 1.8s
    setTimeout(() => {
      dom.cartBtn.className   = 'cart-btn available';
      dom.cartBtn.textContent = 'Add to Cart';
    }, 1800);

  }, 920);
});


/* ================================================
   12. TOAST NOTIFICATION
================================================ */

/**
 * Show the cart toast with custom title and subtitle,
 * then auto-dismiss after `duration` ms.
 */
function showToast(title, subtitle, duration = 3400) {
  dom.toastTitle.textContent = title;
  dom.toastSub.textContent   = subtitle;
  dom.toast.classList.add('show');

  clearTimeout(dom.toast._timer);
  dom.toast._timer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, duration);
}


/* ================================================
   13. EVENT WIRING
================================================ */

// Lightbox controls
dom.lbClose.addEventListener('click', closeLightbox);
dom.lbPrev.addEventListener('click',  lbPrev);
dom.lbNext.addEventListener('click',  lbNext);

// Size chart controls
dom.sizeGuideBtn.addEventListener('click',   openSizeChart);
dom.sizeChartClose.addEventListener('click', closeSizeChart);


/* ================================================
   14. INIT — bootstrap the UI on page load
================================================ */
(function init() {
  renderSwatches();   // paint empty swatches (no selection)
  renderSizes();      // paint size buttons (all enabled pre-color)
  updateAll();        // set initial price/stock/summary/cart text
})();
