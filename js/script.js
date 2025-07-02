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
    const carousel = button.closest('.project-media').querySelector('.media-carousel');
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
        const controls = projectMedia.querySelector('.carousel-controls');
        
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
        // Let CSS handle the carousel controls visibility (opacity on hover)
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

// Skills preview animation
document.addEventListener('DOMContentLoaded', () => {
    const skillItems = document.querySelectorAll('.skill-item');
    
    setInterval(() => {
        skillItems.forEach(item => item.classList.remove('active'));
        const randomItem = skillItems[Math.floor(Math.random() * skillItems.length)];
        randomItem.classList.add('active');
    }, 3000);
});
