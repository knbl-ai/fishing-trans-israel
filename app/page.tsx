'use client';

import { useRef, useState, useEffect } from 'react';

const arrowAnimation = `
  @keyframes arrowFloat {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(8px);
    }
  }

  .arrow-animate {
    animation: arrowFloat 1.5s ease-in-out infinite;
    display: inline-block;
  }
`;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        // Show button again when paused
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
        }
        setShowPlayButton(true);
      } else {
        // Set playing state immediately (optimistic update)
        setIsPlaying(true);
        // Set timeout to fade out button after 2 seconds
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
        }
        fadeTimeoutRef.current = setTimeout(() => {
          setShowPlayButton(false);
        }, 2000);

        // Try to play the video
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Play failed, but state is already updated
          });
        }
      }
    }
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click to seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percentage * duration;
    }
  };

  // Handle mouse enter on video area
  const handleVideoMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  // Handle mouse leave on video area
  const handleVideoMouseLeave = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  // Setup video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <main style={{ background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 40%, #0052cc 100%)' }} className="min-h-screen flex flex-col relative overflow-hidden">
      <style>{arrowAnimation}</style>
      {/* Background Image Overlay - Very Transparent */}
      <img
        src="/background-image.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none mix-blend-lighten"
      />
      {/* Header with Logo */}
      <header className="w-full px-8 py-6 flex items-center justify-between relative z-10" style={{ marginLeft: '40px' }}>
        <img
          src="/logo.png"
          alt="Trans Israel Logo"
          className="h-20 w-auto"
        />
        {/* Decorative Line Element - Top Right */}
        <img
          src="/TRANS_ISRAEL_ELEMENTS_LINES-11.png"
          alt="Decorative Line"
          className="pointer-events-none"
          style={{ width: '400px', height: 'auto', marginRight: '-20px' }}
        />
      </header>

      {/* Main Content Section - Two Columns */}
      <section className="flex-1 w-full flex flex-col lg:flex-row items-stretch relative z-10">

        {/* Left Side - Video (Half Screen Desktop) */}
        <div className="w-full lg:w-1/2 px-4 lg:px-8 py-4 lg:py-8 flex items-start justify-center">
          <div className="w-full flex flex-col justify-start" style={{ marginLeft: '40px', marginTop: '40px' }}>
            <div
              className="relative w-full bg-black shadow-lg overflow-hidden flex items-center justify-center group cursor-pointer"
              style={{ paddingBottom: '56.25%' }}
              onClick={handlePlayClick}
              onMouseEnter={handleVideoMouseEnter}
              onMouseLeave={handleVideoMouseLeave}
            >
              <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
                muted
                playsInline
              >
                <source src="/hero-video.mp4" type="video/mp4" />
              </video>

              {/* Video Control Bar */}
              <div
                className="absolute bottom-0 w-full bg-black bg-opacity-40 px-4 py-3 flex flex-col gap-2 transition-all duration-300 z-10"
                style={{
                  opacity: showControls ? 1 : 0,
                  visibility: showControls ? 'visible' : 'hidden',
                  transitionProperty: 'opacity, visibility',
                  boxShadow: '0 -6px 12px rgba(0, 0, 0, 0.6)'
                }}
                onMouseEnter={handleVideoMouseEnter}
                onMouseLeave={handleVideoMouseLeave}
              >
                {/* Progress Bar */}
                <div
                  className="w-full h-1 bg-gray-700 rounded cursor-pointer transition-all duration-200 group"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded transition-all duration-100"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <button
                      onClick={handlePlayClick}
                      className="hover:opacity-80 transition-opacity p-1"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-lg`}></i>
                    </button>

                    {/* Time Display */}
                    <span className="font-mono" style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Line Element */}
            <img
              src="/TRANS_ISRAEL_ELEMENTS_LINES-05.png"
              alt="Decorative Line"
              className="pointer-events-none"
              style={{ maxWidth: '400px', height: 'auto', marginLeft: '-150px', marginTop: '40px' }}
            />
          </div>
        </div>

        {/* Right Side - Text Content (Half Screen Desktop) */}
        <div className="w-full lg:w-1/2 px-4 lg:px-8 pt-0 pb-8 flex flex-col items-center justify-start text-white" dir="rtl" style={{ marginTop: '-60px' }}>
          <div className="w-full max-w-xl">
            {/* Headline */}
            <div style={{ fontFamily: 'FbPractica, Arial, sans-serif', marginBottom: '24px', textAlign: 'right' }}>
              <p className="text-xl md:text-2xl text-white mb-2 font-normal">
                נוסעים בכביש 6?
              </p>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight inline" style={{
                  background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>עושים סדר </h1>
                <span className="text-5xl md:text-6xl font-bold" style={{
                  background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                  color: 'white',
                  padding: '0px 20px',
                  lineHeight: '1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  position: 'relative',
                  top: '-4px'
                }}>בחיובים</span>
              </div>
            </div>
            {/* Body Text */}
            <p className="text-base md:text-lg leading-relaxed text-right text-white mb-5" style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}>
              כביש 6 מופעל על ידי <span className="font-bold">שני זכיינים שונים</span>.<br />
              נסעתם מצפון לדרום או להיפך ועברתם בשני המקטעים -<br />
              צפו לשני חיובים שונים.
            </p>

            {/* Buttons and Maps Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '70%', direction: 'ltr', marginLeft: 'auto' }}>
              {/* Row 1 - Map and Button as One Unit */}
              <div
                style={{ display: 'flex', gap: '0px', border: '2px solid white', overflow: 'hidden', direction: 'ltr', transition: 'border-color 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderImage = 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%) 1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderImage = 'none'; e.currentTarget.style.borderColor = 'white'; }}
              >
                <div className="overflow-hidden cursor-pointer" style={{ width: '120px' }}>
                  <img
                    src="/map-6-hotze.jpg"
                    alt="6 חוצה צפון - יוקנעם לסומך"
                    className="w-full h-auto object-cover"
                    style={{ transition: 'transform 0.3s ease-in-out' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </div>
                <div className="flex flex-col items-center justify-center" style={{ backgroundColor: '#2e6373', padding: '10px', flex: 1 }}>
                <a
                  href="https://6cn.co.il/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white transition text-center w-full"
                  style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '-6px' }}>קטע צפוני</div>
                  <div className="font-bold" style={{
                    fontSize: '40px',
                    marginBottom: '-6px',
                    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>6 חוצה צפון</div>
                  <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '-6px' }}>
                    <span>יוקנעם</span>
                    <span className="arrow-animate" style={{ fontSize: '16px' }}>↔</span>
                    <span>סומך</span>
                  </div>
                  <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                    <i className="fas fa-phone" style={{ fontSize: '13px' }}></i>
                    <span>*6102</span>
                  </div>
                </a>
                </div>
              </div>

              {/* Row 2 - Map and Button as One Unit */}
              <div
                style={{ display: 'flex', gap: '0px', border: '2px solid white', overflow: 'hidden', direction: 'ltr', transition: 'border-color 0.3s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderImage = 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%) 1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderImage = 'none'; e.currentTarget.style.borderColor = 'white'; }}
              >
                <div className="overflow-hidden cursor-pointer" style={{ width: '120px' }}>
                  <img
                    src="/map-derech-eretz.jpg"
                    alt="דרך ארץ - שורק לעין תות"
                    className="w-full h-auto object-cover"
                    style={{ transition: 'transform 0.3s ease-in-out' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </div>
                <div className="flex flex-col items-center justify-center" style={{ backgroundColor: '#006afd', padding: '10px', flex: 1 }}>
                  <a
                    href="https://www.kvish6.co.il/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white transition text-center w-full"
                    style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '-6px' }}>קטע מרכזי</div>
                    <div className="font-bold" style={{
                      fontSize: '40px',
                      marginBottom: '-6px',
                      background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>דרך ארץ</div>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '-6px' }}>
                      <span>שורק</span>
                      <span className="arrow-animate" style={{ fontSize: '16px' }}>↔</span>
                      <span>עין תות</span>
                    </div>
                    <div style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                      <i className="fas fa-phone" style={{ fontSize: '13px' }}></i>
                      <span>*6116</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
