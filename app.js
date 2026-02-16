/**
 * KodNest Premium Build System - Job Notification Tracker
 * Client-side routing and navigation logic
 */

// Initialize saved jobs from localStorage
let savedJobIds = JSON.parse(localStorage.getItem('kodnest_saved_jobs')) || [];

// Initialize preferences
let preferences = JSON.parse(localStorage.getItem('jobTrackerPreferences')) || {
  roleKeywords: '',
  preferredLocations: '', // Simple text for now, could be array
  preferredModes: ['Remote', 'Hybrid', 'Onsite'], // Default all
  experienceLevel: '',
  skills: '',
  minMatchScore: 40
};

// ==========================================
//  PREFERENCE LOGIC
// ==========================================

function savePreferences(newPrefs) {
  preferences = { ...preferences, ...newPrefs };
  localStorage.setItem('jobTrackerPreferences', JSON.stringify(preferences));
  showToast("Preferences saved successfully");
  renderRoute(); // Re-render to update scores
}

function getPreferences() {
  return preferences;
}

// ==========================================
//  MATCH SCORE ENGINE
// ==========================================

function calculateMatchScore(job) {
  let score = 0;

  // 1. Role Match (+25 Title, +15 Description)
  const keywords = preferences.roleKeywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k);
  if (keywords.length > 0) {
    const titleMatch = keywords.some(k => job.title.toLowerCase().includes(k));
    if (titleMatch) score += 25;

    const descMatch = keywords.some(k => job.description.toLowerCase().includes(k));
    if (descMatch) score += 15;
  }

  // 2. Location Match (+15)
  // Simple check: if preferred location string appears in job location
  if (preferences.preferredLocations && job.location.toLowerCase().includes(preferences.preferredLocations.toLowerCase())) {
    score += 15;
  }

  // 3. Mode Match (+10)
  if (preferences.preferredModes && preferences.preferredModes.includes(job.mode)) {
    score += 10;
  }

  // 4. Experience Match (+10)
  // Exact string match for simplicity in this version
  if (preferences.experienceLevel && job.experience.includes(preferences.experienceLevel)) {
    score += 10;
  }

  // 5. Skills Match (+15)
  // Check for overlap
  const userSkills = preferences.skills.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
  if (userSkills.length > 0 && job.skills) {
    const jobSkills = job.skills.map(s => s.toLowerCase());
    const hasSkillOverlap = userSkills.some(s => jobSkills.includes(s));
    if (hasSkillOverlap) score += 15;
  }

  // 6. Freshness (+5)
  if (job.postedDaysAgo <= 2) {
    score += 5;
  }

  // 7. Source (+5)
  if (job.source === 'LinkedIn') {
    score += 5;
  }

  // Cap at 100
  return Math.min(score, 100);
}

function getScoreBadgeClass(score) {
  if (score >= 80) return 'match-badge--high';     // Green
  if (score >= 60) return 'match-badge--medium';   // Amber
  if (score >= 40) return 'match-badge--low';      // Neutral
  return 'match-badge--none';                      // Grey
}

// ==========================================
//  GLOBAL ACTIONS
// ==========================================

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

  const score = calculateMatchScore(job);
  const badgeClass = getScoreBadgeClass(score);

  const modalHtml = `
    <div class="modal-backdrop" onclick="closeJobModal()">
      <div class="modal-container" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">${job.title} 
              <span class="match-badge ${badgeClass}" style="vertical-align: middle;">${score}</span>
            </h2>
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
  const score = calculateMatchScore(job);
  const badgeClass = getScoreBadgeClass(score);

  return `
    <div class="job-card">
      <div class="job-card__header">
        <div>
          <h3 class="job-card__title">${job.title}
             <span class="match-badge ${badgeClass}" title="Match Score: ${score}">${score}</span>
          </h3>
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

