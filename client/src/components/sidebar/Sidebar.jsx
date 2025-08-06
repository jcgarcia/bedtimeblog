import './sidebar.css'
import { Link, useLocation } from 'react-router-dom'
import Welcome from '../welcome/Welcome'

export default function Sidebar() {
  const location = useLocation();
  
  // Define available categories
  const categories = [
    { name: 'Life', slug: 'life' },
    { name: 'Kitchen', slug: 'kitchen' },
    { name: 'Style', slug: 'style' },
    { name: 'Show', slug: 'show' },
    { name: 'Tech', slug: 'tech' }
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
            <i className="sidebarIcon fa-brands fa-square-facebook"></i>
            <i className="sidebarIcon fa-brands fa-square-x-twitter"></i>   
            <i className="sidebarIcon fa-brands fa-square-instagram"></i>
            <i className="sidebarIcon fa-brands fa-square-threads"></i>
          </div>
      </div>
    </div>
  )
}
