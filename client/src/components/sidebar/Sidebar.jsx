import  './sidebar.css'
import Welcome from '../welcome/Welcome'

export default function Sidebar() {
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
            <li className="sidebarListItem"> Life  </li>
            <li className="sidebarListItem"> Kitchen  </li>
            <li className="sidebarListItem"> Style  </li>
            <li className="sidebarListItem"> Show  </li>
            <li className="sidebarListItem"> Tech  </li>
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
