// Blog functionality
document.addEventListener('DOMContentLoaded', function() {
    // Form validation
    const blogForm = document.querySelector('#blog-form');
    if (blogForm) {
        blogForm.addEventListener('submit', function(e) {
            const title = document.getElementById('title').value.trim();
            const content = document.getElementById('content').value.trim();
            
            if (!title || !content) {
                e.preventDefault();
                alert('Please fill in both title and content fields.');
                return;
            }
            
            if (title.length < 5) {
                e.preventDefault();
                alert('Title must be at least 5 characters long.');
                return;
            }
            
            if (content.length < 20) {
                e.preventDefault();
                alert('Content must be at least 20 characters long.');
                return;
            }
        });
    }
    
    // Character count for textarea
    const contentTextarea = document.getElementById('content');
    if (contentTextarea) {
        const charCount = document.createElement('small');
        charCount.className = 'text-muted float-end';
        charCount.textContent = '0 characters';
        
        contentTextarea.parentNode.appendChild(charCount);
        
        contentTextarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = `${count} characters`;
            
            if (count < 20) {
                charCount.className = 'text-danger float-end';
            } else {
                charCount.className = 'text-muted float-end';
            }
        });
    }
    
    // Auto-resize textarea
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
    
    if (contentTextarea) {
        contentTextarea.addEventListener('input', function() {
            autoResize(this);
        });
        
        // Initial resize
        autoResize(contentTextarea);
    }
    
    // Blog card animations
    const blogCards = document.querySelectorAll('.blog-card');
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    blogCards.forEach((card, index) => {
        // Initial state for animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        
        observer.observe(card);
    });
    
    // Read more functionality for long posts
    const posts = document.querySelectorAll('.blog-card .card-text');
    posts.forEach(post => {
        const text = post.textContent;
        if (text.length > 200) {
            const shortText = text.substring(0, 200) + '...';
            const fullText = text;
            
            post.innerHTML = `
                <span class="short-text">${shortText}</span>
                <span class="full-text" style="display: none;">${fullText}</span>
                <button class="btn btn-link btn-sm p-0 read-more-btn">Read More</button>
            `;
            
            const readMoreBtn = post.querySelector('.read-more-btn');
            const shortTextSpan = post.querySelector('.short-text');
            const fullTextSpan = post.querySelector('.full-text');
            
            readMoreBtn.addEventListener('click', function() {
                if (fullTextSpan.style.display === 'none') {
                    shortTextSpan.style.display = 'none';
                    fullTextSpan.style.display = 'inline';
                    this.textContent = 'Read Less';
                } else {
                    shortTextSpan.style.display = 'inline';
                    fullTextSpan.style.display = 'none';
                    this.textContent = 'Read More';
                }
            });
        }
    });
    
    // Search functionality (if search input exists)
    const searchInput = document.getElementById('blog-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const blogPosts = document.querySelectorAll('.blog-card');
            
            blogPosts.forEach(post => {
                const title = post.querySelector('.card-title').textContent.toLowerCase();
                const content = post.querySelector('.card-text').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        });
    }
});
