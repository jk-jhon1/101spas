import * as THREE from 'three';

export class LightingSystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.flickerTime = 0;

    // Default configuration (UE5 style)
    this.params = {
      sunIntensity: 4.8,
      sunColor: '#fff1d0',
      giBounceIntensity: 1.6,
      giBounceColor: '#e09848',
      relicIntensity: 6.5,
      relicColor: '#ff9922',
      ambientIntensity: 0.35,
      ambientColor: '#20283a', // subtle cinematic teal ambient shadow fill
      volumetricIntensity: 1.2
    };

    this.initLights();
    this.initVolumetricShafts();
    this.initEnvironmentReflection();
  }

  initLights() {
    // 1. Primary Directional Sunlight with Soft Shadows
    this.sunLight = new THREE.DirectionalLight(this.params.sunColor, this.params.sunIntensity);
    this.sunLight.position.set(18, 22, 8);
    this.sunLight.target.position.set(-2, 0, -6);
    this.scene.add(this.sunLight.target);

    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 60;
    this.sunLight.shadow.camera.left = -22;
    this.sunLight.shadow.camera.right = 22;
    this.sunLight.shadow.camera.top = 22;
    this.sunLight.shadow.camera.bottom = -22;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.03;
    this.scene.add(this.sunLight);

    // 2. Lumen Global Illumination Bounce Light (Simulates indirect bounced light from floor to ceiling)
    this.bounceLight = new THREE.DirectionalLight(this.params.giBounceColor, this.params.giBounceIntensity);
    this.bounceLight.position.set(0, -5, -4);
    this.bounceLight.target.position.set(0, 15, -4);
    this.scene.add(this.bounceLight.target);
    this.scene.add(this.bounceLight);

    // Secondary floor bounce point light
    this.floorBouncePoint = new THREE.PointLight(this.params.giBounceColor, 2.5, 30, 1.2);
    this.floorBouncePoint.position.set(2, 0.8, -4);
    this.scene.add(this.floorBouncePoint);

    // 3. Cinematic Ambient Fill Light (Teal/Slate tone mapping contrast)
    this.hemiLight = new THREE.HemisphereLight(0x405570, 0x1b1c24, this.params.ambientIntensity);
    this.scene.add(this.hemiLight);

    // 4. Central Pulsating Relic Point Light
    this.relicLight = new THREE.PointLight(this.params.relicColor, this.params.relicIntensity, 35, 1.4);
    this.relicLight.position.set(0, 6.5, -6);
    this.relicLight.castShadow = true;
    this.relicLight.shadow.mapSize.width = 1024;
    this.relicLight.shadow.mapSize.height = 1024;
    this.relicLight.shadow.bias = -0.0004;
    this.scene.add(this.relicLight);

    // 5. Brazier Flickering Point Lights
    this.brazierLights = [];
    const brazierPos = [
      [-4.5, 2.2, -2],
      [4.5, 2.2, -2],
      [-4.5, 2.2, -10],
      [4.5, 2.2, -10]
    ];

    brazierPos.forEach(([x, y, z], idx) => {
      const pl = new THREE.PointLight(0xff6600, 1.5, 12, 1.8);
      pl.position.set(x, y, z);
      this.scene.add(pl);
      this.brazierLights.push({ light: pl, baseIntensity: 1.5, phase: idx * 1.5 });
    });
  }

  initVolumetricShafts() {
    this.shaftGroup = new THREE.Group();

    // Custom atmospheric volumetric light beam material
    const shaftMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(0xffe2aa) },
        uIntensity: { value: this.params.volumetricIntensity },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uTime;
        varying vec3 vWorldPos;
        varying vec2 vUv;

        // Simple pseudo noise
        float hash(float n) { return fract(sin(n) * 43758.5453); }
        float noise(vec2 x) {
          vec2 p = floor(x);
          vec2 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          float n = p.x + p.y * 57.0;
          return mix(mix(hash(n), hash(n + 1.0), f.x),
                     mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
        }

        void main() {
          // Lengthwise falloff: bright at window origin (uv.y=1), fading near floor (uv.y=0)
          float falloffY = smoothstep(0.0, 0.4, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y) * 0.4);
          
          // Radial cylinder falloff: soft edges across width
          float edgeSoftness = sin(vUv.x * 3.14159265);
          
          // Atmospheric dust wave animation
          float dustDrift = noise(vec2(vUv.x * 8.0, vUv.y * 12.0 - uTime * 0.15)) * 0.35 + 0.65;

          float alpha = falloffY * edgeSoftness * dustDrift * 0.28 * uIntensity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `
    });

    this.shaftMaterial = shaftMat;

    // Create 5 primary light shafts coming from clerestory windows
    for (let i = -2; i <= 2; i++) {
      const z = i * 10;
      // Slanted cone from right high window down across nave
      const beamGeo = new THREE.ConeGeometry(3.5, 30, 24, 1, true);
      beamGeo.rotateX(Math.PI / 2); // point along z
      
      const beamMesh = new THREE.Mesh(beamGeo, shaftMat);
      beamMesh.position.set(14.0, 12.0, z);
      // Look towards sanctuary floor
      beamMesh.lookAt(-4.0, 0.0, z - 4.0);
      this.shaftGroup.add(beamMesh);
    }

    this.scene.add(this.shaftGroup);
  }

  initEnvironmentReflection() {
    // Generate HDR-like dynamic environment map with cube camera
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      colorSpace: THREE.SRGBColorSpace
    });

    this.cubeCamera = new THREE.CubeCamera(0.5, 100, cubeRenderTarget);
    this.cubeCamera.position.set(0, 3, -6);
    this.scene.add(this.cubeCamera);

    // Assign scene environment
    this.scene.environment = cubeRenderTarget.texture;
    this.cubeRenderTarget = cubeRenderTarget;
  }

  update(delta, time) {
    this.flickerTime += delta;

    // Animate Relic Light (breathing glow)
    const relicPulse = 5.5 + Math.sin(time * 3.5) * 1.5;
    this.relicLight.intensity = relicPulse;

    // Animate GI floor bounce in sync with relic and sun
    this.floorBouncePoint.intensity = 2.2 + Math.sin(time * 2.0) * 0.5;

    // Animate brazier flames flickering
    this.brazierLights.forEach(b => {
      const flicker = Math.sin(time * 8.0 + b.phase) * 0.3 + Math.cos(time * 15.0 + b.phase * 2) * 0.2;
      b.light.intensity = b.baseIntensity + flicker;
    });

    // Update volumetric light shaft shader uniform
    if (this.shaftMaterial) {
      this.shaftMaterial.uniforms.uTime.value = time;
    }
  }

  updateReflection() {
    if (this.cubeCamera && this.renderer) {
      // Temporarily hide cube camera itself and update reflection probe
      this.cubeCamera.update(this.renderer, this.scene);
    }
  }

  setPreset(name) {
    switch (name) {
      case 'golden_hour':
        this.sunLight.color.set('#ffc988');
        this.sunLight.intensity = 5.2;
        this.bounceLight.color.set('#f08830');
        this.hemiLight.color.set('#3a4a60');
        this.shaftMaterial.uniforms.uColor.value.set('#ffcc88');
        break;
      case 'lumen_core':
        this.sunLight.color.set('#ffe8cc');
        this.sunLight.intensity = 4.0;
        this.relicLight.color.set('#ff7700');
        this.relicLight.intensity = 8.5;
        this.bounceLight.color.set('#ff8822');
        this.shaftMaterial.uniforms.uColor.value.set('#ffaa44');
        break;
      case 'night_mystic':
        this.sunLight.color.set('#4a88c7');
        this.sunLight.intensity = 1.2;
        this.bounceLight.color.set('#204466');
        this.hemiLight.color.set('#101828');
        this.relicLight.color.set('#00e5ff');
        this.shaftMaterial.uniforms.uColor.value.set('#44bbff');
        break;
      case 'high_noon':
        this.sunLight.color.set('#ffffff');
        this.sunLight.intensity = 6.0;
        this.bounceLight.color.set('#ddbb99');
        this.hemiLight.color.set('#607088');
        this.shaftMaterial.uniforms.uColor.value.set('#ffffff');
        break;
    }
  }
}
