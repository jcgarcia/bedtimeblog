import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/api.js";
import "./login.css";

export default function Login() {
  const handleSocialLogin = (provider) => {
    // For OAuth, we need to redirect to the auth endpoint
    // The backend will handle the OAuth flow and redirect back to frontend
    window.location.href = API_ENDPOINTS.AUTH[provider.toUpperCase()];
  };

  return (
    <div className="login">
      <span className="loginTitle">Login to Comment</span>
      <div className="loginSubtitle">
        Login with your social media account to add comments to blog posts
      </div>
      
      <div className="loginForm">
        <button 
          className="loginButton loginGoogleButton"
          onClick={() => handleSocialLogin('google')}
        >
          <i className="fab fa-google"></i>
          Login with Google
        </button>
        
        <button 
          className="loginButton loginFacebookButton"
          onClick={() => handleSocialLogin('facebook')}
        >
          <i className="fab fa-facebook-f"></i>
          Login with Facebook
        </button>
        
        <button 
          className="loginButton loginTwitterButton"
          onClick={() => handleSocialLogin('twitter')}
        >
          <i className="fab fa-twitter"></i>
          Login with Twitter
        </button>
      </div>
      
      <div className="loginNote">
        <p>We don't store your personal information. Login is only used to verify your identity for commenting.</p>
      </div>
    </div>
  )
}

