import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PayBillButton from "@/app/dashboard/_components/PayBillButton";

interface Props {
  params: Promise<{
    requestId: string;
  }>;
}

function billStatusBadge(status: string) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30",
    PENDING: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30",
    GENERATED: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
  };

  return map[status] ?? "bg-slate-500/10 text-slate-400";
}

function itemTypeColor(type: string) {
  const map: Record<string, string> = {
    CONSULTATION: "bg-sky-500/10 text-sky-400",
    LAB_TEST: "bg-teal-500/10 text-teal-400",
    MEDICATION: "bg-emerald-500/10 text-emerald-400",
    PROCEDURE: "bg-violet-500/10 text-violet-400",
    ROOM: "bg-amber-500/10 text-amber-400",
    IMAGING: "bg-indigo-500/10 text-indigo-400",
  };

  return map[type?.toUpperCase()] ?? "bg-slate-500/10 text-slate-400";
}

export default async function BillPage({ params }: Props) {

  const { requestId } = await params;

  const bill = await prisma.bill.findFirst({
    where: { requestId },
    include: { items: true },
  });

  if (!bill) return notFound();

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  // ✅ remaining calculation
  const remainingAmount = bill.totalAmount - bill.paidAmount;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200">

      <nav className="flex justify-between px-8 py-4 border-b border-white/10">
        <div className="font-bold">MediFlow</div>

        <Link href="/dashboard" className="text-sm text-slate-400">
          Back
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto py-10 space-y-6">

        <div className="flex justify-between">

          <div>
            <h1 className="text-2xl font-bold">
              {request?.title ?? "Bill"}
            </h1>

            <p className="text-sm text-slate-400">
              {request?.user?.email}
            </p>
          </div>

          <span className={`px-3 py-1 rounded ${billStatusBadge(bill.status)}`}>
            {bill.status}
          </span>

        </div>

        <div className="border border-white/10 rounded-xl overflow-hidden">

          {bill.items.map((item) => (
            <div key={item.id} className="px-6 py-4 border-b border-white/10">

              <p className="font-semibold">
                {item.description}
              </p>

              <div className="flex justify-between mt-2">

                <span className={`text-xs px-2 py-1 rounded ${itemTypeColor(item.itemType)}`}>
                  {item.itemType}
                </span>

                <span>
                  ₹{item.amount}
                </span>

              </div>

            </div>
          ))}

          {/* TOTAL / PAID / REMAINING */}

          <div className="px-6 py-4 bg-white/5 space-y-2">

            <div className="flex justify-between text-sm">
              <p>Total</p>
              <p>₹{bill.totalAmount}</p>
            </div>

            <div className="flex justify-between text-sm text-emerald-400">
              <p>Paid</p>
              <p>₹{bill.paidAmount}</p>
            </div>

            <div className="flex justify-between text-lg font-bold">
              <p>Remaining</p>
              <p>₹{remainingAmount}</p>
            </div>

          </div>

        </div>

        {/* PAYMENT SECTION */}

        {remainingAmount > 0 && (

          <div className="border border-rose-500/30 rounded-xl p-6">

            <p className="font-bold text-rose-400">
              Payment Due
            </p>

            <p className="text-sm text-slate-400">
              Pay remaining hospital bill
            </p>

            <PayBillButton
              amount={remainingAmount}
              billId={bill.id}
            />

          </div>

        )}

        {remainingAmount === 0 && (

          <div className="border border-emerald-500/30 rounded-xl p-6">

            <p className="text-emerald-400 font-bold">
              Payment Complete
            </p>

          </div>

        )}

      </div>
    </div>
  );
}