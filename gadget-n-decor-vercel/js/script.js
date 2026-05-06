// ================================================================
//  GADGET N DECOR — script.js  v2
//  Cart: full item stack stored in localStorage
//  Checkout: renders all cart items, submits all to Google Sheets
// ================================================================

// Correct way to access the variable in Vite
const SHEET_URL = import.meta.env.VITE_SHEET_URL;
const DELIVERY_INSIDE  = 80;
const DELIVERY_OUTSIDE = 1320;

// Active delivery cost — updated by zone selector
let DELIVERY = DELIVERY_INSIDE;

function getDelivery() { return DELIVERY; }

function onZoneChange(zone) {
  DELIVERY = zone === "outside" ? DELIVERY_OUTSIDE : DELIVERY_INSIDE;
  // Update active class on zone labels
  document.querySelectorAll(".zone-option").forEach(el => el.classList.remove("active"));
  const active = document.getElementById("zone-" + zone);
  if (active) active.classList.add("active");
  // Refresh totals in checkout summary
  refreshCheckoutTotals();
}

// ================================================================
//  PRODUCT DATA
// ================================================================
const products = {
  1: {
    id: 1,
    name: "Q10 TWS 2 IN 1 True Wireless Sterio",
    price: 1999,
    description: "Premium noise-cancelling headphones with 30-hour battery life, 40mm drivers, and foldable design for on-the-go comfort.",
    badge: "Best Seller",
    images: [
      "/images/products/product_Acover.jpeg",
      "/images/products/product_Acover2.jpeg",
      "/images/products/product_A.jpeg"
    ]
  },
  2: {
    id: 2,
    name: "Q10 TWS MIDNIGHT BLACK Premium Edition",
    price: 1999,
    description: "Advanced health & fitness tracker with SpO2, heart rate, sleep monitoring, 7-day battery, and 50m water resistance.",
    badge: "New Arrival",
    images: [
      "/images/products/product_Bcover.jpeg",
      "/images/products/product_Bcover2.jpeg",
      "/images/products/product_B.jpeg"
    ]
  }
};
// ================================================================
//  CART  — full stack, persisted in localStorage
// ================================================================
function getCart() {
  try { return JSON.parse(localStorage.getItem("gnd_cart") || "[]"); }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem("gnd_cart", JSON.stringify(cart));
  syncCartUI();
}

function cartTotal() {
  return getCart().reduce((s, i) => s + i.price * i.qty, 0);
}

function cartCount() {
  return getCart().reduce((s, i) => s + i.qty, 0);
}

function addToCart(product, qty) {
  const cart = getCart();
  const idx  = cart.findIndex(i => i.id === product.id);
  if (idx > -1) {
    cart[idx].qty += qty;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.images[0], qty });
  }
  saveCart(cart);
  openCartDrawer();
  showToast("Added to cart", "success");
}

function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
  renderCartDrawer();
}

function updateCartQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  renderCartDrawer();
}

function clearCart() {
  saveCart([]);
  renderCartDrawer();
}

// ================================================================
//  CART BADGE
// ================================================================
function syncCartUI() {
  const count = cartCount();
  document.querySelectorAll(".cart-badge").forEach(b => {
    b.textContent = count;
    b.classList.toggle("visible", count > 0);
  });
}
syncCartUI();

