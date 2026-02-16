/**
 * KodNest Premium Build System - Job Notification Tracker
 * Client-side routing and navigation logic
 */

// Route definitions
const routes = {
  '/': {
    title: 'Home',
    render: () => `
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">Stop Missing The Right Jobs.</h1>
          <p class="hero-subtitle">Precision-matched job discovery delivered daily at 9AM.</p>
          <a href="#/settings" class="btn btn--primary btn--large">Start Tracking</a>
        </div>
      </div>
    `
  },
  '/dashboard': {
    title: 'Dashboard',
    render: () => `
      <div class="page-container">
        <h1 class="page-title">Dashboard</h1>
        <div class="empty-state">
          <h3 class="empty-state__title">No jobs yet</h3>
          <p class="empty-state__message">In the next step, you will load a realistic dataset.</p>
        </div>
      </div>
    `
  },
  '/saved': {
    title: 'Saved',
    render: () => `
      <div class="page-container">
        <h1 class="page-title">Saved Jobs</h1>
        <div class="empty-state">
          <h3 class="empty-state__title">No saved jobs yet</h3>
          <p class="empty-state__message">Jobs you save will appear here for quick access.</p>
        </div>
      </div>
    `
  },
  '/digest': {
    title: 'Digest',
    render: () => `
      <div class="page-container">
        <h1 class="page-title">Daily Digest</h1>
        <div class="empty-state">
          <h3 class="empty-state__title">No digest available</h3>
          <p class="empty-state__message">Your daily job digest will be delivered at 9AM.</p>
        </div>
      </div>
    `
  },
  '/settings': {
    title: 'Settings',
    render: () => `
      <div class="page-container">
        <h1 class="page-title">Preferences</h1>
        <p class="page-subtitle">Configure your job tracking preferences.</p>
        
        <form class="settings-form">
          <div class="form-group">
            <label for="role-keywords" class="form-label">Role Keywords</label>
            <input 
              type="text" 
              id="role-keywords" 
              class="input" 
              placeholder="e.g., Frontend Developer, React Engineer"
            />
            <small class="form-help">Enter keywords that describe your ideal role</small>
          </div>
          
          <div class="form-group">
            <label for="locations" class="form-label">Preferred Locations</label>
            <input 
              type="text" 
              id="locations" 
              class="input" 
              placeholder="e.g., San Francisco, New York, Remote"
            />
            <small class="form-help">Cities or regions you're interested in</small>
          </div>
          
          <div class="form-group">
            <label class="form-label">Work Mode</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="mode" value="remote" class="radio-input" checked />
                <span class="radio-text">Remote</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="mode" value="hybrid" class="radio-input" />
                <span class="radio-text">Hybrid</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="mode" value="onsite" class="radio-input" />
                <span class="radio-text">Onsite</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="experience" class="form-label">Experience Level</label>
            <select id="experience" class="input">
              <option value="">Select experience level</option>
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior (6-10 years)</option>
              <option value="lead">Lead/Principal (10+ years)</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn--primary">Save Preferences</button>
            <button type="button" class="btn btn--secondary">Cancel</button>
          </div>
        </form>
      </div>
    `
  },
  '/proof': {
    title: 'Proof',
    render: () => `
      <div class="page-container">
        <h1 class="page-title">Proof of Work</h1>
        <div class="empty-state">
          <h3 class="empty-state__title">Artifact Collection</h3>
          <p class="empty-state__message">This section will track your progress and collect proof artifacts.</p>
        </div>
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
