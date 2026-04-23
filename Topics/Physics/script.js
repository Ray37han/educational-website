"use strict";

/*
  Physics Index - Three.js + Canvas Interactions
  - One hero 3D scene (floating particles + orbiting spheres)
  - Six lightweight Three.js card scenes
  - Three canvas-based mini simulations
  - Scroll reveal, sticky nav blur, button ripple
*/

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 760px)").matches;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const activeLoops = new Set();
let isPageVisible = true;

/* ------------------------ Utility ------------------------ */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function createRendererForCanvas(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(DPR);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

function resizeRenderer(renderer, camera, canvas) {
  const w = Math.max(1, canvas.clientWidth);
  const h = Math.max(1, canvas.clientHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function addLoop(fn) {
  activeLoops.add(fn);
}

function removeLoop(fn) {
  activeLoops.delete(fn);
}

function masterLoop(time) {
  if (isPageVisible) {
    activeLoops.forEach((fn) => fn(time));
  }
  requestAnimationFrame(masterLoop);
}

/* ------------------------ Navbar ------------------------ */
function initNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const toggleScrolled = () => {
    if (window.scrollY > 12) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };

  toggleScrolled();
  window.addEventListener("scroll", toggleScrolled, { passive: true });
}

/* ------------------------ Reveal ------------------------ */
function initReveal() {
  const revealNodes = document.querySelectorAll("[data-reveal]");
  if (!revealNodes.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
}

/* ------------------------ Search Filter ------------------------ */
function initCatalogSearch() {
  const input = document.getElementById("catalog-search");
  if (!input) return;

  const items = Array.from(
    document.querySelectorAll(".paper-card, .topic-card, .demo-card")
  );
  const sections = document.querySelectorAll(".paper-grid, .topics-grid, .demo-grid");

  const applyFilter = () => {
    const query = input.value.trim().toLowerCase();

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.hidden = Boolean(query) && !text.includes(query);
    });

    sections.forEach((section) => {
      const visibleCount = Array.from(section.children).filter((child) => !child.hidden).length;
      section.hidden = visibleCount === 0;
    });
  };

  input.addEventListener("input", applyFilter);
}

/* ------------------------ Ripple ------------------------ */
function initRippleButtons() {
  const buttons = document.querySelectorAll(".ripple-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ripple.className = "ripple";
      ripple.style.width = size + "px";
      ripple.style.height = size + "px";
      ripple.style.left = event.clientX - rect.left - size / 2 + "px";
      ripple.style.top = event.clientY - rect.top - size / 2 + "px";
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });
}

/* ------------------------ Hero Scene ------------------------ */
function initHeroScene() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !window.THREE) return;

  const renderer = createRendererForCanvas(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 140);
  camera.position.set(0, 1.2, 11);

  const ambient = new THREE.AmbientLight(0x9fb8ff, 0.7);
  scene.add(ambient);

  const pointA = new THREE.PointLight(0x6366f1, 3.6, 60, 1.8);
  pointA.position.set(5, 3, 4);
  scene.add(pointA);

  const pointB = new THREE.PointLight(0x22d3ee, 2.8, 70, 1.6);
  pointB.position.set(-6, -2, 3);
  scene.add(pointB);

  // Background particle cloud.
  const particleCount = isMobile ? 460 : 860;
  const pointsGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 38;
    positions[i3 + 1] = (Math.random() - 0.5) * 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 36;
    scales[i] = 0.45 + Math.random() * 1.4;
  }

  pointsGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointsGeom.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

  const pointsMat = new THREE.PointsMaterial({
    size: isMobile ? 0.045 : 0.058,
    color: 0x89ccff,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(pointsGeom, pointsMat);
  scene.add(points);

  // Orbiting low-poly spheres.
  const orbsGroup = new THREE.Group();
  scene.add(orbsGroup);

  const orbGeo = new THREE.IcosahedronGeometry(0.5, 0);
  const orbMats = [
    new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.28, metalness: 0.2 }),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.24, metalness: 0.18 }),
    new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.32, metalness: 0.14 })
  ];

  const orbiters = [];
  const orbCount = isMobile ? 4 : 8;
  for (let i = 0; i < orbCount; i++) {
    const mesh = new THREE.Mesh(orbGeo, orbMats[i % orbMats.length]);
    const radius = 2.8 + Math.random() * 5.4;
    const speed = 0.00017 + Math.random() * 0.00033;
    const phase = Math.random() * Math.PI * 2;
    const yDrift = (Math.random() - 0.5) * 2.6;

    orbiters.push({ mesh, radius, speed, phase, yDrift });
    orbsGroup.add(mesh);
  }

  function update(time) {
    const t = time || 0;

    points.rotation.y = t * 0.00004;
    points.rotation.x = Math.sin(t * 0.00007) * 0.08;

    orbiters.forEach((orb, idx) => {
      const angle = orb.phase + t * orb.speed * 80;
      orb.mesh.position.x = Math.cos(angle) * orb.radius;
      orb.mesh.position.z = Math.sin(angle) * orb.radius * 0.9;
      orb.mesh.position.y = Math.sin(angle * 1.7 + idx) * 0.65 + orb.yDrift;
      orb.mesh.rotation.x += 0.004;
      orb.mesh.rotation.y += 0.005;
    });

    camera.position.x = Math.sin(t * 0.0001) * 0.62;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function onResize() {
    resizeRenderer(renderer, camera, canvas);
  }

  onResize();
  window.addEventListener("resize", onResize);
  addLoop(update);
}

