/* =====================================================
   SAFARIA - MAIN SCRIPT
   Product + Cart + Search + Category
===================================================== */


/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://dcwdzbejpwvskajukxrh.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_1IsM8N7-OEcBJyIH5HnsFw_cl6F5oPU";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================
   VARIABLES
========================= */

let allProducts = [];

let cart = [];


/* =========================
   HTML ESCAPE
========================= */

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================
   READ CART
========================= */

function readCart() {

  try {

    const saved =
      localStorage.getItem(
        "safaria_cart"
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      item =>
        item &&
        item.id !== undefined &&
        item.id !== null
    );

  } catch (error) {

    console.error(
      "Cart read error:",
      error
    );

    return [];

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

  updateCartCount();

}


/* =========================
   CART COUNT
========================= */

function updateCartCount() {

  cart = readCart();

  let count = 0;

  cart.forEach(item => {

    count += Math.max(
      1,
      Number(
        item.quantity || 1
      )
    );

  });


  const element =
    document.getElementById(
      "cartCount"
    );


  if (element) {

    element.textContent =
      count;

  }

}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

  const container =
    document.getElementById(
      "products"
    );


  if (!container) {
    console.error(
      "Products container not found."
    );
    return;
  }


  container.innerHTML = `
    <div class="loading">
      ⏳ Loading products...
    </div>
  `;


  try {

    console.log(
      "SAFARIA: Loading products..."
    );


    const {
      data,
      error
    } =
      await supabaseClient
        .from("products")
        .select("*");


    console.log(
      "SAFARIA PRODUCTS:",
      data
    );


    if (error) {

      console.error(
        "Supabase product error:",
        error
      );


      container.innerHTML = `
        <div class="error-box">

          ❌ Products load nahi ho rahe.

          <br><br>

          <b>Supabase Error:</b>

          <br>

          ${escapeHTML(
            error.message ||
            "Unknown error"
          )}

        </div>
      `;

      return;

    }


    allProducts =
      Array.isArray(data)
        ? data
        : [];


    window.safariaProducts =
      allProducts;


    if (
      allProducts.length === 0
    ) {

      container.innerHTML = `
        <div class="empty">

          📦 Abhi koi product available nahi hai.

          <br><br>

          Admin Panel se product add karo.

        </div>
      `;

      updateCartCount();

      return;

    }


    displayProducts(
      allProducts
    );


    updateCartCount();


  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );


    container.innerHTML = `
      <div class="error-box">

        ❌ Product loading error.

        <br><br>

        ${escapeHTML(
          error.message ||
          String(error)
        )}

      </div>
    `;

  }

}


/* =====================================================
   DISPLAY PRODUCTS
===================================================== */

function displayProducts(
  products
) {

  const container =
    document.getElementById(
      "products"
    );


  if (!container) {
    return;
  }


  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {

    container.innerHTML = `
      <div class="empty">
        😔 No products found.
      </div>
    `;

    return;

  }


  container.innerHTML = "";


  products.forEach(
    product => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "product";


      const image =
        product.image ||
        "https://via.placeholder.com/300x200?text=SAFARIA";


      const name =
        product.name ||
        "Product";


      const description =
        product.description ||
        "";


      const price =
        Number(
          product.price || 0
        );


      const stock =
        Number(
          product.stock || 0
        );


      card.innerHTML = `

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(name)}"
          onerror="
            this.src='https://via.placeholder.com/300x200?text=SAFARIA'
          "
        >

        <h3>
          ${escapeHTML(name)}
        </h3>

        <div class="description">
          ${escapeHTML(description)}
        </div>

        <div class="price">
          ₹${price.toLocaleString("en-IN")}
        </div>

        <div class="stock">

          ${
            stock > 0
              ? "✓ In Stock"
              : "❌ Out of Stock"
          }

        </div>

        <button
          class="buy"
          ${
            stock <= 0
              ? "disabled"
              : ""
          }
          onclick="
            addToCart('${String(
              product.id
            ).replace(/'/g, "\\'")}')
          "
        >

          🛒 Add to Cart

        </button>

      `;


      container.appendChild(
        card
      );

    }
  );

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(
  productId
) {

  cart =
    readCart();


  const product =
    allProducts.find(
      product =>
        String(product.id) ===
        String(productId)
    );


  if (!product) {

    alert(
      "❌ Product not found."
    );

    return;

  }


  const stock =
    Number(
      product.stock || 0
    );


  if (stock <= 0) {

    alert(
      "❌ This product is out of stock."
    );

    return;

  }


  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );


  if (existing) {

    const quantity =
      Number(
        existing.quantity || 1
      );


    if (
      quantity >= stock
    ) {

      alert(
        `Only ${stock} item(s) available in stock.`
      );

      return;

    }


    existing.quantity =
      quantity + 1;

  } else {

    cart.push({

      id:
        product.id,

      name:
        product.name ||
        "Product",

      description:
        product.description ||
        "",

      price:
        Number(
          product.price || 0
        ),

      image:
        product.image ||
        "",

      category:
        product.category ||
        "",

      stock:
        stock,

      quantity:
        1

    });

  }


  saveCart();


  alert(
    "✅ Product added to Cart!"
  );

}


