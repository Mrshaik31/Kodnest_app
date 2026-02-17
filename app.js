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

// Initialize job status tracking
let jobStatus = JSON.parse(localStorage.getItem('jobTrackerStatus')) || {};
let statusHistory = JSON.parse(localStorage.getItem('jobTrackerStatusHistory')) || [];

// Initialize Test Checklist
let testChecklist = JSON.parse(localStorage.getItem('jobTrackerTestChecklist')) || {};
const testItems = [
  { id: 'pref_persist', label: 'Preferences persist after refresh' },
  { id: 'match_score', label: 'Match score calculates correctly' },
  { id: 'match_filter', label: '"Show only matches" toggle works' },
  { id: 'job_save', label: 'Save job persists after refresh' },
  { id: 'job_apply', label: 'Apply opens in new tab' },
  { id: 'status_persist', label: 'Status update persists after refresh' },
  { id: 'status_filter', label: 'Status filter works correctly' },
  { id: 'digest_logic', label: 'Digest generates top 10 by score' },
  { id: 'digest_persist', label: 'Digest persists for the day' },
  { id: 'console_clean', label: 'No console errors on main pages' }
];

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
//  JOB STATUS TRACKING
// ==========================================

function updateJobStatus(id, newStatus) {
  const previousStatus = jobStatus[id] || 'not-applied';

  // Update status map
  if (newStatus === 'not-applied') {
    delete jobStatus[id];
  } else {
    jobStatus[id] = newStatus;
  }
  localStorage.setItem('jobTrackerStatus', JSON.stringify(jobStatus));

  // Add to history if status changed
  if (previousStatus !== newStatus) {
    const job = window.jobsData.find(j => j.id === id);
    if (job) {
      statusHistory.unshift({
        jobId: id,
        jobTitle: job.title,
        company: job.company,
        status: newStatus,
        date: new Date().toISOString()
      });
      // Keep only last 20 updates
      if (statusHistory.length > 20) statusHistory = statusHistory.slice(0, 20);
      localStorage.setItem('jobTrackerStatusHistory', JSON.stringify(statusHistory));

      showToast(`Status updated: ${capitalize(newStatus)}`);
    }
  }

  // Re-render to update UI (badge colors etc)
  renderRoute();
}

function getJobStatus(id) {
  return jobStatus[id] || 'not-applied';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
}

// ==========================================
//  TEST CHECKLIST LOGIC
// ==========================================

function updateChecklistItem(id, checked) {
  testChecklist[id] = checked;
  localStorage.setItem('jobTrackerTestChecklist', JSON.stringify(testChecklist));
  renderRoute(); // Re-render to update progress bar
}

function getChecklistProgress() {
  const completed = testItems.filter(item => testChecklist[item.id]).length;
  const total = testItems.length;
  return { completed, total, percentage: (completed / total) * 100 };
}

function resetTestStatus() {
  if (confirm('Are you sure you want to reset all test progress?')) {
    testChecklist = {};
    localStorage.removeItem('jobTrackerTestChecklist');
    renderRoute();
  }
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
//  DAILY DIGEST ENGINE
// ==========================================

function getTodayDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateDigest() {
  const dateStr = getTodayDateString();
  const storageKey = `jobTrackerDigest_${dateStr}`;

  // Check if digest already exists
  const existingDigest = localStorage.getItem(storageKey);
  if (existingDigest) {
    return JSON.parse(existingDigest);
  }

  // Generate new digest
  let jobs = window.jobsData || [];

  // Calculate scores for all jobs
  jobs.forEach(job => {
    job.score = calculateMatchScore(job);
  });

  // Filter by min score
  let digestJobs = jobs.filter(job => job.score >= preferences.minMatchScore);

  // Sort: Match Score (desc), then postedDaysAgo (asc - newest first)
  digestJobs.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.postedDaysAgo - b.postedDaysAgo;
  });

  // Take top 10
  digestJobs = digestJobs.slice(0, 10);

  // Save to storage
  localStorage.setItem(storageKey, JSON.stringify(digestJobs));

  return digestJobs;
}

