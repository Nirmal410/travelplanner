// Destination Carousel Functionality
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const indicators = document.querySelectorAll('.indicator');
const totalSlides = slides.length;

// Initialize carousel
function initializeCarousel() {
    // Set background images
    slides.forEach((slide, index) => {
        const bgUrl = slide.getAttribute('data-bg');
        if (bgUrl) {
            slide.style.backgroundImage = `url('${bgUrl}')`;
        }
    });
    
    showSlide(0);
    
    // Auto-advance slides
    setInterval(() => {
        changeSlide(1);
    }, 8000);
}

// Show specific slide
function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Show current slide
    if (slides[index]) {
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
    }
    
    currentSlideIndex = index;
}

// Change slide
function changeSlide(direction) {
    currentSlideIndex += direction;
    
    if (currentSlideIndex >= totalSlides) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex < 0) {
        currentSlideIndex = totalSlides - 1;
    }
    
    showSlide(currentSlideIndex);
}

// Go to specific slide
function currentSlide(index) {
    showSlide(index - 1);
}

// Weather API functionality
const WEATHER_API_KEY = '3019fc4d14b42aafcd024f8d98436516';

async function getWeather(location, elementId) {
    const weatherDiv = document.getElementById(elementId);
    if (!weatherDiv) return;
    
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${WEATHER_API_KEY}&units=metric`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.cod === 200) {
            const temp = Math.round(data.main.temp);
            const weather = data.weather[0].description;
            const humidity = data.main.humidity;
            const windSpeed = data.wind.speed;
            const icon = data.weather[0].icon;
            
            weatherDiv.innerHTML = `
                <h5><i class="fas fa-map-marker-alt me-2"></i>${location} Weather</h5>
                <div class="row">
                    <div class="col-6">
                        <p><i class="fas fa-thermometer-half me-2"></i><strong>${temp}°C</strong></p>
                        <p><i class="fas fa-cloud me-2"></i>${weather}</p>
                    </div>
                    <div class="col-6">
                        <p><i class="fas fa-tint me-2"></i>Humidity: ${humidity}%</p>
                        <p><i class="fas fa-wind me-2"></i>Wind: ${windSpeed} m/s</p>
                    </div>
                </div>
            `;
            weatherDiv.classList.add('show');
        } else {
            weatherDiv.innerHTML = `<p><i class="fas fa-exclamation-triangle me-2"></i>Weather data not available</p>`;
            weatherDiv.classList.add('show');
        }
    } catch (error) {
        weatherDiv.innerHTML = `<p><i class="fas fa-exclamation-triangle me-2"></i>Unable to fetch weather data</p>`;
        weatherDiv.classList.add('show');
        console.error('Weather API Error:', error);
    }
}

// Weather button event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeCarousel();
    
    // Weather button functionality
    const weatherButtons = document.querySelectorAll('.weather-btn');
    weatherButtons.forEach(button => {
        button.addEventListener('click', function() {
            const location = this.getAttribute('data-location');
            const elementId = 'weather-' + location.toLowerCase().replace(/\s+/g, '');
            
            // Hide all weather info first
            document.querySelectorAll('.weather-info').forEach(info => {
                info.classList.remove('show');
            });
            
            // Show weather for clicked location
            getWeather(location, elementId);
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            changeSlide(-1);
        } else if (e.key === 'ArrowRight') {
            changeSlide(1);
        }
    });
    
    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                changeSlide(1); // Swipe left - next slide
            } else {
                changeSlide(-1); // Swipe right - previous slide
            }
        }
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

// Form validation and enhancement
function validateTripForm() {
    const form = document.querySelector('#trip-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        const destination = document.getElementById('destination').value.trim();
        const travelers = parseInt(document.getElementById('travelers').value);
        const duration = parseInt(document.getElementById('duration').value);
        const budget = parseInt(document.getElementById('budget').value);
        
        let errors = [];
        
        if (!destination) {
            errors.push('Destination is required');
        }
        
        if (!travelers || travelers < 1 || travelers > 20) {
            errors.push('Number of travelers must be between 1 and 20');
        }
        
        if (!duration || duration < 1 || duration > 30) {
            errors.push('Duration must be between 1 and 30 days');
        }
        
        if (!budget || budget < 100) {
            errors.push('Budget must be at least $100');
        }
        
        if (errors.length > 0) {
            e.preventDefault();
            alert('Please correct the following errors:\n' + errors.join('\n'));
        }
    });
}

// Initialize form validation when DOM is ready
document.addEventListener('DOMContentLoaded', validateTripForm);
