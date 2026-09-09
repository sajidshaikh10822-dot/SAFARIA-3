/* =========================================================
   SAFARIA - COMPLETE SCRIPT
   Supabase Products + Search + Categories + Cart + Orders
   ========================================================= */

const SUPABASE_URL = "https://dcwdzbejpwvskajukxrh.supabase.co";
const SUPABASE_KEY = "sb_publishable_1IsM8N7-OEcBJyIH5HnsFw_cl6F5oPU";

let supabaseClient = null;
let products = [];
let cart = JSON.parse(localStorage.getItem("safaria_cart") || "[]");

/* =========================
   SUPABASE
   ========================= */

function initSupabase() {
  if (!window.supabase) {
    console.error("Supabase library not loaded.");
    return false;
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  return true;
}

/* =========================
   HELPERS
   ========================= */

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getProductImage(product) {
  return (
    product.image_url ||
    product.image ||
    product.img ||
    "https://via.placeholder.com/300x300?text=SAFARIA"
  );
}

function getProductName(product) {
  return product.name || product.title || "SAFARIA Product";
}

function getProductPrice(product) {
  return Number(product.price || 0);
}

/* =========================
   LOAD PRODUCTS
   ========================= */

async function loadProducts() {
  const container =
    document.getElementById("products") ||
    document.getElementById("product-list") ||
    document.querySelector(".products");

  if (!container) {
    console.error("Products container not found.");
    return;
  }

  container.innerHTML = `
    <div style="padding:25px;text-align:center;">
      ⏳ Loading products...
    </div>
  `;

  if (!supabaseClient) {
    container.innerHTML = `
      <div style="padding:25px;text-align:center;color:red;">
        ❌ Supabase is not initialized.
      </div>
    `;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Supabase products error:", error);

      container.innerHTML = `
        <div style="padding:25px;text-align:center;color:red;">
          ❌ Products could not be loaded.<br>
          <small>${escapeHTML(error.message)}</small>
        </div>
      `;

      return;
    }

    products = Array.isArray(data) ? data : [];

    console.log("SAFARIA Products:", products);

    if (products.length === 0) {
      container.innerHTML = `
        <div style="padding:25px;text-align:center;">
          🛍️ No products found.
        </div>
      `;
      return;
    }

    renderProducts(products);

  } catch (error) {
    console.error("Product loading failed:", error);

    container.innerHTML = `
      <div style="padding:25px;text-align:center;color:red;">
        ❌ Products could not be loaded.
      </div>
    `;
  }
}

/* =========================
   RENDER PRODUCTS
   ========================= */

function renderProducts(list) {
  const container =
    document.getElementById("products") ||
    document.getElementById("product-list") ||
    document.querySelector(".products");

  if (!container) return;

  container.innerHTML = "";

  list.forEach(product => {
    const id = product.id;
    const name = getProductName(product);
    const price = getProductPrice(product);
    const image = getProductImage(product);
    const category = product.category || "";

    const card = document.createElement("div");

    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">
        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(name)}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/300x300?text=SAFARIA'"
        >
      </div>

      <div class="product-info">
        <h3>${escapeHTML(name)}</h3>

        ${
          category
            ? `<p class="product-category">${escapeHTML(category)}</p>`
            : ""
        }

        <div class="product-price">
          ₹${price.toLocaleString("en-IN")}
        </div>

        <button
          class="add-to-cart-btn"
          onclick="addToCart('${String(id).replace(/'/g, "\\'")}')"
        >
          🛒 Add to Cart
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

/* =========================
   SEARCH
   ========================= */

function searchProducts() {
  const input =
    document.getElementById("searchInput") ||
    document.getElementById("search") ||
    document.querySelector('input[type="search"]');

  if (!input) return;

  const keyword = input.value.trim().toLowerCase();

  if (!keyword) {
    renderProducts(products);
    return;
  }

  const result = products.filter(product => {
    const name = getProductName(product).toLowerCase();
    const category = String(product.category || "").toLowerCase();
    const description = String(product.description || "").toLowerCase();

    return (
      name.includes(keyword) ||
      category.includes(keyword) ||
      description.includes(keyword)
    );
  });

  renderProducts(result);
}

/* =========================
   CATEGORY FILTER
   ========================= */

function filterCategory(category) {
  if (!category || category.toLowerCase() === "all") {
    renderProducts(products);
    return;
  }

  const selected = category.toLowerCase();

  const result = products.filter(product => {
    return String(product.category || "").toLowerCase() === selected;
  });

  renderProducts(result);
}

/* =========================
   CART
   ========================= */

function addToCart(productId) {
  const product = products.find(
    p => String(p.id) === String(productId)
  );

  if (!product) {
    alert("Product not found.");
    return;
  }

  const existing = cart.find(
    item => String(item.id) === String(product.id)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: getProductName(product),
      price: getProductPrice(product),
      image: getProductImage(product),
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();

  alert("Product added to cart 🛒");
}

function removeFromCart(productId) {
  cart = cart.filter(
    item => String(item.id) !== String(productId)
  );

  saveCart();
  updateCartUI();
  renderCart();
}

function changeQuantity(productId, amount) {
  const item = cart.find(
    item => String(item.id) === String(productId)
  );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(
      item => String(item.id) !== String(productId)
    );
  }

  saveCart();
  updateCartUI();
  renderCart();
}

function saveCart() {
  localStorage.setItem(
    "safaria_cart",
    JSON.stringify(cart)
  );
}

function getCartCount() {
  return cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
}

function getCartTotal() {
  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
      Number(item.quantity || 0),
    0
  );
}

