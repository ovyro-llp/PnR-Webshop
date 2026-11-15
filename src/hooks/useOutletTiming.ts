'use client';

import { useState, useEffect } from 'react';
import { isB2COutletAcceptingOrders, OutletAcceptanceStatus } from '@/lib/outlet-timing';

/**
 * React hook that evaluates outlet operating status (10:00 AM - 10:00 PM IST)
 * and keeps it synchronized live every 30 seconds without requiring page reloads.
 */
export function useOutletAcceptance(
  outlet?: { isOpen?: boolean; name?: string } | null,
  simulatedDate?: Date
): OutletAcceptanceStatus {
  const [status, setStatus] = useState<OutletAcceptanceStatus>(() =>
    isB2COutletAcceptingOrders(outlet, simulatedDate)
  );

  useEffect(() => {
    setStatus(isB2COutletAcceptingOrders(outlet, simulatedDate));

    const interval = setInterval(() => {
      setStatus(isB2COutletAcceptingOrders(outlet, simulatedDate));
    }, 30000);

    return () => clearInterval(interval);
  }, [outlet?.isOpen, outlet?.name, simulatedDate]);

  return status;
}
