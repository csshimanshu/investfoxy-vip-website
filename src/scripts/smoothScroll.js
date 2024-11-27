// Smooth scroll functionality with ease-in-out effect
function smoothScroll() {
  // Check if the browser supports smooth scrolling
  const supportsScrollBehavior = 'scrollBehavior' in document.documentElement.style;

  function scrollToTarget(targetElement, duration = 1000) {
    const startPosition = window.pageYOffset;
    const targetPosition = targetElement.getBoundingClientRect().top + startPosition;
    const distance = targetPosition - startPosition;
    const headerOffset = 32; // Adjust this value based on your fixed header height
    let startTime = null;

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easedProgress = ease(progress);
      
      window.scrollTo(0, startPosition + (distance - headerOffset) * easedProgress);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }

    requestAnimationFrame(animation);
  }

  // Add click event listeners to all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        if (supportsScrollBehavior) {
          // Use native smooth scrolling if supported
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          // Use JS fallback if smooth scrolling is not supported
          scrollToTarget(targetElement);
        }
      }
    });
  });

  // Update active navigation state
  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.clientHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        // Update mobile navigation
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });

        // Update nav dots
        document.querySelectorAll('.nav-dot').forEach(dot => {
          const parentLink = dot.closest('a');
          if (parentLink && parentLink.getAttribute('href') === `#${sectionId}`) {
            dot.classList.add('opacity-100');
          } else {
            dot.classList.remove('opacity-100');
          }
        });
      }
    });
  }

  // Throttle scroll event for better performance
  let isScrolling = false;
  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        updateActiveNavLink();
        isScrolling = false;
      });
      isScrolling = true;
    }
  });

  // Update active state on page load
  updateActiveNavLink();
}

// Initialize on both DOMContentLoaded and Astro page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', smoothScroll);
} else {
  smoothScroll();
}

document.addEventListener('astro:page-load', smoothScroll);
