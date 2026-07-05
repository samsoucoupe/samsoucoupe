/* ============================================================
 * cockpit-ui.js — Boucle de jeu HUD + briefing + panneau station
 * ============================================================ */
(function () {
    'use strict';

    function el(id) { return document.getElementById(id); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

    var lastScanned = null;
    var hudStarted = false;

    // ----------------------------------------------------------
    // DÉMARRAGE
    // ----------------------------------------------------------
    function init() {
        el('footer-year').textContent = new Date().getFullYear();

        // Wire le bouton briefing → lance la 3D
        el('briefing-start').addEventListener('click', startGame);

        // Fermer le panneau (Échap ou bouton)
        el('panel-close').addEventListener('click', closePanel);
        // Flèches ← → = navigation entre stations, Échap = retour centre
        document.addEventListener('keydown', function (e) {
            if (!window.SpaceCockpit) return;
            if (e.key === 'Escape') {
                closePanel();
                SpaceCockpit.returnToCenter();
            } else if (e.key === 'ArrowRight') {
                SpaceCockpit.flyTo(SpaceCockpit.nextSection());
            } else if (e.key === 'ArrowLeft') {
                SpaceCockpit.flyTo(SpaceCockpit.prevSection());
            } else if (e.key === 'm' || e.key === 'M') {
                toggleMap();
            }
        });

        // Bouton MAP
        var mapBtn = el('map-btn');
        if (mapBtn) mapBtn.addEventListener('click', toggleMap);
        var mapClose = el('map-close');
        if (mapClose) mapClose.addEventListener('click', toggleMap);

        // Callbacks 3D
        if (!window.SpaceCockpit) { console.error('SpaceCockpit manquant'); return; }
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
    }

    function startGame() {
        el('briefing').classList.add('hidden');
        hudStarted = true;
        // Hint jeu après 3s — une seule fois
        setTimeout(function () {
            showGameHint(
                'CLIQUER LES DRONES ROUGES = +100 pts · CLIQUER LES PORTAILS VERTS = +150 pts\n' +
                'CLIQUER une planète = voyager · MAP (M) = carte du système'
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
        if (mpCount) mpCount.textContent = scan.discoveredCount;

        // Score de combat
        var scoreEl = el('score-val');
        var comboEl = el('combo-val');
        var scoreState = SpaceCockpit.getScore();
        if (scoreEl) scoreEl.textContent = scoreState.score.toLocaleString('fr-FR');
        if (comboEl) {
            comboEl.textContent = scoreState.combo > 1 ? 'x' + scoreState.combo : '';
            comboEl.style.opacity = scoreState.combo > 1 ? 1 : 0;
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
        // Garde un div par blip (stable) + clic pour voler
        blips.forEach(function (b) {
            var node = container.querySelector('[data-id="' + b.id + '"]');
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
                var px = (b.dx / range) * rr;
                var py = (b.dz / range) * rr;
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
            var isTarget = (ship.target === r.id && ship.mode !== 'idle');
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
                    SpaceCockpit.flyTo(row.dataset.id);
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
                row.classList.toggle('active', ship.target === radar[i].id && ship.mode !== 'idle');
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
        var maxR = 150;
        snapshot.forEach(function (s) { if (s.radius > maxR) maxR = s.radius; });
        var vb = maxR + 60;
        svg.setAttribute('viewBox', (-vb) + ' ' + (-vb) + ' ' + (vb * 2) + ' ' + (vb * 2));
        svg.dataset.vb = vb;

        // --- couches statiques ---
        var orbitsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        orbitsGroup.id = 'map-orbits';
        snapshot.forEach(function (s) {
            if (s.radius > 0) {
                var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttribute('cx', 0); c.setAttribute('cy', 0); c.setAttribute('r', s.radius);
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
            hit.setAttribute('r', s.id === 'home' ? 16 : 13);
            hit.setAttribute('fill', 'transparent');
            g.appendChild(hit);

            var planet = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            planet.dataset.part = 'planet';
            planet.setAttribute('r', s.id === 'home' ? 10 : 7);
            planet.setAttribute('fill', s.color);
            planet.setAttribute('opacity', s.discovered ? 1 : 0.4);
            planet.style.filter = 'drop-shadow(0 0 6px ' + s.color + ')';
            g.appendChild(planet);

            var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.dataset.part = 'label';
            label.setAttribute('fill', s.color);
            label.setAttribute('font-family', 'Orbitron');
            label.setAttribute('font-size', '8');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('opacity', s.discovered ? 1 : 0.4);
            label.textContent = esc(s.label);
            g.appendChild(label);

            g.addEventListener('click', function () {
                SpaceCockpit.flyTo(s.id);
                el('map-overlay').classList.remove('open');
            });
            nodesGroup.appendChild(g);
        });

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

    function updateSystemMap() {
        var svg = el('map-svg');
        if (!svg || !window.SpaceCockpit) return;
        var snapshot = SpaceCockpit.getSystemSnapshot();
        var ship = SpaceCockpit.getShipState();

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
                planet.setAttribute('opacity', s.discovered ? 1 : 0.4);
            }
            if (label) {
                label.setAttribute('x', s.x.toFixed(1)); label.setAttribute('y', (s.z + r + 14).toFixed(1));
                label.setAttribute('opacity', s.discovered ? 1 : 0.4);
            }
        });

        var shipGroup = svg.querySelector('#map-ship polygon');
        if (shipGroup) {
            shipGroup.setAttribute('points',
                ship.x.toFixed(1) + ',' + (ship.z - 4).toFixed(1) + ' ' +
                (ship.x - 3).toFixed(1) + ',' + (ship.z + 3).toFixed(1) + ' ' +
                (ship.x + 3).toFixed(1) + ',' + (ship.z + 3).toFixed(1));
        }
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
        // Quitte l'orbite de la planète → retour au centre du système
        if (window.SpaceCockpit && SpaceCockpit.getMode() === 'orbiting') {
            SpaceCockpit.returnToCenter();
        }
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
})();
