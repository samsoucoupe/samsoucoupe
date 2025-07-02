
// carousel.js : gestion du carrousel de médias dans les projets

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
    // Video interaction handling
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
