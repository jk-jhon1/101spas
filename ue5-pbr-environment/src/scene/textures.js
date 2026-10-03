import * as THREE from 'three';

// Procedural PBR Texture Generator using 2D Canvas
export class PBRTextureGenerator {
  constructor() {
    this.cache = new Map();
  }

  // Simplex-style pseudo noise
  static createNoise(width, height, octaves = 4, persistence = 0.5) {
    const data = new Float32Array(width * height);
    for (let o = 0; o < octaves; o++) {
      const freq = Math.pow(2, o);
      const amp = Math.pow(persistence, o);
      const gridW = Math.ceil(freq) + 1;
      const gridH = Math.ceil(freq) + 1;
      const randGrid = new Float32Array(gridW * gridH);
      for (let i = 0; i < randGrid.length; i++) randGrid[i] = Math.random();

      for (let y = 0; y < height; y++) {
        const gy = (y / height) * freq;
        const y0 = Math.floor(gy);
        const y1 = y0 + 1;
        const fy = gy - y0;
        const sy = fy * fy * (3 - 2 * fy);

        for (let x = 0; x < width; x++) {
          const gx = (x / width) * freq;
          const x0 = Math.floor(gx);
          const x1 = x0 + 1;
          const fx = gx - x0;
          const sx = fx * fx * (3 - 2 * fx);

          const i00 = ((y0 % gridH) * gridW) + (x0 % gridW);
          const i10 = ((y0 % gridH) * gridW) + (x1 % gridW);
          const i01 = ((y1 % gridH) * gridW) + (x0 % gridW);
          const i11 = ((y1 % gridH) * gridW) + (x1 % gridW);

          const top = randGrid[i00] * (1 - sx) + randGrid[i10] * sx;
          const bottom = randGrid[i01] * (1 - sx) + randGrid[i11] * sx;
          const val = top * (1 - sy) + bottom * sy;

          data[y * width + x] += val * amp;
        }
      }
    }
    // Normalize to 0..1
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    const range = max - min || 1;
    for (let i = 0; i < data.length; i++) {
      data[i] = (data[i] - min) / range;
    }
    return data;
  }

