import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraManager {
  constructor(camera, domElement, postProcessing) {
    this.camera = camera;
    this.domElement = domElement;
    this.postProcessing = postProcessing;

    this.mode = 'cinematic'; // 'cinematic' | 'orbit' | 'firstperson'
    this.time = 0;

    this.initOrbit();
    this.initCinematicSpline();
    this.initPresets();
    this.initFirstPerson();
  }

  initOrbit() {
    this.orbitControls = new OrbitControls(this.camera, this.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
    this.orbitControls.minDistance = 1.0;
    this.orbitControls.maxDistance = 45.0;
    this.orbitControls.target.set(0, 5, -6);
    this.orbitControls.enabled = false;
  }

  initCinematicSpline() {
    // Elegant sweeping camera path through the sanctuary
    this.cinematicPoints = [
      new THREE.Vector3(0, 1.2, 18),    // 0: Entrance low view looking down nave
      new THREE.Vector3(-4.5, 0.6, 10), // 1: Very close to floor puddles & micro-scratches
      new THREE.Vector3(-5.2, 2.5, 2),  // 2: Passing column runes on left
      new THREE.Vector3(-2.0, 4.0, -4), // 3: Approaching the relic engine
      new THREE.Vector3(3.5, 6.0, -6),  // 4: Orbiting around rotating relic core
      new THREE.Vector3(4.8, 8.5, -3),  // 5: Elevated view catching sunbeams
      new THREE.Vector3(0, 10.0, 6),    // 6: Wide shot from above nave looking down
      new THREE.Vector3(0, 2.5, 14)     // 7: Back down to center aisle
    ];

    this.cinematicCurve = new THREE.CatmullRomCurve3(this.cinematicPoints, true, 'centripetal');

    // Targets for cinematic camera to gaze at
    this.targetPoints = [
      new THREE.Vector3(0, 4.5, -6),    // Look at relic
      new THREE.Vector3(-2, 0.1, 4),    // Look at wet floor reflections
      new THREE.Vector3(-7.5, 3.8, 0),  // Look at column runes
      new THREE.Vector3(0, 6.5, -6),    // Look at relic core
      new THREE.Vector3(0, 6.5, -6),    // Relic center
      new THREE.Vector3(12, 14, 0),     // Look up towards clerestory god rays
      new THREE.Vector3(0, 4.0, -6),    // Wide sanctuary center
      new THREE.Vector3(0, 5.0, -6)     // Return to center
    ];
    this.targetCurve = new THREE.CatmullRomCurve3(this.targetPoints, true, 'centripetal');
  }

  initPresets() {
    this.presets = {
      hero: {
        pos: new THREE.Vector3(0, 2.2, 14),
        target: new THREE.Vector3(0, 5.2, -6),
        focus: 18.0,
        aperture: 0.008
      },
      macro_floor: {
        pos: new THREE.Vector3(-1.8, 0.45, 1.5),
        target: new THREE.Vector3(-1.8, 0.1, -1.0),
        focus: 2.2,
        aperture: 0.024
      },
      relic_core: {
        pos: new THREE.Vector3(0, 5.8, 1.2),
        target: new THREE.Vector3(0, 6.5, -6),
        focus: 7.2,
        aperture: 0.015
      },
      light_shafts: {
        pos: new THREE.Vector3(-6.5, 3.0, -1.0),
        target: new THREE.Vector3(12.0, 13.0, 2.0),
        focus: 16.0,
        aperture: 0.010
      },
      column_runes: {
        pos: new THREE.Vector3(-6.2, 3.4, 1.5),
        target: new THREE.Vector3(-7.5, 3.8, 0.0),
        focus: 2.0,
        aperture: 0.022
      }
    };
  }

  initFirstPerson() {
    this.fpState = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      velocity: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      yaw: 0,
      pitch: 0,
      isMouseDown: false,
      prevMouseX: 0,
      prevMouseY: 0
    };

    window.addEventListener('keydown', (e) => {
      if (this.mode !== 'firstperson') return;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.fpState.moveForward = true; break;
        case 'KeyS': case 'ArrowDown': this.fpState.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': this.fpState.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': this.fpState.moveRight = true; break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.fpState.moveForward = false; break;
        case 'KeyS': case 'ArrowDown': this.fpState.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': this.fpState.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': this.fpState.moveRight = false; break;
      }
    });

    this.domElement.addEventListener('mousedown', (e) => {
      if (this.mode === 'firstperson') {
        this.fpState.isMouseDown = true;
        this.fpState.prevMouseX = e.clientX;
        this.fpState.prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.fpState.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mode === 'firstperson' && this.fpState.isMouseDown) {
        const dx = e.clientX - this.fpState.prevMouseX;
        const dy = e.clientY - this.fpState.prevMouseY;
        this.fpState.prevMouseX = e.clientX;
        this.fpState.prevMouseY = e.clientY;

        this.fpState.yaw -= dx * 0.003;
        this.fpState.pitch -= dy * 0.003;
        this.fpState.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.fpState.pitch));

        this.updateFPRotation();
      }
    });
  }

  updateFPRotation() {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.fpState.pitch;
    euler.y = this.fpState.yaw;
    this.camera.quaternion.setFromEuler(euler);
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'orbit') {
      this.orbitControls.enabled = true;
    } else {
      this.orbitControls.enabled = false;
    }
  }

  applyPreset(presetKey) {
    const p = this.presets[presetKey];
    if (!p) return;
    this.setMode('orbit');
    this.camera.position.copy(p.pos);
    this.orbitControls.target.copy(p.target);
    this.orbitControls.update();
    if (this.postProcessing) {
      this.postProcessing.setFocusDistance(p.focus);
      this.postProcessing.setAperture(p.aperture);
    }
  }

  update(delta) {
    if (this.mode === 'cinematic') {
      this.time += delta * 0.025; // 40-second smooth loop
      const t = this.time % 1;

      const camPos = this.cinematicCurve.getPointAt(t);
      const camTarget = this.targetCurve.getPointAt(t);

      this.camera.position.copy(camPos);
      this.camera.lookAt(camTarget);

      // Dynamically calculate focus distance to target
      if (this.postProcessing) {
        const dist = camPos.distanceTo(camTarget);
        this.postProcessing.setFocusDistance(dist);
      }
    } else if (this.mode === 'orbit') {
      this.orbitControls.update();
    } else if (this.mode === 'firstperson') {
      const speed = 7.0;
      this.fpState.velocity.x -= this.fpState.velocity.x * 10.0 * delta;
      this.fpState.velocity.z -= this.fpState.velocity.z * 10.0 * delta;

      this.fpState.direction.z = Number(this.fpState.moveForward) - Number(this.fpState.moveBackward);
      this.fpState.direction.x = Number(this.fpState.moveRight) - Number(this.fpState.moveLeft);
      this.fpState.direction.normalize();

      if (this.fpState.moveForward || this.fpState.moveBackward) {
        this.fpState.velocity.z -= this.fpState.direction.z * speed * delta * 10.0;
      }
      if (this.fpState.moveLeft || this.fpState.moveRight) {
        this.fpState.velocity.x -= this.fpState.direction.x * speed * delta * 10.0;
      }

      this.camera.translateX(-this.fpState.velocity.x * delta);
      this.camera.translateZ(this.fpState.velocity.z * delta);

      // Clamp walking height and bounds
      this.camera.position.y = 1.7; // Human eye height
      this.camera.position.x = Math.max(-12, Math.min(12, this.camera.position.x));
      this.camera.position.z = Math.max(-24, Math.min(24, this.camera.position.z));
    }
  }
}
