import { prisma } from "@/lib/prisma";
import { getAdminFromToken } from "@/lib/doctorAuth";
import { redirect } from "next/navigation";
import LogoutButton from "../_component/Logoutbutton";
import AdminDashboardClient from "../_component/temp";

export default async function AdminDashboardPage() {
  const admin = await getAdminFromToken();
  if (!admin) redirect("/doctor/login");

  const [
    totalPatients, totalDoctors, totalRequests,
    totalLabTests, totalPrescriptions, totalBills, totalPharmacyOrders,
    revenueData, paidRevenue,
    requestsByStatus, requestsByType, requestsByDept,
    labByStatus, billsByStatus, pharmacyByStatus,
    doctorsByDept, doctorsByRole, requestsByPriority,
    recentRequests, recentBills, topDoctors,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count({ where: { role: "DOCTOR" } }),
    prisma.request.count(),
    prisma.labTest.count(),
    prisma.prescription.count(),
    prisma.bill.count(),
    prisma.pharmacyOrder.count(),
    prisma.bill.aggregate({ _sum: { totalAmount: true } }),
    prisma.bill.aggregate({ where: { status: "PAID" }, _sum: { totalAmount: true } }),
    prisma.request.groupBy({ by: ["status"], _count: true }),
    prisma.request.groupBy({ by: ["type"], _count: true, orderBy: { _count: { type: "desc" } } }),
    prisma.request.groupBy({ by: ["department"], _count: true, orderBy: { _count: { department: "desc" } }, take: 6 }),
    prisma.labTest.groupBy({ by: ["status"], _count: true }),
    prisma.bill.groupBy({ by: ["status"], _count: true, _sum: { totalAmount: true } }),
    prisma.pharmacyOrder.groupBy({ by: ["status"], _count: true }),
    prisma.doctor.groupBy({ by: ["department"], _count: true, orderBy: { _count: { department: "desc" } } }),
    prisma.doctor.groupBy({ by: ["role"], _count: true }),
    prisma.request.groupBy({ by: ["priority"], _count: true }),
    prisma.request.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { user: true, doctor: true },
    }),
    prisma.bill.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: { user: true, request: true },
    }),
    prisma.doctor.findMany({
      where: { role: "DOCTOR" },
      include: { _count: { select: { requests: true, labTests: true, prescriptions: true } } },
      orderBy: { requests: { _count: "desc" } },
      take: 5,
    }),
  ]);

  // Serialize dates to strings for client component
  const serializedRequests = recentRequests.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    appointmentDate: r.appointmentDate?.toISOString() ?? null,
  }));

  const serializedBills = recentBills.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    totalAmount: Number(b.totalAmount),
  }));

  return (
    <div className="relative">
      {/* Inject logout button */}
      <div className="fixed top-0 right-0 z-[60] flex items-center gap-3 px-6 py-4 pointer-events-none">
        <div className="pointer-events-auto">
          <LogoutButton />
        </div>
      </div>

      <AdminDashboardClient
        adminName={admin.name}
        totalPatients={totalPatients}
        totalDoctors={totalDoctors}
        totalRequests={totalRequests}
        totalLabTests={totalLabTests}
        totalPrescriptions={totalPrescriptions}
        totalBills={totalBills}
        totalPharmacyOrders={totalPharmacyOrders}
        revenue={revenueData._sum.totalAmount ?? 0}
        paid={paidRevenue._sum.totalAmount ?? 0}
        requestsByStatus={requestsByStatus as any}
        requestsByType={requestsByType as any}
        requestsByDept={requestsByDept as any}
        labByStatus={labByStatus as any}
        billsByStatus={billsByStatus as any}
        pharmacyByStatus={pharmacyByStatus as any}
        doctorsByDept={doctorsByDept as any}
        doctorsByRole={doctorsByRole as any}
        requestsByPriority={requestsByPriority as any}
        recentRequests={serializedRequests as any}
        recentBills={serializedBills as any}
        topDoctors={topDoctors}
      />
    </div>
  );
}