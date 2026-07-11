/* ============================================================
 * cockpit-ui.ts — Boucle de jeu HUD + briefing + panneau station
 * ============================================================ */
import { PORTFOLIO } from './portfolio-data';

// Lazy-loaded: Babylon (space-cockpit) + mini-jeux ne sont chargés qu'au clic.
// space-cockpit assigne window.SpaceCockpit, mini-games exporte ses fonctions.
let SpaceCockpit: import('./space-cockpit').SpaceCockpitAPI | undefined;
let initMiniGames: () => void = () => {};
let openGamesMenu: () => void = () => {};
let closeGamesMenu: () => void = () => {};

// Pré-charge le bundle 3D pendant le briefing (ne bloque pas le load initial)
const cockpitReady = import('./space-cockpit').then(mod => {
    SpaceCockpit = mod.SpaceCockpit;
}).catch(e => console.error('space-cockpit load error:', e));

// Mini-jeux chargés au clic JEUX
const gamesReady = import('./mini-games').then(mod => {
    initMiniGames = mod.initMiniGames;
    openGamesMenu = mod.openGamesMenu;
    closeGamesMenu = mod.closeGamesMenu;
}).catch(e => console.error('mini-games load error:', e));

    function el(id: string): HTMLElement { return document.getElementById(id) as HTMLElement; }
    function esc(s: unknown) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!;
        });
    }
    function $all(sel: string, ctx?: ParentNode) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)) as HTMLElement[]; }
    function svgEl(tag: string): SVGElement { return document.createElementNS('http://www.w3.org/2000/svg', tag) as SVGElement; }
    function attr(e: SVGElement | HTMLElement, name: string, val: string | number) { e.setAttribute(name, String(val)); }

    var lastScanned: string | null = null;
    var hudStarted = false;

    // ----------------------------------------------------------
    // DÉMARRAGE
    // ----------------------------------------------------------
    function init() {
        el('footer-year').textContent = String(new Date().getFullYear());

        // Wire le bouton briefing → lance la 3D
                el('briefing-start').addEventListener('click', startGame);

                // Version simple — depuis le briefing
                el('briefing-simple').addEventListener('click', function() {
                    window.location.href = 'simple.html';
                });

                // Version simple — depuis le HUD
                var simpleBtn = el('simple-btn');
                if (simpleBtn) simpleBtn.addEventListener('click', function() {
                    window.location.href = 'simple.html';
                });

                // Auto-redirect mobile (< 768px) → simple, SAUF si l'utilisateur
                // a explicitement demandé la 3D via ?3d=1 (bouton "s'envoler" sur simple.html)
                if (window.innerWidth < 768 && !/[?&]3d=1\b/.test(location.search)) {
                    window.location.href = 'simple.html';
                }

        // Fermer le panneau (Échap ou bouton)
        el('panel-close').addEventListener('click', closePanel);
        // Flèches ← → = navigation entre stations, Échap/X = ferme panneau
                        document.addEventListener('keydown', function (e) {
                            if (!window.SpaceCockpit) return;
                            // Ignore les touches si les mini-jeux sont ouverts
                            if (el('games-overlay').classList.contains('open')) return;
                            if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
                                if (el('panel').classList.contains('open')) closePanel();
                                if (SpaceCockpit.getMode() !== 'observing') SpaceCockpit.setObservingMode();
                            } else if (e.key === 'ArrowRight') {
                                SpaceCockpit.flyTo(SpaceCockpit.nextSection());
                            } else if (e.key === 'ArrowLeft') {
                                SpaceCockpit.flyTo(SpaceCockpit.prevSection());
                            } else if (e.key === 'm' || e.key === 'M') {
                                toggleMap();
                            } else if (e.key === 'g' || e.key === 'G') {
                                openGamesMenu();
                            }
                        });

        // Bouton MAP
        var mapBtn = el('map-btn');
        if (mapBtn) mapBtn.addEventListener('click', toggleMap);
        var mapClose = el('map-close');
        if (mapClose) mapClose.addEventListener('click', toggleMap);

        // Bouton MINI-JEUX — chargés en lazy, wire les listeners quand prêts
        gamesReady.then(function () {
            initMiniGames();
        });
        var gamesBtn = el('games-btn');
        if (gamesBtn) gamesBtn.addEventListener('click', function () { openGamesMenu(); });
        var gamesClose = el('games-close');
        if (gamesClose) gamesClose.addEventListener('click', function () { closeGamesMenu(); });

        // Callbacks 3D — attend que le bundle Babylon soit chargé
        cockpitReady.then(function () {
            if (!SpaceCockpit) { console.error('SpaceCockpit manquant'); return; }
            SpaceCockpit.init();
            SpaceCockpit.onReady(function () {
                SpaceCockpit.setOnScanCb(function (sectionId) {
                    if (sectionId !== lastScanned) {
                        lastScanned = sectionId;
                        openStation(sectionId);
                    }
                });
                SpaceCockpit.setOnDiscoverCb(function (sectionId) {
                    // feedback visuel : la planète s'illumine déjà côté 3D
                });
                SpaceCockpit.setOnModeCb(function (m) {
                    // Met à jour l'indicateur si besoin
                });
                SpaceCockpit.setOnPortalCb(function (quote) {
                    showPortalToast(quote);
                });
                SpaceCockpit.setOnScoreCb(function (evt) {
                    showCombatToast('+' + evt.gained + ' · ' + evt.reason + (evt.combo > 1 ? ' (x' + evt.combo + ')' : ''));
                });
                // Démarre la boucle HUD
                requestAnimationFrame(hudLoop);
            });
        });
    }

    function startGame() {
        el('briefing').classList.add('hidden');
        hudStarted = true;
        // Hint jeu après 3s — une seule fois
        setTimeout(function () {
            showGameHint(
                'CLIQUER LES ASTÉROÏDES = +100 pts · CLIQUER LES PORTAILS VERTS = +150 pts\n' +
                'CLIQUER une planète = voyager · MAP (M) = carte · JEUX (G) = mini-jeux'
            );
            // Hint des planètes non-découvertes
            setTimeout(function () {
                if (window.SpaceCockpit) {
                    var radar = SpaceCockpit.getStationsForRadar();
                    var unknown = radar.filter(function (r) { return !r.discovered; });
                    if (unknown.length > 0) {
                        showGameHint('? = planète non scannée — approche-toi pour la découvrir');
                    }
                }
            }, 5000);
        }, 3000);
        // Messages radio périodiques
        startRadioMessages();
    }

    // ----------------------------------------------------------
    // MESSAGES RADIO (ambiance périodique)
    // ----------------------------------------------------------
    var radioMessages = [
        '📡 Station de contrôle : soucoupe en observation, tout est calme.',
        '📡 Capitaine, champ d\'astéroïdes détecté sur le radar. Restez vigilant.',
        '📡 Nouveau signal : une station orbitale émet sur la fréquence 42.7 MHz.',
        '📡 Rapport : le système solaire est stable. Aucune anomalie critique.',
        '📡 Astéroïde dérivant à proximité — prêt à intercepter si nécessaire.',
        '📡 Soucoupe, votre orbite est impeccable. Continuez l\'exploration.',
        '📡 Portail vert détecté dans le secteur. Origine inconnue.',
        '📡 Données de scan enregistrées. Stations découvertes : en progression.',
        '📡 Contrôle : n\'oubliez pas, chaque planète révèle une partie du profil.',
        '📡 Fréquence radio : bruit cosmique de fond détecté. C\'est... magnifique.',
        '📡 Alerte : activité météoritique légère dans le secteur externe.',
        '📡 Station de contrôle : mini-jeux disponibles via le panneau de bord (G).',
        '📡 Capitaine, les trajectoires d\'orbite sont stables et élégantes aujourd\'hui.',
        '📡 Signal intermittent : pourrait être un artefact ancien. Investigation recommandée.',
        '📡 Contrôle : votre soucoupe vole comme un rêve. Beau travail.'
    ];
    var radioTimer = null;
    function startRadioMessages() {
        if (radioTimer) clearInterval(radioTimer);
        radioTimer = setInterval(function () {
            if (!hudStarted) return;
            // Ne pas afficher si un toast est déjà visible
            var toast = el('combat-toast');
            if (toast && toast.classList.contains('show')) return;
            var msg = radioMessages[Math.floor(Math.random() * radioMessages.length)];
            showGameHint(msg);
        }, 12000);  // toutes les 12 secondes
    }

    // ----------------------------------------------------------
    // HINT JEU (toast générique)
    // ----------------------------------------------------------
    var gameHintTimer = null;
    function showGameHint(msg) {
        var toast = el('combat-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        toast.classList.add('hint-mode');
        if (gameHintTimer) clearTimeout(gameHintTimer);
        gameHintTimer = setTimeout(function () { toast.classList.remove('show', 'hint-mode'); }, 6000);
    }

    // ----------------------------------------------------------
    // BOUCLE HUD (radar, vit, boost, scan, progression)
    // ----------------------------------------------------------
    function hudLoop() {
        if (!window.SpaceCockpit) { requestAnimationFrame(hudLoop); return; }
        var ship = SpaceCockpit.getShipState();
        var scan = SpaceCockpit.getScanState();

        // Journal de bord : liste des planètes + distance + état
        renderNavLog(ship, scan);

        // Scanner
        var sc = el('scanner');
        var scFill = el('scanner-fill');
        var scLabel = el('scanner-label');
        if (scan.id && scan.progress < 1) {
            sc.classList.add('active');
            if (scFill) scFill.style.width = (scan.progress * 100) + '%';
            var cfg = SpaceCockpit.SECTIONS[scan.id];
            if (scLabel && cfg) scLabel.textContent = 'SCAN ' + cfg.label + '…';
        } else {
            sc.classList.remove('active');
        }

        // Progression découvertes
        var mpFill = el('mp-fill');
        var mpCount = el('mp-count');
        if (mpFill) mpFill.style.width = ((scan.discoveredCount / scan.total) * 100) + '%';
        if (mpCount) mpCount.textContent = String(scan.discoveredCount);

        // Score de combat (astéroïdes 3D + high scores mini-jeux localStorage)
        var scoreEl = el('score-val');
        var comboEl = el('combo-val');
        var tooltipEl = el('score-tooltip');
        var scoreState = SpaceCockpit.getScore();
        var hs: Record<string, number> = {};
        try { hs = JSON.parse(localStorage.getItem('samsoucoupe_highscores') || '{}'); } catch (e) {}
        var inv = hs['invader'] || 0;
        var snk = hs['snake'] || 0;
        var met = hs['meteor'] || 0;
        var mgTotal = inv + snk + met;
        var totalScore = scoreState.score + mgTotal;
        if (scoreEl) scoreEl.textContent = totalScore.toLocaleString('fr-FR');
        if (comboEl) {
            comboEl.textContent = scoreState.combo > 1 ? 'x' + scoreState.combo : '';
            comboEl.style.opacity = String(scoreState.combo > 1 ? 1 : 0);
        }
        // Tooltip détaillé : détails par source
        if (tooltipEl) {
            tooltipEl.innerHTML =
                '<div class="st-row"><span class="st-label">ASTÉROÏDES</span><span class="st-val">' + scoreState.score.toLocaleString('fr-FR') + '</span></div>' +
                '<div class="st-row"><span class="st-label">MINI-JEUX</span><span class="st-val">' + mgTotal.toLocaleString('fr-FR') + '</span></div>' +
                '<div class="st-divider"></div>' +
                '<div class="st-row"><span class="st-label">INVADER</span><span class="st-val">' + inv + '</span></div>' +
                '<div class="st-row"><span class="st-label">SNAKE</span><span class="st-val">' + snk + '</span></div>' +
                '<div class="st-row"><span class="st-label">COMET DODGE</span><span class="st-val">' + met + '</span></div>' +
                '<div class="st-divider"></div>' +
                '<div class="st-row"><span class="st-label">TOTAL</span><span class="st-val st-total">' + totalScore.toLocaleString('fr-FR') + '</span></div>' +
                '<div class="st-records">RECORDS PAR JEU</div>';
        }

        // Rafraîchit la map si ouverte
        if (el('map-overlay').classList.contains('open')) updateSystemMap();

        // Radar
        updateRadar();

        requestAnimationFrame(hudLoop);
    }

    function updateRadar() {
        var blips = SpaceCockpit.getStationsForRadar();
        var container = el('radar-blips');
        if (!container) return;
        var range = 200; // portée radar en unités
        var rr = 70;     // rayon radar en % (0 = centre)
        // Orientation radar : rotation selon le yaw du vaisseau
        var ship = SpaceCockpit.getShipState();
        var yaw = ship.yaw || 0;
        var cosY = Math.cos(yaw), sinY = Math.sin(yaw);
        // Garde un div par blip (stable) + clic pour voler
        blips.forEach(function (b) {
            var node = container.querySelector('[data-id="' + b.id + '"]') as HTMLElement | null;
            if (!node) {
                node = document.createElement('div');
                node.className = 'radar-blip';
                node.dataset.id = b.id;
                node.style.background = b.color;
                node.style.color = b.color;
                node.title = b.label + ' — clic pour y voler';
                node.style.cursor = 'pointer';
                node.addEventListener('click', function () { SpaceCockpit.flyTo(b.id); });
                container.appendChild(node);
            }
            node.classList.toggle('discovered', b.discovered);
            node.classList.toggle('undiscovered', !b.discovered);
            if (b.d <= range) {
                // Rotation des coordonnées monde → coords radar (orienté vaisseau)
                var rx = b.dx * cosY - b.dz * sinY;
                var rz = b.dx * sinY + b.dz * cosY;
                var px = -(rx / range) * rr;
                var py = (rz / range) * rr;
                node.style.left = (50 + px) + '%';
                node.style.top = (50 + py) + '%';
                node.style.display = 'block';
            } else {
                node.style.display = 'none';
            }
        });

        // Astéroïdes sur le radar (blips rouges temporaires)
        var astBlips = SpaceCockpit.getAsteroidsForRadar();
        var astRange = 250;
        // Compte les blips astéroïdes existants
        var existingAst = container.querySelectorAll('[data-ast]');
        existingAst.forEach(function (n) { (n as HTMLElement).style.display = 'none'; });
        astBlips.forEach(function (b, i) {
            var node = container.querySelector('[data-ast="' + i + '"]') as HTMLElement | null;
            if (!node) {
                node = document.createElement('div');
                node.className = 'radar-blip radar-ast';
                node.dataset.ast = String(i);
                node.style.background = '#ff4060';
                node.style.color = '#ff4060';
                node.style.boxShadow = '0 0 4px #ff4060';
                container.appendChild(node);
            }
            if (b.d <= astRange) {
                // Rotation comme les planètes
                var rx = b.dx * cosY - b.dz * sinY;
                var rz = b.dx * sinY + b.dz * cosY;
                var px = -(rx / astRange) * rr;
                var py = (rz / astRange) * rr;
                node.style.left = (50 + px) + '%';
                node.style.top = (50 + py) + '%';
                node.style.display = 'block';
            } else {
                node.style.display = 'none';
            }
        });
    }

    // ----------------------------------------------------------
    // TOAST PORTAIL RICK & MORTY
    // ----------------------------------------------------------
    var portalToastTimer = null;
    function showPortalToast(quote) {
        var toast = el('portal-toast');
        var quoteEl = el('portal-quote');
        if (!toast || !quoteEl) return;
        quoteEl.textContent = '"' + quote + '"';
        toast.classList.add('show');
        if (portalToastTimer) clearTimeout(portalToastTimer);
        portalToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 6000);
    }

    var combatToastTimer = null;
    function showCombatToast(msg) {
        var toast = el('combat-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        if (combatToastTimer) clearTimeout(combatToastTimer);
        combatToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
    }

    // ----------------------------------------------------------
    // JOURNAL DE BORD : liste planètes + distance + état, cliquable
    // ----------------------------------------------------------
    function renderNavLog(ship, scan) {
        var list = el('nav-log-list');
        if (!list || !window.SpaceCockpit) return;
        var radar = SpaceCockpit.getStationsForRadar();
        var html = '';
        radar.forEach(function (r) {
            var cfg = SpaceCockpit.SECTIONS[r.id];
            var isTarget = (ship.target === r.id && ship.mode !== 'observing');
            var stateIcon = r.discovered ? '✓' : '?';
            var stateClass = r.discovered ? 'discovered' : 'unknown';
            var distStr = r.d < 1000 ? Math.round(r.d) + 'u' : (r.d / 1000).toFixed(1) + 'ku';
            var rowClass = isTarget ? 'nav-log-row active' : 'nav-log-row';
            html += '<li class="' + rowClass + '" data-id="' + r.id + '">' +
                '<span class="nl-dot" style="background:' + cfg.color + '"></span>' +
                '<span class="nl-label">' + esc(cfg.label) + '</span>' +
                '<span class="nl-state ' + stateClass + '">' + stateIcon + '</span>' +
                '<span class="nl-dist">' + distStr + '</span>' +
                '</li>';
        });
        // Update optimisé : recréer seulement si structure différente
        if (list.dataset.signature !== html) {
            list.innerHTML = html;
            list.dataset.signature = html;
            list.querySelectorAll('.nav-log-row').forEach(function (row) {
                row.addEventListener('click', function () {
                    SpaceCockpit.flyTo((row as HTMLElement).dataset.id!);
                });
            });
        } else {
            // Update léger des distances/états si structure identique
            list.querySelectorAll('.nav-log-row').forEach(function (row, i) {
                var r = radar[i]; if (!r) return;
                var distStr = r.d < 1000 ? Math.round(r.d) + 'u' : (r.d / 1000).toFixed(1) + 'ku';
                var distEl = row.querySelector('.nl-dist'); if (distEl) distEl.textContent = distStr;
                var stateEl = row.querySelector('.nl-state');
                if (stateEl) {
                    stateEl.textContent = r.discovered ? '✓' : '?';
                    stateEl.className = 'nl-state ' + (r.discovered ? 'discovered' : 'unknown');
                }
                row.classList.toggle('active', ship.target === radar[i].id && ship.mode !== 'observing');
            });
        }
    }

    // ----------------------------------------------------------
    // MAP du système solaire (overlay 2D top-down)
    // ----------------------------------------------------------
    function toggleMap() {
        var overlay = el('map-overlay');
        if (!overlay) return;
        if (overlay.classList.contains('open')) {
            overlay.classList.remove('open');
        } else {
            renderSystemMap();
            overlay.classList.add('open');
        }
    }

    function renderSystemMap() {
        var svg = el('map-svg');
        if (!svg || !window.SpaceCockpit) return;
        var snapshot = SpaceCockpit.getSystemSnapshot();

        // ViewBox fixe basé sur le rayon d'orbite maximum (ne tremble pas)
        var maxR = 0;
        snapshot.forEach(function (s) { if (s.radius > maxR) maxR = s.radius; });
        var vb = maxR + 90;
        svg.setAttribute('viewBox', (-vb) + ' ' + (-vb) + ' ' + (vb * 2) + ' ' + (vb * 2));
        svg.dataset.vb = String(vb);

        // --- couches statiques ---
        var orbitsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        orbitsGroup.id = 'map-orbits';
        snapshot.forEach(function (s) {
            if (s.radius > 0) {
                var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttribute('cx', '0'); c.setAttribute('cy', '0'); c.setAttribute('r', String(s.radius));
                c.setAttribute('fill', 'none');
                c.setAttribute('stroke', 'rgba(0,225,255,0.12)');
                c.setAttribute('stroke-width', '1');
                c.setAttribute('stroke-dasharray', '2 4');
                orbitsGroup.appendChild(c);
            }
        });

        var nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodesGroup.id = 'map-nodes';
        snapshot.forEach(function (s) {
            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.classList.add('map-node');
            g.dataset.id = s.id;
            g.style.cursor = 'pointer';

            var hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hit.dataset.part = 'hit';
            hit.setAttribute('r', String(s.id === 'home' ? 16 : 13));
            hit.setAttribute('fill', 'transparent');
            g.appendChild(hit);

            var planet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            planet.dataset.part = 'planet';
            planet.setAttribute('r', String(s.id === 'home' ? 10 : 7));
            planet.setAttribute('fill', s.color);
            planet.setAttribute('opacity', String(s.discovered ? 1 : 0.4));
            planet.style.filter = 'drop-shadow(0 0 6px ' + s.color + ')';
            g.appendChild(planet);

            var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.dataset.part = 'label';
            label.setAttribute('fill', s.color);
            label.setAttribute('font-family', 'Orbitron');
            label.setAttribute('font-size', '8');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('opacity', String(s.discovered ? 1 : 0.4));
            label.textContent = esc(s.label);
            g.appendChild(label);

            g.addEventListener('click', function () {
                SpaceCockpit.flyTo(s.id);
                el('map-overlay').classList.remove('open');
            });
            nodesGroup.appendChild(g);
        });

        injectMapPath(svg);

        var shipGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        shipGroup.id = 'map-ship';
        var shipMarker = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        shipMarker.setAttribute('fill', '#00e1ff');
        shipMarker.setAttribute('style', 'filter: drop-shadow(0 0 4px #00e1ff)');
        shipGroup.appendChild(shipMarker);

        svg.innerHTML = '';
        svg.appendChild(orbitsGroup);
        svg.appendChild(nodesGroup);
        svg.appendChild(shipGroup);

        updateSystemMap();
    }

    function injectMapPath(svg) {
        // Removes old trail group, rebuilds orbit circles
        var old = svg.querySelector('#map-idle-path');
        if (old) old.remove();
        var trails = SpaceCockpit.getOrbitTrailPoints();
        if (!trails || trails.length === 0) return;
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = 'map-idle-path';
        trails.forEach(function(t) {
            // Cercle d'orbite coloré
            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '0');
            circle.setAttribute('cy', '0');
            circle.setAttribute('r', String(t.radius));
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', t.color);
            circle.setAttribute('stroke-opacity', '0.25');
            circle.setAttribute('stroke-width', '1.5');
            circle.setAttribute('stroke-dasharray', '3 6');
            g.appendChild(circle);
            // Points pulsés sur l'orbite (3, décalés à 120°)
            for (var k = 0; k < 3; k++) {
                var ang = (k / 3) * Math.PI * 2;
                var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', (t.radius * Math.cos(ang)).toFixed(1));
                dot.setAttribute('cy', (t.radius * Math.sin(ang)).toFixed(1));
                dot.setAttribute('r', '2.5');
                dot.setAttribute('fill', t.color);
                dot.setAttribute('opacity', '0.6');
                g.appendChild(dot);
            }
        });
        svg.appendChild(g);
    }

    function updateSystemMap() {
        var svg = el('map-svg');
        if (!svg || !window.SpaceCockpit) return;
        var snapshot = SpaceCockpit.getSystemSnapshot();
        var ship = SpaceCockpit.getShipState();

        // viewBox FIXE — pas de recalcul (sinon la map tremble)

        snapshot.forEach(function (s) {
            var g = svg.querySelector('.map-node[data-id="' + s.id + '"]');
            if (!g) return;
            var r = s.id === 'home' ? 10 : 7;
            var hit = g.querySelector('[data-part="hit"]');
            var planet = g.querySelector('[data-part="planet"]');
            var label = g.querySelector('[data-part="label"]');
            if (hit) { hit.setAttribute('cx', s.x.toFixed(1)); hit.setAttribute('cy', s.z.toFixed(1)); }
            if (planet) {
                planet.setAttribute('cx', s.x.toFixed(1)); planet.setAttribute('cy', s.z.toFixed(1));
                planet.setAttribute('opacity', String(s.discovered ? 1 : 0.4));
            }
            if (label) {
                label.setAttribute('x', s.x.toFixed(1)); label.setAttribute('y', (s.z + r + 14).toFixed(1));
                label.setAttribute('opacity', String(s.discovered ? 1 : 0.4));
            }
        });

        var shipGroup = svg.querySelector('#map-ship polygon');
        if (shipGroup) {
            shipGroup.setAttribute('points',
                ship.x.toFixed(1) + ',' + (ship.z - 4).toFixed(1) + ' ' +
                (ship.x - 3).toFixed(1) + ',' + (ship.z + 3).toFixed(1) + ' ' +
                (ship.x + 3).toFixed(1) + ',' + (ship.z + 3).toFixed(1));
        }

        injectMapPath(svg);
    }

    // ----------------------------------------------------------
    // PANNEAU STATION
    // ----------------------------------------------------------
    function openStation(sectionId) {
        var title = el('panel-title');
        var body = el('panel-body');
        var panel = el('panel');
        if (!title || !body || !panel) return;
        var P = window.PORTFOLIO || {};
        var html = '';
        switch (sectionId) {
            case 'home':     title.textContent = 'BASE';        html = renderHome(P); break;
            case 'about':    title.textContent = 'PROFIL';      html = renderAbout(P); break;
            case 'skills':   title.textContent = 'ARSENAL';     html = renderSkills(P); break;
            case 'projects': title.textContent = 'MISSIONS';    html = renderProjects(P); break;
            case 'contact':  title.textContent = 'ÉMETTEUR';    html = renderContact(P); break;
        }
        body.innerHTML = html;
        panel.classList.add('open');
    }

    function closePanel() {
            el('panel').classList.remove('open');
            lastScanned = null;
            if (window.SpaceCockpit && SpaceCockpit.getMode() !== 'observing') SpaceCockpit.setObservingMode();
        }

    // ---------- Renderers (identiques, briques cockpit) ----------
    function renderHome(P) {
        var id = P.identity || {};
        var av = id.avatar ? '<div class="hero-avatar-wrap"><img src="' + esc(id.avatar) + '" alt="' + esc(id.name) + '" class="hero-avatar"><div class="hero-avatar-ring"></div></div>' : '';
        return '<div class="hero">' + av + '<div class="hero-info">' +
            '<div class="hero-name">' + esc(id.name || '') + '</div>' +
            '<div class="hero-role">' + esc(id.role || '') + '</div>' +
            '<div class="hero-desc">' + esc(id.tagline || '') + ' ' + esc(id.details || '') + '</div>' +
            '<div class="hero-cta"><a class="cta" href="https://github.com/samsoucoupe" target="_blank"><i class="fab fa-github"></i> GitHub</a><a class="cta" href="https://discord.com/users/388993523715801088" target="_blank"><i class="fab fa-discord"></i> Discord</a></div>' +
            '</div></div>';
    }
    function renderAbout(P) {
        var a = P.about || {};
        var h = '<div class="about-head"><i class="fas fa-id-card"></i> ' + esc(a.subtitle || '') + '</div>';
        (a.paragraphs || []).forEach(function (p) { h += '<p class="about-line">' + esc(p) + '</p>'; });
        if (a.stats && a.stats.length) {
            h += '<div class="about-stats">';
            a.stats.forEach(function (s) { h += '<div class="stat"><b>' + esc(s.number) + '</b><span>' + esc(s.label) + '</span></div>'; });
            h += '</div>';
        }
        return h;
    }
    function renderSkills(P) {
        var sk = P.skills || {};
        var h = '<div class="skills-grid">';
        (sk.categories || []).forEach(function (cat) {
            var chips = (cat.tags || []).map(function (t) { return '<span class="chip">' + esc(t.label) + '</span>'; }).join('');
            h += '<div class="skill-card"><h4><i class="' + esc(cat.icon || '') + '"></i> ' + esc(cat.name || '') + '</h4><div class="chips">' + chips + '</div></div>';
        });
        h += '</div>';
        return h;
    }
    function renderProjects(P) {
        var pr = P.projects || {};
        var STATUS = P.statusLabels || { 'terminée': 'TERMINÉE', 'actif': 'ACTIF', 'archivé': 'ARCHIVÉ', 'en cours': 'EN COURS' };
        var h = '<div class="projects">';
        (pr.items || []).forEach(function (p, i) {
            var media = '';
            if (p.media && p.media.length) {
                var m = p.media[0];
                if (m.type === 'img') media = '<div class="proj-media"><img src="' + esc(m.src) + '" alt="' + esc(m.alt) + '" loading="lazy"></div>';
                else if (m.type === 'video') media = '<div class="proj-media"><video controls preload="none"><source src="' + esc(m.src) + '" type="video/mp4"></video></div>';
                else if (m.type === 'youtube') media = '<div class="proj-media"><a href="' + esc(m.src) + '" target="_blank"><i class="fab fa-youtube"></i> Dossier vidéo</a></div>';
            }
            var tags = (p.tech || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
            var link = p.link ? '<a class="cta" href="' + esc(p.link) + '" target="_blank" style="margin-top:8px;"><i class="fas fa-rocket"></i> Lancer</a>' : '';
            var st = p.status || 'terminée';
            var sl = STATUS[st] || st.toUpperCase();
            h += '<div class="project" style="--accent:' + esc(p.color || '#00e1ff') + '"><div class="proj-top"><span class="proj-code">M-' + (101 + i) + '</span><span class="proj-status ' + esc(st) + '">' + esc(sl) + '</span></div><h4><i class="' + esc(p.icon || '') + '"></i> ' + esc(p.title) + '</h4>' + media + '<p>' + esc(p.description) + '</p><div class="proj-stack">' + tags + '</div>' + link + '</div>';
        });
        h += '</div>';
        return h;
    }
        function renderContact(P) {
            var c = P.contact || {}; var id = P.identity || {};
            var h = '<p class="hero-desc" style="text-align:center;margin-bottom:8px;">' + esc(c.description || '') + '</p>';
            h += '<div class="contact-grid">';
            if (id.discord) h += '<a class="contact-card" href="' + esc(id.discord) + '" target="_blank"><i class="fab fa-discord"></i><b>Discord</b><small>#samsoucoupe</small></a>';
            if (id.github)  h += '<a class="contact-card" href="' + esc(id.github) + '" target="_blank"><i class="fab fa-github"></i><b>GitHub</b><small>/samsoucoupe</small></a>';
            if (id.bmc)     h += '<a class="contact-card" href="' + esc(id.bmc) + '" target="_blank"><i class="fas fa-coffee"></i><b>Coffee</b><small>soutien</small></a>';
            if (id.kofi)    h += '<a class="contact-card" href="' + esc(id.kofi) + '" target="_blank"><i class="fas fa-heart"></i><b>Ko-fi</b><small>soutien</small></a>';
            h += '</div>';
            return h;
        }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