  // Generate Floor Slabs with Puddles, Micro-Wear & Cracks
  generateFloorTextures(size = 1024) {
    const canvasColor = document.createElement('canvas');
    canvasColor.width = size; canvasColor.height = size;
    const ctxColor = canvasColor.getContext('2d');

    const canvasNormal = document.createElement('canvas');
    canvasNormal.width = size; canvasNormal.height = size;
    const ctxNormal = canvasNormal.getContext('2d');

    const canvasRough = document.createElement('canvas');
    canvasRough.width = size; canvasRough.height = size;
    const ctxRough = canvasRough.getContext('2d');

    const canvasAO = document.createElement('canvas');
    canvasAO.width = size; canvasAO.height = size;
    const ctxAO = canvasAO.getContext('2d');

    const imgColor = ctxColor.createImageData(size, size);
    const imgNormal = ctxNormal.createImageData(size, size);
    const imgRough = ctxRough.createImageData(size, size);
    const imgAO = ctxAO.createImageData(size, size);

    const noiseLarge = PBRTextureGenerator.createNoise(size, size, 4, 0.5);
    const noiseFine = PBRTextureGenerator.createNoise(size, size, 6, 0.45);
    const noisePuddles = PBRTextureGenerator.createNoise(size, size, 3, 0.6);

    const heightMap = new Float32Array(size * size);
    const tileSize = size / 8;
    const mortarWidth = 4;

    // Fill base height and materials
    for (let y = 0; y < size; y++) {
      const tileY = Math.floor(y / tileSize);
      const dy = y % tileSize;
      const isMortarY = dy < mortarWidth || dy > tileSize - mortarWidth;

      for (let x = 0; x < size; x++) {
        const offset = (tileY % 2 === 1) ? tileSize * 0.5 : 0;
        const adjustedX = (x + offset) % size;
        const tileX = Math.floor(adjustedX / tileSize);
        const dx = adjustedX % tileSize;
        const isMortarX = dx < mortarWidth || dx > tileSize - mortarWidth;

        const idx = y * size + x;
        const isMortar = isMortarX || isMortarY;

        // Tile variation seed
        const tileSeed = Math.sin(tileX * 12.9898 + tileY * 78.233) * 43758.5453;
        const tileTone = (tileSeed - Math.floor(tileSeed)) * 0.25 - 0.12;

        const nL = noiseLarge[idx];
        const nF = noiseFine[idx];
        const nPuddle = noisePuddles[idx];

        // Height
        let h = 0.5 + (nF * 0.15) + (nL * 0.1);
        if (isMortar) {
          h = 0.15 + (nF * 0.05);
        } else {
          // slight bevel near edge
          const edgeDist = Math.min(dx, tileSize - dx, dy, tileSize - dy);
          if (edgeDist < 8) {
            h *= (0.6 + 0.4 * (edgeDist / 8));
          }
        }
        heightMap[idx] = h;

        // Wet puddle mask: low areas where puddle noise is high
        const isPuddle = (nPuddle > 0.62 && !isMortar) || (nPuddle > 0.72);
        const puddleFactor = Math.max(0, Math.min(1, (nPuddle - 0.55) / 0.25));

        // Color (Albedo)
        let baseR = 75 + tileTone * 40;
        let baseG = 78 + tileTone * 38;
        let baseB = 82 + tileTone * 35;
        // Apply stone grain
        const grain = (nF - 0.5) * 40 + (nL - 0.5) * 30;
        baseR += grain; baseG += grain; baseB += grain;

        if (isMortar) {
          baseR = 35 + nF * 15;
          baseG = 34 + nF * 15;
          baseB = 33 + nF * 15;
        }

        // Wet puddles darken stone
        if (puddleFactor > 0) {
          const wetDarken = 1.0 - puddleFactor * 0.45;
          baseR *= wetDarken;
          baseG *= wetDarken;
          baseB *= wetDarken;
        }

        // Ambient Occlusion
        let ao = isMortar ? 0.35 : 0.85 + (nF * 0.15);
        if (!isMortar) {
          const edgeDist = Math.min(dx, tileSize - dx, dy, tileSize - dy);
          if (edgeDist < 6) ao *= (0.55 + 0.45 * (edgeDist / 6));
        }

        // Roughness: Dry stone ~0.65 - 0.85, Wet puddles ~0.08 - 0.18, Mortar ~0.95
        let roughness = isMortar ? 0.95 : (0.60 + nF * 0.25);
        if (puddleFactor > 0) {
          roughness = roughness * (1 - puddleFactor) + (0.08 + nF * 0.05) * puddleFactor;
        }

        const pixelIdx = idx * 4;
        imgColor.data[pixelIdx + 0] = Math.max(0, Math.min(255, baseR));
        imgColor.data[pixelIdx + 1] = Math.max(0, Math.min(255, baseG));
        imgColor.data[pixelIdx + 2] = Math.max(0, Math.min(255, baseB));
        imgColor.data[pixelIdx + 3] = 255;

        const aoByte = Math.max(0, Math.min(255, ao * 255));
        imgAO.data[pixelIdx + 0] = aoByte;
        imgAO.data[pixelIdx + 1] = aoByte;
        imgAO.data[pixelIdx + 2] = aoByte;
        imgAO.data[pixelIdx + 3] = 255;

        const roughByte = Math.max(0, Math.min(255, roughness * 255));
        imgRough.data[pixelIdx + 0] = roughByte;
        imgRough.data[pixelIdx + 1] = roughByte;
        imgRough.data[pixelIdx + 2] = roughByte;
        imgRough.data[pixelIdx + 3] = 255;
      }
    }

    // Sobel Normal Map generation from height map
    const strength = 4.0;
    for (let y = 0; y < size; y++) {
      const ym = (y - 1 + size) % size;
      const yp = (y + 1) % size;
      for (let x = 0; x < size; x++) {
        const xm = (x - 1 + size) % size;
        const xp = (x + 1) % size;

        // 3x3 neighborhood
        const tl = heightMap[ym * size + xm];
        const tc = heightMap[ym * size + x];
        const tr = heightMap[ym * size + xp];
        const ml = heightMap[y * size + xm];
        const mr = heightMap[y * size + xp];
        const bl = heightMap[yp * size + xm];
        const bc = heightMap[yp * size + x];
        const br = heightMap[yp * size + xp];

        const dX = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
        const dY = (bl + 2 * bc + br) - (tl + 2 * tc + tr);

        let nx = -dX * strength;
        let ny = -dY * strength;
        let nz = 1.0;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len; ny /= len; nz /= len;

        const pixelIdx = (y * size + x) * 4;
        imgNormal.data[pixelIdx + 0] = Math.floor((nx * 0.5 + 0.5) * 255);
        imgNormal.data[pixelIdx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        imgNormal.data[pixelIdx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        imgNormal.data[pixelIdx + 3] = 255;
      }
    }

    ctxColor.putImageData(imgColor, 0, 0);
    ctxNormal.putImageData(imgNormal, 0, 0);
    ctxRough.putImageData(imgRough, 0, 0);
    ctxAO.putImageData(imgAO, 0, 0);

    // Apply micro-scratches over the roughness and normal maps using 2D canvas drawing
    ctxRough.strokeStyle = 'rgba(255,255,255,0.22)';
    ctxRough.lineWidth = 1.2;
    for (let i = 0; i < 400; i++) {
      const sx = Math.random() * size;
      const sy = Math.random() * size;
      const len = 10 + Math.random() * 35;
      const ang = Math.random() * Math.PI * 2;
      ctxRough.beginPath();
      ctxRough.moveTo(sx, sy);
      ctxRough.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
      ctxRough.stroke();
    }

    // Micro dust flecks
    ctxRough.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 1500; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      ctxRough.fillRect(rx, ry, 1.5, 1.5);
    }

    const tColor = new THREE.CanvasTexture(canvasColor);
    const tNormal = new THREE.CanvasTexture(canvasNormal);
    const tRough = new THREE.CanvasTexture(canvasRough);
    const tAO = new THREE.CanvasTexture(canvasAO);

    [tColor, tNormal, tRough, tAO].forEach(t => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 16;
    });

    tColor.colorSpace = THREE.SRGBColorSpace;

    return {
      map: tColor,
      normalMap: tNormal,
      roughnessMap: tRough,
      aoMap: tAO,
      normalScale: new THREE.Vector2(1.2, 1.2)
    };
  }

