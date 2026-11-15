/**
 * B2C Outlet Operating Hours & Order Acceptance Policy
 *
 * Business Rule:
 * In the B2C segment, outlet operating timing is strictly from 10:00 AM to 10:00 PM (IST).
 * Customer orders are ONLY accepted during this window. Outside this window, order placement
 * and checkout are disabled and blocked across both frontend UI and backend APIs.
 */

export const B2C_OPERATING_HOURS = {
  openHour: 10,
  openMinute: 0,
  closeHour: 22,
  closeMinute: 0,
  openLabel: '10:00 AM',
  closeLabel: '10:00 PM',
  timezone: 'Asia/Kolkata',
} as const;

export interface OutletTimingStatus {
  isOpen: boolean;
  hour: number;
  minute: number;
  currentIstTime: string;
  nextOpenTimeText: string;
  message?: string;
}

export interface OutletAcceptanceStatus {
  isAccepting: boolean;
  reason?: string;
  timing: OutletTimingStatus;
  isPausedByAdmin: boolean;
}

/**
 * Validates whether a given date (or current time) falls within the 10:00 AM - 10:00 PM IST window.
 */
export function checkOutletOperatingHours(date?: Date): OutletTimingStatus {
  try {
    let effectiveDate = date;
    if (!effectiveDate) {
      if (typeof window !== 'undefined') {
        try {
          const storedSim = localStorage.getItem('pnr_simulated_date');
          if (storedSim) effectiveDate = new Date(storedSim);
        } catch {}
        if (!effectiveDate && (window as any).__PNR_SIMULATED_DATE__) {
          effectiveDate = new Date((window as any).__PNR_SIMULATED_DATE__);
        }
      } else if ((globalThis as any).__PNR_SIMULATED_DATE__) {
        effectiveDate = new Date((globalThis as any).__PNR_SIMULATED_DATE__);
      }
      if (!effectiveDate) {
        effectiveDate = new Date();
      }
    }

    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: B2C_OPERATING_HOURS.timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = istFormatter.formatToParts(effectiveDate);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const currentMinutes = hour * 60 + minute;

    const OPEN_MINUTES = B2C_OPERATING_HOURS.openHour * 60 + B2C_OPERATING_HOURS.openMinute; // 10:00 AM = 600
    const CLOSE_MINUTES = B2C_OPERATING_HOURS.closeHour * 60 + B2C_OPERATING_HOURS.closeMinute; // 10:00 PM = 1320

    const isOpen = currentMinutes >= OPEN_MINUTES && currentMinutes < CLOSE_MINUTES;

    const displayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: B2C_OPERATING_HOURS.timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const currentIstTime = displayFormatter.format(effectiveDate);

    const nextOpenTimeText =
      currentMinutes < OPEN_MINUTES ? 'Today at 10:00 AM' : 'Tomorrow at 10:00 AM';

    const message = isOpen
      ? undefined
      : `Orders are accepted only between 10:00 AM and 10:00 PM. Our kitchen is currently closed for order taking (Current time: ${currentIstTime} IST). Next ordering window opens ${nextOpenTimeText.toLowerCase()}.`;

    return {
      isOpen,
      hour,
      minute,
      currentIstTime,
      nextOpenTimeText,
      message,
    };
  } catch (err) {
    console.error('[checkOutletOperatingHours Error]:', err);
    // Safe fallback if Intl timezone throws
    return {
      isOpen: true,
      hour: 12,
      minute: 0,
      currentIstTime: '12:00 PM',
      nextOpenTimeText: 'Today at 10:00 AM',
    };
  }
}

/**
 * Checks overall order acceptance for an outlet:
 * 1. Checks if outlet manual switch is paused (outlet.isOpen === false)
 * 2. Checks operating hours window (10:00 AM - 10:00 PM IST)
 */
export function isB2COutletAcceptingOrders(
  outlet?: { isOpen?: boolean; name?: string } | null,
  date: Date = new Date()
): OutletAcceptanceStatus {
  const timing = checkOutletOperatingHours(date);
  const isPausedByAdmin = outlet ? outlet.isOpen === false : false;

  if (isPausedByAdmin) {
    return {
      isAccepting: false,
      isPausedByAdmin: true,
      reason: `Orders are temporarily paused for ${outlet?.name || 'this outlet'} by the kitchen. Please check back shortly.`,
      timing,
    };
  }

  if (!timing.isOpen) {
    return {
      isAccepting: false,
      isPausedByAdmin: false,
      reason:
        timing.message ||
        `Orders are accepted only between 10:00 AM and 10:00 PM. Our kitchen is currently closed for order taking.`,
      timing,
    };
  }

  return {
    isAccepting: true,
    isPausedByAdmin: false,
    timing,
  };
}
