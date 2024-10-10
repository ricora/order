-- CreateTable
CREATE TABLE "Orders" (
    "order_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "table_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Order_details" (
    "order_detail_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "Order_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Orders" ("order_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products" ("product_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Products" (
    "product_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "stock_quantity" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Products_product_name_key" ON "Products"("product_name");
