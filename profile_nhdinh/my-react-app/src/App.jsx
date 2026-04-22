import { useCallback, useEffect, useRef, useState } from "react";

function Snowflake({ id, onDone }) {
  const [style] = useState(() => ({
    position: "fixed",
    top: "-10px",
    left: Math.random() * window.innerWidth + "px",
    color: "#ffffff",
    fontSize: Math.random() * 10 + 10 + "px",
    opacity: Math.random() * 0.6 + 0.4,
    textShadow:
      "0 0 5px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.6), 0 0 20px rgba(93,173,226,0.8)",
    zIndex: 1000,
    pointerEvents: "none",
    animation: `fall ${Math.random() * 3 + 5}s linear forwards`,
  }));
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 8000);
    return () => clearTimeout(t);
  }, [id, onDone]);

  return <div style={style}>❄</div>;
}

// ── EnterScreen component ────────────────────────────────────────────────────
function EnterScreen({ onEnter }) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    setTimeout(onEnter, 800);
  };

  return (
    <div
      onClick={handleClick}
      className={`enter-screen${animating ? " entering" : ""}`}
    >
      <div className="enter-box">
        <h1>Click to Enter</h1>
      </div>
    </div>
  );
}

// ── MusicPlayer component ────────────────────────────────────────────────────
function MusicPlayer({ shouldPlay }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("0:00");

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ▶ Play sau khi user click Enter
  useEffect(() => {
    if (shouldPlay && playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.playVideo();
    }
  }, [shouldPlay]);

  // ▶ Init YouTube Player (chỉ chạy 1 lần)
  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted || playerRef.current) return;

      playerRef.current = new window.YT.Player("youtube-player", {
        height: "0",
        width: "0",
        videoId: "zloQza64-sM",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (e) => {
            const dur = e.target.getDuration();
            setTotalTime(formatTime(dur));

            intervalRef.current = setInterval(() => {
              if (!playerRef.current) return;

              const cur = playerRef.current.getCurrentTime();
              const dur = playerRef.current.getDuration();

              if (dur > 0) {
                setProgress((cur / dur) * 100);
                setCurrentTime(formatTime(cur));
              }
            }, 300);
          },

          onStateChange: (e) => {
            switch (e.data) {
              case window.YT.PlayerState.PLAYING:
                setIsPlaying(true);
                break;
              case window.YT.PlayerState.PAUSED:
                setIsPlaying(false);
                break;
              case window.YT.PlayerState.ENDED:
                setIsPlaying(false);
                setProgress(0);
                break;
              default:
                break;
            }
          },
        },
      });
    };

    // Nếu API đã có
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      const old = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        old && old();
        initPlayer();
      };
    }

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // ▶ Play / Pause
  const togglePlay = () => {
    if (!playerRef.current) return;

    playerRef.current.unMute();

    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  // ▶ Seek
  const seek = (e) => {
    if (!playerRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;

    const dur = playerRef.current.getDuration();
    if (dur > 0) {
      playerRef.current.seekTo(pct * dur, true);
    }
  };

  return (
    <div className="music-player">
      <div id="youtube-player" style={{ display: "none" }} />

      <div className="player-header">
        <img
          src="https://i.ytimg.com/vi/zloQza64-sM/maxresdefault.jpg"
          alt="Song Cover"
          className="song-cover"
        />
        <div className="song-info">
          <h3>ANH ĐÃ KHÔNG BIẾT CÁCH YÊU EM</h3>
          <p>YouTube Music</p>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-bar" onClick={seek}>
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>

        <div className="time-info">
          <span>{currentTime}</span>
          <span>{totalTime}</span>
        </div>
      </div>

      <div className="controls">
        <button className="control-btn">
          <i className="fas fa-step-backward" />
        </button>

        <button className="control-btn play" onClick={togglePlay}>
          <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
        </button>

        <button className="control-btn">
          <i className="fas fa-step-forward" />
        </button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [entered, setEntered] = useState(false);
  const [snowflakes, setSnowflakes] = useState([]);
  const snowIdRef = useRef(0);

  // Spawn snowflakes
  useEffect(() => {
    const interval = setInterval(() => {
      const id = snowIdRef.current++;
      setSnowflakes((prev) => [...prev, id]);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const removeSnowflake = useCallback((id) => {
    setSnowflakes((prev) => prev.filter((s) => s !== id));
  }, []);

  return (
    <>
      {/* Global keyframes injected once */}
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-x: hidden;
          background: linear-gradient(135deg, #e3f2fd 0%, #f1f8ff 100%);
          color: #2c3e50;
        }

        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes enterZoom {
          0%   { transform: scale(1)   rotateX(0deg);  opacity: 1; }
          50%  { transform: scale(1.1) rotateX(10deg); opacity: 0.7; }
          100% { transform: scale(1.4) rotateX(25deg); opacity: 0; }
        }
        @keyframes avatar3D {
          0%,100% { transform: translateY(0px)   scale(1);    box-shadow: 0 0 0 5px rgba(93,173,226,.4),0 0 0 10px rgba(52,152,219,.3),0 0 0 15px rgba(41,128,185,.2),0 0 50px rgba(93,173,226,.7),0 0 100px rgba(93,173,226,.4),0 15px 50px rgba(0,0,0,.15),inset 0 0 25px rgba(93,173,226,.2); }
          50%      { transform: translateY(-12px) scale(1.08); box-shadow: 0 0 0 6px rgba(93,173,226,.5),0 0 0 12px rgba(52,152,219,.4),0 0 0 18px rgba(41,128,185,.3),0 0 60px rgba(93,173,226,.9),0 0 120px rgba(93,173,226,.6),0 25px 80px rgba(0,0,0,.2),inset 0 0 30px rgba(93,173,226,.3); }
        }
        @keyframes haloFloat {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(-5px); }
        }
        @keyframes wingFlap {
          0%,100% { transform: translateY(-50%) scale(1); }
          50%      { transform: translateY(-50%) scale(1.1); }
        }
        @keyframes sparkle {
          0%,100% { opacity: 0; transform: scale(.3) rotate(0deg); }
          50%      { opacity: 1; transform: scale(1.3) rotate(180deg); }
        }
        @keyframes text3D {
          0%,100% {
            transform: translateY(0px) rotateX(0deg);
            text-shadow: 1px 1px 0 #4a8fcc,2px 2px 0 #3a7eb8,3px 3px 0 #2e6da8,4px 4px 0 #1f5293,5px 5px 20px rgba(0,0,0,.15),0 0 40px rgba(93,173,226,.7),0 0 80px rgba(93,173,226,.4);
          }
          50% {
            transform: translateY(-10px) rotateX(2deg);
            text-shadow: 1px 2px 0 #4a8fcc,2px 4px 0 #3a7eb8,3px 6px 0 #2e6da8,4px 8px 0 #1f5293,5px 10px 25px rgba(0,0,0,.2),0 0 50px rgba(93,173,226,.9),0 0 100px rgba(93,173,226,.5);
          }
        }

        /* Enter screen */
        .enter-screen {
          position: fixed; top:0; left:0; width:100%; height:100%;
          background: #000; display:flex; justify-content:center; align-items:center;
          z-index: 9999; cursor: pointer;
        }
        .enter-screen.entering { animation: enterZoom .8s ease forwards; }
        .enter-box {
          text-align:center; color:white; font-size:24px;
          animation: fadeIn 1s ease;
          transition: transform .3s ease;
        }
        .enter-box:hover { transform: rotateY(10deg) rotateX(5deg) scale(1.05); }

        /* Layout */
        .background {
          position:fixed; top:0; left:0; width:100%; height:100%;
          background: url('https://i.pinimg.com/1200x/bc/87/75/bc8775e0d865b16ed58d26a5bf08c23e.jpg') center/cover no-repeat;
          z-index:-2;
        }
        .background::before {
          content:''; position:absolute; width:100%; height:100%;
          background: linear-gradient(135deg,rgba(227,242,253,.5) 0%,rgba(241,248,255,.4) 100%);
        }
        .overlay {
          position:fixed; top:0; left:0; width:100%; height:100%;
          background: radial-gradient(circle at center,transparent 0%,rgba(52,152,219,.2));
          z-index:-1;
        }
        .container {
          position:relative; min-height:100vh;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:40px 20px; z-index:1;
        }

        /* Avatar */
        .avatar-section { text-align:center; margin-bottom:30px; }
        .avatar-wrapper {
          position:relative; display:inline-block; margin-bottom:20px;
          perspective:1000px; transform-style:preserve-3d;
        }
        .avatar {
          width:140px; height:140px; border-radius:50%;
          border:5px solid #5dade2; object-fit:cover;
          animation: avatar3D 5s ease-in-out infinite;
          transform-style:preserve-3d; position:relative;
        }
        .halo {
          position:absolute; top:-35px; left:50%; transform:translateX(-50%);
          width:90px; height:18px; border:2.5px solid rgba(255,215,0,.7);
          border-radius:50%; box-shadow:0 0 25px rgba(255,215,0,.6);
          animation: haloFloat 3s ease-in-out infinite;
        }
        .wings {
          position:absolute; top:50%; transform:translateY(-50%); font-size:35px;
          filter:drop-shadow(0 0 10px rgba(255,255,255,.6));
        }
        .wing-left  { left:-45px;  animation: wingFlap 2s ease-in-out infinite; }
        .wing-right { right:-45px; animation: wingFlap 2s ease-in-out infinite; animation-delay:.1s; }
        .sparkles {
          position:absolute; font-size:18px; color:#5dade2;
          filter:drop-shadow(0 0 8px rgba(93,173,226,.6));
          animation: sparkle 2s ease-in-out infinite;
        }
        .sparkle-1 { top:5px;  right:5px;  animation-delay:0s; }
        .sparkle-2 { bottom:5px; left:5px; animation-delay:.7s; }
        .sparkle-3 { top:50%; right:-25px; animation-delay:1.4s; }
        .username {
          font-size:62px; font-weight:700; color:#5dade2; letter-spacing:3px; margin-bottom:25px;
          animation: text3D 6s ease-in-out infinite; transform-style:preserve-3d; perspective:1000px;
        }

        /* Status box */
        .status-box {
          background:rgba(255,255,255,.85); backdrop-filter:blur(20px);
          border:2px solid rgba(93,173,226,.6); border-radius:25px;
          padding:18px 30px; display:inline-flex; align-items:center; gap:15px;
          margin-bottom:45px;
          box-shadow:0 12px 40px rgba(0,0,0,.15),0 0 30px rgba(93,173,226,.3);
        }
        .status-avatar {
          width:40px; height:40px; border-radius:50%;
          border:2px solid #5dade2; box-shadow:0 0 15px rgba(93,173,226,.3);
        }
        .status-name { font-size:14px; font-weight:600; color:#2c3e50; display:flex; align-items:center; gap:5px; }
        .verified { color:#5dade2; font-size:12px; }
        .status-time { font-size:12px; color:#7f8c8d; }

        /* Social */
        .social-section { display:flex; gap:20px; margin-bottom:40px; flex-wrap:wrap; justify-content:center; }
        .social-icon {
          width:60px; height:60px; background:rgba(255,255,255,.6); backdrop-filter:blur(10px);
          border:1px solid rgba(93,173,226,.2); border-radius:15px;
          display:flex; align-items:center; justify-content:center;
          font-size:24px; color:#5dade2; transition:all .3s ease;
          cursor:pointer; text-decoration:none;
        }
        .social-icon:hover {
          background:rgba(93,173,226,.2); border-color:#5dade2;
          transform:translateY(-5px); box-shadow:0 10px 30px rgba(93,173,226,.2);
        }

        /* Music player */
        .music-player {
          background:rgba(255,255,255,.9); backdrop-filter:blur(30px);
          border:2px solid rgba(93,173,226,.5); border-radius:30px;
          padding:30px; width:100%; max-width:450px;
          box-shadow:0 20px 60px rgba(0,0,0,.18),0 0 40px rgba(93,173,226,.25);
        }
        .player-header { display:flex; align-items:center; gap:15px; margin-bottom:20px; }
        .song-cover { width:60px; height:60px; border-radius:12px; object-fit:cover; border:2px solid #5dade2; }
        .song-info h3 { font-size:18px; font-weight:600; color:#2c3e50; margin-bottom:5px; }
        .song-info p  { font-size:14px; color:#7f8c8d; }
        .progress-container { margin-bottom:20px; }
        .progress-bar { width:100%; height:6px; background:rgba(93,173,226,.15); border-radius:10px; overflow:hidden; margin-bottom:8px; cursor:pointer; }
        .progress { height:100%; background:linear-gradient(90deg,#5dade2,#3498db); border-radius:10px; box-shadow:0 0 10px rgba(93,173,226,.4); transition:width .3s ease; }
        .time-info { display:flex; justify-content:space-between; font-size:12px; color:#7f8c8d; }
        .controls { display:flex; justify-content:center; align-items:center; gap:25px; }
        .control-btn { background:none; border:none; color:#5dade2; font-size:20px; cursor:pointer; transition:all .3s ease; padding:10px; }
        .control-btn:hover { color:#3498db; transform:scale(1.1); }
        .control-btn.play {
          font-size:32px; width:55px; height:55px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 0 20px rgba(93,173,226,.5),0 8px 25px rgba(0,0,0,.2);
        }
        .control-btn.play:hover { box-shadow:0 0 30px rgba(93,173,226,.8),0 12px 35px rgba(0,0,0,.25); }

        @media (max-width:768px) {
          .username { font-size:32px; }
          .avatar   { width:120px; height:120px; }
          .wings    { font-size:30px; }
          .wing-left  { left:-40px; }
          .wing-right { right:-40px; }
        }
      `}</style>

      {/* Snowflakes */}
      {snowflakes.map((id) => (
        <Snowflake key={id} id={id} onDone={removeSnowflake} />
      ))}

      {/* Enter screen */}
      {!entered && <EnterScreen onEnter={() => setEntered(true)} />}

      {/* Background layers */}
      <div className="background" />
      <div className="overlay" />

      {/* Main content */}
      <div className="container">
        {/* Avatar */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <div className="halo" />
            <span className="wings wing-left">🕊️</span>
            <img
              src="https://scontent.fsgn2-9.fna.fbcdn.net/v/t39.30808-6/642791975_1244247904509826_1166272802171148123_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeEdkQg3JlcZTphHqzYphjAaucuEUnhZF6W5y4RSeFkXpeEe9gziE9sp5oVL97XeJbVDi0CaZcblhhp8RXx_M5PC&_nc_ohc=dOYhvdvIIkkQ7kNvwEavuIK&_nc_oc=AdpCi3tAR_2UmuP01GhzJP0rt-n-Q0rMEIwwfNMhN3z_gUVPOMndP7REMcRCELAQ74GN2PHZZXaR8V0UPaJjTzM4&_nc_zt=23&_nc_ht=scontent.fsgn2-9.fna&_nc_gid=tEiYwnos40I1tPJiZjx4aw&_nc_ss=7a3a8&oh=00_Af3m_cff0-RWQvP9j_0276hKEUtjZNPrzvVAa_B-Sq4oKg&oe=69EEB4E2"
              alt="Avatar"
              className="avatar"
            />
            <span className="wings wing-right">🕊️</span>
            <span className="sparkles sparkle-1">✨</span>
            <span className="sparkles sparkle-2">✨</span>
            <span className="sparkles sparkle-3">✨</span>
          </div>
          <h1 className="username">nhdinh</h1>
        </div>

        {/* Status box */}
        <div className="status-box">
          <img
            src="https://scontent.fsgn2-9.fna.fbcdn.net/v/t39.30808-6/642791975_1244247904509826_1166272802171148123_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeEdkQg3JlcZTphHqzYphjAaucuEUnhZF6W5y4RSeFkXpeEe9gziE9sp5oVL97XeJbVDi0CaZcblhhp8RXx_M5PC&_nc_ohc=dOYhvdvIIkkQ7kNvwEavuIK&_nc_oc=AdpCi3tAR_2UmuP01GhzJP0rt-n-Q0rMEIwwfNMhN3z_gUVPOMndP7REMcRCELAQ74GN2PHZZXaR8V0UPaJjTzM4&_nc_zt=23&_nc_ht=scontent.fsgn2-9.fna&_nc_gid=tEiYwnos40I1tPJiZjx4aw&_nc_ss=7a3a8&oh=00_Af3m_cff0-RWQvP9j_0276hKEUtjZNPrzvVAa_B-Sq4oKg&oe=69EEB4E2"
            alt="Status Avatar"
            className="status-avatar"
          />
          <div className="status-info">
            <div className="status-name">
              Nguyễn Hoàng Dinh
              <i className="fas fa-check-circle verified" />
            </div>
            <div className="status-time">last seen 1 minutes ago</div>
          </div>
        </div>

        {/* Social icons */}
        <div className="social-section">
          {[
            // {
            //   href: "https://www.youtube.com/@nhdinh.dev03",
            //   icon: "fab fa-youtube",
            //   title: "YouTube",
            // },
            {
              href: "https://discord.gg/hU39VSy5Bp",
              icon: "fab fa-discord",
              title: "Discord",
            },
            {
              href: "https://www.instagram.com/nhdinh.dev",
              icon: "fab fa-instagram",
              title: "Instagram",
            },
            {
              href: "https://github.com/nhdinhdev03",
              icon: "fab fa-github",
              title: "GitHub",
            },
          ].map(({ href, icon, title }) => (
            <a
              key={title}
              href={href}
              className="social-icon"
              title={title}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className={icon} />
            </a>
          ))}
        </div>

        {/* Music player */}
        <MusicPlayer shouldPlay={entered} />
      </div>
    </>
  );
}
