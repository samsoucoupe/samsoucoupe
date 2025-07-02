// Navigation functionality
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 23, 42, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.background = 'rgba(15, 23, 42, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Media carousel functionality
function changeMedia(button, direction) {
    const projectMedia = button.closest('.project-media');
    const carousel = projectMedia.querySelector('.media-carousel');
    const items = carousel.querySelectorAll('.media-item');
    let currentIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
    
    // Pause current video if any
    const currentItem = items[currentIndex];
    const currentVideo = currentItem.querySelector('video');
    if (currentVideo) {
        currentVideo.pause();
    }
    
    // Remove active class from current item
    items[currentIndex].classList.remove('active');
    
    // Calculate new index
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = items.length - 1;
    if (currentIndex >= items.length) currentIndex = 0;
    
    // Add active class to new item
    items[currentIndex].classList.add('active');
    
    // Auto-play new video if any
    const newItem = items[currentIndex];
    const newVideo = newItem.querySelector('video');
    if (newVideo) {
        newVideo.currentTime = 0;
    }
}

// Video interaction handling
document.addEventListener('DOMContentLoaded', () => {
    // --- Sticky & Fade Orbit on Scroll ---
    const heroSection = document.querySelector('.hero');
    const orbitZone = document.getElementById('orbit-skills').parentElement; // parent: orbit-center + orbit-skills
    let stickyActive = false;
    let fadeActive = false;
    function handleOrbitSticky() {
        if (!heroSection || !orbitZone) return;
        const rect = heroSection.getBoundingClientRect();
        // Quand le haut de la section Hero sort du viewport, on centre/sticky
        if (rect.top < 0 && rect.bottom > 180) {
            if (!stickyActive) {
                orbitZone.classList.add('sticky-orbit');
                stickyActive = true;
            }
            // Fade out quand le bas de la section Hero atteint le haut du viewport (ou un seuil)
            if (rect.bottom < 350) {
                if (!fadeActive) {
                    orbitZone.classList.add('fade-out');
                    fadeActive = true;
                }
            } else {
                if (fadeActive) {
                    orbitZone.classList.remove('fade-out');
                    fadeActive = false;
                }
            }
        } else {
            if (stickyActive) {
                orbitZone.classList.remove('sticky-orbit');
                stickyActive = false;
            }
            if (fadeActive) {
                orbitZone.classList.remove('fade-out');
                fadeActive = false;
            }
        }
    }
    window.addEventListener('scroll', handleOrbitSticky);
    // Appel initial au cas où la page est déjà scrollée
    handleOrbitSticky();
    const videos = document.querySelectorAll('.media-item video');
    
    videos.forEach(video => {
        // Prevent carousel interference with video controls
        video.addEventListener('click', (e) => {
            e.stopPropagation();
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
        
        // Handle video control clicks
        video.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        video.addEventListener('mouseup', (e) => {
            e.stopPropagation();
        });
    });
});

// Initialize carousel
document.addEventListener('DOMContentLoaded', () => {
    const projectMedias = document.querySelectorAll('.project-media');
    projectMedias.forEach(projectMedia => {
        const carousel = projectMedia.querySelector('.media-carousel');
        const items = carousel.querySelectorAll('.media-item');
        const prevBtn = projectMedia.querySelector('.carousel-btn.prev');
        const nextBtn = projectMedia.querySelector('.carousel-btn.next');
        
        // Check if there are valid media items (not placeholders)
        const validItems = Array.from(items).filter(item => {
            const img = item.querySelector('img');
            const video = item.querySelector('video source');
            const iframe = item.querySelector('iframe');
            
            return (img && img.src && !img.src.includes('placeholder')) ||
                   (video && video.src && !video.src.includes('placeholder')) ||
                   (iframe && iframe.src && !iframe.src.includes('placeholder'));
        });
        
        // Hide the entire media section if no valid media items or only placeholders
        if (validItems.length === 0) {
            projectMedia.style.display = 'none';
        }
        // Hide carousel buttons if only one valid item
        else if (validItems.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            // Adjust media carousel to take full width
            carousel.style.margin = '0';
        }
        // Show buttons for multiple items
        else {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.project-card, .skill-category, .about-text, .contact-item');
    animateElements.forEach(el => observer.observe(el));
});
// --- Orbiting Skills Animation (Solar System Style) ---
document.addEventListener('DOMContentLoaded', () => {
    // 4-5 compétences globales seulement
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
    // Create skill planets (icon only, tooltip on hover)
    skills.forEach((skill, i) => {
        const el = document.createElement('div');
        el.className = 'orbit-planet';
        el.innerHTML = `<span class="planet-icon" style="color:${skill.color}" title="${skill.label}"><i class="${skill.icon}"></i></span>`;
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
        // Tooltip custom (pour un style plus joli que le title natif)
        el.setAttribute('data-tooltip', skill.label);
        orbit.appendChild(el);
    });
    // Tooltip custom (simple, optionnel)
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
    orbit.addEventListener('mouseout', function(e) {
        const tooltip = document.getElementById('orbit-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    });
    // Animate orbit (solar system style)
    function animateOrbit() {
        const planets = orbit.querySelectorAll('.orbit-planet');
        const t = Date.now() / 2000;
        const center = getCenter();
        planets.forEach((el, i) => {
            const skill = skills[i];
            const angle = t * skill.speed + (i * (2 * Math.PI / skills.length));
            const x = center.x + skill.orbit * Math.cos(angle) - 30;
            const y = center.y + skill.orbit * Math.sin(angle) - 30;
            el.style.transform = `translate(${x}px,${y}px)`;
        });
        requestAnimationFrame(animateOrbit);
    }
    animateOrbit();
    // Responsive: update on resize
    window.addEventListener('resize', () => {
        // nothing needed, getCenter is dynamic
    });
});


