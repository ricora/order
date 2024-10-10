//Order_detailsの操作
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//Detailの追加
export async function createOrderDetail(data: {
  order_id: number;
  product_id: number;
  quantity: number;
}) {
  return await prisma.order_details.create({
    data: {
      order_id: data.order_id,
      product_id: data.product_id,
      quantity: data.quantity,
    },
  });
}

//すべてのDetailの読み取り
export async function readDetail() {
  return await prisma.order_details.findMany();
}

//すべてのDetailsを消す
export async function deleteAllDetails() {
  await prisma.order_details.deleteMany();
}