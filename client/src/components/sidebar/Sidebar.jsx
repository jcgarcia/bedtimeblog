import './sidebar.css'
import { Link, useLocation } from 'react-router-dom'
import Welcome from '../welcome/Welcome'
import { useSocialLinks } from '../../hooks/useSocialLinks'

export default function Sidebar() {
  const location = useLocation();
  const { socialLinks, loading } = useSocialLinks();
  
  // Define available categories (matching database categories)
  const categories = [
    { name: 'Technology', slug: 'technology' },
    { name: 'Lifestyle', slug: 'lifestyle' },
    { name: 'Tutorial', slug: 'tutorial' },
    { name: 'News', slug: 'news' },
    { name: 'Review', slug: 'review' }
  ];

  // Get current category from URL
  const getCurrentCategory = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'category' && pathParts[2]) {
      return pathParts[2];
    }
    return null;
  };

  const currentCategory = getCurrentCategory();

  return (
    <div className='sidebar'>
      <div className="sidebarItem">
        <span className="sidebarTitle">Indulge yourself</span>
          <div className="sidebarVideo" > 
          <Welcome/>
          </div>
        <p>What a sleepless nigh it was.
        </p>
      </div>

      <div className='sidebarItem'>
        <span className='sidebarTitle'>Categories</span> 
        <ul className='sidebarList'>
          <li className={`sidebarListItem ${!currentCategory ? 'active' : ''}`}>
            <Link to="/" className="sidebar-link">All Posts</Link>
          </li>
          {categories.map((category) => (
            <li 
              key={category.slug} 
              className={`sidebarListItem ${currentCategory === category.slug ? 'active' : ''}`}
            >
              <Link 
                to={`/category/${category.slug}`} 
                className="sidebar-link"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebarItem">
        <span className='sidebarTitle'>Wanna follow?</span> 
          <div className="sidebarSocial">
            {!loading && socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                <i className="sidebarIcon fa-brands fa-square-facebook"></i>
              </a>
            )}
            {!loading && socialLinks.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                <i className="sidebarIcon fa-brands fa-square-x-twitter"></i>
              </a>
            )}
            {!loading && socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <i className="sidebarIcon fa-brands fa-square-instagram"></i>
              </a>
            )}
            {!loading && socialLinks.threads && (
              <a href={socialLinks.threads} target="_blank" rel="noopener noreferrer">
                <i className="sidebarIcon fa-brands fa-square-threads"></i>
              </a>
            )}
            {!loading && !Object.values(socialLinks).some(url => url) && (
              <p style={{ color: '#999', fontSize: '0.9rem', margin: 0 }}>
                No social links configured yet.
              </p>
            )}
          </div>
      </div>
    </div>
  )
}
