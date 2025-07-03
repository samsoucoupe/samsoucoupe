// projects-space.js : Génération dynamique et animation des projets façon "soucoupe volante" dans l'espace

// Exemple de structure de projet (à compléter/éditer à ta guise)
const PROJECTS = [
  {
    title: "SAE Neko Corporation - Loup-Garou Online",
    description: "Implémentation complète du jeu 'Les Loups-Garous de Thiercelieux' en microservices. WebSocket, Angular, bots IA, Docker, CI/CD...",
    tech: ["Spring Boot", "Angular", "Docker", "WebSocket", "JWT", "PostgreSQL", "MongoDB", "Microservices", "DevOps", "Game Dev"],
    link: "https://github.com/your-username/sae-nekocorporation",
    media: [{type: "img", src: "assets/SAE 2025/nekoCORPV1.png", alt: "SAE Neko Corporation - Architecture"}],
    icon: "fas fa-users",
    color: "#ec4899"
  },

  {
    title: "Candy Crush UE Game",
    description: "Implémentation complète du jeu Candy Crush en HTML/CSS/JavaScript pur. Animations, score, gameplay fidèle.",
    tech: ["HTML5", "CSS3", "JavaScript", "Game Dev"],
    link: "https://samsoucoupe.github.io/Candy-Crush-bis/",
    media: [{type: "img", src: "assets/candy-crush/image.png", alt: "Candy Crush UE Game"}],
    icon: "fas fa-gamepad",
    color: "#f59e0b"
  },
  {
    title: "Velocity Olympiad - Game on Web 2024",
    description: "Jeu 3D Babylon.js pour Game on Web 2024. Olympic theme, 3D, TypeScript, WebGL.",
    tech: ["Babylon.js", "TypeScript", "WebGL", "3D Game"],
    link: "https://samsoucoupe.github.io/Velocity-Olympiad/",
    media: [{type: "video", src: "assets/GOW/2024/videogow2024.mp4", alt: "Velocity Olympiad"}],
    icon: "fas fa-trophy",
    color: "#6366f1"
  },
  {
    title: "Dreamland - Game on Web 2025",
    description: "Expérience immersive Babylon.js pour Game on Web 2025. Dreamland, 3D, progression game dev.",
    tech: ["Babylon.js", "TypeScript", "WebGL", "3D Game"],
    link: "https://samsoucoupe.github.io/GOW2025/",
    media: [
      {type: "video", src: "assets/GOW/2025/videogow2025.mp4", alt: "Dreamland video"},
      {type: "img", src: "assets/GOW/2025/iconweb.png", alt: "Dreamland - Icône Web"}
    ],
    icon: "fas fa-magic",
    color: "#10b981"
  },
  {
    title: "Application Angular - DS4H MIAGE",
    description: "Application web Angular pour le Master MIAGE. Bonnes pratiques frontend, TypeScript, HTML5, CSS3.",
    tech: ["Angular", "TypeScript", "HTML5", "CSS3"],
    link: "https://angular-m1s1-assignments-front.onrender.com/login",
    media: [{type: "img", src: "assets/angular/placeholder.jpg", alt: "Application Angular - DS4H MIAGE"}],
    icon: "fab fa-angular",
    color: "#c3002f"
  },
  {
    title: "Dashboard Analytics Power BI",
    description: "Tableau de bord interactif Power BI pour l'analyse business. SQL, Excel, visualisations avancées.",
    tech: ["Power BI", "SQL", "Excel"],
    link: null,
    media: [{type: "img", src: "assets/powerbi/placeholder.jpg", alt: "Dashboard Analytics Power BI"}],
    icon: "fas fa-chart-bar",
    color: "#f59e0b"
  }
];

// Génération dynamique des projets façon soucoupe volante
function createProjectUFO(project, idx) {
  const ufo = document.createElement('div');
  ufo.className = 'space-ufo';
  ufo.style.setProperty('--ufo-color', project.color || '#fff');
  ufo.style.zIndex = 10 + idx;
  ufo.style.animationDelay = (Math.random() * 2) + 's';

  ufo.innerHTML = `
    <div class="ufo-body">
      <span class="ufo-glow"></span>
      <span class="ufo-top"></span>
      <span class="ufo-window"><i class="${project.icon}"></i></span>
      <span class="ufo-bottom"></span>
    </div>
    <div class="ufo-beam"></div>
  `;
  // Click = ouvrir la modale projet
  ufo.addEventListener('click', e => {
    openProjectModal(project);
    e.stopPropagation();
  });
  return ufo;
}

function renderProjectsSpace() {
  const container = document.getElementById('ufo-projects-space');
  container.innerHTML = '';
  // Placement "spatial" : grille responsive + positions flottantes random
  const isMobile = window.innerWidth < 900;
  const perRow = isMobile ? 1 : 3;
  if (!isMobile) {
    container.style.position = 'relative';
    container.style.minHeight = `${Math.ceil(PROJECTS.length/perRow)*36+8}vh`;
    container.style.height = container.style.minHeight;
  } else {
    container.style.position = 'static';
    container.style.height = 'auto';
  }
  PROJECTS.forEach((project, idx) => {
    const ufo = createProjectUFO(project, idx);
    if (!isMobile) {
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      ufo.style.position = 'absolute';
      ufo.style.left = `calc(${10 + col * 30 + (Math.random()*8-4)}vw)`;
      ufo.style.top = `calc(${6 + row * 32 + (Math.random()*6-3)}vh)`;
    }
    container.appendChild(ufo);
  });
}

// MODALE PROJET
function openProjectModal(project) {
  const modal = document.getElementById('project-modal');
  const body = document.getElementById('project-modal-body');
  // Couleur dynamique pour la modale
  const color = project.color || '#0ff';
  body.innerHTML = `
    <style>
      #project-modal .project-modal-content {
        border-color: ${color} !important;
        box-shadow: 0 0 64px 8px ${color}55, 0 2px 32px #000a;
      }
      #project-modal .modal-project-content h2,
      #project-modal .modal-project-tech span,
      #project-modal .modal-project-link,
      #project-modal .close-modal {
        color: ${color} !important;
        border-color: ${color} !important;
      }
      #project-modal .modal-project-tech span {
        background: ${color}22 !important;
      }
      #project-modal .modal-project-media img,
      #project-modal .modal-project-media video {
        border-color: ${color} !important;
        box-shadow: 0 2px 12px ${color}33, 0 2px 16px #0007;
      }
    </style>
    <div class="modal-project-media">
      ${project.media.map(m => m.type === 'img' ? `<img src="${m.src}" alt="${m.alt}">` : `<video src="${m.src}" alt="${m.alt}" controls autoplay muted loop></video>`).join('')}
    </div>
    <div class="modal-project-content">
      <h2>${project.title}</h2>
      <p>${project.description}</p>
      <div class="modal-project-tech">${project.tech.map(t => `<span>${t}</span>`).join('')}</div>
      ${project.link ? `<a href="${project.link}" target="_blank" class="modal-project-link"><i class="fas fa-external-link-alt"></i> Voir le projet</a>` : ''}
    </div>
  `;
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('open'), 10);
}

// Fermer la modale
document.getElementById('close-project-modal').onclick = function() {
  const modal = document.getElementById('project-modal');
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = 'none'; }, 250);
};
// Fermer modale au clic dehors
document.getElementById('project-modal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('open');
    setTimeout(() => { this.style.display = 'none'; }, 250);
  }
});

document.addEventListener('DOMContentLoaded', renderProjectsSpace);

// (Optionnel) Mini-jeu Space Invader à ajouter ici plus tard
