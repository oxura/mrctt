# Email Configuration Guide

## Overview

The system includes email functionality for:
- **Password Reset**: Sends secure password reset links to users
- **Welcome Email**: Sent to new users upon registration

## Email Service Behavior

### Development Mode (Default)
When email settings are not configured, the system will:
- Log email content to the console
- Continue functioning normally without actual email delivery
- This is perfect for local development and testing

### Production Mode
To enable actual email delivery, configure the following environment variables:

## Configuration

### Gmail (Example)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password (not your regular password)
3. Add to `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM_ADDRESS=noreply@yourapp.com
EMAIL_FROM_NAME=Экосистема заявок
```

### Other SMTP Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM_ADDRESS=noreply@yourapp.com
EMAIL_FROM_NAME=Экосистема заявок
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM_ADDRESS=noreply@yourapp.com
EMAIL_FROM_NAME=Экосистема заявок
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASSWORD=your-mailgun-smtp-password
EMAIL_FROM_ADDRESS=noreply@yourapp.com
EMAIL_FROM_NAME=Экосистема заявок
```

## Testing Email Configuration

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Watch the console for email logs:
   - If configured correctly: "Email sent successfully"
   - If not configured: "Email would be sent (transporter not configured)"

3. Test password reset:
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/password/forgot \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "tenantSlug": "your-company"
     }'
   ```

4. Test registration (welcome email):
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newuser@example.com",
       "password": "password123",
       "firstName": "John",
       "companyName": "Test Company",
       "companySlug": "test-company"
     }'
   ```

## Security Best Practices

1. **Never commit** `.env` file to version control
2. Use **App Passwords** instead of regular passwords (for Gmail)
3. Rotate passwords regularly
4. Use **dedicated email service** in production (SendGrid, AWS SES, etc.)
5. Monitor email bounce rates and delivery statistics
6. Implement rate limiting to prevent email abuse

## Troubleshooting

### Emails not being sent

1. Check console logs for error messages
2. Verify SMTP credentials are correct
3. Ensure firewall allows outbound connections on the SMTP port
4. For Gmail: Make sure 2FA is enabled and using App Password
5. Check email provider's sending limits

### Email goes to spam

1. Configure SPF records for your domain
2. Set up DKIM signing
3. Use a verified sending domain
4. Avoid spam trigger words in subject/content
5. Use a dedicated email service provider

### Port/Connection Issues

- Port 25: Often blocked by ISPs
- Port 587: STARTTLS (recommended)
- Port 465: SSL/TLS
- Ensure `EMAIL_SECURE` matches your port configuration

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| EMAIL_HOST | No | - | SMTP server hostname |
| EMAIL_PORT | No | 587 | SMTP server port |
| EMAIL_SECURE | No | false | Use SSL/TLS (true for port 465) |
| EMAIL_USER | No | - | SMTP authentication username |
| EMAIL_PASSWORD | No | - | SMTP authentication password |
| EMAIL_FROM_ADDRESS | No | EMAIL_USER | Sender email address |
| EMAIL_FROM_NAME | No | "Экосистема заявок" | Sender display name |

## Production Recommendations

1. **Use a transactional email service**:
   - SendGrid (12,000 emails/month free)
   - AWS SES (very cheap, pay-as-you-go)
   - Mailgun (good for high volume)
   - Postmark (excellent deliverability)

2. **Monitor email delivery**:
   - Set up bounce/complaint notifications
   - Track open rates (if needed)
   - Monitor daily sending volume

3. **Email templates**:
   - Current templates are in Russian
   - Customize in `backend/src/services/emailService.ts`
   - Add internationalization if needed

## Support

If you encounter issues with email configuration:
1. Check the logs in `logs/error.log` (production)
2. Verify environment variables are loaded correctly
3. Test SMTP connection manually using telnet or online tools
4. Consult your email provider's documentation