/* ------------------------ Topic Scenes ------------------------ */
function initTopicScene(canvas, setupFn) {
  const renderer = createRendererForCanvas(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  camera.position.set(0, 1.4, 5.1);

  const ambient = new THREE.AmbientLight(0xffffff, 0.66);
  const key = new THREE.PointLight(0x7c8dff, 1.8, 50);
  key.position.set(3.6, 4.2, 4.8);
  const fill = new THREE.PointLight(0x22d3ee, 1.2, 45);
  fill.position.set(-4, -1.2, 3.5);

  scene.add(ambient, key, fill);

  const animateState = setupFn(scene, camera, canvas);

  let isVisible = true;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
      });
    },
    { threshold: 0.1 }
  );
  observer.observe(canvas);

  function update(time) {
    if (!isVisible) return;
    animateState(time || 0, renderer, scene, camera);
  }

  function onResize() {
    resizeRenderer(renderer, camera, canvas);
  }

  onResize();
  window.addEventListener("resize", onResize);
  addLoop(update);
}

function setupMechanics(scene) {
  // Rotating cube represents motion in 3D space.
  const geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7c8dff,
    roughness: 0.26,
    metalness: 0.2
  });
  const cube = new THREE.Mesh(geo, mat);
  scene.add(cube);

  return (time, renderer, localScene, camera) => {
    cube.rotation.x = time * 0.00068;
    cube.rotation.y = time * 0.00105;
    cube.position.y = Math.sin(time * 0.001) * 0.18;
    renderer.render(localScene, camera);
  };
}

function setupThermodynamics(scene) {
  // Floating glowing particles represent heat agitation.
  const group = new THREE.Group();
  scene.add(group);

  const sphere = new THREE.SphereGeometry(0.08, 8, 8);
  const hot = new THREE.MeshBasicMaterial({ color: 0xff7b39 });
  const cool = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

  const count = isMobile ? 34 : 54;
  const particles = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(sphere, i % 2 ? hot : cool);
    m.position.set(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    group.add(m);
    particles.push({
      mesh: m,
      vx: (Math.random() - 0.5) * 0.012,
      vy: (Math.random() - 0.5) * 0.012,
      vz: (Math.random() - 0.5) * 0.012
    });
  }

  return (_, renderer, localScene, camera) => {
    particles.forEach((p) => {
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;

      if (Math.abs(p.mesh.position.x) > 1.65) p.vx *= -1;
      if (Math.abs(p.mesh.position.y) > 1.05) p.vy *= -1;
      if (Math.abs(p.mesh.position.z) > 1.25) p.vz *= -1;
    });

    group.rotation.y += 0.003;
    renderer.render(localScene, camera);
  };
}

