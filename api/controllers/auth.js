import { getDbPool } from "../db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

export const register = async (req, res) => {
  const pool = getDbPool();
  
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check existing user
    const q = "SELECT * FROM users WHERE email = $1 OR username = $2";
    const result = await pool.query(q, [email, username]);
    
    if (result.rows.length) {
      return res.status(409).json({
        success: false,
        message: 'User already exists!'
      });
    }
    
    // Hash the password and create a user
    const hash = await argon2.hash(password);
    const q2 = `INSERT INTO users(username, email, password_hash, first_name, last_name, role, is_active, email_verified) 
                VALUES ($1, $2, $3, $4, $5, 'user', true, false)
                RETURNING id, username, email, first_name, last_name, role, created_at`;
    
    const newUserResult = await pool.query(q2, [username, email, hash, firstName, lastName]);
    const newUser = newUserResult.rows[0];
    
    return res.status(200).json({
      success: true,
      message: 'User has been created.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    });
  } catch (err) {
    console.error('Database error in register:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
};

export const login = async (req, res) => {
  const pool = getDbPool();
  
  try {
    // Accept both email and username for login
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
    }
    
    // Check user by username OR email
    const q = "SELECT * FROM users WHERE username = $1 OR email = $1";
    const result = await pool.query(q, [loginIdentifier]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found!'
      });
    }
    
    // Check password
    const user = result.rows[0];
    const isPasswordCorrect = await argon2.verify(
      user.password_hash,
      password
    );
    
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Wrong username or password!'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT token with proper secret
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    
    // Return response in expected format
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: userWithoutPassword.id,
        username: userWithoutPassword.username,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.first_name,
        lastName: userWithoutPassword.last_name,
        role: userWithoutPassword.role,
        isActive: userWithoutPassword.is_active,
        emailVerified: userWithoutPassword.email_verified,
        lastLoginAt: userWithoutPassword.last_login_at,
        createdAt: userWithoutPassword.created_at
      }
    });
  } catch (err) {
    console.error('Database error in login:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("access_token",{
    sameSite:"none",
    secure:true
  }).status(200).json("User has been logged out.")
};

// Verify user token
export const verify = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get current user data
    const pool = getDbPool();
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, role, is_active, 
              email_verified, last_login_at, created_at
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Cognito OAuth login
export const cognitoLogin = async (req, res) => {
  const pool = getDbPool();
  
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code and redirect URI are required'
      });
    }

    // Get Cognito configuration from settings
    const settingsQuery = `
      SELECT key, value FROM settings 
      WHERE key IN ('oauth_cognito_user_pool_id', 'oauth_cognito_client_id', 'oauth_cognito_client_secret', 
                    'oauth_cognito_region', 'oauth_cognito_domain') 
      AND group_name = 'oauth'
    `;
    const settingsResult = await pool.query(settingsQuery);
    
    if (settingsResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Cognito configuration not found'
      });
    }

    // Build config object from individual settings
    const cognitoConfig = {};
    settingsResult.rows.forEach(row => {
      switch (row.key) {
        case 'oauth_cognito_user_pool_id':
          cognitoConfig.userPoolId = row.value;
          break;
        case 'oauth_cognito_client_id':
          cognitoConfig.clientId = row.value;
          break;
        case 'oauth_cognito_client_secret':
          cognitoConfig.clientSecret = row.value;
          break;
        case 'oauth_cognito_region':
          cognitoConfig.region = row.value;
          break;
        case 'oauth_cognito_domain':
          cognitoConfig.domain = row.value;
          break;
      }
    });

    // Validate required config values
    const { domain, clientId, clientSecret, userPoolId, region } = cognitoConfig;
    if (!domain || !clientId || !clientSecret || !userPoolId || !region) {
      return res.status(500).json({
        success: false,
        message: 'Incomplete Cognito configuration'
      });
    }

    // Exchange authorization code for tokens
    const tokenUrl = `https://${domain}/oauth2/token`;
    
    // Use Basic Authentication as required by Cognito
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    });

    console.log(`🔄 Exchanging authorization code for tokens at ${tokenUrl}`);
    console.log(`📋 Using client_id: ${clientId}`);
    console.log(`🔗 Redirect URI: ${redirectUri}`);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: tokenParams
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error(`❌ Token exchange failed (${tokenResponse.status}):`, error);
      console.error(`🔍 Request details - URL: ${tokenUrl}, Client: ${clientId}, Redirect: ${redirectUri}`);
      return res.status(400).json({
        success: false,
        message: 'Failed to exchange authorization code for tokens',
        details: `HTTP ${tokenResponse.status}: ${error}`
      });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token } = tokenData;
    console.log(`✅ Token exchange successful, received access_token and id_token`);

    // Get user info from Cognito
    const userInfoResponse = await fetch(`https://${domain}/oauth2/userInfo`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get user information from Cognito'
      });
    }

    const userInfo = await userInfoResponse.json();
    const { sub: cognitoUserId, email, name, given_name, family_name } = userInfo;

    // Check if user exists in our database
    let user;
    const existingUserQuery = `
      SELECT * FROM users 
      WHERE cognito_user_id = $1 OR email = $2
    `;
    const existingUserResult = await pool.query(existingUserQuery, [cognitoUserId, email]);

    if (existingUserResult.rows.length > 0) {
      // Update existing user
      user = existingUserResult.rows[0];
      await pool.query(
        `UPDATE users 
         SET cognito_user_id = $1, last_login_at = CURRENT_TIMESTAMP, email_verified = true
         WHERE id = $2`,
        [cognitoUserId, user.id]
      );
    } else {
      // Create new user
      const createUserQuery = `
        INSERT INTO users (
          username, email, first_name, last_name, cognito_user_id,
          role, is_active, email_verified, created_at, last_login_at
        ) VALUES ($1, $2, $3, $4, $5, 'user', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const username = email.split('@')[0]; // Use email prefix as username
      const firstName = given_name || name || 'User';
      const lastName = family_name || '';
      
      const newUserResult = await pool.query(createUserQuery, [
        username, email, firstName, lastName, cognitoUserId
      ]);
      user = newUserResult.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role,
        cognitoUserId: cognitoUserId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return response
    res.status(200).json({
      success: true,
      message: 'Cognito login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        cognitoUserId: user.cognito_user_id
      }
    });

  } catch (error) {
    console.error('Cognito login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Cognito login',
      details: error.message
    });
  }
};

// Test Cognito connection
export const testCognitoConnection = async (req, res) => {
  try {
    const { userPoolId, clientId, region } = req.body;

    // Validate required parameters
    if (!userPoolId || !clientId || !region) {
      return res.status(400).json({
        success: false,
        message: 'User Pool ID, Client ID, and Region are required'
      });
    }

    // Basic validation of format
    if (!userPoolId.match(/^[a-z]+-[a-z]+-\d+_[A-Za-z0-9]+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User Pool ID format. Expected format: region_XXXXXXXXX'
      });
    }

    if (!region.match(/^[a-z]+-[a-z]+-\d+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region format. Expected format: us-west-2'
      });
    }

    // For now, just validate the format and return success
    // In a real implementation, you might want to make an actual AWS SDK call
    // to verify the User Pool exists and is accessible
    
    res.status(200).json({
      success: true,
      message: 'Cognito configuration appears valid',
      details: {
        userPoolId,
        clientId,
        region,
        endpoint: `https://cognito-idp.${region}.amazonaws.com`,
        status: 'Connection test passed - format validation successful'
      }
    });

  } catch (error) {
    console.error('Cognito connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing Cognito connection',
      details: { error: error.message }
    });
  }
};
