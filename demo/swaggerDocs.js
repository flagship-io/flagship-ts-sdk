/**
 * @swagger
 * /item:
 *   get:
 *     summary: Retrieve item details
 *     parameters:
 *       - in: query
 *         name: isVip
 *         schema:
 *           type: string
 *         required: false
 *         description: Indicates if the user is a VIP (true/false)
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 item:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Flagship T-shirt"
 *                     price:
 *                       type: number
 *                       example: 20
 *                 fsEnableDiscount:
 *                   type: boolean
 *                   example: false
 *                 fsAddToCartBtnColor:
 *                   type: string
 *                   example: "blue"
 */

/**
 * @swagger
 * /add-to-cart:
 *   post:
 *     summary: Add an item to the cart
 *     responses:
 *       200:
 *         description: Item added to the cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */