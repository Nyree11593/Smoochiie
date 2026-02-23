// cart.js

let cart = JSON.parse(localStorage.getItem('smoochiie-cart')) || [];

function saveCart() {
  localStorage.setItem('smoochiie-cart', JSON.stringify(cart));
}

function updateMiniCart() {
  const miniCartItems = document.getElementById('mini-cart-items');
  const cartCount = document.getElementById('cart-count');
  const subtotalEl = document.getElementById('mini-cart-subtotal');
  const bundleInfo = document.getElementById('sticker-bundle-info');
  const bundleCountEl = document.getElementById('sticker-bundle-count');
  const bundlePriceEl = document.getElementById('sticker-bundle-price');

  if (!miniCartItems) return;

  miniCartItems.innerHTML = '';

  let stickerCount = 0;
  let regularSubtotal = 0;
  let totalItems = 0;

  cart.forEach((item, index) => {
    totalItems += item.quantity;

    if (item.isSticker) {
      stickerCount += item.quantity;
    } else {
      regularSubtotal += parseFloat(item.price) * item.quantity;
    }

    const div = document.createElement('div');
    div.className = 'cart-item-mini';
    div.innerHTML = `
      <img src="${item.image || ''}" alt="${item.name}" onerror="this.style.display='none'" />
      <div class="cart-item-info" style="flex:1;">
        <h4>${item.name}</h4>
        <p>${item.isSticker ? '🌊 Ocean Sticker Bundle' : '$' + parseFloat(item.price).toFixed(2)}</p>
        <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
          <button onclick="changeQty(${index}, -1)" style="background:#333; color:#fff; border:none; border-radius:4px; width:22px; height:22px; cursor:pointer; font-weight:900;">−</button>
          <span style="font-size:13px;">${item.quantity}</span>
          <button onclick="changeQty(${index}, 1)" style="background:#333; color:#fff; border:none; border-radius:4px; width:22px; height:22px; cursor:pointer; font-weight:900;">+</button>
          <button onclick="removeCartItem(${index})" style="background:none; color:#ef4444; border:none; cursor:pointer; font-size:11px; text-decoration:underline; margin-left:4px;">Remove</button>
        </div>
      </div>
    `;
    miniCartItems.appendChild(div);
  });

  // Bundle pricing: every 1–9 stickers = $5.99, 10–18 = $11.98, etc.
  const bundleTotal = stickerCount > 0 ? Math.ceil(stickerCount / 9) * 5.99 : 0;
  const subtotal = regularSubtotal + bundleTotal;

  if (cartCount) cartCount.textContent = totalItems;
  if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);

  // Show/hide sticker bundle info bar
  if (bundleInfo) {
    if (stickerCount > 0) {
      bundleInfo.style.display = 'block';
      if (bundleCountEl) bundleCountEl.textContent = stickerCount;
      if (bundlePriceEl) bundlePriceEl.textContent = '$' + bundleTotal.toFixed(2);
    } else {
      bundleInfo.style.display = 'none';
    }
  }
}

function changeQty(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  updateMiniCart();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
  updateMiniCart();
}

function clearCart() {
  cart = [];
  saveCart();
  updateMiniCart();
}

document.addEventListener('DOMContentLoaded', () => {
  updateMiniCart();

  // Mini cart toggle
  const cartIcon = document.getElementById('cart-icon-container');
  const miniCart = document.getElementById('mini-cart');
  if (cartIcon && miniCart) {
    cartIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      miniCart.style.display = miniCart.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      if (miniCart) miniCart.style.display = 'none';
    });
    miniCart.addEventListener('click', (e) => e.stopPropagation());
  }

  // Regular "Add to Cart" buttons (via hidden button trigger from modal)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (btn) {
      const name = btn.getAttribute('data-name');
      const price = btn.getAttribute('data-price');
      const image = btn.getAttribute('data-image') || '';
      const existing = cart.find(i => i.name === name && !i.isSticker);
      if (existing) {
        existing.quantity++;
      } else {
        cart.push({ name, price, image, quantity: 1, isSticker: false });
      }
      saveCart();
      updateMiniCart();
      if (miniCart) miniCart.style.display = 'block';
    }
  });

  // Sticker "Add to Bundle" buttons
  document.querySelectorAll('.add-sticker-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const name = btn.getAttribute('data-name');
      const image = btn.getAttribute('data-image') || '';
      const existing = cart.find(i => i.name === name && i.isSticker);
      if (existing) {
        existing.quantity++;
      } else {
        cart.push({ name, price: '0.67', image, quantity: 1, isSticker: true });
      }
      saveCart();
      updateMiniCart();
      if (miniCart) miniCart.style.display = 'block';
    });
  });
});