function setupWaves(scene) {
  // Line geometry with animated y-values creates a sine wave.
  const points = new Array(80).fill(0).map((_, i) => {
    const x = -2.2 + (i / 79) * 4.4;
    return new THREE.Vector3(x, 0, 0);
  });

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x22d3ee });
  const line = new THREE.Line(geo, mat);
  scene.add(line);

  const buffer = geo.attributes.position.array;

  return (time, renderer, localScene, camera) => {
    for (let i = 0; i < points.length; i++) {
      const x = -2.2 + (i / 79) * 4.4;
      const y = Math.sin((x * 2.3) + time * 0.004) * 0.52;
      buffer[i * 3 + 1] = y;
    }
    geo.attributes.position.needsUpdate = true;
    renderer.render(localScene, camera);
  };
}

function setupOptics(scene) {
  // A beam enters prism and exits into split colors.
  const prismGeo = new THREE.ConeGeometry(0.62, 1.4, 3);
  const prismMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfe9ff,
    transparent: true,
    opacity: 0.65,
    roughness: 0.08,
    transmission: 0.78,
    thickness: 0.45
  });
  const prism = new THREE.Mesh(prismGeo, prismMat);
  prism.rotation.z = Math.PI;
  prism.rotation.y = Math.PI / 6;
  scene.add(prism);

  const beamInGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2.2, 0, 0),
    new THREE.Vector3(-0.5, 0, 0)
  ]);
  const beamIn = new THREE.Line(beamInGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));

  const beamR = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.42, 0.02, 0), new THREE.Vector3(2.2, 0.52, 0)]),
    new THREE.LineBasicMaterial({ color: 0xff5a5a })
  );
  const beamG = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.42, 0.02, 0), new THREE.Vector3(2.2, 0.12, 0)]),
    new THREE.LineBasicMaterial({ color: 0x5aff8a })
  );
  const beamB = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.42, 0.02, 0), new THREE.Vector3(2.2, -0.26, 0)]),
    new THREE.LineBasicMaterial({ color: 0x5aa8ff })
  );

  scene.add(beamIn, beamR, beamG, beamB);

  return (time, renderer, localScene, camera) => {
    const pulse = 0.45 + (Math.sin(time * 0.003) + 1) * 0.28;
    beamIn.material.opacity = pulse;
    beamIn.material.transparent = true;
    beamR.material.opacity = pulse;
    beamR.material.transparent = true;
    beamG.material.opacity = pulse;
    beamG.material.transparent = true;
    beamB.material.opacity = pulse;
    beamB.material.transparent = true;

    prism.rotation.y += 0.005;
    renderer.render(localScene, camera);
  };
}

function setupElectricity(scene) {
  // Jagged line with moving spark points suggests electric pulse.
  const linePoints = [];
  const segments = 32;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const x = -2 + t * 4;
    const y = (Math.random() - 0.5) * 0.5;
    linePoints.push(new THREE.Vector3(x, y, 0));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x7df9ff }));
  scene.add(line);

  const sparkGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xb3f8ff });
  const sparks = [];

  const sparkCount = isMobile ? 7 : 12;
  for (let i = 0; i < sparkCount; i++) {
    const s = new THREE.Mesh(sparkGeo, sparkMat);
    s.position.x = -2 + (i / sparkCount) * 4;
    scene.add(s);
    sparks.push({ mesh: s, phase: Math.random() * Math.PI * 2 });
  }

  return (time, renderer, localScene, camera) => {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < segments; i++) {
      const x = -2 + (i / (segments - 1)) * 4;
      arr[i * 3 + 1] = Math.sin((x * 6.2) + time * 0.014) * 0.22;
    }
    geo.attributes.position.needsUpdate = true;

    sparks.forEach((s, idx) => {
      const p = (time * 0.0012 + idx * 0.13 + s.phase) % 1;
      s.mesh.position.x = -2 + p * 4;
      s.mesh.position.y = Math.sin((s.mesh.position.x * 6.2) + time * 0.014) * 0.22;
    });

    renderer.render(localScene, camera);
  };
}

