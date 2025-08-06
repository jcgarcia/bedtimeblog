import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Search from "../search/Search";
import { useSocialLinks } from "../../hooks/useSocialLinks";
import "./topbar.css"

export default function TopBar() {
  const user = false;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { socialLinks, loading } = useSocialLinks();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  const closeSearch = () => {
    setSearchOpen(false);
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
      <li className="topListItem"><Link className="link" to="/ops" onClick={() => setMenuOpen(false)} > Ops </Link></li>
      <li className="topListItem"> { user &&  "Logout" } </li>
    </ul>
  );

  return (
    <div className='top'>
      <div className="topLeft">
        {!loading && socialLinks.facebook && (
          <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
            <i className="topIcon fa-brands fa-square-facebook"></i>
          </a>
        )}
        {!loading && socialLinks.twitter && (
          <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
            <i className="topIcon fa-brands fa-square-x-twitter"></i>
          </a>
        )}
        {!loading && socialLinks.instagram && (
          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
            <i className="topIcon fa-brands fa-square-instagram"></i>
          </a>
        )}
        {!loading && socialLinks.threads && (
          <a href={socialLinks.threads} target="_blank" rel="noopener noreferrer">
            <i className="topIcon fa-brands fa-square-threads"></i>
          </a>
        )}
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

        <i className="topSearchIcon fa-brands fa-searchengin" onClick={toggleSearch}></i>
        {/* Only show hamburger on mobile */}
        {isMobile && <i className="hamburgerIcon fa-solid fa-bars" onClick={toggleMenu}></i>}
      </div>

      {/* Mobile menu - only render when mobile and menu is open */}
      {isMobile && menuOpen && (
        <div className="mobileMenu">
          <MenuItems />
        </div>
      )}

      {/* Search Modal */}
      <Search isOpen={searchOpen} onClose={closeSearch} />
    </div>
  )
}
