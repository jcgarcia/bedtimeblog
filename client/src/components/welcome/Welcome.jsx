import { useEffect, useRef, useState } from 'react'
import  './welcome.css'
import WelcomeVideo from '../../media/BedTime.mp4'

export default function Welcome() {
  const videoRef = useRef(null)
  const [showAudioButton, setShowAudioButton] = useState(false)
  const [hasTriedAutoplay, setHasTriedAutoplay] = useState(false)

  useEffect(() => {
    const hasPlayedAudio = localStorage.getItem('bedtime-video-played')
    
    if (videoRef.current) {
      if (!hasPlayedAudio) {
        // First visit - try to play with audio
        videoRef.current.muted = false
        videoRef.current.play().then(() => {
          localStorage.setItem('bedtime-video-played', 'true')
          setHasTriedAutoplay(true)
        }).catch((error) => {
          // If autoplay with audio fails, show button to enable audio
          console.log('Autoplay with audio blocked, showing audio button')
          videoRef.current.muted = true
          videoRef.current.play()
          setShowAudioButton(true)
          setHasTriedAutoplay(true)
        })
      } else {
        // Subsequent visits - mute the video
        videoRef.current.muted = true
        videoRef.current.play()
        setHasTriedAutoplay(true)
      }
    }
  }, [])

  const handlePlayWithAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.currentTime = 0 // Restart video
      videoRef.current.play()
      localStorage.setItem('bedtime-video-played', 'true')
      setShowAudioButton(false)
    }
  }

  return (
    <div className='welcome'>
        <div className='video-container'>
            {showAudioButton && hasTriedAutoplay && (
              <div className="audio-button-overlay">
                <button 
                  className="play-audio-button" 
                  onClick={handlePlayWithAudio}
                  title="Play video with audio"
                >
                  🔊 Play with Audio
                </button>
              </div>
            )}
            <video 
              ref={videoRef}
              className='video-element' 
              controls 
              autoPlay={false}
            >
                <source src={WelcomeVideo} type="video/mp4" />
                Your browser does not support the video tag. Please update your browser.
            </video>
      </div>
    </div>
  )
}