// ==========================================
//  ROUTES
// ==========================================

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
      let jobs = window.jobsData || [];

      // Calculate scores
      jobs.forEach(job => {
        job.score = calculateMatchScore(job);
      });

      // Check for "Show Matches Only" toggle state (simple global var check or default false)
      const showMatchesOnly = window.dashboardShowMatchesOnly || false;

      // Filter logic
      if (showMatchesOnly) {
        jobs = jobs.filter(job => job.score >= preferences.minMatchScore);
      }

      // Sorting Logic (Default: Latest)
      // We can implement full sorting later, for now defaults to Latest (ID order basically implies latest for this dataset, or we use postedDaysAgo)
      jobs.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);

      // Default Sort: Match Score Descending if preferences set, else Latest
      // But let's stick to Latest as default requested, or Match Score if toggle is On
      if (showMatchesOnly) {
        jobs.sort((a, b) => b.score - a.score);
      }

      return `
      <div class="page-container">
        <div class="dashboard-header">
          <h1 class="page-title">Dashboard</h1>
          <div style="display: flex; align-items: center; gap: var(--space-md)">
             <label class="toggle-switch">
                <input type="checkbox" class="toggle-input" id="toggle-match-filter" ${showMatchesOnly ? 'checked' : ''} onchange="toggleMatchFilter(this)">
                <span class="toggle-slider"></span>
                <span class="toggle-label">Show matches > ${preferences.minMatchScore}</span>
             </label>
             <span class="job-count">${jobs.length} jobs found</span>
          </div>
        </div>
        
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-search">
            <input type="text" class="input" placeholder="Search role or company..." disabled title="Filtering disabled for now">
          </div>
          <div class="filter-dropdowns">
            <select class="input input--select" disabled><option>Location: All</option></select>
            <select class="input input--select" disabled><option>Mode: All</option></select>
            <select class="input input--select" disabled><option>Exp: All</option></select>
            <select class="input input--select" disabled><option>Source: All</option></select>
            <select class="input input--select"><option>Sort: Latest</option></select>
          </div>
        </div>
        
        <!-- Jobs Grid -->
        <div class="jobs-grid">
          ${jobs.length > 0 ? jobs.map(job => getJobCardHtml(job)).join('') : `
            <div class="empty-state">
              <h3 class="empty-state__title">No matches found</h3>
              <p class="empty-state__message">Try adjusting your filters or lowering your match threshold.</p>
              <button class="btn btn--secondary" onclick="window.location.hash='#/settings'">Edit Preferences</button>
            </div>
          `}
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
    render: () => {
      const prefs = getPreferences();

      return `
      <div class="page-container">
        <h1 class="page-title">Preferences</h1>
        <p class="page-subtitle">Configure your job tracking preferences.</p>
        
        <form class="settings-form" id="settings-form">
          <div class="form-group">
            <label for="role-keywords" class="form-label">Role Keywords (comma separated)</label>
            <input 
              type="text" 
              id="role-keywords" 
              class="input" 
              value="${prefs.roleKeywords}"
              placeholder="e.g., Frontend Developer, React Engineer"
            />
          </div>
          
          <div class="form-group">
            <label for="locations" class="form-label">Preferred Location</label>
            <input 
              type="text" 
              id="locations" 
              class="input" 
              value="${prefs.preferredLocations}"
              placeholder="e.g., Bangalore"
            />
          </div>

           <div class="form-group">
            <label for="skills" class="form-label">Skills (comma separated)</label>
            <input 
              type="text" 
              id="skills" 
              class="input" 
              value="${prefs.skills}"
              placeholder="e.g., React, Java, Python"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Work Mode</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="checkbox" name="mode" value="Remote" class="radio-input" ${prefs.preferredModes.includes('Remote') ? 'checked' : ''} />
                <span class="radio-text">Remote</span>
              </label>
              <label class="radio-label">
                <input type="checkbox" name="mode" value="Hybrid" class="radio-input" ${prefs.preferredModes.includes('Hybrid') ? 'checked' : ''} />
                <span class="radio-text">Hybrid</span>
              </label>
              <label class="radio-label">
                <input type="checkbox" name="mode" value="Onsite" class="radio-input" ${prefs.preferredModes.includes('Onsite') ? 'checked' : ''} />
                <span class="radio-text">Onsite</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="experience" class="form-label">Experience Level</label>
            <select id="experience" class="input">
              <option value="">Select experience level</option>
              <option value="Fresher" ${prefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
              <option value="0-1 Years" ${prefs.experienceLevel === '0-1 Years' ? 'selected' : ''}>0-1 Years</option>
              <option value="1-3 Years" ${prefs.experienceLevel === '1-3 Years' ? 'selected' : ''}>1-3 Years</option>
              <option value="3-5 Years" ${prefs.experienceLevel === '3-5 Years' ? 'selected' : ''}>3-5 Years</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">
               Minimum Match Score: <span id="min-score-val" class="range-value">${prefs.minMatchScore}</span>
            </label>
            <div class="range-slider-container">
               <input type="range" id="min-match-score" class="range-slider" min="0" max="100" value="${prefs.minMatchScore}" oninput="document.getElementById('min-score-val').textContent = this.value">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn--primary" onclick="handleSavePreferences()">Save Preferences</button>
            <button type="button" class="btn btn--secondary" onclick="window.location.hash='#/dashboard'">Cancel</button>
          </div>
        </form>
      </div>
    `;
    }
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

// ==========================================
//  EVENT HANDLERS
// ==========================================

// Handle Settings Form Save
function handleSavePreferences() {
  const roleKeywords = document.getElementById('role-keywords').value;
  const preferredLocations = document.getElementById('locations').value;
  const skills = document.getElementById('skills').value;
  const experienceLevel = document.getElementById('experience').value;
  const minMatchScore = parseInt(document.getElementById('min-match-score').value);

  // Get checked modes
  const modeCheckboxes = document.querySelectorAll('input[name="mode"]:checked');
  const preferredModes = Array.from(modeCheckboxes).map(cb => cb.value);

  savePreferences({
    roleKeywords,
    preferredLocations,
    preferredModes,
    experienceLevel,
    skills,
    minMatchScore
  });
}

// Global toggle handler (needs to be global to work in onclick)
window.dashboardShowMatchesOnly = false;
function toggleMatchFilter(checkbox) {
  window.dashboardShowMatchesOnly = checkbox.checked;
  renderRoute();
}

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
