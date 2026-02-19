export const ErrorCode = {
  // ─── Common (0xxx) ───────────────────────────────────────────────
  INTERNAL_ERROR:           { code: '0000', http: 500 },
  VALIDATION_ERROR:         { code: '0001', http: 400 },
  UNAUTHORIZED:             { code: '0002', http: 401 },
  FORBIDDEN:                { code: '0003', http: 403 },
  NOT_FOUND:                { code: '0004', http: 404 },

  // ─── Auth (1xxx) ─────────────────────────────────────────────────
  INVALID_CREDENTIALS:      { code: '1001', http: 401 },
  INVALID_TOKEN:            { code: '1002', http: 401 },
  TOKEN_EXPIRED:            { code: '1003', http: 401 },

  // ─── User (2xxx) ─────────────────────────────────────────────────
  USER_NOT_FOUND:           { code: '2001', http: 404 },
  EMAIL_ALREADY_EXISTS:     { code: '2002', http: 400 },

  // ─── Event (3xxx) ────────────────────────────────────────────────
  EVENT_NOT_FOUND:          { code: '3001', http: 404 },
  SLUG_ALREADY_EXISTS:      { code: '3002', http: 400 },
  EVENT_NOT_DRAFT:          { code: '3003', http: 400 },
  EVENT_NOT_OWNER:          { code: '3004', http: 403 },
  EVENT_PUBLISH_INVALID:    { code: '3005', http: 400 },
  SESSION_NOT_FOUND:        { code: '3006', http: 404 },
  TICKET_CODE_EXISTS:       { code: '3007', http: 400 },
  TICKET_NOT_FOUND:         { code: '3008', http: 404 },
  FIELD_NOT_FOUND:          { code: '3009', http: 404 },
  DB_MAPPING_EXISTS:        { code: '3010', http: 400 },
  DESCRIPTION_NOT_FOUND:    { code: '3011', http: 404 },
  MEDIA_NOT_FOUND:          { code: '3012', http: 404 },
  EVENT_CANCEL_INVALID:     { code: '3013', http: 400 },

  // ─── Participant (4xxx) ──────────────────────────────────────────
  PARTICIPANT_NOT_FOUND:    { code: '4001', http: 404 },
  ALREADY_REGISTERED:       { code: '4002', http: 409 },
  NOT_OWN_REGISTRATION:     { code: '4003', http: 403 },

  // ─── Payment (5xxx) ──────────────────────────────────────────────
  PAYMENT_NOT_FOUND:        { code: '5001', http: 404 },
  INVALID_CALLBACK:         { code: '5002', http: 400 },
  UNSUPPORTED_PAYMENT:      { code: '5003', http: 400 },

  // ─── Upload (6xxx) ───────────────────────────────────────────────
  UPLOAD_FAILED:            { code: '6001', http: 500 },
} as const;

export type ErrorCodeEntry = (typeof ErrorCode)[keyof typeof ErrorCode];
