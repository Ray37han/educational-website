const isMobile = window.matchMedia("(max-width: 900px)").matches;
const scenes = [];
const clock = new THREE.Clock();
let pageVisible = !document.hidden;

function clampPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.8);
}

function createSceneForCanvas(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
  renderer.setPixelRatio(clampPixelRatio());

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x020617, 5, 14);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 1.2, 4.6);

  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  const key = new THREE.DirectionalLight(0x7dd3fc, 1.2);
  key.position.set(3, 3, 3);
  const rim = new THREE.DirectionalLight(0xa78bfa, 0.6);
  rim.position.set(-2.5, 2, -3);

  scene.add(ambient, key, rim);

  return { canvas, renderer, scene, camera, visible: true, update: null, onResize: null };
}

function fitSceneSize(entry) {
  const rect = entry.canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  if (entry.canvas.width !== width || entry.canvas.height !== height) {
    entry.renderer.setSize(width, height, false);
    entry.camera.aspect = width / height;
    entry.camera.updateProjectionMatrix();
    if (entry.onResize) {
      entry.onResize(width, height);
    }
  }
}

function setupHero(entry) {
  entry.camera.position.set(0, 0.8, 6);

  const stars = new THREE.BufferGeometry();
  const starCount = isMobile ? 280 : 520;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
  }

  stars.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const starField = new THREE.Points(
    stars,
    new THREE.PointsMaterial({ size: 0.03, color: 0x7dd3fc, transparent: true, opacity: 0.86 })
  );

  const wave = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 7, isMobile ? 26 : 50, isMobile ? 14 : 28),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.16 })
  );
  wave.rotation.x = -Math.PI / 2.35;
  wave.position.y = -1.9;

  entry.scene.add(starField, wave);

  entry.update = (t) => {
    starField.rotation.y += 0.0007;
    wave.rotation.z = Math.sin(t * 0.22) * 0.08;

    const arr = wave.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const y = arr[i + 1];
      arr[i + 2] = Math.sin(x * 0.95 + t * 1.4) * 0.12 + Math.cos(y * 1.2 + t * 1.1) * 0.1;
    }
    wave.geometry.attributes.position.needsUpdate = true;
  };
}

function setupMeasurement(entry) {
  const ruler = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 0.16, 0.58),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45 })
  );
  const slider = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.26, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.32 })
  );

  const tickGroup = new THREE.Group();
  const tickCount = 24;
  for (let i = 0; i < tickCount; i++) {
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, i % 5 === 0 ? 0.12 : 0.07, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
    );
    tick.position.set(-1.6 + i * (3.2 / (tickCount - 1)), 0.12, 0.28);
    tickGroup.add(tick);
  }

  entry.scene.add(ruler, slider, tickGroup);
  entry.camera.position.set(0, 1.15, 4.8);

  entry.update = (t) => {
    slider.position.x = Math.sin(t * 1.25) * 1.15;
    slider.position.y = 0.1 + Math.sin(t * 2.1) * 0.02;
    ruler.rotation.y = Math.sin(t * 0.46) * 0.15;
  };
}

function setupVector(entry) {
  const axis = new THREE.AxesHelper(1.8);
  const root = new THREE.Vector3(0, 0, 0);
  const iDir = new THREE.Vector3(1, 0.2, 0).normalize();
  const jDir = new THREE.Vector3(0.15, 1, 0.1).normalize();
  const kDir = new THREE.Vector3(0.2, 0.1, 1).normalize();

  const arrowI = new THREE.ArrowHelper(iDir, root, 1.45, 0x22d3ee, 0.24, 0.12);
  const arrowJ = new THREE.ArrowHelper(jDir, root, 1.2, 0xa78bfa, 0.24, 0.12);
  const arrowK = new THREE.ArrowHelper(kDir, root, 1, 0xf472b6, 0.2, 0.1);

  const resultDir = new THREE.Vector3(1.2, 0.9, 0.6).normalize();
  const resultArrow = new THREE.ArrowHelper(resultDir, root, 2, 0xf8fafc, 0.3, 0.15);

  entry.scene.add(axis, arrowI, arrowJ, arrowK, resultArrow);
  entry.camera.position.set(0.8, 1.7, 5.2);

  entry.update = (t) => {
    const len = 1.65 + Math.sin(t * 1.35) * 0.2;
    resultArrow.setLength(len, 0.3, 0.15);
    resultArrow.rotation.y += 0.008;
    entry.scene.rotation.y = Math.sin(t * 0.5) * 0.25;
  };
}

