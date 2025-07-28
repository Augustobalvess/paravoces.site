// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive components
    initFAQ();
    initSmoothScrolling();
    initAnimations();
    initCTAButtons();
    initPurchaseNotifications();
    initProductCarousel();
    initDynamicDate();
    initTestimonialsCarousel();
});

// FAQ Functionality
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other open FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

// Smooth Scrolling for CTA buttons
function initSmoothScrolling() {
    // Only CTA buttons scroll to pricing section
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Scroll to pricing section when CTA is clicked
            const pricingSection = document.querySelector('.limited-offer');
            if (pricingSection) {
                pricingSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            
            // Add click animation
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    });
    
    // Buy buttons get click animation but allow navigation
    const buyButtons = document.querySelectorAll('.buy-button');
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Add click animation but don't prevent default
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    });
}

// Intersection Observer for animations
function initAnimations() {
    const animatedElements = document.querySelectorAll('.benefit, .product-card, .pricing-card, .testimonial');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Enhanced CTA Button functionality
function initCTAButtons() {
    const buyButtons = document.querySelectorAll('.buy-button');
    
    buyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Don't prevent default - allow normal link navigation
            
            // Add click animation
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    });
}



// Scroll effects for hero elements
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    if (hero && heroContent) {
        // Parallax effect for hero background
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        
        // Fade out hero content on scroll
        const opacity = Math.max(1 - scrolled / (window.innerHeight * 0.5), 0);
        heroContent.style.opacity = opacity;
    }
});

// Removed duplicate carousel implementation - using the correct one below

// Form validation (for future contact forms)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Mobile menu toggle (if needed)
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
}

// Analytics tracking (placeholder for Google Analytics or similar)
function trackEvent(category, action, label) {
    // In production, this would send events to your analytics platform
    console.log(`Analytics Event: ${category} - ${action} - ${label}`);
    
    // Example for Google Analytics:
    // gtag('event', action, {
    //     event_category: category,
    //     event_label: label
    // });
}

// Track CTA clicks for analytics
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cta-button')) {
        trackEvent('CTA', 'click', 'main-cta');
    }
    
    if (e.target.classList.contains('buy-button')) {
        const packageType = e.target.classList.contains('premium') ? 'premium' : 'basic';
        trackEvent('Purchase', 'click', packageType);
    }
});

// Lazy loading for images (when images are added)
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Performance optimization - debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(() => {
    // Scroll handling code here
}, 16); // ~60fps

window.addEventListener('scroll', debouncedScrollHandler);

// Accessibility improvements
function initAccessibility() {
    // Add keyboard navigation for FAQ items
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
        
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
            }
        });
    });
    
    // Update aria-expanded when FAQ items are toggled
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('faq-item')) {
                    const question = target.querySelector('.faq-question');
                    const isActive = target.classList.contains('active');
                    question.setAttribute('aria-expanded', isActive.toString());
                }
            }
        });
    });
    
    document.querySelectorAll('.faq-item').forEach(item => {
        observer.observe(item, { attributes: true });
    });
}

// Initialize accessibility features
initAccessibility();

// Error handling for failed requests
window.addEventListener('error', (e) => {
    console.error('An error occurred:', e.error);
    // In production, you might want to send this to an error tracking service
});

