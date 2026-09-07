const products = [];

/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://dcwdzbejpwvskajukxrh.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_1IsM8N7-OEcBJyIH5HnsFw_cl6F5oPU";

const supabaseClient =
  window.supabase
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      )
    : null;


/* =========================
   CART
========================= */

let cart = [];

try {
  cart = JSON.parse(
    localStorage.getItem("safaria_cart") || "[]"
  );

  if (!Array.isArray(cart)) {
    cart = [];
  }
} catch (e) {
  cart = [];
}


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProductsFromSupabase() {

  if (!supabaseClient) {
    console.error("Supabase library not loaded");
    return;
  }

  try {

    const { data, error } =
      await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (error) {
      console.error(error);
      return;
    }

    window.safariaProducts = data || [];

    renderProducts(
      window.safariaProducts
    );

  } catch (error) {
    console.error(error);
  }
}


/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts(list) {

  const container =
    document.getElementById("products") ||
    document.querySelector(".products");

  if (!container) return;

  if (!list || !list.length) {

    container.innerHTML =
      "<p>No products available.</p>";

    return;
  }

  container.innerHTML =
    list.map(product => {

      const price =
        Number(product.price || 0);

      const stock =
        Number(product.stock || 0);

      const image =
        product.image ||
        "https://via.placeholder.com/300";

      return `
        <div class="product">

          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(product.name || "Product")}"
            style="max-width:100%;height:180px;object-fit:contain"
          >

          <h3>
            ${escapeHtml(product.name || "Product")}
          </h3>

          <p>
            ${escapeHtml(product.description || "")}
          </p>

          <h2>
            ₹${price.toLocaleString("en-IN")}
          </h2>

          <p>
            ${escapeHtml(product.category || "General")}
          </p>

          <p>
            ${stock > 0
              ? "✅ In Stock"
              : "❌ Out of Stock"}
          </p>

          <button
            onclick="addToCart(${product.id})"
            ${stock <= 0 ? "disabled" : ""}
          >
            🛒 Add to Cart
          </button>

        </div>
      `;

    }).join("");
}


/* =========================
   ADD TO CART
========================= */

function addToCart(productId) {

  const list =
    window.safariaProducts || [];

  const product =
    list.find(
      p => String(p.id) === String(productId)
    );

  if (!product) {
    alert("Product not found");
    return;
  }

  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );

  if (existing) {

    existing.quantity =
      Number(existing.quantity || 1) + 1;

  } else {

    cart.push({

      id: product.id,

      name: product.name,

      description:
        product.description || "",

      price:
        Number(product.price || 0),

      image:
        product.image || "",

      category:
        product.category || "",

      quantity: 1

    });

  }

  saveCart();

  alert("✅ Product added to Cart!");

  if (typeof openCart === "function") {
    openCart();
  }
}


/* =========================
   SAVE CART
========================= */

function saveCart() {

  localStorage.setItem(
    "safaria_cart",
    JSON.stringify(cart)
  );

  updateCart();
}


/* =========================
   UPDATE CART
========================= */

function updateCart() {

  const countElement =
    document.getElementById("cartCount");

  if (countElement) {

    countElement.innerText =
      cart.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 1),
        0
      );

  }

  const itemsElement =
    document.getElementById("cartItems");

  const totalElement =
    document.getElementById("total") ||
    document.getElementById("cartTotal");

  if (!itemsElement) return;

  if (!cart.length) {

    itemsElement.innerHTML =
      "<p>Your cart is empty 🛒</p>";

    if (totalElement) {
      totalElement.innerText =
        "Total: ₹0";
    }

    return;
  }

  let total = 0;

  itemsElement.innerHTML =
    cart.map((item, index) => {

      const quantity =
        Number(item.quantity || 1);

      const price =
        Number(item.price || 0);

      total += price * quantity;

      return `
        <div class="cart-item">

          <strong>
            ${escapeHtml(item.name)}
          </strong>

          <p>
            ₹${price.toLocaleString("en-IN")}
            × ${quantity}
          </p>

          <button
            onclick="removeFromCart(${index})"
          >
            Remove
          </button>

        </div>
      `;

    }).join("");

  if (totalElement) {

    totalElement.innerText =
      "Total: ₹" +
      total.toLocaleString("en-IN");

  }
}


/* =========================
   REMOVE FROM CART
========================= */

function removeFromCart(index) {

  cart.splice(index, 1);

  saveCart();
}


/* =========================
   OPEN CART
========================= */

function openCart() {

  const panel =
    document.getElementById("cartPanel");

  if (panel) {
    panel.classList.add("open");
    panel.style.display = "block";
  }

  updateCart();
}


/* =========================
   CLOSE CART
========================= */

function closeCart() {

  const panel =
    document.getElementById("cartPanel");

  if (panel) {
    panel.classList.remove("open");
    panel.style.display = "none";
  }
}


/* =========================
   CHECKOUT
========================= */

function goCheckout() {

  if (!cart.length) {

    alert("🛒 Cart is empty!");

    return;

  }

  localStorage.setItem(
    "safaria_cart",
    JSON.stringify(cart)
  );

  /* IMPORTANT:
     Checkout always goes to checkout.html.
     It never goes to admin.html.
  */

  window.location.assign(
    "checkout.html"
  );
}


/* Support different existing button names */
function checkout() {
  goCheckout();
}

function proceedToCheckout() {
  goCheckout();
}

function buyNow() {
  goCheckout();
}


/* =========================
   SEARCH
========================= */

function searchProducts() {

  const input =
    document.getElementById("searchInput");

  if (!input) return;

  const query =
    input.value
      .toLowerCase()
      .trim();

  const list =
    window.safariaProducts || [];

  if (!query) {

    renderProducts(list);

    return;
  }

  const filtered =
    list.filter(product =>

      String(product.name || "")
        .toLowerCase()
        .includes(query)

      ||

      String(product.description || "")
        .toLowerCase()
        .includes(query)

      ||

      String(product.category || "")
        .toLowerCase()
        .includes(query)

    );

  renderProducts(filtered);
}


/* =========================
   CATEGORY
========================= */

function filterCategory(category) {

  const list =
    window.safariaProducts || [];

  const filtered =
    list.filter(product =>

      String(product.category || "")
        .toLowerCase() ===
      String(category || "")
        .toLowerCase()

    );

  renderProducts(filtered);
}


function showAll() {

  renderProducts(
    window.safariaProducts || []
  );

}


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    updateCart();

    loadProductsFromSupabase();

  }
);