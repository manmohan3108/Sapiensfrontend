# Chat and folder-upload request formats

This is the frontend request reference for `sapiensService.sendTextInput` and
`sapiensService.uploadFolder`. Endpoint paths are relative to
`VITE_API_BASE_URL`, which normally includes `/api`. Use the shared authenticated
API client; do not bypass its session and access handling.

Implementation sources:

- [Endpoint configuration](src/app/core/config/apiConfig.ts)
- [Sapiens service](src/app/core/services/sapiensService.ts)
- [API client](src/app/core/api/apiClient.ts)
- [Request and response types](src/app/types/sapiensTypes.ts)

## Chat

`POST /api/chat` with `Content-Type: application/json`:

```json
{
  "sapien_id": 66,
  "session_id": null,
  "message": "Your message"
}
```

The service converts its `sapiensId` string to the numeric `sapien_id` field.
Use `session_id: null` for a new conversation; send the returned `thread_id` as
`session_id` on later turns. The service accepts `reply` or the backend's
`message` alias, while retaining returned memory/context and diagnostic fields.

## Folder upload

`POST /api/sapiens/learn-folder` with a native `FormData` body:

| Field | Value |
| --- | --- |
| `sapiens_id` | Selected Sapien ID as a string |
| `files` | Repeated file entries, using each file's `name` as the multipart filename |
| `file_paths` | Repeated relative paths for files that supply `webkitRelativePath` |

The service constructs the body as follows:

```typescript
const formData = new FormData();
formData.append('sapiens_id', request.sapiensId);
request.files.forEach(file => {
  formData.append('files', file, file.name);
  if (file.webkitRelativePath) {
    formData.append('file_paths', file.webkitRelativePath);
  }
});
await apiClient.postFormData(API_ENDPOINTS.learnFolder, formData);
```

Do not stringify FormData or set its `Content-Type` manually. The browser adds
`multipart/form-data` with the correct boundary; the shared client still supplies
authentication. Relative folder paths are carried in `file_paths`, not substituted
for the multipart filename.

The service requires a response with `status: "accepted"` and a non-empty
`documents` array. Each document supplies `document_id`, `document_version_id`
and `ingestion_request_id`, with an optional `job_id`. Acceptance does not prove
that ingestion or learning has finished.

## Verification and failures

When testing an authorized upload, inspect the browser's request for the automatic
multipart boundary, repeated file entries and relative-path fields. Confirm the
acceptance response before showing success. Non-OK HTTP responses and timeouts
reject the request; an empty or non-JSON response does not satisfy the upload
service's acceptance check.

For chat, verify that a new conversation returns a thread ID and later messages
reuse it. Test only with the intended account and Sapien: these operations can
change data. The formats above describe frontend requests, not proof that a
particular backend deployment has been verified.
