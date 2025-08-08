import jwt from "jsonwebtoken";
import { getDbPool } from "../db.js";

/**
 * Authenticate user from either admin token (Authorization header) or regular user token (cookies)
 * Returns: { success: boolean, user: object, isAdmin: boolean, error?: string }
 */
export const authenticateUser = async (req) => {
  const pool = getDbPool();
  
  try {
    // Check for admin token in Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const userInfo = jwt.verify(token, process.env.JWT_SECRET || "admin_jwt_secret_key_2024");
        
        // Check if user exists and get role
        const userQuery = await pool.query(
          "SELECT * FROM users WHERE id = $1", 
          [userInfo.id]
        );
        
        if (userQuery.rows.length === 0) {
          return { success: false, error: "User not found" };
        }
        
        const user = userQuery.rows[0];
        return { 
          success: true, 
          user: user, 
          isAdmin: user.role === 'admin'
        };
      } catch (err) {
        return { success: false, error: "Invalid admin token" };
      }
    }
    
    // Fallback to cookie-based authentication (regular users)
    const token = req.cookies.access_token;
    if (!token) {
      return { success: false, error: "No authentication token found" };
    }
    
    try {
      const userInfo = jwt.verify(token, "jwtkey");
      
      // Check if user exists and get role
      const userQuery = await pool.query(
        "SELECT * FROM users WHERE id = $1", 
        [userInfo.id]
      );
      
      if (userQuery.rows.length === 0) {
        return { success: false, error: "User not found" };
      }
      
      const user = userQuery.rows[0];
      return { 
        success: true, 
        user: user, 
        isAdmin: user.role === 'admin'
      };
    } catch (err) {
      return { success: false, error: "Invalid token" };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: "Authentication failed" };
  }
};

/**
 * Middleware to require admin authentication
 */
export const requireAdmin = async (req, res, next) => {
  const auth = await authenticateUser(req);
  
  if (!auth.success) {
    return res.status(401).json(auth.error || "Authentication failed");
  }
  
  if (!auth.isAdmin) {
    return res.status(403).json("Admin privileges required");
  }
  
  req.user = auth.user;
  req.isAdmin = true;
  next();
};

/**
 * Middleware to require user authentication (admin or regular user)
 */
export const requireAuth = async (req, res, next) => {
  const auth = await authenticateUser(req);
  
  if (!auth.success) {
    return res.status(401).json(auth.error || "Authentication failed");
  }
  
  req.user = auth.user;
  req.isAdmin = auth.isAdmin;
  next();
};
