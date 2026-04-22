const enterScreen = document.getElementById("enter-screen");

enterScreen.addEventListener("click", () => {
  if (player) {
    player.unMute();
    player.playVideo();
  }

  // thêm class để chạy animation
  enterScreen.classList.add("entering");
  document.body.classList.add("enter-active");

  // xoá sau khi animation xong
  setTimeout(() => {
    enterScreen.remove();
    document.body.classList.remove("enter-active");
  }, 800);
});
// Snow Effect
function createSnowflake() {
  const snowflake = document.createElement("div");
  snowflake.classList.add("snowflake");
  snowflake.innerHTML = "❄";
  snowflake.style.left = Math.random() * window.innerWidth + "px";
  snowflake.style.animationDuration = Math.random() * 3 + 5 + "s";
  snowflake.style.opacity = Math.random() * 0.6 + 0.4;
  snowflake.style.fontSize = Math.random() * 10 + 10 + "px";
  document.body.appendChild(snowflake);

  setTimeout(() => {
    snowflake.remove();
  }, 8000);
}

setInterval(createSnowflake, 200);

// YouTube Player Setup
let player;
let isPlaying = false;
const playBtn = document.querySelector(".control-btn.play");
const progressBar = document.querySelector(".progress");
const progressBarContainer = document.querySelector(".progress-bar");
const currentTimeEl = document.querySelector(".current-time");
const totalTimeEl = document.querySelector(".total-time");

// Format time helper
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Initialize YouTube Player
function onYouTubeIframeAPIReady() {
  player = new YT.Player("youtube-player", {
    height: "0",
    width: "0",
    videoId: "zloQza64-sM",
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerReady(event) {
  const duration = player.getDuration();
  totalTimeEl.textContent = formatTime(duration);

  // Set playing state and update icon for autoplay
  // isPlaying = true;
  isPlaying = false;
  const icon = playBtn.querySelector("i");
  icon.classList.remove("fa-pause");
  icon.classList.add("fa-play");

  // Update progress bar
  setInterval(() => {
    if (player && player.getCurrentTime) {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      const percentage = (currentTime / duration) * 100;
      progressBar.style.width = percentage + "%";
      currentTimeEl.textContent = formatTime(currentTime);
    }
  }, 100);
}

function onPlayerStateChange(event) {
  const icon = playBtn.querySelector("i");

  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  }

  if (event.data === YT.PlayerState.PAUSED) {
    isPlaying = false;
    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");
  }

  if (event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");
    progressBar.style.width = "0%";
  }
}

// Play/Pause toggle
playBtn.addEventListener("click", () => {
  if (!player) return;

  if (isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
  isPlaying = !isPlaying;
  player.unMute(); // BẮT BUỘC

  const icon = playBtn.querySelector("i");
  icon.classList.toggle("fa-play");
  icon.classList.toggle("fa-pause");
});

// Progress bar click to seek
progressBarContainer.addEventListener("click", (e) => {
  if (!player) return;

  const bar = e.currentTarget;
  const clickX = e.offsetX;
  const width = bar.offsetWidth;
  const percentage = clickX / width;
  const duration = player.getDuration();
  player.seekTo(percentage * duration, true);
});