function updateCartUI() {
  const count = getCartCount();

  const cartElements = document.querySelectorAll(
    "#cartCount, .cart-count"
  );

  cartElements.forEach(element => {
    element.textContent = count;
  });

  const cartButton = document.querySelector(
    "#cartButton, .cart-button"
  );

  if (cartButton) {
    cartButton.innerHTML = `🛒 Cart (${count})`;
  }
}

/* =========================
   CART DISPLAY
   ========================= */

function renderCart() {
  const container =
    document.getElementById("cartItems") ||
    document.getElementById("cart-items") ||
    document.querySelector(".cart-items");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="padding:25px;text-align:center;">
        🛒 Your cart is empty.
      </div>
    `;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item"
         style="display:flex;gap:12px;align-items:center;margin-bottom:15px;">

      <img
        src="${escapeHTML(item.image)}"
        alt="${escapeHTML(item.name)}"
        style="width:70px;height:70px;object-fit:contain;"
      >

      <div style="flex:1;">
        <strong>${escapeHTML(item.name)}</strong>

        <div>
          ₹${Number(item.price).toLocaleString("en-IN")}
        </div>

        <div style="margin-top:5px;">
          <button onclick="changeQuantity('${String(item.id)}', -1)">−</button>

          <span style="margin:0 10px;">
            ${item.quantity}
          </span>

          <button onclick="changeQuantity('${String(item.id)}', 1)">+</button>
        </div>
      </div>

      <button onclick="removeFromCart('${String(item.id)}')">
        ❌
      </button>

    </div>
  `).join("");

  const totalElement =
    document.getElementById("cartTotal") ||
    document.getElementById("cart-total");

  if (totalElement) {
    totalElement.textContent =
      `₹${getCartTotal().toLocaleString("en-IN")}`;
  }
}

/* =========================
   CHECKOUT / ORDER
   ========================= */

async function placeOrder() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const name =
    document.getElementById("customerName")?.value.trim() || "";

  const phone =
    document.getElementById("customerPhone")?.value.trim() || "";

  const address =
    document.getElementById("address")?.value.trim() || "";

  const city =
    document.getElementById("city")?.value.trim() || "";

  const pin =
    document.getElementById("pin")?.value.trim() || "";

  const payment =
    document.getElementById("paymentMethod")?.value ||
    "Cash on Delivery";

  if (!name || !phone || !address || !city || !pin) {
    alert("Please fill all delivery details.");
    return;
  }

  const orderId =
    "SAF-" +
    Math.floor(100000 + Math.random() * 900000);

  const orderData = {
    order_id: orderId,
    name: name,
    phone: phone,
    address: address,
    city: city,
    pin: pin,
    payment_method: payment,
    items: cart,
    total: getCartTotal(),
    status: "Pending"
  };

  try {
    const { error } = await supabaseClient
      .from("orders")
      .insert([orderData]);

    if (error) {
      console.error("Order error:", error);
      alert("❌ Order failed: " + error.message);
      return;
    }

    alert(
      "✅ Order successful!\n\nOrder ID: " +
      orderId
    );

    cart = [];
    saveCart();
    updateCartUI();
    renderCart();

    const checkout =
      document.getElementById("checkout");

    if (checkout) {
      checkout.style.display = "none";
    }

  } catch (error) {
    console.error(error);
    alert("❌ Something went wrong while placing order.");
  }
}

/* =========================
   CART OPEN/CLOSE
   ========================= */

function openCart() {
  const cartBox =
    document.getElementById("cartPanel") ||
    document.getElementById("cart");

  if (cartBox) {
    cartBox.style.display = "block";
    renderCart();
  }
}

function closeCart() {
  const cartBox =
    document.getElementById("cartPanel") ||
    document.getElementById("cart");

  if (cartBox) {
    cartBox.style.display = "none";
  }
}

/* =========================
   SEARCH EVENTS
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  if (!initSupabase()) {
    console.error("Unable to initialize Supabase.");
    return;
  }

  updateCartUI();
  loadProducts();

  const searchInput =
    document.getElementById("searchInput") ||
    document.getElementById("search") ||
    document.querySelector('input[type="search"]');

  if (searchInput) {
    searchInput.addEventListener("input", searchProducts);

    searchInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        searchProducts();
      }
    });
  }

  /* Category buttons */
  document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      filterCategory(button.dataset.category);
    });
  });

});

/* =========================
   GLOBAL FUNCTIONS
   ========================= */

window.loadProducts = loadProducts;
window.renderProducts = renderProducts;
window.searchProducts = searchProducts;
window.filterCategory = filterCategory;

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;

window.openCart = openCart;
window.closeCart = closeCart;
window.renderCart = renderCart;
window.placeOrder = placeOrder;

window.updateCartUI = updateCartUI;
