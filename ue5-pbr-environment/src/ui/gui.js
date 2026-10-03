import GUI from 'lil-gui';

export class UIManager {
  constructor({ scene, lighting, postProcessing, cameraManager, environment, dust, audio, onCaptureScreenshot }) {
    this.scene = scene;
    this.lighting = lighting;
    this.postProcessing = postProcessing;
    this.cameraManager = cameraManager;
    this.environment = environment;
    this.dust = dust;
    this.audio = audio;
    this.onCaptureScreenshot = onCaptureScreenshot;

    this.initHUD();
    this.initLilGUI();
  }

  initHUD() {
    // Custom sleek modern gaming HUD overlay
    const hud = document.createElement('div');
    hud.id = 'hud-container';
    hud.innerHTML = `
      <!-- Top Bar -->
      <header class="hud-top">
        <div class="hud-brand">
          <div class="hud-badge">UE5 PBR PIPELINE</div>
          <h1 class="hud-title">SANCTUARY OF LUMEN</h1>
        </div>
        <div class="hud-telemetry">
          <div class="tele-item"><span class="tele-label">GI ENGINE</span><span class="tele-val glow-amber">LUMEN RT</span></div>
          <div class="tele-item"><span class="tele-label">OCCLUSION</span><span class="tele-val">GTAO ACTIVE</span></div>
          <div class="tele-item"><span class="tele-label">OPTICS</span><span class="tele-val">BOKEH DOF</span></div>
          <div class="tele-item"><span class="tele-label">PBR MICRO-WEAR</span><span class="tele-val glow-cyan">ENABLED</span></div>
        </div>
      </header>

      <!-- Bottom Controls Bar -->
      <footer class="hud-bottom">
        <div class="mode-selector">
          <button class="hud-btn active" id="btn-cinematic"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg> CINEMATIC TOUR</button>
          <button class="hud-btn" id="btn-orbit"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg> FREE ORBIT</button>
          <button class="hud-btn" id="btn-fp"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg> FIRST PERSON (WASD)</button>
        </div>

        <div class="preset-selector">
          <span class="preset-label">FOCAL PRESETS:</span>
          <button class="preset-pill" data-preset="hero">Hero Sanctuary</button>
          <button class="preset-pill" data-preset="macro_floor">Wet Floor Wear</button>
          <button class="preset-pill" data-preset="relic_core">Relic Engine</button>
          <button class="preset-pill" data-preset="light_shafts">God Rays</button>
          <button class="preset-pill" data-preset="column_runes">Column Runes</button>
        </div>

        <div class="action-buttons">
          <button class="action-btn" id="btn-audio" title="Alternar Áudio Atmosférico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            <span id="audio-label">SOM</span>
          </button>
          <button class="action-btn" id="btn-compare" title="Ver Render de Referência UE5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            <span>RENDER UE5</span>
          </button>
          <button class="action-btn highlight" id="btn-snapshot" title="Capturar Screenshot em Alta Resolução">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-8c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z"/></svg>
            <span>SCREENSHOT</span>
          </button>
        </div>
      </footer>

      <!-- Reference Render Comparison Modal -->
      <div id="compare-modal" class="modal-overlay hidden">
        <div class="modal-window">
          <div class="modal-header">
            <h3>Render Fotorrealista UE5 de Referência (8K Concept)</h3>
            <button class="modal-close" id="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <img src="/ue5_render_reference.png" alt="Unreal Engine 5 Concept Render" class="modal-img"/>
            <p class="modal-desc">Render de referência com traçado de raios (Ray Tracing Lumen), dispersão atmosférica volumétrica, reflexos em tempo real na pedra úmida e oclusão de ambiente profunda inspirando a cena 3D.</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(hud);

    // Event Listeners
    const btnCinematic = document.getElementById('btn-cinematic');
    const btnOrbit = document.getElementById('btn-orbit');
    const btnFp = document.getElementById('btn-fp');

    const updateActiveButton = (activeBtn) => {
      [btnCinematic, btnOrbit, btnFp].forEach(b => b.classList.remove('active'));
      activeBtn.classList.add('active');
    };

    btnCinematic.addEventListener('click', () => {
      this.cameraManager.setMode('cinematic');
      updateActiveButton(btnCinematic);
    });

    btnOrbit.addEventListener('click', () => {
      this.cameraManager.setMode('orbit');
      updateActiveButton(btnOrbit);
    });

    btnFp.addEventListener('click', () => {
      this.cameraManager.setMode('firstperson');
      updateActiveButton(btnFp);
    });

    // Preset pills
    document.querySelectorAll('.preset-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        this.cameraManager.applyPreset(preset);
        updateActiveButton(btnOrbit);
      });
    });

    // Audio button
    const btnAudio = document.getElementById('btn-audio');
    const audioLabel = document.getElementById('audio-label');
    btnAudio.addEventListener('click', () => {
      const playing = this.audio.toggle();
      audioLabel.textContent = playing ? 'MUDO' : 'SOM';
      btnAudio.classList.toggle('active', playing);
    });

    // Compare modal
    const compareModal = document.getElementById('compare-modal');
    document.getElementById('btn-compare').addEventListener('click', () => {
      compareModal.classList.remove('hidden');
    });
    document.getElementById('modal-close').addEventListener('click', () => {
      compareModal.classList.add('hidden');
    });

    // Screenshot button
    document.getElementById('btn-snapshot').addEventListener('click', () => {
      if (this.onCaptureScreenshot) this.onCaptureScreenshot();
    });
  }

  initLilGUI() {
    this.gui = new GUI({ title: 'Engine Settings (UE5 PBR)', width: 310 });
    this.gui.close(); // Start closed so screen is clean

    // 1. Ray Tracing & Lumen GI
    const folderGI = this.gui.addFolder('Ray Tracing & Lumen GI');
    folderGI.add(this.lighting.params, 'sunIntensity', 0, 10, 0.1).name('Sun Intensity (RT)').onChange(v => {
      this.lighting.sunLight.intensity = v;
    });
    folderGI.addColor(this.lighting.params, 'sunColor').name('Sunlight Color').onChange(c => {
      this.lighting.sunLight.color.set(c);
    });
    folderGI.add(this.lighting.params, 'giBounceIntensity', 0, 4, 0.1).name('Lumen GI Bounce').onChange(v => {
      this.lighting.bounceLight.intensity = v;
      this.lighting.floorBouncePoint.intensity = v * 1.5;
    });
    folderGI.addColor(this.lighting.params, 'giBounceColor').name('GI Color Bleed').onChange(c => {
      this.lighting.bounceLight.color.set(c);
      this.lighting.floorBouncePoint.color.set(c);
    });
    folderGI.add(this.lighting.params, 'relicIntensity', 0, 15, 0.5).name('Relic Core Luminance').onChange(v => {
      this.lighting.relicLight.intensity = v;
    });
    folderGI.add(this.lighting.params, 'volumetricIntensity', 0, 3, 0.1).name('God Rays Density').onChange(v => {
      this.lighting.shaftMaterial.uniforms.uIntensity.value = v;
    });

    // 2. Ambient Occlusion (GTAO)
    const folderAO = this.gui.addFolder('Deep Ambient Occlusion (GTAO)');
    folderAO.add(this.postProcessing.gtaoPass, 'blendIntensity', 0.0, 2.0, 0.05).name('AO Intensity');
    folderAO.add(this.postProcessing.gtaoPass, 'radius', 0.5, 6.0, 0.1).name('AO Radius');
    folderAO.add(this.postProcessing.gtaoPass, 'distanceFallOff', 0.2, 3.0, 0.1).name('AO Distance Falloff');

    // 3. Cinematic Depth of Field (Bokeh DOF)
    const folderDOF = this.gui.addFolder('Cinematic Depth of Field');
    const dofParams = {
      focus: 14.0,
      aperture: 0.012,
      maxblur: 0.015
    };
    folderDOF.add(dofParams, 'focus', 0.5, 40, 0.5).name('Focus Distance').onChange(v => {
      this.postProcessing.setFocusDistance(v);
    });
    folderDOF.add(dofParams, 'aperture', 0.001, 0.05, 0.001).name('Aperture (F-Stop)').onChange(v => {
      this.postProcessing.setAperture(v);
    });
    folderDOF.add(dofParams, 'maxblur', 0.0, 0.04, 0.002).name('Bokeh Blur Radius').onChange(v => {
      this.postProcessing.setMaxBlur(v);
    });

    // 4. Unreal Bloom & Atmosphere
    const folderBloom = this.gui.addFolder('Unreal Bloom & Atmosphere');
    folderBloom.add(this.postProcessing.bloomPass, 'strength', 0, 3, 0.05).name('Bloom Strength');
    folderBloom.add(this.postProcessing.bloomPass, 'radius', 0, 2, 0.05).name('Bloom Radius');
    folderBloom.add(this.postProcessing.bloomPass, 'threshold', 0, 1, 0.02).name('Bloom Threshold');
    folderBloom.add({ dustDensity: 1.4 }, 'dustDensity', 0, 4, 0.1).name('Dust Moters Density').onChange(v => {
      this.dust.setDensity(v);
    });

    // 5. Lighting Presets
    const folderPresets = this.gui.addFolder('Lighting Scenarios');
    const scenarios = {
      setGolden: () => this.lighting.setPreset('golden_hour'),
      setLumen: () => this.lighting.setPreset('lumen_core'),
      setNight: () => this.lighting.setPreset('night_mystic'),
      setHighNoon: () => this.lighting.setPreset('high_noon')
    };
    folderPresets.add(scenarios, 'setGolden').name('☀️ Golden Hour (Default)');
    folderPresets.add(scenarios, 'setLumen').name('🔥 Lumen Core Energy');
    folderPresets.add(scenarios, 'setNight').name('🌙 Mystic Night & Cyan Core');
    folderPresets.add(scenarios, 'setHighNoon').name('⚡ High Noon Sun');
  }
}
