document.addEventListener('DOMContentLoaded', () => {
    const skills = [
        { icon: 'fas fa-cogs', label: 'DevOps', color: '#10b981', orbit: 120, speed: 0.10 },
        { icon: 'fas fa-database', label: 'Data', color: '#eab308', orbit: 160, speed: 0.08 },
        { icon: 'fas fa-laptop-code', label: 'Web', color: '#4f46e5', orbit: 200, speed: 0.07 },
        { icon: 'fas fa-brain', label: 'IA', color: '#6366f1', orbit: 240, speed: 0.06 },
        { icon: 'fas fa-server', label: 'Backend', color: '#3776AB', orbit: 280, speed: 0.05 }
    ];

    const orbit = document.getElementById('orbit-skills');
    if (!orbit) return;

    function getCenter() {
        return {
            x: orbit.offsetWidth / 2,
            y: orbit.offsetHeight / 2
        };
    }

    function getResponsiveSkills() {
        const containerSize = Math.min(orbit.offsetWidth, orbit.offsetHeight);
        // On garde une marge de sécurité pour éviter tout débordement
        const maxOrbit = Math.max(0, (containerSize / 2) - 48);
        return skills.map(s => ({ ...s, orbit: Math.min(168, maxOrbit), speed: 0.12 }));
    
    }

    let currentSkills = getResponsiveSkills();

    // Création des planètes
    currentSkills.forEach((skill) => {
        const el = document.createElement('div');
        el.className = 'orbit-planet';
        el.innerHTML = `<span class="planet-icon" style="color:${skill.color}" title="${skill.label}">
                            <i class="${skill.icon}"></i>
                        </span>`;
        el.style.position = 'absolute';
        el.style.width = '48px';
        el.style.height = '48px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.transition = 'transform 0.3s';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.style.fontSize = '2em';
        el.style.zIndex = 2;
        el.setAttribute('data-tooltip', skill.label);
        orbit.appendChild(el);
    });

    // Tooltip custom
    document.body.addEventListener('mousemove', function(e) {
        const tooltip = document.getElementById('orbit-tooltip');
        if (tooltip) {
            tooltip.style.left = (e.clientX + 12) + 'px';
            tooltip.style.top = (e.clientY + 12) + 'px';
        }
    });

    orbit.addEventListener('mouseover', function(e) {
        const planet = e.target.closest('.orbit-planet');
        if (planet && planet.dataset.tooltip) {
            let tooltip = document.getElementById('orbit-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'orbit-tooltip';
                tooltip.style.position = 'fixed';
                tooltip.style.background = 'rgba(30,41,59,0.98)';
                tooltip.style.color = '#fff';
                tooltip.style.padding = '6px 14px';
                tooltip.style.borderRadius = '8px';
                tooltip.style.fontSize = '1rem';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.zIndex = 9999;
                tooltip.style.boxShadow = '0 2px 12px #0008';
                document.body.appendChild(tooltip);
            }
            tooltip.textContent = planet.dataset.tooltip;
            tooltip.style.display = 'block';
        }
    });

    orbit.addEventListener('mouseout', function() {
        const tooltip = document.getElementById('orbit-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    });

    // Animation des orbites
    function animateOrbit() {
        const planets = orbit.querySelectorAll('.orbit-planet');
        const t = Date.now() / 2000;
        const center = getCenter();
        planets.forEach((el, i) => {
            const skill = currentSkills[i];
            const angle = t * skill.speed + (i * (2 * Math.PI / currentSkills.length));
            const x = center.x + skill.orbit * Math.cos(angle) - 30;
            const y = center.y + skill.orbit * Math.sin(angle) - 30;
            el.style.transform = `translate(${x}px,${y}px)`;
        });
        requestAnimationFrame(animateOrbit);
    }
    animateOrbit();

    // Mise à jour responsive
    window.addEventListener('resize', () => {
        currentSkills = getResponsiveSkills();
    });
});
