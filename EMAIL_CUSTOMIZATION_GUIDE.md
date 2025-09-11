# Email Customization Guide

This guide shows you how to customize the sender information, avatars, and branding for your Times10 Time Tracker emails.

## 🎨 Quick Customization

### 1. **Update Email Configuration**

Edit `src/utils/emailConfig.ts` to customize:

```typescript
export const emailConfig: EmailConfig = {
  // Sender information
  senderName: 'Your Company Name',        // Change this
  senderEmail: 'noreply@yourdomain.com',  // Change this
  replyTo: 'support@yourdomain.com',      // Change this
  
  // Branding
  companyName: 'Your Company',            // Change this
  logoUrl: 'https://yourdomain.com/logo.png', // Add your logo URL
  primaryColor: '#your-brand-color',      // Change this
  secondaryColor: '#your-secondary-color', // Change this
  
  // Contact information
  supportEmail: 'support@yourdomain.com', // Change this
  websiteUrl: 'https://yourdomain.com',   // Change this
};
```

### 2. **Add Your Logo**

1. **Upload your logo** to your website or a CDN
2. **Update the `logoUrl`** in `emailConfig.ts`
3. **Recommended logo size**: 120px wide, transparent background

### 3. **Customize Colors**

Update the brand colors in `emailConfig.ts`:
- `primaryColor`: Main brand color (used for headers, buttons)
- `secondaryColor`: Secondary color (used for text, accents)

## 🔧 Advanced Customization

### **Resend Dashboard Configuration**

For the best email deliverability and sender reputation:

1. **Go to [Resend Dashboard](https://resend.com)**
2. **Navigate to "Domains"**
3. **Add your custom domain** (e.g., `yourdomain.com`)
4. **Configure DNS records** as instructed
5. **Set up sender authentication** (SPF, DKIM, DMARC)

### **Custom Sender Names**

You can use different sender names for different types of emails:

```typescript
// In your email functions, you can override the sender:
const { data: emailData, error } = await resend.emails.send({
  from: 'Times10 Support <support@trackr.times10.net>', // Custom sender
  replyTo: 'support@trackr.times10.net',
  to: [data.email],
  // ... rest of email config
});
```

### **Email Templates with Avatars**

To add sender avatars to email templates, you can:

1. **Add avatar images** to your email templates
2. **Use Gravatar** for user avatars
3. **Include company logos** in email headers

Example template with avatar:

```html
<div class="sender-info">
  <img src="https://gravatar.com/avatar/user-email-hash" 
       alt="Sender Avatar" 
       style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;" />
  <div>
    <strong>John Doe</strong><br>
    <span style="color: #666;">Project Manager</span>
  </div>
</div>
```

## 📧 Email Types and Customization

### **1. Invitation Emails**
- **Sender**: Company name + noreply email
- **Logo**: Company logo in header
- **Colors**: Brand colors
- **Reply-to**: Support email

### **2. Password Reset Emails**
- **Sender**: Company name + noreply email
- **Logo**: Company logo in header
- **Colors**: Brand colors
- **Reply-to**: Support email

### **3. Task Assignment Emails**
- **Sender**: Company name + noreply email
- **Logo**: Company logo in header
- **Colors**: Brand colors
- **Reply-to**: Support email

## 🎯 Best Practices

### **Sender Reputation**
- Use a consistent sender name
- Use a professional email address
- Set up proper SPF, DKIM, and DMARC records
- Monitor your sender reputation

### **Email Design**
- Keep logos under 200px wide
- Use web-safe fonts
- Test emails across different clients
- Include alt text for images

### **Deliverability**
- Use a verified domain
- Avoid spam trigger words
- Include unsubscribe links
- Monitor bounce rates

## 🔍 Testing Your Changes

### **1. Test Email Function**
Visit `/api/test-email` to test your email configuration.

### **2. Check Email Headers**
Verify that your custom sender information appears correctly in email headers.

### **3. Test Across Email Clients**
Send test emails and check how they appear in:
- Gmail
- Outlook
- Apple Mail
- Mobile email apps

## 🚀 Production Deployment

### **Environment Variables**
Set these in your production environment:

```env
# Email configuration
RESEND_API_KEY=your_resend_api_key
PUBLIC_SITE_URL=https://yourdomain.com

# Custom domain (if using)
EMAIL_DOMAIN=yourdomain.com
```

### **DNS Configuration**
If using a custom domain, configure these DNS records:

```
# SPF Record
TXT @ "v=spf1 include:_spf.resend.com ~all"

# DKIM Record (provided by Resend)
TXT resend._domainkey "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"

# DMARC Record
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

## 📝 Example Customizations

### **Corporate Branding**
```typescript
export const emailConfig: EmailConfig = {
  senderName: 'Acme Corp Team',
  senderEmail: 'noreply@acmecorp.com',
  replyTo: 'hr@acmecorp.com',
  companyName: 'Acme Corporation',
  logoUrl: 'https://acmecorp.com/assets/logo.png',
  primaryColor: '#1e40af',
  secondaryColor: '#374151',
  supportEmail: 'support@acmecorp.com',
  websiteUrl: 'https://acmecorp.com',
};
```

### **Personal Branding**
```typescript
export const emailConfig: EmailConfig = {
  senderName: 'John Doe',
  senderEmail: 'john@johndoe.com',
  replyTo: 'john@johndoe.com',
  companyName: 'John Doe Consulting',
  logoUrl: 'https://johndoe.com/avatar.png',
  primaryColor: '#059669',
  secondaryColor: '#1f2937',
  supportEmail: 'john@johndoe.com',
  websiteUrl: 'https://johndoe.com',
};
```

## 🆘 Troubleshooting

### **Emails not sending**
- Check your Resend API key
- Verify domain configuration
- Check DNS records

### **Sender name not showing**
- Ensure sender name is properly formatted
- Check Resend dashboard settings
- Verify domain authentication

### **Logo not displaying**
- Check logo URL is accessible
- Ensure logo is under 200px wide
- Test in different email clients

### **Colors not applying**
- Verify color codes are valid hex values
- Check CSS is properly formatted
- Test in different email clients
