// planet-background.js : plusieurs planètes animées, chacune liée à une section

const PLANETS = [
  {
    color: '#6366f1',
    shadow: '#6366f1aa',
    size: 320,
    section: '#home',
    offset: {x: 60, y: 30},
    freq: {x: 300, y: 400},
    amp: {x: 40, y: 20},
    scrollFactor: 0.15
  },
  {
    color: '#ec4899',
    shadow: '#ec4899aa',
    size: 180,
    section: '#about',
    offset: {x: 20, y: 80},
    freq: {x: 200, y: 350},
    amp: {x: 30, y: 18},
    scrollFactor: 0.10
  },
  {
    color: '#10b981',
    shadow: '#10b98199',
    size: 140,
    section: '#skills',
    offset: {x: 80, y: 60},
    freq: {x: 250, y: 500},
    amp: {x: 25, y: 15},
    scrollFactor: 0.12
  },
  {
    color: '#f59e0b',
    shadow: '#f59e0baa',
    size: 110,
    section: '#projects',
    offset: {x: 40, y: 120},
    freq: {x: 180, y: 300},
    amp: {x: 20, y: 10},
    scrollFactor: 0.09
  }
];

const planetDivs = PLANETS.map((p, i) => {
  const d = document.createElement('div');
  d.className = 'planet-bg-multi';
  d.style.width = d.style.height = p.size + 'px';
  d.style.background = `radial-gradient(circle at 60% 40%, ${p.color} 60%, #232946 100%)`;
  d.style.boxShadow = `0 0 120px 40px ${p.shadow}, 0 0 320px 120px #23294688`;
  d.style.opacity = 0.45;
  d.style.zIndex = 0;
  d.style.position = 'fixed';
  d.style.pointerEvents = 'none';
  d.style.borderRadius = '50%';
  d.style.filter = 'blur(0.5px) saturate(1.2)';
  d.style.transition = 'opacity 0.5s';
  d.style.animation = 'planet-glow 8s ease-in-out infinite alternate';
  document.body.appendChild(d);
  return d;
});

function getSectionTop(section) {
  const el = document.querySelector(section);
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  return rect.top + window.scrollY;
}

function animatePlanets() {
  const scrollY = window.scrollY || window.pageYOffset;
  PLANETS.forEach((p, i) => {
    const sectionTop = getSectionTop(p.section);
    // Décale la planète selon la section et le scroll
    const y = p.offset.y + Math.cos((scrollY-sectionTop)/p.freq.y) * p.amp.y + (scrollY-sectionTop) * p.scrollFactor;
    const x = p.offset.x + Math.sin((scrollY-sectionTop)/p.freq.x) * p.amp.x;
    planetDivs[i].style.transform = `translate(-50%, -50%) translate(${x}vw, ${y}vh)`;
    // Fade in/out selon la proximité de la section
    const dist = Math.abs(scrollY + window.innerHeight/2 - (sectionTop + 200));
    planetDivs[i].style.opacity = dist < 700 ? 0.45 : 0;
  });
  requestAnimationFrame(animatePlanets);
}

animatePlanets();
