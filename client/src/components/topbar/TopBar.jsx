import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./topbar.css"

export default function TopBar() {
  const user = false;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Check if we're on mobile and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest('.top')) {
        setMenuOpen(false);
      }
    };

    // Initial check
    checkMobile();

    window.addEventListener('resize', checkMobile);
    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Menu items component
  const MenuItems = () => (
    <ul className={`topList ${menuOpen ? "open" : ""}`}>
      <li className="topListItem"><Link className="link" to="/" onClick={() => setMenuOpen(false)} > Home </Link></li>
      <li className="topListItem"><Link className="link" to="/about" onClick={() => setMenuOpen(false)} > About </Link></li>
      <li className="topListItem"><Link className="link" to="/" onClick={() => setMenuOpen(false)} > Contact </Link></li>
      <li className="topListItem"><Link className="link" to="/write" onClick={() => setMenuOpen(false)} > Ops </Link></li>
      <li className="topListItem"> { user &&  "Logout" } </li>
    </ul>
  );

  return (
    <div className='top'>
      <div className="topLeft">
        <i className="topIcon fa-brands fa-square-facebook"></i>
        <i className="topIcon fa-brands fa-square-x-twitter"></i>   
        <i className="topIcon fa-brands fa-square-instagram"></i>
        <i className="topIcon fa-brands fa-square-threads"></i>
      </div>
      
      {/* Desktop menu - only render on desktop */}
      {!isMobile && (
        <div className="topCenter">
          <MenuItems />
        </div>
      )}

      <div className="topRight">
        {
          user ? (
            <img 
            className="topImg"
            src="https://lh3.googleusercontent.com/a/ACg8ocKyzBlZ6G6WI8BZQpstO_hcA3hhfSuyesOerch4wMn0ISfAXY8v=s96-c"
            alt="Julio Cesar Garcia"
            />          
          ) : (
            <Link className="link loginIcon" to="/login">
              <i className="fa-solid fa-right-to-bracket"></i>
            </Link>
          )
        }

        <i className="topSearchIcon fa-brands fa-searchengin"></i>
        {/* Only show hamburger on mobile */}
        {isMobile && <i className="hamburgerIcon fa-solid fa-bars" onClick={toggleMenu}></i>}
      </div>

      {/* Mobile menu - only render when mobile and menu is open */}
      {isMobile && menuOpen && (
        <div className="mobileMenu">
          <MenuItems />
        </div>
      )}
    </div>
  )
}
