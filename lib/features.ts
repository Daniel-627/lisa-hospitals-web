/**
 * Booking-only mode. The hospital's own clinical system is in use, so patient records, triage, billing etc. are hidden
 * here (and switched off on the API with CLINICAL_ENABLED). Set NEXT_PUBLIC_CLINICAL_ENABLED=true to bring them back.
 */
export const CLINICAL = process.env.NEXT_PUBLIC_CLINICAL_ENABLED === "true";
