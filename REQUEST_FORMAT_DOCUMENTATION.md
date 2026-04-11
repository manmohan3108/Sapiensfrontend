# Sapiens API Request Format Documentation

## Overview
This document explains how data is sent to the Sapiens backend API for both text input and folder upload operations.

---

## 1. Text Input Request

### Endpoint
`POST /api/sapiens/text_input`

### Request Format
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "sapiensId": "12345",
  "text": "Your text message here"
}
```

### Example
```javascript
const response = await fetch('/api/sapiens/text_input', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sapiensId: "12345",
    text: "Analyze this data and provide insights"
  })
});
```

### TypeScript Interface
```typescript
interface TextInputRequest {
  sapiensId: string;
  text: string;
}
```

---

## 2. Folder Upload Request

### Endpoint
`POST /api/sapiens/learn_folder`

### Request Format
**Content-Type:** `multipart/form-data`

The request uses `FormData` to send files while preserving their folder structure.

### FormData Structure

1. **sapiens_id field** (string)
   - The ID of the Sapiens instance

2. **files field** (multiple File entries)
   - Each file is appended with its relative path preserved via `webkitRelativePath`
   - The filename parameter contains the full relative path (e.g., `my-folder/subfolder/file.txt`)

### Example FormData Construction

```javascript
const formData = new FormData();

// Add sapiens_id
formData.append('sapiens_id', '12345');

// Add files with preserved folder structure
files.forEach((file) => {
  // webkitRelativePath preserves the folder structure
  // e.g., "my-folder/subfolder/file.txt"
  const filePath = file.webkitRelativePath || file.name;
  formData.append('files', file, filePath);
});

const response = await fetch('/api/sapiens/learn_folder', {
  method: 'POST',
  body: formData, // No need to set Content-Type - browser sets it with boundary
});
```

### Detailed Explanation

#### webkitRelativePath Property
When a user selects a folder using the HTML5 file input with the `webkitdirectory` attribute:
```html
<input type="file" webkitdirectory />
```

Each `File` object will have a `webkitRelativePath` property containing the full relative path from the selected folder root.

**Example:**
If the user selects a folder named "my-project" containing:
```
my-project/
  ├── src/
  │   ├── index.js
  │   └── utils.js
  └── README.md
```

The files will have these `webkitRelativePath` values:
- `my-project/src/index.js`
- `my-project/src/utils.js`
- `my-project/README.md`

#### FormData File Appending
The third parameter of `formData.append()` is the filename:
```javascript
formData.append('files', fileObject, 'my-project/src/index.js');
```

This tells the server:
- The form field name is `'files'`
- The actual file data is `fileObject`
- The filename (including path) is `'my-project/src/index.js'`

### TypeScript Interface
```typescript
interface LearnFolderRequest {
  sapiensId: string;
  files: File[];  // Files with webkitRelativePath property
}
```

### Server-Side Expectation
The backend should:
1. Read the `sapiens_id` field from the FormData
2. Read all `files` entries
3. Extract the folder structure from the filename parameter of each file
4. Reconstruct the folder hierarchy on the server-side

### Example Server-Side Processing (Conceptual)
```python
# Python/Flask example
sapiens_id = request.form.get('sapiens_id')
files = request.files.getlist('files')

for file in files:
    # file.filename contains the full path: "my-project/src/index.js"
    relative_path = file.filename
    
    # Split into directory and filename
    directory = os.path.dirname(relative_path)  # "my-project/src"
    filename = os.path.basename(relative_path)  # "index.js"
    
    # Create directory structure and save file
    os.makedirs(directory, exist_ok=True)
    file.save(os.path.join(directory, filename))
```

---

## 3. Complete Request Flow

### Frontend Implementation
The `sapiensService.uploadFolder()` method handles the FormData construction:

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

### API Client Implementation
The `apiClient.postFormData()` method sends the request:

```typescript
async postFormData(url: string, formData: FormData): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser sets it with boundary
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
}
```

---

## 4. Key Points Summary

### Text Input
✅ Uses JSON format  
✅ Simple key-value pairs  
✅ Content-Type: `application/json`  
✅ Synchronous processing expected

### Folder Upload
✅ Uses FormData (multipart/form-data)  
✅ Preserves folder structure via `webkitRelativePath`  
✅ Supports multiple files in a single request  
✅ Browser automatically sets Content-Type with boundary  
✅ File paths are preserved in the filename parameter  
✅ Backend must reconstruct folder hierarchy from filenames

---

## 5. Error Handling

Both endpoints should handle errors gracefully:

```typescript
try {
  await sapiensService.sendTextInput({ sapiensId, text });
  // Success - refresh state
} catch (error) {
  console.error('Failed to send text:', error);
  // Show error to user
}

try {
  await sapiensService.uploadFolder({ sapiensId, files });
  // Success - refresh state
} catch (error) {
  console.error('Failed to upload folder:', error);
  // Show error to user
}
```

---

## 6. Testing with cURL

### Text Input
```bash
curl -X POST http://localhost:8000/api/sapiens/text_input \
  -H "Content-Type: application/json" \
  -d '{
    "sapiensId": "12345",
    "text": "Hello Sapiens"
  }'
```

### Folder Upload
```bash
curl -X POST http://localhost:8000/api/sapiens/learn_folder \
  -F "sapiens_id=12345" \
  -F "files=@my-project/src/index.js;filename=my-project/src/index.js" \
  -F "files=@my-project/README.md;filename=my-project/README.md"
```

Note: The `filename=` parameter in cURL simulates the `webkitRelativePath` behavior.
