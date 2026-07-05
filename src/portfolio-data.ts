/**
 * portfolio-data.ts
 * Toutes les données du portfolio, structurées en TS.
 * Utilisé par l'overlay holographique du cockpit.
 */

// Asset : Vite résout le path en dev et hashe en build
import avatarUrl from '../assets/pdpSamsoucoupe.gif';

export interface Identity {
    name: string;
    role: string;
    tagline: string;
    details: string;
    avatar: string;
    discord: string;
    github: string;
    bmc: string;
    kofi: string;
}

export interface Stat {
    number: string;
    label: string;
}

export interface About {
    title: string;
    subtitle: string;
    paragraphs: string[];
    stats: Stat[];
}

export interface SkillTag {
    label: string;
    cls: string;
}

export interface SkillCategory {
    icon: string;
    name: string;
    tags: SkillTag[];
}

export interface Skills {
    title: string;
    categories: SkillCategory[];
}

export interface ProjectMedia {
    type: 'img' | 'video' | 'youtube';
    src: string;
    alt: string;
}

export interface Project {
    title: string;
    description: string;
    tech: string[];
    media: ProjectMedia[];
    link: string | null;
    icon: string;
    color: string;
    status: string;
}

export interface Projects {
    title: string;
    items: Project[];
}

export interface Contact {
    title: string;
    description: string;
}

export interface Portfolio {
    identity: Identity;
    about: About;
    skills: Skills;
    projects: Projects;
    contact: Contact;
    statusLabels: Record<string, string>;
}