function setupModern(scene) {
  // Atom-like model: nucleus + two electron orbits.
  const nucleus = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.33, 0),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.2 })
  );
  scene.add(nucleus);

  const orbit1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.018, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  orbit1.rotation.x = Math.PI / 2.6;

  const orbit2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.018, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xa78bfa })
  );
  orbit2.rotation.y = Math.PI / 3.4;
  orbit2.rotation.x = Math.PI / 2.2;

  scene.add(orbit1, orbit2);

  const electronGeo = new THREE.SphereGeometry(0.08, 10, 10);
  const electronA = new THREE.Mesh(electronGeo, new THREE.MeshBasicMaterial({ color: 0x8ffcff }));
  const electronB = new THREE.Mesh(electronGeo, new THREE.MeshBasicMaterial({ color: 0xd8b4fe }));
  scene.add(electronA, electronB);

  return (time, renderer, localScene, camera) => {
    const t = time * 0.0014;
    electronA.position.set(Math.cos(t) * 1.2, Math.sin(t) * 0.62, Math.sin(t) * 0.95);
    electronB.position.set(Math.cos(-t * 1.2 + 1.8) * 1.2, Math.sin(-t * 1.2 + 1.8) * 0.72, Math.sin(-t * 1.2 + 1.8) * -0.95);

    nucleus.rotation.x += 0.011;
    nucleus.rotation.y += 0.01;
    orbit1.rotation.z += 0.005;
    orbit2.rotation.z -= 0.007;

    renderer.render(localScene, camera);
  };
}

function setupPaperFirst(scene) {
  // First paper block: chapter-node orbit around a central hub.
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45, 0),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.2 })
  );
  scene.add(core);

  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.8, 0.02, 8, 90),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  orbitRing.rotation.x = Math.PI / 2.3;
  scene.add(orbitRing);

  const nodeGeo = new THREE.SphereGeometry(0.11, 10, 10);
  const nodes = [];
  const nodeCount = isMobile ? 6 : 10;

  for (let i = 0; i < nodeCount; i++) {
    const node = new THREE.Mesh(
      nodeGeo,
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x7dd3fc : 0xa78bfa })
    );
    scene.add(node);
    nodes.push({ mesh: node, phase: (i / nodeCount) * Math.PI * 2 });
  }

  return (time, renderer, localScene, camera) => {
    const t = time * 0.001;
    core.rotation.x += 0.01;
    core.rotation.y += 0.012;
    orbitRing.rotation.z += 0.003;

    nodes.forEach((n, idx) => {
      const angle = n.phase + t * (0.6 + idx * 0.015);
      n.mesh.position.x = Math.cos(angle) * 1.8;
      n.mesh.position.z = Math.sin(angle) * 1.3;
      n.mesh.position.y = Math.sin(angle * 2.2 + idx * 0.2) * 0.42;
    });

    renderer.render(localScene, camera);
  };
}

function setupPaperSecond(scene) {
  // Second paper block: electromagnetic-like pulse ring and spark line.
  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.045, 10, 110),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.2, metalness: 0.15 })
  );
  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(1.8, 0.03, 10, 110),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.22, metalness: 0.14 })
  );

  ringA.rotation.x = Math.PI / 2;
  ringB.rotation.y = Math.PI / 2.8;
  scene.add(ringA, ringB);

  const pulsePoints = [];
  const seg = 44;
  for (let i = 0; i < seg; i++) {
    const x = -2 + (i / (seg - 1)) * 4;
    pulsePoints.push(new THREE.Vector3(x, 0, 0));
  }
  const pulseGeo = new THREE.BufferGeometry().setFromPoints(pulsePoints);
  const pulseLine = new THREE.Line(pulseGeo, new THREE.LineBasicMaterial({ color: 0x7dd3fc }));
  pulseLine.position.y = -0.8;
  scene.add(pulseLine);

  return (time, renderer, localScene, camera) => {
    const t = time * 0.0036;
    ringA.rotation.z += 0.011;
    ringB.rotation.x -= 0.009;

    const arr = pulseGeo.attributes.position.array;
    for (let i = 0; i < seg; i++) {
      const x = -2 + (i / (seg - 1)) * 4;
      arr[i * 3 + 1] = Math.sin((x * 5.6) + t * 1.7) * 0.18;
    }
    pulseGeo.attributes.position.needsUpdate = true;

    renderer.render(localScene, camera);
  };
}

function initPaperScenes() {
  const map = {
    "paper-first-canvas": setupPaperFirst,
    "paper-second-canvas": setupPaperSecond
  };

  Object.entries(map).forEach(([id, setup]) => {
    const canvas = document.getElementById(id);
    if (canvas) {
      initTopicScene(canvas, setup);
    }
  });
}

