/**
 * Shared constants used across the application.
 */

/** Moderation status values used for garbage reports. */
export const MODERATION_STATUS = {
  REPORTED: 'reported',
  CONFIRMED: 'confirmed',
  RESOLVED: 'resolved',
} as const;

export type ModerationStatus = typeof MODERATION_STATUS[keyof typeof MODERATION_STATUS];