function setupKinematics(entry) {
  const points = [];
  const seg = isMobile ? 40 : 68;
  for (let i = 0; i <= seg; i++) {
    const x = -2 + (i / seg) * 4;
    const y = 0.45 * (1 - (x * x) / 4);
    points.push(new THREE.Vector3(x, y - 0.5, 0));
  }

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const trajectory = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x7dd3fc }));

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.35 })
  );

  const velocityArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.75, 0x22d3ee, 0.2, 0.1);
  entry.scene.add(trajectory, body, velocityArrow);
  entry.camera.position.set(0, 1.3, 5);

  entry.update = (t) => {
    const u = (Math.sin(t * 0.9) * 0.5 + 0.5) * seg;
    const i = Math.min(seg - 1, Math.max(0, Math.floor(u)));
    const a = points[i];
    const b = points[i + 1];

    body.position.copy(a);

    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    velocityArrow.position.copy(a);
    velocityArrow.setDirection(dir);
    velocityArrow.setLength(0.7, 0.2, 0.1);
  };
}

function setupNewtonian(entry) {
  const slope = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.12, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
  );
  slope.rotation.z = -0.45;

  const block = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.4, 0.48),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 })
  );

  const force = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xf97316, 0.22, 0.12);
  const normal = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.7, 0x22d3ee, 0.2, 0.1);

  entry.scene.add(slope, block, force, normal);
  entry.camera.position.set(0, 1.5, 5.1);

  entry.update = (t) => {
    const x = Math.sin(t * 0.9) * 0.95;
    block.position.set(x, x * -0.48 + 0.45, 0);
    block.rotation.y += 0.02;

    force.position.copy(block.position);
    normal.position.copy(block.position);

    force.setLength(0.72 + Math.sin(t * 2.4) * 0.3, 0.22, 0.11);
    normal.setLength(0.62 + Math.cos(t * 2.1) * 0.15, 0.2, 0.1);
  };
}

function setupWorkPowerEnergy(entry) {
  const bars = [];
  const xPos = [-0.9, 0, 0.9];

  xPos.forEach((x, i) => {
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 1.2, 20),
      new THREE.MeshStandardMaterial({ color: [0x22d3ee, 0x6366f1, 0xa78bfa][i], roughness: 0.3 })
    );
    bar.position.x = x;
    bar.position.y = 0.1;
    entry.scene.add(bar);
    bars.push(bar);
  });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.03, 10, 90),
    new THREE.MeshBasicMaterial({ color: 0xf8fafc })
  );
  ring.rotation.x = Math.PI / 2;
  entry.scene.add(ring);

  entry.camera.position.set(0, 1.2, 4.8);

  entry.update = (t) => {
    bars.forEach((bar, i) => {
      const s = 0.7 + Math.sin(t * 1.8 + i * 1.1) * 0.45;
      bar.scale.y = Math.max(0.25, s);
      bar.position.y = bar.scale.y * 0.3;
    });

    ring.rotation.z += 0.015;
  };
}

function setupGravitation(entry) {
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 28, 28),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.58, metalness: 0.05 })
  );

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4 })
  );

  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(1.8, 0.014, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
  );
  orbit.rotation.x = Math.PI / 2.2;

  entry.scene.add(planet, moon, orbit);
  entry.camera.position.set(0.2, 1.2, 5.1);

  entry.update = (t) => {
    planet.rotation.y += 0.007;
    const a = t * 0.9;
    moon.position.x = Math.cos(a) * 1.8;
    moon.position.z = Math.sin(a) * 1.35;
    moon.position.y = Math.sin(a * 1.8) * 0.38;
  };
}

function setupStructural(entry) {
  const group = new THREE.Group();
  const points = [];
  const size = 4;
  const gap = 0.52;

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0x93c5fd })
        );
        mesh.userData.base = new THREE.Vector3(
          (x - (size - 1) / 2) * gap,
          (y - (size - 1) / 2) * gap,
          (z - (size - 1) / 2) * gap
        );
        mesh.position.copy(mesh.userData.base);
        group.add(mesh);
        points.push(mesh);
      }
    }
  }

  const wire = new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(-1.1, -1.1, -1.1), new THREE.Vector3(1.1, 1.1, 1.1)), 0x22d3ee);
  entry.scene.add(group, wire);
  entry.camera.position.set(1.6, 1.35, 4.8);

  entry.update = (t) => {
    points.forEach((p, i) => {
      const b = p.userData.base;
      p.position.x = b.x + Math.sin(t * 2.1 + i * 0.18) * 0.03;
      p.position.y = b.y + Math.cos(t * 1.8 + i * 0.13) * 0.03;
      p.position.z = b.z + Math.sin(t * 2.5 + i * 0.11) * 0.03;
    });
    group.rotation.y += 0.005;
  };
}

