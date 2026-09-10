# AXIVON ONE API Specification Guidelines

## Standards
- RESTful JSON API format with standardized response envelopes.
- All endpoints prefixed with `/api/v1/`.

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-09-09T18:00:00.000Z"
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [ ... ]
  },
  "timestamp": "2026-09-09T18:00:00.000Z"
}
```
