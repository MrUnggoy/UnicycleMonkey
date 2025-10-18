class MonkeyUnicycleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Mobile and responsive detection
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.isTablet = this.isTouchDevice && (window.innerWidth >= 768 || window.innerHeight >= 768);

        // Initialize base dimensions first
        this.baseWidth = 800;
        this.baseHeight = 400;

        // Load monkey body image (high-res 300px version)
        this.monkeyImage = new Image();
        this.monkeyImage.src = 'images/Monkey_NBG_M.png';
        this.imageLoaded = false;

        this.monkeyImage.onload = () => {
            this.imageLoaded = true;
            console.log('New monkey body image loaded successfully!');
        };

        this.monkeyImage.onerror = () => {
            console.error('Failed to load monkey body image from:', this.monkeyImage.src);
        };

        // Load banana image (smaller, optimized version)
        this.bananaImage = new Image();
        this.bananaImage.src = 'images/banana_clipart_sm.png';
        this.bananaImageLoaded = false;

        this.bananaImage.onload = () => {
            this.bananaImageLoaded = true;
            console.log('Banana image loaded successfully!');
        };

        this.bananaImage.onerror = () => {
            console.error('Failed to load banana image from:', this.bananaImage.src);
        };

        // Game state
        this.level = 1;
        this.score = 0;
        this.bananasCollected = 0;
        this.totalBananas = 0;
        this.gameRunning = false; // Start with menu
        this.showMenu = true;
        this.levelCompleting = false;
        this.completionTimer = 0;
        this.confetti = [];
        this.balloons = [];
        this.maxUnlockedLevel = Math.max(parseInt(localStorage.getItem('monkeyMaxLevel') || '1'), 5); // At least 5 levels for testing
        this.selectedMenuLevel = 1;
        this.showSettings = false;
        this.showInstructions = false;
        this.instructionsScroll = 0; // Scroll position for instructions page
        this.touchStartY = 0; // For touch scrolling
        this.maxCities = 10; // Maximum 10 cities
        this.mouseX = 0;
        this.mouseY = 0;
        this.hoveredCity = -1;
        this.hoveredSettings = false;
        this.hoveredResetButton = false;
        this.hoveredBackButton = false;
        this.hoveredFullscreenButton = false;
        this.hoveredInstructionsButton = false;
        this.hoveredTiltButton = false;
        this.selectedSetting = 0; // Which setting is currently selected
        this.settingNames = ['gravity', 'balanceGain', 'jumpPower', 'maxSpeed'];
        this.settingLabels = ['Gravity', 'Balance Sensitivity', 'Jump Power', 'Max Speed'];

        // Touch controls
        this.touchControls = {
            leftPressed: false,
            rightPressed: false,
            jumpPressed: false,
            showControls: this.isMobile || this.isTouchDevice
        };

        // Tilt controls for mobile
        this.tiltControls = {
            enabled: this.isMobile,
            sensitivity: 0.8, // Increased sensitivity
            deadzone: 2, // Much smaller deadzone - only 2 degrees
            gamma: 0, // left/right tilt
            beta: 0,  // forward/backward tilt
            calibrated: false,
            calibrationOffset: 0,
            orientation: 'portrait' // track current orientation
        };

        // Double-tap detection for recalibration
        this.lastTapTime = 0;
        this.doubleTapDelay = 300; // milliseconds

        // Touch feedback for debugging
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.showTouchFeedback = false;
        this.touchFeedbackTimer = 0;

        // Touch control button areas (will be set in setupTouchControls)
        this.touchButtons = {};
        this.lastTouchDistance = 0;

        // Fullscreen state
        this.isFullscreen = false;

        console.log('Device detection:', {
            isMobile: this.isMobile,
            isTouchDevice: this.isTouchDevice,
            isTablet: this.isTablet,
            showTouchControls: this.touchControls.showControls
        });

        // Setup HTML fullscreen button
        this.setupFullscreenButton();

        // Setup tilt controls for mobile
        this.setupTiltControls();

        console.log('Game initialization complete:', {
            canvasSize: `${this.width}x${this.height}`,
            showMenu: this.showMenu,
            gameRunning: this.gameRunning,
            tiltEnabled: this.tiltControls.enabled
        });

        // Dynamic game settings based on device and screen size
        this.settings = this.calculateDynamicSettings();

        // City names and themes for theming
        this.cityNames = [
            'Oakridge, OR', 'Tokyo', 'Cebu, Philippines', 'Paris', 'Sydney',
            'Rio', 'Cairo', 'Mumbai', 'Moscow', 'Dubai'
        ];

        // City theme data for backgrounds and objects
        this.cityThemes = {
            'Oakridge, OR': {
                skyColor: ['#87CEEB', '#98FB98'], // Blue to green
                groundColor: '#8B4513',
                objects: ['pine_tree', 'mountain', 'cabin'],
                backgroundColor: 'forest'
            },
            'Tokyo': {
                skyColor: ['#FFB6C1', '#87CEEB'], // Pink to blue (cherry blossom)
                groundColor: '#696969',
                objects: ['skyscraper', 'neon_sign', 'cherry_tree'],
                backgroundColor: 'urban'
            },
            'Cebu, Philippines': {
                skyColor: ['#87CEEB', '#F0E68C'], // Blue to yellow (tropical)
                groundColor: '#DEB887',
                objects: ['palm_tree', 'beach_hut', 'coconut'],
                backgroundColor: 'tropical'
            },
            'Paris': {
                skyColor: ['#E6E6FA', '#87CEEB'], // Lavender to blue
                groundColor: '#A9A9A9',
                objects: ['eiffel_tower', 'cafe', 'lamp_post'],
                backgroundColor: 'european'
            },
            'Sydney': {
                skyColor: ['#87CEEB', '#FFD700'], // Blue to gold
                groundColor: '#CD853F',
                objects: ['opera_house', 'eucalyptus', 'kangaroo'],
                backgroundColor: 'australian'
            },
            'Rio': {
                skyColor: ['#87CEEB', '#FFA500'], // Blue to orange (sunset)
                groundColor: '#F4A460',
                objects: ['christ_statue', 'beach_ball', 'carnival_mask'],
                backgroundColor: 'brazilian'
            },
            'Cairo': {
                skyColor: ['#F4A460', '#DEB887'], // Sandy colors
                groundColor: '#D2B48C',
                objects: ['pyramid', 'palm_tree', 'camel'],
                backgroundColor: 'desert'
            },
            'Mumbai': {
                skyColor: ['#FF6347', '#FFD700'], // Red to gold
                groundColor: '#BC8F8F',
                objects: ['temple', 'rickshaw', 'spice_jar'],
                backgroundColor: 'indian'
            },
            'Moscow': {
                skyColor: ['#B0C4DE', '#FFFFFF'], // Steel blue to white
                groundColor: '#708090',
                objects: ['kremlin', 'snow_tree', 'matryoshka'],
                backgroundColor: 'russian'
            },
            'Dubai': {
                skyColor: ['#FFD700', '#FF6347'], // Gold to red
                groundColor: '#F4A460',
                objects: ['burj_khalifa', 'palm_island', 'camel'],
                backgroundColor: 'modern_desert'
            }
        };

        // Zoom and scaling properties
        this.zoom = parseFloat(localStorage.getItem('gameZoom') || '1.0');

        // Setup responsive canvas and touch controls
        this.setupResponsiveCanvas();
        this.setupZoom();

        // Update dimensions after zoom setup
        this.width = this.baseWidth;
        this.height = this.baseHeight;

        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSCheck = Date.now();

        // Monkey and unicycle properties
        this.monkey = {
            x: 100,
            y: 0, // Will be set correctly after groundY is defined
            width: 125, // Display size (game logic size)
            height: 125, // Display size (game logic size)
            sourceWidth: 300, // Source image size for crisp rendering
            sourceHeight: 300, // Source image size for crisp rendering
            velocityX: 0,
            velocityY: 0,
            onGround: true,
            balance: 0, // -1 to 1, affects unicycle tilt
            maxSpeed: 5,
            collisionCooldown: 0
        };

        // Unicycle properties
        this.unicycle = {
            wheelRadius: 20,
            tilt: 0 // affected by balance
        };

        // Physics
        this.gravity = 0.3; // Reduced gravity for better jumping
        this.friction = 0.95;
        this.groundY = this.height - 50;

        // Camera with vertical tracking
        this.camera = {
            x: 0,
            y: 0,
            targetY: 0,
            smoothing: 0.1 // How smoothly camera follows vertically
        };

        // Set correct initial monkey position (image already includes unicycle)
        this.monkey.y = this.groundY - this.monkey.height / 2;

        // Initialize level
        this.initLevel();

        // Input handling
        this.keys = {};
        this.setupInput();

        // Handle window resize and orientation changes
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.setupResponsiveCanvas();
                this.setupZoom();
                this.setupTouchControls();
                // Recalculate physics settings for new screen size
                this.updateDynamicSettings();
            }, 100);
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.setupResponsiveCanvas();
                this.setupZoom();
                this.setupTouchControls();
                // Recalibrate tilt controls for new orientation
                if (this.tiltControls.enabled) {
                    this.recalibrateTilt();
                }
                // Recalculate physics settings for new screen dimensions
                this.updateDynamicSettings();
            }, 500); // Longer delay for orientation change
        });

        // Start game loop
        this.gameLoop();
    }

    calculateDynamicSettings() {
        // Get screen dimensions for scaling
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const screenArea = screenWidth * screenHeight;
        const aspectRatio = screenWidth / screenHeight;

        // Base settings for different device types
        let baseSettings;

        if (this.isMobile) {
            // Mobile phone settings - smaller screen, touch controls
            baseSettings = {
                gravity: 0.12,      // Lower gravity for easier control on small screen
                balanceGain: 0.003, // Less sensitive balance for touch/tilt
                jumpPower: 10,      // Moderate jump power
                maxSpeed: 3.5       // Slower for better control on small screen
            };
        } else if (this.isTouchDevice) {
            // Tablet settings - medium screen, touch controls
            baseSettings = {
                gravity: 0.15,      // Medium gravity
                balanceGain: 0.004, // Medium balance sensitivity
                jumpPower: 11,      // Medium jump power
                maxSpeed: 4         // Medium speed
            };
        } else {
            // Desktop settings - large screen, keyboard controls
            baseSettings = {
                gravity: 0.18,      // Higher gravity for more challenge
                balanceGain: 0.005, // More sensitive balance for precise keyboard
                jumpPower: 12,      // Higher jump power
                maxSpeed: 4.5       // Faster movement for larger screen
            };
        }

        // Scale settings based on screen size
        const scaleFactor = this.calculateScreenScaleFactor(screenArea, aspectRatio);

        // Apply scaling to physics settings
        const scaledSettings = {
            gravity: baseSettings.gravity * scaleFactor.gravity,
            balanceGain: baseSettings.balanceGain * scaleFactor.balance,
            jumpPower: baseSettings.jumpPower * scaleFactor.jump,
            maxSpeed: baseSettings.maxSpeed * scaleFactor.speed
        };

        // Allow user overrides from localStorage (if they've customized)
        const finalSettings = {
            gravity: parseFloat(localStorage.getItem('gameGravity') || scaledSettings.gravity.toString()),
            balanceGain: parseFloat(localStorage.getItem('gameBalanceGain') || scaledSettings.balanceGain.toString()),
            jumpPower: parseFloat(localStorage.getItem('gameJumpPower') || scaledSettings.jumpPower.toString()),
            maxSpeed: parseFloat(localStorage.getItem('gameMaxSpeed') || scaledSettings.maxSpeed.toString())
        };

        console.log('Dynamic settings calculated:', {
            deviceType: this.isMobile ? 'mobile' : this.isTouchDevice ? 'tablet' : 'desktop',
            screenSize: `${screenWidth}x${screenHeight}`,
            scaleFactor: scaleFactor,
            finalSettings: finalSettings
        });

        return finalSettings;
    }

    calculateScreenScaleFactor(screenArea, aspectRatio) {
        // Reference screen area (1920x1080 desktop)
        const referenceArea = 1920 * 1080;
        const areaRatio = screenArea / referenceArea;

        // Calculate scale factors for different physics aspects
        const scaleFactor = {
            // Gravity should be lower on smaller screens (easier to control)
            gravity: Math.max(0.6, Math.min(1.4, 1.0 - (1.0 - areaRatio) * 0.3)),

            // Balance should be less sensitive on smaller screens
            balance: Math.max(0.5, Math.min(1.2, 0.8 + areaRatio * 0.4)),

            // Jump power should be relatively consistent but slightly lower on small screens
            jump: Math.max(0.8, Math.min(1.2, 0.9 + areaRatio * 0.3)),

            // Speed should scale with screen size (more room = faster movement)
            speed: Math.max(0.7, Math.min(1.3, 0.8 + areaRatio * 0.5))
        };

        // Adjust for extreme aspect ratios (very wide or very tall screens)
        if (aspectRatio > 2.0) {
            // Very wide screen - increase horizontal movement
            scaleFactor.speed *= 1.2;
            scaleFactor.balance *= 0.9;
        } else if (aspectRatio < 0.8) {
            // Very tall screen (portrait mobile) - decrease movement speed
            scaleFactor.speed *= 0.8;
            scaleFactor.gravity *= 0.9;
        }

        return scaleFactor;
    }

    updateDynamicSettings() {
        // Only update if user hasn't customized settings
        const hasCustomGravity = localStorage.getItem('gameGravity');
        const hasCustomBalance = localStorage.getItem('gameBalanceGain');
        const hasCustomJump = localStorage.getItem('gameJumpPower');
        const hasCustomSpeed = localStorage.getItem('gameMaxSpeed');

        // If user has customized settings, don't override them
        if (hasCustomGravity && hasCustomBalance && hasCustomJump && hasCustomSpeed) {
            console.log('User has custom settings, skipping dynamic update');
            return;
        }

        // Recalculate settings for new screen dimensions
        const newSettings = this.calculateDynamicSettings();

        // Only update settings that haven't been customized
        if (!hasCustomGravity) this.settings.gravity = newSettings.gravity;
        if (!hasCustomBalance) this.settings.balanceGain = newSettings.balanceGain;
        if (!hasCustomJump) this.settings.jumpPower = newSettings.jumpPower;
        if (!hasCustomSpeed) this.settings.maxSpeed = newSettings.maxSpeed;

        console.log('Dynamic settings updated for screen change');
    }

    setupResponsiveCanvas() {
        // Get full viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // For mobile, use full screen
        if (this.isMobile || this.isTouchDevice) {
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.width = viewportWidth;
            this.canvas.height = viewportHeight;

            // Scale game to fit mobile screen
            const scaleX = viewportWidth / this.baseWidth;
            const scaleY = viewportHeight / this.baseHeight;
            this.zoom = Math.min(scaleX, scaleY);
        } else {
            // Desktop behavior
            const scaleX = viewportWidth / this.baseWidth;
            const scaleY = viewportHeight / this.baseHeight;
            let scale = Math.min(scaleX, scaleY);
            scale = Math.min(scale, 5.0); // Max 5x on desktop
            scale = Math.max(scale, 1.0); // Min 1x
            this.zoom = scale;
        }

        // Setup touch controls layout
        this.setupTouchControls();

        console.log('Responsive setup:', {
            viewport: `${viewportWidth}x${viewportHeight}`,
            zoom: this.zoom,
            isMobile: this.isMobile
        });
    }

    setupTouchControls() {
        if (!this.touchControls.showControls) return;

        // Clear existing buttons
        this.touchButtons = {};

        // Touch control button dimensions and positions
        const buttonSize = this.isMobile ? 80 : 80; // Larger buttons for mobile
        const jumpButtonSize = this.isMobile ? 100 : 80; // Even larger jump button
        const padding = 15;

        // Left/Right movement buttons (bottom left) - only show if tilt is disabled
        if (!this.tiltControls.enabled) {
            this.touchButtons.left = {
                x: padding,
                y: window.innerHeight - buttonSize - padding,
                width: buttonSize,
                height: buttonSize,
                label: '◀'
            };

            this.touchButtons.right = {
                x: padding + buttonSize + 15,
                y: window.innerHeight - buttonSize - padding,
                width: buttonSize,
                height: buttonSize,
                label: '▶'
            };
        }

        // Jump button - positioned behind/below monkey area, larger size
        const jumpButtonX = (window.innerWidth * 0.75) - (jumpButtonSize / 2); // 75% across screen (behind monkey)
        const jumpButtonY = window.innerHeight - jumpButtonSize - (padding * 2); // Lower on screen

        this.touchButtons.jump = {
            x: jumpButtonX,
            y: jumpButtonY,
            width: jumpButtonSize,
            height: jumpButtonSize,
            label: 'JUMP'
        };

        // Ensure jump button always exists on mobile
        if (this.isMobile && !this.touchButtons.jump) {
            console.warn('Jump button missing, creating fallback');
            this.touchButtons.jump = {
                x: (window.innerWidth * 0.75) - 50,
                y: window.innerHeight - 120,
                width: 100,
                height: 100,
                label: 'JUMP'
            };
        }

        console.log('Touch controls setup:', {
            tiltEnabled: this.tiltControls.enabled,
            jumpButton: this.touchButtons.jump,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            showControls: this.touchControls.showControls
        });
    }

    setupTiltControls() {
        if (!this.tiltControls.enabled) return;

        // Request permission for device orientation on iOS 13+
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires permission
            const requestButton = document.createElement('button');
            requestButton.textContent = 'Enable Tilt Controls';
            requestButton.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 15px 30px;
                font-size: 18px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                z-index: 1000;
            `;

            requestButton.onclick = () => {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            this.enableTiltListeners();
                            requestButton.remove();
                        } else {
                            console.log('Tilt permission denied');
                            this.tiltControls.enabled = false;
                            this.setupTouchControls(); // Fallback to touch
                        }
                    })
                    .catch(console.error);
            };

            document.body.appendChild(requestButton);
        } else {
            // Other browsers - enable directly
            this.enableTiltListeners();
        }
    }

    enableTiltListeners() {
        window.addEventListener('deviceorientation', (event) => {
            if (!this.tiltControls.enabled) return;

            // Detect current orientation
            const orientation = this.getScreenOrientation();

            // Get appropriate tilt values based on orientation
            let tiltValue = 0;
            if (orientation === 'portrait') {
                tiltValue = event.gamma || 0; // left/right tilt in portrait
            } else if (orientation === 'landscape-primary') {
                tiltValue = event.beta || 0; // forward/back becomes left/right in landscape
            } else if (orientation === 'landscape-secondary') {
                tiltValue = -(event.beta || 0); // inverted in reverse landscape
            } else {
                tiltValue = event.gamma || 0; // fallback to gamma
            }

            this.tiltControls.gamma = tiltValue;
            this.tiltControls.beta = event.beta || 0;
            this.tiltControls.orientation = orientation;

            // Auto-calibrate on first reading or orientation change
            if (!this.tiltControls.calibrated || this.tiltControls.lastOrientation !== orientation) {
                this.tiltControls.calibrationOffset = tiltValue;
                this.tiltControls.calibrated = true;
                this.tiltControls.lastOrientation = orientation;
                console.log('Tilt controls calibrated for', orientation, 'offset:', this.tiltControls.calibrationOffset);
            }
        });

        console.log('Tilt controls enabled');
    }

    getScreenOrientation() {
        // Try modern API first
        if (screen.orientation) {
            return screen.orientation.type;
        }

        // Fallback to window orientation
        const orientation = window.orientation;
        if (orientation === 0) return 'portrait';
        if (orientation === 90) return 'landscape-primary';
        if (orientation === -90 || orientation === 270) return 'landscape-secondary';
        if (orientation === 180) return 'portrait-secondary';

        // Final fallback based on dimensions
        return window.innerWidth > window.innerHeight ? 'landscape-primary' : 'portrait';
    }

    convertTouchX(clientX) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;

        // Convert canvas pixel coordinates to game coordinates
        return (canvasX / rect.width) * this.width;
    }

    convertTouchY(clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasY = clientY - rect.top;

        // Convert canvas pixel coordinates to game coordinates
        return (canvasY / rect.height) * this.height;
    }

    toggleTiltControls() {
        this.tiltControls.enabled = !this.tiltControls.enabled;
        this.tiltControls.calibrated = false;

        if (this.tiltControls.enabled) {
            this.setupTiltControls();
        }

        // Update touch controls layout
        this.setupTouchControls();

        console.log('Tilt controls:', this.tiltControls.enabled ? 'enabled' : 'disabled');
    }

    recalibrateTilt() {
        if (this.tiltControls.enabled) {
            this.tiltControls.calibrated = false;
            this.tiltControls.calibrationOffset = 0;
            this.tiltControls.lastOrientation = null; // Force recalibration on next reading
            console.log('Tilt controls recalibrated');
        }
    }

    setupZoom() {
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Set canvas to fill the entire viewport
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';

        // Set internal resolution for mobile optimization
        if (this.isMobile) {
            // Use device pixel ratio for crisp rendering on mobile
            const devicePixelRatio = window.devicePixelRatio || 1;
            const scaledWidth = viewportWidth * devicePixelRatio;
            const scaledHeight = viewportHeight * devicePixelRatio;

            this.canvas.width = scaledWidth;
            this.canvas.height = scaledHeight;

            // Scale context to match device pixel ratio
            this.ctx.scale(devicePixelRatio, devicePixelRatio);

            // Update game dimensions to match viewport
            this.width = viewportWidth;
            this.height = viewportHeight;
        } else {
            // Desktop behavior
            const pixelRatio = Math.min(this.zoom * 1.5, 2.5);
            this.canvas.width = this.baseWidth * pixelRatio;
            this.canvas.height = this.baseHeight * pixelRatio;
            this.ctx.scale(pixelRatio, pixelRatio);
            this.width = this.baseWidth;
            this.height = this.baseHeight;
        }

        // Optimized quality settings
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = this.isMobile ? 'medium' : 'high';

        // Save zoom preference
        localStorage.setItem('gameZoom', this.zoom.toString());

        console.log('Canvas setup:', {
            viewport: `${viewportWidth}x${viewportHeight}`,
            canvas: `${this.canvas.width}x${this.canvas.height}`,
            game: `${this.width}x${this.height}`,
            isMobile: this.isMobile
        });
    }

    getCurrentCityTheme() {
        const cityName = this.cityNames[this.level - 1] || this.cityNames[0];
        return this.cityThemes[cityName] || this.cityThemes['Oakridge, OR'];
    }

    getRandomKidColor() {
        // Bright, fun colors that kids love
        const kidColors = [
            '#FF69B4', // Hot pink
            '#00CED1', // Dark turquoise  
            '#FFD700', // Gold
            '#FF6347', // Tomato red
            '#32CD32', // Lime green
            '#FF1493', // Deep pink
            '#00BFFF', // Deep sky blue
            '#FFA500', // Orange
            '#9370DB', // Medium purple
            '#00FF7F', // Spring green
            '#FF4500', // Orange red
            '#1E90FF'  // Dodger blue
        ];
        return kidColors[Math.floor(Math.random() * kidColors.length)];
    }

    generateThemedObjects() {
        const theme = this.getCurrentCityTheme();
        const themedObjects = [];

        // Generate themed background objects
        for (let i = 0; i < 8 + Math.floor(this.level / 2); i++) {
            const objectType = theme.objects[Math.floor(Math.random() * theme.objects.length)];
            const themedObject = {
                type: 'themed_object',
                subtype: objectType,
                x: 200 + Math.random() * (this.finishLine - 400),
                y: this.groundY - 20 - Math.random() * 200, // Various heights
                width: 40 + Math.random() * 60,
                height: 60 + Math.random() * 100,
                decorative: true // Non-collidable decoration
            };
            themedObjects.push(themedObject);
        }

        return themedObjects;
    }



    changeZoom(delta) {
        this.zoom = Math.max(0.5, Math.min(3.0, this.zoom + delta));
        this.setupZoom();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    updateFullscreenState() {
        this.isFullscreen = !!document.fullscreenElement;

        // Update responsive canvas when entering/exiting fullscreen
        setTimeout(() => {
            this.setupResponsiveCanvas();
            this.setupZoom();
            this.updateControlsText();
        }, 100); // Small delay to let fullscreen transition complete
    }

    initLevel() {
        // Generate obstacles for current level - NO OVERLAPS
        this.obstacles = [];
        this.bananas = []; // Add banana collection
        this.finishLine = 3000 + (this.level * 1000); // Much longer levels

        // Helper function to check if a new obstacle overlaps with existing ones
        const isOverlapping = (newObstacle) => {
            for (let existing of this.obstacles) {
                const buffer = 50; // Minimum spacing between objects
                if (newObstacle.x < existing.x + existing.width + buffer &&
                    newObstacle.x + newObstacle.width + buffer > existing.x &&
                    newObstacle.y < existing.y + existing.height + buffer &&
                    newObstacle.y + newObstacle.height + buffer > existing.y) {
                    return true;
                }
            }
            return false;
        };

        // Helper function to place obstacle without overlap
        const placeObstacle = (obstacle, maxAttempts = 20) => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (!isOverlapping(obstacle)) {
                    this.obstacles.push(obstacle);
                    return true;
                }
                // Try a new random position
                obstacle.x = 300 + Math.random() * (this.finishLine - 500);
            }
            return false; // Failed to place after max attempts
        };

        // Boxes removed - no more brown squares

        // Add ramps with proper spacing - 2x bigger
        for (let i = 0; i < 5 + Math.floor(this.level / 2); i++) {
            const ramp = {
                type: 'ramp',
                x: 400 + Math.random() * (this.finishLine - 600),
                y: this.groundY - 80, // 2x height: was -40, now -80
                width: 240, // 2x width: was 120, now 240
                height: 80  // 2x height: was 40, now 80
            };
            placeObstacle(ramp);
        }

        // Kid-friendly platforms - lots of fun, colorful, easy-to-reach platforms!

        // Low stepping stone platforms (easy for little kids)
        for (let i = 0; i < 15 + Math.floor(this.level * 0.5); i++) {
            const platformHeight = 30 + Math.random() * 60; // Much lower and easier
            const platformWidth = 100 + Math.random() * 60; // Bigger and easier to land on
            const platform = {
                type: 'kid_platform',
                subtype: 'stepping_stone',
                x: 300 + Math.random() * (this.finishLine - 600),
                y: this.groundY - platformHeight,
                width: platformWidth,
                height: 20, // Thicker for easier landing
                color: this.getRandomKidColor()
            };
            placeObstacle(platform);
        }

        // Medium height fun platforms
        for (let i = 0; i < 12 + Math.floor(this.level * 0.3); i++) {
            const platformHeight = 80 + Math.random() * 80; // Medium height
            const platformWidth = 80 + Math.random() * 80;
            const shapes = ['rectangle', 'circle', 'star', 'heart'];
            const platform = {
                type: 'kid_platform',
                subtype: 'fun_platform',
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                x: 400 + Math.random() * (this.finishLine - 800),
                y: this.groundY - platformHeight,
                width: platformWidth,
                height: 18,
                color: this.getRandomKidColor()
            };
            placeObstacle(platform);
        }

        // Cloud platforms (magical floating ones)
        for (let i = 0; i < 8 + Math.floor(this.level / 2); i++) {
            const platformHeight = 120 + Math.random() * 120; // Not too high
            const cloudPlatform = {
                type: 'kid_platform',
                subtype: 'cloud_platform',
                x: 500 + Math.random() * (this.finishLine - 1000),
                y: this.groundY - platformHeight,
                width: 90 + Math.random() * 50,
                height: 25,
                color: '#FFFFFF', // White clouds
                bounce: true // Special bouncy property
            };
            placeObstacle(cloudPlatform);
        }

        // Extra bouncy platforms (special high-reward platforms) - solid colors only
        for (let i = 0; i < 4 + Math.floor(this.level / 3); i++) {
            const platformHeight = 180 + Math.random() * 100; // Higher but still reachable
            const bouncyPlatform = {
                type: 'kid_platform',
                subtype: 'bouncy_platform',
                x: 600 + Math.random() * (this.finishLine - 1200),
                y: this.groundY - platformHeight,
                width: 120,
                height: 22,
                color: '#FFD700', // Safe solid gold color
                bounce: true
            };
            placeObstacle(bouncyPlatform);
        }

        // Generate lots of bananas for kids - more fun and rewarding!
        const levelBananas = 20 + (this.level * 3); // More bananas for kids
        this.totalBananas += levelBananas;

        // Helper function to check if banana overlaps with obstacles
        const isBananaOverlapping = (banana) => {
            for (let obstacle of this.obstacles) {
                const buffer = 30; // Minimum spacing from obstacles
                if (banana.x < obstacle.x + obstacle.width + buffer &&
                    banana.x + banana.width + buffer > obstacle.x &&
                    banana.y < obstacle.y + obstacle.height + buffer &&
                    banana.y + banana.height + buffer > obstacle.y) {
                    return true;
                }
            }
            return false;
        };

        // Helper function to place banana without overlap
        const placeBanana = (banana, maxAttempts = 15) => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (!isBananaOverlapping(banana)) {
                    this.bananas.push(banana);
                    return true;
                }
                // Try a new random position
                banana.x = 200 + Math.random() * (this.finishLine - 400);
                banana.y = banana.y + (Math.random() - 0.5) * 40; // Vary height slightly
            }
            return false;
        };

        // Ground level bananas (easy for kids to get)
        for (let i = 0; i < Math.floor(levelBananas * 0.7); i++) {
            const isGolden = Math.random() < 0.15; // More golden bananas for kids
            const banana = {
                x: 200 + Math.random() * (this.finishLine - 400),
                y: this.groundY - 20 - Math.random() * 40, // Lower and easier to reach
                width: 60,
                height: 59,
                collected: false,
                isGolden: isGolden,
                points: isGolden ? 50 : 25
            };
            placeBanana(banana);
        }

        // Low platform bananas (still easy for kids)
        for (let i = 0; i < Math.floor(levelBananas * 0.25); i++) {
            const isGolden = Math.random() < 0.3; // Good chance of golden
            const banana = {
                x: 300 + Math.random() * (this.finishLine - 600),
                y: this.groundY - 60 - Math.random() * 120, // Lower heights for kids
                width: 60,
                height: 59,
                collected: false,
                isGolden: isGolden,
                points: isGolden ? 75 : 40
            };
            placeBanana(banana);
        }

        // Special reward bananas (for adventurous kids)
        for (let i = 0; i < Math.floor(levelBananas * 0.05); i++) {
            const isGolden = Math.random() < 0.8; // Mostly golden for special rewards
            const banana = {
                x: 400 + Math.random() * (this.finishLine - 800),
                y: this.groundY - 200 - Math.random() * 100, // Not too high
                width: 60,
                height: 59,
                collected: false,
                isGolden: isGolden,
                points: isGolden ? 100 : 75 // Good rewards but not extreme
            };
            placeBanana(banana);
        }

        // Add themed decorative objects
        this.themedObjects = this.generateThemedObjects();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Menu navigation
            if (this.showMenu && !this.showSettings && !this.showInstructions) {
                console.log('Menu key pressed:', e.code, 'Selected:', this.selectedMenuLevel, 'Max:', this.maxUnlockedLevel);
                const buttonsPerRow = 5;
                const maxLevel = Math.min(this.maxUnlockedLevel, this.maxCities);

                if (e.code === 'ArrowLeft' && this.selectedMenuLevel > 1) {
                    this.selectedMenuLevel--;
                    console.log('Selected level:', this.selectedMenuLevel);
                } else if (e.code === 'ArrowRight' && this.selectedMenuLevel < maxLevel) {
                    this.selectedMenuLevel++;
                    console.log('Selected level:', this.selectedMenuLevel);
                } else if (e.code === 'ArrowUp') {
                    // Move up one row (subtract buttonsPerRow)
                    const newLevel = this.selectedMenuLevel - buttonsPerRow;
                    if (newLevel >= 1) {
                        this.selectedMenuLevel = newLevel;
                        console.log('Selected level (up):', this.selectedMenuLevel);
                    }
                } else if (e.code === 'ArrowDown') {
                    // Move down one row (add buttonsPerRow)
                    const newLevel = this.selectedMenuLevel + buttonsPerRow;
                    if (newLevel <= maxLevel) {
                        this.selectedMenuLevel = newLevel;
                        console.log('Selected level (down):', this.selectedMenuLevel);
                    }
                } else if (e.code === 'Enter' || e.code === 'Space') {
                    console.log('Starting game at level:', this.selectedMenuLevel);
                    this.startGame(this.selectedMenuLevel);
                } else if (e.code === 'KeyS') {
                    this.showSettings = true;
                } else if (e.code === 'KeyI') {
                    this.showInstructions = true;
                }
                e.preventDefault(); // Prevent default browser behavior
            } else if (this.showInstructions) {
                // Instructions page navigation
                if (e.code === 'Escape') {
                    this.showInstructions = false;
                    this.instructionsScroll = 0; // Reset scroll when exiting
                } else if (e.code === 'ArrowUp') {
                    this.instructionsScroll = Math.max(0, this.instructionsScroll - 30);
                } else if (e.code === 'ArrowDown') {
                    this.instructionsScroll = Math.min(400, this.instructionsScroll + 30); // Max scroll limit
                }
                e.preventDefault();
            } else if (this.showSettings) {
                // Settings navigation
                if (e.code === 'Escape') {
                    this.showSettings = false;
                    this.saveSettings();
                } else if (e.code === 'ArrowUp') {
                    this.selectedSetting = Math.max(0, this.selectedSetting - 1);
                } else if (e.code === 'ArrowDown') {
                    // Include reset button (index = settingNames.length) and back button (index = settingNames.length + 1)
                    this.selectedSetting = Math.min(this.settingNames.length + 1, this.selectedSetting + 1);
                } else if (e.code === 'ArrowLeft') {
                    if (this.selectedSetting < this.settingNames.length) {
                        this.adjustCurrentSetting(-1);
                    }
                } else if (e.code === 'ArrowRight') {
                    if (this.selectedSetting < this.settingNames.length) {
                        this.adjustCurrentSetting(1);
                    }
                } else if (e.code === 'Enter') {
                    if (this.selectedSetting === this.settingNames.length) {
                        this.resetToDefaults();
                    } else if (this.selectedSetting === this.settingNames.length + 1) {
                        this.showSettings = false;
                        this.saveSettings();
                    }
                } else if (e.code === 'KeyR') {
                    this.resetToDefaults();
                }
                e.preventDefault();
            } else if (this.gameRunning) {
                // Return to menu
                if (e.code === 'Escape') {
                    this.returnToMenu();
                }
            }

            // Zoom controls (work in both menu and game)
            if (e.code === 'Equal' || e.code === 'NumpadAdd') { // + key
                this.changeZoom(0.25);
                e.preventDefault();
            } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') { // - key
                this.changeZoom(-0.25);
                e.preventDefault();
            } else if (e.code === 'Digit0' || e.code === 'Numpad0') { // 0 key to reset
                this.zoom = 1.0;
                this.setupZoom();
                e.preventDefault();
            } else if (e.code === 'F11') { // F11 for fullscreen
                this.toggleFullscreen();
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Add mouse/click support for menu
        this.canvas.addEventListener('click', (e) => {
            if (this.showMenu) {
                const x = this.convertTouchX(e.clientX);
                const y = this.convertTouchY(e.clientY);
                this.handleMenuClick(x, y);
            }
            // Removed gameplay click handling - using HTML button instead
        });

        // Add mouse wheel zoom support and instructions scrolling
        this.canvas.addEventListener('wheel', (e) => {
            if (this.showInstructions) {
                // Scroll instructions page
                e.preventDefault();
                const scrollDelta = e.deltaY > 0 ? 30 : -30;
                this.instructionsScroll = Math.max(0, Math.min(400, this.instructionsScroll + scrollDelta));
            } else if (e.ctrlKey) { // Only zoom when Ctrl is held
                e.preventDefault();
                const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
                this.changeZoom(zoomDelta);
            }
        });

        // Add mouse move tracking for hover effects
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.showMenu) {
                this.mouseX = this.convertTouchX(e.clientX);
                this.mouseY = this.convertTouchY(e.clientY);
                this.updateHoverStates();

                // Change cursor when hovering over clickable elements
                if (this.hoveredCity > 0 || this.hoveredSettings || this.hoveredResetButton || this.hoveredBackButton || this.hoveredFullscreenButton || this.hoveredInstructionsButton || this.hoveredTiltButton) {
                    this.canvas.style.cursor = 'pointer';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
        });

        // Touch event handling for mobile devices
        if (this.touchControls.showControls) {
            this.setupTouchEvents();
        }

        // Window resize handling for responsive design
        window.addEventListener('resize', () => {
            this.setupResponsiveCanvas();
            this.setupZoom();
        });

        // Fullscreen event listeners
        document.addEventListener('fullscreenchange', () => this.updateFullscreenState());
        document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenState());
        document.addEventListener('msfullscreenchange', () => this.updateFullscreenState());
    }

    setupTouchEvents() {
        // Touch start events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touches = e.touches;

            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const touchX = this.convertTouchX(touch.clientX);
                const touchY = this.convertTouchY(touch.clientY);

                this.handleTouchStart(touchX, touchY);
            }
        });

        // Touch end events
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd();

            // Reset pinch zoom tracking
            if (e.touches.length < 2) {
                this.lastTouchDistance = 0;
            }
        });

        // Touch move events (for menu navigation and pinch zoom)
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();

            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const touchY = touch.clientY - rect.top;

                if (this.showInstructions) {
                    // Touch scrolling for instructions
                    const deltaY = this.touchStartY - touchY;
                    this.instructionsScroll = Math.max(0, Math.min(400, this.instructionsScroll + deltaY * 0.5));
                    this.touchStartY = touchY;
                } else if (this.showMenu) {
                    // Single touch - menu navigation
                    this.mouseX = (touch.clientX - rect.left) / this.zoom;
                    this.mouseY = touchY / this.zoom;
                    this.updateHoverStates();
                }
            } else if (e.touches.length === 2) {
                // Two touches - pinch to zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );

                if (this.lastTouchDistance > 0) {
                    const deltaDistance = distance - this.lastTouchDistance;
                    const zoomDelta = deltaDistance > 0 ? 0.05 : -0.05;
                    this.changeZoom(zoomDelta);
                }
                this.lastTouchDistance = distance;
            }
        });


    }

    handleTouchStart(touchX, touchY) {
        // Store touch position for feedback
        this.lastTouchX = touchX;
        this.lastTouchY = touchY;
        this.showTouchFeedback = true;
        this.touchFeedbackTimer = 60; // Show for 1 second at 60fps

        if (this.showInstructions) {
            // Store touch start position for scrolling
            this.touchStartY = touchY;
            return;
        }

        // Double-tap detection for tilt recalibration (during gameplay)
        if (this.gameRunning && this.tiltControls.enabled) {
            const currentTime = Date.now();
            if (currentTime - this.lastTapTime < this.doubleTapDelay) {
                this.recalibrateTilt();
            }
            this.lastTapTime = currentTime;
        }

        if (this.showMenu) {
            // Handle menu touches (coordinates already converted)
            this.handleMenuClick(touchX, touchY);
            return;
        }

        if (!this.gameRunning) return;

        // Fullscreen button is now HTML element - no touch handling needed here

        // Check touch control buttons
        for (const [buttonName, button] of Object.entries(this.touchButtons)) {
            if (touchX >= button.x && touchX <= button.x + button.width &&
                touchY >= button.y && touchY <= button.y + button.height) {

                console.log(`${buttonName} button pressed at ${touchX}, ${touchY}`);

                if (buttonName === 'left') {
                    this.touchControls.leftPressed = true;
                } else if (buttonName === 'right') {
                    this.touchControls.rightPressed = true;
                } else if (buttonName === 'jump') {
                    this.touchControls.jumpPressed = true;
                    console.log('Jump button activated!');
                }
                return;
            }
        }

        // Debug: show which buttons exist and their positions
        if (this.isMobile && Object.keys(this.touchButtons).length > 0) {
            console.log('Touch at', touchX, touchY, 'Buttons:', Object.keys(this.touchButtons).map(name => ({
                name,
                x: this.touchButtons[name].x,
                y: this.touchButtons[name].y,
                w: this.touchButtons[name].width,
                h: this.touchButtons[name].height
            })));
        }
    }

    handleTouchEnd() {
        // Release all touch controls
        this.touchControls.leftPressed = false;
        this.touchControls.rightPressed = false;
        this.touchControls.jumpPressed = false;
    }

    update() {
        if (this.showMenu || !this.gameRunning) return;

        // Handle input - improved responsiveness (keyboard + touch + tilt)
        let leftPressed = this.keys['ArrowLeft'] || this.touchControls.leftPressed;
        let rightPressed = this.keys['ArrowRight'] || this.touchControls.rightPressed;

        // Add tilt control input
        if (this.tiltControls.enabled && this.tiltControls.calibrated) {
            const tiltValue = this.tiltControls.gamma - this.tiltControls.calibrationOffset;
            const deadzone = this.tiltControls.deadzone;

            // Much more responsive tilt controls
            if (Math.abs(tiltValue) > deadzone) {
                const tiltStrength = Math.abs(tiltValue);
                const responsiveness = 0.08; // Increased from 0.02
                const maxTiltBoost = 0.6; // Increased from 0.2

                if (tiltValue < -deadzone) {
                    leftPressed = true;
                    // Direct velocity adjustment for immediate response
                    this.monkey.velocityX -= Math.min(tiltStrength * responsiveness, maxTiltBoost);
                } else if (tiltValue > deadzone) {
                    rightPressed = true;
                    // Direct velocity adjustment for immediate response
                    this.monkey.velocityX += Math.min(tiltStrength * responsiveness, maxTiltBoost);
                }
            }
        }

        // Allow jump if on ground or very close to ground (coyote time)
        const nearGround = Math.abs(this.monkey.y + this.monkey.height / 2 - this.groundY) < 5;
        const jumpPressed = (this.keys['ArrowUp'] || this.touchControls.jumpPressed) && (this.monkey.onGround || nearGround);

        // Debug jump input
        if (this.touchControls.jumpPressed && this.isMobile) {
            console.log('Jump pressed! OnGround:', this.monkey.onGround, 'NearGround:', nearGround, 'MonkeyY:', this.monkey.y, 'GroundY:', this.groundY);
        }

        if (leftPressed) {
            this.monkey.velocityX -= 0.4; // More responsive acceleration
            if (this.monkey.onGround) {
                this.monkey.balance -= this.settings.balanceGain; // Use setting
            }
        }
        if (rightPressed) {
            this.monkey.velocityX += 0.4; // More responsive acceleration
            if (this.monkey.onGround) {
                this.monkey.balance += this.settings.balanceGain; // Use setting
            }
        }
        if (jumpPressed) {
            this.monkey.velocityY = -this.settings.jumpPower; // Use setting
            this.monkey.onGround = false;
            // Reset jump touch control to prevent continuous jumping
            this.touchControls.jumpPressed = false;
        }

        // Apply physics - improved feel
        this.monkey.velocityX = Math.max(-this.settings.maxSpeed,
            Math.min(this.settings.maxSpeed, this.monkey.velocityX));
        this.monkey.velocityX *= 0.92; // Slightly less friction for smoother movement

        // Balance affects movement - but only when on ground
        this.monkey.balance = Math.max(-1, Math.min(1, this.monkey.balance));
        if (this.monkey.onGround) {
            this.monkey.velocityX += this.monkey.balance * 0.08; // Reduced balance effect
        }

        // Gravity - use setting
        if (!this.monkey.onGround) {
            this.monkey.velocityY += this.settings.gravity; // Use setting
        }

        // Update position
        this.monkey.x += this.monkey.velocityX;
        this.monkey.y += this.monkey.velocityY;

        // Ground collision - monkey+unicycle image bottom should touch ground
        const monkeyBottom = this.monkey.y + this.monkey.height / 2;
        if (monkeyBottom >= this.groundY) {
            // Position monkey so bottom of image touches ground
            this.monkey.y = this.groundY - this.monkey.height / 2;
            this.monkey.velocityY = 0;
            this.monkey.onGround = true;

            // Balance naturally returns to center when on ground
            this.monkey.balance *= 0.96; // Faster balance recovery
        } else {
            this.monkey.onGround = false;
            // When in air, balance slowly returns to center (no unicycle physics)
            this.monkey.balance *= 0.995; // Slower air balance recovery
        }

        // Unicycle tilt based on balance
        this.unicycle.tilt = this.monkey.balance * 0.3;

        // Rotate wheel based on movement
        if (!this.unicycle.rotation) this.unicycle.rotation = 0;
        this.unicycle.rotation += this.monkey.velocityX * 0.1;

        // Check ramp physics first (every frame)
        this.updateRampPhysics();

        // Check obstacle collisions
        this.checkCollisions();

        // Check banana collection
        this.checkBananaCollection();

        // Update camera to follow monkey horizontally and vertically
        this.camera.x = this.monkey.x - this.width / 3;

        // Vertical camera following with adaptive smooth tracking
        const monkeyScreenY = this.monkey.y;
        const idealCameraY = monkeyScreenY - this.height / 2; // Center monkey vertically

        // Adaptive smoothing - faster when monkey is moving quickly vertically
        const verticalSpeed = Math.abs(this.monkey.velocityY);
        const adaptiveSmoothing = Math.min(0.3, this.camera.smoothing + verticalSpeed * 0.02);

        // Smooth camera movement
        this.camera.targetY = idealCameraY;
        this.camera.y += (this.camera.targetY - this.camera.y) * adaptiveSmoothing;

        // Check if level complete
        if (this.monkey.x >= this.finishLine && !this.levelCompleting) {
            this.levelCompleting = true;
            this.completionTimer = 120; // 2 seconds at 60fps
            this.startCelebration();
        }

        // Handle level completion timer
        if (this.levelCompleting) {
            this.completionTimer--;
            this.updateCelebration();
            if (this.completionTimer <= 0) {
                this.completeLevel();
            }
        }

        // Check if monkey fell off or tipped over WAY too much
        // Use a death boundary below ground level instead of screen height
        const deathBoundary = this.groundY + 200; // 200 pixels below ground
        if (this.monkey.y > deathBoundary || Math.abs(this.monkey.balance) > 1.5) {
            this.resetLevel();
        }
    }

    checkCollisions() {
        // Re-enabled collisions with ramp riding

        // Reduce collision cooldown
        if (this.monkey.collisionCooldown > 0) {
            this.monkey.collisionCooldown--;
            return;
        }

        // Check collisions for all obstacles, but handle them differently

        // Very small collision box - just the unicycle wheel area
        const wheelRect = {
            x: this.monkey.x - 10,
            y: this.monkey.y + this.monkey.height / 2,
            width: 20,
            height: this.unicycle.wheelRadius
        };

        for (let obstacle of this.obstacles) {
            if (this.isColliding(wheelRect, obstacle)) {
                if (false) {
                    // No more deadly obstacles - removed spikes
                } else if (obstacle.type === 'platform' || obstacle.type === 'floating_platform' || obstacle.type === 'kid_platform') {
                    // All these types are platforms - check if monkey is landing on top
                    const monkeyBottom = this.monkey.y + this.monkey.height / 2;
                    const platformTop = obstacle.y;
                    const platformLeft = obstacle.x;
                    const platformRight = obstacle.x + obstacle.width;

                    // Check if monkey is above the platform and falling down
                    if (this.monkey.velocityY >= 0 && monkeyBottom >= platformTop - 5 && monkeyBottom <= platformTop + 15) {
                        // Check if monkey is horizontally over the platform
                        if (this.monkey.x >= platformLeft - 10 && this.monkey.x <= platformRight + 10) {
                            // Land on top of platform (image already includes unicycle)
                            this.monkey.y = platformTop - this.monkey.height / 2;
                            this.monkey.velocityY = 0;
                            this.monkey.onGround = true;

                            // Special bounce effect for bouncy kid platforms
                            if (obstacle.type === 'kid_platform' && obstacle.bounce) {
                                this.monkey.velocityY = -8; // Fun bounce for kids!
                                this.monkey.onGround = false;
                            }

                            return; // Don't reset, successfully landed on platform
                        }
                    }

                    // Platforms and floating platforms don't block side movement
                }
                // Ramps are handled separately in updateRampPhysics()
            }
        }
    }

    adjustSetting(setting, delta) {
        this.settings[setting] = Math.max(0.01, this.settings[setting] + delta);

        // Apply limits
        if (setting === 'gravity') this.settings[setting] = Math.min(1.0, this.settings[setting]);
        if (setting === 'balanceGain') this.settings[setting] = Math.min(0.05, this.settings[setting]);
        if (setting === 'jumpPower') this.settings[setting] = Math.min(20, this.settings[setting]);
        if (setting === 'maxSpeed') this.settings[setting] = Math.min(10, this.settings[setting]);
    }

    adjustCurrentSetting(direction) {
        const setting = this.settingNames[this.selectedSetting];
        let delta = 0;

        // Different adjustment amounts for different settings
        switch (setting) {
            case 'gravity':
                delta = direction * 0.025;
                break;
            case 'balanceGain':
                delta = direction * 0.001;
                break;
            case 'jumpPower':
                delta = direction * 0.5;
                break;
            case 'maxSpeed':
                delta = direction * 0.25;
                break;
        }

        this.adjustSetting(setting, delta);
    }

    resetToDefaults() {
        // Clear any custom settings from localStorage
        localStorage.removeItem('gameGravity');
        localStorage.removeItem('gameBalanceGain');
        localStorage.removeItem('gameJumpPower');
        localStorage.removeItem('gameMaxSpeed');

        // Recalculate dynamic settings for current device
        this.settings = this.calculateDynamicSettings();

        console.log('Settings reset to dynamic defaults for current device');
    }

    saveSettings() {
        localStorage.setItem('gameGravity', this.settings.gravity.toString());
        localStorage.setItem('gameBalanceGain', this.settings.balanceGain.toString());
        localStorage.setItem('gameJumpPower', this.settings.jumpPower.toString());
        localStorage.setItem('gameMaxSpeed', this.settings.maxSpeed.toString());
    }

    updateHoverStates() {
        if (this.showSettings) {
            this.hoveredSettings = false;
            this.hoveredCity = -1;
            this.hoveredTiltButton = false;

            // Check reset button hover
            const resetButtonWidth = 140;
            const resetButtonHeight = 30;
            const resetButtonX = this.width - resetButtonWidth - 20;
            const resetButtonY = this.height - resetButtonHeight - 20;

            this.hoveredResetButton = (this.mouseX >= resetButtonX && this.mouseX <= resetButtonX + resetButtonWidth &&
                this.mouseY >= resetButtonY && this.mouseY <= resetButtonY + resetButtonHeight);

            // Check back button hover
            const backButtonWidth = 100;
            const backButtonHeight = 30;
            const backButtonX = 20;
            const backButtonY = this.height - backButtonHeight - 20;

            this.hoveredBackButton = (this.mouseX >= backButtonX && this.mouseX <= backButtonX + backButtonWidth &&
                this.mouseY >= backButtonY && this.mouseY <= backButtonY + backButtonHeight);
            return;
        }

        this.hoveredResetButton = false;
        this.hoveredBackButton = false;
        this.hoveredFullscreenButton = false;
        this.hoveredInstructionsButton = false;

        // Check city button hovers
        const buttonWidth = 120;
        const buttonHeight = 60;
        const buttonsPerRow = 5;
        const startX = this.width / 2 - (buttonsPerRow * (buttonWidth + 10)) / 2 + buttonWidth / 2;
        const startY = 200;

        this.hoveredCity = -1;
        this.hoveredTiltButton = false;
        for (let i = 1; i <= Math.min(this.maxUnlockedLevel, this.maxCities); i++) {
            const row = Math.floor((i - 1) / buttonsPerRow);
            const col = (i - 1) % buttonsPerRow;
            const x = startX + col * (buttonWidth + 10);
            const y = startY + row * (buttonHeight + 20);

            // Check if mouse is over this city button
            if (this.mouseX >= x - buttonWidth / 2 && this.mouseX <= x + buttonWidth / 2 &&
                this.mouseY >= y - buttonHeight / 2 && this.mouseY <= y + buttonHeight / 2) {
                this.hoveredCity = i;
                break;
            }
        }

        // Check settings button hover
        this.hoveredSettings = (this.mouseY >= this.height - 80 && this.mouseY <= this.height - 50 &&
            this.mouseX >= this.width / 2 - 60 && this.mouseX <= this.width / 2 + 60);

        // Check instructions button hover
        const instructionsButtonX = this.width / 2 - 180;
        const instructionsButtonY = this.height - 80;
        const instructionsButtonWidth = 100;
        const instructionsButtonHeight = 30;

        this.hoveredInstructionsButton = (this.mouseY >= instructionsButtonY && this.mouseY <= instructionsButtonY + instructionsButtonHeight &&
            this.mouseX >= instructionsButtonX && this.mouseX <= instructionsButtonX + instructionsButtonWidth);

        // Check fullscreen button hover
        const fullscreenButtonX = this.width / 2 + 80;
        const fullscreenButtonY = this.height - 80;
        const fullscreenButtonWidth = 100;
        const fullscreenButtonHeight = 30;

        this.hoveredFullscreenButton = (this.mouseY >= fullscreenButtonY && this.mouseY <= fullscreenButtonY + fullscreenButtonHeight &&
            this.mouseX >= fullscreenButtonX && this.mouseX <= fullscreenButtonX + fullscreenButtonWidth);

        // Check tilt button hover (only show on mobile)
        if (this.isMobile) {
            const tiltButtonX = this.width / 2 - 60;
            const tiltButtonY = this.height - 120;
            const tiltButtonWidth = 120;
            const tiltButtonHeight = 30;

            this.hoveredTiltButton = (this.mouseY >= tiltButtonY && this.mouseY <= tiltButtonY + tiltButtonHeight &&
                this.mouseX >= tiltButtonX && this.mouseX <= tiltButtonX + tiltButtonWidth);
        }
    }

    updateRampPhysics() {
        // Only apply ramp physics when monkey is falling or on ground (not when jumping)
        if (this.monkey.velocityY < -2) {
            return; // Don't interfere with jumping
        }

        // Check if monkey is on any ramps
        for (let obstacle of this.obstacles) {
            if (obstacle.type === 'ramp') {
                const monkeyBottom = this.monkey.y + this.monkey.height / 2;
                const rampLeft = obstacle.x;
                const rampRight = obstacle.x + obstacle.width;

                // Check if monkey is horizontally over the ramp
                if (this.monkey.x >= rampLeft - 15 && this.monkey.x <= rampRight + 15) {
                    // Calculate where monkey is on the ramp (0 = left/bottom, 1 = right/top)
                    const rampProgress = Math.max(0, Math.min(1, (this.monkey.x - rampLeft) / obstacle.width));

                    // Calculate the ramp surface height at this position
                    // Ramp goes from bottom-left to top-right
                    const rampSurfaceY = obstacle.y + obstacle.height - (obstacle.height * rampProgress);

                    // Only snap to ramp if monkey is falling down or very close to surface
                    if (this.monkey.velocityY >= 0 && monkeyBottom >= rampSurfaceY - 5 && monkeyBottom <= rampSurfaceY + 15) {
                        this.monkey.y = rampSurfaceY - this.monkey.height / 2;
                        this.monkey.velocityY = 0;
                        this.monkey.onGround = true;
                        return; // Only process one ramp at a time
                    }
                }
            }
        }
    }


    checkBananaCollection() {
        const monkeyRect = {
            x: this.monkey.x - this.monkey.width / 2,
            y: this.monkey.y - this.monkey.height / 2,
            width: this.monkey.width,
            height: this.monkey.height
        };

        for (let banana of this.bananas) {
            if (!banana.collected && this.isColliding(monkeyRect, banana)) {
                banana.collected = true;
                this.bananasCollected++;
                this.score += banana.points;

                // Bigger bounce for golden bananas
                if (this.monkey.onGround) {
                    this.monkey.velocityY = banana.isGolden ? -6 : -3;
                }
            }
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    completeLevel() {
        // Calculate level completion bonus
        const levelBananas = this.bananas.length;
        const collectedThisLevel = this.bananas.filter(b => b.collected).length;
        const completionPercent = collectedThisLevel / levelBananas;

        // Base level completion bonus
        let levelBonus = 200 * this.level;

        // Bonus for collecting bananas
        if (completionPercent >= 1.0) {
            levelBonus += 500; // Perfect collection bonus
        } else if (completionPercent >= 0.8) {
            levelBonus += 300; // Good collection bonus
        } else if (completionPercent >= 0.5) {
            levelBonus += 100; // Decent collection bonus
        }

        this.score += levelBonus;

        // Update max unlocked level (unlock next level)
        const nextLevel = this.level + 1;
        if (nextLevel > this.maxUnlockedLevel) {
            this.maxUnlockedLevel = nextLevel;
            localStorage.setItem('monkeyMaxLevel', this.maxUnlockedLevel.toString());
        }

        // Save high score
        const currentHighScore = parseInt(localStorage.getItem('monkeyHighScore') || '0');
        if (this.score > currentHighScore) {
            localStorage.setItem('monkeyHighScore', this.score.toString());
        }

        // Return to main menu
        this.returnToMenu();
    }

    startGame(startLevel = 1) {
        this.showMenu = false;
        this.gameRunning = true;
        this.level = startLevel;
        this.score = 0;
        this.bananasCollected = 0;
        this.totalBananas = 0;

        // Reset monkey position
        this.monkey.x = 100;
        this.monkey.y = this.groundY - this.monkey.height / 2;
        this.monkey.velocityX = 0;
        this.monkey.velocityY = 0;
        this.monkey.balance = 0;
        this.monkey.collisionCooldown = 0;
        this.monkey.onGround = true;
        this.camera.x = 0;

        this.initLevel();
        this.updateUI();
    }

    handleMenuClick(mouseX, mouseY) {
        if (this.showSettings) {
            // Handle reset button click - bottom right corner
            const resetButtonWidth = 140;
            const resetButtonHeight = 30;
            const resetButtonX = this.width - resetButtonWidth - 20;
            const resetButtonY = this.height - resetButtonHeight - 20;

            if (mouseX >= resetButtonX && mouseX <= resetButtonX + resetButtonWidth &&
                mouseY >= resetButtonY && mouseY <= resetButtonY + resetButtonHeight) {
                this.resetToDefaults();
                return;
            }

            // Handle back button click - bottom left corner
            const backButtonWidth = 100;
            const backButtonHeight = 30;
            const backButtonX = 20;
            const backButtonY = this.height - backButtonHeight - 20;

            if (mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
                mouseY >= backButtonY && mouseY <= backButtonY + backButtonHeight) {
                this.showSettings = false;
                this.saveSettings();
                return;
            }

            // Close settings on other clicks
            this.showSettings = false;
            this.saveSettings();
            return;
        }

        // Handle city selection clicks
        const buttonWidth = 120;
        const buttonHeight = 60;
        const buttonsPerRow = 5;
        const startX = this.width / 2 - (buttonsPerRow * (buttonWidth + 10)) / 2 + buttonWidth / 2;
        const startY = 200;

        for (let i = 1; i <= Math.min(this.maxUnlockedLevel, this.maxCities); i++) {
            const row = Math.floor((i - 1) / buttonsPerRow);
            const col = (i - 1) % buttonsPerRow;
            const x = startX + col * (buttonWidth + 10);
            const y = startY + row * (buttonHeight + 20);

            // Check if click is within button bounds
            if (mouseX >= x - buttonWidth / 2 && mouseX <= x + buttonWidth / 2 &&
                mouseY >= y - buttonHeight / 2 && mouseY <= y + buttonHeight / 2) {
                this.selectedMenuLevel = i;
                this.startGame(i);
                break;
            }
        }

        // Check for settings button area (bottom of screen)
        if (mouseY >= this.height - 80 && mouseY <= this.height - 40) {
            if (mouseX >= this.width / 2 - 60 && mouseX <= this.width / 2 + 60) {
                this.showSettings = true;
            }
        }

        // Check for instructions button area
        const instructionsButtonX = this.width / 2 - 180;
        const instructionsButtonY = this.height - 80;
        const instructionsButtonWidth = 100;
        const instructionsButtonHeight = 30;

        if (mouseX >= instructionsButtonX && mouseX <= instructionsButtonX + instructionsButtonWidth &&
            mouseY >= instructionsButtonY && mouseY <= instructionsButtonY + instructionsButtonHeight) {
            this.showInstructions = true;
        }

        // Check for tilt button area (only on mobile)
        if (this.isMobile) {
            const tiltButtonX = this.width / 2 - 60;
            const tiltButtonY = this.height - 120;
            const tiltButtonWidth = 120;
            const tiltButtonHeight = 30;

            if (mouseX >= tiltButtonX && mouseX <= tiltButtonX + tiltButtonWidth &&
                mouseY >= tiltButtonY && mouseY <= tiltButtonY + tiltButtonHeight) {
                this.toggleTiltControls();
            }
        }

        // Check for fullscreen button area
        const fullscreenButtonX = this.width / 2 + 80;
        const fullscreenButtonY = this.height - 80;
        const fullscreenButtonWidth = 100;
        const fullscreenButtonHeight = 30;

        if (mouseX >= fullscreenButtonX && mouseX <= fullscreenButtonX + fullscreenButtonWidth &&
            mouseY >= fullscreenButtonY && mouseY <= fullscreenButtonY + fullscreenButtonHeight) {
            this.toggleFullscreen();
        }
    }



    returnToMenu() {
        // Save high score
        const currentHighScore = parseInt(localStorage.getItem('monkeyHighScore') || '0');
        if (this.score > currentHighScore) {
            localStorage.setItem('monkeyHighScore', this.score.toString());
        }

        this.showMenu = true;
        this.gameRunning = false;
        this.levelCompleting = false;
        this.selectedMenuLevel = 1;

        // Reset camera position
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.targetY = 0;
    }

    startCelebration() {
        // Create confetti particles
        this.confetti = [];
        for (let i = 0; i < 50; i++) {
            this.confetti.push({
                x: this.finishLine + (Math.random() - 0.5) * 200,
                y: this.groundY - 150 - Math.random() * 50,
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: Math.random() * -3 - 2,
                color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 6)],
                size: Math.random() * 4 + 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }

        // Create balloons
        this.balloons = [];
        const balloonColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
        for (let i = 0; i < 5; i++) {
            this.balloons.push({
                x: this.finishLine - 100 + i * 50,
                y: this.groundY - 80,
                targetY: this.groundY - 120 - Math.random() * 30,
                color: balloonColors[i],
                bobOffset: Math.random() * Math.PI * 2,
                stringLength: 40 + Math.random() * 20
            });
        }
    }

    updateCelebration() {
        // Update confetti
        for (let particle of this.confetti) {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.1; // Gravity
            particle.rotation += particle.rotationSpeed;

            // Remove particles that fall too far
            if (particle.y > this.groundY + 50) {
                particle.y = this.groundY - 200;
                particle.x = this.finishLine + (Math.random() - 0.5) * 200;
                particle.velocityY = Math.random() * -3 - 2;
            }
        }

        // Update balloons (gentle floating)
        for (let balloon of this.balloons) {
            balloon.bobOffset += 0.05;
            balloon.y = balloon.targetY + Math.sin(balloon.bobOffset) * 5;
        }
    }

    resetLevel() {
        this.monkey.x = 100;
        this.monkey.y = this.groundY - this.monkey.height / 2;
        this.monkey.velocityX = 0;
        this.monkey.velocityY = 0;
        this.monkey.balance = 0;
        this.monkey.collisionCooldown = 0;
        this.monkey.onGround = true;
        this.camera.x = 0;
    }

    updateUI() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;

        // Update banana counter
        const collectedThisLevel = this.bananas.filter(b => b.collected).length;
        document.getElementById('bananas').textContent = collectedThisLevel;
        document.getElementById('totalBananas').textContent = this.bananas.length;
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.showMenu) {
            this.drawMenu();
            return;
        }

        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Get current city theme
        const theme = this.getCurrentCityTheme();

        // Draw themed ground (extended for vertical camera movement)
        this.ctx.fillStyle = theme.groundColor;
        const groundStartY = Math.max(this.groundY, this.camera.y);
        const groundHeight = Math.max(this.height, this.camera.y + this.height - this.groundY);
        this.ctx.fillRect(this.camera.x, this.groundY, this.width, groundHeight);

        // Draw ground line
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.camera.x, this.groundY);
        this.ctx.lineTo(this.camera.x + this.width, this.groundY);
        this.ctx.stroke();

        // Draw themed sky/background above ground
        const skyGradient = this.ctx.createLinearGradient(0, this.camera.y - 500, 0, this.groundY);
        skyGradient.addColorStop(0, theme.skyColor[0]);
        skyGradient.addColorStop(1, theme.skyColor[1]);
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(this.camera.x, this.camera.y - 500, this.width, this.groundY - (this.camera.y - 500));

        // Draw obstacles (only visible ones for performance)
        const screenLeft = this.camera.x - 100;
        const screenRight = this.camera.x + this.width + 100;
        const screenTop = this.camera.y - 100;
        const screenBottom = this.camera.y + this.height + 100;

        // Draw themed decorative objects first (behind obstacles)
        if (this.themedObjects) {
            for (let obj of this.themedObjects) {
                if (obj.x + obj.width >= screenLeft && obj.x <= screenRight &&
                    obj.y + obj.height >= screenTop && obj.y <= screenBottom) {
                    this.drawThemedObject(obj);
                }
            }
        }

        for (let obstacle of this.obstacles) {
            // Only draw obstacles that are visible on screen (both horizontally and vertically)
            if (obstacle.x + obstacle.width >= screenLeft && obstacle.x <= screenRight &&
                obstacle.y + obstacle.height >= screenTop && obstacle.y <= screenBottom) {
                this.drawObstacle(obstacle);
            }
        }

        // Draw bananas (only visible ones for performance)
        for (let banana of this.bananas) {
            if (!banana.collected &&
                banana.x + banana.width >= screenLeft && banana.x <= screenRight &&
                banana.y + banana.height >= screenTop && banana.y <= screenBottom) {
                this.drawBanana(banana);
            }
        }

        // Draw finish line with animation when completing
        const finishLineColor = this.levelCompleting ? '#00FF00' : '#FF0000';
        this.ctx.strokeStyle = finishLineColor;
        this.ctx.lineWidth = this.levelCompleting ? 8 : 5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.finishLine, this.groundY - 100);
        this.ctx.lineTo(this.finishLine, this.groundY);
        this.ctx.stroke();

        // Draw finish flag with celebration colors
        this.ctx.fillStyle = this.levelCompleting ? '#00FF00' : '#FF0000';
        this.ctx.fillRect(this.finishLine, this.groundY - 100, 30, 20);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.finishLine, this.groundY - 90, 30, 10);

        // Draw celebration when finishing
        if (this.levelCompleting) {
            this.drawCelebration();
        }

        // Draw monkey and unicycle
        this.drawMonkeyUnicycle();

        // Restore context
        this.ctx.restore();

        // Draw balance meter
        this.drawBalanceMeter();

        // Draw touch controls for mobile devices
        if (this.touchControls.showControls && this.gameRunning) {
            this.drawTouchControls();
        }

        // Show/hide HTML fullscreen button
        this.updateFullscreenButton();
    }

    drawTouchControls() {
        // Save context
        this.ctx.save();

        // Reset any transforms to draw in screen coordinates
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Semi-transparent background for buttons
        this.ctx.globalAlpha = 0.7;

        // Draw each touch button
        for (const [buttonName, button] of Object.entries(this.touchButtons)) {
            const isPressed = this.touchControls[buttonName + 'Pressed'];

            // Special styling for jump button
            if (buttonName === 'jump') {
                // Jump button - make it round and more prominent with pulsing effect
                const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1; // Gentle pulsing
                const radius = (button.width / 2) * pulseScale;

                this.ctx.fillStyle = isPressed ? '#FF4500' : '#FF6B35';
                this.ctx.beginPath();
                this.ctx.arc(
                    button.x + button.width / 2,
                    button.y + button.height / 2,
                    radius,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();

                // Jump button border - thicker and more visible
                this.ctx.strokeStyle = isPressed ? '#CC3300' : '#E55A2B';
                this.ctx.lineWidth = 6;
                this.ctx.stroke();

                // Jump button label - larger and more visible
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `bold ${Math.min(button.width * 0.25, 20)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    button.label,
                    button.x + button.width / 2,
                    button.y + button.height / 2
                );

                // Add a subtle shadow for depth
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(
                    button.x + button.width / 2 + 3,
                    button.y + button.height / 2 + 3,
                    radius,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
                this.ctx.globalAlpha = 0.7; // Reset alpha
            } else {
                // Regular buttons (left/right)
                this.ctx.fillStyle = isPressed ? '#4CAF50' : '#2196F3';
                this.ctx.fillRect(button.x, button.y, button.width, button.height);

                // Button border
                this.ctx.strokeStyle = isPressed ? '#45a049' : '#1976D2';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(button.x, button.y, button.width, button.height);

                // Button label
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `bold ${button.width * 0.4}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    button.label,
                    button.x + button.width / 2,
                    button.y + button.height / 2
                );
            }
        }

        // Show tilt control status if enabled
        if (this.tiltControls.enabled) {
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';

            const orientation = this.tiltControls.orientation || 'unknown';
            const orientationText = orientation.includes('landscape') ? 'Landscape' : 'Portrait';
            const statusText = this.tiltControls.calibrated ?
                `Tilt to Move (${orientationText}) - Double-tap to recalibrate` :
                'Calibrating Tilt...';

            this.ctx.fillText(statusText, window.innerWidth / 2, 10);

            // Show tilt indicator
            if (this.tiltControls.calibrated) {
                const tiltValue = this.tiltControls.gamma - this.tiltControls.calibrationOffset;
                const indicatorWidth = 200;
                const indicatorHeight = 20;
                const indicatorX = (window.innerWidth - indicatorWidth) / 2;
                const indicatorY = 35;

                // Background
                this.ctx.fillStyle = '#333333';
                this.ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);

                // Tilt position
                const tiltPosition = Math.max(-1, Math.min(1, tiltValue / 30)); // Normalize to -1 to 1
                const dotX = indicatorX + (indicatorWidth / 2) + (tiltPosition * indicatorWidth / 2);

                this.ctx.fillStyle = '#4CAF50';
                this.ctx.beginPath();
                this.ctx.arc(dotX, indicatorY + indicatorHeight / 2, 8, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Restore context
        this.ctx.restore();
    }

    setupFullscreenButton() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (!fullscreenBtn) return;

        fullscreenBtn.addEventListener('click', () => {
            console.log('HTML fullscreen button clicked!');
            this.toggleFullscreen();
        });
    }

    updateFullscreenButton() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (!fullscreenBtn) return;

        // Show button during gameplay when not in fullscreen
        if (this.gameRunning && !this.isFullscreen) {
            fullscreenBtn.style.display = 'block';
            fullscreenBtn.textContent = 'FS';
            fullscreenBtn.title = 'Enter Fullscreen';
        } else {
            fullscreenBtn.style.display = 'none';
        }
    }

    drawObstacle(obstacle) {
        switch (obstacle.type) {
            // Boxes removed - no more brown squares



            case 'ramp':
                // Bigger, more substantial ramps
                this.ctx.fillStyle = '#90EE90';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();

                // Add border for better visibility
                this.ctx.strokeStyle = '#228B22';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                break;

            case 'platform':
                // High-quality stone-like platform
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                this.ctx.strokeStyle = '#2F2F2F';
                this.ctx.lineWidth = 2;
                this.ctx.lineJoin = 'round';
                this.ctx.lineCap = 'round';
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

                // Add some texture lines with better quality
                this.ctx.strokeStyle = '#808080';
                this.ctx.lineWidth = 1;
                this.ctx.lineCap = 'round';
                for (let i = 1; i < 3; i++) {
                    const lineY = obstacle.y + (obstacle.height / 3) * i;
                    this.ctx.beginPath();
                    this.ctx.moveTo(obstacle.x, lineY);
                    this.ctx.lineTo(obstacle.x + obstacle.width, lineY);
                    this.ctx.stroke();
                }
                break;

            case 'floating_platform':
                // Magical floating platform with glow
                this.ctx.fillStyle = '#4169E1';
                this.ctx.shadowColor = '#4169E1';
                this.ctx.shadowBlur = 8;
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                this.ctx.shadowBlur = 0;

                this.ctx.strokeStyle = '#1E90FF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                break;

            case 'kid_platform':
                this.drawKidPlatform(obstacle);
                break;
        }
    }

    drawThemedObject(obj) {
        // Draw themed decorative objects based on city
        this.ctx.save();

        switch (obj.subtype) {
            case 'pine_tree':
                // Simple pine tree for Oakridge
                this.ctx.fillStyle = '#8B4513'; // Brown trunk
                this.ctx.fillRect(obj.x + obj.width / 2 - 5, obj.y + obj.height - 20, 10, 20);
                this.ctx.fillStyle = '#228B22'; // Green foliage
                this.ctx.beginPath();
                this.ctx.moveTo(obj.x + obj.width / 2, obj.y);
                this.ctx.lineTo(obj.x + obj.width / 4, obj.y + obj.height - 20);
                this.ctx.lineTo(obj.x + 3 * obj.width / 4, obj.y + obj.height - 20);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'skyscraper':
                // Simple skyscraper for Tokyo
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                this.ctx.strokeStyle = '#2F2F2F';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                // Windows
                this.ctx.fillStyle = '#FFD700';
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < Math.floor(obj.height / 15); j++) {
                        this.ctx.fillRect(obj.x + 5 + i * 12, obj.y + 5 + j * 15, 8, 8);
                    }
                }
                break;

            case 'palm_tree':
                // Palm tree for tropical cities
                this.ctx.fillStyle = '#8B4513'; // Brown trunk
                this.ctx.fillRect(obj.x + obj.width / 2 - 3, obj.y + obj.height - 30, 6, 30);
                this.ctx.fillStyle = '#32CD32'; // Green palm fronds
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    this.ctx.beginPath();
                    this.ctx.ellipse(obj.x + obj.width / 2 + Math.cos(angle) * 15,
                        obj.y + 10 + Math.sin(angle) * 10,
                        20, 5, angle, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;

            default:
                // Generic themed object
                const theme = this.getCurrentCityTheme();
                this.ctx.fillStyle = theme.skyColor[1];
                this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                this.ctx.strokeStyle = theme.groundColor;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                break;
        }

        this.ctx.restore();
    }

    drawKidPlatform(platform) {
        this.ctx.save();

        // Add gentle glow effect for all kid platforms
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = platform.color || '#FFD700';

        switch (platform.subtype) {
            case 'stepping_stone':
                // Simple colorful rectangle with rounded corners - no flashing effects
                this.ctx.fillStyle = platform.color;
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 10);
                this.ctx.fill();
                break;

            case 'fun_platform':
                this.ctx.fillStyle = platform.color;

                switch (platform.shape) {
                    case 'circle':
                        this.ctx.beginPath();
                        this.ctx.arc(platform.x + platform.width / 2, platform.y + platform.height / 2,
                            platform.width / 2, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;

                    case 'star':
                        this.drawStar(platform.x + platform.width / 2, platform.y + platform.height / 2,
                            platform.width / 2, platform.width / 4, 5);
                        break;

                    case 'heart':
                        this.drawHeart(platform.x + platform.width / 2, platform.y + platform.height / 2,
                            platform.width / 2);
                        break;

                    default: // rectangle
                        this.ctx.beginPath();
                        this.ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 8);
                        this.ctx.fill();
                        break;
                }
                break;

            case 'cloud_platform':
                // Fluffy cloud shape
                this.ctx.fillStyle = '#FFFFFF';
                this.drawCloud(platform.x, platform.y, platform.width, platform.height);
                break;

            case 'bouncy_platform':
                // Safe solid colored bouncy platform
                this.ctx.fillStyle = platform.color;
                this.ctx.beginPath();
                this.ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 12);
                this.ctx.fill();

                // Add simple border for visual interest (no flashing)
                this.ctx.strokeStyle = '#FFA500'; // Orange border
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                break;
        }

        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    drawStar(x, y, outerRadius, innerRadius, points) {
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawHeart(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size / 4);
        this.ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
        this.ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size / 2, x, y + size);
        this.ctx.bezierCurveTo(x, y + size / 2, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
        this.ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
        this.ctx.fill();
    }

    drawCloud(x, y, width, height) {
        // Draw fluffy cloud with multiple circles
        const circles = [
            { x: x + width * 0.2, y: y + height * 0.5, r: height * 0.4 },
            { x: x + width * 0.4, y: y + height * 0.3, r: height * 0.5 },
            { x: x + width * 0.6, y: y + height * 0.3, r: height * 0.5 },
            { x: x + width * 0.8, y: y + height * 0.5, r: height * 0.4 }
        ];

        this.ctx.beginPath();
        for (let circle of circles) {
            this.ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        }
        this.ctx.fill();
    }



    drawBanana(banana) {
        if (this.bananaImageLoaded) {
            // Use the actual banana PNG image
            this.ctx.save();

            // Add safe golden effect for special bananas
            if (banana.isGolden) {
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 3; // Gentle, steady glow
                // No color filters - just a simple golden glow
            }

            // Draw the banana image with better quality
            this.ctx.drawImage(
                this.bananaImage,
                banana.x,
                banana.y,
                banana.width,
                banana.height
            );

            // Golden bananas have a safe, steady glow (no flashing)
            if (banana.isGolden) {
                this.ctx.shadowBlur = 0;
                this.ctx.filter = 'none';
                // No sparkle effects - just the golden glow is enough
            }

            this.ctx.restore();
        } else {
            // Fallback: simple yellow rectangle if image not loaded
            this.ctx.fillStyle = banana.isGolden ? '#FFD700' : '#FFFF00';
            this.ctx.fillRect(banana.x, banana.y, banana.width, banana.height);
            this.ctx.strokeStyle = '#E6E600';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(banana.x, banana.y, banana.width, banana.height);
        }
    }

    drawMonkeyUnicycle() {
        this.ctx.save();

        // Move to monkey position
        this.ctx.translate(this.monkey.x, this.monkey.y);

        // Apply unicycle tilt
        this.ctx.rotate(this.unicycle.tilt);

        // Draw your monkey+unicycle image (already includes unicycle) if loaded, otherwise fallback to simple drawing
        if (this.imageLoaded) {
            // Draw high-res monkey image (quality settings already set in setupZoom)
            this.ctx.drawImage(
                this.monkeyImage,
                -this.monkey.width / 2,
                -this.monkey.height / 2,
                this.monkey.width,
                this.monkey.height
            );
        } else {
            // Fallback: Draw simple monkey if image not loaded yet
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.monkey.width / 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw monkey face
            this.ctx.fillStyle = '#F4A460';
            this.ctx.beginPath();
            this.ctx.arc(0, -5, this.monkey.width / 3, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw eyes
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(-8, -8, 3, 0, Math.PI * 2);
            this.ctx.arc(8, -8, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawCelebration() {
        // Draw balloons
        for (let balloon of this.balloons) {
            // Balloon string
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(balloon.x, balloon.y + 15);
            this.ctx.lineTo(balloon.x, balloon.y + balloon.stringLength);
            this.ctx.stroke();

            // Balloon
            this.ctx.fillStyle = balloon.color;
            this.ctx.beginPath();
            this.ctx.ellipse(balloon.x, balloon.y, 12, 16, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Balloon highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(balloon.x - 3, balloon.y - 4, 4, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw confetti
        for (let particle of this.confetti) {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            this.ctx.restore();
        }

        // Draw "LEVEL COMPLETE!" text with high quality
        this.ctx.fillStyle = '#00FF00';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 28px "Arial", sans-serif';
        this.ctx.textAlign = 'center';

        // Enable better text rendering
        this.ctx.textBaseline = 'middle';

        // Text with outline - kid-friendly message
        this.ctx.strokeText('GREAT JOB!', this.finishLine, this.groundY - 160);
        this.ctx.fillText('GREAT JOB!', this.finishLine, this.groundY - 160);

        // Show return to menu message
        const timeLeft = Math.ceil(this.completionTimer / 60);
        this.ctx.font = '16px "Arial", sans-serif';
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText(`Going back to menu in ${timeLeft}...`, this.finishLine, this.groundY - 130);

        this.ctx.textAlign = 'left'; // Reset alignment
    }

    drawMenu() {
        if (this.showSettings) {
            this.drawSettings();
            return;
        }

        if (this.showInstructions) {
            this.drawInstructions();
            return;
        }

        // Draw themed background gradient based on selected city
        const selectedTheme = this.cityThemes[this.cityNames[this.selectedMenuLevel - 1]] || this.cityThemes['Oakridge, OR'];
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, selectedTheme.skyColor[0]);
        gradient.addColorStop(1, selectedTheme.skyColor[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw title with high quality
        this.ctx.fillStyle = '#2F4F4F';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.font = 'bold 48px "Arial", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.strokeText('MONKEY UNICYCLE', this.width / 2, 80);
        this.ctx.fillText('MONKEY UNICYCLE', this.width / 2, 80);

        this.ctx.font = 'bold 24px "Arial", sans-serif';
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillText('WORLD TOUR', this.width / 2, 110);

        // Draw city selection
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = '#2F4F4F';
        this.ctx.fillText('SELECT CITY', this.width / 2, 160);

        // Draw city buttons
        const buttonWidth = 120;
        const buttonHeight = 60;
        const buttonsPerRow = 5;
        const startX = this.width / 2 - (buttonsPerRow * (buttonWidth + 10)) / 2 + buttonWidth / 2;
        const startY = 200;

        for (let i = 1; i <= this.maxCities; i++) {
            const row = Math.floor((i - 1) / buttonsPerRow);
            const col = (i - 1) % buttonsPerRow;
            const x = startX + col * (buttonWidth + 10);
            const y = startY + row * (buttonHeight + 20);

            // Button background with hover effects
            if (i <= this.maxUnlockedLevel) {
                if (i === this.selectedMenuLevel) {
                    this.ctx.fillStyle = '#98FB98'; // Selected (same as hover)
                    this.ctx.strokeStyle = '#32CD32';
                } else if (i === this.hoveredCity) {
                    this.ctx.fillStyle = '#98FB98'; // Hovered (lighter green)
                    this.ctx.strokeStyle = '#32CD32';
                } else {
                    this.ctx.fillStyle = '#90EE90'; // Available
                    this.ctx.strokeStyle = '#228B22';
                }
            } else {
                this.ctx.fillStyle = '#D3D3D3'; // Locked
                this.ctx.strokeStyle = '#A9A9A9';
            }

            this.ctx.lineWidth = 3;
            this.ctx.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
            this.ctx.strokeRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);

            // City name
            this.ctx.fillStyle = i <= this.maxUnlockedLevel ? '#2F4F4F' : '#808080';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.cityNames[i - 1], x, y - 8);

            // City number
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`City ${i}`, x, y + 8);

            // Lock icon for locked cities
            if (i > this.maxUnlockedLevel) {
                this.ctx.fillStyle = '#808080';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('🔒', x, y + 20);
            }
        }

        // Settings button with hover effect
        if (this.hoveredSettings) {
            this.ctx.fillStyle = '#5A7FE1'; // Lighter blue when hovered
            this.ctx.strokeStyle = '#4169E1';
        } else {
            this.ctx.fillStyle = '#4169E1';
            this.ctx.strokeStyle = '#1E90FF';
        }

        this.ctx.fillRect(this.width / 2 - 60, this.height - 80, 120, 30);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.width / 2 - 60, this.height - 80, 120, 30);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SETTINGS', this.width / 2, this.height - 62);

        // Instructions button with hover effect (left of settings)
        const instructionsButtonX = this.width / 2 - 180;
        const instructionsButtonY = this.height - 80;
        const instructionsButtonWidth = 100;
        const instructionsButtonHeight = 30;

        if (this.hoveredInstructionsButton) {
            this.ctx.fillStyle = '#32CD32'; // Lighter green when hovered
            this.ctx.strokeStyle = '#228B22';
        } else {
            this.ctx.fillStyle = '#228B22';
            this.ctx.strokeStyle = '#32CD32';
        }

        this.ctx.fillRect(instructionsButtonX, instructionsButtonY, instructionsButtonWidth, instructionsButtonHeight);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(instructionsButtonX, instructionsButtonY, instructionsButtonWidth, instructionsButtonHeight);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HOW TO PLAY', instructionsButtonX + instructionsButtonWidth / 2, instructionsButtonY + instructionsButtonHeight / 2 + 5);

        // Fullscreen button with hover effect
        const fullscreenButtonX = this.width / 2 + 80;
        const fullscreenButtonY = this.height - 80;
        const fullscreenButtonWidth = 100;
        const fullscreenButtonHeight = 30;

        if (this.hoveredFullscreenButton) {
            this.ctx.fillStyle = '#FF8C00'; // Lighter orange when hovered
            this.ctx.strokeStyle = '#FF6347';
        } else {
            this.ctx.fillStyle = '#FF6347';
            this.ctx.strokeStyle = '#FF4500';
        }

        this.ctx.fillRect(fullscreenButtonX, fullscreenButtonY, fullscreenButtonWidth, fullscreenButtonHeight);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(fullscreenButtonX, fullscreenButtonY, fullscreenButtonWidth, fullscreenButtonHeight);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        const fullscreenText = this.isFullscreen ? 'EXIT FULL' : 'FULLSCREEN';
        this.ctx.fillText(fullscreenText, fullscreenButtonX + fullscreenButtonWidth / 2, fullscreenButtonY + fullscreenButtonHeight / 2 + 5);

        // Tilt controls button (mobile only)
        if (this.isMobile) {
            const tiltButtonX = this.width / 2 - 60;
            const tiltButtonY = this.height - 120;
            const tiltButtonWidth = 120;
            const tiltButtonHeight = 30;

            if (this.hoveredTiltButton) {
                this.ctx.fillStyle = this.tiltControls.enabled ? '#FF6B6B' : '#4ECDC4'; // Different colors for enabled/disabled
                this.ctx.strokeStyle = this.tiltControls.enabled ? '#FF5252' : '#26A69A';
            } else {
                this.ctx.fillStyle = this.tiltControls.enabled ? '#FF5252' : '#26A69A';
                this.ctx.strokeStyle = this.tiltControls.enabled ? '#D32F2F' : '#00695C';
            }

            this.ctx.fillRect(tiltButtonX, tiltButtonY, tiltButtonWidth, tiltButtonHeight);
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(tiltButtonX, tiltButtonY, tiltButtonWidth, tiltButtonHeight);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            const tiltText = this.tiltControls.enabled ? 'TILT: ON' : 'TILT: OFF';
            this.ctx.fillText(tiltText, tiltButtonX + tiltButtonWidth / 2, tiltButtonY + tiltButtonHeight / 2 + 4);
        }

        // Instructions (adaptive for device type)
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#2F4F4F';
        if (this.isMobile) {
            const controlText = this.tiltControls.enabled ? 'Tilt to move (works in any orientation)' : 'Touch controls';
            this.ctx.fillText(`Tap cities to play | ${controlText} | Toggle tilt above`, this.width / 2, this.height - 40);
        } else if (this.isTouchDevice) {
            this.ctx.fillText('Tap or click cities | Touch + keyboard | F11: Fullscreen', this.width / 2, this.height - 40);
        } else {
            this.ctx.fillText('Click cities to play | Arrow keys | F11: Fullscreen', this.width / 2, this.height - 40);
        }

        // Show high score
        const highScore = localStorage.getItem('monkeyHighScore') || '0';
        this.ctx.fillText(`High Score: ${highScore}`, this.width / 2, this.height - 20);

        // Touch feedback for debugging (mobile only)
        if (this.isMobile && this.showTouchFeedback && this.touchFeedbackTimer > 0) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(this.lastTouchX, this.lastTouchY, 20, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${Math.round(this.lastTouchX)}, ${Math.round(this.lastTouchY)}`, this.lastTouchX, this.lastTouchY + 5);

            // Show which button was pressed
            let buttonPressed = 'none';
            if (this.touchControls.jumpPressed) buttonPressed = 'JUMP';
            else if (this.touchControls.leftPressed) buttonPressed = 'LEFT';
            else if (this.touchControls.rightPressed) buttonPressed = 'RIGHT';

            if (buttonPressed !== 'none') {
                this.ctx.fillText(buttonPressed, this.lastTouchX, this.lastTouchY + 20);
            }

            // Show jump button area for debugging
            if (this.touchButtons.jump) {
                this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    this.touchButtons.jump.x,
                    this.touchButtons.jump.y,
                    this.touchButtons.jump.width,
                    this.touchButtons.jump.height
                );
                this.ctx.fillText(
                    `Jump: ${this.touchButtons.jump.x},${this.touchButtons.jump.y}`,
                    this.touchButtons.jump.x,
                    this.touchButtons.jump.y - 10
                );
            }

            this.touchFeedbackTimer--;
            if (this.touchFeedbackTimer <= 0) {
                this.showTouchFeedback = false;
            }
        }

        this.ctx.textAlign = 'left'; // Reset alignment
    }

    drawInstructions() {
        // Draw background
        this.ctx.fillStyle = '#2F4F4F';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Title (fixed at top)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HOW TO PLAY', this.width / 2, 80);

        // Create clipping area for scrollable content
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 100, this.width, this.height - 150); // Leave space for title and footer
        this.ctx.clip();

        // Instructions content with scroll offset
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        let y = 140 - this.instructionsScroll; // Apply scroll offset
        const lineHeight = 30;

        const instructions = [
            '🐒 Help the monkey balance on the unicycle!',
            '',
            '🎮 CONTROLS:',
            '   • LEFT/RIGHT arrows: Move and balance',
            '   • UP arrow: Jump',
            '   • Mouse: Click to navigate menus',
            '   • F11: Toggle fullscreen',
            '',
            '🍌 COLLECT BANANAS:',
            '   • Yellow bananas: 25-40 points',
            '   • Golden bananas: 50-150 points',
            '',
            '🏗️ PLATFORMS:',
            '   • Green ramps: Ride up slopes',
            '   • Colorful platforms: Jump between them',
            '   • Cloud platforms: Bouncy and fun!',
            '',
            '🎯 GOAL:',
            '   • Reach the finish line',
            '   • Collect as many bananas as possible',
            '   • Unlock new cities to explore',
            '',
            '👶 PERFECT FOR KIDS AGES 3-6!',
            '',
            'Press ESC to return to menu'
        ];

        instructions.forEach(line => {
            this.ctx.fillText(line, this.width / 2, y);
            y += lineHeight;
        });

        // Restore clipping
        this.ctx.restore();

        // Draw scroll indicators and controls (fixed at bottom)
        this.ctx.fillStyle = 'rgba(47, 79, 79, 0.9)';
        this.ctx.fillRect(0, this.height - 50, this.width, 50);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';

        // Scroll instructions
        if (this.instructionsScroll > 0) {
            this.ctx.fillText('↑ Scroll up: Arrow keys or mouse wheel', this.width / 2, this.height - 35);
        }
        if (this.instructionsScroll < 400) {
            this.ctx.fillText('↓ Scroll down: Arrow keys or mouse wheel', this.width / 2, this.height - 20);
        }

        // ESC instruction
        this.ctx.fillText('Press ESC to return to menu', this.width / 2, this.height - 5);

        this.ctx.textAlign = 'left'; // Reset alignment
    }

    drawSettings() {
        // Draw background
        this.ctx.fillStyle = '#2F2F2F';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Title
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME SETTINGS', this.width / 2, 80);

        // Dynamic settings indicator
        const deviceType = this.isMobile ? 'Mobile' : this.isTouchDevice ? 'Tablet' : 'Desktop';
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillText(`Optimized for ${deviceType} (${window.innerWidth}x${window.innerHeight})`, this.width / 2, 110);

        // Settings display with selection highlighting
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        const startY = 150;
        const lineHeight = 50;

        for (let i = 0; i < this.settingNames.length; i++) {
            const y = startY + i * lineHeight;
            const setting = this.settingNames[i];
            const label = this.settingLabels[i];
            const value = this.settings[setting];

            // Highlight selected setting
            if (i === this.selectedSetting) {
                this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // Golden highlight
                this.ctx.fillRect(30, y - 20, this.width - 60, 35);
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(30, y - 20, this.width - 60, 35);
            }

            // Setting label
            this.ctx.fillStyle = i === this.selectedSetting ? '#FFD700' : '#FFFF00';
            this.ctx.fillText(`${label}:`, 50, y);

            // Setting value
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(value.toFixed(setting === 'jumpPower' || setting === 'maxSpeed' ? 1 : 3), 400, y);

            // Adjustment arrows for selected setting
            if (i === this.selectedSetting) {
                this.ctx.fillStyle = '#00FF00';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('◄', 350, y);
                this.ctx.fillText('►', 500, y);
            }
        }

        // Reset to defaults button - bottom right corner
        const resetButtonWidth = 140;
        const resetButtonHeight = 30;
        const resetButtonX = this.width - resetButtonWidth - 20;
        const resetButtonY = this.height - resetButtonHeight - 20;
        const isResetSelected = this.selectedSetting === this.settingNames.length;

        // Selection highlight (golden border when selected via keyboard)
        if (isResetSelected) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.fillRect(resetButtonX - 5, resetButtonY - 5, resetButtonWidth + 10, resetButtonHeight + 10);
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(resetButtonX - 5, resetButtonY - 5, resetButtonWidth + 10, resetButtonHeight + 10);
        }

        // Button background with hover effect
        this.ctx.fillStyle = this.hoveredResetButton ? '#FF6347' : (isResetSelected ? '#FF6347' : '#FF4500');
        this.ctx.fillRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight);
        this.ctx.strokeStyle = this.hoveredResetButton ? '#FF7F50' : (isResetSelected ? '#FF7F50' : '#FF6347');
        this.ctx.lineWidth = this.hoveredResetButton ? 3 : 2;
        this.ctx.strokeRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight);

        // Button text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = (this.hoveredResetButton || isResetSelected) ? 'bold 15px Arial' : 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('RESET TO DYNAMIC', resetButtonX + resetButtonWidth / 2, resetButtonY + resetButtonHeight / 2 + 5);

        // Show Enter prompt when selected
        if (isResetSelected) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('Press ENTER', resetButtonX + resetButtonWidth / 2, resetButtonY + resetButtonHeight + 15);
        }

        // Back button - bottom left corner
        const backButtonWidth = 100;
        const backButtonHeight = 30;
        const backButtonX = 20;
        const backButtonY = this.height - backButtonHeight - 20;
        const isBackSelected = this.selectedSetting === this.settingNames.length + 1;

        // Selection highlight (golden border when selected via keyboard)
        if (isBackSelected) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.fillRect(backButtonX - 5, backButtonY - 5, backButtonWidth + 10, backButtonHeight + 10);
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(backButtonX - 5, backButtonY - 5, backButtonWidth + 10, backButtonHeight + 10);
        }

        // Button background with hover effect
        this.ctx.fillStyle = this.hoveredBackButton ? '#4169E1' : (isBackSelected ? '#4169E1' : '#1E90FF');
        this.ctx.fillRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
        this.ctx.strokeStyle = this.hoveredBackButton ? '#6495ED' : (isBackSelected ? '#6495ED' : '#4169E1');
        this.ctx.lineWidth = this.hoveredBackButton ? 3 : 2;
        this.ctx.strokeRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);

        // Button text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = (this.hoveredBackButton || isBackSelected) ? 'bold 15px Arial' : 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BACK', backButtonX + backButtonWidth / 2, backButtonY + backButtonHeight / 2 + 5);

        // Show Enter prompt when selected
        if (isBackSelected) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('Press ENTER', backButtonX + backButtonWidth / 2, backButtonY + backButtonHeight + 15);
        }

        // Instructions
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('UP/DOWN: Navigate | LEFT/RIGHT: Adjust Value | ENTER: Activate', this.width / 2, this.height - 70);
        this.ctx.fillText('R: Reset to Dynamic | ESC: Save and Return', this.width / 2, this.height - 50);
        this.ctx.fillText('Navigate to Back or Reset buttons with arrows, then press ENTER', this.width / 2, this.height - 30);

        this.ctx.textAlign = 'left'; // Reset alignment
    }

    drawBalanceMeter() {
        // Balance meter background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(10, 10, 200, 20);

        // Balance indicator
        const balancePos = (this.monkey.balance + 1) / 2; // Convert -1,1 to 0,1
        this.ctx.fillStyle = Math.abs(this.monkey.balance) > 0.7 ? '#FF0000' : '#00FF00';
        this.ctx.fillRect(10 + balancePos * 190, 12, 10, 16);

        // Center line
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(110, 10);
        this.ctx.lineTo(110, 30);
        this.ctx.stroke();

        // Label with better quality
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px "Arial", sans-serif';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Balance', 220, 25);
    }

    gameLoop() {
        this.update();
        this.render();
        this.updateUI();

        // Performance monitoring
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastFPSCheck > 5000) { // Check every 5 seconds
            const fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSCheck));
            if (fps < 30) {
                console.warn('Low FPS detected:', fps, 'fps. Consider reducing zoom level.');
            }
            this.frameCount = 0;
            this.lastFPSCheck = now;
        }

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new MonkeyUnicycleGame();
});