function setupPeriodic(entry) {
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  top.position.y = 1;

  const bob = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.3 })
  );

  const rodGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0)]);
  const rod = new THREE.Line(rodGeo, new THREE.LineBasicMaterial({ color: 0xcbd5e1 }));

  entry.scene.add(top, bob, rod);
  entry.camera.position.set(0, 1.2, 4.8);

  entry.update = (t) => {
    const theta = Math.sin(t * 1.7) * 0.68;
    const length = 1.5;
    const x = Math.sin(theta) * length;
    const y = 1 - Math.cos(theta) * length;

    bob.position.set(x, y, 0);
    const arr = rod.geometry.attributes.position.array;
    arr[3] = x;
    arr[4] = y;
    arr[5] = 0;
    rod.geometry.attributes.position.needsUpdate = true;
  };
}

function setupWaves(entry) {
  const count = isMobile ? 84 : 130;
  const points = [];
  for (let i = 0; i < count; i++) {
    const x = -2.3 + (i / (count - 1)) * 4.6;
    points.push(new THREE.Vector3(x, 0, 0));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x22d3ee }));

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
  );

  entry.scene.add(line, marker);
  entry.camera.position.set(0, 1.1, 4.9);

  entry.update = (t) => {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const x = -2.3 + (i / (count - 1)) * 4.6;
      arr[i * 3 + 1] = Math.sin(x * 4 + t * 2.5) * 0.35;
    }
    geo.attributes.position.needsUpdate = true;

    const markerX = Math.sin(t * 0.95) * 2.1;
    marker.position.x = markerX;
    marker.position.y = Math.sin(markerX * 4 + t * 2.5) * 0.35;
  };
}

function setupGas(entry) {
  const box = new THREE.Box3(new THREE.Vector3(-1.4, -0.95, -0.8), new THREE.Vector3(1.4, 0.95, 0.8));
  const helper = new THREE.Box3Helper(box, 0x93c5fd);
  entry.scene.add(helper);

  const particles = [];
  const total = isMobile ? 30 : 50;
  for (let i = 0; i < total; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x22d3ee : 0xa78bfa })
    );

    m.position.set(
      THREE.MathUtils.randFloat(box.min.x, box.max.x),
      THREE.MathUtils.randFloat(box.min.y, box.max.y),
      THREE.MathUtils.randFloat(box.min.z, box.max.z)
    );

    m.userData.v = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(0.034),
      THREE.MathUtils.randFloatSpread(0.034),
      THREE.MathUtils.randFloatSpread(0.034)
    );

    entry.scene.add(m);
    particles.push(m);
  }

  entry.camera.position.set(0, 1.1, 4.6);

  entry.update = () => {
    particles.forEach((p) => {
      p.position.add(p.userData.v);

      if (p.position.x < box.min.x || p.position.x > box.max.x) p.userData.v.x *= -1;
      if (p.position.y < box.min.y || p.position.y > box.max.y) p.userData.v.y *= -1;
      if (p.position.z < box.min.z || p.position.z > box.max.z) p.userData.v.z *= -1;

      p.position.clamp(box.min, box.max);
    });
  };
}

function registerCanvas(id, setupFn) {
  const canvas = document.getElementById(id);
  if (!canvas) {
    return;
  }

  const entry = createSceneForCanvas(canvas);
  setupFn(entry);
  scenes.push(entry);
}

function initScenes() {
  registerCanvas("hero-canvas", setupHero);
  registerCanvas("ch1", setupMeasurement);
  registerCanvas("ch2", setupVector);
  registerCanvas("ch3", setupKinematics);
  registerCanvas("ch4", setupNewtonian);
  registerCanvas("ch5", setupWorkPowerEnergy);
  registerCanvas("ch6", setupGravitation);
  registerCanvas("ch7", setupStructural);
  registerCanvas("ch8", setupPeriodic);
  registerCanvas("ch9", setupWaves);
  registerCanvas("ch10", setupGas);
}

function initReveal() {
  const nodes = document.querySelectorAll("[data-reveal]");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  nodes.forEach((n) => obs.observe(n));
}

function initRipple() {
  document.querySelectorAll(".ripple-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

function initVisibility() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const scene = scenes.find((s) => s.canvas === entry.target);
        if (scene) {
          scene.visible = entry.isIntersecting;
        }
      });
    },
    { threshold: 0.02 }
  );

  scenes.forEach((scene) => observer.observe(scene.canvas));

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
  });
}

function animate() {
  const t = clock.getElapsedTime();

  if (pageVisible) {
    scenes.forEach((entry) => {
      if (!entry.visible) {
        return;
      }

      fitSceneSize(entry);
      if (entry.update) {
        entry.update(t);
      }
      entry.renderer.render(entry.scene, entry.camera);
    });
  }

  requestAnimationFrame(animate);
}

function init() {
  initReveal();
  initRipple();
  initScenes();
  initVisibility();
  animate();

  window.addEventListener("resize", () => {
    scenes.forEach((entry) => {
      entry.renderer.setPixelRatio(clampPixelRatio());
      fitSceneSize(entry);
    });
  });
}

init();
