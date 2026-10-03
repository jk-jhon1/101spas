import * as THREE from 'three';
import { PBRTextureGenerator } from './scene/textures.js';
import { CathedralEnvironment } from './scene/environment.js';
import { LightingSystem } from './scene/lighting.js';
import { AtmosphericDust } from './scene/particles.js';
import { PostProcessingManager } from './postprocessing/composer.js';
import { CameraManager } from './controls/cameraManager.js';
import { SanctuaryAudio } from './audio/ambientAudio.js';
import { UIManager } from './ui/gui.js';

class UE5Application {
  constructor() {
    this.container = document.getElementById('app-container');
    this.loadingEl = document.getElementById('loading-screen');
    this.progressFill = document.getElementById('progress-fill');
    this.statusText = document.getElementById('loading-status');

    this.clock = new THREE.Clock();
    this.frameCount = 0;

    this.init();
  }

  async init() {
    this.updateProgress(15, 'Configurando Renderer WebGL com ACES Filmic Tone Mapping...');
    this.setupRenderer();

    this.updateProgress(35, 'Gerando texturas PBR procedurais (Albedo, Sobel Normal, Micro-Roughness, Puddles, AO)...');
    await new Promise(r => setTimeout(r, 60)); // Yield to paint
    this.pbrGenerator = new PBRTextureGenerator();
    const floorTextures = this.pbrGenerator.generateFloorTextures(1024);
    const stoneTextures = this.pbrGenerator.generateStoneTextures(1024);
    const relicTextures = this.pbrGenerator.generateRelicTextures(512);

    this.updateProgress(65, 'Construindo geometria de alta densidade inspirada na Unreal Engine 5...');
    await new Promise(r => setTimeout(r, 60));
    this.environment = new CathedralEnvironment(this.scene, {
      floor: floorTextures,
      stone: stoneTextures,
      relic: relicTextures
    });

    this.updateProgress(80, 'Inicializando Ray Tracing Lumen GI, feixes volumétricos e dispersão atmosférica...');
    await new Promise(r => setTimeout(r, 60));
    this.lighting = new LightingSystem(this.scene, this.renderer);
    this.dust = new AtmosphericDust(this.scene, 3500);

    this.updateProgress(92, 'Compilando passes de pós-processamento: GTAO, Bokeh DOF e Unreal Bloom...');
    await new Promise(r => setTimeout(r, 60));
    this.postProcessing = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.camera,
      window.innerWidth,
      window.innerHeight
    );

    this.cameraManager = new CameraManager(this.camera, this.renderer.domElement, this.postProcessing);
    this.audio = new SanctuaryAudio();

    this.uiManager = new UIManager({
      scene: this.scene,
      lighting: this.lighting,
      postProcessing: this.postProcessing,
      cameraManager: this.cameraManager,
      environment: this.environment,
      dust: this.dust,
      audio: this.audio,
      onCaptureScreenshot: () => this.captureScreenshot()
    });

    // Window Resize
    window.addEventListener('resize', () => this.onWindowResize());

    this.updateProgress(100, 'Tudo pronto! Entrando no Santuário de Lumen...');
    await new Promise(r => setTimeout(r, 400));
    this.loadingEl.classList.add('fade-out');
    setTimeout(() => this.loadingEl.remove(), 800);

    // Initial reflection probe capture
    this.lighting.updateReflection();

    this.animate();
  }

  setupRenderer() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x121720, 0.015);

    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 120);
    this.camera.position.set(0, 2.2, 14);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  updateProgress(percent, text) {
    if (this.progressFill) this.progressFill.style.width = `${percent}%`;
    if (this.statusText) this.statusText.textContent = text;
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.postProcessing.setSize(width, height);
  }

  captureScreenshot() {
    // Render high quality frame
    this.postProcessing.render();
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `UE5_Sanctuary_PBR_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();
    this.frameCount++;

    // Update systems
    this.environment.update(delta, time);
    this.lighting.update(delta, time);
    this.dust.update(delta, time);
    this.cameraManager.update(delta);
    this.postProcessing.update(delta, time);

    // Periodically refresh dynamic environment reflection probe (every 25 frames)
    if (this.frameCount % 25 === 0) {
      this.lighting.updateReflection();
    }

    // Render post-processing pipeline
    this.postProcessing.render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new UE5Application();
});
