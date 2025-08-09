import { useEffect, useRef, useState } from 'react'
import  './welcome.css'
import WelcomeVideo from '../../media/BedTime.mp4'

export default function Welcome() {
  const videoRef = useRef(null)
  const [showAudioButton, setShowAudioButton] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [shouldAutoplay, setShouldAutoplay] = useState(false)

  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('bedtime-video-played')
    const isReallyFirstVisit = !hasPlayedBefore
    
    setIsFirstVisit(isReallyFirstVisit)
    setShouldAutoplay(isReallyFirstVisit)
    
    if (videoRef.current && isReallyFirstVisit) {
      console.log('First visit detected - attempting autoplay with audio')
      // First visit - try to play with audio
      videoRef.current.muted = false
      videoRef.current.play().then(() => {
        console.log('Autoplay with audio successful')
        localStorage.setItem('bedtime-video-played', 'true')
      }).catch((error) => {
        console.log('Autoplay with audio blocked by browser, trying muted autoplay')
        // If autoplay with audio fails, try muted autoplay and show audio button
        videoRef.current.muted = true
        videoRef.current.play().then(() => {
          setShowAudioButton(true)
          localStorage.setItem('bedtime-video-played', 'true')
        }).catch((muteError) => {
          console.log('All autoplay attempts failed')
          setShowAudioButton(true)
        })
      })
    } else if (videoRef.current) {
      console.log('Not first visit - video ready for manual play only')
      // Subsequent visits - ensure video is paused and ready for manual play
      videoRef.current.muted = true
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [])

  const handlePlayWithAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.currentTime = 0
      videoRef.current.play()
      localStorage.setItem('bedtime-video-played', 'true')
      setShowAudioButton(false)
    }
  }

  const handleManualPlay = () => {
    if (videoRef.current && !isFirstVisit) {
      // For subsequent visits, play manually when user clicks
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  // Double-click to reset first visit (for testing/admin purposes)
  const handleDoubleClick = () => {
    if (!isFirstVisit) {
      localStorage.removeItem('bedtime-video-played')
      console.log('Video first-visit flag reset - refresh page to test autoplay again')
    }
  }

  return (
    <div className='welcome'>
        <div className='video-container'>
            {showAudioButton && isFirstVisit && (
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
            
            {!isFirstVisit && (
              <div className="manual-play-overlay">
                <button 
                  className="manual-play-button" 
                  onClick={handleManualPlay}
                  title="Click to play video"
                >
                  ▶️
                </button>
              </div>
            )}
            
            <video 
              ref={videoRef}
              className={`video-element ${!isFirstVisit ? 'manual-play-ready' : ''}`}
              controls 
              autoPlay={false}
              onClick={handleManualPlay}
              onDoubleClick={handleDoubleClick}
            >
                <source src={WelcomeVideo} type="video/mp4" />
                Your browser does not support the video tag. Please update your browser.
            </video>
      </div>
    </div>
  )
}