  // Generate Gothic Column & Vault Stone Textures
  generateStoneTextures(size = 1024) {
    const canvasColor = document.createElement('canvas');
    canvasColor.width = size; canvasColor.height = size;
    const ctxColor = canvasColor.getContext('2d');

    const canvasNormal = document.createElement('canvas');
    canvasNormal.width = size; canvasNormal.height = size;
    const ctxNormal = canvasNormal.getContext('2d');

    const canvasRough = document.createElement('canvas');
    canvasRough.width = size; canvasRough.height = size;
    const ctxRough = canvasRough.getContext('2d');

    const imgColor = ctxColor.createImageData(size, size);
    const imgNormal = ctxNormal.createImageData(size, size);
    const imgRough = ctxRough.createImageData(size, size);

    const noiseL = PBRTextureGenerator.createNoise(size, size, 4, 0.5);
    const noiseF = PBRTextureGenerator.createNoise(size, size, 6, 0.4);
    const heightMap = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        const nl = noiseL[idx];
        const nf = noiseF[idx];

        // Horizontal block seams and chisel banding
        const blockY = (y % 128) / 128;
        const seamY = (blockY < 0.04 || blockY > 0.96) ? 0.25 : 1.0;

        const h = (0.5 + nl * 0.25 + nf * 0.25) * seamY;
        heightMap[idx] = h;

        // Base aged limestone
        let r = (110 + nl * 35 + nf * 20) * seamY;
        let g = (112 + nl * 33 + nf * 18) * seamY;
        let b = (115 + nl * 30 + nf * 16) * seamY;

        // Roughness: 0.7 - 0.95
        const rough = 0.72 + nf * 0.22;

        const pIdx = idx * 4;
        imgColor.data[pIdx + 0] = Math.max(0, Math.min(255, r));
        imgColor.data[pIdx + 1] = Math.max(0, Math.min(255, g));
        imgColor.data[pIdx + 2] = Math.max(0, Math.min(255, b));
        imgColor.data[pIdx + 3] = 255;

        const rB = Math.max(0, Math.min(255, rough * 255));
        imgRough.data[pIdx + 0] = rB;
        imgRough.data[pIdx + 1] = rB;
        imgRough.data[pIdx + 2] = rB;
        imgRough.data[pIdx + 3] = 255;
      }
    }

    // Sobel normal
    const strength = 3.5;
    for (let y = 0; y < size; y++) {
      const ym = (y - 1 + size) % size;
      const yp = (y + 1) % size;
      for (let x = 0; x < size; x++) {
        const xm = (x - 1 + size) % size;
        const xp = (x + 1) % size;

        const tl = heightMap[ym * size + xm];
        const tc = heightMap[ym * size + x];
        const tr = heightMap[ym * size + xp];
        const ml = heightMap[y * size + xm];
        const mr = heightMap[y * size + xp];
        const bl = heightMap[yp * size + xm];
        const bc = heightMap[yp * size + x];
        const br = heightMap[yp * size + xp];

        let nx = -((tr + 2 * mr + br) - (tl + 2 * ml + bl)) * strength;
        let ny = -((bl + 2 * bc + br) - (tl + 2 * tc + tr)) * strength;
        let nz = 1.0;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len; ny /= len; nz /= len;

        const pIdx = (y * size + x) * 4;
        imgNormal.data[pIdx + 0] = Math.floor((nx * 0.5 + 0.5) * 255);
        imgNormal.data[pIdx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        imgNormal.data[pIdx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        imgNormal.data[pIdx + 3] = 255;
      }
    }

    ctxColor.putImageData(imgColor, 0, 0);
    ctxNormal.putImageData(imgNormal, 0, 0);
    ctxRough.putImageData(imgRough, 0, 0);

    const tColor = new THREE.CanvasTexture(canvasColor);
    const tNormal = new THREE.CanvasTexture(canvasNormal);
    const tRough = new THREE.CanvasTexture(canvasRough);

    [tColor, tNormal, tRough].forEach(t => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 16;
    });
    tColor.colorSpace = THREE.SRGBColorSpace;

    return {
      map: tColor,
      normalMap: tNormal,
      roughnessMap: tRough,
      normalScale: new THREE.Vector2(1.0, 1.0)
    };
  }

  // Generate Weathered Bronze & Runes Textures for Central Relic
  generateRelicTextures(size = 512) {
    const canvasColor = document.createElement('canvas');
    canvasColor.width = size; canvasColor.height = size;
    const ctxColor = canvasColor.getContext('2d');

    const canvasMetal = document.createElement('canvas');
    canvasMetal.width = size; canvasMetal.height = size;
    const ctxMetal = canvasMetal.getContext('2d');

    const canvasRough = document.createElement('canvas');
    canvasRough.width = size; canvasRough.height = size;
    const ctxRough = canvasRough.getContext('2d');

    const canvasEmissive = document.createElement('canvas');
    canvasEmissive.width = size; canvasEmissive.height = size;
    const ctxEmissive = canvasEmissive.getContext('2d');

    // Base dark antique bronze / blackened titanium
    ctxColor.fillStyle = '#3a332a';
    ctxColor.fillRect(0, 0, size, size);

    // Brushed metal streaks
    ctxColor.fillStyle = 'rgba(212, 175, 55, 0.15)';
    for (let i = 0; i < 200; i++) {
      ctxColor.fillRect(0, Math.random() * size, size, 1 + Math.random() * 3);
    }

    // High metalness
    ctxMetal.fillStyle = '#e8e8e8';
    ctxMetal.fillRect(0, 0, size, size);

    // Roughness variation
    ctxRough.fillStyle = '#555555';
    ctxRough.fillRect(0, 0, size, size);
    ctxRough.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 150; i++) {
      ctxRough.fillRect(0, Math.random() * size, size, 2);
    }

    // Glowing ancient runic inscriptions
    ctxEmissive.fillStyle = '#000000';
    ctxEmissive.fillRect(0, 0, size, size);

    ctxEmissive.strokeStyle = '#ffaa33';
    ctxEmissive.lineWidth = 3;
    ctxEmissive.shadowColor = '#ff8800';
    ctxEmissive.shadowBlur = 10;

    // Draw intricate geometric runes
    const runeRows = 8;
    for (let r = 0; r < runeRows; r++) {
      const y = (r + 0.5) * (size / runeRows);
      ctxEmissive.beginPath();
      for (let x = 20; x < size; x += 40) {
        ctxEmissive.moveTo(x, y - 10);
        ctxEmissive.lineTo(x + 10, y + 10);
        ctxEmissive.lineTo(x + 20, y - 5);
        ctxEmissive.lineTo(x + 25, y + 5);
      }
      ctxEmissive.stroke();
    }

    const tColor = new THREE.CanvasTexture(canvasColor);
    const tMetal = new THREE.CanvasTexture(canvasMetal);
    const tRough = new THREE.CanvasTexture(canvasRough);
    const tEmissive = new THREE.CanvasTexture(canvasEmissive);

    tColor.colorSpace = THREE.SRGBColorSpace;
    tEmissive.colorSpace = THREE.SRGBColorSpace;

    return {
      map: tColor,
      metalnessMap: tMetal,
      roughnessMap: tRough,
      emissiveMap: tEmissive,
      metalness: 0.9,
      roughness: 0.35,
      emissive: new THREE.Color(0xff8c00),
      emissiveIntensity: 2.2
    };
  }
}
