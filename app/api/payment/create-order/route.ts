import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

export async function POST(req: Request) {
  const { amount, billId } = await req.json();

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: billId,
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
  });
}