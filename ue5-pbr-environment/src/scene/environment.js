import * as THREE from 'three';

export class CathedralEnvironment {
  constructor(scene, pbrTextures) {
    this.scene = scene;
    this.textures = pbrTextures;
    this.animatedObjects = [];
    this.buildScene();
  }

  buildScene() {
    this.buildFloor();
    this.buildColumns();
    this.buildWallsAndWindows();
    this.buildCeilingVaults();
    this.buildCentralRelic();
    this.buildDaisAndAltar();
    this.buildBraziers();
    this.buildDebrisAndProps();
  }

  buildFloor() {
    const floorGeo = new THREE.PlaneGeometry(36, 60, 64, 64);
    
    // Repeat textures for high density detail
    const tFloor = this.textures.floor;
    tFloor.map.repeat.set(6, 10);
    tFloor.normalMap.repeat.set(6, 10);
    tFloor.roughnessMap.repeat.set(6, 10);
    tFloor.aoMap.repeat.set(6, 10);

    const floorMat = new THREE.MeshStandardMaterial({
      map: tFloor.map,
      normalMap: tFloor.normalMap,
      normalScale: new THREE.Vector2(1.5, 1.5),
      roughnessMap: tFloor.roughnessMap,
      roughness: 0.85,
      metalness: 0.1,
      aoMap: tFloor.aoMap,
      aoMapIntensity: 1.4,
      envMapIntensity: 1.8
    });

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);
    this.floorMesh = floorMesh;
  }

  buildColumns() {
    const tStone = this.textures.stone;
    tStone.map.repeat.set(2, 6);
    tStone.normalMap.repeat.set(2, 6);
    tStone.roughnessMap.repeat.set(2, 6);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: tStone.map,
      normalMap: tStone.normalMap,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughnessMap: tStone.roughnessMap,
      roughness: 0.8,
      metalness: 0.05,
      envMapIntensity: 0.8
    });

    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: new THREE.Color(0xff8c00),
      emissiveIntensity: 3.5,
      roughness: 0.3,
      metalness: 0.8
    });

    // Column positions along the nave
    const columnSpacingZ = 10;
    const columnOffsetX = 7.5;
    const numPairs = 5;

    for (let i = -2; i <= 2; i++) {
      const z = i * columnSpacingZ;
      this.createCompoundColumn(-columnOffsetX, z, stoneMat, runeMat);
      this.createCompoundColumn(columnOffsetX, z, stoneMat, runeMat);
    }
  }

  createCompoundColumn(x, z, stoneMat, runeMat) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Stepped plinth base
    const baseGeo1 = new THREE.BoxGeometry(2.8, 0.6, 2.8);
    const baseMesh1 = new THREE.Mesh(baseGeo1, stoneMat);
    baseMesh1.position.y = 0.3;
    baseMesh1.castShadow = true;
    baseMesh1.receiveShadow = true;
    group.add(baseMesh1);

    const baseGeo2 = new THREE.CylinderGeometry(1.25, 1.35, 0.8, 24);
    const baseMesh2 = new THREE.Mesh(baseGeo2, stoneMat);
    baseMesh2.position.y = 1.0;
    baseMesh2.castShadow = true;
    baseMesh2.receiveShadow = true;
    group.add(baseMesh2);

    // Main column shaft
    const shaftHeight = 12.0;
    const shaftGeo = new THREE.CylinderGeometry(0.95, 1.05, shaftHeight, 24);
    const shaftMesh = new THREE.Mesh(shaftGeo, stoneMat);
    shaftMesh.position.y = 1.4 + shaftHeight / 2;
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    group.add(shaftMesh);

    // Attached smaller decorative fluted colonnettes around the main shaft
    const numSubPillars = 6;
    for (let j = 0; j < numSubPillars; j++) {
      const ang = (j / numSubPillars) * Math.PI * 2;
      const subGeo = new THREE.CylinderGeometry(0.2, 0.22, shaftHeight - 0.5, 12);
      const subMesh = new THREE.Mesh(subGeo, stoneMat);
      subMesh.position.set(Math.cos(ang) * 1.08, 1.4 + (shaftHeight - 0.5) / 2, Math.sin(ang) * 1.08);
      subMesh.castShadow = true;
      group.add(subMesh);
    }

    // Glowing runic vertical panel embedded into column facing central aisle
    const runePanelGeo = new THREE.PlaneGeometry(0.35, 4.0);
    const runePanel = new THREE.Mesh(runePanelGeo, runeMat);
    // Face towards aisle
    const dir = x < 0 ? 1 : -1;
    runePanel.position.set(dir * 1.08, 3.8, 0);
    runePanel.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(runePanel);

    // Capital at the top
    const capGeo1 = new THREE.CylinderGeometry(1.4, 0.95, 1.0, 24);
    const capMesh1 = new THREE.Mesh(capGeo1, stoneMat);
    capMesh1.position.y = 1.4 + shaftHeight + 0.5;
    capMesh1.castShadow = true;
    group.add(capMesh1);

    const capGeo2 = new THREE.BoxGeometry(2.6, 0.6, 2.6);
    const capMesh2 = new THREE.Mesh(capGeo2, stoneMat);
    capMesh2.position.y = 1.4 + shaftHeight + 1.2;
    capMesh2.castShadow = true;
    group.add(capMesh2);

    this.scene.add(group);
  }

  buildWallsAndWindows() {
    const wallMat = new THREE.MeshStandardMaterial({
      map: this.textures.stone.map,
      normalMap: this.textures.stone.normalMap,
      roughness: 0.88,
      metalness: 0.02
    });

    // Outer Side Walls
    const wallHeight = 16.0;
    const wallDepth = 60.0;

    // Left wall with window cutouts
    const leftWallGeo = new THREE.BoxGeometry(1.5, wallHeight, wallDepth);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-15, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Right wall
    const rightWall = leftWall.clone();
    rightWall.position.x = 15;
    this.scene.add(rightWall);

    // Back apse wall
    const backWallGeo = new THREE.BoxGeometry(30, wallHeight, 1.5);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, wallHeight / 2, -28);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Front wall / entrance
    const frontWall = backWall.clone();
    frontWall.position.z = 28;
    this.scene.add(frontWall);

    // Gothic Arched Clerestory Windows with warm sunlight glow
    const winGeo = new THREE.BoxGeometry(0.2, 5.5, 2.8);
    const winMat = new THREE.MeshBasicMaterial({
      color: 0xfff0d0
    });

    for (let i = -2; i <= 2; i++) {
      const z = i * 10;
      // High right windows (where sunlight penetrates)
      const winRight = new THREE.Mesh(winGeo, winMat);
      winRight.position.set(14.2, 11.5, z);
      this.scene.add(winRight);
    }
  }

  buildCeilingVaults() {
    const archMat = new THREE.MeshStandardMaterial({
      map: this.textures.stone.map,
      normalMap: this.textures.stone.normalMap,
      roughness: 0.85,
      metalness: 0.05
    });

    // Ribbed transverse arches bridging the nave
    const columnSpacingZ = 10;
    for (let i = -2; i <= 2; i++) {
      const z = i * columnSpacingZ;
      const archCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-7.5, 14.5, z),
        new THREE.Vector3(0, 19.5, z),
        new THREE.Vector3(7.5, 14.5, z)
      );
      const tubeGeo = new THREE.TubeGeometry(archCurve, 32, 0.55, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, archMat);
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      this.scene.add(tubeMesh);
    }

    // Longitudinal ridge rib down the center
    const ridgeGeo = new THREE.CylinderGeometry(0.4, 0.4, 56, 12);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, archMat);
    ridgeMesh.rotation.x = Math.PI / 2;
    ridgeMesh.position.set(0, 19.2, 0);
    this.scene.add(ridgeMesh);

    // Ceiling vault webbing panels
    const ceilingGeo = new THREE.PlaneGeometry(28, 56, 32, 32);
    // Deform ceiling to form peaked vault
    const pos = ceilingGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const curveY = 19.0 - (Math.abs(x) / 14.0) * 4.5;
      pos.setZ(i, -curveY);
    }
    ceilingGeo.computeVertexNormals();

    const ceilingMesh = new THREE.Mesh(ceilingGeo, archMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.receiveShadow = true;
    this.scene.add(ceilingMesh);
  }

  buildCentralRelic() {
    const relicGroup = new THREE.Group();
    relicGroup.position.set(0, 6.5, -6);

    const relicMat = new THREE.MeshStandardMaterial({
      map: this.textures.relic.map,
      metalnessMap: this.textures.relic.metalnessMap,
      roughnessMap: this.textures.relic.roughnessMap,
      metalness: this.textures.relic.metalness,
      roughness: this.textures.relic.roughness,
      envMapIntensity: 2.5
    });

    const runeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: new THREE.Color(0xff7700),
      emissiveIntensity: 4.0,
      roughness: 0.2,
      metalness: 0.9
    });

    // 1. Concentric rotating mechanical gyroscopic rings
    const ring1Geo = new THREE.TorusGeometry(3.8, 0.25, 24, 64);
    const ring1 = new THREE.Mesh(ring1Geo, relicMat);
    relicGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.1, 0.22, 24, 64);
    const ring2 = new THREE.Mesh(ring2Geo, relicMat);
    relicGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(2.3, 0.2, 24, 64);
    const ring3 = new THREE.Mesh(ring3Geo, relicMat);
    relicGroup.add(ring3);

    // 2. Central Radiating Plasma Sun / Core
    const coreGeo = new THREE.SphereGeometry(1.15, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xff9900),
      emissiveIntensity: 5.5,
      roughness: 0.1,
      metalness: 0.1
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    relicGroup.add(coreMesh);

    // Core halo / energy cage (faceted icosahedron)
    const cageGeo = new THREE.IcosahedronGeometry(1.65, 1);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x332211,
      wireframe: true,
      emissive: new THREE.Color(0xffaa22),
      emissiveIntensity: 2.0
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    relicGroup.add(cageMesh);

    // 3. Floating runic obelisk pylon segments around the relic
    const numPylons = 8;
    const pylons = [];
    for (let p = 0; p < numPylons; p++) {
      const ang = (p / numPylons) * Math.PI * 2;
      const pylonGeo = new THREE.ConeGeometry(0.35, 1.8, 6);
      const pylonMesh = new THREE.Mesh(pylonGeo, relicMat);
      pylonMesh.position.set(Math.cos(ang) * 4.6, Math.sin(ang) * 4.6, 0);
      pylonMesh.rotation.z = ang - Math.PI / 2;
      relicGroup.add(pylonMesh);
      pylons.push({ mesh: pylonMesh, baseAngle: ang, radius: 4.6 });
    }

    this.scene.add(relicGroup);

    this.relic = {
      group: relicGroup,
      ring1,
      ring2,
      ring3,
      core: coreMesh,
      cage: cageMesh,
      pylons
    };

    this.animatedObjects.push((delta, time) => {
      // Rotation on multiple gyroscopic axes
      ring1.rotation.y = time * 0.45;
      ring1.rotation.x = Math.sin(time * 0.3) * 0.2;

      ring2.rotation.x = -time * 0.65;
      ring2.rotation.z = Math.cos(time * 0.4) * 0.3;

      ring3.rotation.y = time * 0.85;
      ring3.rotation.z = -time * 0.5;

      cageMesh.rotation.y = -time * 1.2;
      cageMesh.rotation.x = time * 0.8;

      // Subtle levitation bobbing
      relicGroup.position.y = 6.5 + Math.sin(time * 1.5) * 0.25;

      // Pulsating emissive intensity
      const pulse = 4.5 + Math.sin(time * 3.5) * 1.5;
      coreMat.emissiveIntensity = pulse;

      // Orbiting pylons
      pylons.forEach((p, idx) => {
        const currentAng = p.baseAngle + time * 0.25 * (idx % 2 === 0 ? 1 : -1);
        const r = p.radius + Math.sin(time * 2.0 + idx) * 0.2;
        p.mesh.position.set(Math.cos(currentAng) * r, Math.sin(currentAng) * r, Math.sin(time * 1.8 + idx) * 0.4);
      });
    });
  }

  buildDaisAndAltar() {
    const daisMat = new THREE.MeshStandardMaterial({
      map: this.textures.floor.map,
      normalMap: this.textures.floor.normalMap,
      roughnessMap: this.textures.floor.roughnessMap,
      roughness: 0.65,
      metalness: 0.1
    });

    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, 0, -6);

    // Stepped circular octagonal dais platform
    const step1 = new THREE.CylinderGeometry(7.0, 7.5, 0.4, 16);
    const step1Mesh = new THREE.Mesh(step1, daisMat);
    step1Mesh.position.y = 0.2;
    step1Mesh.receiveShadow = true;
    step1Mesh.castShadow = true;
    daisGroup.add(step1Mesh);

    const step2 = new THREE.CylinderGeometry(5.2, 5.5, 0.4, 16);
    const step2Mesh = new THREE.Mesh(step2, daisMat);
    step2Mesh.position.y = 0.6;
    step2Mesh.receiveShadow = true;
    step2Mesh.castShadow = true;
    daisGroup.add(step2Mesh);

    const step3 = new THREE.CylinderGeometry(3.6, 3.8, 0.4, 16);
    const step3Mesh = new THREE.Mesh(step3, daisMat);
    step3Mesh.position.y = 1.0;
    step3Mesh.receiveShadow = true;
    step3Mesh.castShadow = true;
    daisGroup.add(step3Mesh);

    // Weathered bronze / brass altar pedestal directly beneath the levitating relic
    const altarGeo = new THREE.CylinderGeometry(1.2, 1.6, 1.4, 12);
    const altarMat = new THREE.MeshStandardMaterial({
      map: this.textures.relic.map,
      metalness: 0.85,
      roughness: 0.4,
      normalMap: this.textures.stone.normalMap
    });
    const altarMesh = new THREE.Mesh(altarGeo, altarMat);
    altarMesh.position.y = 1.9;
    altarMesh.castShadow = true;
    altarMesh.receiveShadow = true;
    daisGroup.add(altarMesh);

    this.scene.add(daisGroup);
  }

  buildBraziers() {
    // Ancient ceremonial fire braziers flanking the sanctuary
    const positions = [
      [-4.5, -2],
      [4.5, -2],
      [-4.5, -10],
      [4.5, -10]
    ];

    const bronzeMat = new THREE.MeshStandardMaterial({
      map: this.textures.relic.map,
      metalness: 0.85,
      roughness: 0.45
    });

    const fireMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: new THREE.Color(0xff4400),
      emissiveIntensity: 4.0,
      roughness: 0.3
    });

    positions.forEach(([x, z]) => {
      const brazier = new THREE.Group();
      brazier.position.set(x, 0, z);

      // Pedestal stand
      const standGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.8, 12);
      const standMesh = new THREE.Mesh(standGeo, bronzeMat);
      standMesh.position.y = 0.9;
      standMesh.castShadow = true;
      brazier.add(standMesh);

      // Bowl
      const bowlGeo = new THREE.CylinderGeometry(0.9, 0.3, 0.6, 16);
      const bowlMesh = new THREE.Mesh(bowlGeo, bronzeMat);
      bowlMesh.position.y = 1.9;
      bowlMesh.castShadow = true;
      brazier.add(bowlMesh);

      // Glowing ember coal mass
      const emberGeo = new THREE.DodecahedronGeometry(0.45, 1);
      const emberMesh = new THREE.Mesh(emberGeo, fireMat);
      emberMesh.position.y = 2.1;
      brazier.add(emberMesh);

      this.scene.add(brazier);
    });
  }

  buildDebrisAndProps() {
    const debrisMat = new THREE.MeshStandardMaterial({
      map: this.textures.stone.map,
      normalMap: this.textures.stone.normalMap,
      roughness: 0.9,
      metalness: 0.05
    });

    // Scattered fallen blocks and rubble for environmental storytelling
    const rubblePositions = [
      { pos: [-3.2, 0.25, 4.0], size: [0.8, 0.5, 0.7], rot: 0.3 },
      { pos: [5.1, 0.2, 2.5], size: [0.6, 0.4, 0.9], rot: -0.5 },
      { pos: [-5.8, 0.3, -15.0], size: [1.1, 0.6, 0.8], rot: 0.8 },
      { pos: [6.2, 0.25, -16.5], size: [0.7, 0.5, 0.6], rot: 0.2 }
    ];

    rubblePositions.forEach(r => {
      const geo = new THREE.BoxGeometry(...r.size);
      const mesh = new THREE.Mesh(geo, debrisMat);
      mesh.position.set(...r.pos);
      mesh.rotation.y = r.rot;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });
  }

  update(delta, time) {
    this.animatedObjects.forEach(fn => fn(delta, time));
  }
}
