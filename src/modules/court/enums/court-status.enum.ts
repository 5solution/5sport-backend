export enum CourtStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

// Computed at query time, not stored in DB
export enum CourtOperationalStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  BUSY = 'BUSY',
  MAINTENANCE = 'MAINTENANCE',
}