export const PORTFOLIO: Portfolio = {
    identity: {
        name: "samsoucoupe",
        role: "Développeur Backend à tendance Full Stack",
        tagline: "Passionné par le développement backend et les technologies de données.",
        details: "Spécialisé en Python, R, SQL avec une expertise en outils de data comme Excel et Power BI.",
        avatar: avatarUrl,
        discord: "https://discord.com/users/388993523715801088",
        github: "https://github.com/samsoucoupe",
        bmc: "https://buymeacoffee.com/samsoucoupe",
        kofi: "https://ko-fi.com/samsoucoupe"
    },
    about: {
        title: "À propos de moi",
        subtitle: "Développeur Backend passionné 🚀",
        paragraphs: [
            "Je suis un étudiant développeur français passionné par les technologies backend et la data science. Actuellement en apprentissage de l'IA et du développement backend, j'aime créer des solutions robustes et efficaces.",
            "Mon expertise se concentre sur le développement backend avec une approche full-stack, combinée à une solide maîtrise des outils de données comme Excel et Power BI. Je suis particulièrement à l'aise avec Python, R et SQL."
        ],
        stats: [
            { number: "15+", label: "Technologies maîtrisées" },
            { number: "Backend", label: "Spécialisation" },
            { number: "Data", label: "Passion" }
        ]
    },
    skills: {
        title: "Mes Compétences",
        categories: [
            {
                icon: "fas fa-server",
                name: "Backend & Langages",
                tags: [
                    { label: "Python", cls: "python" },
                    { label: "Java", cls: "java" },
                    { label: "Go", cls: "go" },
                    { label: "Kotlin", cls: "kotlin" },
                    { label: "C", cls: "c" },
                    { label: "R", cls: "r" },
                    { label: "SQL", cls: "sql" }
                ]
            },
            {
                icon: "fas fa-code",
                name: "Frameworks & APIs",
                tags: [
                    { label: "Spring", cls: "spring" },
                    { label: "Flask", cls: "flask" },
                    { label: "Angular", cls: "angular" },
                    { label: "GraphQL", cls: "graphql" },
                    { label: "Swagger", cls: "swagger" }
                ]
            },
            {
                icon: "fas fa-brain",
                name: "Data Science & IA",
                tags: [
                    { label: "Pandas", cls: "pandas" },
                    { label: "NumPy", cls: "numpy" },
                    { label: "Scikit-learn", cls: "sklearn" },
                    { label: "PyTorch", cls: "pytorch" },
                    { label: "TensorFlow", cls: "tensorflow" },
                    { label: "OpenCV", cls: "opencv" },
                    { label: "Matplotlib", cls: "matplotlib" },
                    { label: "Plotly", cls: "plotly" },
                    { label: "SciPy", cls: "scipy" }
                ]
            },
            {
                icon: "fas fa-chart-line",
                name: "Outils Data & BI",
                tags: [
                    { label: "Power BI", cls: "powerbi" },
                    { label: "Excel", cls: "excel" },
                    { label: "MongoDB", cls: "mongodb" }
                ]
            },
            {
                icon: "fas fa-laptop-code",
                name: "Frontend & Web",
                tags: [
                    { label: "HTML5", cls: "html" },
                    { label: "CSS3", cls: "css" },
                    { label: "JavaScript", cls: "js" },
                    { label: "TypeScript", cls: "typescript" },
                    { label: "Babylon.js", cls: "babylonjs" },
                    { label: "Markdown", cls: "markdown" }
                ]
            },
            {
                icon: "fas fa-gamepad",
                name: "Game Development",
                tags: [
                    { label: "Babylon.js", cls: "babylonjs" },
                    { label: "WebGL", cls: "webgl" },
                    { label: "Game Design", cls: "gamedev" },
                    { label: "JavaScript Games", cls: "js" }
                ]
            },
            {
                icon: "fas fa-tools",
                name: "DevOps & Outils",
                tags: [
                    { label: "Docker", cls: "docker" },
                    { label: "Git", cls: "git" },
                    { label: "GitHub Actions", cls: "github" },
                    { label: "Render", cls: "render" }
                ]
            }
        ]
    },
    projects: {
        title: "Projets",
        items: [
            {
                title: "SAE Neko Corporation - Loup-Garou Online",
                description: "Implémentation complète du jeu 'Les Loups-Garous de Thiercelieux' en microservices. WebSocket, Angular, bots IA, Docker, CI/CD...",
                tech: ["Spring Boot", "Angular", "Docker", "WebSocket", "JWT", "PostgreSQL", "MongoDB", "Microservices", "DevOps", "Game Dev"],
                media: [
                    { type: "img", src: "assets/SAE 2025/nekoCORPV1.png", alt: "SAE Neko Corporation - Architecture" },
                    { type: "youtube", src: "https://youtu.be/fy7tetjotq8", alt: "Video demo" }
                ],
                link: null,
                icon: "fas fa-users",
                color: "#ec4899",
                status: "terminée"
            },
            {
                title: "Candy Crush UE Game",
                description: "Implémentation complète du jeu Candy Crush en HTML/CSS/JavaScript pur. Animations, score, gameplay fidèle.",
                tech: ["HTML5", "CSS3", "JavaScript", "Game Dev"],
                link: "https://samsoucoupe.github.io/Candy-Crush-bis/",
                media: [{ type: "img", src: "assets/candy-crush/image.png", alt: "Candy Crush UE Game" }],
                icon: "fas fa-gamepad",
                color: "#f59e0b",
                status: "terminée"
            },
            {
                title: "Velocity Olympiad - Game on Web 2024",
                description: "Jeu 3D Babylon.js pour Game on Web 2024. Olympic theme, 3D, TypeScript, WebGL.",
                tech: ["Babylon.js", "TypeScript", "WebGL", "3D Game"],
                link: "https://samsoucoupe.github.io/Velocity-Olympiad/",
                media: [{ type: "video", src: "assets/GOW/2024/videogow2024.mp4", alt: "Velocity Olympiad" }],
                icon: "fas fa-trophy",
                color: "#6366f1",
                status: "archivé"
            },
            {
                title: "Dreamland - Game on Web 2025",
                description: "Expérience immersive Babylon.js pour Game on Web 2025. Dreamland, 3D, progression game dev.",
                tech: ["Babylon.js", "TypeScript", "WebGL", "3D Game"],
                link: "https://samsoucoupe.github.io/GOW2025/",
                media: [
                    { type: "video", src: "assets/GOW/2025/videogow2025.mp4", alt: "Dreamland video" },
                    { type: "img", src: "assets/GOW/2025/iconweb.png", alt: "Dreamland - Icône Web" }
                ],
                icon: "fas fa-magic",
                color: "#10b981",
                status: "actif"
            },
            {
                title: "Application Angular - DS4H MIAGE",
                description: "Application web Angular pour le Master MIAGE. Bonnes pratiques frontend, TypeScript, HTML5, CSS3.",
                tech: ["Angular", "TypeScript", "HTML5", "CSS3"],
                link: "https://angular-m1s1-assignments-front.onrender.com/login",
                media: [],
                icon: "fab fa-angular",
                color: "#c3002f",
                status: "terminée"
            },
            {
                title: "Dashboard Analytics Power BI",
                description: "Tableau de bord interactif Power BI pour l'analyse business. SQL, Excel, visualisations avancées.",
                tech: ["Power BI", "SQL", "Excel"],
                link: null,
                media: [],
                icon: "fas fa-chart-bar",
                color: "#f59e0b",
                status: "terminée"
            }
        ]
    },
    contact: {
        title: "Restons en contact",
        description: "N'hésitez pas à me contacter pour discuter de projets, d'opportunités ou simplement pour échanger !"
    },
    statusLabels: {
        'terminée': 'TERMINÉE',
        'actif': 'ACTIF',
        'archivé': 'ARCHIVÉ',
        'en cours': 'EN COURS'
    }
};

// Rétro-compatibilité : les scripts non-module qui liraient window.PORTFOLIO
declare global {
    interface Window {
        PORTFOLIO: Portfolio;
    }
}
window.PORTFOLIO = PORTFOLIO;
