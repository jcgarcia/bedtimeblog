# Tomorrow's Development Plan: OAuth Configuration Panel

## 🎯 Objective
Add OAuth credentials management to the Operations Panel to complete the social media login system implementation.

## 📋 Tasks Breakdown

### 1. **Backend API Development**

#### A. **Database Schema Extension**
- Add OAuth credentials to system_config table
- New configuration keys:
  ```sql
  - oauth_google_client_id
  - oauth_google_client_secret
  - oauth_facebook_app_id
  - oauth_facebook_app_secret
  - oauth_twitter_consumer_key
  - oauth_twitter_consumer_secret
  - oauth_frontend_url
  ```

#### B. **Settings Controller Extension**
**File**: `/api/controllers/settings.js`
- Add new endpoint: `GET /api/settings/oauth`
- Add new endpoint: `POST /api/settings/oauth`
- Add new endpoint: `POST /api/settings/oauth/test` (validation)

#### C. **OAuth Settings Routes**
**File**: `/api/routes/settings.js`
- Add OAuth-specific routes
- Include validation middleware
- Add encryption for sensitive data

### 2. **Frontend Operations Panel**

#### A. **OAuth Settings Component**
**New File**: `/client/src/components/oauth-settings/OAuthSettings.jsx`
**Features**:
- Form fields for all OAuth credentials
- Provider-specific sections (Google, Facebook, Twitter)
- Test connection buttons for each provider
- Save/reset functionality
- Status indicators (configured/not configured)

#### B. **Operations Panel Integration**
**File**: `/client/src/pages/ops/Ops.jsx`
- Add "OAuth Configuration" tab/section
- Import and render OAuthSettings component
- Integrate with existing operations layout

#### C. **Styling**
**New File**: `/client/src/components/oauth-settings/oauth-settings.css`
- Consistent styling with existing operations panel
- Provider-specific color coding
- Form validation styling
- Status indicator styling

### 3. **API Configuration Management**

#### A. **Dynamic OAuth Configuration**
**File**: `/api/index.js`
- Modify Passport strategies to use database configuration
- Add configuration reload functionality
- Handle missing/invalid credentials gracefully

#### B. **Configuration Validation**
- Test OAuth app configurations
- Validate callback URLs
- Check credential format/validity

### 4. **User Experience Enhancements**

#### A. **Setup Wizard**
- Guide for obtaining OAuth credentials from each provider
- Step-by-step instructions with screenshots
- Callback URL generation helper

#### B. **Status Dashboard**
- Visual indicators for each OAuth provider status
- Last tested timestamps
- Error messaging for failed configurations

## 🔧 Technical Implementation Details

### OAuth Settings Component Structure
```jsx
const OAuthSettings = () => {
  // State management for each provider
  const [googleConfig, setGoogleConfig] = useState({});
  const [facebookConfig, setFacebookConfig] = useState({});
  const [twitterConfig, setTwitterConfig] = useState({});
  
  // Test connection functions
  const testGoogleConnection = async () => { /* ... */ };
  const testFacebookConnection = async () => { /* ... */ };
  const testTwitterConnection = async () => { /* ... */ };
  
  // Save configuration
  const saveOAuthSettings = async () => { /* ... */ };
  
  return (
    <div className="oauth-settings">
      <GoogleOAuthConfig />
      <FacebookOAuthConfig />
      <TwitterOAuthConfig />
      <GlobalOAuthSettings />
    </div>
  );
};
```

### Database Configuration
```sql
-- Add OAuth configuration entries
INSERT INTO system_config (key, value, description) VALUES
('oauth_google_client_id', '', 'Google OAuth Client ID'),
('oauth_google_client_secret', '', 'Google OAuth Client Secret'),
('oauth_facebook_app_id', '', 'Facebook App ID'),
('oauth_facebook_app_secret', '', 'Facebook App Secret'),
('oauth_twitter_consumer_key', '', 'Twitter Consumer Key'),
('oauth_twitter_consumer_secret', '', 'Twitter Consumer Secret'),
('oauth_frontend_url', 'https://blog.ingasti.com', 'Frontend URL for OAuth callbacks');
```

### API Endpoints
```javascript
// GET /api/settings/oauth
{
  "google": {
    "clientId": "***masked***",
    "configured": true
  },
  "facebook": {
    "appId": "***masked***",
    "configured": false
  },
  "twitter": {
    "consumerKey": "***masked***",
    "configured": true
  },
  "frontendUrl": "https://blog.ingasti.com"
}

// POST /api/settings/oauth
{
  "google": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  },
  "facebook": {
    "appId": "your-app-id",
    "appSecret": "your-app-secret"
  },
  "twitter": {
    "consumerKey": "your-consumer-key",
    "consumerSecret": "your-consumer-secret"
  },
  "frontendUrl": "https://blog.ingasti.com"
}
```

## 🎨 UI Mockup Structure

```
Operations Panel
├── OAuth Configuration
│   ├── Google OAuth
│   │   ├── Client ID [input field]
│   │   ├── Client Secret [password field]
│   │   ├── [Test Connection] [Save]
│   │   └── Status: ✅ Configured / ❌ Not Configured
│   ├── Facebook OAuth
│   │   ├── App ID [input field]
│   │   ├── App Secret [password field]
│   │   ├── [Test Connection] [Save]
│   │   └── Status: ✅ Configured / ❌ Not Configured
│   ├── Twitter OAuth
│   │   ├── Consumer Key [input field]
│   │   ├── Consumer Secret [password field]
│   │   ├── [Test Connection] [Save]
│   │   └── Status: ✅ Configured / ❌ Not Configured
│   └── Global Settings
│       ├── Frontend URL [input field]
│       ├── [Save All] [Reset All]
│       └── Overall Status: X/3 Providers Configured
```

## ✅ Acceptance Criteria

1. **Configuration Management**
   - ✅ Admin can input OAuth credentials through Operations Panel
   - ✅ Credentials are securely stored in database
   - ✅ Sensitive data is properly encrypted/masked in UI

2. **Validation & Testing**
   - ✅ Test connection functionality for each provider
   - ✅ Clear error messages for invalid configurations
   - ✅ Visual status indicators for each provider

3. **Integration**
   - ✅ OAuth system uses database configuration instead of environment variables
   - ✅ Configuration changes take effect without server restart
   - ✅ Fallback handling for missing/invalid credentials

4. **User Experience**
   - ✅ Intuitive interface for OAuth setup
   - ✅ Clear instructions for obtaining credentials
   - ✅ Responsive design consistent with existing operations panel

## 📅 Estimated Timeline
- **Backend API**: 2-3 hours
- **Frontend Component**: 2-3 hours  
- **Integration & Testing**: 1-2 hours
- **Documentation**: 1 hour

**Total Estimate**: 6-9 hours

## 🔗 Related Files to Modify Tomorrow

1. `/api/controllers/settings.js` - Add OAuth endpoints
2. `/api/routes/settings.js` - Add OAuth routes
3. `/api/index.js` - Make Passport strategies configurable
4. `/client/src/pages/ops/Ops.jsx` - Add OAuth section
5. `/client/src/components/oauth-settings/` - New component directory
6. `/database/system_config_schema.sql` - Add OAuth configuration keys

---

**Preparation Complete**: August 7, 2025  
**Ready for Tomorrow**: OAuth Configuration Panel Development  
**Current Status**: Social media login system implemented, awaiting configuration interface
