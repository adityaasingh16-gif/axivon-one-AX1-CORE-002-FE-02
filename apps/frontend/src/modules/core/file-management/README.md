# File Management — AX1-P2-SHARED-002-FE-02

Primary frontend foundation for file upload and storage workflows.

## Implemented

- File metadata and typed file-management contracts.
- File listing response model with folder support.
- Upload adapter using `FormData` and progress callback.
- Preview and download helpers.
- Rename and delete API adapters.
- MIME/extension based file categorisation.
- Human-readable file-size formatting.
- Reusable, framework-agnostic drag/drop and file validation controller.
- Local no-API upload fallback for UI development.

## API contract

Configure the service with the API base URL. Expected endpoints:

- `GET /files?folderId=<id>`
- `POST /files` (`multipart/form-data`, `file`, optional `folderId`)
- `GET /files/:id/preview`
- `GET /files/:id/download`
- `PATCH /files/:id` with `{ "name": "..." }`
- `DELETE /files/:id`

The service uses credentialed requests so it can be connected to the existing authenticated application without embedding tokens in the UI.
