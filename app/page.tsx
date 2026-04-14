'use client';

import { useRef, useState, useEffect } from 'react';

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
          <div className="w-full flex flex-col justify-start" style={{ marginLeft: '40px', marginTop: '5px' }}>
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
        <div className="w-full lg:w-1/2 px-4 lg:px-8 py-4 lg:py-8 flex flex-col items-center justify-start text-white" dir="rtl" style={{ marginTop: '20px' }}>
          <div className="w-full max-w-xl">
            {/* Headline */}
            <div className="text-right mb-8" style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3" style={{
                background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                נסעתם בכביש 6 וקיבלתם שתי חשבוניות?
              </h1>
              <div className="text-3xl md:text-4xl font-bold inline-block" style={{
                background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                color: 'white',
                padding: '2px 16px'
              }}>
                אל דאגה, זו לא טעות.
              </div>
            </div>

            {/* Body Text */}
            <p className="text-lg md:text-xl leading-relaxed text-right text-gray-200 mb-5" style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}>
              כביש 6 מחולק ל<span className="font-bold">שני מקטעים</span> המופעלים על ידי <span className="font-bold">זכיינים שונים</span>:
            </p>

            {/* Buttons Section */}
            <div className="flex gap-4 justify-end w-full mb-6 flex-row-reverse">
              {/* Button 1 - Derech Eretz */}
              <button
                className="px-4 py-2 border-2 border-white text-white transition text-center"
                style={{ fontFamily: 'FbPractica, Arial, sans-serif', width: '220px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FFD700';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.6), inset 0 0 15px rgba(255, 165, 0, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'white';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div className="font-bold text-base">דרך ארץ</div>
                <div className="text-sm">בין מחלף שורק לעין תות</div>
              </button>

              {/* Button 2 - Chutzot Tzafon */}
              <button
                className="px-4 py-2 border-2 border-white text-white transition text-center"
                style={{ fontFamily: 'FbPractica, Arial, sans-serif', width: '220px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FFD700';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.6), inset 0 0 15px rgba(255, 165, 0, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'white';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div className="font-bold text-base">שש חוצה צפון</div>
                <div className="text-sm">בין יקנעם לתל קשיש</div>
              </button>
            </div>

            {/* Description Text */}
            <p className="text-base md:text-lg leading-relaxed text-right text-gray-200" style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}>
              בלחיצה על כל אחד מהם תוכלו לברר חוב, לשלם, ולעשות מנוי ש<span className="font-bold">יחסוך לכם זמן וכסף</span>.
            </p>

          </div>
        </div>
      </section>

      {/* Footer - Contact Info */}
      <footer className="w-full px-8 py-2 text-white relative z-10" dir="rtl" style={{ backgroundColor: '#00103a' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-16">

          {/* Contact Section 1 */}
          <div className="flex items-center gap-6 text-right">
            <div style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}>
              <div className="text-xs font-normal flex items-center gap-3 whitespace-nowrap">
                <span style={{
                  background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>שש חוצה צפון</span>
                <span>-</span>
                <a href="tel:03-9533929" className="text-white hover:text-gray-200 transition">03-9533929</a>
                <a href="https://6cn.co.il/" className="text-white hover:text-gray-200 transition" target="_blank" rel="noopener noreferrer">6cn.co.il</a>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="https://www.facebook.com/share/1CEPZUxvXF/?mibextid=wwXIfr" className="text-white hover:scale-110 transition" title="Facebook" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f text-lg"></i>
              </a>
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-500 opacity-30"></div>

          {/* Contact Section 2 */}
          <div className="flex items-center gap-3 text-right">
            <div style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}>
              <div className="text-xs font-normal flex items-center gap-3 whitespace-nowrap">
                <span style={{
                  background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>דרך ארץ</span>
                <span>-</span>
                <a href="tel:xx-xxxxxxx" className="text-white hover:text-gray-200 transition">xx-xxxxxxx</a>
                <a href="https://derech-eretz.com/" className="text-white hover:text-gray-200 transition" target="_blank" rel="noopener noreferrer">derech-eretz.com</a>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="#" className="text-white hover:scale-110 transition" title="Facebook">
                <i className="fab fa-facebook-f text-lg"></i>
              </a>
            </div>
          </div>

        </div>
      </footer>
    </main>
  );
}
