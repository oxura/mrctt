# Forms Schema Documentation

This document outlines the structure and versioning of form fields in the CRM system.

## Form Field Schema v1

### Field Types

The following field types are supported:

- `text` - Single-line text input
- `email` - Email input with validation
- `phone` - Phone number input with validation
- `date` - Date picker
- `checkbox` - Boolean checkbox
- `dropdown` - Select from predefined options

### Field Structure

Each field in a form must conform to the following JSON schema:

```typescript
interface FormField {
  id: string;          // UUID v4 format for stable identification
  type: 'text' | 'phone' | 'email' | 'dropdown' | 'checkbox' | 'date';
  label: string;       // Display label (max 255 characters)
  placeholder?: string; // Optional placeholder text (max 255 characters)
  required: boolean;   // Whether the field is mandatory
  options?: string[];  // For dropdown type only (max 100 options, each max 255 chars)
}
```

### Form Structure

```typescript
interface Form {
  id: string;
  tenant_id: string;
  name: string;
  product_id: string | null;
  public_url: string;  // Cryptographically random URL-safe string (16+ bytes entropy)
  slug: string;
  fields: FormField[]; // Max 50 fields per form
  success_message: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

## Submission Data

When a form is submitted publicly, the data is validated and stored:

```typescript
interface FormSubmission {
  id: string;
  tenant_id: string;
  form_id: string;
  lead_id: string | null;
  data: Record<string, any>;  // Field ID -> value mapping
  ip_address: string | null;   // Submitter IP
  user_agent: string | null;   // Submitter user agent
  created_at: Date;
}
```

### Submission Constraints

- **Max fields**: 50 fields per submission
- **Max field value size**: 5000 characters per text field
- **Max payload size**: 32 KB total JSON payload
- **Rate limit**: 10 submissions per IP per form per hour

### Validation Rules

#### Email Fields
- Must match regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Converted to lowercase before storage

#### Phone Fields
- Must match regex: `/^[\d\s\+\-\(\)]+$/`
- Allows: digits, spaces, +, -, (, )

#### Text Fields
- Max length: 5000 characters
- Automatically trimmed

#### Checkbox Fields
- Must be `true` if required
- Stored as boolean

#### Dropdown Fields
- Must match one of the predefined options

## Schema Versioning

Currently, all forms use **Schema Version 1**. When schema changes are needed:

1. Forms created with a specific schema version will continue to validate against that version
2. Schema version can be stored in `forms.settings` JSONB field if needed
3. Migration scripts must be provided to convert forms between schema versions

## Field ID Stability

Field IDs use UUID v4 format to ensure:
- **Uniqueness**: No collisions across forms
- **Stability**: Field IDs never change, ensuring historical submission data remains valid
- **Flexibility**: Fields can be reordered, relabeled, or have validation changed without affecting existing submissions

## Security Considerations

- **Public URLs**: Generated with cryptographically strong randomness (16+ bytes, URL-safe base64)
- **IP Tracking**: All submissions log the source IP address for abuse detection
- **Rate Limiting**: Strict per-IP per-form rate limits prevent spam
- **Size Limits**: Multiple layers of size validation prevent DoS attacks
- **Captcha**: Optional hCaptcha or Cloudflare Turnstile integration for bot prevention

## Future Enhancements

Potential schema v2 features:
- Conditional field visibility
- Multi-step forms
- File upload fields
- Calculated/formula fields
- Field-level validation rules (regex, min/max, etc.)
- Custom validation messages per field
