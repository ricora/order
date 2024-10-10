// Ordersの操作
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//Orderの追加
export async function createOrder(data: {
  table_number: number;
  status: string;
}) {
  const order = await prisma.orders.create({
    data: {
      table_number: data.table_number,
      status: data.status,
    },
  });
  return order;
}

//OrderのIDによる読み取り
export async function getOrderById(order_id: number) {
  return await prisma.orders.findUnique({
    where: {
      order_id: order_id,
    },
  });
}

//Orderのステータスによる読み取り
export async function getOrderByStatus(status: string) {
  return await prisma.orders.findMany({
    where: {
      status: status,
    },
  });
}

//Orderのステータス変更
export async function updateOrderStatus(order_id: number, newStatus: string) {
  return await prisma.orders.update({
    where: {
      order_id: order_id,
    },
    data: {
      status: newStatus,
    },
  });
}

export async function readOrder() {
  return await prisma.orders.findMany();
}

//Orderの削除
export async function deleteOrder(order_id: number) {
  return await prisma.orders.delete({
    where: {
      order_id: order_id,
    },
  });
}

//すべての注文を消す
export async function deleteAllOrders() {
  await prisma.orders.deleteMany();
}