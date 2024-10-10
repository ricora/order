//Productsの操作
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//productの追加
export async function createProduct(data: {
  product_name: string;
  price: number;
  stock_quantity: number;
}) {
  return await prisma.products.create({
    data: {
      product_name: data.product_name,
      price: data.price,
      stock_quantity: data.stock_quantity,
    },
  });
}

//productの読み込み
export async function readProduct() {
  return await prisma.products.findMany();
}

//在庫品の操作
export async function updateProductStock(data: {
  product_id: number;
  stock_quantity: number;
}) {
  return await prisma.products.update({
    where: {
      product_id: data.product_id,
    },
    data: {
      stock_quantity: data.stock_quantity,
    },
  });
}

//商品の変更
export async function updateProduct(
  product_id: number,
  product_name: string,
  price: number,
  stock_quantity: number
) {
  return await prisma.products.update({
    where: {
      product_id: product_id,
    },
    data: {
      product_name: product_name,
      price: price,
      stock_quantity: stock_quantity,
    },
  });
}


//すべての商品を消す
export async function deleteAllProducts() {
  await prisma.products.deleteMany();
}



//Productの削除
// export async function deleteProduct(product_id: number) {
//   console.log("Deleting product with ID:", product_id);
//   return await prisma.products.delete({
//     where: {
//       product_id: product_id,
//     },
//   });
// }
export async function deleteProduct(product_id: number) {
  console.log("Deleting product with ID:", product_id);

  try {
    const result = await prisma.products.delete({
      where: {
        product_id: product_id,
      },
    });
    console.log("Product deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("Error in deleteProduct:", error); // エラー詳細を出力
    throw error;
  }
}
