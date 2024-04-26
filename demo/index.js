//start demo
// Usage: node demo/index.js
const express = require("express");
const { Flagship, HitType, EventCategory } = require("@flagship.io/js-sdk");

// Step 1: Start the Flagship SDK by providing the environment ID and API key
Flagship.start("<ENV_ID>", "<API_KEY>", {
  fetchNow: false,
});

const app = express();
app.use(express.json());

const port = 3000;

async function getVisitor() {
  // Step 2: Create a new visitor with a visitor ID and consent status
  const visitor = Flagship.newVisitor({
    visitorId: "visitor-id",
    hasConsented: true,
    context: {
      fs_is_vip: true,
    },
  });

  // Step 3: Fetch the flags for the visitor
  await visitor.fetchFlags();

  return visitor;
}

app.get("/item", async (req, res) => {
  const visitor = await getVisitor();

  // Step 4: Get the values of the flags for the visitor
  const fsEnableDiscount = visitor.getFlag("fs_enable_discount", false);
  const fsAddToCartBtnColor = visitor.getFlag("fs_add_to_cart_btn_color", "blue");

  const fsEnableDiscountValue = fsEnableDiscount.getValue();
  const fsAddToCartBtnColorValue = fsAddToCartBtnColor.getValue();

  res.json({
    item: {
      name: "Flagship T-shirt",
      price: 20,
    },
    fsEnableDiscount: fsEnableDiscountValue,
    fsAddToCartBtnColor: fsAddToCartBtnColorValue,
  });
});

app.post("/add-to-cart", async (req, res) => {
  const visitor = await getVisitor();

  // Step 5: Send a hit to track an action
  visitor.sendHit({
    type: HitType.EVENT,
    category: EventCategory.ACTION_TRACKING,
    action: "add-to-cart-clicked",
  });

  res.json(null);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

//end demo