/* =====================================================
   OPEN CART
===================================================== */

function openCart() {

  cart =
    readCart();


  /*
    If a cart panel exists,
    open it.
  */

  const panel =
    document.getElementById(
      "cartPanel"
    );


  if (panel) {

    panel.classList.add(
      "open"
    );

    panel.style.display =
      "block";

    updateCart();

    return;

  }


  /*
    If there is no cart panel,
    go to checkout.
  */

  if (
    cart.length === 0
  ) {

    alert(
      "🛒 Your cart is empty."
    );

    return;

  }


  window.location.href =
    "checkout.html";

}


/* =====================================================
   UPDATE CART
===================================================== */

function updateCart() {

  cart =
    readCart();


  updateCartCount();


  const itemsElement =
    document.getElementById(
      "cartItems"
    );


  const totalElement =
    document.getElementById(
      "total"
    ) ||
    document.getElementById(
      "cartTotal"
    );


  if (!itemsElement) {
    return;
  }


  if (
    cart.length === 0
  ) {

    itemsElement.innerHTML = `
      <div class="empty-cart">

        <p
          style="
            font-size:18px;
            font-weight:bold;
          "
        >
          Your cart is empty 🛒
        </p>

        <p
          style="
            margin-top:8px;
            color:#666;
          "
        >
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
    cart.map(
      (item, index) => {

        const quantity =
          Math.max(
            1,
            Number(
              item.quantity || 1
            )
          );


        const price =
          Number(
            item.price || 0
          );


        const stock =
          Number(
            item.stock || 999999
          );


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
                      src="${escapeHTML(
                        item.image
                      )}"
                      alt="${escapeHTML(
                        item.name
                      )}"
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


              <div
                style="flex:1;"
              >

                <strong
                  style="
                    display:block;
                    font-size:16px;
                    margin-bottom:5px;
                  "
                >
                  ${escapeHTML(
                    item.name
                  )}
                </strong>


                <p
                  style="
                    margin:0 0 8px;
                    font-weight:bold;
                  "
                >
                  ₹${price.toLocaleString(
                    "en-IN"
                  )}
                </p>


                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                  "
                >

                  <button
                    type="button"
                    onclick="
                      decreaseCartQuantity(
                        ${index}
                      )
                    "
                    style="
                      background:#eee;
                      color:#111;
                      border:1px solid #ccc;
                      padding:7px 12px;
                      border-radius:6px;
                      cursor:pointer;
                      font-weight:bold;
                    "
                  >
                    −
                  </button>


                  <span
                    style="
                      min-width:28px;
                      text-align:center;
                      font-weight:bold;
                    "
                  >
                    ${quantity}
                  </span>


                  <button
                    type="button"
                    onclick="
                      increaseCartQuantity(
                        ${index}
                      )
                    "
                    ${
                      quantity >= stock
                        ? "disabled"
                        : ""
                    }
                    style="
                      background:#eee;
                      color:#111;
                      border:1px solid #ccc;
                      padding:7px 12px;
                      border-radius:6px;
                      cursor:pointer;
                      font-weight:bold;
                    "
                  >
                    +
                  </button>

                </div>

              </div>

            </div>


            <button
              type="button"
              onclick="
                removeFromCart(
                  ${index}
                )
              "
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


            <p
              style="
                margin-top:8px;
                font-weight:bold;
                text-align:right;
              "
            >
              Item Total:
              ₹${(
                price *
                quantity
              ).toLocaleString(
                "en-IN"
              )}
            </p>

          </div>

        `;

      }
    ).join("");


  if (totalElement) {

    totalElement.innerText =
      "Total: ₹" +
      total.toLocaleString(
        "en-IN"
      );

  }

}


