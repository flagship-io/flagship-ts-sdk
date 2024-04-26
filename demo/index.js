/* start demo */
const express = require('express');

const { Flagship, HitType, EventCategory } = require("@flagship.io/js-sdk")
/* end import */

/* start step-1 starting */
Flagship.start("<ENV_ID>", "<API_KEY>", {
    fetchNow: false,
})
/* end step-1 starting */

const app = express();
app.use(express.json());

const port = 3000;

async function getVisitor() {

    /* start step-2 create visitor */
    const visitor = Flagship.newVisitor({
        visitorId: "visitor-id",
        hasConsented: true,
        context:{
            fs_is_vip: true,
        }
    });
    /* end step-2 create visitor */

    /* start step-3 fetch flags */
    await visitor.fetchFlags();
    /* end step-3 fetch flags */
    return visitor;
}

app.get('/item', async (req, res) => {
    const visitor = await getVisitor();

    /* start step-4 get flags */
    const fsEnableDiscount = visitor.getFlag("fs_enable_discount", false);
    const fsAddToCartBtnColor = visitor.getFlag("fs_add_to_cart_btn_color", "blue");

    const fsEnableDiscountValue = fsEnableDiscount.getValue();
    const fsAddToCartBtnColorValue = fsAddToCartBtnColor.getValue();
    /* end step-4 get flags */

    res.json({
        item:{
            name: "Flagship T-shirt",
            price: 20
        },
        fsEnableDiscount : fsEnableDiscountValue,
        fsAddToCartBtnColor : fsAddToCartBtnColorValue
    });
  });

app.post('/add-to-cart', async (req, res) => {
    const visitor = await getVisitor();

    /* start step-5 send hit */
    visitor.sendHit({
        type: HitType.EVENT,
        category: EventCategory.ACTION_TRACKING,
        action: "add-to-cart-clicked"
    })
    /* end step-5 send hit */
    res.json(null);
})
  
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

/* end demo */