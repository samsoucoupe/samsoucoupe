/* ============================================================
 * space-cockpit.js — samsoucoupe universe
 *
 * Système solaire : home au centre, 4 planètes orbitent autour.
 * Clic une planète → vol automatique + orbite autour à l'arrivée.
 * Échap → retour au centre, orbite d'overview.
 * Bouton Map → carte 2D du système (géré côté UI).
 * ============================================================ */
window.SpaceCockpit = (function () {
    'use strict';

    let canvas, engine, scene, camera, glow;
    let ship, engineGlow = [], engineParticles;
    let sunCore;

    // --- les planètes (orbitent autour du centre) ---
    let planets = {};
    const SUN_POS = BABYLON.Vector3.Zero();

    // --- état du vaisseau ---
    // mode: 'idle' (orbite centre) | 'flying' (en route) | 'orbiting' (autour planète)
    let mode = 'orbiting';
    let shipPos = new BABYLON.Vector3(0, 8, 70);
    let targetPlanet = 'home';
    // Idle path state
    let idlePath = [];       // array of BABYLON.Vector3 waypoints
    let idlePathIdx = 0;     // current waypoint index
    let idlePathT = 0;       // interpolation [0,1] between idx and idx+1
    let idleSpeed = 28;      // units/sec along the spline
    let orbitAngle = 0;               // angle d'orbite courant (idle et orbiting)
    let shipYaw = 0;
    let currentSpeed = 0;

    // --- scanner ---
    let scanProgress = 0;

    const readyCallbacks = [];
    let ready = false;
    let onScanCb = null, onDiscoverCb = null, onModeCb = null, onScoreCb = null;

    // --- système de score / combat ---
    let score = 0;
    let combo = 0;
    let lastKillTime = 0;

    /*
     * Configuration : home = soleil central, les autres = planètes orbitantes.
     * orbit = { radius, height, angle, speed }
     */
    const SECTIONS = {
        home:     { color: '#ffd470', label: 'BASE',     glyph: '◉', size: 14, orbit: { radius: 0,    height: 0,  angle: 0,   speed: 0    } },
        about:    { color: '#ffb340', label: 'PROFIL',   glyph: '◈', size: 8,  orbit: { radius: 60,   height: 6,  angle: 0.3, speed: 0.10 } },
        skills:   { color: '#b388ff', label: 'ARSENAL',  glyph: '◆', size: 16, orbit: { radius: 110,  height: -8, angle: 1.9, speed: 0.07 }, hasRing: true },
        projects: { color: '#ec4899', label: 'MISSIONS', glyph: '✦', size: 14, orbit: { radius: 165,  height: 10, angle: 3.6, speed: 0.05 }, hasRing: true },
        contact:  { color: '#38ffb0', label: 'ÉMETTEUR', glyph: '⬡', size: 7,  orbit: { radius: 215,  height: -5, angle: 5.0, speed: 0.035 } }
    };
    // Lunes de MISSIONS (une par projet)
    const PROJECT_MOONS = [];
    const SECTION_ORDER = ['home', 'about', 'skills', 'projects', 'contact'];
    const ARRIVE_DIST = 18;
const PLANET_ORBIT_R = 20;
    const MAX_SPEED = 100;

    function vec(a) { return new BABYLON.Vector3(a[0], a[1], a[2]); }

    // Position courante (mondiale) d'une planète selon son orbite
    function planetWorldPos(id) {
        const o = SECTIONS[id].orbit;
        return new BABYLON.Vector3(
            o.radius * Math.cos(o.angle),
            o.height,
            o.radius * Math.sin(o.angle)
        );
    }

    /* ============================================================ INIT */

    // Précalcule une spline Lissajous-like passant par toutes les planètes (boucle fermée)
    function buildIdlePath() {
        const pts = Object.keys(planets).map(id => {
            const p = planets[id].root.position;
            return new BABYLON.Vector3(p.x, p.y + 4, p.z);
        });
        if (pts.length < 2) return;
        // Nearest-neighbor TSP closes loop
        const visited = new Array(pts.length).fill(false);
        const order = [0]; visited[0] = true;
        for (let n = 1; n < pts.length; n++) {
            let best = -1, bestD = Infinity;
            for (let i = 0; i < pts.length; i++) {
                if (visited[i]) continue;
                const d = BABYLON.Vector3.Distance(pts[order[n-1]], pts[i]);
                if (d < bestD) { bestD = d; best = i; }
            }
            order.push(best); visited[best] = true;
        }
        const loop = order.concat([order[0]]);
        const nn = loop.map(i => pts[i]);
        const spline = BABYLON.Curve3.CreateCatmullRomSpline(nn, 60, true);
        idlePath = spline.getPoints();
    }

    function init() {
        canvas = document.getElementById('renderCanvas');
        if (!canvas || typeof BABYLON === 'undefined') { console.error('[SC] missing'); return; }
        engine = new BABYLON.Engine(canvas, true, {
            preserveDrawingBuffer: true, stencil: true, antialias: true,
            alpha: true, powerPreference: 'high-performance'
        });
        scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        glow = new BABYLON.GlowLayer('glow', scene);
        glow.intensity = 1.5;

        buildShip();
        buildSun();
        buildPlanets();
        buildCamera();
        buildLights();
        buildStarfield3D();
        buildEngineParticles();
        buildPortals();           // Portails Rick & Morty (easter eggs / anomalies)
        buildEnemies();           // Drones hostiles
        attachPicking();

        buildIdlePath();
        shipPos = planets.home.root.position.clone();
        ship.position.copyFrom(shipPos);
        mode = 'idle';
        startPortalsTimer();
        engine.runRenderLoop(renderLoop);
        window.addEventListener('resize', () => engine.resize());
        ready = true;
        readyCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
    }
    function onReady(cb) { if (ready) { cb(); return; } readyCallbacks.push(cb); }

    /* ============================================================ VAISSEAU */
    function buildShip() {
        ship = new BABYLON.TransformNode('ship', scene);
        ship.position.copyFrom(shipPos);
        const hullMat = new BABYLON.StandardMaterial('shipMat', scene);
        hullMat.diffuseColor = new BABYLON.Color3(0.5, 0.55, 0.7);
        hullMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.35);
        hullMat.specularColor = new BABYLON.Color3(0.6, 0.8, 1);
        const hull = BABYLON.MeshBuilder.CreateCylinder('shipHull',
            { diameter: 4, height: 0.7, tessellation: 24 }, scene);
        hull.material = hullMat; hull.parent = ship; hull.isPickable = false;

        const domeMat = new BABYLON.StandardMaterial('domeMat', scene);
        domeMat.diffuseColor = new BABYLON.Color3(0, 0.4, 0.6);
        domeMat.emissiveColor = new BABYLON.Color3(0, 0.6, 0.9);
        domeMat.alpha = 0.7;
        const dome = BABYLON.MeshBuilder.CreateSphere('shipDome',
            { diameter: 2, segments: 16, slice: 0.5 }, scene);
        dome.material = domeMat; dome.position.y = 0.45; dome.parent = ship; dome.isPickable = false;

        const ringMat = new BABYLON.StandardMaterial('shipRingMat', scene);
        ringMat.emissiveColor = new BABYLON.Color3(0, 0.88, 1);
        ringMat.disableLighting = true;
        const ring = BABYLON.MeshBuilder.CreateTorus('shipRing',
            { diameter: 4, thickness: 0.1, tessellation: 32 }, scene);
        ring.material = ringMat; ring.parent = ship; ring.isPickable = false;

        // Réacteurs (3 sphères à L'ARRIÈRE du vaisseau, z + pour "derrière")
        const engMat = new BABYLON.StandardMaterial('engineMat', scene);
        engMat.emissiveColor = new BABYLON.Color3(1, 0.6, 0.2);
        engMat.disableLighting = true;
        for (let i = -1; i <= 1; i++) {
            const e = BABYLON.MeshBuilder.CreateSphere('engine_' + i, { diameter: 0.7, segments: 8 }, scene);
            e.material = engMat;
            e.position = new BABYLON.Vector3(i * 1.1, -0.1, 2);   // ARRIÈRE (z+)
            e.parent = ship; e.isPickable = false;
            engineGlow.push(e);
        }

    }

    /* ============================================================ SOLEIL (home) */
    function buildSun() {
        sunCore = BABYLON.MeshBuilder.CreateSphere('sun',
            { diameter: SECTIONS.home.size, segments: 24 }, scene);
        const m = new BABYLON.StandardMaterial('sunMat', scene);
        m.emissiveColor = BABYLON.Color3.FromHexString(SECTIONS.home.color);
        m.diffuseColor = new BABYLON.Color3(0, 0, 0);
        m.disableLighting = true;
        sunCore.material = m;
        sunCore.metadata = { section: 'home' };
        sunCore.isPickable = true;

        // Halo solaire
        const halo = BABYLON.MeshBuilder.CreateSphere('sunHalo',
            { diameter: SECTIONS.home.size + 8, segments: 16, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
        const hm = new BABYLON.StandardMaterial('sunHaloMat', scene);
        hm.emissiveColor = BABYLON.Color3.FromHexString(SECTIONS.home.color).scale(0.4);
        hm.alpha = 0.3; hm.disableLighting = true;
        halo.material = hm; halo.isPickable = false;

        // Gross hitbox invisible pour faciliter le clic
        const sunHit = BABYLON.MeshBuilder.CreateSphere('sunHit',
            { diameter: SECTIONS.home.size + 16, segments: 8 }, scene);
        const shMat = new BABYLON.StandardMaterial('sunHitMat', scene);
        shMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        shMat.alpha = 0;
        sunHit.material = shMat;
        sunHit.isPickable = true;
        sunHit.metadata = { section: 'home' };

        // Lueur qui suit le soleil
        const sunLight = new BABYLON.PointLight('sunLight', BABYLON.Vector3.Zero(), scene);
        sunLight.intensity = 1.2;
        sunLight.diffuse = BABYLON.Color3.FromHexString(SECTIONS.home.color);
        sunLight.range = 300;
    }

    /* ============================================================ PLANÈTES */
    function buildPlanets() {
        Object.keys(SECTIONS).forEach(id => {
            if (id === 'home') {
                // home est géré par buildSun
                planets[id] = { root: sunCore, pos: BABYLON.Vector3.Zero(), cfg: SECTIONS[id], discovered: false, signal: null };
                return;
            }
            const cfg = SECTIONS[id];
            const c = BABYLON.Color3.FromHexString(cfg.color);
            const root = new BABYLON.TransformNode('planet_' + id, scene);
            const p = planetWorldPos(id);
            root.position.copyFrom(p);

            const body = BABYLON.MeshBuilder.CreateSphere('pBody_' + id,
                { diameter: cfg.size, segments: 20 }, scene);
            const m = new BABYLON.StandardMaterial('pMat_' + id, scene);
            m.diffuseColor = c;
            m.emissiveColor = c.scale(0.25);
            m.specularColor = new BABYLON.Color3(0.5, 0.5, 0.6);
            body.material = m; body.parent = root; body.isPickable = false;

            // Halo atmosphère
            const haloMat = new BABYLON.StandardMaterial('pHaloMat_' + id, scene);
            haloMat.emissiveColor = c.scale(0.45);
            haloMat.alpha = 0.22; haloMat.disableLighting = true;
            const halo = BABYLON.MeshBuilder.CreateSphere('pHalo_' + id,
                { diameter: cfg.size + 5, segments: 12, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
            halo.material = haloMat; halo.parent = root; halo.isPickable = false;

            // Anneau de signal (pickable hitbox invisible + anneau visible)
            const ringMat = new BABYLON.StandardMaterial('pRingMat_' + id, scene);
            ringMat.emissiveColor = c;
            ringMat.disableLighting = true;
            const ring = BABYLON.MeshBuilder.CreateTorus('pRing_' + id,
                { diameter: cfg.size + 7, thickness: 0.25, tessellation: 48 }, scene);
            ring.material = ringMat; ring.parent = root; ring.isPickable = false;
            ring.rotation.x = 0.4;

            // Hitbox de clic invisible (grosse)
            const hit = BABYLON.MeshBuilder.CreateSphere('pHit_' + id,
                { diameter: cfg.size + 14, segments: 8 }, scene);
            const hm2 = new BABYLON.StandardMaterial('pHitMat_' + id, scene);
            hm2.diffuseColor = new BABYLON.Color3(0, 0, 0);
            hm2.emissiveColor = new BABYLON.Color3(0, 0, 0);
            hm2.alpha = 0;
            hit.material = hm2; hit.parent = root; hit.isPickable = true;
            hit.metadata = { section: id };

            // Anneau de peste (style Saturne) si hasRing
            if (cfg.hasRing) {
                const dustRingMat = new BABYLON.StandardMaterial('pDustMat_' + id, scene);
                dustRingMat.diffuseColor = c.scale(0.6);
                dustRingMat.emissiveColor = c.scale(0.3);
                dustRingMat.alpha = 0.6;
                dustRingMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.3);
                const dustRing = BABYLON.MeshBuilder.CreateTorus('pDustRing_' + id,
                    { diameter: cfg.size + 14, thickness: 1.2, tessellation: 64 }, scene);
                dustRing.material = dustRingMat;
                dustRing.parent = root;
                dustRing.isPickable = false;
                dustRing.rotation.x = 0.3;
                // Second anneau plus fin
                const dustRing2Mat = new BABYLON.StandardMaterial('pDust2Mat_' + id, scene);
                dustRing2Mat.diffuseColor = c.scale(0.4);
                dustRing2Mat.emissiveColor = c.scale(0.2);
                dustRing2Mat.alpha = 0.4;
                const dustRing2 = BABYLON.MeshBuilder.CreateTorus('pDust2Ring_' + id,
                    { diameter: cfg.size + 22, thickness: 0.5, tessellation: 64 }, scene);
                dustRing2.material = dustRing2Mat;
                dustRing2.parent = root;
                dustRing2.isPickable = false;
                dustRing2.rotation.x = 0.3;
            }

            planets[id] = { root, body, halo, ring, pos: p.clone(), cfg, color: c, discovered: false, signal: null };
        });

        // Lunes de MISSIONS : une par projet (6 moonnes)
        buildProjectMoons();
    }

    function buildProjectMoons() {
        const projects = (window.PORTFOLIO && window.PORTFOLIO.projects && window.PORTFOLIO.projects.items) || [];
        projects.forEach(function (proj, i) {
            const moonColor = BABYLON.Color3.FromHexString(proj.color || '#ec4899');
            const moonSize = 3 + (i % 2);   // 3 ou 4
            const moonDist = 12 + i * 3;    // étalées autour de la planète
            const moonSpeed = 0.4 + i * 0.08;
            const moonAngle = (i / projects.length) * Math.PI * 2;
            const moonTilt = (i % 2 === 0 ? 0.3 : -0.2);

            const root = new BABYLON.TransformNode('moonRoot_' + i, scene);
            const body = BABYLON.MeshBuilder.CreateSphere('moon_' + i,
                { diameter: moonSize, segments: 10 }, scene);
            const mat = new BABYLON.StandardMaterial('moonMat_' + i, scene);
            mat.diffuseColor = moonColor;
            mat.emissiveColor = moonColor.scale(0.5);
            mat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.5);
            body.material = mat;
            body.parent = root;
            body.isPickable = false;

            // Halo léger
            const hMat = new BABYLON.StandardMaterial('moonHalo_' + i, scene);
            hMat.emissiveColor = moonColor.scale(0.3);
            hMat.alpha = 0.2; hMat.disableLighting = true;
            const halo = BABYLON.MeshBuilder.CreateSphere('moonHaloS_' + i,
                { diameter: moonSize + 2, segments: 8, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
            halo.material = hMat;
            halo.parent = root;
            halo.isPickable = false;

            // Hitbox_clickable
            const hit = BABYLON.MeshBuilder.CreateSphere('moonHit_' + i,
                { diameter: moonSize + 4, segments: 8 }, scene);
            const hMat2 = new BABYLON.StandardMaterial('moonHitMat_' + i, scene);
            hMat2.diffuseColor = new BABYLON.Color3(0, 0, 0);
            hMat2.alpha = 0;
            hit.material = hMat2;
            hit.parent = root;
            hit.isPickable = true;
            hit.metadata = { projectIndex: i, isMissionMoon: true };

            PROJECT_MOONS.push({
                root, body, halo, moonDist, moonSpeed, moonAngle, moonTilt, moonColor
            });
        });
    }

    function buildCamera() {
        camera = new BABYLON.UniversalCamera('cam', new BABYLON.Vector3(0, 14, 90), scene);
        camera.setTarget(SUN_POS);
        camera.fov = 1.05;
        camera.minZ = 0.1; camera.maxZ = 2000;
        camera.inputs.clear();
        scene.activeCamera = camera;
    }

    function buildLights() {
        const hemi = new BABYLON.HemisphericLight('hemi', vec([0.2, 1, 0.3]), scene);
        hemi.intensity = 0.15;
        hemi.diffuse = new BABYLON.Color3(0.5, 0.6, 0.8);
        const sl = new BABYLON.PointLight('shipL', vec([0, 1, -4]), scene);
        sl.intensity = 0.5; sl.diffuse = new BABYLON.Color3(0.7, 0.85, 1);
        sl.parent = ship;
    }

    function buildStarfield3D() {
        const N = 1800;
        const positions = [], colors = [];
        for (let i = 0; i < N; i++) {
            positions.push((Math.random() - 0.5) * 800, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 800);
            const t = Math.random();
            const c = t > 0.9 ? [0.7, 0.85, 1] : t > 0.75 ? [1, 0.9, 0.7] : t > 0.65 ? [1, 0.8, 0.8] : [1, 1, 1];
            const b = 0.4 + Math.random() * 0.6;
            colors.push(c[0] * b, c[1] * b, c[2] * b, 1);
        }
        const mesh = new BABYLON.Mesh('bgStars3D', scene);
        const vd = new BABYLON.VertexData();
        vd.positions = positions; vd.colors = colors;
        vd.applyToMesh(mesh);
        const mat = new BABYLON.StandardMaterial('bgStarsMat', scene);
        mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        mat.disableLighting = true; mat.pointsCloud = true; mat.pointSize = 2;
        mesh.material = mat; mesh.isPickable = false;
    }

    function buildEngineParticles() {
        const ps = new BABYLON.ParticleSystem('enginePS', 180, scene);
        ps.particleTexture = makeStarTexture();
        ps.emitter = ship;
        ps.minEmitBox = vec([-1.2, -0.15, 2]);    // arrière du vaisseau
        ps.maxEmitBox = vec([1.2, 0.15, 2.2]);
        ps.direction1 = vec([-0.3, -0.3, 2]);     // vers l'arrière (z+)
        ps.direction2 = vec([0.3, 0.3, 4]);
        ps.color1 = new BABYLON.Color4(1, 0.6, 0.2, 1);
        ps.color2 = new BABYLON.Color4(1, 0.3, 0.1, 0.8);
        ps.colorDead = new BABYLON.Color4(0.5, 0.2, 0, 0);
        ps.minSize = 0.2; ps.maxSize = 0.5;
        ps.minLifeTime = 0.2; ps.maxLifeTime = 0.4;
        ps.emitRate = 20;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        ps.minEmitPower = 0.5; ps.maxEmitPower = 1.5;
        ps.gravity = vec([0, 0, 0]);
        ps.start();
        engineParticles = ps;
    }

    /* ============================================================ PORTAILS RICK & MORTY
     * Des portails verts liquides apparaissent aléatoirement dans l'espace.
     * Quand le vaisseau s'en approche → un message loufoque s'affiche.
     */
    let portals = [];
    let portalTimer = 0;
    let nextSpawn = 15;               // les prochaines secondes avant l'apparition
    let onPortalCb = null;            // callback quand un message est déclenché
    const PORTAL_QUOTES = [
        "Wubba lubba dub dub !",
        "C'est ça, Morty. On est dans l'espace de ce portfolio. Profite.",
        "Rick : Je suis pas un héros, Morty. Je suis juste un dev backend.",
        "La réalité est souvent décevante. Ce portfolio, un peu moins.",
        "Rick : 90% de mes inventions ont échoué. Comme tes commits.",
        "Morty : H-hey Rick, c'est quoi cette planète ? Rick : C'est son profil, gamin.",
        "C'est un portail vert. C'est cool. T'as vu ? Vert.",
        "Je suis le dev le plus intelligent de cet univers. Et du suivant.",
        "On n'a pas fait tout ça pour abandonner, Morty. On est des devs.",
        "Le bug est un concept inventé par les QA pour justifier leur existence.",
        "Rick : Ne pense pas, code. C'est ça le secret.",
        "Je préfère mourir que de debugger ça. Mais je debug quand même.",
        "Morty : R-Rick, pourquoi ils t'ont créé ce portfolio ? Rick : VANITY, Morty. VAN-ITY.",
        "Locklear, Sanchez, et toi : trois générations de devs qui crashent les serveurs.",
        "C'est pas un portfolio, c'est un cri dans le vide. Un joli cri.",
        "Rick : Le CSS c'est comme la cuisine. Tout le monde croit savoir faire. Personne sait faire.",
        "Morty : C-c'est un bug ou une feature ? Rick : Oui.",
        "Rick : J'ai voyagé dans 47 dimensions. Y'a du React partout. Même en enfer.",
        "Ce portail mène nulle part. Comme ton premier projet Angular.",
        "Rick : Le serveur est down. Encore. Toujours. Pour l'éternité.",
        "Bienvenue dans le multiverse du backend, où chaque API est une promesse non tenue.",
        "Rick : J'ai mis à jour le readme. Il est presque à jour cette fois. Presque.",
        "Morty : C-c'est quoi ce son ? Rick : Le son de ton CSS qui compile. Déprimant, hein ?",
        "Rick : Tu sais pourquoi les bugs apparaissent en production ? Parce que le code n'a pas de morale.",
        "Morty : J-je comprends rien à ce commit... Rick : C'est normal. Personne ne comprend, Morty.",
        "Rick : Lنيا. Y'a du code en arabe dans ce fichier. Qu'est-ce que t'as foutu, Morty ?",
        "Ce code marchait hier. Promis. C'est la RAM qui ment.",
        "Rick : On a 47 onglets ouverts. C'est de la productivity, Morty. De la PRODUCTIVITY.",
        "Morty : Rick, le build a encore failed. Rick : C'est pas un fail. C'est un rebrand : WIP.",
        "Rick : Mon framework est meilleur que le tien. Mon framework est meilleur que TOUT.",
        "Bienvenue, voyageur. Tu cherches quoi ? Un dev ? Un designer ? Un plombier ?",
        "Rick : Je suis sobre depuis 47 ans. L آخر était un segfault. J'ai failli mourir.",
        "Morty :Pourquoi y'a autant de fichiers ? Rick : C'est l'architecture, Morty. L'ARCHITECTURE.",
        "Ce portail ne mène nulle part. Comme ta branche feature avant le rebase.",
        "Rick : Le legacy code, c'est comme le vieux vin. Ça pue, mais c'est précieux.",
        "Morty : Le test unitaires passent ! Rick : C'est un mensonge. Le mensonge c'est la magie du testing.",
        "Rick : Tu compiles en -O3 ? T'es fou ou courageux ? Je suis les deux, Morty.",
        "Ton navigateur supporte le pointer lock. Clique. Rejoins-nous. Ou casse-toi.",
        "Je connais 47 langages de prog. Aucun ne m'aime en retour.",
        "Rick : Y'a 47 tabs ouverts. Je sais pas dans lequel je suis. Je SAIS PAS.",
        "Morty : C-c'est un portal ou un wormhole ? Rick : C'est un DIV, Morty. C'EST UN DIV.",
        "La doc dit que ça marche. La doc ment toujours. Comme le mensonge sur l'eau.",
        "Rick : async/await c'est de la magie. Les promises, c'est des vœux. Les deux échouent.",
        "Morty :Pourquoi les variables s'appellent toutes x et y ? Rick : Car c'est les SEULES lettres qui MARCHENT."
    ];

    function buildPortals() {
        // Le visuel des portails est créé à la volée quand on les spawn.
    }

    function startPortalsTimer() {
        // updatePortals est appelé dans la renderLoop; rien à faire ici.
    }

    function spawnPortal() {
        // Position : près du vaisseau, légèrement décalée
        const ang = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 20;
        const pos = new BABYLON.Vector3(
            shipPos.x + Math.cos(ang) * dist,
            shipPos.y + (Math.random() - 0.5) * 8,
            shipPos.z + Math.sin(ang) * dist
        );

        const pid = portals.length;
        const root = new BABYLON.TransformNode('portal_' + pid, scene);
        root.position = pos;

        // Anneau vert émissif principal (plus épais, visible de loin)
        const ringMat = new BABYLON.StandardMaterial('pRingM_' + pid, scene);
        ringMat.emissiveColor = new BABYLON.Color3(0.1, 1, 0.35);
        ringMat.disableLighting = true;
        const ring = BABYLON.MeshBuilder.CreateTorus('pRingT_' + pid,
            { diameter: 6, thickness: 0.4, tessellation: 32 }, scene);
        ring.material = ringMat;
        ring.parent = root;
        ring.isPickable = false;

        // cœur lumineux (sphère émissive petite)
        const coreMat = new BABYLON.StandardMaterial('pCoreM_' + pid, scene);
        coreMat.emissiveColor = new BABYLON.Color3(0.2, 0.9, 0.5);
        coreMat.disableLighting = true;
        coreMat.alpha = 0.5;
        const core = BABYLON.MeshBuilder.CreateSphere('pCore_' + pid,
            { diameter: 2, segments: 12 }, scene);
        core.material = coreMat;
        core.parent = root;
        core.isPickable = false;

        // Particules vertes en spirale serrée autour du portail
        const ps = new BABYLON.ParticleSystem('pPs_' + pid, 80, scene);
        ps.particleTexture = makeStarTexture();
        ps.emitter = root;
        ps.minEmitBox = vec([-2, -2, -0.3]);
        ps.maxEmitBox = vec([2, 2, 0.3]);
        ps.color1 = new BABYLON.Color4(0.1, 1, 0.4, 1);
        ps.color2 = new BABYLON.Color4(0, 0.6, 0.3, 0.6);
        ps.colorDead = new BABYLON.Color4(0, 0.2, 0, 0);
        ps.minSize = 0.15; ps.maxSize = 0.45;
        ps.minLifeTime = 0.5; ps.maxLifeTime = 1.2;
        ps.emitRate = 30;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        ps.direction1 = vec([-1, -1, 0]);
        ps.direction2 = vec([1, 1, 0]);
        ps.minEmitPower = 0.3; ps.maxEmitPower = 1;
        ps.start();

        // Hitbox invisible pour cliquer et détruire l'anomalie
        const hit = BABYLON.MeshBuilder.CreateSphere('portalHit_' + pid,
            { diameter: 8, segments: 8 }, scene);
        const hMat = new BABYLON.StandardMaterial('portalHitMat_' + pid, scene);
        hMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        hMat.alpha = 0;
        hit.material = hMat;
        hit.parent = root;
        hit.isPickable = true;
        hit.metadata = { portalIndex: pid };

        portals.push({
            id: pid, root, ring, core, ps, hit, pos: pos.clone(),
            life: 22,
            triggered: false,
            _spin: Math.random() * Math.PI
        });
    }

    function updatePortals(dt) {
        // Spawn à intervalle
        portalTimer += dt;
        if (portalTimer >= nextSpawn && portals.length < 2) {
            spawnPortal();
            portalTimer = 0;
            nextSpawn = 18 + Math.random() * 20;   // 18-38s
        }

        // Update chaque portail
        for (let i = portals.length - 1; i >= 0; i--) {
            const p = portals[i];
            p.life -= dt;
            p._spin += dt * 1.5;
            p.ring.rotation.z = p._spin;
            p.ring.rotation.x = Math.sin(p._spin * 0.7) * 0.2;
            // Fait face au vaisseau (billboard)
            p.root.lookAt(shipPos);

            // Si le vaisseau s'en approche (< 10u) → message
            const d = BABYLON.Vector3.Distance(shipPos, p.pos);
            if (d < 10 && !p.triggered) {
                p.triggered = true;
                const quote = PORTAL_QUOTES[Math.floor(Math.random() * PORTAL_QUOTES.length)];
                if (onPortalCb) onPortalCb(quote);
                p.ps.emitRate = 150;
                p.life = Math.min(p.life, 1.5);
            }

            if (p.life <= 0) {
                destroyPortal(p.id, false);
            } else if (p.life < 4) {
                p.ring.material.alpha = p.life / 4;
                if (p.core) p.core.material.alpha = 0.5 * (p.life / 4);
            }
        }
    }

    function destroyPortal(id, byPlayer) {
        const idx = portals.findIndex(p => p.id === id);
        if (idx === -1) return;
        const p = portals[idx];
        if (byPlayer) {
            fireLaser(p.root.position.clone(), new BABYLON.Color3(0.1, 1, 0.35));
            spawnExplosion(p.root.position.clone(), new BABYLON.Color4(0.1, 1, 0.4, 1), 40);
            addScore(150, 'ANOMALIE DÉTRUITE');
        }
        p.ps.stop();
        if (p.hit) p.hit.dispose();
        p.ring.dispose();
        if (p.core) p.core.dispose();
        p.root.dispose();
        portals.splice(idx, 1);
    }

    /* ============================================================ ENNEMIS
     * Drones hostiles qui spawnent près du joueur. Clique pour tirer,
     * détruire et gagner des points.
     */
    let enemies = [];
    let enemyTimer = 0;
    let nextEnemy = 8 + Math.random() * 12;

    function buildEnemies() { /* rien à pré-construire */ }

    function spawnEnemy() {
        const ang = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 80;
        const pos = new BABYLON.Vector3(
            shipPos.x + Math.cos(ang) * dist,
            shipPos.y + (Math.random() - 0.5) * 25,
            shipPos.z + Math.sin(ang) * dist
        );

        const eid = enemies.length;
        const root = new BABYLON.TransformNode('enemy_' + eid, scene);
        root.metadata = { enemyId: eid };
        root.position.copyFrom(pos);

        // Corps du drone (pyramide inversée / diamant)
        const bodyMat = new BABYLON.StandardMaterial('enemyBodyMat_' + eid, scene);
        bodyMat.diffuseColor = new BABYLON.Color3(0.8, 0.15, 0.15);
        bodyMat.emissiveColor = new BABYLON.Color3(0.6, 0.05, 0.05);
        const body = BABYLON.MeshBuilder.CreatePolyhedron('enemyBody_' + eid,
            { type: 1, size: 1.4 }, scene); // octahedron
        body.material = bodyMat;
        body.parent = root;
        body.isPickable = false;

        // Cœur lumineux
        const coreMat = new BABYLON.StandardMaterial('enemyCoreMat_' + eid, scene);
        coreMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0.1);
        coreMat.disableLighting = true;
        const core = BABYLON.MeshBuilder.CreateSphere('enemyCore_' + eid,
            { diameter: 0.9, segments: 8 }, scene);
        core.material = coreMat;
        core.parent = root;
        core.isPickable = false;

        // Hitbox de visée
        const hit = BABYLON.MeshBuilder.CreateSphere('enemyHit_' + eid,
            { diameter: 4.5, segments: 8 }, scene);
        const hm = new BABYLON.StandardMaterial('enemyHitMat_' + eid, scene);
        hm.diffuseColor = new BABYLON.Color3(0, 0, 0);
        hm.alpha = 0;
        hit.material = hm;
        hit.parent = root;
        hit.isPickable = true;
        hit.metadata = { enemyId: eid };

        enemies.push({
            id: eid, root, body, core, hit, pos: pos.clone(),
            speed: 6 + Math.random() * 8,    // ralentis (était 12-26)
            strafeOffset: Math.random() * Math.PI * 2,
            life: 50                           // durée de vie plus longue
        });
    }

    function updateEnemies(dt) {
        enemyTimer += dt;
        if (enemyTimer >= nextEnemy && enemies.length < 4) {
            spawnEnemy();
            enemyTimer = 0;
            nextEnemy = 10 + Math.random() * 20;  // spawn moins fréquent
        }
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            e.life -= dt;

            // Se dirigent vers le joueur mais garde une distance minimale
            const toShip = shipPos.subtract(e.pos);
            const d = toShip.length();
            if (d > 0.1) toShip.normalize();
            // STOP si trop près (30u) — le joueur peut respirer
            let dir;
            if (d < 30) {
                dir = toShip.scale(-1); // recule doucement
            } else if (d > 80) {
                dir = toShip; // approche si trop loin
            } else {
                // Strafe lateral dans la zone correcte
                dir = new BABYLON.Vector3(
                    Math.cos(elapsed * 1.2 + e.strafeOffset),
                    Math.sin(elapsed * 0.9 + e.strafeOffset) * 0.3,
                    Math.sin(elapsed * 1.2 + e.strafeOffset)
                ).scale(0.25);
            }
            if (dir.lengthSquared() > 0.01) dir.normalize();
            e.pos.addInPlace(dir.scale(e.speed * dt));
            e.root.position.copyFrom(e.pos);

            // Oriente le drone vers le joueur
            const look = shipPos.subtract(e.pos);
            if (look.lengthSquared() > 0.01) {
                const yaw = Math.atan2(-look.x, -look.z);
                e.root.rotation.y = yaw;
                e.root.rotation.x = Math.sin(elapsed * 2 + e.strafeOffset) * 0.2;
            }

            // Pulse du cœur
            const pulse = 1 + Math.sin(elapsed * 8 + e.strafeOffset) * 0.25;
            e.core.scaling.setAll(pulse);

            if (e.life <= 0) {
                destroyEnemy(e.id, false);
            }
        }
    }

    function destroyEnemy(id, byPlayer) {
        const idx = enemies.findIndex(e => e.id === id);
        if (idx === -1) return;
        const e = enemies[idx];
        if (byPlayer) {
            fireLaser(e.pos.clone(), new BABYLON.Color3(1, 0.3, 0.1));
            spawnExplosion(e.pos.clone(), new BABYLON.Color4(1, 0.25, 0.1, 1), 60);
            addScore(100, 'DRONE DÉTRUIT');
        }
        if (e.hit) e.hit.dispose();
        e.body.dispose();
        e.core.dispose();
        e.root.dispose();
        enemies.splice(idx, 1);
    }

    /* ============================================================ COMÈTES
     * Occasionnellement, une comète traverse l'espace avec sa queue brillante.
     */
    let comets = [];
    let cometTimer = 0;
    let nextComet = 30 + Math.random() * 30;

    function spawnComet() {
        // Direction aléatoire, traverse une grande distance
        const ang = Math.random() * Math.PI * 2;
        const startDist = 200;
        const startPos = new BABYLON.Vector3(
            shipPos.x + Math.cos(ang) * startDist,
            shipPos.y + (Math.random() - 0.5) * 60,
            shipPos.z + Math.sin(ang) * startDist
        );
        const dir = startPos.scale(-1).add(shipPos).normalize();   // vers le vaisseau
        const speed = 80 + Math.random() * 40;

        const cometColor = [Math.random(), Math.random(), Math.random()];
        const color = new BABYLON.Color3(0.6 + cometColor[0]*0.4, 0.7 + cometColor[1]*0.3, 0.9 + cometColor[2]*0.1);

        // Noyau
        const core = BABYLON.MeshBuilder.CreateSphere('cometCore_' + comets.length,
            { diameter: 1.5, segments: 8 }, scene);
        const coreMat = new BABYLON.StandardMaterial('cometCoreMat_' + comets.length, scene);
        coreMat.emissiveColor = color;
        coreMat.disableLighting = true;
        core.material = coreMat;
        core.isPickable = false;

        // Queue de particules
        const ps = new BABYLON.ParticleSystem('cometPs_' + comets.length, 200, scene);
        ps.particleTexture = makeStarTexture();
        ps.emitter = core;
        ps.minEmitBox = new BABYLON.Vector3(-0.3, -0.3, -0.3);
        ps.maxEmitBox = new BABYLON.Vector3(0.3, 0.3, 0.3);
        ps.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
        ps.color2 = new BABYLON.Color4(color.r * 0.6, color.g * 0.6, color.b * 0.6, 0.7);
        ps.colorDead = new BABYLON.Color4(color.r, color.g, color.b, 0);
        ps.minSize = 0.3; ps.maxSize = 1.2;
        ps.minLifeTime = 0.5; ps.maxLifeTime = 1.2;
        ps.emitRate = 120;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        ps.direction1 = new BABYLON.Vector3(-dir.x * 3, -dir.y * 3, -dir.z * 3);
        ps.direction2 = new BABYLON.Vector3(-dir.x * 5, -dir.y * 5, -dir.z * 5);
        ps.minEmitPower = 1; ps.maxEmitPower = 3;
        ps.start();

        comets.push({
            core, ps, pos: startPos.clone(), vel: dir.scale(speed), life: 6
        });
    }

    function updateComets(dt) {
        cometTimer += dt;
        if (cometTimer >= nextComet && comets.length < 1) {
            spawnComet();
            cometTimer = 0;
            nextComet = 30 + Math.random() * 45;
        }
        for (let i = comets.length - 1; i >= 0; i--) {
            const c = comets[i];
            c.life -= dt;
            c.pos.addInPlace(c.vel.scale(dt));
            c.core.position.copyFrom(c.pos);
            if (c.life <= 0) {
                c.ps.stop();
                c.core.dispose();
                comets.splice(i, 1);
            }
        }
    }

    function makeStarTexture() {
        const size = 64;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.25, 'rgba(220,240,255,0.9)');
        g.addColorStop(0.6, 'rgba(120,180,255,0.25)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        return new BABYLON.Texture(c.toDataURL(), scene);
    }

    /* ============================================================ SCORE & COMBO */
    function addScore(points, reason) {
        const now = performance.now() / 1000;
        if (now - lastKillTime < 3) {
            combo = Math.min(combo + 1, 10);
        } else {
            combo = 1;
        }
        lastKillTime = now;
        const gained = Math.floor(points * (1 + combo * 0.2));
        score += gained;
        if (onScoreCb) onScoreCb({ score, gained, combo, reason });
    }

    function getScore() { return { score, combo }; }

    /* ============================================================ LASER VISUEL */
    function fireLaser(targetPos, color) {
        const start = shipPos.clone();
        const end = targetPos.clone();
        const dist = BABYLON.Vector3.Distance(start, end);
        const mid = BABYLON.Vector3.Center(start, end);

        const laser = BABYLON.MeshBuilder.CreateCylinder('laser_' + Date.now(),
            { diameter: 0.12, height: dist, tessellation: 8 }, scene);
        laser.position.copyFrom(mid);
        laser.lookAt(end);
        laser.rotation.x += Math.PI / 2;

        const m = new BABYLON.StandardMaterial('laserMat_' + Date.now(), scene);
        m.emissiveColor = color || new BABYLON.Color3(0, 1, 1);
        m.disableLighting = true;
        m.alpha = 0.9;
        laser.material = m;
        laser.isPickable = false;

        // Flash à l'impact
        const flash = BABYLON.MeshBuilder.CreateSphere('laserFlash_' + Date.now(),
            { diameter: 1.5, segments: 8 }, scene);
        flash.position.copyFrom(end);
        const fm = new BABYLON.StandardMaterial('laserFlashMat_' + Date.now(), scene);
        fm.emissiveColor = color || new BABYLON.Color3(0, 1, 1);
        fm.disableLighting = true;
        fm.alpha = 0.8;
        flash.material = fm;
        flash.isPickable = false;

        let life = 0.18;
        const fade = () => {
            life -= engine.getDeltaTime() / 1000;
            if (life <= 0) {
                laser.dispose();
                flash.dispose();
            } else {
                const a = Math.max(0, life / 0.18);
                m.alpha = a;
                fm.alpha = a;
                flash.scaling.setAll(1 + (1 - a) * 2);
                requestAnimationFrame(fade);
            }
        };
        requestAnimationFrame(fade);
    }

    /* ============================================================ EXPLOSION */
    function spawnExplosion(pos, color, count) {
        const ps = new BABYLON.ParticleSystem('explosion_' + Date.now(), count || 50, scene);
        ps.particleTexture = makeStarTexture();
        ps.emitter = pos;
        ps.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        ps.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        ps.color1 = color || new BABYLON.Color4(1, 0.6, 0.2, 1);
        ps.color2 = color || new BABYLON.Color4(1, 0.3, 0.1, 0.8);
        ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        ps.minSize = 0.2; ps.maxSize = 0.8;
        ps.minLifeTime = 0.3; ps.maxLifeTime = 0.9;
        ps.emitRate = 0;
        ps.manualEmitCount = count || 50;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        ps.direction1 = new BABYLON.Vector3(-1, -1, -1);
        ps.direction2 = new BABYLON.Vector3(1, 1, 1);
        ps.minEmitPower = 2; ps.maxEmitPower = 6;
        ps.gravity = new BABYLON.Vector3(0, 0, 0);
        ps.start();
        setTimeout(() => { ps.stop(); setTimeout(() => ps.dispose(), 1200); }, 100);
    }

    /* ============================================================ PICKING */
    function attachPicking() {
        scene.onPointerObservable.add(info => {
            if (info.type === BABYLON.PointerEventTypes.POINTERPICK) {

                // Priorité  : ennemis (combat)
                const enemyPick = scene.pick(scene.pointerX, scene.pointerY,
                    m => m.metadata && m.metadata.enemyId !== undefined);
                if (enemyPick.hit && enemyPick.pickedMesh) {
                    destroyEnemy(enemyPick.pickedMesh.metadata.enemyId, true);
                    return;
                }
                // Priorité  : anomalies vertes (combat / easter egg)
                const portalPick = scene.pick(scene.pointerX, scene.pointerY,
                    m => m.metadata && m.metadata.portalIndex !== undefined);
                if (portalPick.hit && portalPick.pickedMesh) {
                    destroyPortal(portalPick.pickedMesh.metadata.portalIndex, true);
                    return;
                }
                                // Priorité  : soleil / planètes (navigation)
                let pickedSun = scene.pick(scene.pointerX, scene.pointerY,
                    m => m === sunCore || (m.metadata && m.metadata.section === 'home'));
                if (pickedSun.hit) { flyTo('home'); return; }
                const pick = scene.pick(scene.pointerX, scene.pointerY,
                    m => m.metadata && m.metadata.section);
                if (pick.hit && pick.pickedMesh) {
                    flyTo(pick.pickedMesh.metadata.section);
                    return;
                }
            }
            // Hover → curseur
            if (info.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                const pick = scene.pick(scene.pointerX, scene.pointerY,
                    m => m.metadata && (m.metadata.section || m.metadata.enemyId !== undefined || m.metadata.portalIndex !== undefined));
                canvas.style.cursor = pick.hit ? 'pointer' : 'default';
            }
        });
    }

    /* ============================================================ VOL */
    function flyTo(sectionId) {
        if (!SECTIONS[sectionId]) return;
        targetPlanet = sectionId;
        mode = 'flying';
        scanProgress = 0;
        setModeCb('flying');
    }

    function returnToCenter() {
        targetPlanet = 'home';
        targetMoon = -1;
        mode = 'flying';
        scanProgress = 0;
        setModeCb('flying');
    }


    function setModeCb(m) { if (onModeCb) onModeCb(m); }

    /* ============================================================ RENDER */
    let elapsed = 0;
    function renderLoop() {
        const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
        elapsed += dt;

        // Les planètes orbitent autour du soleil
        updatePlanetOrbits(dt);

        // Le vaisseau
        updateShip(dt);
        updateCamera(dt);
        updateScanner(dt);

        // Portails Rick & Morty / anomalies
        updatePortals(dt);

        // Ennemis
        updateEnemies(dt);

        // Comètes
        updateComets(dt);

        scene.render();
    }

    function updatePlanetOrbits(dt) {
        // Orbites des planètes autour du soleil
        Object.keys(SECTIONS).forEach(id => {
            if (id === 'home') {
                sunCore.rotation.y += dt * 0.05;
                sunCore.scaling.setAll(1 + Math.sin(elapsed * 0.8) * 0.015);
                return;
            }
            if (!planets[id]) return;  // safety
            // Avance l'angle orbital
            const o = SECTIONS[id].orbit;
            o.angle += o.speed * dt;
            // Repositionne la planète sur son orbite (référence directe au Vector3 du root)
            planets[id].root.position.x = o.radius * Math.cos(o.angle);
            planets[id].root.position.y = o.height;
            planets[id].root.position.z = o.radius * Math.sin(o.angle);
            // Rotation propre + halo pulse
            if (planets[id].body) planets[id].body.rotation.y += dt * 0.3;
            if (planets[id].halo) {
                planets[id].halo.scaling.setAll(1 + Math.sin(elapsed * 1.2 + o.angle * 2) * 0.03);
            }
        });

        // Lunes de MISSIONS : orbitent autour de la planète projects
        const projectsPlanet = planets.projects ? planets.projects.root.position : BABYLON.Vector3.Zero();
        for (let i = 0; i < PROJECT_MOONS.length; i++) {
            const m = PROJECT_MOONS[i];
            m.moonAngle += m.moonSpeed * dt;
            const mx = projectsPlanet.x + m.moonDist * Math.cos(m.moonAngle);
            const my = projectsPlanet.y + m.moonDist * Math.sin(m.moonAngle) * Math.sin(m.moonTilt);
            const mz = projectsPlanet.z + m.moonDist * Math.sin(m.moonAngle) * Math.cos(m.moonTilt);
            m.root.position.set(mx, my, mz);
            m.body.rotation.y += dt * 0.5;
        }
    }

    function updateShip(dt) {
        let moveDir = null;

        if (mode === 'flying') {
            const targetWorld = planets[targetPlanet].root.position.clone();
            const toTarget = targetWorld.subtract(shipPos);
            const dist = toTarget.length();
            moveDir = toTarget.clone();
            if (dist > 0.01) moveDir.normalize();

            const desiredSpeed = dist < ARRIVE_DIST * 2 ? dist * 2.5 : MAX_SPEED;
            currentSpeed += (desiredSpeed - currentSpeed) * Math.min(1, dt * 2.5);
            shipPos.addInPlace(moveDir.scale(currentSpeed * dt));

            if (moveDir.lengthSquared() > 0.01) {
                const targetYaw = Math.atan2(-moveDir.x, -moveDir.z);
                shipYaw = lerpAngle(shipYaw, targetYaw, Math.min(1, dt * 4));
            }
            enginesBoost(dt, currentSpeed > 3);

            if (dist < ARRIVE_DIST) {
                currentSpeed = 0;
                mode = 'orbiting';
                const d2 = planets[targetPlanet].root.position.subtract(shipPos);
                orbitAngle = Math.atan2(d2.z, d2.x);
                setModeCb('orbiting');
                if (!planets[targetPlanet].discovered) {
                    planets[targetPlanet].discovered = true;
                    if (onDiscoverCb) onDiscoverCb(targetPlanet);
                }
                if (onScanCb) onScanCb(targetPlanet);
            }
        } else if (mode === 'orbiting') {
            const center = planets[targetPlanet].root.position;
            const toPlanet = center.subtract(shipPos);
            const distToPlanet = toPlanet.length();
            if (distToPlanet > 0.5) toPlanet.normalize();
            shipPos.x += Math.sin(elapsed * 0.6) * 0.3 * dt;
            shipPos.y += Math.cos(elapsed * 0.5) * 0.2 * dt;
            const desiredDist = PLANET_ORBIT_R;
            const ajust = toPlanet.scale((distToPlanet - desiredDist) * dt * 1.5);
            shipPos.addInPlace(ajust);
            currentSpeed = 0;
            const lookAt = center.subtract(shipPos);
            if (lookAt.lengthSquared() > 0.01) {
                shipYaw = lerpAngle(shipYaw, Math.atan2(-lookAt.x, lookAt.z), Math.min(1, dt * 5));
            }
            enginesBoost(dt, false);
        } else if (mode === 'flying_moon') {
            const moon = PROJECT_MOONS[targetMoon];
            if (!moon) { mode = 'flying'; return; }
            const targetWorld = moon.root.position.clone();
            const toTarget = targetWorld.subtract(shipPos);
            const dist = toTarget.length();
            moveDir = dist > 0.01 ? toTarget.clone().normalize() : BABYLON.Vector3.Forward();
            const desiredSpeed = dist < 12 ? dist * 2 : MAX_SPEED * 0.8;
            currentSpeed += (desiredSpeed - currentSpeed) * Math.min(1, dt * 2.5);
            shipPos.addInPlace(moveDir.scale(currentSpeed * dt));
            if (moveDir.lengthSquared() > 0.01) {
                shipYaw = lerpAngle(shipYaw, Math.atan2(-moveDir.x, moveDir.z), Math.min(1, dt * 4));
            }
            enginesBoost(dt, currentSpeed > 3);
            if (dist < 8) {
                currentSpeed = 0;
                mode = 'orbiting_moon';
                orbitAngle = Math.atan2(
                    moon.root.position.z - shipPos.z,
                    moon.root.position.x - shipPos.x
                );
                setModeCb('orbiting');
            }
        } else if (mode === 'orbiting_moon') {
            const center = moon.root.position;
            const toMoon = center.subtract(shipPos);
            const distToMoon = toMoon.length();
            if (distToMoon > 0.5) toMoon.normalize();
            shipPos.x += Math.sin(elapsed * 0.7) * 0.2 * dt;
            shipPos.y += Math.cos(elapsed * 0.6) * 0.15 * dt;
            const desiredDist = 8;
            const ajust = toMoon.scale((distToMoon - desiredDist) * dt * 2);
            shipPos.addInPlace(ajust);
            currentSpeed = 0;
            const lookAt = center.subtract(shipPos);
            if (lookAt.lengthSquared() > 0.01) {
                shipYaw = lerpAngle(shipYaw, Math.atan2(-lookAt.x, -lookAt.z), Math.min(1, dt * 5));
            }
            enginesBoost(dt, false);
            scanProgress = Math.min(1, scanProgress + dt / 1.5);
            if (scanProgress >= 1) {
                if (onScanCb) onScanCb('projects');
            }
        } else if (mode === 'idle') {
            if (idlePath.length === 0) { mode = 'orbiting'; return; }
            const from = idlePath[idlePathIdx];
            const to = idlePath[(idlePathIdx + 1) % idlePath.length];
            const t = idlePathT;
            shipPos.x = from.x + (to.x - from.x) * t;
            shipPos.y = from.y + (to.y - from.y) * t;
            shipPos.z = from.z + (to.z - from.z) * t;
            const dx = to.x - from.x, dz = to.z - from.z;
            if (dx * dx + dz * dz > 0.01) {
                shipYaw = lerpAngle(shipYaw, Math.atan2(-dx, -dz), Math.min(1, dt * 3));
            }
            const segLen = Math.hypot(dx, dz);
            idlePathT += (idleSpeed * dt) / (segLen || 1);
            if (idlePathT >= 1) { idlePathT -= 1; idlePathIdx = (idlePathIdx + 1) % idlePath.length; }
            enginesBoost(dt, false);
        }

        ship.position.copyFrom(shipPos);
        ship.rotation.y = shipYaw;
        ship.rotation.x = 0;
        ship.rotation.z = Math.sin(elapsed * 0.8) * 0.03;
    }

    // Lerp d'angle (prend le chemin le plus court à travers ±π)
    function lerpAngle(from, to, t) {
        let d = to - from;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return from + d * t;
    }

    function enginesBoost(dt, boosting) {
        const sc = boosting ? 1.8 + Math.sin(elapsed * 25) * 0.3 : 0.7 + Math.sin(elapsed * 4) * 0.15;
        engineGlow.forEach(e => e.scaling.setAll(sc));
        if (engineParticles) {
            engineParticles.emitRate = boosting ? 160 : 20;
            engineParticles.minEmitPower = boosting ? 2 : 0.4;
        }
        if (window.StarfieldBG) {
            const boost = mode === 'flying' ? 1 + (currentSpeed / MAX_SPEED) * 4 : 1;
            window.StarfieldBG.setBoost(boost);
        }
    }

    function updateCamera(dt) {
        const planet = planets[targetPlanet];
        const planetCenter = planet ? planet.root.position : SUN_POS;

        if (mode === 'flying') {
            const fx = -Math.sin(shipYaw), fz = -Math.cos(shipYaw);
            const back = 12, up = 5;
            const desired = new BABYLON.Vector3(
                shipPos.x - fx * back, shipPos.y + up, shipPos.z - fz * back
            );
            camera.position = BABYLON.Vector3.Lerp(camera.position, desired, Math.min(1, dt * 3.5));
            const look = new BABYLON.Vector3(
                shipPos.x + fx * 20, shipPos.y - 1, shipPos.z + fz * 20
            );
            camera.setTarget(BABYLON.Vector3.Lerp(camera.getTarget(), look, Math.min(1, dt * 6)));
        } else if (mode === 'idle') {
            // Camera stays exactly where it is — no tracking at all
        } else {
            // Orbiting: orbit slowly around the planet, zoomed out
            const orbitCamAngle = elapsed * 0.15;
            const cx = Math.sin(orbitCamAngle), cz = Math.cos(orbitCamAngle);
            const back = 28, up = 8;
            const camPos = new BABYLON.Vector3(
                planetCenter.x + cx * back, planetCenter.y + up, planetCenter.z + cz * back
            );
            camera.position = BABYLON.Vector3.Lerp(camera.position, camPos, Math.min(1, dt * 2));
            camera.setTarget(BABYLON.Vector3.Lerp(camera.getTarget(), planetCenter, Math.min(1, dt * 6)));
        }

        camera.fov = 1.05 + (mode === 'flying' ? Math.min(0.2, currentSpeed / MAX_SPEED * 0.2) : 0);
    }

    function updateScanner(dt) {
        if (mode !== 'orbiting') { scanProgress = 0; return; }
        scanProgress = Math.min(1, scanProgress + dt / 2);
        if (scanProgress >= 1) {
            if (!planets[targetPlanet].discovered) {
                planets[targetPlanet].discovered = true;
                if (onDiscoverCb) onDiscoverCb(targetPlanet);
                // Rend la planète plus brillante
                const p = planets[targetPlanet];
                if (p.body) p.body.material.emissiveColor = p.color.scale(0.6);
            }
            if (onScanCb) onScanCb(targetPlanet);
        }
    }

    /* ============================================================ ÉTAT PUBLIQUE */
    function getShipState() {
        return { x: shipPos.x, y: shipPos.y, z: shipPos.z, speed: currentSpeed, target: targetPlanet, mode };
    }
    function getScanState() {
        return {
            id: (mode === 'orbiting' || mode === 'flying') ? targetPlanet : null,
            progress: scanProgress,
            discoveredCount: Object.keys(planets).filter(id => planets[id].discovered).length,
            total: Object.keys(planets).length
        };
    }
    function getStationsForRadar() {
        return Object.keys(SECTIONS).map(id => {
            const cfg = SECTIONS[id];
            const p = id === 'home' ? BABYLON.Vector3.Zero() : planets[id].root.position;
            const dx = p.x - shipPos.x;
            const dz = p.z - shipPos.z;
            return { id, dx, dz, d: Math.hypot(dx, dz), discovered: planets[id].discovered, color: cfg.color, label: cfg.label };
        });
    }
    // Snapshots pour la map 2D (positions top-down)
    function getSystemSnapshot() {
        return SECTION_ORDER.map(id => {
            const cfg = SECTIONS[id];
            const p = id === 'home' ? BABYLON.Vector3.Zero() : planets[id].root.position;
            return { id, x: p.x, z: p.z, color: cfg.color, label: cfg.label, glyph: cfg.glyph, radius: cfg.orbit.radius, discovered: planets[id].discovered };
        });
    }
    function nextSection() {
        const i = SECTION_ORDER.indexOf(targetPlanet);
        return SECTION_ORDER[(i + 1) % SECTION_ORDER.length];
    }
    function prevSection() {
        const i = SECTION_ORDER.indexOf(targetPlanet);
        return SECTION_ORDER[(i - 1 + SECTION_ORDER.length) % SECTION_ORDER.length];
    }
    function getMode() { return mode; }
    function isMobile() { return ('ontouchstart' in window && window.innerWidth < 900); }

    return {
        init, onReady, isMobile, SECTIONS, SECTION_ORDER,
        flyTo, returnToCenter, getMode,
        getShipState, getScanState, getStationsForRadar, getSystemSnapshot,
        nextSection, prevSection, getScore,
        setOnScanCb: cb => { onScanCb = cb; },
        setOnDiscoverCb: cb => { onDiscoverCb = cb; },
        setOnModeCb: cb => { onModeCb = cb; },
        setOnPortalCb: cb => { onPortalCb = cb; },
        setOnScoreCb: cb => { onScoreCb = cb; },
        setIdleMode: () => { mode = "idle"; }

    };
})();
