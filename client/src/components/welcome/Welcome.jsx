import  './welcome.css'
import WelcomeVideo from '../../media/BedTime.mp4'
//
export default function Welcome() {
  return (
    <div className='welcome'>
        <div className='video-container'>
            <video className='video-element' controls autoPlay>
                <source src={WelcomeVideo} type="video/mp4" />
                Your browser does not support the video tag. Please update your browser.
            </video>
      </div>
    </div>
  )
}
