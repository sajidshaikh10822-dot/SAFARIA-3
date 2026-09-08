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

  cart = cart.filter(item =>
    item &&
    item.id !== undefined &&
    item.id !== null
  );

  cart.forEach(item => {
    item.quantity = Math.max(
      1,
      Number(item.quantity || 1)
    );
  });

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
            ${
              stock > 0
                ? "✅ In Stock"
                : "❌ Out of Stock"
            }
          </p>

          <button
            onclick="addToCart(${JSON.stringify(product.id)})"
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
      p =>
        String(p.id) ===
        String(productId)
    );

  if (!product) {
    alert("Product not found");
    return;
  }

  const stock =
    Number(product.stock || 0);

  if (stock <= 0) {
    alert("❌ This product is out of stock.");
    return;
  }

  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );

  if (existing) {

    const currentQuantity =
      Number(existing.quantity || 1);

    if (currentQuantity >= stock) {
      alert(
        `Only ${stock} item(s) available in stock.`
      );
      return;
    }

    existing.quantity =
      currentQuantity + 1;

  } else {

    cart.push({

      id: product.id,

      name:
        product.name || "Product",

      description:
        product.description || "",

      price:
        Number(product.price || 0),

      image:
        product.image || "",

      category:
        product.category || "",

      stock:
        stock,

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

  const cartQuantity =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 1),
      0
    );

  if (countElement) {
    countElement.innerText =
      cartQuantity;
  }


  const itemsElement =
    document.getElementById("cartItems");

  const totalElement =
    document.getElementById("total") ||
    document.getElementById("cartTotal");

  if (!itemsElement) return;


  if (!cart.length) {

    itemsElement.innerHTML = `
      <div class="empty-cart">
        <p style="font-size:18px;font-weight:bold;">
          Your cart is empty 🛒
        </p>

        <p style="margin-top:8px;color:#666;">
          Add products to your cart.
        </p>
      </div>
    `;

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
        Math.max(
          1,
          Number(item.quantity || 1)
        );

      const price =
        Number(item.price || 0);

      const stock =
        Number(item.stock || 999999);

      total +=
        price * quantity;


      return `
        <div
          class="cart-item"
          style="
            border:1px solid #ddd;
            border-radius:10px;
            padding:12px;
            margin-bottom:12px;
            background:#fff;
          "
        >

          <div
            style="
              display:flex;
              gap:12px;
              align-items:center;
            "
          >

            ${
              item.image
                ? `
                  <img
                    src="${escapeHtml(item.image)}"
                    alt="${escapeHtml(item.name)}"
                    style="
                      width:70px;
                      height:70px;
                      object-fit:contain;
                      border-radius:8px;
                    "
                  >
                `
                : ""
            }


            <div style="flex:1;">

              <strong
                style="
                  display:block;
                  font-size:16px;
                  margin-bottom:5px;
                "
              >
                ${escapeHtml(item.name)}
              </strong>


              <p
                style="
                  margin:0 0 8px;
                  font-weight:bold;
                "
              >
                ₹${price.toLocaleString("en-IN")}
              </p>


              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:8px;
                  flex-wrap:wrap;
                "
              >

                <!-- DECREASE -->

                <button
                  type="button"
                  onclick="decreaseCartQuantity(${index})"
                  style="
                    background:#eee;
                    color:#111;
                    border:1px solid #ccc;
                    padding:7px 12px;
                    border-radius:6px;
                    cursor:pointer;
                    font-weight:bold;
                    margin:0;
                  "
                >
                  −
                </button>


                <!-- QUANTITY -->

                <span
                  style="
                    min-width:28px;
                    text-align:center;
                    font-weight:bold;
                  "
                >
                  ${quantity}
                </span>


                <!-- INCREASE -->

                <button
                  type="button"
                  onclick="increaseCartQuantity(${index})"
                  style="
                    background:#eee;
                    color:#111;
                    border:1px solid #ccc;
                    padding:7px 12px;
                    border-radius:6px;
                    cursor:pointer;
                    font-weight:bold;
                    margin:0;
                  "
                  ${
                    quantity >= stock
                      ? "disabled"
                      : ""
                  }
                >
                  +
                </button>

              </div>

            </div>

          </div>


          <!-- REMOVE BUTTON -->

          <button
            type="button"
            onclick="removeFromCart(${index})"
            style="
              width:100%;
              margin-top:10px;
              background:#e53935;
              color:white;
              border:none;
              padding:10px 14px;
              border-radius:7px;
              cursor:pointer;
              font-weight:bold;
            "
          >
            🗑️ Remove from Cart
          </button>


          <!-- ITEM TOTAL -->

          <p
            style="
              margin-top:8px;
              font-weight:bold;
              text-align:right;
            "
          >
            Item Total:
            ₹${(price * quantity).toLocaleString("en-IN")}
          </p>

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
   INCREASE QUANTITY
========================= */

function increaseCartQuantity(index) {

  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }

  const item =
    cart[index];

  const currentQuantity =
    Number(item.quantity || 1);

  const stock =
    Number(item.stock || 999999);


  if (currentQuantity >= stock) {

    alert(
      `Only ${stock} item(s) available in stock.`
    );

    return;
  }


  item.quantity =
    currentQuantity + 1;

  saveCart();
}


/* =========================
   DECREASE QUANTITY
========================= */

function decreaseCartQuantity(index) {

  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }

  const item =
    cart[index];

  const currentQuantity =
    Number(item.quantity || 1);


  if (currentQuantity <= 1) {

    removeFromCart(index);

    return;
  }


  item.quantity =
    currentQuantity - 1;

  saveCart();
}


/* =========================
   REMOVE FROM CART
========================= */

function removeFromCart(index) {

  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }

  const itemName =
    cart[index].name || "Product";


  cart.splice(index, 1);

  saveCart();


  alert(
    `🗑️ ${itemName} removed from cart.`
  );
}


/* =========================
   CLEAR ENTIRE CART
========================= */

function clearCart() {

  if (!cart.length) {
    return;
  }

  const confirmClear =
    confirm(
      "Are you sure you want to remove all products from your cart?"
    );

  if (!confirmClear) {
    return;
  }

  cart = [];

  saveCart();

  alert("🗑️ Cart cleared successfully.");
}


/* =========================
   OPEN CART
========================= */

function openCart() {

  const panel =
    document.getElementById("cartPanel");

  if (panel) {

    panel.classList.add("open");

    panel.style.display =
      "block";
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

    panel.style.display =
      "none";
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


  /*
    Checkout always goes to checkout.html.
    It never goes to admin.html.
  */

  window.location.assign(
    "checkout.html"
  );
}


/* =========================
   CHECKOUT SUPPORT
========================= */

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
    document.getElementById(
      "searchInput"
    );

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


/* =========================
   SHOW ALL
========================= */

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
