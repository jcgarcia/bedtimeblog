# OAuth Provider Setup Guide

Complete step-by-step guide for obtaining OAuth credentials from Google, Facebook, and Twitter to enable social media login on your blog.

## 🎯 Overview

This guide will walk you through setting up OAuth applications with each social media provider to enable user authentication for commenting on your blog. Each provider has different requirements and steps.

## 📋 Prerequisites

- Access to your blog's Operations Panel (`/ops` → OAuth Config tab)
- Administrative access to Google, Facebook, and Twitter developer consoles
- Your blog's domain name (e.g., `blog.ingasti.com`)
- Your API backend URL (e.g., `bapi.ingasti.com`)

---

## 🔍 Google OAuth Setup

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one
   - Click "Select a project" → "New Project"
   - Name: "Bedtime Blog OAuth"
   - Click "Create"

### Step 2: Enable Google+ API
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google+ API" and click "Enable"
4. Alternatively, enable "Google Identity Services API"

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (for public blog)
3. Fill in required information:
   - **App name**: "Bedtime Blog"
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **App domain**: `blog.ingasti.com`
   - **Authorized domains**: Add `ingasti.com`
4. Click "Save and Continue"
5. Skip "Scopes" for now → "Save and Continue"
6. Add test users if needed → "Save and Continue"

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure the OAuth client:
   - **Name**: "Bedtime Blog Web Client"
   - **Authorized JavaScript origins**:
     - `https://blog.ingasti.com`
     - `http://localhost:3000` (for development)
   - **Authorized redirect URIs**:
     - `https://bapi.ingasti.com/api/auth/google/callback`
     - `http://localhost:5000/api/auth/google/callback` (for development)
5. Click "Create"

### Step 5: Get Your Credentials
1. Copy the **Client ID** and **Client Secret**
2. Go to your blog's Operations Panel → OAuth Config tab
3. Paste the credentials in the Google OAuth section:
   - **Client ID**: `1234567890-abcdef.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-abcdef123456`
4. Click "Test Configuration" to verify
5. Click "Save All OAuth Settings"

### 📝 Google OAuth Callback URLs
- **Production**: `https://bapi.ingasti.com/api/auth/google/callback`
- **Development**: `http://localhost:5000/api/auth/google/callback`

---

## 📘 Facebook OAuth Setup

### Step 1: Access Facebook for Developers
1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Sign in with your Facebook account
3. Click "My Apps" → "Create App"

### Step 2: Create Facebook App
1. Choose "Consumer" as app type
2. Fill in app details:
   - **App name**: "Bedtime Blog"
   - **App contact email**: Your email
   - **App purpose**: "Provide a way for users to comment on blog posts"
3. Click "Create App"

### Step 3: Configure Facebook Login
1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" platform
4. Enter your site URL: `https://blog.ingasti.com`
5. Continue through the setup

### Step 4: Configure OAuth Settings
1. Go to "Facebook Login" → "Settings" in the left sidebar
2. Configure Valid OAuth Redirect URIs:
   - `https://bapi.ingasti.com/api/auth/facebook/callback`
   - `http://localhost:5000/api/auth/facebook/callback` (for development)
3. Set Client OAuth Settings:
   - ✅ Client OAuth Login
   - ✅ Web OAuth Login
   - ✅ Force Web OAuth Reauthentication: No
   - ✅ Use Strict Mode for Redirect URIs: Yes

### Step 5: App Review and Go Live
1. Go to "App Review" → "Permissions and Features"
2. Request `public_profile` permission (usually approved automatically)
3. Go to "Settings" → "Basic"
4. Toggle "App Mode" from "Development" to "Live"
5. Add Privacy Policy URL: `https://blog.ingasti.com/privacy`
6. Add Terms of Service URL: `https://blog.ingasti.com/terms`

### Step 6: Get Your Credentials
1. Go to "Settings" → "Basic"
2. Copy the **App ID** and **App Secret**:
   - **App ID**: `1234567890123456`
   - **App Secret**: `abcdef1234567890abcdef1234567890`
3. Go to your blog's Operations Panel → OAuth Config tab
4. Paste the credentials in the Facebook OAuth section
5. Click "Test Configuration" to verify
6. Click "Save All OAuth Settings"

### 📝 Facebook OAuth Callback URLs
- **Production**: `https://bapi.ingasti.com/api/auth/facebook/callback`
- **Development**: `http://localhost:5000/api/auth/facebook/callback`

---

## 🐦 Twitter OAuth Setup

### Step 1: Access Twitter Developer Portal
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in with your Twitter account
3. Apply for developer access if you haven't already
4. Click "Create App" or "New App"

### Step 2: Create Twitter App
1. Fill in app details:
   - **App name**: "Bedtime Blog"
   - **Description**: "Blog commenting system using Twitter OAuth"
   - **Website URL**: `https://blog.ingasti.com`
   - **Callback URL**: `https://bapi.ingasti.com/api/auth/twitter/callback`
   - **Tell us how this app will be used**: "This app enables users to log in with their Twitter account to comment on blog posts. We only access basic profile information (username and profile picture) and do not post or access private data."

### Step 3: Configure App Permissions
1. Go to your app dashboard
2. Click on "Settings" tab
3. Under "App permissions":
   - Select "Read only" (we only need basic profile info)
4. Under "Type of App":
   - Select "Web App, Automated App or Bot"

### Step 4: Enable 3-legged OAuth
1. In app settings, go to "Authentication settings"
2. Enable "3-legged OAuth"
3. Add callback URLs:
   - `https://bapi.ingasti.com/api/auth/twitter/callback`
   - `http://localhost:5000/api/auth/twitter/callback` (for development)
4. Enable "Request email address from users" (optional)