// Purchase Notifications with Brazilian data
function initPurchaseNotifications() {
    const customers = [
        { name: 'Maria Silva', location: 'São Paulo - SP', packages: ['Pacote Premium', 'Pacote Básico'] },
        { name: 'João Santos', location: 'Rio de Janeiro - RJ', packages: ['Pacote Premium', 'Pacote Básico'] },
        { name: 'Ana Oliveira', location: 'Belo Horizonte - MG', packages: ['Pacote Básico', 'Pacote Premium'] },
        { name: 'Carlos Ferreira', location: 'Salvador - BA', packages: ['Pacote Premium', 'Pacote Básico'] },
        { name: 'Fernanda Costa', location: 'Brasília - DF', packages: ['Pacote Premium', 'Pacote Básico'] },
        { name: 'Roberto Lima', location: 'Fortaleza - CE', packages: ['Pacote Básico', 'Pacote Premium'] },
        { name: 'Juliana Souza', location: 'Curitiba - PR', packages: ['Pacote Premium', 'Pacote Básico'] },
        { name: 'Pedro Almeida', location: 'Recife - PE', packages: ['Pacote Premium', 'Pacote Básico'] },
        { name: 'Camila Rodrigues', location: 'Porto Alegre - RS', packages: ['Pacote Básico', 'Pacote Premium'] },
        { name: 'Lucas Barbosa', location: 'Goiânia - GO', packages: ['Pacote Premium', 'Pacote Básico'] }
    ];

    function showRandomNotification() {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const packageName = customer.packages[Math.floor(Math.random() * customer.packages.length)];
        const timeAgo = Math.floor(Math.random() * 59) + 1; // 1-59 minutes ago
        
        const notification = document.getElementById('purchaseNotification');
        const customerNameEl = document.getElementById('customerName');
        const purchaseInfoEl = document.getElementById('purchaseInfo');
        const locationEl = document.getElementById('customerLocation');
        const timeEl = document.getElementById('purchaseTime');
        
        customerNameEl.textContent = customer.name;
        purchaseInfoEl.textContent = `Comprou: ${packageName}`;
        locationEl.textContent = customer.location;
        timeEl.textContent = `${timeAgo} min atrás`;
        
        notification.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Show first notification after 3 seconds
    setTimeout(showRandomNotification, 3000);
    
    // Show new notification every 15 seconds
    setInterval(() => {
        showRandomNotification();
    }, 15000);
}

function closePurchaseNotification() {
    document.getElementById('purchaseNotification').classList.remove('show');
}

// Product Carousel functionality
function initProductCarousel() {
    const track = document.querySelector('.carousel-track');
    const cards = document.querySelectorAll('.product-image-card');
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');
    
    if (!track || cards.length === 0) return;
    
    let currentIndex = 0;
    const totalCards = cards.length; // 9 images
    const cardsToShow = 2; // Always show 2 cards (both mobile and desktop)
    const maxMoves = totalCards - cardsToShow + 1; // 8 moves (0-1, 1-2, 2-3, ..., 7-8)
    let autoSlideInterval;
    
    function updateCarousel() {
        const movePercentage = currentIndex * 50;
        track.style.transform = `translateX(-${movePercentage}%)`;
        
        // Update button states
        if (prevBtn && nextBtn) {
            prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
            nextBtn.style.opacity = currentIndex >= maxMoves - 1 ? '0.5' : '1';
        }
    }
    
    function moveNext() {
        if (currentIndex < maxMoves - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // Loop back to start
        }
        updateCarousel();
    }
    
    function movePrev() {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = maxMoves - 1; // Loop to end
        }
        updateCarousel();
    }
    
    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(moveNext, 3000);
    }
    
    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
    }
    
    // Manual navigation
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoSlide();
            moveNext();
            // Restart auto-slide after 5 seconds of inactivity
            setTimeout(startAutoSlide, 5000);
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoSlide();
            movePrev();
            // Restart auto-slide after 5 seconds of inactivity
            setTimeout(startAutoSlide, 5000);
        });
    }
    
    // Initialize carousel
    updateCarousel();
    
    // Start auto-sliding after 2 seconds
    setTimeout(startAutoSlide, 2000);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        currentIndex = 0;
        updateCarousel();
    });
}

// Dynamic Date for Limited Offer
function initDynamicDate() {
    const offerDateElement = document.getElementById('limited-offer-date');
    
    if (offerDateElement) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        
        const formattedDate = `${day}/${month}/${year}`;
        offerDateElement.textContent = `OFERTA LIMITADA - Apenas no dia ${formattedDate}`;
    }
}

// Like functionality for testimonials
function toggleLike(button) {
    const icon = button.querySelector('i');
    const countSpan = button.querySelector('.like-count');
    let currentCount = parseInt(countSpan.textContent);
    
    if (button.classList.contains('liked')) {
        // Unlike
        button.classList.remove('liked');
        icon.classList.remove('fas');
        icon.classList.add('far');
        countSpan.textContent = currentCount - 1;
        
        // Track unlike event
        trackEvent('Engagement', 'Unlike', 'Testimonial');
    } else {
        // Like
        button.classList.add('liked');
        icon.classList.remove('far');
        icon.classList.add('fas');
        countSpan.textContent = currentCount + 1;
        
        // Track like event
        trackEvent('Engagement', 'Like', 'Testimonial');
        
        // Add pulse animation
        icon.style.animation = 'none';
        setTimeout(() => {
            icon.style.animation = 'heartPulse 0.6s ease';
        }, 10);
    }
}

// Testimonials Carousel
let testimonialsCurrentSlide = 0;
const testimonialsSlides = document.querySelectorAll('.testimonial-chat');
const testimonialsDots = document.querySelectorAll('.testimonials-carousel-dots .dot');

function initTestimonialsCarousel() {
    showTestimonialSlide(testimonialsCurrentSlide);
    
    // Auto-advance carousel every 5 seconds
    setInterval(() => {
        testimonialsCurrentSlide = (testimonialsCurrentSlide + 1) % testimonialsSlides.length;
        showTestimonialSlide(testimonialsCurrentSlide);
    }, 5000);
}

function moveTestimonialsCarousel(direction) {
    testimonialsCurrentSlide += direction;
    
    if (testimonialsCurrentSlide >= testimonialsSlides.length) {
        testimonialsCurrentSlide = 0;
    } else if (testimonialsCurrentSlide < 0) {
        testimonialsCurrentSlide = testimonialsSlides.length - 1;
    }
    
    showTestimonialSlide(testimonialsCurrentSlide);
}

function currentTestimonialSlide(slideIndex) {
    testimonialsCurrentSlide = slideIndex - 1;
    showTestimonialSlide(testimonialsCurrentSlide);
}

function showTestimonialSlide(slideIndex) {
    const track = document.querySelector('.testimonials-carousel-track');
    const slideWidth = document.querySelector('.testimonial-chat').offsetWidth + 20; // width + margin
    
    if (track) {
        track.style.transform = `translateX(-${slideIndex * slideWidth}px)`;
    }
    
    // Update dots
    testimonialsDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === slideIndex);
    });
}

// Service worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}
