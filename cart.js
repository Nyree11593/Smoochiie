/* cart.js — SMOOCHiiE unified cart (stable toggle + remove + bag/checkout sync) */
(() => {
  const CART_KEY = "smoochiie_cart";

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const safeParse = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };
  const money = (n) => "$" + (Number(n || 0)).toFixed(2);
  const parsePrice = (raw) => {
    if (raw == null) return NaN;
    const s = String(raw).replace(/[^0-9.]/g, "");
    const v = parseFloat(s);
    return Number.isFinite(v) ? v : NaN;
  };

  const toast = (msg) => {
    let el = $("#cart-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "cart-toast";
      el.style.cssText =
        "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:9999;" +
        "background:rgba(15,15,20,0.95);color:#fff;padding:10px 14px;border:1px solid #333;" +
        "border-radius:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;font-size:12px;" +
        "box-shadow:0 10px 30px rgba(0,0,0,.55);opacity:0;transition:opacity .18s ease";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.style.opacity = "0"), 1400);
  };

  const getCart = () => safeParse(localStorage.getItem(CART_KEY), []);
  const setCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
  const cartTotal = (cart) => cart.reduce((sum, it) => sum + (Number(it.price)||0) * (Number(it.qty)||1), 0);

  const normalizeItem = ({ name, price, image }) => {
    const cleanName = (name || "").trim();
    const p = Number(price);
    const cleanImage = (image || "").trim();
    if (!cleanName) return null;
    if (!Number.isFinite(p)) return null;
    const id = (cleanName + "|" + p + "|" + cleanImage).toLowerCase();
    return { id, name: cleanName, price: p, image: cleanImage, qty: 1 };
  };

  // ---------- mini-cart toggle ----------
  const isMiniOpen = () => {
    const mini = $("#mini-cart");
    return !!mini && mini.style.display === "block";
  };

  const openMini = () => {
    const mini = $("#mini-cart");
    if (!mini) return;
    mini.style.display = "block";
  };

  const closeMini = () => {
    const mini = $("#mini-cart");
    if (!mini) return;
    mini.style.display = "none";
  };

  const toggleMini = () => (isMiniOpen() ? closeMini() : openMini());

  // expose for any leftover inline HTML hooks
  window.toggleCart = toggleMini;

  // ---------- renderers ----------
  const updateCount = (cart) => {
    const el = $("#cart-count");
    if (!el) return;
    const count = cart.reduce((n, it) => n + (Number(it.qty)||1), 0);
    el.textContent = String(count);
    el.style.transform = "scale(1.15)";
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.style.transform = "scale(1)"), 140);
  };

  const renderMini = (cart) => {
    const wrap = $("#mini-cart-items");
    const subEl = $("#mini-cart-subtotal");
    if (!wrap || !subEl) return;

    wrap.innerHTML = "";
    cart.forEach((it) => {
      const row = document.createElement("div");
      row.className = "cart-item-mini";
      row.innerHTML = `
        <img src="${it.image || "https://placehold.co/60x60"}" alt="${it.name}">
        <div class="cart-item-info" style="flex:1">
          <h4>${it.name}</h4>
          <p>${money(it.price)} × ${it.qty}</p>
        </div>
        <button class="remove-mini remove-btn" data-id="${it.id}"
          style="background:none;border:none;color:#a31e1e;font-weight:900;text-transform:uppercase;cursor:pointer;">Remove</button>
      `;
      wrap.appendChild(row);
    });

    subEl.textContent = money(cartTotal(cart));
  };

  const renderBag = (cart) => {
    const list = $("#cart-list");
    if (!list) return;

    list.innerHTML = "";
    cart.forEach((it) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      // keep bag.html styling, only inject content
      row.innerHTML = `
        <div class="thumb"><img src="${it.image || "https://placehold.co/120x120"}" alt="${it.name}"></div>
        <div class="meta">
          <h4>${it.name}</h4>
          <div class="price">${money(it.price)} × ${it.qty}</div>
        </div>
        <button class="remove-btn" data-id="${it.id}" title="Remove"><i class="fa-solid fa-trash"></i></button>
      `;
      list.appendChild(row);
    });

    const sub = cartTotal(cart);
    const subEl = $("#summary-subtotal");
    const totEl = $("#summary-total");
    if (subEl) subEl.textContent = money(sub);
    if (totEl) totEl.textContent = money(sub);
  };

  const renderCheckout = (cart) => {
    const wrap = $("#checkout-items");
    if (!wrap) return;

    wrap.innerHTML = "";
    cart.forEach((it) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06)";
      row.innerHTML = `
        <img src="${it.image || "https://placehold.co/54x54"}" alt="${it.name}" style="width:54px;height:54px;border-radius:12px;object-fit:cover">
        <div style="flex:1">
          <div style="font-weight:900;text-transform:uppercase">${it.name}</div>
          <div style="opacity:.75;font-weight:700;margin-top:2px">${money(it.price)} × ${it.qty}</div>
        </div>
      `;
      wrap.appendChild(row);
    });

    const sub = cartTotal(cart);
    const tax = 0;
    const tot = sub + tax;

    const subEl = $("#subtotal");
    const taxEl = $("#tax");
    const totEl = $("#total");
    if (subEl) subEl.textContent = money(sub);
    if (taxEl) taxEl.textContent = money(tax);
    if (totEl) totEl.textContent = money(tot);
  };

  const renderCartPage = (cart) => {
    const root = $("#cart-root");
    if (!root) return;

    if (!cart.length) {
      root.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
      return;
    }
    root.innerHTML = "";
    cart.forEach((it) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${it.image || "https://placehold.co/64x64"}" alt="${it.name}"
             style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,255,255,.12)">
        <div style="flex:1">
          <div style="font-weight:900;text-transform:uppercase">${it.name}</div>
          <div style="opacity:.75;font-weight:700;margin-top:2px">${money(it.price)} × ${it.qty}</div>
        </div>
        <button class="remove-btn" data-id="${it.id}"
          style="background:none;border:none;color:#ef4444;font-weight:900;text-transform:uppercase;cursor:pointer;">Remove</button>
      `;
      root.appendChild(row);
    });
  };

  const updateUI = () => {
    const cart = getCart();
    updateCount(cart);
    renderMini(cart);
    renderBag(cart);
    renderCheckout(cart);
    renderCartPage(cart);
  };

  // ---------- actions ----------
  const addFromButton = (btn) => {
    // Prefer data- attributes
    let name = btn.getAttribute("data-name");
    let priceRaw = btn.getAttribute("data-price");
    let image = btn.getAttribute("data-image");

    // Fallback: infer from nearest card/container
    if (!name || !priceRaw) {
      const card = btn.closest(".card, .product-card, .product, .item, .grid-item");
      if (card) {
        if (!name) {
          const nameEl = card.querySelector(".name, .title, h3, h2");
          if (nameEl) name = nameEl.textContent.trim();
        }
        if (!priceRaw) {
          const priceEl = card.querySelector(".price, .amount, [data-price]");
          if (priceEl) priceRaw = priceEl.getAttribute("data-price") || priceEl.textContent;
        }
        if (!image) {
          const img = card.querySelector("img");
          if (img) image = img.getAttribute("src");
        }
      }
    }

    const price = parsePrice(priceRaw);
    const item = normalizeItem({ name, price, image });
    if (!item) {
      toast("This item needs a price");
      return;
    }

    const cart = getCart();
    const existing = cart.find((x) => x.id === item.id);
    if (existing) existing.qty += 1;
    else cart.push(item);

    setCart(cart);
    updateUI();
    openMini(); // show feedback
    toast("Added to bag");
  };

  const removeById = (id) => {
    const next = getCart().filter((x) => x.id !== id);
    setCart(next);
    updateUI();
  };

  const clearCart = () => {
    setCart([]);
    updateUI();
    toast("Cart cleared");
  };

  window.clearCart = clearCart;

  // ---------- wiring ----------
  const init = () => {
    // ensure mini cart starts hidden so it doesn't wreck nav
    if ($("#mini-cart")) closeMini();

    // kill inline onclick if present (prevents "Proceed to Bag" hijack)
    const iconWrap = $("#cart-icon-container");
    if (iconWrap && iconWrap.getAttribute("onclick")) iconWrap.removeAttribute("onclick");

    // open/close when clicking the icon container, but NOT when clicking inside the dropdown
    if (iconWrap) {
      iconWrap.addEventListener("click", (e) => {
        const mini = $("#mini-cart");
        if (mini && mini.contains(e.target)) return; // let dropdown clicks work
        toggleMini();
      });
    }

    // Outside click closes dropdown (but clicks inside do nothing special)
    document.addEventListener("click", (e) => {
      const mini = $("#mini-cart");
      const icon = $("#cart-icon-container");
      if (!mini) return;

      // remove
      const rm = e.target.closest(".remove-btn, .remove-mini");
      if (rm && rm.getAttribute("data-id")) {
        e.preventDefault();
        removeById(rm.getAttribute("data-id"));
        return;
      }

      // clear cart link/button
      const clr = e.target.closest(".continue-shopping, #clear-bag, #clear-cart");
      if (clr) {
        const txt = (clr.textContent || "").trim().toLowerCase();
        if (txt.includes("clear")) {
          e.preventDefault();
          clearCart();
          return;
        }
      }

      // Add to cart: ONLY known selectors (prevents hijacking navigation)
      const addBtn = e.target.closest(".add-btn, .add-to-cart-btn, [data-add-to-cart]");
      if (addBtn) {
        e.preventDefault();
        addFromButton(addBtn);
        return;
      }

      // proceed to checkout from bag (button)
      const checkoutBtn = e.target.closest("#checkout-btn");
      if (checkoutBtn) {
        const cart = getCart();
        if (!cart.length) {
          e.preventDefault();
          toast("Bag is empty");
          return;
        }
        e.preventDefault();
        window.location.href = "checkout.html";
        return;
      }

      // close if click outside both
      if (isMiniOpen() && !mini.contains(e.target) && !(icon && icon.contains(e.target))) {
        closeMini();
      }
    });

    // sync across tabs
    window.addEventListener("storage", (e) => {
      if (e.key === CART_KEY) updateUI();
    });

    updateUI();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
