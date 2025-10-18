class MonkeyUnicycle3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.setupRenderer();
        this.setupLighting();
        this.setupWorld();
        this.setupMonkey();
        this.setupInput();

        // Game state
        this.level = 1;
        this.score = 0;
        this.gameRunning = true;

        // Physics
        this.gravity = -0.02;
        this.groundY = 0;

        // Monkey physics
        this.monkeyVelocity = new THREE.Vector3(0, 0, 0);
        this.balance = 0; // -1 to 1
        this.isOnGround = true;

        this.initLevel();
        this.animate();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x333333); // Dark gray background
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupLighting() {
        // Ambient light - brighter to see everything
        const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
        this.scene.add(ambientLight);

        // Directional light (sun)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 50, 50);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -50;
        this.directionalLight.shadow.camera.right = 50;
        this.directionalLight.shadow.camera.top = 50;
        this.directionalLight.shadow.camera.bottom = -50;
        this.scene.add(this.directionalLight);
    }

    setupWorld() {
        // Create main road surface - light colored for visibility
        const roadGeometry = new THREE.PlaneGeometry(300, 20);
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        this.road = new THREE.Mesh(roadGeometry, roadMaterial);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.y = this.groundY;
        this.road.receiveShadow = true;
        this.scene.add(this.road);

        // Create road markings (bright yellow lines)
        const lineGeometry = new THREE.PlaneGeometry(300, 0.5);
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

        // Center line
        const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(0, this.groundY + 0.01, 0);
        this.scene.add(centerLine);

        // Side lines
        const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(0, this.groundY + 0.01, -9);
        this.scene.add(leftLine);

        const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(0, this.groundY + 0.01, 9);
        this.scene.add(rightLine);

        // Create grass on sides
        const grassGeometry = new THREE.PlaneGeometry(300, 30);
        const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });

        const leftGrass = new THREE.Mesh(grassGeometry, grassMaterial);
        leftGrass.rotation.x = -Math.PI / 2;
        leftGrass.position.set(0, this.groundY - 0.01, -25);
        leftGrass.receiveShadow = true;
        this.scene.add(leftGrass);

        const rightGrass = new THREE.Mesh(grassGeometry, grassMaterial);
        rightGrass.rotation.x = -Math.PI / 2;
        rightGrass.position.set(0, this.groundY - 0.01, 25);
        rightGrass.receiveShadow = true;
        this.scene.add(rightGrass);

        // Create sky - remove the blue sky dome for now
        // const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
        // const skyMaterial = new THREE.MeshBasicMaterial({ 
        //     color: 0x87CEEB, // Sky blue
        //     side: THREE.BackSide 
        // });
        // const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        // this.scene.add(sky);

        this.obstacles = [];
    }

    setupMonkey() {
        // Create monkey group
        this.monkeyGroup = new THREE.Group();

        // Monkey body
        const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.monkeyBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.monkeyBody.position.y = 2;
        this.monkeyBody.castShadow = true;
        this.monkeyGroup.add(this.monkeyBody);

        // Monkey head
        const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xF4A460 });
        this.monkeyHead = new THREE.Mesh(headGeometry, headMaterial);
        this.monkeyHead.position.y = 3.2;
        this.monkeyHead.castShadow = true;
        this.monkeyGroup.add(this.monkeyHead);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 3.3, 0.4);
        this.monkeyGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 3.3, 0.4);
        this.monkeyGroup.add(rightEye);

        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.9, 2, 0);
        leftArm.rotation.z = Math.PI / 4;
        this.monkeyGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.9, 2, 0);
        rightArm.rotation.z = -Math.PI / 4;
        this.monkeyGroup.add(rightArm);

        // Unicycle wheel
        const wheelGeometry = new THREE.TorusGeometry(0.8, 0.1, 8, 16);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.unicycleWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.unicycleWheel.position.y = 0.8;
        this.unicycleWheel.rotation.x = Math.PI / 2;
        this.unicycleWheel.castShadow = true;
        this.monkeyGroup.add(this.unicycleWheel);

        // Unicycle seat post
        const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        this.unicyclePost = new THREE.Mesh(postGeometry, postMaterial);
        this.unicyclePost.position.y = 1.4;
        this.monkeyGroup.add(this.unicyclePost);

        // Unicycle seat
        const seatGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1);
        const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        this.unicycleSeat = new THREE.Mesh(seatGeometry, seatMaterial);
        this.unicycleSeat.position.y = 2;
        this.monkeyGroup.add(this.unicycleSeat);

        // Position monkey
        this.monkeyGroup.position.set(0, 0, 0);
        this.scene.add(this.monkeyGroup);

        // Setup camera to follow monkey
        this.camera.position.set(-5, 4, 0);
        this.camera.lookAt(0, 0, 0);
    }

    setupInput() {
        this.keys = {};

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    initLevel() {
        // Clear existing obstacles
        this.obstacles.forEach(obstacle => {
            this.scene.remove(obstacle.mesh);
        });
        this.obstacles = [];

        // Generate obstacles for current level
        this.finishLine = 30 + (this.level * 10);

        // Create boxes
        for (let i = 0; i < 3 + this.level; i++) {
            const x = 5 + Math.random() * (this.finishLine - 10);
            const z = (Math.random() - 0.5) * 8;
            this.createObstacle('box', x, z);
        }

        // Create spikes
        for (let i = 0; i < 2 + Math.floor(this.level / 2); i++) {
            const x = 8 + Math.random() * (this.finishLine - 15);
            const z = (Math.random() - 0.5) * 8;
            this.createObstacle('spike', x, z);
        }

        // Create ramps
        for (let i = 0; i < 1 + Math.floor(this.level / 3); i++) {
            const x = 10 + Math.random() * (this.finishLine - 20);
            const z = (Math.random() - 0.5) * 6;
            this.createObstacle('ramp', x, z);
        }

        // Create finish line
        this.createFinishLine();
    }

    createObstacle(type, x, z) {
        let geometry, material, mesh;

        switch (type) {
            case 'box':
                geometry = new THREE.BoxGeometry(2, 2, 2);
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, 1, z);
                break;

            case 'spike':
                geometry = new THREE.ConeGeometry(0.5, 3, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, 1.5, z);
                break;

            case 'ramp':
                geometry = new THREE.BoxGeometry(4, 1, 3);
                material = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, 0.5, z);
                mesh.rotation.z = Math.PI / 8;
                break;
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        this.obstacles.push({
            type: type,
            mesh: mesh,
            position: mesh.position
        });
    }

    createFinishLine() {
        // Finish line posts
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(this.finishLine, 4, -5);
        leftPost.castShadow = true;
        this.scene.add(leftPost);

        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(this.finishLine, 4, 5);
        rightPost.castShadow = true;
        this.scene.add(rightPost);

        // Finish banner
        const bannerGeometry = new THREE.PlaneGeometry(10, 2);
        const bannerMaterial = new THREE.MeshLambertMaterial({
            color: 0xFF0000,
            side: THREE.DoubleSide
        });
        const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
        banner.position.set(this.finishLine, 6, 0);
        banner.rotation.y = Math.PI / 2;
        this.scene.add(banner);

        // Store finish elements for cleanup
        this.finishElements = [leftPost, rightPost, banner];
    }

    update() {
        if (!this.gameRunning) return;

        // Handle input
        if (this.keys['ArrowLeft']) {
            this.monkeyVelocity.x -= 0.01;
            this.balance -= 0.02;
        }
        if (this.keys['ArrowRight']) {
            this.monkeyVelocity.x += 0.01;
            this.balance += 0.02;
        }
        if (this.keys['ArrowUp']) {
            this.monkeyVelocity.z -= 0.01;
        }
        if (this.keys['ArrowDown']) {
            this.monkeyVelocity.z += 0.01;
        }
        if ((this.keys['Space'] || this.keys['ArrowUp']) && this.isOnGround) {
            this.monkeyVelocity.y = 0.3;
            this.isOnGround = false;
        }

        // Apply physics
        this.monkeyVelocity.x = Math.max(-0.2, Math.min(0.2, this.monkeyVelocity.x));
        this.monkeyVelocity.z = Math.max(-0.1, Math.min(0.1, this.monkeyVelocity.z));

        // Balance affects movement
        this.balance = Math.max(-1, Math.min(1, this.balance));
        this.monkeyVelocity.x += this.balance * 0.005;

        // Apply friction
        this.monkeyVelocity.x *= 0.98;
        this.monkeyVelocity.z *= 0.95;

        // Apply gravity
        if (!this.isOnGround) {
            this.monkeyVelocity.y += this.gravity;
        }

        // Update position
        this.monkeyGroup.position.add(this.monkeyVelocity);

        // Ground collision - keep monkey on the road
        if (this.monkeyGroup.position.y <= this.groundY + 0.8) {
            this.monkeyGroup.position.y = this.groundY + 0.8;
            this.monkeyVelocity.y = 0;
            this.isOnGround = true;

            // Balance naturally returns to center when on ground
            this.balance *= 0.98;
        } else {
            this.isOnGround = false;
        }

        // Keep monkey on the road (prevent going too far left/right)
        this.monkeyGroup.position.z = Math.max(-8, Math.min(8, this.monkeyGroup.position.z));

        // Apply balance tilt to monkey
        this.monkeyGroup.rotation.z = this.balance * 0.3;

        // Rotate unicycle wheel based on movement
        this.unicycleWheel.rotation.y += this.monkeyVelocity.x * 2;

        // Check collisions
        this.checkCollisions();

        // Update camera to follow monkey
        const targetCameraPos = new THREE.Vector3(
            this.monkeyGroup.position.x - 5,
            this.monkeyGroup.position.y + 4,
            this.monkeyGroup.position.z
        );
        this.camera.position.lerp(targetCameraPos, 0.05);
        this.camera.lookAt(this.monkeyGroup.position);

        // Update lighting to follow
        this.directionalLight.position.set(
            this.monkeyGroup.position.x + 20,
            50,
            this.monkeyGroup.position.z + 20
        );

        // Check level completion
        if (this.monkeyGroup.position.x >= this.finishLine) {
            this.nextLevel();
        }

        // Check if monkey fell off or tipped over
        if (this.monkeyGroup.position.y < -10 || Math.abs(this.balance) > 0.9) {
            this.resetLevel();
        }

        // Update UI
        this.updateUI();
    }

    checkCollisions() {
        const monkeyBox = new THREE.Box3().setFromObject(this.monkeyGroup);

        for (let obstacle of this.obstacles) {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh);

            if (monkeyBox.intersectsBox(obstacleBox)) {
                if (obstacle.type === 'spike' || obstacle.type === 'box') {
                    this.resetLevel();
                    return;
                } else if (obstacle.type === 'ramp' && this.isOnGround) {
                    // Ramps give a boost
                    this.monkeyVelocity.y = 0.2;
                    this.isOnGround = false;
                }
            }
        }
    }

    nextLevel() {
        this.level++;
        this.score += 100 * this.level;
        this.resetMonkeyPosition();

        // Clean up finish elements
        if (this.finishElements) {
            this.finishElements.forEach(element => this.scene.remove(element));
        }

        this.initLevel();
    }

    resetLevel() {
        this.resetMonkeyPosition();
    }

    resetMonkeyPosition() {
        this.monkeyGroup.position.set(0, 0.8, 0);
        this.monkeyGroup.rotation.set(0, 0, 0);
        this.monkeyVelocity.set(0, 0, 0);
        this.balance = 0;
        this.isOnGround = true;
    }

    updateUI() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;

        // Update balance meter
        const balanceIndicator = document.getElementById('balanceIndicator');
        const balancePos = ((this.balance + 1) / 2) * 190; // Convert -1,1 to 0,190
        balanceIndicator.style.left = balancePos + 'px';
        balanceIndicator.style.backgroundColor = Math.abs(this.balance) > 0.7 ? '#ff0000' : '#00ff00';
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new MonkeyUnicycle3D();
});