function initTopicScenes() {
  const map = {
    "topic-mechanics": setupMechanics,
    "topic-thermodynamics": setupThermodynamics,
    "topic-waves": setupWaves,
    "topic-optics": setupOptics,
    "topic-electricity": setupElectricity,
    "topic-modern": setupModern
  };

  Object.entries(map).forEach(([id, setup]) => {
    const canvas = document.getElementById(id);
    if (canvas) {
      initTopicScene(canvas, setup);
    }
  });
}

/* ------------------------ Demo: Pendulum ------------------------ */
function initPendulumDemo() {
  const canvas = document.getElementById("pendulum-canvas");
  const toggleBtn = document.getElementById("pendulum-toggle");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let running = true;

  const state = {
    theta: Math.PI / 3.2,
    omega: 0,
    length: 94,
    gravity: 0.86,
    damping: 0.997
  };

  toggleBtn?.addEventListener("click", () => {
    running = !running;
    toggleBtn.textContent = running ? "Pause" : "Resume";
  });

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const ox = w / 2;
    const oy = 30;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b1224";
    ctx.fillRect(0, 0, w, h);

    if (running && !prefersReducedMotion) {
      const alpha = -(state.gravity / state.length) * Math.sin(state.theta);
      state.omega += alpha;
      state.omega *= state.damping;
      state.theta += state.omega;
    }

    const bx = ox + state.length * Math.sin(state.theta) * 1.8;
    const by = oy + state.length * Math.cos(state.theta) * 1.8;

    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(bx, by);
    ctx.stroke();

    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(bx, by, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(ox, oy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  addLoop(() => draw());
}

/* ------------------------ Demo: Projectile ------------------------ */
function initProjectileDemo() {
  const canvas = document.getElementById("projectile-canvas");
  const resetBtn = document.getElementById("projectile-reset");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let projectile = null;

  function resetProjectile() {
    projectile = {
      x: 30,
      y: canvas.height - 24,
      vx: 0,
      vy: 0,
      active: false
    };
  }

  function launch(targetX, targetY) {
    const dx = targetX - projectile.x;
    const dy = targetY - projectile.y;
    const angle = Math.atan2(dy, dx);
    const speed = clamp(Math.hypot(dx, dy) * 0.045, 5, 12);

    projectile.vx = speed * Math.cos(angle);
    projectile.vy = speed * Math.sin(angle);
    projectile.active = true;
  }

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    launch(x, y);
  });

  resetBtn?.addEventListener("click", resetProjectile);

  function drawGrid() {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b1224";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 8);
    ctx.lineTo(canvas.width, canvas.height - 8);
    ctx.stroke();

    if (projectile.active && !prefersReducedMotion) {
      projectile.vy += 0.25;
      projectile.x += projectile.vx;
      projectile.y += projectile.vy;

      if (projectile.y > canvas.height - 22 || projectile.x > canvas.width + 20 || projectile.x < -20) {
        projectile.active = false;
      }
    }

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  resetProjectile();
  addLoop(() => draw());
}

/* ------------------------ Demo: Wave ------------------------ */
function initWaveDemo() {
  const canvas = document.getElementById("wave-canvas");
  const speedInput = document.getElementById("wave-speed");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  function draw(time) {
    const t = (time || 0) * 0.002 * (parseFloat(speedInput?.value || "1.2"));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b1224";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#22d3ee";
    ctx.beginPath();

    for (let x = 0; x <= canvas.width; x++) {
      const y = canvas.height / 2 + Math.sin((x * 0.04) - t * 2.6) * 30;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  addLoop((time) => draw(time));
}

/* ------------------------ Bootstrap ------------------------ */
function initVisibilityControl() {
  document.addEventListener("visibilitychange", () => {
    isPageVisible = !document.hidden;
  });
}

function init() {
  initVisibilityControl();
  initNavbar();
  initReveal();
  initRippleButtons();
  initCatalogSearch();

  initHeroScene();
  initPaperScenes();
  initTopicScenes();

  initPendulumDemo();
  initProjectileDemo();
  initWaveDemo();

  requestAnimationFrame(masterLoop);
}

window.addEventListener("load", init);
