"use client";

import { useEffect } from "react";

export default function PayBillButton({
  amount,
  billId,
}: {
  amount: number;
  billId: string;
}) {

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = async () => {

    const res = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        billId,
      }),
    });

    const data = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: "INR",
      name: "MediFlow Hospital",
      description: "Hospital Bill Payment",
      order_id: data.orderId,

      handler: async function () {

        await fetch("/api/payment/success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            billId,
            amount, // ✅ send amount for partial payment
          }),
        });

        alert("Payment Successful 🎉");

        window.location.reload();
      },

      theme: {
        color: "#38bdf8",
      },
    };

    const rzp = new (window as any).Razorpay(options);

    rzp.open();
  };

  return (
    <button
      onClick={handlePayment}
      className="mt-6 w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold"
    >
      Pay ₹{amount}
    </button>
  );
}