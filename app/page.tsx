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
    <main style={{ background: '#f0f4f8' }} className="min-h-screen flex flex-col relative overflow-hidden">
      <style>{arrowAnimation}</style>
      {/* Large dark blue circle — bleeds off left/top/bottom, clean round right edge */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '-24%' : '-45%',
        left: isMobile ? '-50%' : 'calc(-108% + 50px)',
        width: isMobile ? '120%' : '148%',
        height: isMobile ? '30%' : '185%',
        background: 'linear-gradient(135deg, #000a1a 0%, #001a4d 40%, #0052cc 100%)',
        borderRadius: '50%',
        zIndex: 0,
        boxShadow: '0 0 80px rgba(0,82,204,0.25)',
      }} />
      {/* Background image overlay */}
      <img
        src="/background-image.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.04, zIndex: 1 }}
      />
      {/* Header with Logo */}
      <header className="w-full px-8 py-6 flex items-center justify-between relative z-10" style={{ marginLeft: '40px' }}>
        <img
          src="https://storage.googleapis.com/hotze_landing_page/Logo%20%D7%9C%D7%95%D7%92%D7%95%20%D7%97%D7%93%D7%A9%20%D7%9C%D7%91%D7%9F.png"
          alt="Trans Israel Logo"
          className="h-10 w-auto"
          style={{ marginLeft: '-45px', marginTop: '-10px' }}
        />
        {/* Decorative Line Element - Top Right */}
        <img
          src="/TRANS_ISRAEL_ELEMENTS_LINES-11.png"
          alt="Decorative Line"
          className="m-deco-line pointer-events-none" style={{ width: '400px', height: 'auto', marginRight: '-120px', marginTop: '-40px' }}
        />
      </header>

      {/* ── MOBILE LAYOUT ── */}
      {isMobile && (
        <section className="flex-1 w-full flex flex-col relative z-10" dir="rtl">

          {/* Headline */}
          <div style={{ padding: '20px 20px 0', fontFamily: 'FbPractica, Arial, sans-serif', textAlign: 'right', marginBottom: '20px' }}>
            <p style={{ color: '#00103a', fontSize: '1.3rem', marginBottom: '0px' }}>נוסעים בכביש 6?</p>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '8px', marginTop: '-6px' }}>
              <span style={{ fontSize: '2.8rem', fontWeight: '900', lineHeight: '1.1', background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>עושים סדר</span>
              <span style={{ fontSize: '2.8rem', fontWeight: '900', lineHeight: '1.1', color: '#00103a', position: 'relative', display: 'inline-block' }}>
                בחיובים
                <div style={{ position: 'absolute', bottom: '-4px', left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', borderRadius: '5px' }} />
              </span>
            </div>
          </div>

          {/* Info Text */}
          <div style={{ padding: '0 20px 24px', fontFamily: 'FbPractica, Arial, sans-serif', fontSize: '1.1rem', color: '#374151', textAlign: 'right', lineHeight: '1.6' }}>
            אנו בחוצה ישראל&nbsp;–&nbsp;הרשות הממונה על זכייני כביש 6&nbsp;–&nbsp;פועלים שחוויית הנסיעה, האיכות והשירות עבור משתמשי הדרך יעמדו בסטנדרט הגבוה שעליו אנו מקפידים תמיד, ולכן חשוב לנו לעשות לכם סדר: איך משלמים, למי ואפילו איך תחסכו כסף?<br />
            כביש 6 מחולק למספר קטעים המנוהלים על ידי שני זכיינים שונים, כאשר הנסיעה בהם כרוכה בתשלום אגרה.<br />
            חברת &quot;<a href="https://www.kvish6.co.il/" target="_blank" rel="noopener noreferrer" style={{ color: '#006aff', fontWeight: '700', textDecoration: 'underline' }}>דרך ארץ</a>&quot; (הקטע המרכזי): ממחלף שורק ועד מחלף עין תות.<br />
            חברת &quot;<a href="https://6cn.co.il/" target="_blank" rel="noopener noreferrer" style={{ color: '#2e6373', fontWeight: '700', textDecoration: 'underline' }}>6 חוצה צפון</a>&quot; (הקטעים הצפוניים): ממחלף יוקנעם ועד מחלף סומך.<br />
            במידה וביצעתם נסיעה לאורך שני הקטעים, תשלום האגרה מתבצע מול כל זכיין בנפרד.<br />
            <strong>הטיפ שלנו:</strong> לשם היעילות וכן להוזלת אגרת הנסיעה, אנו ממליצים להסדיר מראש מנוי (ללא עלות) אצל כל אחד מהזכיינים.<br />
            אפשרות נוספת הינה היעזרות בשירותי אפליקציות תשלום שבאמצעותן ניתן להרשם לכלל כבישי האגרה - כיום מציעים הזכיינים אפשרות לתשלום באפליקציות <strong>פנגו וסלופארק</strong>.
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

          {/* CTA line */}
          <p style={{ textAlign: 'center', fontFamily: 'FbPractica, Arial, sans-serif', fontSize: '1rem', fontWeight: '600', color: '#374151', padding: '0 16px 20px' }}>
            <i className="fas fa-angle-double-down" style={{ color: '#00103a', marginLeft: '6px' }}></i>
            לחצו על הזכיין מטה לרישום מהיר וחינמי:
            <i className="fas fa-angle-double-down" style={{ color: '#00103a', marginRight: '6px' }}></i>
          </p>

          {/* Cards - stacked */}
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: '12px', direction: 'ltr' }}>
            {/* Card 2 - דרך ארץ (first on mobile) */}
            <div style={{ display: 'flex', flexDirection: 'row', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', height: '260px', width: '100%' }}>
              <div style={{ width: '40%', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://storage.googleapis.com/hotze_landing_page/MAP_DERECH_ERETZ.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: '#fff' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', padding: '10px 28px 10px 8px', fontFamily: 'FbPractica, Arial, sans-serif', gap: '4px', textAlign: 'right' }}>
                <div style={{ background: '#E8F2FF', color: '#00103a', borderRadius: '20px', padding: '2px 10px', fontSize: '15px', fontWeight: '500' }}>קטע מרכזי</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#00103a', lineHeight: '1.1' }}>דרך ארץ</div>
                <div style={{ fontSize: '16px', color: '#00103a' }}>שורק ↔ עין תות</div>
                <a href="https://service.kvish6.co.il/#/website/customer-area/registration?x=1&Button=Strip" target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', color: '#006aff', textDecoration: 'underline', fontWeight: '500' }}>לרישום כמנוי באתר הזכיין</a>
                <a href="tel:*6116" style={{ fontSize: '16px', color: '#00103a', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}><i className="fas fa-phone" style={{ fontSize: '10px' }}></i><span>*6116</span></a>
              </div>
            </div>
            {/* Card 1 - חוצה צפון 6 (second on mobile) */}
            <div style={{ display: 'flex', flexDirection: 'row', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', height: '260px', width: '100%' }}>
              <div style={{ width: '40%', flexShrink: 0, overflow: 'hidden', position: 'relative', backgroundColor: '#fff' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://storage.googleapis.com/hotze_landing_page/MAP_6_HOTZE.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', padding: '10px 28px 10px 8px', fontFamily: 'FbPractica, Arial, sans-serif', gap: '4px', textAlign: 'right' }}>
                <div style={{ background: '#E8F2FF', color: '#00103a', borderRadius: '20px', padding: '2px 10px', fontSize: '15px', fontWeight: '500' }}>קטעים צפוניים</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#00103a', lineHeight: '1.1', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: '4px' }}><span>חוצה צפון</span><span>6</span></div>
                <div style={{ fontSize: '16px', color: '#00103a' }}>יוקנעם ↔ סומך</div>
                <a href="https://6cn.co.il/register" target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', color: '#2e6373', textDecoration: 'underline', fontWeight: '500' }}>לרישום כמנוי באתר הזכיין</a>
                <a href="tel:*6102" style={{ fontSize: '16px', color: '#00103a', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}><i className="fas fa-phone" style={{ fontSize: '10px' }}></i><span>*6102</span></a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── DESKTOP LAYOUT (UNCHANGED) ── */}
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
              <p className="mb-2 font-normal" style={{ color: '#00103a', fontSize: 'clamp(1rem, 1.6vw, 1.5rem)', marginTop: '40px' }}>
                נוסעים בכביש 6?
              </p>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-start', gap: '10px', marginTop: '-10px' }}>
                <span style={{
                  fontSize: 'clamp(2.2rem, 3.5vw, 4.2rem)',
                  fontWeight: '900',
                  lineHeight: '1.1',
                  background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>עושים סדר</span>
                <span style={{
                  fontSize: 'clamp(2.2rem, 3.5vw, 4.2rem)',
                  fontWeight: '900',
                  lineHeight: '1.1',
                  color: '#00103a',
                  position: 'relative',
                  display: 'inline-block',
                }}>
                  בחיובים
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                    borderRadius: '5px',
                  }} />
                </span>
              </div>
            </div>
            {/* Info Section - All plain text */}
            <div style={{ width: '100%', marginBottom: '18px', fontFamily: 'FbPractica, Arial, sans-serif', fontSize: 'clamp(0.92rem, 1.15vw, 1.25rem)', color: '#374151', textAlign: 'right', lineHeight: '1.6' }}>
              אנו בחוצה ישראל - הרשות הממונה על זכייני כביש 6 - פועלים שחוויית הנסיעה, האיכות והשירות עבור משתמשי הדרך יעמדו בסטנדרט הגבוה שעליו אנו מקפידים תמיד, ולכן חשוב לנו לעשות לכם סדר: איך משלמים, למי ואפילו איך תחסכו כסף?
              <br />
              כביש 6 מחולק למספר קטעים המנוהלים על ידי שני זכיינים שונים, כאשר הנסיעה בהם כרוכה בתשלום אגרה.
              <br />
              חברת &quot;<a href="https://www.kvish6.co.il/" target="_blank" rel="noopener noreferrer" style={{ color: '#006aff', fontWeight: '700', textDecoration: 'underline' }}>דרך ארץ</a>&quot; (הקטע המרכזי): ממחלף שורק ועד מחלף עין תות.
              <br />
              חברת &quot;<a href="https://6cn.co.il/" target="_blank" rel="noopener noreferrer" style={{ color: '#2e6373', fontWeight: '700', textDecoration: 'underline' }}>6 חוצה צפון</a>&quot; (הקטעים הצפוניים): ממחלף יוקנעם ועד מחלף סומך.
              <br />
              במידה וביצעתם נסיעה לאורך שני הקטעים, תשלום האגרה מתבצע מול כל זכיין בנפרד.
              <br />
              <strong>הטיפ שלנו:</strong> לשם היעילות וכן להוזלת אגרת הנסיעה, אנו ממליצים להסדיר מראש מנוי (ללא עלות) אצל כל אחד מהזכיינים.
              <br />
              אפשרות נוספת הינה היעזרות בשירותי אפליקציות תשלום שבאמצעותן ניתן להרשם לכלל כבישי האגרה - כיום מציעים הזכיינים אפשרות לתשלום באפליקציות <strong>פנגו וסלופארק</strong>.
            </div>

            <p className="text-center mb-3" style={{ fontFamily: 'FbPractica, Arial, sans-serif', color: '#374151', fontSize: 'clamp(0.95rem, 1.2vw, 1.25rem)', fontWeight: '600', marginTop: '16px' }}>
              <i className="fas fa-angle-double-down" style={{ color: '#00103a', marginLeft: '6px' }}></i>לחצו על הזכיין מטה לרישום מהיר וחינמי:<i className="fas fa-angle-double-down" style={{ color: '#00103a', marginRight: '6px' }}></i>
            </p>

            {/* Cards */}
            <div className="m-cards-row" style={{ display: 'flex', flexDirection: 'row', gap: '16px', width: '100%', direction: 'ltr', alignItems: 'stretch' }}>

              {/* Card 1 - חוצה צפון 6 */}
              <div className="m-card-wrapper" style={{ display: 'flex', flex: 1, alignItems: 'stretch' }}>
                <div className="m-card-box"
                  style={{ display: 'flex', flexDirection: 'row', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', minHeight: 'clamp(180px, 20vw, 360px)', width: '100%', direction: 'ltr' }}
                >
                  {/* Map */}
                  <div ref={map1Ref} style={{ width: '48%', flexShrink: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer', backgroundColor: '#ffffff', minHeight: '100%' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://storage.googleapis.com/hotze_landing_page/MAP_6_HOTZE.jpg)', backgroundSize: 'cover', backgroundPosition: 'calc(50% + 40px) calc(50% - 60px)', backgroundRepeat: 'no-repeat', backgroundColor: '#ffffff' }} />
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-evenly', padding: 'clamp(10px, 1.2vw, 16px) clamp(12px, 3vw, 48px) clamp(10px, 1.2vw, 16px) clamp(8px, 1vw, 20px)', fontFamily: 'FbPractica, Arial, sans-serif', gap: 'clamp(3px, 0.5vw, 6px)', textAlign: 'right' }}>
                    <div style={{ background: '#E8F2FF', color: '#00103a', borderRadius: '20px', padding: '3px 12px', fontSize: 'clamp(11px, 1.1vw, 15px)', fontWeight: '500', display: 'inline-block' }}>קטעים צפוניים</div>
                    <div style={{ fontSize: 'clamp(16px, 2.5vw, 36px)', fontWeight: '900', color: '#00103a', lineHeight: '1.1', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: '6px' }}><span>חוצה צפון</span><span>6</span></div>
                    <div style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: '#00103a' }}>יוקנעם ↔ סומך</div>
                    <a href="https://6cn.co.il/register" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: '#2e6373', textDecoration: 'underline', fontWeight: '500', display: 'block' }}>לרישום כמנוי באתר הזכיין</a>
                    <div style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: '#00103a', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-start' }}>
                      <i className="fas fa-phone" style={{ fontSize: 'clamp(9px, 0.8vw, 11px)' }}></i><span>*6102</span>
                    </div>
                    <img src="https://storage.googleapis.com/hotze_landing_page/LogoHozteZafon6.png" alt="לוגו חוצה צפון 6" style={{ maxHeight: 'clamp(28px, 3.5vw, 55px)', maxWidth: '85px', objectFit: 'contain' }} />
                  </div>
                </div>
              </div>

              {/* Card 2 - דרך ארץ */}
              <div className="m-card-wrapper" style={{ display: 'flex', flex: 1, alignItems: 'stretch' }}>
                <div className="m-card-box"
                  style={{ display: 'flex', flexDirection: 'row', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', minHeight: 'clamp(180px, 20vw, 360px)', width: '100%', direction: 'ltr' }}
                >
                  {/* Map */}
                  <div ref={map2Ref} style={{ width: '48%', flexShrink: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer', minHeight: '100%' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://storage.googleapis.com/hotze_landing_page/MAP_DERECH_ERETZ.jpg)', backgroundSize: '160%', backgroundPosition: 'calc(50% + 60px) calc(42% + 7px)', backgroundRepeat: 'no-repeat', backgroundColor: '#ffffff' }} />
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-evenly', padding: 'clamp(10px, 1.2vw, 16px) clamp(12px, 3vw, 48px) clamp(10px, 1.2vw, 16px) clamp(8px, 1vw, 20px)', fontFamily: 'FbPractica, Arial, sans-serif', gap: 'clamp(3px, 0.5vw, 6px)', textAlign: 'right' }}>
                    <div style={{ background: '#E8F2FF', color: '#00103a', borderRadius: '20px', padding: '3px 12px', fontSize: 'clamp(11px, 1.1vw, 15px)', fontWeight: '500', display: 'inline-block' }}>קטע מרכזי</div>
                    <div style={{ fontSize: 'clamp(16px, 2.5vw, 36px)', fontWeight: '900', color: '#00103a', lineHeight: '1.1' }}>דרך ארץ</div>
                    <div style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: '#00103a' }}>שורק ↔ עין תות</div>
                    <a href="https://service.kvish6.co.il/#/website/customer-area/registration?x=1&Button=Strip" target="_blank" rel="noopener noreferrer" style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: '#006aff', textDecoration: 'underline', fontWeight: '500', display: 'block' }}>לרישום כמנוי באתר הזכיין</a>
                    <div style={{ fontSize: 'clamp(12px, 1.2vw, 16px)', color: '#00103a', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-start' }}>
                      <i className="fas fa-phone" style={{ fontSize: 'clamp(9px, 0.8vw, 11px)' }}></i><span>*6116</span>
                    </div>
                    <img src="https://storage.googleapis.com/hotze_landing_page/Derech-Eretz-Logo.png" alt="לוגו דרך ארץ" style={{ maxHeight: 'clamp(28px, 3.5vw, 55px)', maxWidth: '85px', objectFit: 'contain' }} />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>}

    </main>
  );
}