/* =====================================================
   INCREASE
===================================================== */

function increaseCartQuantity(
  index
) {

  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }


  const item =
    cart[index];


  const quantity =
    Number(
      item.quantity || 1
    );


  const stock =
    Number(
      item.stock || 999999
    );


  if (
    quantity >= stock
  ) {

    alert(
      `Only ${stock} item(s) available in stock.`
    );

    return;

  }


  item.quantity =
    quantity + 1;


  saveCart();


  updateCart();

}


/* =====================================================
   DECREASE
===================================================== */

function decreaseCartQuantity(
  index
) {

  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }


  const item =
    cart[index];


  const quantity =
    Number(
      item.quantity || 1
    );


  if (
    quantity <= 1
  ) {

    removeFromCart(
      index
    );

    return;

  }


  item.quantity =
    quantity - 1;


  saveCart();


  updateCart();

}


/* =====================================================
   REMOVE
===================================================== */

function removeFromCart(
  index
) {

  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }


  const name =
    cart[index].name ||
    "Product";


  cart.splice(
    index,
    1
  );


  saveCart();


  updateCart();


  alert(
    `🗑️ ${name} removed from cart.`
  );

}


/* =====================================================
   CLEAR CART
===================================================== */

function clearCart() {

  if (
    !cart.length
  ) {
    return;
  }


  const confirmed =
    confirm(
      "Are you sure you want to remove all products from your cart?"
    );


  if (!confirmed) {
    return;
  }


  cart = [];


  saveCart();


  updateCart();


  alert(
    "🗑️ Cart cleared successfully."
  );

}


/* =====================================================
   CLOSE CART
===================================================== */

function closeCart() {

  const panel =
    document.getElementById(
      "cartPanel"
    );


  if (panel) {

    panel.classList.remove(
      "open"
    );

    panel.style.display =
      "none";

  }

}


/* =====================================================
   CHECKOUT
===================================================== */

function goCheckout() {

  cart =
    readCart();


  if (
    cart.length === 0
  ) {

    alert(
      "🛒 Cart is empty!"
    );

    return;

  }


  localStorage.setItem(
    "safaria_cart",
    JSON.stringify(cart)
  );


  window.location.assign(
    "checkout.html"
  );

}


function checkout() {

  goCheckout();

}


function proceedToCheckout() {

  goCheckout();

}


function buyNow() {

  goCheckout();

}


/* =====================================================
   SEARCH
===================================================== */

function searchProducts() {

  const input =
    document.getElementById(
      "searchInput"
    );


  if (!input) {
    return;
  }


  const query =
    input.value
      .trim()
      .toLowerCase();


  if (!query) {

    const title =
      document.getElementById(
        "productTitle"
      );


    if (title) {

      title.textContent =
        "🛍️ Latest Products";

    }


    displayProducts(
      allProducts
    );

    return;

  }


  const filtered =
    allProducts.filter(
      product => {

        const name =
          String(
            product.name || ""
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
          name.includes(query) ||
          description.includes(query) ||
          category.includes(query)
        );

      }
    );


  const title =
    document.getElementById(
      "productTitle"
    );


  if (title) {

    title.textContent =
      `🔍 Search Results (${filtered.length})`;

  }


  displayProducts(
    filtered
  );

}


/* =====================================================
   CATEGORY
===================================================== */

function filterCategory(
  category
) {

  const filtered =
    allProducts.filter(
      product =>

        String(
          product.category || ""
        )
          .trim()
          .toLowerCase() ===

        String(
          category || ""
        )
          .trim()
          .toLowerCase()

    );


  const title =
    document.getElementById(
      "productTitle"
    );


  if (title) {

    title.textContent =
      `🛍️ ${category}`;

  }


  displayProducts(
    filtered
  );

}


/* =====================================================
   SHOW ALL
===================================================== */

function showAllProducts() {

  const input =
    document.getElementById(
      "searchInput"
    );


  if (input) {
    input.value = "";
  }


  const title =
    document.getElementById(
      "productTitle"
    );


  if (title) {

    title.textContent =
      "🛍️ Latest Products";

  }


  displayProducts(
    allProducts
  );

}


/* =====================================================
   LOGIN
===================================================== */

async function checkLogin() {

  try {

    const {
      data: {
        session
      }
    } =
      await supabaseClient
        .auth
        .getSession();


    const