function copyDigestToClipboard() {
  const dateStr = getTodayDateString();
  const storageKey = `jobTrackerDigest_${dateStr}`;
  const digestJobs = JSON.parse(localStorage.getItem(storageKey)) || [];

  if (digestJobs.length === 0) return;

  const text = `Top 10 Jobs For You - ${dateStr}\n\n` + digestJobs.map(j =>
    `* ${j.title} at ${j.company} (${j.location})\n  Score: ${j.score}/100 | Exp: ${j.experience}\n  Apply: ${j.applyUrl}`
  ).join('\n\n');

  navigator.clipboard.writeText(text).then(() => {
    showToast("Digest copied to clipboard");
  });
}

function createEmailDraft() {
  const dateStr = getTodayDateString();
  const storageKey = `jobTrackerDigest_${dateStr}`;
  const digestJobs = JSON.parse(localStorage.getItem(storageKey)) || [];

  if (digestJobs.length === 0) return;

  const subject = encodeURIComponent(`My 9AM Job Digest - ${dateStr}`);
  const body = encodeURIComponent(`Here are my top job matches for today:\n\n` + digestJobs.map(j =>
    `* ${j.title} at ${j.company}\n  Score: ${j.score}/100 | ${j.location}\n  Apply: ${j.applyUrl}`
  ).join('\n\n'));

  window.open(`mailto:?subject=${subject}&body=${body}`);
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
  const status = getJobStatus(id);

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
            <div class="detail-item">
               <span class="detail-label">Tracking Status</span>
               <div class="detail-value">
                  <select class="status-select ${status}" onchange="updateJobStatus(${job.id}, this.value)">
                    <option value="not-applied" ${status === 'not-applied' ? 'selected' : ''}>Not Applied</option>
                    <option value="applied" ${status === 'applied' ? 'selected' : ''}>Applied</option>
                    <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="selected" ${status === 'selected' ? 'selected' : ''}>Selected</option>
                  </select>
               </div>
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
  const status = getJobStatus(job.id);

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
        
        <div class="job-card__actions-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
           <select class="status-select ${status}" onchange="updateJobStatus(${job.id}, this.value)" title="Update Status">
              <option value="not-applied" ${status === 'not-applied' ? 'selected' : ''}>Not Applied</option>
              <option value="applied" ${status === 'applied' ? 'selected' : ''}>Applied</option>
              <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>Rejected</option>
              <option value="selected" ${status === 'selected' ? 'selected' : ''}>Selected</option>
           </select>
        
           <div class="job-card__actions">
             <button class="btn btn--secondary btn--small" onclick="openJobModal(${job.id})">View</button>
             <button class="btn ${isSaved ? 'btn--primary' : 'btn--secondary'} btn--small" onclick="${isSaved ? `removeJob(${job.id})` : `saveJob(${job.id})`}">
               ${isSaved ? 'Saved' : 'Save'}
             </button>
           </div>
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

      // Check for "Show Matches Only" toggle state
      const showMatchesOnly = window.dashboardShowMatchesOnly || false;
      const statusFilter = window.dashboardStatusFilter || 'all';

      // Filter logic
      if (showMatchesOnly) {
        jobs = jobs.filter(job => job.score >= preferences.minMatchScore);
      }

      // Status Filter
      if (statusFilter !== 'all') {
        jobs = jobs.filter(job => getJobStatus(job.id) === statusFilter);
      }

      // Sorting Logic (Default: Latest)
      jobs.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);

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
            <select class="input input--select" id="status-filter" onchange="toggleStatusFilter(this)">
               <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Status: All</option>
               <option value="not-applied" ${statusFilter === 'not-applied' ? 'selected' : ''}>Not Applied</option>
               <option value="applied" ${statusFilter === 'applied' ? 'selected' : ''}>Applied</option>
               <option value="rejected" ${statusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
               <option value="selected" ${statusFilter === 'selected' ? 'selected' : ''}>Selected</option>
            </select>
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
              <h3 class="empty-state__title">No jobs found</h3>
              <p class="empty-state__message">Try adjusting your filters or status selector.</p>
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
    render: () => {
      // Check if preferences are set (basic check: role keywords)
      if (!preferences.roleKeywords) {
        return `
          <div class="page-container">
            <h1 class="page-title">Daily Digest</h1>
            <div class="empty-state">
              <h3 class="empty-state__title">Configure Preferences First</h3>
              <p class="empty-state__message">To generate a personalized daily digest, we need to know what you're looking for.</p>
              <a href="#/settings" class="btn btn--primary" style="margin-top: var(--space-md)">Set Preferences</a>
            </div>
          </div>
        `;
      }

      const dateStr = getTodayDateString();
      const storageKey = `jobTrackerDigest_${dateStr}`;
      const digestJobs = JSON.parse(localStorage.getItem(storageKey));

      // Render Logic...
      let digestHtml = '';

      if (!digestJobs) {
        digestHtml = `
             <div class="empty-state">
               <h3 class="empty-state__title">Ready for your morning brief?</h3>
               <p class="empty-state__message">Generate your personalized list of top 10 job matches for ${dateStr}.</p>
               <button class="btn btn--primary" onclick="handleGenerateDigest()">Generate 9AM Digest (Simulated)</button>
               <div class="simulation-badge">Demo Mode: Manual Trigger</div>
             </div>
        `;
      } else if (digestJobs.length === 0) {
        digestHtml = `
             <div class="empty-state">
               <h3 class="empty-state__title">No matches found today</h3>
               <p class="empty-state__message">We couldn't find any new jobs matching your specific criteria today. Check back tomorrow!</p>
               <button class="btn btn--secondary" onclick="handleGenerateDigest()">Regenerate</button>
             </div>
        `;
      } else {
        digestHtml = `
          <div class="digest-container">
            <header class="digest-header">
              <div class="digest-title">Your Daily Job Brief</div>
              <div class="digest-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </header>
            
            <div class="digest-list">
              ${digestJobs.map(job => `
                <div class="digest-item">
                  <div class="digest-item__content">
                    <h4>${job.title}</h4>
                    <div class="digest-item__meta">${job.company} • ${job.location}</div>
                  </div>
                  <div class="digest-item__score">
                    <span class="match-badge ${getScoreBadgeClass(job.score)}">${job.score}</span>
                    <a href="${job.applyUrl}" target="_blank" class="btn btn--secondary btn--small" style="font-size: 10px; padding: 4px 8px;">Apply</a>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <footer class="digest-footer">
              <p>This digest was generated based on your preferences for "${preferences.roleKeywords}".</p>
              <div class="simulation-badge">Simulated 9AM Trigger</div>
            </footer>
          </div>
          
          <div class="digest-actions">
            <button class="btn btn--secondary" onclick="copyDigestToClipboard()">
              <span class="icon">📋</span> Copy to Clipboard
            </button>
            <button class="btn btn--secondary" onclick="createEmailDraft()">
               <span class="icon">✉️</span> Create Email Draft
            </button>
          </div>
        `;
      }

      // Append Status History if available
      let historyHtml = '';
      if (statusHistory.length > 0) {
        historyHtml = `
           <div class="status-history">
              <h3 class="status-history-title">Recent Status Updates</h3>
              ${statusHistory.map(item => `
                 <div class="history-item">
                    <span>${item.jobTitle} @ ${item.company}</span>
                    <div style="text-align: right">
                       <span class="history-status ${item.status}">${capitalize(item.status)}</span>
                       <br><span style="font-size: 10px; opacity: 0.7">${new Date(item.date).toLocaleDateString()}</span>
                    </div>
                 </div>
              `).join('')}
           </div>
         `;
      }

      return `
        <div class="page-container">
          <h1 class="page-title">Daily Digest</h1>
          ${digestHtml}
          ${historyHtml && digestJobs ? '<div style="max-width: 600px; margin: 0 auto;">' + historyHtml + '</div>' : ''}
        </div>
      `;
    }
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
  '/jt/07-test': {
    title: 'Pre-Flight Checklist',
    render: () => {
      const { completed, total, percentage } = getChecklistProgress();

      return `
        <div class="page-container">
          <div class="checklist-container">
            <div class="checklist-header">
              <h1 class="page-title">Pre-Flight Test Checklist</h1>
              <p>Tests Passed: ${completed} / ${total}</p>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${percentage}%"></div>
              </div>
              ${percentage < 100 ?
          '<p class="checklist-tooltip" style="color: #BA1C1C">Resolve all issues before shipping.</p>' :
          '<p class="checklist-tooltip" style="color: #047857">All systems go!</p>'}
            </div>
            
            <div class="checklist-items">
              ${testItems.map(item => `
                <div class="checklist-item">
                  <input type="checkbox" class="checklist-checkbox" 
                    id="${item.id}" 
                    ${testChecklist[item.id] ? 'checked' : ''} 
                    onchange="updateChecklistItem('${item.id}', this.checked)">
                  <div>
                    <label for="${item.id}" class="checklist-label">${item.label}</label>
                    <span class="checklist-tooltip">Verify this feature manually.</span>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div style="margin-top: var(--space-xl); text-align: center;">
               <button class="btn btn--secondary btn--small" onclick="resetTestStatus()">Reset Test Status</button>
               <br><br>
               <a href="#/jt/08-ship" class="btn ${percentage === 100 ? 'btn--primary' : 'btn--secondary'}" ${percentage < 100 ? 'style="opacity: 0.5"' : ''}>
                 Next: Ship Application
               </a>
            </div>
          </div>
        </div>
      `;
    }
  },
  '/jt/08-ship': {
    title: 'Ready to Ship',
    render: () => {
      const { completed, total } = getChecklistProgress();

      if (completed < total) {
        return `
          <div class="page-container">
            <div class="checklist-container checklist-locked">
              <span class="lock-icon">🔒</span>
              <h2 class="page-title">Ship Locked</h2>
              <p>You must verify all ${total} test items before proceeding to the final ship status.</p>
              <p style="margin-top: var(--space-md)">Current Status: ${completed}/${total} Passed</p>
              <a href="#/jt/07-test" class="btn btn--secondary" style="margin-top: var(--space-lg)">Return to Checklist</a>
            </div>
          </div>
        `;
      }

      return `
        <div class="page-container">
          <div class="checklist-container ship-success">
             <h1 class="page-title" style="font-size: 3rem">🚀</h1>
             <h2 class="page-title">Ready for Takeoff</h2>
             <p>All systems verified. The Job Notification Tracker is ready for deployment.</p>
             <div style="margin-top: var(--space-xl)">
                <p><strong>Final Version: 1.0.0</strong></p>
             </div>
          </div>
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

// Handle Digest Generation
function handleGenerateDigest() {
  generateDigest();
  renderRoute(); // Re-render to show the digest
}

// Global toggle handler
window.dashboardShowMatchesOnly = false;
function toggleMatchFilter(checkbox) {
  window.dashboardShowMatchesOnly = checkbox.checked;
  renderRoute();
}

// Global status filter handler
window.dashboardStatusFilter = 'all';
function toggleStatusFilter(select) {
  window.dashboardStatusFilter = select.value;
  renderRoute();
}

// Get current route from hash
function getCurrentRoute() {
  const hash = window.location.hash.slice(1) || '/';
  if (hash === '' || hash === '/') return '/';
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
