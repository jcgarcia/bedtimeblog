import express from 'express';
import AwsCredentialRefreshService from '../services/awsCredentialRefreshService.js';
const router = express.Router();

// Manual credential refresh endpoint
router.post('/refresh-credentials', async (req, res) => {
  try {
    const refreshService = new AwsCredentialRefreshService();
    await refreshService.refresh();
    
    res.json({
      success: true,
      message: 'AWS credentials refreshed successfully'
    });
  } catch (error) {
    console.error('Manual credential refresh failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check if credentials need refresh
router.get('/credential-status', async (req, res) => {
  try {
    const refreshService = new AwsCredentialRefreshService();
    const needsRefresh = await refreshService.needsRefresh();
    
    res.json({
      success: true,
      needsRefresh,
      message: needsRefresh ? 'Credentials need refresh' : 'Credentials are valid'
    });
  } catch (error) {
    console.error('Failed to check credential status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Auto-refresh endpoint (can be called by cron)
router.post('/auto-refresh', async (req, res) => {
  try {
    const refreshService = new AwsCredentialRefreshService();
    const refreshed = await refreshService.autoRefresh();
    
    res.json({
      success: true,
      refreshed,
      message: refreshed ? 'Credentials refreshed' : 'No refresh needed'
    });
  } catch (error) {
    console.error('Auto-refresh failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;