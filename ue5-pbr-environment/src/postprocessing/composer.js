import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Custom Cinematic Grading Shader Pass: ACES contrast, film grain, and subtle chromatic aberration & vignette
const CinematicGradingShader = {
  name: 'CinematicGradingShader',
  uniforms: {
    tDiffuse: { value: null },
    uContrast: { value: 1.15 },
    uSaturation: { value: 1.08 },
    uVignetteDarkness: { value: 0.8 },
    uVignetteOffset: { value: 1.05 },
    uGrainIntensity: { value: 0.035 },
    uChromaticAberration: { value: 0.0018 },
    uTime: { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uVignetteDarkness;
    uniform float uVignetteOffset;
    uniform float uGrainIntensity;
    uniform float uChromaticAberration;
    uniform float uTime;
    varying vec2 vUv;

    // Pseudo-random noise
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 distFromCenter = uv - 0.5;

      // Chromatic aberration (color fringing at edges of lens)
      float ca = uChromaticAberration * length(distFromCenter);
      float r = texture2D(tDiffuse, uv + distFromCenter * ca).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - distFromCenter * ca).b;
      vec3 color = vec3(r, g, b);

      // Contrast
      color = (color - 0.5) * uContrast + 0.5;

      // Saturation
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, uSaturation);

      // Cinematic Vignette
      float dist = length(distFromCenter);
      float vignette = smoothstep(uVignetteOffset, uVignetteOffset - 0.5, dist);
      color = mix(color * (1.0 - uVignetteDarkness), color, vignette);

      // Subtle 35mm film grain
      float grain = (rand(uv + fract(uTime)) - 0.5) * uGrainIntensity;
      color += grain;

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `
};

export class PostProcessingManager {
  constructor(renderer, scene, camera, width, height) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.width = width;
    this.height = height;

    this.enabledDOF = true;
    this.enabledGTAO = true;
    this.enabledBloom = true;

    this.initPipeline();
  }

  initPipeline() {
    this.composer = new EffectComposer(this.renderer);

    // 1. Render Base Scene
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 2. Ground Truth Ambient Occlusion (GTAO) - Deep contact shadows
    this.gtaoPass = new GTAOPass(this.scene, this.camera, this.width, this.height);
    this.gtaoPass.output = GTAOPass.OUTPUT.Default;
    this.gtaoPass.blendIntensity = 0.85;
    this.gtaoPass.radius = 2.0;
    this.gtaoPass.distanceFallOff = 1.0;
    this.composer.addPass(this.gtaoPass);

    // 3. Bokeh Depth of Field (Natural optical lens focus)
    this.bokehPass = new BokehPass(this.scene, this.camera, {
      focus: 14.0,
      aperture: 0.012,
      maxblur: 0.015,
      width: this.width,
      height: this.height
    });
    this.composer.addPass(this.bokehPass);

    // 4. Unreal Bloom (Cinematic glow for emissive relic & sunbeams)
    const bloomRes = new THREE.Vector2(this.width, this.height);
    this.bloomPass = new UnrealBloomPass(bloomRes, 0.85, 0.65, 0.82);
    this.composer.addPass(this.bloomPass);

    // 5. Cinematic Color Grading & Film Grain
    this.gradingPass = new ShaderPass(CinematicGradingShader);
    this.composer.addPass(this.gradingPass);

    // 6. Output Pass with Tone Mapping
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.composer.setSize(width, height);
    this.gtaoPass.setSize(width, height);
    this.bokehPass.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  update(delta, time) {
    if (this.gradingPass) {
      this.gradingPass.uniforms.uTime.value = time;
    }
  }

  render() {
    this.composer.render();
  }

  setFocusDistance(val) {
    this.bokehPass.uniforms['focus'].value = val;
  }

  setAperture(val) {
    this.bokehPass.uniforms['aperture'].value = val;
  }

  setMaxBlur(val) {
    this.bokehPass.uniforms['maxblur'].value = val;
  }

  setBloomStrength(val) {
    this.bloomPass.strength = val;
  }

  setGTAOIntensity(val) {
    this.gtaoPass.blendIntensity = val;
  }

  setGTAORadius(val) {
    this.gtaoPass.radius = val;
  }
}
