import { HitAbstract } from './HitAbstract';
export declare const ERROR_MESSAGE = "Transaction Id, Item name and item code are required";
export declare class Item extends HitAbstract {
    private _transactionId;
    private _productName;
    private _productSku;
    private _itemPrice;
    private _itemQuantity;
    private _itemCategory;
    get transactionId(): string;
    /**
     * Specify transaction unique identifier.
     */
    set transactionId(v: string);
    get productName(): string;
    /**
     * Specify name of the item product.
     */
    set productName(v: string);
    get productSku(): string;
    /**
     * Specify the SKU or item code.
     */
    set productSku(v: string);
    get itemPrice(): number;
    /**
     * Specify the price for a single item
     */
    set itemPrice(v: number);
    get itemQuantity(): number;
    /**
     * Specify the number of items purchased.
     */
    set itemQuantity(v: number);
    get itemCategory(): string;
    /**
     * Specify the category that the item belongs to
     */
    set itemCategory(v: string);
    /**
     *Item constructor.
     * @param transactionId : Transaction unique identifier.
     * @param productName : Name of the item product.
     * @param productSku : The SKU or item code.
     */
    constructor(transactionId: string, productName: string, productSku: string);
    isReady(): boolean;
    toApiKeys(): any;
    getErrorMessage(): string;
}
