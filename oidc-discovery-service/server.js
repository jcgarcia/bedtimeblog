const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// OIDC Discovery configuration based on K3s settings
const oidcConfig = {
  "issuer": "https://k8soci.ingasti.com",
  "jwks_uri": "https://k8soci.ingasti.com/openid/v1/jwks",
  "authorization_endpoint": "https://k8soci.ingasti.com/oauth2/authorize", 
  "token_endpoint": "https://k8soci.ingasti.com/oauth2/token",
  "userinfo_endpoint": "https://k8soci.ingasti.com/oauth2/userinfo",
  "subject_types_supported": ["public"],
  "response_types_supported": ["code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"],
  "claims_supported": ["aud", "exp", "iat", "iss", "sub"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid"]
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// OIDC Discovery endpoint
app.get('/.well-known/openid_configuration', (req, res) => {
  res.json(oidcConfig);
});

// JWKS endpoint - read from mounted ConfigMap
app.get('/openid/v1/jwks', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Read the JWKS from the mounted ConfigMap
    const jwksPath = '/app/jwks/jwks.json';
    
    if (fs.existsSync(jwksPath)) {
      const jwksData = fs.readFileSync(jwksPath, 'utf8');
      const jwks = JSON.parse(jwksData);
      res.json(jwks);
    } else {
      console.error('JWKS file not found at:', jwksPath);
      res.status(500).json({ error: 'JWKS file not found' });
    }
  } catch (error) {
    console.error('Error reading JWKS:', error);
    res.status(500).json({ error: 'Unable to read JWKS' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`OIDC Discovery Service running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`OIDC Discovery: http://localhost:${port}/.well-known/openid_configuration`);
});