# Demo Authentication Bypass

## Overview

This project includes a demo authentication bypass feature that allows users to log in to demo accounts without requiring specific passwords. This is designed to facilitate testing and demonstration of the application.

## Demo Accounts

The following demo accounts are available:

| Role       | Email                     | Password       |
|------------|---------------------------|----------------|
| Владелец (Owner)  | owner@example.com  | Any password (at least 1 char) |
| Суперадмин (Super Admin) | superadmin@ecosystem.app | Any password (at least 1 char) |

## How It Works

### Demo Mode Configuration

Demo mode is **enabled by default** and can be disabled by setting the environment variable:

```bash
VITE_DEMO_MODE=false
```

### Login Methods

#### 1. Quick Demo Login Buttons

On the login page, you'll see two buttons in the demo section:
- **"Войти как Владелец"** - Login as Owner
- **"Войти как Суперадмин"** - Login as Super Admin

These buttons provide instant access to the demo accounts without requiring any credentials.

#### 2. Manual Login with Any Password

You can also manually enter:
- Email: `owner@example.com` or `superadmin@ecosystem.app`
- Password: Any string (e.g., "a", "password123", "test1234", "demo12345")

The system will bypass password validation completely for these demo accounts and log you in successfully.

### Security Considerations

⚠️ **Important**: Demo mode should be **disabled in production** environments by setting:

```bash
VITE_DEMO_MODE=false
```

When demo mode is disabled:
- Demo login buttons will not appear
- Password validation will be enforced for all accounts
- Standard authentication flow will be required

## Technical Implementation

### Code Location

The demo bypass logic is implemented in:
- `/src/pages/auth/Login.tsx`

### Key Features

1. **Password Bypass**: For demo accounts, the system skips password verification
2. **Rate Limiting**: Rate limiting is reset upon successful demo login
3. **UI Indicators**: Clear demo section with explanatory text
4. **Environment Control**: Can be toggled via environment variable

### Constants

```typescript
const SUPERADMIN_EMAIL = 'superadmin@ecosystem.app';
const DEMO_OWNER_EMAIL = 'owner@example.com';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'; // enabled by default
```

## Testing

To test the demo authentication:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000

3. Click either demo login button, or manually enter credentials

4. Verify successful login and navigation to appropriate page:
   - Owner → Dashboard (`/`)
   - Super Admin → Super Admin Panel (`/superadmin`)

## Troubleshooting

### Demo buttons not showing

Check that `VITE_DEMO_MODE` is not set to `'false'` in your `.env` file.

### "Demo аккаунт не найден" error

This should not occur with the predefined demo accounts. If it does:
1. Check that `mockUser()` is properly configured in `/src/data/mockData.ts`
2. Verify the email matches exactly (case-insensitive comparison is used)

### Rate limiting errors

If you see "Слишком много попыток входа", wait 15 minutes or clear browser storage.

## Related Files

- `/src/pages/auth/Login.tsx` - Main login component with demo bypass
- `/src/store/authStore.ts` - Authentication state management
- `/src/store/appStore.ts` - Application state including demo user
- `/src/data/mockData.ts` - Mock data including demo user configuration
