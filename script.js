const header = document.querySelector('.site-header');
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = document.querySelector('[data-nav-links]');
const previewTabs = document.querySelectorAll('[data-preview]');
const previewPanels = document.querySelectorAll('[data-panel]');
const previewAction = document.querySelector('[data-preview-action]');
const revealItems = document.querySelectorAll('.reveal');

const previewCycle = ['formula', 'code', 'graph'];
let previewIndex = 0;

const setActivePreview = (name) => {
  previewTabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.preview === name);
  });

  previewPanels.forEach((panel) => {
    panel.classList.toggle('is-visible', panel.dataset.panel === name);
  });
};

const openNav = () => {
  navLinks.classList.add('is-open');
  navToggle.setAttribute('aria-expanded', 'true');
};

const closeNav = () => {
  navLinks.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
};

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('is-open');
    if (isOpen) {
      closeNav();
      return;
    }
    openNav();
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 980) {
        closeNav();
      }
    });
  });
}

previewTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setActivePreview(tab.dataset.preview);
    previewIndex = previewCycle.indexOf(tab.dataset.preview);
  });
});

if (previewAction) {
  previewAction.addEventListener('click', () => {
    previewIndex = (previewIndex + 1) % previewCycle.length;
    setActivePreview(previewCycle[previewIndex]);
    previewAction.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.96)' },
        { transform: 'scale(1)' },
      ],
      { duration: 220, easing: 'ease-out' },
    );
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 },
);

revealItems.forEach((item) => observer.observe(item));

const updateHeader = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 20);
};

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const createParticles = () => {
  const background = document.querySelector('.hero-bg');
  if (!background) {
    return;
  }

  const count = window.innerWidth < 720 ? 12 : 20;
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    particle.className = 'hero-particle';

    const size = 4 + Math.random() * 7;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${55 + Math.random() * 40}%`;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.animationDuration = `${10 + Math.random() * 10}s`;
    particle.style.opacity = `${0.18 + Math.random() * 0.4}`;

    background.appendChild(particle);
  }
};

createParticles();
setActivePreview('formula');

const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
smoothScrollLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = targetId && document.querySelector(targetId);
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const pulseButtons = document.querySelectorAll('.btn, .preview-tab, .social-links a');
pulseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    button.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.97)' },
        { transform: 'scale(1)' },
      ],
      { duration: 180, easing: 'ease-out' },
    );
  });
});
