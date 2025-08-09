document.addEventListener('DOMContentLoaded', () => {
    const PROJECTS = [
        {
            title: "SAE Neko Corporation - Loup-Garou Online",
            description: "Implémentation complète du jeu 'Les Loups-Garous de Thiercelieux' en microservices. WebSocket, Angular, bots IA, Docker, CI/CD...",
            tech: ["Spring Boot", "Angular", "Docker", "WebSocket", "JWT", "PostgreSQL", "MongoDB", "Microservices", "DevOps", "Game Dev"],
            media: [{type: "img", src: "assets/SAE 2025/nekoCORPV1.png", alt: "SAE Neko Corporation - Architecture"},{type: "youtube", src: "https://youtu.be/fy7tetjotq8", alt: "Video demo"}],
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
            icon: "fab fa-angular",
            color: "#c3002f"
        },
        {
            title: "Dashboard Analytics Power BI",
            description: "Tableau de bord interactif Power BI pour l'analyse business. SQL, Excel, visualisations avancées.",
            tech: ["Power BI", "SQL", "Excel"],
            link: null,
            icon: "fas fa-chart-bar",
            color: "#f59e0b"
        }
    ];

    function createProjectCard(project, idx) {
        let mediaHtml = '';
        if (project.media && project.media.length > 1) {
            // Carrousel avec flèches
            const mediaItems = project.media.map((m, i) => {
                if (m.type === 'img') {
                    return `<div class="media-item${i === 0 ? ' active' : ''}"><img src="${m.src}" alt="${m.alt}"></div>`;
                } else if (m.type === 'video') {
                    return `<div class="media-item${i === 0 ? ' active' : ''}"><video controls><source src="${m.src}" type="video/mp4">Votre navigateur ne supporte pas la lecture de vidéos.</video></div>`;
                } else if (m.type === 'youtube') {
                    // Bouton stylé avec icône YouTube
                    return `<div class="media-item${i === 0 ? ' active' : ''}"><button class='youtube-btn' onclick="window.open('${m.src}', '_blank')"><i class='fab fa-youtube'></i> Voir la vidéo YouTube</button></div>`;
                }
                return '';
            }).join('');
            mediaHtml = `
                <div class="project-media">
                    <button class="carousel-btn prev" onclick="changeMedia(this, -1)"><i class="fas fa-chevron-left"></i></button>
                    <div class="media-carousel">${mediaItems}</div>
                    <button class="carousel-btn next" onclick="changeMedia(this, 1)"><i class="fas fa-chevron-right"></i></button>
                </div>
            `;
        } else if (project.media && project.media.length === 1) {
            const m = project.media[0];
            if (m.type === 'img') {
                mediaHtml = `<div class="project-media"><div class="media-carousel"><div class="media-item active"><img src="${m.src}" alt="${m.alt}"></div></div></div>`;
            } else if (m.type === 'video') {
                mediaHtml = `<div class="project-media"><div class="media-carousel"><div class="media-item active"><video controls><source src="${m.src}" type="video/mp4">Votre navigateur ne supporte pas la lecture de vidéos.</video></div></div></div>`;
            } else if (m.type === 'youtube') {
                // Remplacement de l'iframe par un bouton
                mediaHtml = `<div class="project-media"><div class="media-carousel"><div class="media-item active"><button class='youtube-btn' onclick=\"window.open('${m.src}', '_blank')\">Voir la vidéo YouTube</button></div></div></div>`;
            }
        }
        // Icône projet
        const icon = project.icon ? `<i class="${project.icon}"></i>` : '';
        // Lien projet
        const link = project.link ? `<a href="${project.link}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i></a>` : '';
        // Tech tags
        const techTags = project.tech.map(t => `<span class="tech-tag">${t}</span>`).join('');

        return `
        <div class="project-card">
            <div class="project-header">
                <div class="project-icon">${icon}</div>
                <div class="project-actions">${link}</div>
            </div>
            ${mediaHtml}
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tech">${techTags}</div>
        </div>
        `;
    }

    function renderProjectsGrid() {
        const container = document.getElementById('ufo-projects-space');
        container.className = 'projects-grid';
        container.innerHTML = PROJECTS.map(createProjectCard).join('');
    }

    // Carrousel médias (simple, sans dépendance)
    window.changeMedia = function(btn, dir) {
        const carousel = btn.parentElement.querySelector('.media-carousel');
        if (!carousel) return;
        const items = carousel.querySelectorAll('.media-item');
        if (items.length <= 1) return;
        let idx = Array.from(items).findIndex(item => item.classList.contains('active'));
        items[idx].classList.remove('active');
        idx = (idx + dir + items.length) % items.length;
        items[idx].classList.add('active');
    };

    renderProjectsGrid();
    window.addEventListener('resize', renderProjectsGrid);
});
