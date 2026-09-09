const SUPABASE_URL = "https://wyavyrphoqmdaslsfbzq.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_tD-2Ekpx7d-jNkeyiTPj-w_mikOo0Yx";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let allProducts = [];

let cart = JSON.parse(
  localStorage.getItem("safaria_cart") || "[]"
);


// ===============================
// SECURITY
// ===============================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ===============================
// CART
// ===============================

function updateCartCount() {
  const el = document.getElementById("cartCount");

  if (el) {
    el.textContent = cart.reduce(
      (sum, item) => sum + Number(item.quantity || 1),
      0
    );
  }
}

function saveCart() {
  localStorage.setItem(
    "safaria_cart",
    JSON.stringify(cart)
  );

  updateCartCount();
}


// ===============================
// LOAD PRODUCTS
// ===============================

async function loadProducts() {
  const container = document.getElementById("products");

  if (!container) return;

  container.innerHTML = `
    <div class="loading">
      ⏳ Loading products...
    </div>
  `;

  try {
    const result = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    console.log("SAFARIA PRODUCT RESULT:", result);

    if (result.error) {
      throw result.error;
    }

    allProducts = result.data || [];

    console.log("SAFARIA PRODUCTS:", allProducts);

    displayProducts(allProducts);

  } catch (error) {
    console.error("SAFARIA PRODUCT ERROR:", error);

    container.innerHTML = `
      <div class="error-box">
        ❌ Products could not be loaded.
        <br><br>
        ${escapeHTML(error.message || "Unknown error")}
      </div>
    `;
  }
}


// ===============================
// DISPLAY PRODUCTS
// ===============================

