# Sender Avatar Setup Guide

This guide shows you how to set up custom sender avatars that appear in email clients (Gmail, Outlook, Apple Mail, etc.) when users receive emails from your Times10 Time Tracker application.

## 🎯 What This Does

When users receive emails from your app, they'll see:
- **Your custom avatar** next to the sender name in their email client
- **Professional branding** that makes your emails instantly recognizable
- **Consistent visual identity** across all email communications

## 🖼️ Avatar Requirements

### **Image Specifications**
- **Format**: PNG or JPG
- **Size**: 192x192 pixels (recommended)
- **Shape**: Square (will be automatically rounded by email clients)
- **File size**: Under 100KB for best performance
- **Background**: Transparent or solid color

### **Design Tips**
- Use your company logo or a simplified version
- Ensure it's readable at small sizes (32x32px)
- Use high contrast colors
- Avoid text that's too small to read

## 🔧 Setup Instructions

### **1. Create Your Avatar Image**

Create a square avatar image (192x192px) with your branding:
- Company logo
- App icon
- Brand symbol
- Or a professional headshot

### **2. Upload to Your Website**

Upload your avatar image to your website:
```
https://trackr.times10.net/avatar.png
```

### **3. Configure in Email Settings**

Update `src/utils/emailConfig.ts`:

```typescript
export const emailConfig: EmailConfig = {
  // Sender information
  senderName: 'Times10 Trackr',
  senderEmail: 'noreply@trackr.times10.net',
  senderAvatarUrl: 'https://trackr.times10.net/avatar.png', // ← Your avatar URL
  
  // ... rest of config
};
```

### **4. Set Up Gravatar (Optional but Recommended)**

For maximum compatibility across email clients:

1. **Go to [Gravatar.com](https://gravatar.com)**
2. **Create an account** with your sender email (`noreply@trackr.times10.net`)
3. **Upload your avatar image**
4. **Verify the email address**

This ensures your avatar appears in Gmail, Outlook, and other email clients that support Gravatar.

## 📧 Email Client Support

### **Gmail**
- ✅ Supports Gravatar automatically
- ✅ Shows custom avatars from Gravatar
- ✅ Falls back to initials if no avatar

### **Outlook**
- ✅ Supports Gravatar
- ✅ Shows custom avatars
- ✅ Caches avatars for performance

### **Apple Mail**
- ✅ Supports Gravatar
- ✅ Shows custom avatars
- ✅ Works on both Mac and iOS

### **Other Clients**
- ✅ Most modern email clients support Gravatar
- ✅ Fallback to initials or default icons

## 🎨 Avatar Design Examples

### **Company Logo Avatar**
```
┌─────────────┐
│   [LOGO]    │
│  Times10    │
│   Trackr    │
└─────────────┘
```

### **App Icon Avatar**
```
┌─────────────┐
│     ⏱️      │
│   TIMER     │
│   ICON      │
└─────────────┘
```

### **Professional Avatar**
```
┌─────────────┐
│   [PHOTO]   │
│   John D.   │
│  Manager    │
└─────────────┘
```

## 🔍 Testing Your Avatar

### **1. Send Test Email**
Use the test email endpoint: `/api/test-email`

### **2. Check Different Email Clients**
- Gmail (web and mobile)
- Outlook (web and desktop)
- Apple Mail
- Thunderbird

### **3. Verify Avatar Display**
- Avatar appears next to sender name
- Avatar is clear and recognizable
- Avatar loads quickly

## 🚀 Advanced Configuration

### **Multiple Sender Avatars**

You can use different avatars for different types of emails:

```typescript
// In your email functions
const senderAvatar = emailType === 'support' 
  ? 'https://trackr.times10.net/support-avatar.png'
  : 'https://trackr.times10.net/default-avatar.png';

const { data: emailData, error } = await resend.emails.send({
  from: getSenderString(),
  replyTo: getReplyToString(),
  to: [data.email],
  // ... rest of config
});
```

### **Dynamic Avatar URLs**

You can generate avatar URLs dynamically:

```typescript
export function getSenderAvatarUrl(type: 'default' | 'support' | 'admin' = 'default'): string {
  const avatars = {
    default: 'https://trackr.times10.net/avatar.png',
    support: 'https://trackr.times10.net/support-avatar.png',
    admin: 'https://trackr.times10.net/admin-avatar.png'
  };
  return avatars[type];
}
```

## 🛠️ Troubleshooting

### **Avatar Not Showing**
1. **Check image URL** - Make sure it's accessible
2. **Verify Gravatar setup** - Upload to Gravatar with correct email
3. **Test in different clients** - Some clients cache avatars
4. **Check image format** - Use PNG or JPG

### **Avatar Looks Blurry**
1. **Increase image resolution** - Use 192x192px or higher
2. **Use vector graphics** - SVG converted to PNG works well
3. **Avoid compression** - Keep file size reasonable but quality high

### **Avatar Not Loading**
1. **Check HTTPS** - Make sure image URL uses HTTPS
2. **Verify CORS** - Ensure image is accessible from email clients
3. **Test URL directly** - Open image URL in browser

## 📱 Mobile Considerations

### **Retina Displays**
- Use 2x resolution (384x384px) for crisp display
- Email clients will automatically scale down

### **Small Screens**
- Ensure avatar is recognizable at 32x32px
- Use simple, bold designs
- Avoid fine details

## 🎯 Best Practices

### **Consistency**
- Use the same avatar across all email types
- Match your website/app branding
- Keep it professional

### **Performance**
- Optimize image file size
- Use CDN for faster loading
- Consider WebP format for modern clients

### **Accessibility**
- Ensure good contrast
- Avoid relying on color alone
- Include alt text in email templates

## 📊 Monitoring

### **Track Avatar Performance**
- Monitor email open rates
- Check user feedback
- Test across different devices

### **A/B Testing**
- Test different avatar designs
- Compare engagement rates
- Optimize based on results

## 🔗 Resources

- [Gravatar.com](https://gravatar.com) - Set up your sender avatar
- [Email Client Testing](https://litmus.com) - Test across email clients
- [Avatar Design Tools](https://canva.com) - Create professional avatars
- [Image Optimization](https://tinypng.com) - Compress your avatar images

## 📝 Quick Checklist

- [ ] Create 192x192px avatar image
- [ ] Upload to your website
- [ ] Update `emailConfig.ts` with avatar URL
- [ ] Set up Gravatar account with sender email
- [ ] Upload avatar to Gravatar
- [ ] Send test email
- [ ] Verify avatar appears in email clients
- [ ] Test on mobile devices
- [ ] Monitor performance and feedback
