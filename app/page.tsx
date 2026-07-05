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

  input[type='range'].volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    cursor: pointer;
    box-shadow: 0 0 3px rgba(255, 165, 0, 0.6);
  }
  input[type='range'].volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 3px rgba(255, 165, 0, 0.6);
  }
`;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const map1Ref = useRef<HTMLDivElement>(null);
  const map2Ref = useRef<HTMLDivElement>(null);
  const [map1, setMap1] = useState({ scale: 1, tx: 0, ty: 0, dragging: false, lx: 0, ly: 0 });
  const [map2, setMap2] = useState({ scale: 1, tx: 0, ty: 0, dragging: false, lx: 0, ly: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  // Handle mute toggle
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  // Handle mobile tap on video — show controls then auto-hide after 3s
  const handleMobileTap = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
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
    setShowControls(false);
  };

  // Auto-unmute on first user interaction (browsers block autoplay with sound)
  useEffect(() => {
    const unmute = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    };
    document.addEventListener('click', unmute, { once: true });
    document.addEventListener('keydown', unmute, { once: true });
    return () => {
      document.removeEventListener('click', unmute);
      document.removeEventListener('keydown', unmute);
    };
  }, []);


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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <main style={{ background: '#f0f4f8' }} className="flex-1 flex flex-col relative overflow-hidden">
      <style>{arrowAnimation}</style>
      {/* Navy ribbon + tapered blue stripe */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        {/* Navy triangle */}
        <path d={isMobile ? 'M 0 0 L 65 0 L 0 78 Z' : 'M 0 0 L 52 0 L 0 72 Z'} fill="#001a4d" />
        {/* Tapered gold stripe */}
        <path d={isMobile ? 'M 65 0 L 72 0 L 0 78 Z' : 'M 52 0 L 59 0 L 0 72 Z'} fill="url(#goldGrad)" />
      </svg>
      {/* Background image overlay */}
      <img
        src="/Evlaim_0359_upd2.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.10, zIndex: 1 }}
      />
      {/* Header with Logo */}
      <header className="w-full px-8 py-6 flex items-center justify-between relative z-10" style={{ marginLeft: isMobile ? '0' : '40px' }}>
        <img
          src="https://storage.googleapis.com/hotze_landing_page/Logo%20%D7%9C%D7%95%D7%92%D7%95%20%D7%97%D7%93%D7%A9%20%D7%9C%D7%91%D7%9F.png"
          alt="Trans Israel Logo"
          className="h-10 w-auto"
          style={{ marginLeft: isMobile ? '0' : '-45px', marginTop: '-10px' }}
        />
        {/* Decorative Line Element - Top Right */}
        {!isMobile && (
          <img
            src="/TRANS_ISRAEL_ELEMENTS_LINES-11.png"
            alt="Decorative Line"
            className="m-deco-line pointer-events-none" style={{ width: '400px', height: 'auto', marginRight: '-120px', marginTop: '-40px' }}
          />
        )}
      </header>

      {/* ── MOBILE LAYOUT ── */}
      {isMobile && (
        <section className="flex-1 w-full flex flex-col relative z-10" dir="rtl">

          {/* Headline */}
          <div style={{ padding: '20px 20px 0', fontFamily: 'FbPractica, Arial, sans-serif', textAlign: 'right', marginBottom: '20px' }}>
            <p style={{ color: '#00103a', fontSize: '1.3rem', marginBottom: '0px' }}>קיבלתם הודעה על חוב בכביש אגרה?</p>
            <div style={{ display: 'inline-block', marginTop: '-6px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2.8rem', fontWeight: '900', lineHeight: '1.1', color: '#00103a' }}>רגע, אולי זה</span>
                <span style={{ fontSize: '2.8rem', fontWeight: '900', lineHeight: '1.1', color: '#f37121',  }}>פישינג!</span>
              </div>
              <div style={{ height: '3px', background: '#001a4d', borderRadius: '2px', marginTop: '6px', opacity: 0.9 }} />
            </div>
          </div>

          {/* Info Text */}
          <div style={{ padding: '0 20px 24px', fontFamily: 'FbPractica, Arial, sans-serif', fontSize: '1.1rem', color: '#374151', textAlign: 'right', lineHeight: '1.6' }}>
            <strong>מה זה פישינג?</strong><br />
            פישינג הוא ניסיון הונאה שבו גורמים עוינים מתחזים לגוף מוכר במטרה לגנוב פרטים אישיים או לבצע פעולה זדונית.<br />
            לדוגמא, גורמים המתחזים למפעילי כבישי אגרה מבצעים פניות באופן יזום באמצעים שונים כגון הודעות SMS ודוא&quot;ל הדורשים מהנמען לשלם חוב או למסור פרטים אישיים.<br />
            <strong>הטיפ שלנו:</strong><br />
            הימנעו מלחיצה על קישורים חשודים או ממסירת פרטים בעקבות מסרונים, דוא&quot;ל או שיחות טלפון<br />שאינכם בטוחים במקורם. במקרה של ספק, מומלץ לאמת את תוכן הפניה ישירות מול מפעיל הכביש הרלוונטי.<br />
            לנוחותכם, מצורפים קישורים לאתרים הרשמיים של מפעילי כבישי האגרה:
          </div>

          {/* Video */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 28px' }}>
            <div style={{ width: 'calc(100vw - 32px)', position: 'relative' }}>
              <div
                className="relative w-full bg-black shadow-lg overflow-hidden cursor-pointer"
                style={{ paddingBottom: '177.78%', borderRadius: '12px' }}
                onClick={handleMobileTap}
              >
                <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" muted={isMuted} playsInline autoPlay loop>
                  <source src="https://storage.googleapis.com/hotze_landing_page/4385_HOTZE-ISRAEL_NEW_FRANCHISEES_VIDEO_1080X1920_E.mp4" type="video/mp4" />
                </video>
                {/* Mobile Video Controls */}
                <div className="absolute bottom-0 w-full px-3 py-2 flex flex-col gap-2 z-10"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%)',
                    opacity: showControls ? 1 : 0,
                    visibility: showControls ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s, visibility 0.3s'
                  }}>
                  <div className="w-full h-1 bg-gray-700 rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); handleProgressClick(e as any); }}>
                    <div className="h-full rounded" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, background: 'linear-gradient(to right, #FFD700, #FFA500)' }} />
                  </div>
                  <div className="flex items-center justify-between text-white text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); handlePlayClick(); }} className="p-1">
                        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-base`}></i>
                      </button>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleMuteToggle(e as any); }} className="p-1">
                      <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'} text-sm`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Cards - exact desktop card design, stacked vertically */}
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', width: '100%', boxSizing: 'border-box', direction: 'rtl' }}>

            {/* דרך ארץ */}
            <a href="https://service.kvish6.co.il/#/website/customer-area/registration?x=1&Button=Strip" target="_blank" rel="noopener noreferrer"
              style={{ flex: '1 1 calc(50% - 6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: 'white', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', textDecoration: 'none', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 12px' }}>
                <img src="https://storage.googleapis.com/hotze_landing_page/Derech-Eretz-Logo.png" alt="דרך ארץ" style={{ height: '60px', objectFit: 'contain' }} />
              </div>
              <div style={{ width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)', color: 'white', textAlign: 'center', padding: '8px 12px', fontFamily: 'FbPractica, Arial, sans-serif', fontWeight: '700', fontSize: '13px' }}>דרך ארץ (כביש 6)</div>
            </a>

            {/* חוצה צפון 6 */}
            <a href="https://6cn.co.il/register" target="_blank" rel="noopener noreferrer"
              style={{ flex: '1 1 calc(50% - 6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: 'white', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', textDecoration: 'none', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 12px' }}>
                <img src="https://storage.googleapis.com/hotze_landing_page/LogoHozteZafon6.png" alt="חוצה צפון 6" style={{ height: '60px', objectFit: 'contain' }} />
              </div>
              <div style={{ width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)', color: 'white', textAlign: 'center', padding: '8px 12px', fontFamily: 'FbPractica, Arial, sans-serif', fontWeight: '700', fontSize: '13px' }}>6 חוצה צפון</div>
            </a>

            {/* מנהרות הכרמל */}
            <a href="https://www.carmeltunnels.co.il/" target="_blank" rel="noopener noreferrer"
              style={{ flex: '1 1 calc(50% - 6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: 'white', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', textDecoration: 'none', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 12px' }}>
                <img src="/carmel_tunnels_logo.png" alt="מנהרות הכרמל" style={{ height: '60px', objectFit: 'contain' }} />
              </div>
              <div style={{ width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)', color: 'white', textAlign: 'center', padding: '8px 12px', fontFamily: 'FbPractica, Arial, sans-serif', fontWeight: '700', fontSize: '13px' }}>מנהרות הכרמל</div>
            </a>

            {/* הנתיב המהיר */}
            <a href="https://fastlane.co.il/" target="_blank" rel="noopener noreferrer"
              style={{ flex: '1 1 calc(50% - 6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: 'white', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', textDecoration: 'none', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 12px' }}>
                <img src="/the_fast_lane_logo.png" alt="הנתיב המהיר" style={{ height: '40px', objectFit: 'contain' }} />
              </div>
              <div style={{ width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)', color: 'white', textAlign: 'center', padding: '8px 12px', fontFamily: 'FbPractica, Arial, sans-serif', fontWeight: '700', fontSize: '13px' }}>הנתיב המהיר</div>
            </a>

          </div>

          {/* Phishing stripe - mobile */}
          <div style={{ margin: '0 16px 24px', borderRadius: '16px', overflow: 'hidden', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 60%, #0052cc 100%)', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', padding: '20px 12px 12px', direction: 'ltr' }}>
            {/* Message photos */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src="/message_cut_crop.png" alt="הודעת פישינג" style={{ height: '110px', display: 'block', borderRadius: '8px 8px 0 0' }} />
              <img src="/fishing_stamp_WITH_WHITE.png" alt="חותמת פישינג" style={{ position: 'absolute', top: '-12px', left: '-12px', height: '54px', transform: 'rotate(-15deg)' }} />
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src="/message_cut3_crop.png" alt="הודעת פישינג" style={{ height: '110px', display: 'block', borderRadius: '8px 8px 0 0' }} />
              <img src="/fishing_stamp_WITH_WHITE.png" alt="חותמת פישינג" style={{ position: 'absolute', top: '-12px', left: '-12px', height: '54px', transform: 'rotate(-15deg)' }} />
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src="/message_cut2_crop.png" alt="הודעת פישינג" style={{ height: '110px', display: 'block', borderRadius: '8px 8px 0 0' }} />
              <img src="/fishing_stamp_WITH_WHITE.png" alt="חותמת פישינג" style={{ position: 'absolute', top: '-12px', left: '-12px', height: '54px', transform: 'rotate(-15deg)' }} />
            </div>
            {/* Warning icon */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" style={{ height: '70px', width: 'auto' }}>
                <polygon points="50,8 95,82 5,82" fill="none" stroke="#FFD700" strokeWidth="5" strokeLinejoin="round" />
                <text x="50" y="72" textAnchor="middle" fill="#FFD700" fontSize="44" fontWeight="900" fontFamily="Arial">!</text>
              </svg>
            </div>
          </div>

        </section>
      )}

      {/* ── DESKTOP LAYOUT ── */}
      {!isMobile && <section className="flex-1 w-full flex flex-col lg:flex-row items-stretch relative z-10">

        {/* Left Side - Video (Half Screen Desktop) */}
        <div className="m-video-col w-full lg:w-2/5 px-8 lg:px-14 py-4 lg:py-8 flex items-center justify-center">
          <div className="m-video-wrapper flex flex-col justify-start" style={{ marginLeft: '75px', marginTop: '-60px', height: '70vh', width: 'calc(70vh * 9 / 16)', flexShrink: 0 }}>
            <div
              className="relative w-full bg-black shadow-lg overflow-hidden flex items-center justify-center group cursor-pointer"
              style={{ height: '70vh', borderRadius: '12px' }}
              onClick={handlePlayClick}
              onMouseEnter={handleVideoMouseEnter}
              onMouseLeave={handleVideoMouseLeave}
            >
              <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
                muted={isMuted}
                playsInline
                autoPlay
                loop
              >
                <source src="https://storage.googleapis.com/hotze_landing_page/4385_HOTZE-ISRAEL_NEW_FRANCHISEES_VIDEO_1080X1920_E.mp4" type="video/mp4" />
              </video>

              {/* Video Control Bar */}
              <div
                className="absolute bottom-0 w-full px-4 py-3 flex flex-col gap-2 transition-all duration-300 z-10"
                style={{
                  opacity: showControls ? 1 : 0,
                  visibility: showControls ? 'visible' : 'hidden',
                  transitionProperty: 'opacity, visibility',
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%)'
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
                    <span className="font-mono text-xs" style={{ fontFamily: 'FbPractica, Arial, sans-serif' }}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Volume Controls */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={handleMuteToggle}
                      className="hover:opacity-80 transition-opacity p-1"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      <i className={`fas ${isMuted ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'} text-sm`}></i>
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 cursor-pointer volume-slider"
                      style={{
                        height: '4px',
                        borderRadius: '2px',
                        outline: 'none',
                        appearance: 'none' as const,
                        background: `linear-gradient(to right, #FFD700 0%, #FFA500 ${(isMuted ? 0 : volume) * 100}%, #4B5563 ${(isMuted ? 0 : volume) * 100}%, #4B5563 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Line Element */}
            <img
              src="/TRANS_ISRAEL_ELEMENTS_LINES-05.png"
              alt="Decorative Line"
              className="pointer-events-none"
              style={{ maxWidth: '400px', height: 'auto', marginLeft: '-420px', marginTop: '-120px' }}
            />
          </div>
        </div>

        {/* Right Side - Text Content (Half Screen Desktop) */}
        <div className="m-right-col w-full lg:w-3/5 px-8 lg:px-14 pt-0 pb-8 flex flex-col items-end justify-center" dir="rtl" style={{ marginTop: '-60px' }}>
          <div className="m-content-wrapper w-full" style={{ maxWidth: 'clamp(620px, 55vw, 950px)' }}>
            {/* Headline */}
            <div style={{ fontFamily: 'FbPractica, Arial, sans-serif', marginBottom: '24px', textAlign: 'right' }}>
              <p className="mb-2" style={{ color: '#00103a', fontSize: 'clamp(1.2rem, 1.8vw, 1.75rem)', fontWeight: '700', marginTop: '40px' }}>
                קיבלתם הודעה על חוב בכביש אגרה?
              </p>
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '-10px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-start', gap: '10px' }}>
                <span style={{
                  fontSize: 'clamp(2.2rem, 3.5vw, 4.2rem)',
                  fontWeight: '900',
                  lineHeight: '1.1',
                  color: '#00103a',
                }}>רגע, אולי זה</span>
                <span style={{
                    fontSize: 'clamp(2.2rem, 3.5vw, 4.2rem)',
                    fontWeight: '900',
                    lineHeight: '1.1',
                    color: '#f37121',
                  }}>פישינג!</span>
              </div>
              <div style={{ height: '3px', background: '#001a4d', borderRadius: '2px', marginTop: '6px', opacity: 0.9 }} />
              </div>
            </div>
            {/* Info Section - All plain text */}
            <div style={{ width: '100%', marginBottom: '10px', fontFamily: 'FbPractica, Arial, sans-serif', fontSize: 'clamp(0.92rem, 1.15vw, 1.25rem)', color: '#374151', textAlign: 'right', lineHeight: '1.6' }}>
              <strong>מה זה פישינג?</strong>
              <br />
              פישינג הוא ניסיון הונאה שבו גורמים עוינים מתחזים לגוף מוכר במטרה לגנוב פרטים אישיים או לבצע פעולה זדונית.
              <br />
              לדוגמא, גורמים המתחזים למפעילי כבישי אגרה מבצעים פניות באופן יזום באמצעים שונים כגון הודעות SMS ודוא&quot;ל הדורשים מהנמען לשלם חוב או למסור פרטים אישיים.
              <br />
              <strong>הטיפ שלנו:</strong>
              <br />
              הימנעו מלחיצה על קישורים חשודים או ממסירת פרטים בעקבות מסרונים, דוא&quot;ל או שיחות טלפון<br />שאינכם בטוחים במקורם. במקרה של ספק, מומלץ לאמת את תוכן הפניה ישירות מול מפעיל הכביש הרלוונטי.
              <br />
              לנוחותכם, מצורפים קישורים לאתרים הרשמיים של מפעילי כבישי האגרה:
            </div>


            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', width: '100%', direction: 'rtl', flexWrap: 'wrap' }}>

              {/* דרך ארץ */}
              <a href="https://service.kvish6.co.il/#/website/customer-area/registration?x=1&Button=Strip" target="_blank" rel="noopener noreferrer"
                style={{ flex: '1 1 0', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: 'white', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', textDecoration: 'none', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,82,204,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px' }}>
                  <img src="https://storage.googleapis.com/hotze_landing_page/Derech-Eretz-Logo.png" alt="דרך ארץ" style={{ height: '44px', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)', color: 'white', textAlign: 'center', padding: '8px 12px', fontFamily: 'FbPractica, Arial, sans-serif', fontWeight: '700', fontSize: 'clamp(12px, 1.1vw, 15px)' }}>דרך ארץ (כביש 6)</div>
              </a>

              {/* חוצה צפון 6 */}
              <a href="https://6cn.co.il/register" target="_blank" rel="noopener noreferrer"
                style={{ flex: '1 1 0', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: 'white', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', textDecoration: 'none', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,82,204,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 12px' }}>
                  <img src="https://storage.googleapis.com/hotze_landing_page/LogoHozteZafon6.png" alt="חוצה צפון 6" style={{ height: '44px', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)', color: 'white', textAlign: 'center', padding: '8px 12px', fontFamily: 'FbPractica, Arial, sans-serif', fontWeight: '700', fontSize: 'clamp(12px, 1.1vw, 15px)' }}>6 חוצה צפון</div>
              </a>

              {/* מנהרות הכרמל */}
              <a href="https://www.carmeltunnels.co.il/" target="_blank" rel="noopener noreferrer"
                style={{ flex: '1 1 0', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: 'white', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', textDecoration: 'none', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,82,204,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px' }}>
                  <img src="/carmel_tunnels_logo.png" alt="מנהרות הכרמל" style={{ height: '44px', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)', color: 'white', textAlign: 'center', padding: '8px 12px', fontFamily: 'FbPractica, Arial, sans-serif', fontWeight: '700', fontSize: 'clamp(12px, 1.1vw, 15px)' }}>מנהרות הכרמל</div>
              </a>

              {/* הנתיב המהיר */}
              <a href="https://fastlane.co.il/" target="_blank" rel="noopener noreferrer"
                style={{ flex: '1 1 0', minWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', background: 'white', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', textDecoration: 'none', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,82,204,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 12px' }}>
                  <img src="/the_fast_lane_logo.png" alt="הנתיב המהיר" style={{ height: '40px', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)', color: 'white', textAlign: 'center', padding: '8px 12px', fontFamily: 'FbPractica, Arial, sans-serif', fontWeight: '700', fontSize: 'clamp(12px, 1.1vw, 15px)' }}>הנתיב המהיר</div>
              </a>

            </div>

            {/* Phishing stripe */}
            <div style={{
              width: '100%', marginTop: '20px', borderRadius: '16px',
              background: 'linear-gradient(90deg, #000a1a 0%, #000a1a 65%, #002d7a 100%)',
              display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', direction: 'ltr',
              minHeight: '100px'
            }}>
              {/* Message photos */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 'clamp(28px, 3.6vw, 44px)', padding: '20px 24px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src="/message_cut_crop.png" alt="הודעת פישינג" style={{ height: 'clamp(90px, 10vw, 140px)', display: 'block', borderRadius: '8px 8px 0 0' }} />
                  <img src="/fishing_stamp_WITH_WHITE.png" alt="חותמת פישינג" style={{ position: 'absolute', top: '-12px', left: '-12px', height: 'clamp(46px, 4.8vw, 68px)', transform: 'rotate(-15deg)' }} />
                </div>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src="/message_cut3_crop.png" alt="הודעת פישינג" style={{ height: 'clamp(90px, 10vw, 140px)', display: 'block', borderRadius: '8px 8px 0 0' }} />
                  <img src="/fishing_stamp_WITH_WHITE.png" alt="חותמת פישינג" style={{ position: 'absolute', top: '-12px', left: '-12px', height: 'clamp(46px, 4.8vw, 68px)', transform: 'rotate(-15deg)' }} />
                </div>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src="/message_cut2_crop.png" alt="הודעת פישינג" style={{ height: 'clamp(90px, 10vw, 140px)', display: 'block', borderRadius: '8px 8px 0 0' }} />
                  <img src="/fishing_stamp_WITH_WHITE.png" alt="חותמת פישינג" style={{ position: 'absolute', top: '-12px', left: '-12px', height: 'clamp(46px, 4.8vw, 68px)', transform: 'rotate(-15deg)' }} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>}

    </main>
      {/* Footer stripe */}
      <div style={{
        width: '100%', background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 100%)',
        padding: '16px 32px', textAlign: 'center', direction: 'rtl',
        fontFamily: 'FbPractica, Arial, sans-serif', fontSize: 'clamp(14px, 1.4vw, 18px)',
        color: 'rgba(255,255,255,0.75)', lineHeight: '1.6',
      }}>
        חברת חוצה ישראל, הרשות הממונה על זכייני כבישי האגרה, מפרסמת מידע זה כשירות לציבור במטרה להגביר את המודעות לסיכוני התחזות ולצמצם את הסיכון למסירת מידע אישי או פרטי תשלום לגורמים מתחזים.
      </div>
    </div>
  );
}
