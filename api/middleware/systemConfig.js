import SystemConfigManager from '../utils/systemConfig.js';

/**
 * Middleware to load system configuration and API keys from database
 */
async function loadSystemConfig(req, res, next) {
  try {
    const configManager = new SystemConfigManager();
    
    // Load essential configuration
    const config = {
      blogApiUrl: await configManager.getConfig('blog_api_url'),
      blogUserId: await configManager.getConfig('blog_user_id'),
      maxFileSize: parseInt(await configManager.getConfig('max_file_size')),
      allowedFileTypes: await configManager.getConfig('allowed_file_types'),
      rateLimitRequests: parseInt(await configManager.getConfig('rate_limit_requests')),
      rateLimitWindow: parseInt(await configManager.getConfig('rate_limit_window')),
      jwtExpiry: await configManager.getConfig('jwt_expiry'),
      sessionTimeout: parseInt(await configManager.getConfig('session_timeout'))
    };

    // Load API keys
    const apiKeys = {
      publishApiKey: await configManager.getApiKey('blog_publish_api_key'),
      githubWebhookSecret: await configManager.getApiKey('github_webhook_secret').catch(() => null),
      monitoringApiKey: await configManager.getApiKey('monitoring_api_key').catch(() => null)
    };

    // Attach to request object for use in routes
    req.systemConfig = config;
    req.apiKeys = apiKeys;
    req.configManager = configManager;

    next();
  } catch (error) {
    console.error('Failed to load system configuration:', error);
    res.status(500).json({ 
      error: 'System configuration error',
      message: 'Failed to load system configuration. Please check database connection.'
    });
  }
}

/**
 * API key validation middleware
 */
function validateApiKey(req, res, next) {
  const providedKey = req.headers['x-api-key'];
  
  if (!providedKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Check if the provided key matches any valid API key
  const validKeys = [
    req.apiKeys?.publishApiKey,
    req.apiKeys?.githubWebhookSecret,
    req.apiKeys?.monitoringApiKey
  ].filter(key => key); // Remove null/undefined keys

  if (!validKeys.includes(providedKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

/**
 * Audit logging middleware
 */
function auditLog(action) {
  return async (req, res, next) => {
    try {
      const configManager = req.configManager;
      if (configManager) {
        await configManager.logAccess(
          'api_access',
          0,
          action,
          null,
          req.originalUrl,
          req.user?.username || 'anonymous',
          req.ip,
          req.get('User-Agent')
        );
      }
      next();
    } catch (error) {
      console.error('Audit logging failed:', error);
      next(); // Continue even if audit fails
    }
  };
}

export { loadSystemConfig, validateApiKey, auditLog };
