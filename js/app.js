let context;
        let oscillator1, oscillator2;
        let gainNode1, gainNode2;
        let merger;
        let isPlaying = false;
        const totalDuration = 20; // 60 minutes in seconds
        let timeRemaining = totalDuration;
        let currentEar = 'left'; // Track which ear is active
        let timerInterval;
        let startTime;




        // Initialize audio context
        function initAudioContext() {
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
            // Create channel merger for stereo output
            merger = context.createChannelMerger(2);

            // Create first oscillator (left channel)
            oscillator1 = context.createOscillator();
            oscillator1.type = 'sine';
            oscillator1.frequency.value = freq1;

            gainNode1 = context.createGain();
            gainNode1.gain.value = 0.1;

            oscillator1.connect(gainNode1);
            gainNode1.connect(merger, 0, 0); // Connect to left channel

            // Create second oscillator (right channel)
            oscillator2 = context.createOscillator();
            oscillator2.type = 'sine';
            oscillator2.frequency.value = freq2;

            gainNode2 = context.createGain();
            gainNode2.gain.value = 0.1;

            oscillator2.connect(gainNode2);
            gainNode2.connect(merger, 0, 1); // Connect to right channel

            // Connect merger to destination
            merger.connect(context.destination);

            // Start oscillators
            oscillator1.start();
            oscillator2.start();
        }

        function startSession() {
            if (!initAudioContext()) {
                document.getElementById('status').textContent = 'Audio not supported in this browser';
                return;
            }

            // Resume audio context if suspended (required by some browsers)
            if (context.state === 'suspended') {
                context.resume();
            }

            // Stop any existing session
            if (isPlaying) {
                stopSession();
            }

            // Reset timer and ear
            currentEar = 'left';
            document.getElementById('currentEar').textContent = 'Left Ear Active';
            startTime = Date.now();

            // Create binaural beats
            createBinauralBeats(60, 20);

            isPlaying = true;
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('stopBtn').style.display = 'inline-block';
            document.getElementById('status').textContent = 'Session in progress...';

            // Start countdown timer
            timerInterval = setInterval(updateTimer, 1000);
        }

        function stopSession() {
            if (oscillator1) {
                oscillator1.stop();
                oscillator1.disconnect();
            }
            if (oscillator2) {
                oscillator2.stop();
                oscillator2.disconnect();
            }
            if (gainNode1) gainNode1.disconnect();
            if (gainNode2) gainNode2.disconnect();
            if (merger) merger.disconnect();

            clearInterval(timerInterval);
            isPlaying = false;

            document.getElementById('startBtn').style.display = 'inline-block';
            document.getElementById('stopBtn').style.display = 'none';
            document.getElementById('status').textContent = 'Session stopped';

            // Reset progress bar
            document.getElementById('progressFill').style.width = '0%';

            // Reset timer display
            timeRemaining = 600;
            updateTimerDisplay();
        }

        function updateTimer() {
            timeRemaining--;
            updateTimerDisplay();

            // Check if we need to switch ears at halfway point
            if (timeRemaining <= totalDuration / 2 && currentEar === 'left') {
                currentEar = 'right';
                document.getElementById('currentEar').textContent = 'Right Ear Active';
            }

            // Update progress bar
            const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;
            document.getElementById('progressFill').style.width = progress + '%';

            if (timeRemaining <= 0) {
                stopSession();
                document.getElementById('status').textContent = 'Session completed! Please let Tiffany know.';
                document.getElementById('timer').textContent = 'Complete!';
            }
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            document.getElementById('timer').textContent =
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Handle page visibility change to pause/resume
        document.addEventListener('visibilitychange', function() {
            if (isPlaying && context) {
                if (document.hidden) {
                    if (context.state === 'running') {
                        context.suspend();
                    }
                } else {
                    if (context.state === 'suspended') {
                        context.resume();
                    }
                }
            }
        });
