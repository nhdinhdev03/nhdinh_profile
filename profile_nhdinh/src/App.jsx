import { memo, useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

// Mobile detection utility
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

const Snowflake = memo(function Snowflake({ id, onDone }) {
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
});

const EnterScreen = memo(function EnterScreen({ onEnter, onPlayMusic }) {
  const [animating, setAnimating] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback(
    (e) => {
      if (animating) return;

      setAnimating(true);

      // Play music first (user gesture for mobile autoplay)
      onPlayMusic && onPlayMusic();

      const rect = e.currentTarget.getBoundingClientRect();
      const ripple = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        id: Date.now(),
      };

      setRipples((prev) => [...prev, ripple]);

      setTimeout(() => onEnter(), 900);
    },
    [animating, onEnter, onPlayMusic],
  );

  return (
    <div
      onClick={handleClick}
      className={`enter-screen ${animating ? "entering" : ""}`}
    >
      <div className="enter-glow" />

      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />
      ))}

      <div className="enter-box">
        <div className="enter-title">✨ Click to Enter ✨</div>
        <div className="enter-subtitle">Welcome to my profile</div>
      </div>
    </div>
  );
});

const MusicPlayer = memo(function MusicPlayer({
  shouldPlay,
  playImmediately,
  isMobile,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("0:00");
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const playImmediatelyRef = useRef(false);

  const formatTime = useCallback((sec) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  // Handle immediate play when user clicks - ensure player is ready first
  useEffect(() => {
    if (playImmediately) {
      playImmediatelyRef.current = true;
      if (playerReady && playerRef.current) {
        try {
          playerRef.current.unMute();
          playerRef.current.playVideo();
        } catch (e) {
          console.log("Play error:", e);
        }
      }
    }
  }, [playImmediately, playerReady]);

  // Handle auto-play only on desktop after entering
  useEffect(() => {
    if (
      shouldPlay &&
      playerRef.current &&
      !isMobile &&
      !playImmediately &&
      playerReady
    ) {
      try {
        playerRef.current.unMute();
        playerRef.current.playVideo();
      } catch (e) {
        console.log("Play error:", e);
      }
    }
  }, [shouldPlay, isMobile, playImmediately, playerReady]);

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
            setPlayerReady(true);

            // If play was requested before player was ready, play now
            if (playImmediatelyRef.current) {
              try {
                e.target.unMute();
                e.target.playVideo();
              } catch (err) {
                console.log("Auto play error:", err);
              }
            }

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
  }, [formatTime]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;

    playerRef.current.unMute();

    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [isPlaying]);

  const seek = useCallback((e) => {
    if (!playerRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;

    const dur = playerRef.current.getDuration();
    if (dur > 0) {
      playerRef.current.seekTo(pct * dur, true);
    }
  }, []);

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
          <p>🎵 YouTube Music</p>
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
});

const AvatarSection = memo(function AvatarSection() {
  const avatarUrl =
    "https://scontent.fvca3-1.fna.fbcdn.net/v/t39.30808-6/642791975_1244247904509826_1166272802171148123_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=0-6uULu-uscQ7kNvwF635Aj&_nc_oc=AdoAdy0SpFhtxnQXZ9nH-g_D-0c0jqFuk5zrfDnPMiGaU0S5dVuoLvHTWRf47wuzPivTd1QqPfoscMLAKFVXAEpY&_nc_zt=23&_nc_ht=scontent.fvca3-1.fna&_nc_gid=A96zyWuzc2gxPQJnOFN41Q&_nc_ss=7b2a8&oh=00_Af0ewJwHc3RBDqbJTSB9XY2sGVuecPw58K4_Xhmcl4H6hQ&oe=69F908A2";

  return (
    <div className="avatar-section">
      <div className="avatar-wrapper">
        <div className="halo" />
        <span className="wings wing-left">🕊️</span>
        <img src={avatarUrl} alt="Avatar" className="avatar" />
        <span className="wings wing-right">🕊️</span>
        <span className="sparkles sparkle-1">✨</span>
        <span className="sparkles sparkle-2">✨</span>
        <span className="sparkles sparkle-3">✨</span>
      </div>
      <h1 className="username">nhdinh</h1>
    </div>
  );
});

const StatusBox = memo(function StatusBox() {
  const avatarUrl =
    "https://scontent.fvca3-1.fna.fbcdn.net/v/t39.30808-6/642791975_1244247904509826_1166272802171148123_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=0-6uULu-uscQ7kNvwF635Aj&_nc_oc=AdoAdy0SpFhtxnQXZ9nH-g_D-0c0jqFuk5zrfDnPMiGaU0S5dVuoLvHTWRf47wuzPivTd1QqPfoscMLAKFVXAEpY&_nc_zt=23&_nc_ht=scontent.fvca3-1.fna&_nc_gid=A96zyWuzc2gxPQJnOFN41Q&_nc_ss=7b2a8&oh=00_Af0ewJwHc3RBDqbJTSB9XY2sGVuecPw58K4_Xhmcl4H6hQ&oe=69F908A2";

  return (
    <div className="status-box">
      <div className="status-avatar-wrapper">
        <img src={avatarUrl} alt="Status Avatar" className="status-avatar" />
        <div className="status-pulse" />
      </div>
      <div className="status-info">
        <div className="status-name">
          Nguyễn Hoàng Dinh
          <i className="fas fa-check-circle verified" />
        </div>
        <div className="status-time">🟢 Online now</div>
      </div>
    </div>
  );
});

const SocialLinks = memo(function SocialLinks() {
  const links = [
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
  ];

  return (
    <div className="social-section">
      {links.map(({ href, icon, title }) => (
        <a
          key={title}
          href={href}
          className="social-icon"
          title={title}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className={icon} />
          <span className="tooltip">{title}</span>
        </a>
      ))}
    </div>
  );
});

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [entered, setEntered] = useState(false);
  const [snowflakes, setSnowflakes] = useState([]);
  const [playMusic, setPlayMusic] = useState(false);
  const [isMobile] = useState(isMobileDevice());
  const snowIdRef = useRef(0);

  // Spawn snowflakes
  useEffect(() => {
    const interval = setInterval(() => {
      const id = snowIdRef.current++;
      setSnowflakes((prev) => [...prev, id]);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const removeSnowflake = useCallback((id) => {
    setSnowflakes((prev) => prev.filter((s) => s !== id));
  }, []);

  const handleEnter = useCallback(() => {
    setEntered(true);
  }, []);

  const handlePlayMusic = useCallback(() => {
    setPlayMusic(true);
  }, []);

  return (
    <>
      {/* Snowflakes */}
      {snowflakes.map((id) => (
        <Snowflake key={id} id={id} onDone={removeSnowflake} />
      ))}

      {/* Enter screen */}
      {!entered && (
        <EnterScreen onEnter={handleEnter} onPlayMusic={handlePlayMusic} />
      )}

      {/* Background layers */}
      <div className="background" />
      <div className="overlay" />

      {/* Main content */}
      <div className="container">
        <AvatarSection />
        <StatusBox />
        <SocialLinks />
        <MusicPlayer
          shouldPlay={entered}
          playImmediately={playMusic}
          isMobile={isMobile}
        />
      </div>
    </>
  );
}
