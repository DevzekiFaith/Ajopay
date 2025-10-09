# Contact Information System

This directory contains shared contact information and utilities for the AjoPay application.

## Files

### `contact-info.ts`
Centralized configuration for all contact information used across the application.

**Usage:**
```typescript
import { contactInfo, companyInfo } from '@/lib/contact-info';

// Access contact details
console.log(contactInfo.email); // "hello@ajopay.com"
console.log(contactInfo.phone); // "+234 7014441418"

// Access company information
console.log(companyInfo.name); // "AjoPay"
console.log(companyInfo.tagline); // "Building Africa's Financial Future"
```

**Features:**
- Centralized contact information management
- Consistent formatting across all components
- Easy to update contact details in one place
- Includes social media links, support information, and business details

## Components

### `ContactInfo.tsx`
Reusable component for displaying contact information in different variants.

**Variants:**
- `default`: Standard vertical list with icons
- `compact`: Horizontal layout for small spaces
- `detailed`: Card-based layout with descriptions

**Usage:**
```tsx
import { ContactInfo } from '@/components/ContactInfo';

// Default variant
<ContactInfo />

// Compact variant
<ContactInfo variant="compact" />

// Detailed variant
<ContactInfo variant="detailed" />
```

## API Endpoints

### `/api/newsletter/subscribe`
Handles newsletter subscription requests.

**Request:**
```json
POST /api/newsletter/subscribe
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to AjoPay newsletter!",
  "email": "user@example.com"
}
```

## Integration

The contact information is automatically used in:
- Footer component
- Contact page
- Any component that imports from `@/lib/contact-info`

To update contact information, simply modify the `contact-info.ts` file and all components will automatically reflect the changes.
