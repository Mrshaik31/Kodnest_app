/**
 * KodNest Premium Build System - Job Notification Tracker
 * Client-side routing and navigation logic
 */

// Route definitions
const routes = {
    '/': {
        title: 'Home',
        render: () => `
      <div class="page-container">
        <h1 class="page-title">Job Notification Tracker</h1>
        <p class="page-subtitle">This section will be built in the next step.</p>
      </div>
    `
    },
    '/dashboard': {
        title: 'Dashboard',
        render: () => `
      <div class="page-container">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">This section will be built in the next step.</p>
      </div>
    `
    },
    '/saved': {
        title: 'Saved',
        render: () => `
      <div class="page-container">
        <h1 class="page-title">Saved</h1>
        <p class="page-subtitle">This section will be built in the next step.</p>
      </div>
    `
    },
    '/digest': {
        title: 'Digest',
        render: () => `
      <div class="page-container">
        <h1 class="page-title">Digest</h1>
        <p class="page-subtitle">This section will be built in the next step.</p>
      </div>
    `
    },
    '/settings': {
        title: 'Settings',
        render: () => `
      <div class="page-container">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">This section will be built in the next step.</p>
      </div>
    `
    },
    '/proof': {
        title: 'Proof',
        render: () => `
      <div class="page-container">
        <h1 class="page-title">Proof</h1>
        <p class="page-subtitle">This section will be built in the next step.</p>
      </div>
    `
    }
};

// Get current route from hash
function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
}

// Render the current route
function renderRoute() {
    const route = getCurrentRoute();
    const routeConfig = routes[route] || routes['/'];

    // Update page content
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.innerHTML = routeConfig.render();
    }

    // Update page title
    document.title = `${routeConfig.title} - KodNest Premium`;

    // Update active navigation links
    updateActiveLinks(route);

    // Close mobile menu if open
    closeMobileMenu();
}

// Update active link styling
function updateActiveLinks(currentRoute) {
    // Desktop navigation
    const desktopLinks = document.querySelectorAll('.app-nav__link');
    desktopLinks.forEach(link => {
        const href = link.getAttribute('href').slice(1); // Remove #
        if (href === currentRoute) {
            link.classList.add('app-nav__link--active');
        } else {
            link.classList.remove('app-nav__link--active');
        }
    });

    // Mobile navigation
    const mobileLinks = document.querySelectorAll('.app-nav__mobile-link');
    mobileLinks.forEach(link => {
        const href = link.getAttribute('href').slice(1); // Remove #
        if (href === currentRoute) {
            link.classList.add('app-nav__mobile-link--active');
        } else {
            link.classList.remove('app-nav__mobile-link--active');
        }
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    const hamburger = document.querySelector('.app-nav__hamburger');
    const mobileMenu = document.querySelector('.app-nav__mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.classList.toggle('app-nav__hamburger--active');
        mobileMenu.classList.toggle('app-nav__mobile-menu--active');
    }
}

// Close mobile menu
function closeMobileMenu() {
    const hamburger = document.querySelector('.app-nav__hamburger');
    const mobileMenu = document.querySelector('.app-nav__mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.classList.remove('app-nav__hamburger--active');
        mobileMenu.classList.remove('app-nav__mobile-menu--active');
    }
}

// Initialize the app
function initApp() {
    // Set up hash change listener
    window.addEventListener('hashchange', renderRoute);

    // Set up mobile menu toggle
    const hamburger = document.querySelector('.app-nav__hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }

    // Render initial route
    renderRoute();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
