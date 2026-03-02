/**
 * Seed database with 100+ products, categories, inventory, and 100+ orders.
 * Run: node scripts/seed.js (from project root)
 * Loads .env for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
          val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  });
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CATEGORIES = [
  "Coffee & Drinks",
  "Food",
  "Pastries",
  "Snacks",
  "Beverages",
  "Breakfast",
  "Desserts",
];

const PRODUCTS_BY_CATEGORY = {
  "Coffee & Drinks": [
    "Espresso", "Latte", "Cappuccino", "Americano", "Mocha", "Flat White",
    "Cold Brew", "Iced Latte", "Chai Latte", "Hot Chocolate", "Matcha Latte",
    "Macchiato", "Cortado", "Affogato", "Drip Coffee", "Decaf Espresso",
  ],
  Food: [
    "Club Sandwich", "Caesar Salad", "Grilled Cheese", "Veggie Wrap", "Turkey Panini",
    "BLT", "Soup of the Day", "Greek Salad", "Caprese", "Avocado Toast",
    "Breakfast Burrito", "Quiche", "Pasta Salad", "Hummus Bowl", "Falafel Wrap",
  ],
  Pastries: [
    "Croissant", "Chocolate Croissant", "Almond Croissant", "Danish", "Muffin",
    "Blueberry Muffin", "Scone", "Cinnamon Roll", "Banana Bread", "Brownie",
    "Cookie", "Lemon Bar", "Cheese Danish", "Apple Turnover", "Palmier",
  ],
  Snacks: [
    "Chips", "Granola Bar", "Mixed Nuts", "Popcorn", "Trail Mix",
    "Protein Bar", "Fruit Cup", "Yogurt Parfait", "Veggie Sticks", "Pretzels",
    "Rice Cakes", "Crackers", "Nut Butter Pack", "Dried Fruit", "Energy Bar",
  ],
  Beverages: [
    "Orange Juice", "Apple Juice", "Sparkling Water", "Soda", "Iced Tea",
    "Lemonade", "Smoothie", "Milk", "Oat Milk", "Coconut Water",
    "Green Juice", "Kombucha", "Mineral Water", "Sports Drink", "Herbal Tea",
  ],
  Breakfast: [
    "Oatmeal", "Yogurt Bowl", "Eggs & Toast", "Pancakes", "Waffles",
    "Breakfast Bowl", "Bagel", "Breakfast Tacos", "Acai Bowl", "Avocado Toast",
    "French Toast", "Breakfast Burrito", "Granola Bowl", "Smoothie Bowl", "Egg Sandwich",
  ],
  Desserts: [
    "Cheesecake", "Tiramisu", "Chocolate Cake", "Ice Cream", "Gelato",
    "Creme Brulee", "Panna Cotta", "Lava Cake", "Fruit Tart", "Pie",
    "Cupcake", "Macaron", "Donut", "Cannoli", "Pudding",
  ],
};

function barcode(seed) {
  return "59" + String(100000000000 + seed).slice(-11);
}

async function main() {
  console.log("Seeding database...\n");

  // 1) Categories
  const { data: existingCats } = await supabase.from("categories").select("id, name");
  const catMap = {};
  (existingCats || []).forEach((c) => (catMap[c.name] = c.id));

  for (let i = 0; i < CATEGORIES.length; i++) {
    const name = CATEGORIES[i];
    if (!catMap[name]) {
      const { data: inserted } = await supabase
        .from("categories")
        .insert({ name, sort_order: i + 1 })
        .select("id")
        .single();
      if (inserted) catMap[name] = inserted.id;
    }
  }
  console.log("Categories:", Object.keys(catMap).length);

  // 2) Products (100+)
  let productId = 0;
  const productsToInsert = [];
  for (const [catName, names] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const catId = catMap[catName] || null;
    for (const name of names) {
      productId++;
      const price = Number((2 + Math.random() * 10).toFixed(2));
      const cost = Number((price * (0.2 + Math.random() * 0.3)).toFixed(2));
      productsToInsert.push({
        category_id: catId,
        barcode: barcode(productId),
        name,
        price,
        cost,
      });
    }
  }

  const { data: insertedProducts, error: prodErr } = await supabase
    .from("products")
    .upsert(productsToInsert, { onConflict: "barcode", ignoreDuplicates: true })
    .select("id, name, price");

  if (prodErr) {
    console.error("Products error:", prodErr.message);
    return;
  }

  const productList = insertedProducts || [];
  if (productList.length === 0) {
    const { data: all } = await supabase.from("products").select("id, name, price");
    productList.push(...(all || []));
  }
  console.log("Products:", productList.length);

  // 3) Inventory
  const inventoryRows = productList.map((p) => ({
    product_id: p.id,
    quantity: Math.floor(10 + Math.random() * 90),
    low_stock_threshold: 5 + Math.floor(Math.random() * 10),
  }));
  await supabase.from("inventory").upsert(inventoryRows, { onConflict: "product_id" });
  console.log("Inventory rows:", inventoryRows.length);

  // 4) Orders + order_items (100+ orders over last 30 days)
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const ordersToInsert = [];
  const orderItemsToInsert = [];

  for (let i = 0; i < 120; i++) {
    const createdAt = new Date(now - Math.random() * 30 * dayMs);
    const numItems = 1 + Math.floor(Math.random() * 4);
    const items = [];
    let total = 0;
    for (let j = 0; j < numItems; j++) {
      const p = productList[Math.floor(Math.random() * productList.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      const unitPrice = Number(p.price);
      const lineTotal = Number((unitPrice * qty).toFixed(2));
      total += lineTotal;
      items.push({
        product_id: p.id,
        product_name: p.name,
        quantity: qty,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }
    total = Number(total.toFixed(2));
    ordersToInsert.push({
      status: "completed",
      subtotal: total,
      tax: 0,
      total,
      completed_at: createdAt.toISOString(),
      created_at: createdAt.toISOString(),
      _items: items,
    });
  }

  const ordersPayload = ordersToInsert.map((o) => ({
    status: o.status,
    subtotal: o.subtotal,
    tax: o.tax,
    total: o.total,
    completed_at: o.completed_at,
    created_at: o.created_at,
  }));
  const { data: insertedOrders, error: orderErr } = await supabase
    .from("orders")
    .insert(ordersPayload)
    .select("id, created_at");

  if (orderErr) {
    console.error("Orders error:", orderErr.message);
    return;
  }

  const insertedOrdersList = insertedOrders || [];
  for (let i = 0; i < insertedOrdersList.length && i < ordersToInsert.length; i++) {
    const order = insertedOrdersList[i];
    const ord = ordersToInsert[i];
    if (ord._items) {
      for (const it of ord._items) {
        orderItemsToInsert.push({
          order_id: order.id,
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          line_total: it.line_total,
          created_at: ord.created_at,
        });
      }
    }
  }

  if (orderItemsToInsert.length > 0) {
    const chunk = 100;
    for (let i = 0; i < orderItemsToInsert.length; i += chunk) {
      await supabase.from("order_items").insert(orderItemsToInsert.slice(i, i + chunk));
    }
  }
  console.log("Orders:", insertedOrdersList.length);
  console.log("Order items:", orderItemsToInsert.length);

  console.log("\nDone. You can view 100+ products and 100+ orders in Admin → Inventory and Admin → Sales.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