### Step 5: Get Your Credentials
1. Go to "Keys and tokens" tab
2. Copy the **API Key** and **API Secret Key**:
   - **API Key (Consumer Key)**: `abcdef1234567890abcdef123`
   - **API Secret Key (Consumer Secret)**: `abcdef1234567890abcdef1234567890abcdef1234567890`
3. Go to your blog's Operations Panel → OAuth Config tab
4. Paste the credentials in the Twitter OAuth section:
   - **Consumer Key**: API Key
   - **Consumer Secret**: API Secret Key
5. Click "Test Configuration" to verify
6. Click "Save All OAuth Settings"

### 📝 Twitter OAuth Callback URLs
- **Production**: `https://bapi.ingasti.com/api/auth/twitter/callback`
- **Development**: `http://localhost:5000/api/auth/twitter/callback`

---

## 🔧 Configuration in Operations Panel

### Step 1: Access OAuth Configuration
1. Login to your blog admin panel
2. Go to `/ops` (Operations Panel)
3. Click on "OAuth Config" tab

### Step 2: Configure Each Provider
For each provider (Google, Facebook, Twitter):

1. **Enter Credentials**:
   - Paste the Client ID/App ID/Consumer Key
   - Paste the Client Secret/App Secret/Consumer Secret
   - Use the show/hide button to verify credentials

2. **Test Configuration**:
   - Click "Test Configuration" for each provider
   - Verify you see a ✅ success message
   - Fix any configuration errors

3. **Global Settings**:
   - Set **Frontend URL** to `https://blog.ingasti.com`
   - This URL is used for OAuth callbacks

4. **Save Settings**:
   - Click "Save All OAuth Settings"
   - Verify all providers show "✅ Configured" status

### Step 3: Verify Login Flow
1. Logout from admin panel
2. Go to `/login` page
3. Test each social media login button:
   - Click "Login with Google"
   - Click "Login with Facebook" 
   - Click "Login with Twitter"
4. Complete OAuth flow and verify successful login
5. Check that user avatar and name appear in top bar

---

## 🔒 Security Best Practices

### OAuth App Security
- ✅ **Use HTTPS only** for production callback URLs
- ✅ **Restrict callback URLs** to your exact domains
- ✅ **Use different apps** for development and production
- ✅ **Regularly rotate secrets** if compromised
- ✅ **Monitor usage** in provider dashboards

### Credential Management
- 🔐 **Never commit secrets** to version control
- 🔐 **Use environment variables** for local development
- 🔐 **Store in Operations Panel** for production
- 🔐 **Limit scope** to minimum required permissions
- 🔐 **Enable app review** for Facebook production use

### User Data Privacy
- 📋 **Minimal data collection**: Only name and avatar
- 📋 **No data storage**: User data not permanently stored
- 📋 **Clear purpose**: Authentication for commenting only
- 📋 **Privacy policy**: Document OAuth usage in privacy policy

---

## 🚨 Troubleshooting

### Common Issues

#### Google OAuth Errors
- **Error**: "redirect_uri_mismatch"
  - **Solution**: Add exact callback URL to Google Console authorized redirect URIs
  - **Check**: Ensure HTTPS is used for production URLs

- **Error**: "access_blocked"
  - **Solution**: Configure OAuth consent screen properly
  - **Check**: Add your domain to authorized domains

#### Facebook OAuth Errors
- **Error**: "App not setup for Facebook Login"
  - **Solution**: Add Facebook Login product to your app
  - **Check**: Enable Web OAuth Login in Facebook Login settings

- **Error**: "Invalid redirect_uri"
  - **Solution**: Add exact callback URL to Facebook app settings
  - **Check**: Ensure callback URL matches exactly (including https://)

#### Twitter OAuth Errors
- **Error**: "Invalid oauth_callback"
  - **Solution**: Enable 3-legged OAuth in Twitter app settings
  - **Check**: Add callback URL to app authentication settings

- **Error**: "Could not authenticate you"
  - **Solution**: Verify API keys are correct and app permissions are set
  - **Check**: Ensure API key and secret are from the same app

### Testing OAuth Configuration

1. **Use Test Configuration buttons** in Operations Panel
2. **Check browser developer console** for error messages
3. **Verify callback URLs** are exactly correct (including protocol)
4. **Test in incognito/private mode** to avoid cached authentication
5. **Check provider developer console logs** for detailed error information

---

## 📊 Configuration Summary

| Provider | Credentials Needed | Callback URL |
|----------|-------------------|--------------|
| **Google** | Client ID + Client Secret | `https://bapi.ingasti.com/api/auth/google/callback` |
| **Facebook** | App ID + App Secret | `https://bapi.ingasti.com/api/auth/facebook/callback` |
| **Twitter** | Consumer Key + Consumer Secret | `https://bapi.ingasti.com/api/auth/twitter/callback` |

### Example Configuration

```javascript
// Operations Panel OAuth Settings
{
  "google": {
    "clientId": "1234567890-abcdef.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-abcdef123456"
  },
  "facebook": {
    "appId": "1234567890123456",
    "appSecret": "abcdef1234567890abcdef1234567890"
  },
  "twitter": {
    "consumerKey": "abcdef1234567890abcdef123",
    "consumerSecret": "abcdef1234567890abcdef1234567890abcdef1234567890"
  },
  "frontendUrl": "https://blog.ingasti.com"
}
```

---

**Setup Complete!** 🎉 

Once all providers are configured, users will be able to login using their social media accounts to comment on your blog posts. The OAuth system provides secure authentication without storing user passwords or personal data.

---

**Last Updated**: August 8, 2025  
**Compatible with**: Bedtime Blog OAuth System v1.0  
**Support**: Check the Operations Panel for configuration status and test results
