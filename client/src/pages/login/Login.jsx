import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/api.js";
import "./login.css";

export default function Login() {
  return (
    <div className="login">
        <span className="loginTitle">Login</span>
      <form  className="loginForm">
        <button className="loginGoogleButton">
          <a href={API_ENDPOINTS.AUTH.GOOGLE}>Login with Google</a>
        </button>
        <button className="loginGoogleButton">
          <a href={API_ENDPOINTS.AUTH.FACEBOOK}>Login with Facebook</a>
        </button>
        <button className="loginGoogleButton">
          <a href={API_ENDPOINTS.AUTH.TWITTER}>Login with Twitter</a>
        </button>
      </form>
    </div>
  )
}

