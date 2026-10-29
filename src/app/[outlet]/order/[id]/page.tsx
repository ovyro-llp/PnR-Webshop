import { notFound } from 'next/navigation';
import { orderStore } from '@/lib/store/order-store';
import { Navbar } from '@/components/layout/Navbar';
import { OrderTrackingClient } from '@/components/order/OrderTrackingClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ outlet: string; id: string }>;
}) {
  const { outlet: outletSlug, id } = await params;
  const outlet = orderStore.getOutletBySlug(outletSlug);
  const order = orderStore.getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFB]">
      <Navbar currentOutletSlug={outletSlug} />
      <OrderTrackingClient
        initialOrder={order}
        outlet={outlet}
        outletSlug={outletSlug}
      />
    </div>
  );
}
