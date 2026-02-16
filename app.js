/**
 * KodNest Premium Build System - Job Notification Tracker
 * Client-side routing and navigation logic
 */

// Initialize saved jobs from localStorage
let savedJobIds = JSON.parse(localStorage.getItem('kodnest_saved_jobs')) || [];

// Save job to localStorage
function saveJob(id) {
  if (!savedJobIds.includes(id)) {
    savedJobIds.push(id);
    localStorage.setItem('kodnest_saved_jobs', JSON.stringify(savedJobIds));
    renderRoute(); // Re-render to update UI
    showToast("Job saved successfully");
  } else {
    removeJob(id); // Toggle behavior
  }
}

// Remove job from localStorage
function removeJob(id) {
  savedJobIds = savedJobIds.filter(jobId => jobId !== id);
  localStorage.setItem('kodnest_saved_jobs', JSON.stringify(savedJobIds));
  renderRoute(); // Re-render to update UI
  showToast("Job removed from saved");
}

// Check if job is saved
function isJobSaved(id) {
  return savedJobIds.includes(id);
}

// Show simple toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('toast--visible'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Open Job Details Modal
function openJobModal(id) {
  const job = window.jobsData.find(j => j.id === id);
  if (!job) return;

  const modalHtml = `
    <div class="modal-backdrop" onclick="closeJobModal()">
      <div class="modal-container" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">${job.title}</h2>
            <p class="modal-subtitle">${job.company} • ${job.location}</p>
          </div>
          <button class="modal-close" onclick="closeJobModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-section">
            <h4 class="modal-section-title">Job Description</h4>
            <p class="modal-text">${job.description}</p>
          </div>
          
          <div class="modal-section">
            <h4 class="modal-section-title">Key Skills</h4>
            <div class="skills-list">
              ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
          </div>
          
          <div class="modal-details-grid">
            <div class="detail-item">
              <span class="detail-label">Experience</span>
              <span class="detail-value">${job.experience}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Salary</span>
              <span class="detail-value">${job.salaryRange}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Work Mode</span>
              <span class="detail-value">${job.mode}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Source</span>
              <span class="detail-value">${job.source}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--secondary" onclick="${isJobSaved(job.id) ? `removeJob(${job.id})` : `saveJob(${job.id})`}">
            ${isJobSaved(job.id) ? 'Saved' : 'Save Job'}
          </button>
          <a href="${job.applyUrl}" target="_blank" class="btn btn--primary">Apply Now</a>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.querySelector('.modal-backdrop');
  if (existingModal) existingModal.remove();

  // Append new modal
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Prevent body scrolling
  document.body.style.overflow = 'hidden';
}

// Close Job Modal
function closeJobModal() {
  const modal = document.querySelector('.modal-backdrop');
  if (modal) {
    modal.classList.remove('modal-backdrop--visible');
    setTimeout(() => modal.remove(), 200);
  }
  document.body.style.overflow = '';
}

// Generate Job Card HTML
function getJobCardHtml(job) {
  const isSaved = isJobSaved(job.id);
  const postedText = job.postedDaysAgo === 0 ? 'Today' : `${job.postedDaysAgo} days ago`;

  return `
    <div class="job-card">
      <div class="job-card__header">
        <div>
          <h3 class="job-card__title">${job.title}</h3>
          <p class="job-card__company">${job.company}</p>
        </div>
        <span class="badge badge--source ${job.source.toLowerCase().replace(/\s/g, '')}">${job.source}</span>
      </div>
      
      <div class="job-card__meta">
        <span class="meta-item"><span class="icon">📍</span> ${job.location} (${job.mode})</span>
        <span class="meta-item"><span class="icon">💼</span> ${job.experience}</span>
        <span class="meta-item"><span class="icon">💰</span> ${job.salaryRange}</span>
      </div>
      
      <div class="job-card__footer">
        <span class="posted-date">${postedText}</span>
        <div class="job-card__actions">
          <button class="btn btn--secondary btn--small" onclick="openJobModal(${job.id})">View</button>
          <button class="btn ${isSaved ? 'btn--primary' : 'btn--secondary'} btn--small" onclick="${isSaved ? `removeJob(${job.id})` : `saveJob(${job.id})`}">
            ${isSaved ? 'Saved' : 'Save'}
          </button>
          <a href="${job.applyUrl}" target="_blank" class="btn btn--primary btn--small">Apply</a>
        </div>
      </div>
    </div>
  `;
}

// Route definitions
const routes = {
  '/': {
    title: 'Home',
    render: () => `
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">Stop Missing The Right Jobs.</h1>
          <p class="hero-subtitle">Precision-matched job discovery delivered daily at 9AM.</p>
          <a href="#/dashboard" class="btn btn--primary btn--large">Browse Jobs</a>
          <div style="margin-top: var(--space-md)">
             <a href="#/settings" class="btn btn--secondary">Configure Preferences</a>
          </div>
        </div>
      </div>
    `
  },
  '/dashboard': {
    title: 'Dashboard',
    render: () => {
      // Get jobs from global
      const jobs = window.jobsData || [];

      return `
      <div class="page-container">
        <div class="dashboard-header">
          <h1 class="page-title">Dashboard</h1>
          <span class="job-count">${jobs.length} jobs found</span>
        </div>
        
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-search">
            <input type="text" class="input" placeholder="Search role or company..." disabled title="Filtering disabled for now">
          </div>
          <div class="filter-dropdowns">
            <select class="input input--select" disabled>
              <option>Location: All</option>
            </select>
            <select class="input input--select" disabled>
              <option>Mode: All</option>
            </select>
            <select class="input input--select" disabled>
              <option>Exp: All</option>
            </select>
            <select class="input input--select" disabled>
              <option>Source: All</option>
            </select>
            <select class="input input--select">
              <option>Sort: Latest</option>
              <option disabled>Sort: Salary</option>
            </select>
          </div>
        </div>
        
        <!-- Jobs Grid -->
        <div class="jobs-grid">
          ${jobs.map(job => getJobCardHtml(job)).join('')}
        </div>
      </div>
    `
    }
  },
  '/saved': {
    title: 'Saved',
    render: () => {
      // Get saved jobs
      const allJobs = window.jobsData || [];
      const savedJobs = allJobs.filter(job => savedJobIds.includes(job.id));

      if (savedJobs.length === 0) {
        return `
          <div class="page-container">
            <h1 class="page-title">Saved Jobs</h1>
            <div class="empty-state">
              <h3 class="empty-state__title">No saved jobs yet</h3>
              <p class="empty-state__message">Jobs you save will appear here for quick access.</p>
              <a href="#/dashboard" class="btn btn--primary" style="margin-top: var(--space-md)">Browse Jobs</a>
            </div>
          </div>
        `;
      }

      return `
        <div class="page-container">
          <h1 class="page-title">Saved Jobs (${savedJobs.length})</h1>
          <div class="jobs-grid">
            ${savedJobs.map(job => getJobCardHtml(job)).join('')}
          </div>
        </div>
      `;
    }
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
