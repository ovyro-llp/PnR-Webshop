/**
 * Address Validation and Ambiguity Detection
 * Ensures customers provide unambiguous doorstep details (Flat/House No. + Building/Society + Street)
 * before any payment or delivery dispatch is accepted.
 */

export interface AddressValidationResult {
  isValid: boolean;
  reason?: string;
}

export function validateDeliveryAddress(address?: string | null): AddressValidationResult {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      reason: 'Delivery address details are required before proceeding to payment.',
    };
  }

  const clean = address.trim();

  if (clean.length < 8) {
    return {
      isValid: false,
      reason: 'Please enter a complete doorstep address (minimum 8 characters) with your Flat/House No. and Building name.',
    };
  }

  const lower = clean.toLowerCase();

  // 1. Generic placeholder & landmark strings without house/building details
  const genericPlaceholders = [
    "near puffs 'n' rolls",
    'near puffs n rolls',
    'near cycle circle',
    'near gangapur road',
    'near nd patel road',
    'near shalimar',
    'nashik',
    'nashik city',
    'college road',
    'gangapur road',
    'nd patel road',
    'shalimar',
    'canada corner',
    'mg road',
    'cbs',
    'panchavati',
  ];

  for (const placeholder of genericPlaceholders) {
    if (
      lower === placeholder ||
      lower === `${placeholder}, nashik` ||
      lower === `${placeholder}, maharashtra`
    ) {
      return {
        isValid: false,
        reason: 'Ambiguous address: Only an area/landmark was detected. Please add your Flat/House No. and Building/Society name.',
      };
    }
  }

  // 2. Check if address starts with raw placeholder without addition
  if (lower.startsWith("near puffs 'n' rolls") && clean.split(',').length < 3) {
    return {
      isValid: false,
      reason: 'Please enter your specific building/flat details instead of the default bakery location.',
    };
  }

  // 3. Must have either a number (flat 402, house 12, plot 3) OR clear residential keywords
  const hasDigit = /\d+/.test(clean);
  const residentialKeywords = [
    'flat',
    'apt',
    'apartment',
    'house',
    'bldg',
    'building',
    'society',
    'heights',
    'residency',
    'bungalow',
    'row house',
    'rowhouse',
    'tower',
    'floor',
    'wing',
    'room',
    'plot',
    'villa',
    'complex',
    'enclave',
    'park',
    'chawl',
    'lane',
    'opp',
    'opposite',
    'behind',
    'beside',
    'near',
  ];
  const hasKeyword = residentialKeywords.some((kw) => lower.includes(kw));

  if (!hasDigit && !hasKeyword) {
    return {
      isValid: false,
      reason: 'Address appears incomplete. Please specify your Flat/House number or Building/Society name so the rider can find your doorstep.',
    };
  }

  return { isValid: true };
}

/**
 * Splits a composite address into structured fields:
 * [houseFlatNo, buildingSociety, streetLandmark]
 */
export function splitAddressComponents(fullAddress?: string | null): {
  flatNo: string;
  building: string;
  street: string;
} {
  if (!fullAddress) {
    return { flatNo: '', building: '', street: '' };
  }

  const parts = fullAddress
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { flatNo: '', building: '', street: '' };
  }

  // If first part looks like a flat/house number or starts with Flat/House/Room/No
  const first = parts[0];
  const looksLikeFlat =
    /\d+/.test(first) ||
    /^(flat|room|house|plot|bldg|shop|office|no)/i.test(first);

  if (looksLikeFlat) {
    return {
      flatNo: first,
      building: parts[1] || '',
      street: parts.slice(2).join(', '),
    };
  }

  // If first part is a building/society
  if (parts.length >= 2) {
    return {
      flatNo: '',
      building: parts[0],
      street: parts.slice(1).join(', '),
    };
  }

  return {
    flatNo: '',
    building: parts[0] || '',
    street: '',
  };
}
