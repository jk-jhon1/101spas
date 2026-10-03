import * as THREE from 'three';

export class AtmosphericDust {
  constructor(scene, count = 3500) {
    this.scene = scene;
    this.count = count;
    this.initParticles();
  }

  initParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const scales = new Float32Array(this.count);
    const randoms = new Float32Array(this.count * 3);

    // Bounding volume of the cathedral hall: X [-12, 12], Y [0.5, 16], Z [-25, 25]
    for (let i = 0; i < this.count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = 0.5 + Math.random() * 16.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      scales[i] = 0.6 + Math.random() * 1.8;

      randoms[i * 3 + 0] = Math.random() * Math.PI * 2;
      randoms[i * 3 + 1] = 0.2 + Math.random() * 0.8;
      randoms[i * 3 + 2] = 0.5 + Math.random() * 1.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

    // Particle texture (soft circular glow)
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.3, 'rgba(255, 230, 180, 0.7)');
    grad.addColorStop(0.7, 'rgba(255, 200, 140, 0.2)');
    grad.addColorStop(1, 'rgba(255, 200, 140, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const pTexture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: pTexture },
        uDustColor: { value: new THREE.Color(0xffe8c0) },
        uIntensity: { value: 1.4 }
      },
      vertexShader: `
        uniform float uTime;
        attribute float aScale;
        attribute vec3 aRandom;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Gentle Brownian drift motion
          pos.x += sin(uTime * 0.3 * aRandom.y + aRandom.x) * 0.6;
          pos.y += sin(uTime * 0.2 * aRandom.z + aRandom.y) * 0.4 - mod(uTime * 0.15 * aRandom.z, 0.5);
          pos.z += cos(uTime * 0.25 * aRandom.y + aRandom.z) * 0.5;

          // Wrap around cathedral boundary
          if (pos.y < 0.2) pos.y += 16.0;
          if (pos.y > 16.5) pos.y -= 16.0;

          // Check if particle is inside the diagonal sunbeam volume (X ~ 14 to -6, Y ~ 14 to 0)
          // As particles pass through the sunbeam, they scatter intensely!
          float sunbeamAlignment = smoothstep(-10.0, 12.0, pos.x + pos.y * 0.6);
          float lightScattering = 0.4 + sunbeamAlignment * 1.8;

          vAlpha = lightScattering * (0.35 + 0.35 * sin(uTime * 2.0 + aRandom.x));

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aScale * (140.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec3 uDustColor;
        uniform float uIntensity;
        varying float vAlpha;

        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          float finalAlpha = texColor.a * vAlpha * uIntensity;
          gl_FragColor = vec4(uDustColor * texColor.rgb, finalAlpha);
        }
      `
    });

    this.points = new THREE.Points(geo, this.material);
    this.scene.add(this.points);
  }

  update(delta, time) {
    if (this.material) {
      this.material.uniforms.uTime.value = time;
    }
  }

  setDensity(density) {
    if (this.material) {
      this.material.uniforms.uIntensity.value = density;
    }
  }
}
