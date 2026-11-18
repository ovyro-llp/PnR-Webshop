# Smart Failover for Paused Outlets

## Goal
Ensure that when an outlet has "Pause Orders" enabled (`isOpen === false`), customers are not routed to a dead-end paused kitchen. Instead:
1. The location engine automatically selects the nearest **active / open** outlet.
2. The UI clearly displays open vs. paused status across the location modal and direct outlet pickers.
3. If a customer visits a paused outlet's page directly, a top switch-banner offers a 1-tap switch to the nearest open alternative.

---

## Phased Implementation Plan

### Phase 1: Dynamic Outlet State in Location Resolution
- [ ] **1.1 Live Outlet Status in Reverse Geocode API** ([`src/app/api/location/reverse-geocode/route.ts`](file:///Users/hrushi/Downloads/Pnr%20Shop/src/app/api/location/reverse-geocode/route.ts))
  - Fetch live outlets from `orderStore.getOutlets()` instead of static mock data.
  - Implement smart nearest resolution: prefer active outlets (`isOpen !== false`); fallback to closest physical outlet only if all are paused.
  - Return `isNearestPaused` flag and `nearestOpenOutlet`.
- [ ] **1.2 Dynamic Outlet Synchronization in Location Context** ([`src/context/LocationContext.tsx`](file:///Users/hrushi/Downloads/Pnr%20Shop/src/context/LocationContext.tsx))
  - Fetch fresh outlet list with `isOpen` status from `/api/outlets` on mount.
  - Update `findNearestOutletFromCoords` to prioritize open outlets.
  - Expose helper `isOutletAccepting(slug)` and `nearestOpenOutlet`.

### Phase 2: Location Modal & Delivery Map Picker UX
- [ ] **2.1 Delivery Map Picker Status Awareness** ([`src/components/location/DeliveryMapPicker.tsx`](file:///Users/hrushi/Downloads/Pnr%20Shop/src/components/location/DeliveryMapPicker.tsx))
  - Prioritize open outlets when reverse-geocoding the customer's doorstep pin.
  - Show friendly chip if closest kitchen is paused: "Serving from <Open Outlet> (College Road kitchen is temporarily paused)".
- [ ] **2.2 Outlet Selection Badges in Location Picker Modal** ([`src/components/location/LocationPromptModal.tsx`](file:///Users/hrushi/Downloads/Pnr%20Shop/src/components/location/LocationPromptModal.tsx))
  - Render live status pill (`🟢 Baking Fresh` vs `🔴 Orders Paused`) on each outlet card.
  - When user selects a paused outlet, offer instant switch to closest active outlet.

### Phase 3: Storefront B2C Failover Banner
- [ ] **3.1 Paused Outlet Alternative Banner** ([`src/app/[outlet]/page.tsx`](file:///Users/hrushi/Downloads/Pnr%20Shop/src/app/[outlet]/page.tsx) and [`src/app/[outlet]/[campaign]/page.tsx`](file:///Users/hrushi/Downloads/Pnr%20Shop/src/app/[outlet]/[campaign]/page.tsx))
  - If current outlet is paused, render a helpful banner at the top of the menu:
    `"Orders are temporarily paused for this branch. [Switch to <Alternative Outlet> to order now →]"`
  - Provide 1-tap redirect keeping cart or selected location intact.

### Phase 4: Verification & Automated Testing
- [ ] **4.1 Test Outlet Pause Toggle in Admin / API**
  - Verify toggling `isOpen: false` updates the database and store immediately.
- [ ] **4.2 Test Location Failover Flow**
  - Simulate location near College Road while College Road is paused; verify system automatically connects customer to Gangapur Road.
- [ ] **4.3 Test Direct Page Navigation & Cart State**
  - Verify cart lock, banner alert, and switch-outlet CTA work smoothly.
