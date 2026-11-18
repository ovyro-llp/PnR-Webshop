import { NextRequest, NextResponse } from 'next/server';
import { OUTLETS } from '@/lib/data/mock-data';
import { Outlet } from '@/types';
import { orderStore } from '@/lib/store/order-store';

// Haversine distance calculator
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function findNearestOutlet(lat: number, lng: number, candidateOutlets: Outlet[]) {
  const outlets = candidateOutlets && candidateOutlets.length > 0 ? candidateOutlets : OUTLETS;

  // 1. Calculate physical nearest
  let physicalNearest = outlets[0];
  let physicalMinKm = Infinity;
  for (const out of outlets) {
    if (out.coordinates) {
      const d = calculateDistanceKm(lat, lng, out.coordinates.lat, out.coordinates.lng);
      if (d < physicalMinKm) {
        physicalMinKm = d;
        physicalNearest = out;
      }
    }
  }

  // 2. Filter for outlets that are currently accepting orders (isOpen !== false)
  const openOutlets = outlets.filter((out) => out.isOpen !== false);
  const activeCandidates = openOutlets.length > 0 ? openOutlets : outlets;

  let nearest = activeCandidates[0];
  let minKm = Infinity;
  for (const out of activeCandidates) {
    if (out.coordinates) {
      const d = calculateDistanceKm(lat, lng, out.coordinates.lat, out.coordinates.lng);
      if (d < minKm) {
        minKm = d;
        nearest = out;
      }
    }
  }

  const isFailover = physicalNearest.slug !== nearest.slug && physicalNearest.isOpen === false;

  return {
    nearest,
    distanceKm: minKm,
    physicalNearest,
    physicalDistanceKm: physicalMinKm,
    isFailover,
    failoverMessage: isFailover
      ? `${physicalNearest.name} kitchen is currently pausing orders. We connected you to our ${nearest.name} kitchen to fulfill your fresh order!`
      : undefined,
  };
}

// Map sublocality / text to standardized Nashik area option
function matchNashikArea(rawArea: string, fallbackArea: string): string {
  const text = (rawArea || '').toLowerCase();
  if (text.includes('college') || text.includes('circle') || text.includes('parijat') || text.includes('krishi') || text.includes('thatte') || text.includes('canada')) {
    return 'Cycle Circle / College Road';
  }
  if (text.includes('gangapur') || text.includes('sahdev') || text.includes('datta') || text.includes('serene') || text.includes('someshwar') || text.includes('anandwalli')) {
    return 'Gangapur Road / Sahdev Nagar';
  }
  if (text.includes('patel') || text.includes('shalimar') || text.includes('cbs') || text.includes('old nashik') || text.includes('mg road')) {
    return 'ND Patel Road / Shalimar';
  }
  if (text.includes('panchavati') || text.includes('ramkund') || text.includes('meri')) {
    return 'Panchavati';
  }
  return fallbackArea || 'Cycle Circle / College Road';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: 'Missing lat or lng query parameters' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lat or lng coordinates' },
        { status: 400 }
      );
    }

    const liveOutlets = (await orderStore.getOutletsAsync()) || orderStore.getOutlets() || OUTLETS;
    const { nearest, distanceKm, physicalNearest, physicalDistanceKm, isFailover, failoverMessage } =
      findNearestOutlet(lat, lng, liveOutlets);

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 1. Try Google Maps Geocoding API if API key exists
    if (googleApiKey && googleApiKey.trim() !== '') {
      try {
        const googleRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`,
          { next: { revalidate: 3600 } }
        );

        if (googleRes.ok) {
          const data = await googleRes.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const first = data.results[0];
            let streetNumber = '';
            let route = '';
            let sublocality = '';
            let locality = '';
            let postalCode = '';
            let city = 'Nashik';

            for (const comp of first.address_components) {
              const types = comp.types;
              if (types.includes('street_number')) streetNumber = comp.long_name;
              if (types.includes('route')) route = comp.long_name;
              if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                sublocality = comp.long_name;
              }
              if (types.includes('locality')) locality = comp.long_name;
              if (types.includes('postal_code')) postalCode = comp.long_name;
              if (types.includes('administrative_area_level_2')) city = comp.long_name;
            }

            const street = [streetNumber, route].filter(Boolean).join(' ') || sublocality || 'Near ' + nearest.name;
            const area = matchNashikArea(sublocality || route, nearest.area);

            return NextResponse.json({
              success: true,
              lat,
              lng,
              formattedAddress: first.formatted_address,
              street: street || first.formatted_address.split(',')[0],
              area: area,
              pincode: postalCode || '422005',
              city: city || 'Nashik',
              nearestOutlet: nearest,
              distanceKm,
              physicalNearestOutlet: physicalNearest,
              physicalDistanceKm,
              isFailover,
              failoverMessage,
              source: 'google',
            });
          }
        }
      } catch (err) {
        console.warn('Google reverse geocode failed, falling back to OSM:', err);
      }
    }

    // 2. Fallback: OpenStreetMap Nominatim reverse geocode
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PuffsNRollsBakery/1.0 (delivery@puffsnrolls.com)',
            'Accept-Language': 'en',
          },
          next: { revalidate: 3600 },
        }
      );

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const addr = osmData.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
        const pincode = addr.postcode || '422005';
        const city = addr.city || addr.town || addr.county || 'Nashik';

        // Extract a clean street/building suggestion
        const cleanStreet = [road, suburb].filter(Boolean).join(', ') || osmData.display_name?.split(',').slice(0, 2).join(', ') || 'Near ' + nearest.name;
        const matchedArea = matchNashikArea(`${suburb} ${road} ${osmData.display_name || ''}`, nearest.area);

        // Format clean address without redundant country info
        const parts = osmData.display_name?.split(',').map((s: string) => s.trim()) || [];
        const shortAddress = parts.slice(0, Math.min(4, parts.length)).join(', ');

        return NextResponse.json({
          success: true,
          lat,
          lng,
          formattedAddress: shortAddress || cleanStreet,
          street: cleanStreet,
          area: matchedArea,
          pincode: pincode,
          city: city,
          nearestOutlet: nearest,
          distanceKm,
          physicalNearestOutlet: physicalNearest,
          physicalDistanceKm,
          isFailover,
          failoverMessage,
          source: 'nominatim',
        });
      }
    } catch (osmErr) {
      console.warn('OSM reverse geocode failed:', osmErr);
    }

    // 3. Ultra-safe static fallback using nearest outlet coordinates
    return NextResponse.json({
      success: true,
      lat,
      lng,
      formattedAddress: `Near ${nearest.name}, ${nearest.area}, Nashik`,
      street: `Near ${nearest.name}`,
      area: nearest.area,
      pincode: '422005',
      city: 'Nashik',
      nearestOutlet: nearest,
      distanceKm,
      physicalNearestOutlet: physicalNearest,
      physicalDistanceKm,
      isFailover,
      failoverMessage,
      source: 'offline_fallback',
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while reverse geocoding' },
      { status: 500 }
    );
  }
}
