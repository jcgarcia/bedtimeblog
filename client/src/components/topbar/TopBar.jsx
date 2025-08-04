import { Link } from "react-router-dom";
import { useState } from "react";
import "./topbar.css"

export default function TopBar() {
  const user = false;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className='top'>
      <div className="topLeft">
        <i className="topIcon fa-brands fa-square-facebook"></i>
        <i className="topIcon fa-brands fa-square-x-twitter"></i>   
        <i className="topIcon fa-brands fa-square-instagram"></i>
        <i className="topIcon fa-brands fa-square-threads"></i>
      </div>
      <div className="topCenter">
        <ul className={`topList ${menuOpen ? "open" : ""}`}>
        <li className="topListItem"><Link className="link" to="/"  > Home </Link></li>
        <li className="topListItem"><Link className="link" to="/about"  > About </Link></li>
        <li className="topListItem"><Link className="link" to="/"  > Contact </Link></li>
        <li className="topListItem"><Link className="link" to="/write"  > Ops </Link></li>
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
                <Link className="link" to="/login">
                  <i className="fa-solid fa-right-to-bracket"></i> {/* Replaced 'Login' with a login icon */}
                </Link>
              </li>
            </ul>
          )
        }

      <i className="topSearchIcon fa-brands fa-searchengin"></i>
      <i className="hamburgerIcon fa-solid fa-bars" onClick={toggleMenu}></i>
      </div>
    </div>
  )
}
