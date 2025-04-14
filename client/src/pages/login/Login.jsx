import { Link } from "react-router-dom";
import "./login.css";

export default function Login() {
  return (
    <div className="login">
        <span className="loginTitle">Login</span>
      <form  className="loginForm">
        <button className="loginGoogleButton">
          <a href="/api/auth/google">Login with Google</a>
        </button>
        <button className="loginGoogleButton">
          <a href="/api/auth/facebook">Login with Facebook</a>
        </button>
        <button className="loginGoogleButton">
          <a href="/api/auth/twitter">Login with Twitter</a>
        </button>
      </form>
    </div>
  )
}

