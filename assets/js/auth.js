/**
 * ============================================================================
 * Lingo Examination & Student Management Platform
 * File: assets/js/auth.js
 * Purpose: Admin and Student authentication guards, session persistence,
 *          backend session validation, level authorization checks, and logout.
 * ============================================================================
 */

(function(window) {
  'use strict';

  const ADMIN_KEY = window.API.STORAGE_KEYS.SESSION_ADMIN;
  const STUDENT_KEY = window.API.STORAGE_KEYS.SESSION_STUDENT;

  /**
   * Saves an authenticated Admin session locally.
   */
  function saveAdminSession(sessionData) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(sessionData));
  }

  /**
   * Saves an authenticated Student session locally.
   */
  function saveStudentSession(sessionData) {
    localStorage.setItem(STUDENT_KEY, JSON.stringify(sessionData));
  }

  /**
   * Reads the stored Admin session object.
   */
  function getAdminSession() {
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.token) return null;
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(ADMIN_KEY);
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  /**
   * Reads the stored Student session object.
   */
  function getStudentSession() {
    try {
      const raw = localStorage.getItem(STUDENT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.token) return null;
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(STUDENT_KEY);
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  /**
   * Performs Administrator login via backend API.
   */
  async function loginAdmin(username, password) {
    const data = await window.API.adminLogin({
      username: String(username || '').trim(),
      password: String(password || '')
    });
    saveAdminSession(data);
    return data;
  }

  /**
   * Performs Student login via backend API.
   */
  async function loginStudent(studentCode, password) {
    const data = await window.API.studentLogin({
      studentCode: String(studentCode || '').trim(),
      password: String(password || '')
    });
    saveStudentSession(data);
    return data;
  }

  /**
   * Direct Admin access (Admin platform is standalone and does not require a login code).
   */
  async function requireAdmin() {
    const directSession = {
      token: 'ADMIN_DIRECT',
      role: 'ADMIN',
      user: {
        adminId: 'ADMIN_001',
        username: 'Administrator',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    };
    populateAdminUserDom(directSession.user);
    return directSession;
  }

  /**
   * Protects a Student page: redirects to `login.html` if not authenticated,
   * and verifies the session token and assigned levels with the backend.
   */
  async function requireStudent() {
    const session = getStudentSession();
    if (!session || !session.token) {
      redirectToStudentLogin();
      return null;
    }

    populateStudentUserDom(session.user);

    if (window.API.getWebAppUrl()) {
      try {
        const verified = await window.API.validateSession({ token: session.token });
        if (!verified || verified.role !== 'STUDENT') {
          localStorage.removeItem(STUDENT_KEY);
          redirectToStudentLogin();
          return null;
        }
        // Refresh assigned levels from backend verification
        session.user = Object.assign({}, session.user, {
          studentId: verified.studentId || verified.userId,
          fullName: verified.fullName,
          studentCode: verified.studentCode,
          phone: verified.phone || '',
          assignedLevelIds: verified.assignedLevelIds || []
        });
        saveStudentSession(session);
        populateStudentUserDom(session.user);
      } catch (err) {
        if (err.code === 'UNAUTHORIZED' || err.code === 'FORBIDDEN') {
          localStorage.removeItem(STUDENT_KEY);
          redirectToStudentLogin();
          return null;
        }
      }
    }

    return session;
  }

  /**
   * Logs out the current user (Admin or Student), invalidates the backend session,
   * clears local storage, and redirects to the appropriate login screen.
   */
  async function logout(role) {
    const isStudent = role === 'STUDENT' || window.location.pathname.indexOf('/student/') !== -1;
    const session = isStudent ? getStudentSession() : getAdminSession();

    if (session && session.token && window.API.getWebAppUrl()) {
      try {
        await window.API.logout({ token: session.token });
      } catch (e) {}
    }

    window.API.clearCache();
    if (isStudent) {
      localStorage.removeItem(STUDENT_KEY);
      redirectToStudentLogin();
    } else {
      localStorage.removeItem(ADMIN_KEY);
      redirectToAdminLogin();
    }
  }

  /**
   * Handles unexpected 401/session expiry during API calls.
   */
  function handleUnauthorized() {
    const isStudent = window.location.pathname.indexOf('/student/') !== -1;
    if (isStudent) {
      localStorage.removeItem(STUDENT_KEY);
      redirectToStudentLogin();
    } else {
      localStorage.removeItem(ADMIN_KEY);
      redirectToAdminLogin();
    }
  }

  function redirectToAdminLogin() {
    if (window.location.pathname.indexOf('login.html') === -1) {
      window.location.href = 'login.html';
    }
  }

  function redirectToStudentLogin() {
    if (window.location.pathname.indexOf('login.html') === -1) {
      window.location.href = 'login.html';
    }
  }

  /**
   * Populates Admin username/avatar in the sidebar & topbar.
   */
  function populateAdminUserDom(user) {
    if (!user) return;
    const nameEls = document.querySelectorAll('[data-admin-name]');
    const roleEls = document.querySelectorAll('[data-admin-role]');
    const avatarEls = document.querySelectorAll('[data-admin-avatar]');
    const initials = (user.username || 'AD').substring(0, 2).toUpperCase();

    nameEls.forEach(function(el) { el.textContent = user.username || 'Administrator'; });
    roleEls.forEach(function(el) { el.textContent = user.role || 'SUPER_ADMIN'; });
    avatarEls.forEach(function(el) { el.textContent = initials; });
  }

  /**
   * Populates Student name/code/avatar in the student navbar & dashboard.
   */
  function populateStudentUserDom(user) {
    if (!user) return;
    const nameEls = document.querySelectorAll('[data-student-name]');
    const codeEls = document.querySelectorAll('[data-student-code]');
    const avatarEls = document.querySelectorAll('[data-student-avatar]');
    const parts = String(user.fullName || 'Student').trim().split(/\s+/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : String(user.fullName || 'ST').substring(0, 2).toUpperCase();

    nameEls.forEach(function(el) { el.textContent = user.fullName || 'Student'; });
    codeEls.forEach(function(el) { el.textContent = user.studentCode || ''; });
    avatarEls.forEach(function(el) { el.textContent = initials; });
  }

  /**
   * Checks if the logged-in student is assigned to a specific Level_ID.
   */
  function canStudentAccessLevel(levelId) {
    const session = getStudentSession();
    if (!session || !session.user) return false;
    const assigned = session.user.assignedLevelIds || [];
    return assigned.indexOf(String(levelId).trim()) !== -1;
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-action="logout"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
      });
    });
  });

  window.Auth = {
    loginAdmin: loginAdmin,
    loginStudent: loginStudent,
    getAdminSession: getAdminSession,
    getStudentSession: getStudentSession,
    requireAdmin: requireAdmin,
    requireStudent: requireStudent,
    logout: logout,
    handleUnauthorized: handleUnauthorized,
    canStudentAccessLevel: canStudentAccessLevel
  };
})(window);
