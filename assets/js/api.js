window.LINGO_PORTAL_ROLE = 'STUDENT';
/**
 * ============================================================================
 * Lingo Examination & Student Management Platform
 * File: assets/js/api.js
 * Purpose: Centralized API Service communicating with Google Apps Script
 *          Web App Backend connected to Google Sheets:
 *          1RlvD6UnNKfY_pcPgQMGr7ilmhzzeBBSFHrCyGs0Kejg
 * ============================================================================
 */

(function(window) {
  'use strict';

  const STORAGE_KEYS = {
    WEB_APP_URL: 'LINGO_GAS_WEB_APP_URL',
    SESSION_ADMIN: 'LINGO_ADMIN_SESSION',
    SESSION_STUDENT: 'LINGO_STUDENT_SESSION',
    CACHE_PREFIX: 'LINGO_CACHE_',
    LANGUAGE: 'LINGO_LANG'
  };

  /**
   * Default configuration.
   * After deploying the Google Apps Script project as a Web App, paste your
   * deployment URL (`https://script.google.com/macros/s/.../exec`) into
   * `DEFAULT_WEB_APP_URL` below OR configure it directly via the UI Connection Modal.
   */
  const API_CONFIG = {
    SPREADSHEET_ID: '1RlvD6UnNKfY_pcPgQMGr7ilmhzzeBBSFHrCyGs0Kejg',
    SPREADSHEET_URL: 'https://docs.google.com/spreadsheets/d/1RlvD6UnNKfY_pcPgQMGr7ilmhzzeBBSFHrCyGs0Kejg/edit',
    DEFAULT_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycby7-LK77dVDYUXfkrgFZd5a8MEqeZg8FNzwO_V1TLu8wGkdPfr8IhrMZ1cxUsx047gJ/exec',
    CACHE_TTL_MS: 45 * 1000, // 45 seconds for read-only list caching
    REQUEST_TIMEOUT_MS: 45000
  };

  const READABLE_CACHE_ACTIONS = [
    'getLevels',
    'getSystemSettings'
  ];

  const WRITE_INVALIDATING_ACTIONS = [
    'initializeDatabase',
    'updateSystemSettings',
    'createStudent', 'updateStudent', 'deleteStudent', 'resetStudentPassword', 'assignStudentLevels', 'updateStudentStatus',
    'createLevel', 'updateLevel', 'reorderLevels', 'deleteLevel',
    'createLesson', 'updateLesson', 'reorderLessons', 'deleteLesson', 'markLessonComplete',
    'createExam', 'updateExam', 'deleteExam', 'startExam', 'submitExam', 'gradeExam',
    'createTask', 'updateTask', 'duplicateTask', 'deleteTask', 'submitTask', 'gradeTask'
  ];

  /**
   * Generates a unique client-side request ID.
   */
  function generateRequestId() {
    return 'REQ_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  /**
   * Retrieves the configured Google Apps Script Web App URL.
   */
  function getWebAppUrl() {
    const saved = localStorage.getItem(STORAGE_KEYS.WEB_APP_URL);
    return (saved ? saved.trim() : '') || API_CONFIG.DEFAULT_WEB_APP_URL.trim();
  }

  /**
   * Saves the Google Apps Script Web App URL in localStorage.
   */
  function setWebAppUrl(url) {
    const clean = String(url || '').trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEYS.WEB_APP_URL, clean);
    } else {
      localStorage.removeItem(STORAGE_KEYS.WEB_APP_URL);
    }
    clearCache();
  }

  /**
   * Determines whether the current page belongs to the Student Portal or Admin Dashboard.
   */
  function getPortalRole() {
    if (window.LINGO_PORTAL_ROLE) return window.LINGO_PORTAL_ROLE;
    if (
      window.location.pathname.indexOf('/student/') !== -1 ||
      document.querySelector('.student-navbar') ||
      document.getElementById('student-login-form') ||
      document.getElementById('exam-active-workspace')
    ) {
      return 'STUDENT';
    }
    return 'ADMIN';
  }

  /**
   * Retrieves the active session token depending on current portal context (Admin vs Student).
   */
  function getActiveSessionToken() {
    const role = getPortalRole();
    if (role === 'ADMIN') {
      return 'ADMIN_DIRECT';
    }

    try {
      const rawStudent = localStorage.getItem(STORAGE_KEYS.SESSION_STUDENT);
      if (rawStudent) {
        const parsed = JSON.parse(rawStudent);
        if (parsed && parsed.token) return parsed.token;
      }
    } catch (e) {}
    return '';
  }

  /**
   * Clears cached read responses in sessionStorage.
   */
  function clearCache() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.indexOf(STORAGE_KEYS.CACHE_PREFIX) === 0) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(function(k) { sessionStorage.removeItem(k); });
    } catch (e) {}
  }

  /**
   * Reads a cached API response if within TTL.
   */
  function getCachedResponse(action, payload) {
    try {
      const key = STORAGE_KEYS.CACHE_PREFIX + action + '_' + JSON.stringify(payload || {});
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.timestamp > API_CONFIG.CACHE_TTL_MS) {
        sessionStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Stores an API response in sessionStorage cache.
   */
  function setCachedResponse(action, payload, data) {
    try {
      const key = STORAGE_KEYS.CACHE_PREFIX + action + '_' + JSON.stringify(payload || {});
      sessionStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
    } catch (e) {}
  }

  /**
   * Core centralized API call to the Google Apps Script Web App backend.
   *
   * @param {string} action - Backend API action name
   * @param {Object=} payload - Request parameters
   * @param {Object=} options - { skipCache, silent }
   * @return {Promise<*>} Resolved `response.data`
   */
  async function request(action, payload, options) {
    const opts = options || {};
    const reqPayload = Object.assign({}, payload || {}, {
      action: action,
      portalRole: getPortalRole(),
      requestId: generateRequestId()
    });

    if (!reqPayload.token) {
      const activeToken = getActiveSessionToken();
      if (activeToken) {
        reqPayload.token = activeToken;
      }
    }

    if (WRITE_INVALIDATING_ACTIONS.indexOf(action) !== -1) {
      clearCache();
    } else if (!opts.skipCache && READABLE_CACHE_ACTIONS.indexOf(action) !== -1) {
      const cached = getCachedResponse(action, payload);
      if (cached !== null) {
        return cached;
      }
    }

    const webAppUrl = getWebAppUrl();
    if (!webAppUrl) {
      openConfigModal();
      throw new Error('Google Apps Script Web App URL is not configured yet. Please paste your deployed Web App URL in the Backend Connection dialog.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(function() {
      controller.abort();
    }, API_CONFIG.REQUEST_TIMEOUT_MS);

    try {
      // Use text/plain;charset=utf-8 to avoid CORS preflight rejection on Google Apps Script Web Apps
      const response = await fetch(webAppUrl, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(reqPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Backend HTTP Error: ' + response.status + ' ' + response.statusText);
      }

      const result = await response.json();

      if (!result || result.success !== true) {
        const errMsg = (result && result.message) ? result.message : 'Backend operation failed.';
        const errCode = (result && result.errorCode) ? result.errorCode : 'ERROR';

        if (errCode === 'UNAUTHORIZED' && action !== 'validateSession' && action !== 'adminLogin' && action !== 'studentLogin') {
          if (window.Auth && typeof window.Auth.handleUnauthorized === 'function') {
            window.Auth.handleUnauthorized();
          }
        }

        const err = new Error(errMsg);
        err.code = errCode;
        err.requestId = result ? result.requestId : reqPayload.requestId;
        throw err;
      }

      if (READABLE_CACHE_ACTIONS.indexOf(action) !== -1) {
        setCachedResponse(action, payload, result.data);
      }

      return result.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request to Google Apps Script timed out. Please verify your internet connection and Web App deployment.');
      }
      throw error;
    }
  }

  /**
   * Converts a browser File object into Base64 and uploads it to Google Drive via `uploadMedia`.
   *
   * @param {File} fileObj - Browser File instance from `<input type="file">`
   * @param {string} fileType - 'image' | 'audio' | 'video'
   * @param {string=} relatedQuestionId
   * @return {Promise<Object>} Uploaded media metadata with Drive File ID and direct URL
   */
  function uploadMediaFile(fileObj, fileType, relatedQuestionId) {
    return new Promise(function(resolve, reject) {
      if (!fileObj) {
        return reject(new Error('No file selected for upload.'));
      }
      const reader = new FileReader();
      reader.onload = async function(evt) {
        try {
          const base64Data = evt.target.result;
          const uploaded = await request('uploadMedia', {
            fileName: fileObj.name,
            mimeType: fileObj.type,
            fileType: fileType || '',
            base64Data: base64Data,
            relatedQuestionId: relatedQuestionId || ''
          });
          resolve(uploaded);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = function() {
        reject(new Error('Failed to read local file for upload.'));
      };
      reader.readAsDataURL(fileObj);
    });
  }

  /**
   * Opens the Backend Connection Configuration Modal so the administrator or user
   * can connect the frontend to their deployed Google Apps Script Web App URL
   * and initialize the Google Sheets database (`1RlvD6UnNKfY_pcPgQMGr7ilmhzzeBBSFHrCyGs0Kejg`).
   */
  function openConfigModal() {
    let modal = document.getElementById('gas-config-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gas-config-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fa-solid fa-plug-circle-check text-primary"></i> Backend API Connection</h3>
            <button type="button" class="modal-close" id="gas-config-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Connected Google Sheet ID</label>
              <div class="d-flex gap-2">
                <input type="text" class="form-control" value="${API_CONFIG.SPREADSHEET_ID}" readonly style="font-family:monospace;background:#f1f5f9;">
                <a href="${API_CONFIG.SPREADSHEET_URL}" target="_blank" rel="noopener" class="btn btn-secondary" title="Open Google Sheet">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> Sheet
                </a>
              </div>
              <span class="form-hint">All 11 database sheets and headers are automatically created in this spreadsheet.</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="gas-webapp-url-input">Google Apps Script Web App URL <span class="required">*</span></label>
              <input type="url" id="gas-webapp-url-input" class="form-control" placeholder="https://script.google.com/macros/s/.../exec">
              <span class="form-hint">Deploy the scripts in <code>google-apps-script/*.gs</code> as a Web App (Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong>) and paste the Web App URL above.</span>
            </div>
            <div id="gas-connection-result" class="d-none" style="padding:0.85rem;border-radius:8px;font-size:0.85rem;margin-top:0.75rem;"></div>
          </div>
          <div class="modal-footer justify-between">
            <button type="button" class="btn btn-outline-primary btn-sm" id="gas-init-db-btn">
              <i class="fa-solid fa-database"></i> Initialize Sheets & Drive
            </button>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-secondary" id="gas-test-ping-btn">
                <i class="fa-solid fa-satellite-dish"></i> Test Connection
              </button>
              <button type="button" class="btn btn-primary" id="gas-save-url-btn">
                <i class="fa-solid fa-floppy-disk"></i> Save & Connect
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('#gas-config-close');
      const urlInput = modal.querySelector('#gas-webapp-url-input');
      const resultBox = modal.querySelector('#gas-connection-result');
      const testBtn = modal.querySelector('#gas-test-ping-btn');
      const initBtn = modal.querySelector('#gas-init-db-btn');
      const saveBtn = modal.querySelector('#gas-save-url-btn');

      function showResult(msg, isSuccess) {
        resultBox.classList.remove('d-none');
        resultBox.style.backgroundColor = isSuccess ? '#d1fae5' : '#fee2e2';
        resultBox.style.color = isSuccess ? '#065f46' : '#991b1b';
        resultBox.innerHTML = msg;
      }

      closeBtn.addEventListener('click', function() {
        modal.classList.remove('active');
      });

      testBtn.addEventListener('click', async function() {
        const candidateUrl = urlInput.value.trim();
        if (!candidateUrl) {
          showResult('<i class="fa-solid fa-triangle-exclamation"></i> Please enter the Google Apps Script Web App URL first.', false);
          return;
        }
        setWebAppUrl(candidateUrl);
        testBtn.disabled = true;
        testBtn.innerHTML = '<span class="spinner spinner-sm"></span> Testing...';
        try {
          const data = await request('ping', {}, { skipCache: true });
          showResult('<i class="fa-solid fa-circle-check"></i> Connected successfully! Spreadsheet ID: <code>' + (data.spreadsheetId || API_CONFIG.SPREADSHEET_ID) + '</code>', true);
          updateConnectionIndicator(true);
        } catch (err) {
          showResult('<i class="fa-solid fa-circle-xmark"></i> Connection failed: ' + err.message, false);
          updateConnectionIndicator(false);
        } finally {
          testBtn.disabled = false;
          testBtn.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Test Connection';
        }
      });

      initBtn.addEventListener('click', async function() {
        const candidateUrl = urlInput.value.trim();
        if (!candidateUrl) {
          showResult('<i class="fa-solid fa-triangle-exclamation"></i> Please enter the Google Apps Script Web App URL first.', false);
          return;
        }
        setWebAppUrl(candidateUrl);
        initBtn.disabled = true;
        initBtn.innerHTML = '<span class="spinner spinner-sm"></span> Initializing...';
        try {
          const data = await request('initializeDatabase', {}, { skipCache: true });
          showResult(
            '<i class="fa-solid fa-circle-check"></i> Database & Drive folders initialized!<br>' +
            'Created Tabs: <strong>' + ((data.createdSheets && data.createdSheets.length) ? data.createdSheets.join(', ') : 'All 11 tabs verified') + '</strong>' +
            (data.initialAdminCreated ? '<br>Initial Admin Created: <code>admin</code> / <code>Admin@12345</code>' : ''),
            true
          );
          updateConnectionIndicator(true);
        } catch (err) {
          showResult('<i class="fa-solid fa-circle-xmark"></i> Initialization error: ' + err.message, false);
        } finally {
          initBtn.disabled = false;
          initBtn.innerHTML = '<i class="fa-solid fa-database"></i> Initialize Sheets & Drive';
        }
      });

      saveBtn.addEventListener('click', function() {
        const candidateUrl = urlInput.value.trim();
        setWebAppUrl(candidateUrl);
        updateConnectionIndicator(Boolean(candidateUrl));
        modal.classList.remove('active');
        if (window.Helpers && typeof window.Helpers.showToast === 'function') {
          window.Helpers.showToast('Backend Web App URL saved successfully.', 'success');
        }
        if (typeof window.onBackendConnected === 'function') {
          window.onBackendConnected();
        }
      });
    }

    const input = modal.querySelector('#gas-webapp-url-input');
    if (input) input.value = getWebAppUrl();
    const resBox = modal.querySelector('#gas-connection-result');
    if (resBox) resBox.classList.add('d-none');
    modal.classList.add('active');
  }

  /**
   * Updates any `.api-status-pill` indicator in the current page header.
   */
  function updateConnectionIndicator(isConfigured) {
    const configured = isConfigured !== undefined ? isConfigured : Boolean(getWebAppUrl());
    const pills = document.querySelectorAll('.api-status-pill');
    pills.forEach(function(pill) {
      const dot = pill.querySelector('.api-status-dot');
      const label = pill.querySelector('.api-status-label');
      if (dot) {
        dot.classList.toggle('offline', !configured);
      }
      if (label) {
        label.textContent = configured ? 'GAS Backend Connected' : 'Configure Backend URL';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateConnectionIndicator();
    document.querySelectorAll('.api-status-pill, [data-action="open-api-config"]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        openConfigModal();
      });
    });
  });

  window.API = {
    CONFIG: API_CONFIG,
    STORAGE_KEYS: STORAGE_KEYS,
    getWebAppUrl: getWebAppUrl,
    setWebAppUrl: setWebAppUrl,
    request: request,
    uploadMediaFile: uploadMediaFile,
    clearCache: clearCache,
    openConfigModal: openConfigModal,
    updateConnectionIndicator: updateConnectionIndicator,

    // Convenience wrappers for all Backend API Endpoints
    adminLogin: function(p) { return request('adminLogin', p); },
    studentLogin: function(p) { return request('studentLogin', p); },
    validateSession: function(p) { return request('validateSession', p); },
    logout: function(p) { return request('logout', p); },

    getStudents: function(p) { return request('getStudents', p); },
    getStudentById: function(p) { return request('getStudentById', p); },
    createStudent: function(p) { return request('createStudent', p); },
    updateStudent: function(p) { return request('updateStudent', p); },
    deleteStudent: function(p) { return request('deleteStudent', p); },
    resetStudentPassword: function(p) { return request('resetStudentPassword', p); },
    assignStudentLevels: function(p) { return request('assignStudentLevels', p); },
    updateStudentStatus: function(p) { return request('updateStudentStatus', p); },

    getLevels: function(p, opts) { return request('getLevels', p, opts); },
    getLevelDetails: function(p) { return request('getLevelDetails', p); },
    createLevel: function(p) { return request('createLevel', p); },
    updateLevel: function(p) { return request('updateLevel', p); },
    reorderLevels: function(p) { return request('reorderLevels', p); },
    deleteLevel: function(p) { return request('deleteLevel', p); },

    getLessons: function(p) { return request('getLessons', p); },
    getLessonById: function(p) { return request('getLessonById', p); },
    createLesson: function(p) { return request('createLesson', p); },
    updateLesson: function(p) { return request('updateLesson', p); },
    reorderLessons: function(p) { return request('reorderLessons', p); },
    deleteLesson: function(p) { return request('deleteLesson', p); },
    markLessonComplete: function(p) { return request('markLessonComplete', p); },

    getExams: function(p) { return request('getExams', p); },
    getExamById: function(p) { return request('getExamById', p); },
    getExamForStudent: function(p) { return request('getExamForStudent', p); },
    createExam: function(p) { return request('createExam', p); },
    updateExam: function(p) { return request('updateExam', p); },
    deleteExam: function(p) { return request('deleteExam', p); },
    startExam: function(p) { return request('startExam', p); },
    saveExamAnswers: function(p) { return request('saveExamAnswers', p); },
    submitExam: function(p) { return request('submitExam', p); },
    gradeExam: function(p) { return request('gradeExam', p); },
    getExamResults: function(p) { return request('getExamResults', p); },

    getTasks: function(p) { return request('getTasks', p); },
    getTaskById: function(p) { return request('getTaskById', p); },
    getTaskForStudent: function(p) { return request('getTaskForStudent', p); },
    createTask: function(p) { return request('createTask', p); },
    updateTask: function(p) { return request('updateTask', p); },
    duplicateTask: function(p) { return request('duplicateTask', p); },
    deleteTask: function(p) { return request('deleteTask', p); },
    saveTaskProgress: function(p) { return request('saveTaskProgress', p); },
    submitTask: function(p) { return request('submitTask', p); },
    gradeTask: function(p) { return request('gradeTask', p); },
    getTaskResults: function(p) { return request('getTaskResults', p); },

    getStudentPerformance: function(p) { return request('getStudentPerformance', p); },
    getStudentExamHistory: function(p) { return request('getStudentExamHistory', p); },
    getStudentTaskHistory: function(p) { return request('getStudentTaskHistory', p); },
    generateStudentReport: function(p) { return request('generateStudentReport', p); },
    getDashboardStatistics: function(p) { return request('getDashboardStatistics', p); },
    getStudentDashboardData: function(p) { return request('getStudentDashboardData', p); },

    initializeDatabase: function(p) { return request('initializeDatabase', p); },
    checkDatabaseHealth: function(p) { return request('checkDatabaseHealth', p); },
    getSystemSettings: function(p, opts) { return request('getSystemSettings', p, opts); },
    updateSystemSettings: function(p) { return request('updateSystemSettings', p); },
    createDatabaseBackup: function(p) { return request('createDatabaseBackup', p); },
    createDriveFolders: function(p) { return request('createDriveFolders', p); }
  };
})(window);
