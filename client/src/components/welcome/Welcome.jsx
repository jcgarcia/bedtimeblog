import  './welcome.css'
import WelcomeVideo from '../../media/BedTime.mp4'
//
export default function Welcome() {
  return (
    <div className='welcome'>
        <div className='video-container'>
            <video  className='video-element'  controls >
                <source src={WelcomeVideo} type="video/mp4" />
            </video>
      </div>
    </div>
  )
}
