import { Link } from "react-router-dom";
import "./topbar.css"

export default function TopBar() {
  const user = false;
  return (
    <div className='top'>
      <div className="topLeft">
        <i className="topIcon fa-brands fa-square-facebook"></i>
        <i className="topIcon fa-brands fa-square-x-twitter"></i>   
        <i className="topIcon fa-brands fa-square-instagram"></i>
        <i className="topIcon fa-brands fa-square-threads"></i>
      </div>
      <div className="topCenter">
        <ul className="topList">
        <li className="topListItem"><Link className="link" to="/"  > Home </Link></li>
        <li className="topListItem"><Link className="link" to="/"  > About </Link></li>
        <li className="topListItem"><Link className="link" to="/"  > Contact </Link></li>
        <li className="topListItem"><Link className="link" to="/write"  > Write </Link></li>
        <li className="topListItem"> { user &&  "Logout" } </li>

        </ul>

      </div>
      <div className="topRight">
        {
          user ? (

            <img 
            className="topImg"
            src="https://lh3.googleusercontent.com/a/ACg8ocKyzBlZ6G6WI8BZQpstO_hcA3hhfSuyesOerch4wMn0ISfAXY8v=s96-c"
            alt="Julio Cesar Garcia"
            />          
          ) : (
            <ul className="topItem">
              <li className="topListItem">
                <Link className="link" to="/login">Login </Link>
                <Link className="link" to="/register">Register </Link>
              </li>
            </ul>
          )
        }

      <i className="topSearchIcon fa-brands fa-searchengin"></i>
      </div>
    </div>
  )
}
