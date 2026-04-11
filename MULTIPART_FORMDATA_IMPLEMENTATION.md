# Multipart/Form-Data Implementation Verification

## ✅ Current Implementation Status

The folder upload request **correctly sends `multipart/form-data`** following all best practices.

---

## Implementation Details

### 1. ✅ Uses FormData
**Location:** `/src/app/core/services/sapiensService.ts` (lines 77-89)

```typescript
async uploadFolder(request: LearnFolderRequest): Promise<void> {
  const formData = new FormData();
  formData.append('sapiens_id', request.sapiensId);
  
  // Append files with their relative paths preserved
  request.files.forEach((file) => {
    const filePath = (file as any).webkitRelativePath || file.name;
    formData.append('files', file, filePath);
  });

  await apiClient.postFormData(API_ENDPOINTS.learnFolder, formData);
}
```

### 2. ✅ Appends sapiens_id as Normal Form Field
```typescript
formData.append('sapiens_id', request.sapiensId);
```

### 3. ✅ Appends Files with webkitRelativePath
```typescript
request.files.forEach((file) => {
  const filePath = (file as any).webkitRelativePath || file.name;
  formData.append('files', file, filePath);
});
```

The third parameter in `formData.append('files', file, filePath)` sets the filename, preserving the folder structure.

### 4. ✅ Does NOT Manually Set Content-Type Header
**Location:** `/src/app/core/api/apiClient.ts` (lines 82-135)

```typescript
async postFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.timeout);

  try {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Don't include default headers for FormData - let browser set Content-Type with boundary
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // Explicitly don't set Content-Type - browser will set it with boundary
    });

    // ... rest of implementation
  }
}
```

**Key Points:**
- ❌ Does NOT spread `this.defaultHeaders` (which contains `Content-Type: application/json`)
- ❌ Does NOT set any `headers` option
- ✅ Lets the browser automatically set `Content-Type: multipart/form-data; boundary=...`

### 5. ✅ Uses fetch API
```typescript
const response = await fetch(url, {
  method: 'POST',
  body: formData,
  signal: controller.signal,
});
```

### 6. ✅ Handles Both JSON and Non-JSON Responses
```typescript
// Handle empty responses or non-JSON responses
let data;
const contentType = response.headers.get('content-type');
if (contentType && contentType.includes('application/json')) {
  data = await response.json();
} else {
  // For empty or non-JSON responses, return empty object
  data = {} as T;
}
```

This prevents errors if the backend returns an empty response or plain text.

---

## Request Flow

```
User selects folder
    ↓
CombinedInputPanel.handleUploadFolder()
    ↓
useSapiens.uploadFiles()
    ↓
sapiensService.uploadFolder()
    ├─ Creates FormData
    ├─ Appends sapiens_id
    ├─ Appends files with webkitRelativePath
    └─ Calls apiClient.postFormData()
        ↓
        fetch() with FormData body (NO Content-Type header)
        ↓
        Browser automatically sets:
        Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXXXXX
        ↓
        Backend receives multipart/form-data request
```

---

## What the Browser Sends

When the request is made, the browser automatically generates headers like this:

```http
POST /api/sapiens/learn_folder HTTP/1.1
Host: localhost:8000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Length: 123456

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="sapiens_id"

12345
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="files"; filename="my-folder/src/index.js"
Content-Type: application/javascript

[file contents here]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="files"; filename="my-folder/README.md"
Content-Type: text/markdown

[file contents here]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Key observations:**
1. Each file has `filename="my-folder/src/index.js"` - preserving folder structure
2. Browser automatically sets the `boundary` parameter
3. Each field is properly separated by the boundary
4. File content-types are auto-detected by the browser

---

## Common Pitfalls (All Avoided ✅)

### ❌ WRONG - Manually setting Content-Type
```typescript
// DON'T DO THIS
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data', // ❌ Missing boundary!
  },
  body: formData,
});
```

### ❌ WRONG - Spreading default headers
```typescript
// DON'T DO THIS
fetch(url, {
  method: 'POST',
  headers: {
    ...this.defaultHeaders, // ❌ Includes Content-Type: application/json
  },
  body: formData,
});
```

### ❌ WRONG - Stringifying FormData
```typescript
// DON'T DO THIS
fetch(url, {
  method: 'POST',
  body: JSON.stringify(formData), // ❌ FormData is not JSON!
});
```

### ✅ CORRECT - Our implementation
```typescript
// DO THIS
fetch(url, {
  method: 'POST',
  body: formData, // ✅ Browser handles everything
});
```

---

## Testing the Implementation

### From Browser DevTools (Network Tab)

When you upload a folder, you should see:

**Request Headers:**
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXXXXX
```

**Request Payload (FormData):**
```
sapiens_id: 12345
files: (binary)
files: (binary)
files: (binary)
...
```

**File names should preserve paths:**
```
my-folder/src/index.js
my-folder/src/utils/helper.js
my-folder/README.md
```

### Using cURL

```bash
# Simulate the exact request
curl -X POST http://localhost:8000/api/sapiens/learn_folder \
  -F "sapiens_id=12345" \
  -F "files=@my-folder/src/index.js;filename=my-folder/src/index.js" \
  -F "files=@my-folder/README.md;filename=my-folder/README.md"
```

---

## Backend Expectations

The backend should be able to:

1. **Read the `sapiens_id` field:**
   ```python
   sapiens_id = request.form['sapiens_id']  # "12345"
   ```

2. **Read all files:**
   ```python
   files = request.files.getlist('files')
   ```

3. **Extract folder structure from filenames:**
   ```python
   for file in files:
       # file.filename = "my-folder/src/index.js"
       relative_path = file.filename
       directory = os.path.dirname(relative_path)  # "my-folder/src"
       basename = os.path.basename(relative_path)  # "index.js"
   ```

---

## Conclusion

✅ The implementation **correctly sends multipart/form-data**  
✅ All requirements are met  
✅ No manual Content-Type header is set  
✅ Browser automatically handles the boundary  
✅ Folder structure is preserved via webkitRelativePath  
✅ Uses native fetch API  
✅ Handles both JSON and non-JSON responses gracefully  

**No changes needed - the implementation is already correct!**