// ================================================================
//  CART DRAWER
// ================================================================
function ensureCartDrawer() {
  if (document.getElementById("cartDrawer")) return;

  const overlay = document.createElement("div");
  overlay.id = "cartOverlay";
  overlay.className = "cart-overlay";
  overlay.addEventListener("click", closeCartDrawer);

  const drawer = document.createElement("div");
  drawer.id = "cartDrawer";
  drawer.className = "cart-drawer";
  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <span class="cart-drawer-title">Your Cart</span>
      <button class="cart-close-btn" onclick="closeCartDrawer()">✕</button>
    </div>
    <div class="cart-drawer-body" id="cartDrawerBody"></div>
    <div class="cart-drawer-footer" id="cartDrawerFooter"></div>`;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
  renderCartDrawer();
}

function openCartDrawer() {
  ensureCartDrawer();
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
  renderCartDrawer();
}

function closeCartDrawer() {
  const d = document.getElementById("cartDrawer");
  const o = document.getElementById("cartOverlay");
  if (d) d.classList.remove("open");
  if (o) o.classList.remove("open");
  document.body.style.overflow = "";
}

function renderCartDrawer() {
  const body   = document.getElementById("cartDrawerBody");
  const footer = document.getElementById("cartDrawerFooter");
  if (!body || !footer) return;

  const cart = getCart();

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <a href="index.html" onclick="closeCartDrawer()" class="btn btn-primary" style="margin-top:1.25rem;display:inline-flex">Browse Products</a>
      </div>`;
    footer.innerHTML = "";
    return;
  }

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://picsum.photos/seed/e${item.id}/80/80'">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">৳ ${item.price.toLocaleString()} each</div>
        <div class="cart-item-controls">
          <button class="ci-btn" onclick="updateCartQty(${item.id}, -1)">−</button>
          <span class="ci-qty">${item.qty}</span>
          <button class="ci-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
          <button class="ci-remove" onclick="removeFromCart(${item.id})" title="Remove">🗑</button>
        </div>
      </div>
      <div class="cart-item-subtotal">৳ ${(item.price * item.qty).toLocaleString()}</div>
    </div>`).join("");

  const sub   = cartTotal();
  const total = sub + getDelivery();

  footer.innerHTML = `
    <div class="cart-summary-rows">
      <div class="cart-sum-row"><span>Subtotal</span><span>৳ ${sub.toLocaleString()}</span></div>
      <div class="cart-sum-row"><span>Delivery</span><span>৳ ${getDelivery()} (zone set at checkout)</span></div>
      <div class="cart-sum-row cart-sum-total"><span>Est. Total</span><span>৳ ${total.toLocaleString()}+</span></div>
    </div>
    <div class="cart-footer-btns">
      <button onclick="clearCart()" class="btn-clear-cart">Clear All</button>
      <button onclick="goToCheckout()" class="btn-checkout-cart">Checkout →</button>
    </div>`;
}

function goToCheckout() {
  if (cartCount() === 0) { showToast("Cart is empty", "error"); return; }
  closeCartDrawer();
  window.location.href = "checkout.html";
}

// ================================================================
//  TOAST
// ================================================================
function showToast(msg, type = "info") {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.style.borderLeftColor = type === "success" ? "var(--cyan)" : type === "error" ? "var(--danger)" : "var(--amber)";
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ================================================================
//  INDEX PAGE
// ================================================================
(function initIndex() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  ensureCartDrawer();

  Object.values(products).forEach((p, i) => {
    const card = document.createElement("a");
    card.href  = `product.html?id=${p.id}`;
    card.className = `product-card stagger-${i + 1}`;
    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="this.src='https://picsum.photos/seed/fb${p.id}/400/300'">
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ""}
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.description}</div>
        <div class="card-footer">
          <div class="card-price">৳ ${p.price.toLocaleString()}<br><small>+ ৳70–130 delivery</small></div>
          <div class="card-arrow">→</div>
        </div>
      </div>`;
    grid.appendChild(card);
  });
})();

// ================================================================
//  PRODUCT PAGE
// ================================================================
(function initProduct() {
  if (!document.getElementById("productName")) return;
  ensureCartDrawer();

  const params = new URLSearchParams(window.location.search);
  const p = products[params.get("id")];

  if (!p) {
    document.querySelector(".product-page").innerHTML = `
      <div class="empty-state">
        <div style="font-size:3rem;margin-bottom:1rem">🔍</div>
        <h2>Product not found</h2>
        <p>The product you're looking for doesn't exist.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem;display:inline-flex">← Back to Shop</a>
      </div>`;
    return;
  }

  window.currentProduct = p;
  document.title = `${p.name} — Gadget N Decor`;
  document.getElementById("productName").textContent        = p.name;
  document.getElementById("productPrice").textContent       = `৳ ${p.price.toLocaleString()}`;
  document.getElementById("productDescription").textContent = p.description;

  const mainImg = document.getElementById("mainImage");
  mainImg.src = p.images[0];
  mainImg.alt = p.name;
  mainImg.onerror = () => { mainImg.src = `https://picsum.photos/seed/fb${p.id}/600/600`; };

  const gallery = document.getElementById("thumbnailGallery");
  p.images.forEach((src, idx) => {
    const div = document.createElement("div");
    div.className = `thumb${idx === 0 ? " active" : ""}`;
    div.innerHTML = `<img src="${src}" alt="View ${idx+1}" onerror="this.src='https://picsum.photos/seed/t${idx}${p.id}/120/120'">`;
    div.addEventListener("click", () => {
      mainImg.style.opacity = "0";
      setTimeout(() => { mainImg.src = src; mainImg.style.opacity = "1"; }, 180);
      document.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
      div.classList.add("active");
    });
    gallery.appendChild(div);
  });
})();

function changeQuantity(delta) {
  const el = document.getElementById("quantity");
  if (!el) return;
  let q = parseInt(el.textContent) + delta;
  if (q < 1) q = 1;
  el.textContent = q;
}

function addToCartFromPage() {
  const p = window.currentProduct;
  if (!p) return;
  addToCart(p, parseInt(document.getElementById("quantity").textContent));
}

