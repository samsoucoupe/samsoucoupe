/**
 * portfolio-data.ts
 * Toutes les données du portfolio, structurées en TS.
 * Utilisé par l'overlay holographique du cockpit.
 */

// Asset statique servi depuis public/assets/
const avatarUrl = 'assets/pdpSamsoucoupe.gif';

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
    type: 'img' | 'video' | 'youtube' | 'text';
    src: string;
    alt: string;
    label?: string;
    link?: string;
}

export interface Project {
    title: string;
    description: string;
    contribution: string[];
    choices: string[];
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
        role: "Développeur backend & full-stack",
        tagline: "Je conçois des applications web robustes, des API et des architectures orientées données.",
        details: "De la conception au déploiement : Python, Java/Spring, TypeScript, SQL, Docker et Kubernetes.",
        avatar: avatarUrl,
        discord: "https://discord.com/users/388993523715801088",
        github: "https://github.com/samsoucoupe",
        bmc: "https://buymeacoffee.com/samsoucoupe",
        kofi: "https://ko-fi.com/samsoucoupe"
    },
    about: {
        title: "À propos de moi",
        subtitle: "Développeur backend & full-stack",
        paragraphs: [
            "Développeur français spécialisé dans la conception d'applications backend, d'API et de services orientés données. Je construis des solutions robustes, maintenables et sécurisées, de l'architecture à la mise en production.",
            "Mon profil associe développement logiciel, traitement et visualisation des données, ainsi qu'exploitation d'infrastructures conteneurisées. Je travaille notamment avec Python, Java/Spring, TypeScript, SQL, Power BI, Docker, K3s et Argo CD."
        ],
        stats: [
            { number: "Backend", label: "API & services" },
            { number: "Data", label: "SQL & décisionnel" },
            { number: "DevOps", label: "Conteneurs & GitOps" }
        ]
    },
    skills: {
        title: "Mes Compétences",
        categories: [
            {
                icon: "fas fa-server",
                name: "Développement serveur & langages",
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
                name: "Bibliothèques & interfaces",
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
                name: "Science des données & IA",
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
                name: "Données & décisionnel",
                tags: [
                    { label: "Power BI", cls: "powerbi" },
                    { label: "Excel", cls: "excel" },
                    { label: "MongoDB", cls: "mongodb" }
                ]
            },
            {
                icon: "fas fa-laptop-code",
                name: "Interfaces web",
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
                name: "Développement de jeux",
                tags: [
                    { label: "Babylon.js", cls: "babylonjs" },
                    { label: "WebGL", cls: "webgl" },
                    { label: "Game Design", cls: "gamedev" },
                    { label: "JavaScript Games", cls: "js" }
                ]
            },
            {
                icon: "fas fa-tools",
                name: "DevOps, déploiement & outils",
                tags: [
                    { label: "Docker", cls: "docker" },
                    { label: "Kubernetes / K3s", cls: "kubernetes" },
                    { label: "Argo CD", cls: "argocd" },
                    { label: "Kustomize", cls: "kustomize" },
                    { label: "Traefik", cls: "traefik" },
                    { label: "cert-manager", cls: "certmanager" },
                    { label: "GHCR", cls: "ghcr" },
                    { label: "Git", cls: "git" },
                    { label: "GitHub Actions", cls: "github" },
                    { label: "CI/CD", cls: "cicd" },
                    { label: "Administration VPS", cls: "vps" },
                    { label: "Render", cls: "render" }
                ]
            }
        ]
    },
    projects: {
        title: "Missions",
        items: [
            {
                title: "samsoucoupe universe - Portfolio 3D",
                description: "Portfolio interactif conçu comme un système solaire à explorer, avec une version simplifiée pour garantir un accès direct au contenu.",
                contribution: [
                    "Conception de l'expérience, de l'identité visuelle et de la navigation entre les différentes stations du portfolio.",
                    "Développement de la scène 3D, du cockpit, de la carte, des interactions, des mini-jeux et de la version responsive simplifiée.",
                    "Structuration des contenus en TypeScript, optimisation du chargement et déploiement automatisé sur GitHub Pages."
                ],
                choices: [
                    "Babylon.js pour transformer un portfolio classique en expérience 3D interactive directement dans le navigateur.",
                    "TypeScript et Vite pour structurer le projet, fiabiliser le code et conserver un cycle de développement rapide.",
                    "Une version simple distincte pour préserver la lisibilité, l'accessibilité et l'usage mobile sans imposer le chargement de la 3D."
                ],
                tech: ["Babylon.js", "TypeScript", "Vite", "WebGL", "HTML5", "CSS3", "GitHub Pages"],
                media: [],
                link: null,
                icon: "fas fa-shuttle-space",
                color: "#00e1ff",
                status: "actif"
            },
            {
                title: "SAE Neko Corporation - Loup-Garou Online",
                description: "Plateforme multijoueur distribuée permettant de jouer au Loup-Garou en temps réel, avec des parties autonomes animées par des bots.",
                contribution: [
                    "Conception de l'architecture en microservices et coordination technique de l'équipe.",
                    "Développement des services d'authentification, de découverte, de jeu, d'historisation, de moteur de jeu et de communication WebSocket.",
                    "Mise en place de JWT, du pseudo-autoscaling Kubernecheap, de MongoDB, de l'intégration Angular, de Docker et des workflows d'intégration continue."
                ],
                choices: [
                    "Spring Boot pour isoler les responsabilités métier et faire évoluer les services indépendamment.",
                    "WebSocket et STOMP pour synchroniser instantanément les actions, les phases et les messages d'une partie.",
                    "MongoDB pour conserver l'état imbriqué et évolutif des parties ; MySQL pour les données relationnelles des joueurs ; Cassandra pour les messages ordonnés par partie.",
                    "Docker et GitHub Actions pour rendre l'environnement reproductible et automatiser les vérifications."
                ],
                tech: ["Spring Boot", "Angular", "Docker", "WebSocket", "STOMP", "JWT", "MongoDB", "MySQL", "Cassandra", "Microservices", "CI/CD"],
                media: [
                    { type: "img", src: "assets/SAE 2025/nekoCORPV1.png", alt: "SAE Neko Corporation - Architecture" },
                    { type: "video", src: "assets/SAE 2025/Vidéo SAE.mp4", alt: "Démonstration vidéo du projet", label: "Démonstration vidéo" }
                ],
                link: null,
                icon: "fas fa-users",
                color: "#ec4899",
                status: "terminée"
            },
            {
                title: "Game on Web 2024-2025",
                description: "Participation à deux éditions du concours Game on Web pour découvrir Babylon.js et expérimenter la création de jeux 3D dans le navigateur. Cette expérience m'a ensuite permis de concevoir ce portfolio.",
                contribution: [
                    "Création de Velocity Olympiad en 2024 puis de Dreamland en 2025.",
                    "Développement des scènes, de la navigation, des interactions et des mécaniques de progression."
                ],
                choices: [
                    "Babylon.js a été choisi pour découvrir un moteur 3D web complet et produire des expériences accessibles sans installation.",
                    "TypeScript a permis de structurer les objets, les interactions et la progression des deux jeux."
                ],
                tech: ["Babylon.js", "TypeScript", "WebGL", "Jeu 3D"],
                link: null,
                media: [
                    { type: "video", src: "assets/GOW/2024/videogow2024.mp4", alt: "Velocity Olympiad", label: "Velocity Olympiad - 2024", link: "https://samsoucoupe.github.io/Velocity-Olympiad/" },
                    { type: "video", src: "assets/GOW/2025/videogow2025.mp4", alt: "Dreamland", label: "Dreamland - 2025" },
                    { type: "img", src: "assets/GOW/2025/iconweb.png", alt: "Dreamland - Icône Web", label: "Dreamland - 2025" }
                ],
                icon: "fas fa-trophy",
                color: "#6366f1",
                status: "terminée"
            },
            {
                title: "Projets académiques web",
                description: "Deux projets universitaires réalisés pour pratiquer le développement d'interfaces web et consolider mes bases en JavaScript, TypeScript et Angular.",
                contribution: [
                    "Candy Crush : développement de la grille, des échanges de pièces, de la détection des combinaisons, du score et des animations en JavaScript.",
                    "Application DS4H MIAGE : développement d'écrans et organisation de l'application en composants et services Angular."
                ],
                choices: [
                    "JavaScript sans framework pour manipuler directement la logique du jeu, les événements et le DOM dans Candy Crush.",
                    "Angular et TypeScript pour apprendre à structurer une application plus importante avec des composants réutilisables."
                ],
                tech: ["Angular", "TypeScript", "JavaScript", "HTML5", "CSS3"],
                link: null,
                media: [
                    { type: "img", src: "assets/candy-crush/image.png", alt: "Candy Crush UE Game", label: "Candy Crush - projet universitaire", link: "https://samsoucoupe.github.io/Candy-Crush-bis/" },
                    { type: "text", src: "", alt: "Application Angular DS4H MIAGE", label: "Application Angular - projet universitaire" }
                ],
                icon: "fas fa-graduation-cap",
                color: "#f59e0b",
                status: "terminée"
            },
            {
                title: "Dashboard Analytics Power BI",
                description: "Réalisation d'un tableau de bord interactif pour préparer, analyser et restituer des données métier.",
                contribution: [],
                choices: [],
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