function displayProducts(products) {
  const container = document.getElementById("products");

  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="empty">
        😔 No products found.
      </div>
    `;

    return;
  }

  container.innerHTML = products.map(product => {

    const name =
      product.name ||
      product.title ||
      "Product";

    const image =
      product.image ||
      product.image_url ||
      product.imageUrl ||
      "https://via.placeholder.com/300x300?text=SAFARIA";

    const price =
      Number(product.price || 0);

    const stock =
      Number(
        product.stock ??
        product.quantity ??
        0
      );

    return `
      <div class="product">

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(name)}"
          onerror="this.src='https://via.placeholder.com/300x300?text=SAFARIA'"
        >

        <h3>
          ${escapeHTML(name)}
        </h3>

        <div class="description">
          ${escapeHTML(product.description || "")}
        </div>

        <div class="price">
          ₹${price.toLocaleString("en-IN")}
        </div>

        <div class="stock">
          ${
            stock > 0
              ? `${stock} available`
              : "Out of stock"
          }
        </div>

        <button
          class="buy"
          ${stock <= 0 ? "disabled" : ""}
          onclick="addToCart('${String(product.id).replace(/'/g, "\\'")}')"
        >
          ${
            stock > 0
              ? "Add to Cart"
              : "Out of Stock"
          }
        </button>

      </div>
    `;

  }).join("");
}


// ===============================
// ADD TO CART
// ===============================

function addToCart(productId) {

  const product =
    allProducts.find(
      item =>
        String(item.id) ===
        String(productId)
    );

  if (!product) {
    alert("Product not found.");
    return;
  }

  const stock =
    Number(
      product.stock ??
      product.quantity ??
      0
    );

  if (stock <= 0) {
    alert("This product is out of stock.");
    return;
  }

  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );

  if (existing) {

    if (existing.quantity >= stock) {
      alert("Maximum available stock reached.");
      return;
    }

    existing.quantity++;

  } else {

    cart.push({
      id: product.id,

      name:
        product.name ||
        product.title ||
        "Product",

      price:
        Number(product.price || 0),

      image:
        product.image ||
        product.image_url ||
        product.imageUrl ||
        "",

      quantity: 1
    });
  }

  saveCart();

  alert("✅ Product added to cart!");
}


// ===============================
// CART PANEL
// ===============================

function openCart() {

  const panel =
    document.getElementById("cartPanel");

  if (panel) {
    panel.style.display = "block";
  } else {
    window.location.href = "checkout.html";
  }
}

function goToCheckout() {

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  saveCart();

  window.location.href = "checkout.html";
}

function changeQuantity(productId, change) {

  const item =
    cart.find(
      product =>
        String(product.id) ===
        String(productId)
    );

  if (!item) return;

  item.quantity += Number(change);

  if (item.quantity <= 0) {

    cart =
      cart.filter(
        product =>
          String(product.id) !==
          String(productId)
      );
  }

  saveCart();
}

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        String(item.id) !==
        String(productId)
    );

  saveCart();
}

function clearCart() {
  cart = [];
  saveCart();
}


// ===============================
// SEARCH
// ===============================

function searchProducts() {

  const input =
    document.getElementById("searchInput");

  if (!input) return;

  const search =
    input.value
      .trim()
      .toLowerCase();

  if (!search) {
    displayProducts(allProducts);
    return;
  }

  const filtered =
    allProducts.filter(product => {

      const name =
        String(
          product.name ||
          product.title ||
          ""
        ).toLowerCase();

      const description =
        String(
          product.description ||
          ""
        ).toLowerCase();

      const category =
        String(
          product.category ||
          ""
        ).toLowerCase();

      return (
        name.includes(search) ||
        description.includes(search) ||
        category.includes(search)
      );

    });

  displayProducts(filtered);
}


// ===============================
// CATEGORY FILTER
// ===============================

function filterCategory(category) {

  const filtered =
    allProducts.filter(
      product =>
        String(product.category || "").toLowerCase() ===
        String(category || "").toLowerCase()
    );

  const title =
    document.getElementById("productTitle");

  if (title) {
    title.textContent = `🛍️ ${category}`;
  }

  displayProducts(filtered);
}

function showAllProducts() {

  const title =
    document.getElementById("productTitle");

  if (title) {
    title.textContent = "🛍️ Latest Products";
  }

  displayProducts(allProducts);
}


// ===============================
// LOGIN CHECK
// ===============================

async function checkLogin() {

  try {

    const {
      data: { session }
    } =
      await supabaseClient.auth.getSession();

    const accountBtn =
      document.getElementById("accountBtn");

    const accountBox =
      document.getElementById("accountBox");

    const emailElement =
      document.getElementById("customerEmail");

    if (session && session.user) {

      if (accountBtn) {
        accountBtn.style.display = "none";
      }

      if (accountBox) {
        accountBox.style.display = "flex";
      }

      if (emailElement) {
        emailElement.textContent =
          session.user.email || "-";
      }

    } else {

      if (accountBtn) {
        accountBtn.style.display = "block";
      }

      if (accountBox) {
        accountBox.style.display = "none";
      }
    }

  } catch (error) {

    console.error(
      "Login check error:",
      error
    );
  }
}


// ===============================
// LOGOUT
// ===============================

async function logout() {

  try {

    await supabaseClient.auth.signOut();

    window.location.reload();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );
  }
}


// ===============================
// MY ORDERS
// ===============================

async function showMyOrders() {

  const ordersBox =
    document.getElementById("myOrders");

  const ordersList =
    document.getElementById("myOrdersList");

  if (!ordersBox || !ordersList) return;

  ordersBox.style.display = "block";

  ordersList.innerHTML =
    "⏳ Loading orders...";

  try {

    const {
      data: { session }
    } =
      await supabaseClient.auth.getSession();

    if (!session || !session.user) {

      ordersList.innerHTML =
        "Please login first.";

      return;
    }

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .select("*")
        .eq(
          "customer_email",
          session.user.email
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {

      ordersList.innerHTML =
        "No orders found.";

      return;
    }

    ordersList.innerHTML =
      data.map(
        order => `

          <div class="my-order">

            <b>Order ID:</b>
            ${escapeHTML(
              order.order_id ||
              order.id ||
              "-"
            )}

            <br>

            <b>Total:</b>
            ₹${Number(
              order.total || 0
            ).toLocaleString("en-IN")}

            <br>

            <b>Status:</b>
            ${escapeHTML(
              order.status ||
              "Pending"
            )}

          </div>

        `
      ).join("");

  } catch (error) {

    console.error(
      "Orders error:",
      error
    );

    ordersList.innerHTML =
      "Unable to load orders.";
  }
}


// ===============================
// START
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    updateCartCount();

    loadProducts();

    checkLogin();

  }
);