function buyNow() {
  const p = window.currentProduct;
  if (!p) return;
  addToCart(p, parseInt(document.getElementById("quantity").textContent));
  setTimeout(() => { closeCartDrawer(); window.location.href = "checkout.html"; }, 300);
}

// ================================================================
//  CHECKOUT PAGE
// ================================================================
function refreshCheckoutTotals() {
  const sub   = cartTotal();
  const total = sub + getDelivery();
  const subEl = document.getElementById("coSubtotal");
  const delEl = document.getElementById("coDelivery");
  const totEl = document.getElementById("coTotal");
  if (subEl) subEl.textContent = `৳ ${sub.toLocaleString()}`;
  if (delEl) delEl.textContent = `৳ ${getDelivery()}`;
  if (totEl) totEl.textContent = `৳ ${total.toLocaleString()}`;
}

(function initCheckout() {
  const section = document.getElementById("checkoutItemsList");
  if (!section) return;

  const cart = getCart();

  if (cart.length === 0) {
    document.querySelector(".checkout-page").innerHTML = `
      <div class="empty-state" style="padding-top:calc(var(--nav-h) + 4rem)">
        <div style="font-size:3rem;margin-bottom:1rem">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some products before checking out.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem;display:inline-flex">← Browse Products</a>
      </div>`;
    return;
  }

  section.innerHTML = cart.map(item => `
    <div class="summary-item">
      <div class="summary-item-img">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://picsum.photos/seed/s${item.id}/80/80'">
      </div>
      <div style="flex:1;min-width:0">
        <div class="summary-item-name">${item.name}</div>
        <div class="summary-item-qty">Qty: ${item.qty} × ৳ ${item.price.toLocaleString()}</div>
      </div>
      <div style="font-family:var(--font-head);font-weight:700;color:var(--cyan);white-space:nowrap;flex-shrink:0">
        ৳ ${(item.price * item.qty).toLocaleString()}
      </div>
    </div>`).join("");

  refreshCheckoutTotals();
})();

async function submitOrder() {
  const cart = getCart();
  if (cart.length === 0) { showToast("Cart is empty", "error"); return; }

  const name    = document.getElementById("name").value.trim();
  const phone   = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const note    = document.getElementById("note")?.value.trim() || "";

  // Determine selected zone
  const zoneRadio = document.querySelector("input[name='zone']:checked");
  const zone      = zoneRadio ? zoneRadio.value : "inside";
  const delivery  = getDelivery();

  // Clear previous errors
  document.querySelectorAll(".field-error").forEach(el => el.classList.remove("field-error"));

  let hasError = false;
  if (!name)    { document.getElementById("name").classList.add("field-error");    hasError = true; }
  if (!phone)   { document.getElementById("phone").classList.add("field-error");   hasError = true; }
  if (!address) { document.getElementById("address").classList.add("field-error"); hasError = true; }
  if (hasError) { showToast("Please fill in all required fields", "error"); return; }

  if (!/^[\d+\-\s]{7,15}$/.test(phone)) {
    document.getElementById("phone").classList.add("field-error");
    showToast("Enter a valid phone number", "error");
    return;
  }

  const sub   = cartTotal();
  const total = sub + delivery;

  // Build one row per cart item — matches the single-product Buy Now path
  const timestamp = new Date().toISOString();
  const rows = cart.map(item => ({
    timestamp,
    name,
    phone,
    address,
    note,
    zone,
    product:    item.name,
    productId:  item.id,
    quantity:   item.qty,
    unitPrice:  item.price,
    delivery,
    total:      item.price * item.qty + delivery   // per-item total; overall order total below
  }));

  // Also attach order-level summary to first row
  rows[0].orderSubtotal = sub;
  rows[0].orderDelivery = delivery;
  rows[0].orderTotal    = total;
  rows[0].itemCount     = cart.length;

  const btn = document.getElementById("placeOrderBtn");
  btn.classList.add("loading");
  btn.disabled = true;

  try {
    // Send all rows; Apps Script receives an array and loops to append each
    await fetch(SHEET_URL, {
      method:  "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body:    JSON.stringify({ rows })
    });
    clearCart();
    document.getElementById("checkoutForm").style.display = "none";
    document.getElementById("successScreen").classList.add("visible");
  } catch (err) {
    console.error(err);
    showToast("Network error — please try again", "error");
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

document.addEventListener("input", e => {
  if (e.target.classList.contains("field-error")) e.target.classList.remove("field-error");
});
// This makes your functions "Global" so your HTML buttons can find them
window.openCartDrawer = openCartDrawer;
window.closeCartDrawer = closeCartDrawer;
window.updateCartQty = updateCartQty;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.goToCheckout = goToCheckout;
window.addToCartFromPage = addToCartFromPage;
window.buyNow = buyNow;
window.changeQuantity = changeQuantity;
window.submitOrder = submitOrder;
window.onZoneChange = onZoneChange;