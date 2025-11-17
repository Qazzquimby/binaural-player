let context;
let oscillator1, oscillator2;
let gainNode1, gainNode2;
let merger;
let isPlaying = false;

let totalSeconds = 30 * 60;
let totalElapsedSeconds = 0;
let sessionSegmentStartTime;

let currentEar = 'left';
let timerInterval;

const highTone = 120;
const lowTone = 80;

function setDuration(minutes, element) {
  totalSeconds = minutes * 60;
  updateTimerDisplay(totalSeconds);

  document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
}

function initAudioContext() {
  if (context) return true;

  const contextClass = (window.AudioContext ||
    window.webkitAudioContext ||
    window.mozAudioContext ||
    window.oAudioContext ||
    window.msAudioContext);

  if (contextClass) {
    context = new contextClass();
    return true;
  }
  return false;
}

function createBinauralBeats(freq1, freq2) {
  merger = context.createChannelMerger(2);

  oscillator1 = context.createOscillator();
  oscillator1.type = 'sine';
  oscillator1.frequency.value = freq1;

  gainNode1 = context.createGain();
  gainNode1.gain.value = 0.1;

  oscillator1.connect(gainNode1);
  gainNode1.connect(merger, 0, 0);

  oscillator2 = context.createOscillator();
  oscillator2.type = 'sine';
  oscillator2.frequency.value = freq2;

  gainNode2 = context.createGain();
  gainNode2.gain.value = 0.1;

  oscillator2.connect(gainNode2);
  gainNode2.connect(merger, 0, 1);

  merger.connect(context.destination);

  oscillator1.start();
  oscillator2.start();
}

function startSession() {
  if (!initAudioContext()) {
    document.getElementById('status').textContent = 'Audio not supported in this browser';
    return;
  }

  if (context.state === 'suspended') {
    context.resume();
  }

  const freq1 = (currentEar === 'left') ? highTone : lowTone;
  const freq2 = (currentEar === 'left') ? lowTone : highTone;
  createBinauralBeats(freq1, freq2);

  isPlaying = true;
  sessionSegmentStartTime = Date.now();

  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('durationContainer').style.display = 'none';
  document.getElementById('pauseBtn').style.display = 'inline-block';
  document.getElementById('status').textContent = 'Session in progress...';

  document.querySelectorAll('.duration-btn').forEach(btn => btn.disabled = true);

  timerInterval = setInterval(updateTimer, 1000);
  updateTimer();
}

function pauseSession() {
  if (oscillator1) oscillator1.stop();
  if (oscillator2) oscillator2.stop();

  clearInterval(timerInterval);
  isPlaying = false;

  const elapsedInSegment = (Date.now() - sessionSegmentStartTime) / 1000;
  totalElapsedSeconds += elapsedInSegment;

  document.getElementById('startBtn').style.display = 'inline-block';
  document.getElementById('pauseBtn').style.display = 'none';
  document.getElementById('status').textContent = 'Session paused';
}

function stopSession() {
  if (oscillator1) oscillator1.stop();
  if (oscillator2) oscillator2.stop();
  clearInterval(timerInterval);
  isPlaying = false;
  document.getElementById('status').textContent = 'Session completed!';
  document.getElementById('timer').textContent = 'Complete!';

  document.getElementById('startBtn').style.display = 'inline-block';
  document.getElementById('pauseBtn').style.display = 'none';
  document.querySelectorAll('.duration-btn').forEach(btn => btn.disabled = false);

  totalElapsedSeconds = 0;
  currentEar = 'left';
}

function updateTimer() {
  const elapsedInSegment = (Date.now() - sessionSegmentStartTime) / 1000;
  const currentTotalElapsed = Math.floor(totalElapsedSeconds + elapsedInSegment);
  let remainingSeconds = totalSeconds - currentTotalElapsed;

  if (remainingSeconds < 0) {
    remainingSeconds = 0;
  }

  updateTimerDisplay(remainingSeconds);

  const fifteenMinutesInSeconds = 15 * 60;
  const intervalsPassed = Math.floor(currentTotalElapsed / fifteenMinutesInSeconds);
  const newEar = (intervalsPassed % 2 === 0) ? 'left' : 'right';

  if (newEar !== currentEar) {
    currentEar = newEar;
    if (oscillator1 && oscillator2) {
      oscillator1.frequency.value = (currentEar === 'left') ? highTone : lowTone;
      oscillator2.frequency.value = (currentEar === 'left') ? lowTone : highTone;
    }
  }

  const progress = (currentTotalElapsed / totalSeconds) * 100;
  document.getElementById('progressFill').style.width = progress + '%';

  if (remainingSeconds <= 0) {
    stopSession();
  }
}

function updateTimerDisplay(secondsLeft) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  document.getElementById('timer').textContent =
    `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  updateTimerDisplay(totalSeconds);
  document.querySelector('.duration-btn').classList.add('active');
});
