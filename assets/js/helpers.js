/**
 * ============================================================================
 * Lingo Examination & Student Management Platform
 * File: assets/js/helpers.js
 * Purpose: UI helpers (Toasts, Confirmation Modals, Pagination, Date/Time,
 *          Bilingual EN/AR RTL Switcher, CSV/JSON Downloads, and the shared
 *          Rich Visual Question Editor for Exams & Tasks).
 * ============================================================================
 */

(function(window) {
  'use strict';

  /**
   * Escapes unsafe HTML characters to prevent XSS.
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Displays a non-blocking Toast notification.
   *
   * @param {string} message
   * @param {string=} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number=} durationMs
   */
  function showToast(message, type, durationMs) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const kind = type || 'info';
    const iconMap = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + kind;
    toast.innerHTML = `
      <i class="fa-solid ${iconMap[kind] || iconMap.info} toast-icon"></i>
      <div class="toast-content">${escapeHtml(message)}</div>
    `;
    container.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, durationMs || 4200);
  }

  /**
   * Shows a styled Promise-based confirmation dialog.
   *
   * @param {Object} options - { title, message, confirmText, cancelText, danger }
   * @return {Promise<boolean>}
   */
  function confirmDialog(options) {
    return new Promise(function(resolve) {
      const opts = options || {};
      let backdrop = document.getElementById('global-confirm-modal');
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }

      backdrop = document.createElement('div');
      backdrop.id = 'global-confirm-modal';
      backdrop.className = 'modal-backdrop active';
      backdrop.innerHTML = `
        <div class="modal-dialog modal-sm">
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="fa-solid ${opts.danger !== false ? 'fa-triangle-exclamation text-danger' : 'fa-circle-question text-primary'}"></i>
              ${escapeHtml(opts.title || 'Confirm Action')}
            </h3>
            <button type="button" class="modal-close" data-confirm-cancel>&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size:0.95rem;color:var(--text-secondary);">${escapeHtml(opts.message || 'Are you sure you want to proceed?')}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-confirm-cancel>${escapeHtml(opts.cancelText || 'Cancel')}</button>
            <button type="button" class="btn ${opts.danger !== false ? 'btn-danger' : 'btn-primary'}" data-confirm-ok>${escapeHtml(opts.confirmText || 'Confirm')}</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);

      function cleanup(result) {
        backdrop.classList.remove('active');
        setTimeout(function() {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        }, 150);
        resolve(result);
      }

      backdrop.querySelectorAll('[data-confirm-cancel]').forEach(function(btn) {
        btn.addEventListener('click', function() { cleanup(false); });
      });
      backdrop.querySelector('[data-confirm-ok]').addEventListener('click', function() {
        cleanup(true);
      });
    });
  }

  /**
   * Formats an ISO date string into a readable date.
   */
  function formatDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }

  /**
   * Formats an ISO date string into a readable date and time.
   */
  function formatDateTime(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  /**
   * Formats seconds into MM:SS or HH:MM:SS.
   */
  function formatTimer(seconds) {
    const sec = Math.max(0, Math.floor(Number(seconds) || 0));
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const rem = sec % 60;
    if (hrs > 0) {
      return String(hrs).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ':' + String(rem).padStart(2, '0');
    }
    return String(mins).padStart(2, '0') + ':' + String(rem).padStart(2, '0');
  }

  /**
   * Extracts 2-letter initials from a person's name.
   */
  function getInitials(name) {
    const clean = String(name || 'User').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  }

  /**
   * Returns semantic color hex based on percentage score.
   */
  function getPerformanceColor(pct) {
    const n = Number(pct || 0);
    if (n >= 80) return '#10b981'; // Emerald
    if (n >= 65) return '#3b82f6'; // Blue
    if (n >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Rose
  }

  /**
   * Returns a styled status badge HTML string.
   */
  function renderStatusBadge(status) {
    const st = String(status || 'ACTIVE').toUpperCase();
    if (st === 'ACTIVE' || st === 'PASSED' || st === 'GRADED' || st === 'COMPLETED' || st === 'SUBMITTED') {
      return `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(st)}</span>`;
    }
    if (st === 'PENDING' || st === 'PENDING_REVIEW' || st === 'PENDING_MANUAL_REVIEW' || st === 'IN_PROGRESS' || st === 'UPCOMING') {
      return `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> ${escapeHtml(st.replace(/_/g, ' '))}</span>`;
    }
    if (st === 'INACTIVE' || st === 'FAILED' || st === 'OVERDUE' || st === 'EXPIRED' || st === 'SUBMITTED_LATE') {
      return `<span class="badge badge-danger"><i class="fa-solid fa-circle-exclamation"></i> ${escapeHtml(st.replace(/_/g, ' '))}</span>`;
    }
    return `<span class="badge badge-secondary">${escapeHtml(st)}</span>`;
  }

  /**
   * Triggers a client-side JSON file download.
   */
  function downloadJsonFile(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Triggers a client-side CSV file download.
   */
  function downloadCsvFile(filename, headers, rows) {
    const escapeCsv = function(val) {
      const s = val === null || val === undefined ? '' : String(val);
      if (/[",\n\r]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const csvLines = [headers.map(escapeCsv).join(',')];
    rows.forEach(function(row) {
      csvLines.push(row.map(escapeCsv).join(','));
    });
    const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Reads a URL query parameter by name.
   */
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * Bilingual / RTL Language Support (English LTR & Arabic RTL).
   */
  const I18N_DICTIONARY = {
    ar: {
      'Dashboard': 'لوحة التحكم',
      'Students': 'الطلاب',
      'Levels': 'المستويات',
      'Lessons': 'الدروس',
      'Exams': 'الاختبارات',
      'Tasks': 'المهام والواجبات',
      'Performance': 'أداء الطلاب',
      'Reports': 'التقارير الأكاديمية',
      'Settings': 'الإعدادات',
      'My Levels': 'مستوياتي',
      'My Profile': 'ملفي الشخصي',
      'Logout': 'تسجيل الخروج'
    }
  };

  function getLanguage() {
    return localStorage.getItem('LINGO_LANG') || 'en';
  }

  function applyLanguage(lang) {
    const target = lang === 'ar' ? 'ar' : 'en';
    localStorage.setItem('LINGO_LANG', target);
    document.documentElement.lang = target;
    document.documentElement.dir = target === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-lang-toggleLabel]').forEach(function(el) {
      el.textContent = target === 'ar' ? 'EN' : 'عربي';
    });

    if (target === 'ar') {
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        const key = el.getAttribute('data-i18n');
        if (I18N_DICTIONARY.ar[key]) {
          if (!el.getAttribute('data-i18n-orig')) {
            el.setAttribute('data-i18n-orig', el.textContent);
          }
          el.textContent = I18N_DICTIONARY.ar[key];
        }
      });
    } else {
      document.querySelectorAll('[data-i18n-orig]').forEach(function(el) {
        el.textContent = el.getAttribute('data-i18n-orig');
      });
    }
  }

  function toggleLanguage() {
    const next = getLanguage() === 'ar' ? 'en' : 'ar';
    applyLanguage(next);
  }

  /**
   * Renders reusable pagination controls.
   */
  function renderPagination(containerEl, totalItems, currentPage, pageSize, onPageChange) {
    if (!containerEl) return;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(totalItems, currentPage * pageSize);

    let buttonsHtml = `
      <button type="button" class="page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
        buttonsHtml += `<button type="button" class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      } else if (Math.abs(p - currentPage) === 2) {
        buttonsHtml += `<span style="padding:0 4px;color:var(--text-muted);">...</span>`;
      }
    }

    buttonsHtml += `
      <button type="button" class="page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    containerEl.innerHTML = `
      <div class="pagination-info">Showing <strong>${startIdx}–${endIdx}</strong> of <strong>${totalItems}</strong> records</div>
      <div class="pagination-controls">${buttonsHtml}</div>
    `;

    containerEl.querySelectorAll('.page-btn[data-page]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const targetPage = Number(btn.getAttribute('data-page'));
        if (targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
          onPageChange(targetPage);
        }
      });
    });
  }

  /**
   * ==========================================================================
   * Rich Visual Question Editor Component (Sections 7.1, 7.2, 8.2)
   * Supports all 8 question types, drag-and-drop reordering, duplication,
   * media uploads (image, audio, video) to Google Drive, and question preview.
   * ==========================================================================
   */
  function createQuestionEditor(containerEl, options) {
    const opts = options || {};
    let questions = [];
    let dragSrcIndex = null;

    const QUESTION_TYPE_LABELS = {
      multiple_choice_single: '1. Multiple Choice (Single Answer)',
      multiple_choice_multiple: '2. Multiple Choice (Multiple Answers)',
      true_false: '3. True / False',
      short_answer: '4. Short Answer',
      fill_in_the_blanks: '5. Fill in the Blanks',
      matching: '6. Matching Questions',
      ordering: '7. Ordering Questions',
      essay: '8. Essay Question'
    };

    function getDefaultQuestion(index, type) {
      const qType = type || 'multiple_choice_single';
      const qNum = index + 1;
      const base = {
        question_id: 'Q' + String(qNum).padStart(3, '0'),
        type: qType,
        order: qNum,
        difficulty: 'medium',
        text: '',
        points: 10,
        explanation: '',
        media: { image: null, audio: null, video: null },
        options: [],
        pairs: [],
        items: [],
        correct_answer: ''
      };

      if (qType === 'multiple_choice_single') {
        base.options = [
          { option_id: 'A', text: 'Option A' },
          { option_id: 'B', text: 'Option B' },
          { option_id: 'C', text: 'Option C' },
          { option_id: 'D', text: 'Option D' }
        ];
        base.correct_answer = 'A';
      } else if (qType === 'multiple_choice_multiple') {
        base.options = [
          { option_id: 'A', text: 'Option A' },
          { option_id: 'B', text: 'Option B' },
          { option_id: 'C', text: 'Option C' }
        ];
        base.correct_answer = ['A', 'B'];
      } else if (qType === 'true_false') {
        base.options = [
          { option_id: 'TRUE', text: 'True' },
          { option_id: 'FALSE', text: 'False' }
        ];
        base.correct_answer = 'TRUE';
      } else if (qType === 'short_answer') {
        base.correct_answer = '';
      } else if (qType === 'fill_in_the_blanks') {
        base.correct_answer = [''];
      } else if (qType === 'matching') {
        base.pairs = [
          { pair_id: 'P1', left: 'Prompt 1', right: 'Match 1' },
          { pair_id: 'P2', left: 'Prompt 2', right: 'Match 2' }
        ];
        base.correct_answer = { P1: 'Match 1', P2: 'Match 2' };
      } else if (qType === 'ordering') {
        base.items = ['Step 1', 'Step 2', 'Step 3'];
        base.correct_answer = ['Step 1', 'Step 2', 'Step 3'];
      } else if (qType === 'essay') {
        base.correct_answer = 'Instructor grading rubric...';
      }

      return base;
    }

    function setQuestions(newQuestions) {
      questions = Array.isArray(newQuestions)
        ? JSON.parse(JSON.stringify(newQuestions)).map(function(q, idx) {
            q.question_id = q.question_id || ('Q' + String(idx + 1).padStart(3, '0'));
            q.order = idx + 1;
            q.media = q.media || { image: null, audio: null, video: null };
            return q;
          })
        : [];
      render();
      notifyTotals();
    }

    function getQuestions() {
      return questions.map(function(q, idx) {
        const copy = JSON.parse(JSON.stringify(q));
        copy.order = idx + 1;
        // Synchronize matching & ordering correct_answer
        if (copy.type === 'matching' && Array.isArray(copy.pairs)) {
          const map = {};
          copy.pairs.forEach(function(p, i) {
            const pid = p.pair_id || ('P' + (i + 1));
            p.pair_id = pid;
            map[pid] = p.right;
          });
          copy.correct_answer = map;
        } else if (copy.type === 'ordering' && Array.isArray(copy.items)) {
          copy.correct_answer = copy.items.slice();
        }
        return copy;
      });
    }

    function getTotalPoints() {
      return questions.reduce(function(sum, q) { return sum + Number(q.points || 0); }, 0);
    }

    function notifyTotals() {
      if (typeof opts.onChange === 'function') {
        opts.onChange(getQuestions(), getTotalPoints());
      }
    }

    function addQuestion(type) {
      const q = getDefaultQuestion(questions.length, type || 'multiple_choice_single');
      questions.push(q);
      render();
      notifyTotals();
    }

    function duplicateQuestion(index) {
      const orig = questions[index];
      if (!orig) return;
      const copy = JSON.parse(JSON.stringify(orig));
      copy.question_id = 'Q' + String(questions.length + 1).padStart(3, '0') + '_' + Math.random().toString(36).substring(2, 5).toUpperCase();
      copy.text = (copy.text || '') + ' (Copy)';
      questions.splice(index + 1, 0, copy);
      render();
      notifyTotals();
      showToast('Question duplicated.', 'info');
    }

    function removeQuestion(index) {
      questions.splice(index, 1);
      render();
      notifyTotals();
    }

    function moveQuestion(fromIdx, toIdx) {
      if (toIdx < 0 || toIdx >= questions.length || fromIdx === toIdx) return;
      const item = questions.splice(fromIdx, 1)[0];
      questions.splice(toIdx, 0, item);
      render();
      notifyTotals();
    }

    function renderAnswerBuilderHtml(q, qIdx) {
      const type = q.type;
      if (type === 'multiple_choice_single') {
        const optsList = Array.isArray(q.options) ? q.options : [];
        return `
          <div class="mt-3">
            <label class="form-label">Answer Choices (Select the radio button for the single correct answer)</label>
            ${optsList.map(function(opt, oIdx) {
              const isChecked = String(q.correct_answer) === String(opt.option_id);
              return `
                <div class="question-option-row">
                  <input type="radio" name="correct_single_${qIdx}" value="${escapeHtml(opt.option_id)}" ${isChecked ? 'checked' : ''} data-action="set-single-correct" data-qidx="${qIdx}" data-optid="${escapeHtml(opt.option_id)}" title="Mark as Correct Answer">
                  <span class="badge badge-secondary" style="min-width:30px;justify-content:center;">${escapeHtml(opt.option_id)}</span>
                  <input type="text" class="form-control" value="${escapeHtml(opt.text)}" placeholder="Option text..." data-action="edit-option-text" data-qidx="${qIdx}" data-oidx="${oIdx}">
                  <button type="button" class="btn btn-icon btn-outline-danger btn-sm" data-action="remove-option" data-qidx="${qIdx}" data-oidx="${oIdx}" title="Remove option"><i class="fa-solid fa-xmark"></i></button>
                </div>
              `;
            }).join('')}
            <button type="button" class="btn btn-secondary btn-sm mt-1" data-action="add-option" data-qidx="${qIdx}">
              <i class="fa-solid fa-plus"></i> Add Option
            </button>
          </div>
        `;
      }

      if (type === 'multiple_choice_multiple') {
        const optsList = Array.isArray(q.options) ? q.options : [];
        const correctArr = Array.isArray(q.correct_answer) ? q.correct_answer.map(String) : String(q.correct_answer || '').split(',').filter(Boolean);
        return `
          <div class="mt-3">
            <label class="form-label">Answer Choices (Check ALL correct answers)</label>
            ${optsList.map(function(opt, oIdx) {
              const isChecked = correctArr.indexOf(String(opt.option_id)) !== -1;
              return `
                <div class="question-option-row">
                  <input type="checkbox" value="${escapeHtml(opt.option_id)}" ${isChecked ? 'checked' : ''} data-action="toggle-multi-correct" data-qidx="${qIdx}" data-optid="${escapeHtml(opt.option_id)}">
                  <span class="badge badge-secondary" style="min-width:30px;justify-content:center;">${escapeHtml(opt.option_id)}</span>
                  <input type="text" class="form-control" value="${escapeHtml(opt.text)}" placeholder="Option text..." data-action="edit-option-text" data-qidx="${qIdx}" data-oidx="${oIdx}">
                  <button type="button" class="btn btn-icon btn-outline-danger btn-sm" data-action="remove-option" data-qidx="${qIdx}" data-oidx="${oIdx}"><i class="fa-solid fa-xmark"></i></button>
                </div>
              `;
            }).join('')}
            <button type="button" class="btn btn-secondary btn-sm mt-1" data-action="add-option" data-qidx="${qIdx}">
              <i class="fa-solid fa-plus"></i> Add Option
            </button>
          </div>
        `;
      }

      if (type === 'true_false') {
        const isTrue = String(q.correct_answer).toUpperCase() !== 'FALSE';
        return `
          <div class="mt-3">
            <label class="form-label">Correct Answer</label>
            <div class="d-flex gap-4">
              <label class="checkbox-chip ${isTrue ? 'selected' : ''}">
                <input type="radio" name="tf_${qIdx}" value="TRUE" ${isTrue ? 'checked' : ''} data-action="set-single-correct" data-qidx="${qIdx}" data-optid="TRUE"> True
              </label>
              <label class="checkbox-chip ${!isTrue ? 'selected' : ''}">
                <input type="radio" name="tf_${qIdx}" value="FALSE" ${!isTrue ? 'checked' : ''} data-action="set-single-correct" data-qidx="${qIdx}" data-optid="FALSE"> False
              </label>
            </div>
          </div>
        `;
      }

      if (type === 'short_answer') {
        const val = Array.isArray(q.correct_answer) ? q.correct_answer.join(' | ') : (q.correct_answer || '');
        return `
          <div class="mt-3">
            <label class="form-label">Accepted Correct Answer(s) <span class="text-muted text-xs">(Separate multiple acceptable variations with <code>|</code>)</span></label>
            <input type="text" class="form-control" value="${escapeHtml(val)}" placeholder="e.g. written | had written" data-action="edit-correct-text" data-qidx="${qIdx}">
          </div>
        `;
      }

      if (type === 'fill_in_the_blanks') {
        const blanks = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer || ''];
        return `
          <div class="mt-3">
            <label class="form-label">Blank Answers (In order of appearance in the question text)</label>
            ${blanks.map(function(bVal, bIdx) {
              return `
                <div class="question-option-row">
                  <span class="badge badge-primary">Blank #${bIdx + 1}</span>
                  <input type="text" class="form-control" value="${escapeHtml(bVal)}" placeholder="Correct word/phrase for Blank #${bIdx + 1}" data-action="edit-blank" data-qidx="${qIdx}" data-bidx="${bIdx}">
                  <button type="button" class="btn btn-icon btn-outline-danger btn-sm" data-action="remove-blank" data-qidx="${qIdx}" data-bidx="${bIdx}"><i class="fa-solid fa-xmark"></i></button>
                </div>
              `;
            }).join('')}
            <button type="button" class="btn btn-secondary btn-sm mt-1" data-action="add-blank" data-qidx="${qIdx}">
              <i class="fa-solid fa-plus"></i> Add Blank Slot
            </button>
          </div>
        `;
      }

      if (type === 'matching') {
        const pairs = Array.isArray(q.pairs) ? q.pairs : [];
        return `
          <div class="mt-3">
            <label class="form-label">Matching Pairs (Prompt on Left &rarr; Correct Match on Right)</label>
            ${pairs.map(function(p, pIdx) {
              return `
                <div class="question-option-row">
                  <span class="badge badge-secondary">#${pIdx + 1}</span>
                  <input type="text" class="form-control" value="${escapeHtml(p.left || '')}" placeholder="Left item / prompt" data-action="edit-pair-left" data-qidx="${qIdx}" data-pidx="${pIdx}">
                  <i class="fa-solid fa-arrows-left-right text-muted"></i>
                  <input type="text" class="form-control" value="${escapeHtml(p.right || '')}" placeholder="Right item / match" data-action="edit-pair-right" data-qidx="${qIdx}" data-pidx="${pIdx}">
                  <button type="button" class="btn btn-icon btn-outline-danger btn-sm" data-action="remove-pair" data-qidx="${qIdx}" data-pidx="${pIdx}"><i class="fa-solid fa-xmark"></i></button>
                </div>
              `;
            }).join('')}
            <button type="button" class="btn btn-secondary btn-sm mt-1" data-action="add-pair" data-qidx="${qIdx}">
              <i class="fa-solid fa-plus"></i> Add Matching Pair
            </button>
          </div>
        `;
      }

      if (type === 'ordering') {
        const items = Array.isArray(q.items) ? q.items : [];
        return `
          <div class="mt-3">
            <label class="form-label">Correct Sequence Order (From 1st to Last — shuffled automatically for students)</label>
            ${items.map(function(itemText, iIdx) {
              return `
                <div class="question-option-row">
                  <span class="badge badge-primary">Step ${iIdx + 1}</span>
                  <input type="text" class="form-control" value="${escapeHtml(itemText)}" placeholder="Step ${iIdx + 1} text..." data-action="edit-order-item" data-qidx="${qIdx}" data-iidx="${iIdx}">
                  <button type="button" class="btn btn-icon btn-outline-danger btn-sm" data-action="remove-order-item" data-qidx="${qIdx}" data-iidx="${iIdx}"><i class="fa-solid fa-xmark"></i></button>
                </div>
              `;
            }).join('')}
            <button type="button" class="btn btn-secondary btn-sm mt-1" data-action="add-order-item" data-qidx="${qIdx}">
              <i class="fa-solid fa-plus"></i> Add Sequence Item
            </button>
          </div>
        `;
      }

      if (type === 'essay') {
        return `
          <div class="mt-3">
            <label class="form-label">Model Answer / Grading Rubric (For Teacher Reference)</label>
            <textarea class="form-control" rows="2" placeholder="Describe the grading criteria or model response..." data-action="edit-correct-text" data-qidx="${qIdx}">${escapeHtml(q.correct_answer || '')}</textarea>
          </div>
        `;
      }

      return '';
    }

    function renderMediaSlotHtml(q, qIdx, mediaKey, label, icon) {
      const m = q.media && q.media[mediaKey];
      const hasMedia = Boolean(m && (m.url || m.drive_file_id || typeof m === 'string'));
      const fileName = hasMedia ? (typeof m === 'object' ? (m.file_name || m.drive_file_id || 'Attached') : m) : 'None';

      return `
        <div class="media-slot ${hasMedia ? 'has-media' : ''}">
          <div class="d-flex align-center justify-between mb-1">
            <span class="font-semibold"><i class="fa-solid ${icon}"></i> ${label}</span>
            ${hasMedia ? `<button type="button" class="btn btn-ghost btn-sm text-danger" style="padding:2px 6px;" data-action="remove-media" data-qidx="${qIdx}" data-mkey="${mediaKey}" title="Remove ${label}"><i class="fa-solid fa-trash-can"></i></button>` : ''}
          </div>
          <div class="text-xs text-muted mb-2" style="word-break:break-all;">${escapeHtml(fileName)}</div>
          <label class="btn btn-secondary btn-sm w-100" style="cursor:pointer;">
            <i class="fa-solid fa-cloud-arrow-up"></i> ${hasMedia ? 'Replace' : 'Upload'}
            <input type="file" class="d-none" accept="${mediaKey}/*" data-action="upload-media" data-qidx="${qIdx}" data-mkey="${mediaKey}">
          </label>
        </div>
      `;
    }

    function render() {
      if (!containerEl) return;

      if (questions.length === 0) {
        containerEl.innerHTML = `
          <div class="empty-state" style="border:2px dashed var(--border-strong);border-radius:var(--radius-lg);padding:2.5rem;">
            <div class="empty-state-icon"><i class="fa-solid fa-list-check"></i></div>
            <h3>No Questions Added Yet</h3>
            <p>Click "Add Question" below or import a JSON template file to start building your assessment.</p>
          </div>
        `;
        return;
      }

      containerEl.innerHTML = `<div class="question-editor-list">` + questions.map(function(q, qIdx) {
        return `
          <div class="question-builder-card" draggable="true" data-qcard-idx="${qIdx}">
            <div class="question-builder-header">
              <div class="d-flex align-center gap-2">
                <span class="drag-handle" title="Drag to reorder question"><i class="fa-solid fa-grip-vertical"></i></span>
                <span class="badge badge-primary">Q${qIdx + 1} (${escapeHtml(q.question_id)})</span>
                <select class="form-select" style="width:auto;padding:0.35rem 0.65rem;font-size:0.85rem;" data-action="change-qtype" data-qidx="${qIdx}">
                  ${Object.keys(QUESTION_TYPE_LABELS).map(function(typeKey) {
                    return `<option value="${typeKey}" ${q.type === typeKey ? 'selected' : ''}>${QUESTION_TYPE_LABELS[typeKey]}</option>`;
                  }).join('')}
                </select>
              </div>
              <div class="d-flex align-center gap-2">
                <div class="d-flex align-center gap-1">
                  <label class="text-xs font-semibold text-muted">Points:</label>
                  <input type="number" min="1" max="500" class="form-control" style="width:76px;padding:0.35rem 0.5rem;" value="${Number(q.points || 10)}" data-action="edit-qpoints" data-qidx="${qIdx}">
                </div>
                <select class="form-select" style="width:auto;padding:0.35rem 0.5rem;font-size:0.8rem;" data-action="edit-qdifficulty" data-qidx="${qIdx}">
                  <option value="easy" ${q.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                  <option value="medium" ${(!q.difficulty || q.difficulty === 'medium') ? 'selected' : ''}>Medium</option>
                  <option value="hard" ${q.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                </select>
                <button type="button" class="btn btn-icon btn-secondary btn-sm" data-action="move-up" data-qidx="${qIdx}" ${qIdx === 0 ? 'disabled' : ''} title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" class="btn btn-icon btn-secondary btn-sm" data-action="move-down" data-qidx="${qIdx}" ${qIdx === questions.length - 1 ? 'disabled' : ''} title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" class="btn btn-icon btn-secondary btn-sm" data-action="preview-question" data-qidx="${qIdx}" title="Preview Question"><i class="fa-solid fa-eye"></i></button>
                <button type="button" class="btn btn-icon btn-secondary btn-sm" data-action="duplicate-question" data-qidx="${qIdx}" title="Duplicate Question"><i class="fa-solid fa-copy"></i></button>
                <button type="button" class="btn btn-icon btn-outline-danger btn-sm" data-action="delete-question" data-qidx="${qIdx}" title="Delete Question"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            </div>

            <div class="form-group mb-2">
              <label class="form-label">Question Text <span class="required">*</span></label>
              <textarea class="form-control" rows="2" placeholder="Enter question prompt..." data-action="edit-qtext" data-qidx="${qIdx}">${escapeHtml(q.text || '')}</textarea>
            </div>

            ${renderAnswerBuilderHtml(q, qIdx)}

            <div class="form-group mt-3 mb-2">
              <label class="form-label text-xs text-muted">Explanation / Feedback (Shown after grading)</label>
              <input type="text" class="form-control" value="${escapeHtml(q.explanation || '')}" placeholder="Optional explanation for the correct answer..." data-action="edit-qexplanation" data-qidx="${qIdx}">
            </div>

            <div class="media-upload-grid">
              ${renderMediaSlotHtml(q, qIdx, 'image', 'Image', 'fa-image')}
              ${renderMediaSlotHtml(q, qIdx, 'audio', 'Audio', 'fa-volume-high')}
              ${renderMediaSlotHtml(q, qIdx, 'video', 'Short Video', 'fa-video')}
            </div>
          </div>
        `;
      }).join('') + `</div>`;

      bindEvents();
    }

    function previewQuestionModal(q) {
      let modal = document.getElementById('question-preview-modal');
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);

      modal = document.createElement('div');
      modal.id = 'question-preview-modal';
      modal.className = 'modal-backdrop active';
      const media = q.media || {};

      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fa-solid fa-eye text-primary"></i> Question Student Preview (${escapeHtml(q.question_id)})</h3>
            <button type="button" class="modal-close" data-close-preview>&times;</button>
          </div>
          <div class="modal-body">
            <div class="d-flex justify-between align-center mb-3">
              <span class="badge badge-primary">${escapeHtml(QUESTION_TYPE_LABELS[q.type] || q.type)}</span>
              <span class="badge badge-secondary">${Number(q.points || 0)} Points &bull; ${escapeHtml((q.difficulty || 'medium').toUpperCase())}</span>
            </div>
            <div class="question-prompt-text">${escapeHtml(q.text || '(No question text entered yet)')}</div>
            <div class="question-media-showcase">
              ${media.image && media.image.url ? `<img src="${escapeHtml(media.image.url)}" alt="Question Image">` : ''}
              ${media.audio && media.audio.url ? `<audio controls src="${escapeHtml(media.audio.url)}" class="w-100"></audio>` : ''}
              ${media.video && media.video.url ? `<video controls src="${escapeHtml(media.video.url)}" style="max-height:300px;width:100%;border-radius:8px;"></video>` : ''}
            </div>
            <div style="padding:1rem;background:var(--bg-muted);border-radius:10px;font-size:0.88rem;">
              <strong>Configured Answer Key:</strong> <code>${escapeHtml(JSON.stringify(q.correct_answer))}</code>
              ${q.explanation ? `<div class="mt-2"><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</div>` : ''}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-close-preview>Close Preview</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelectorAll('[data-close-preview]').forEach(function(b) {
        b.addEventListener('click', function() {
          modal.classList.remove('active');
        });
      });
    }

    function bindEvents() {
      // Drag and drop reordering on cards
      containerEl.querySelectorAll('.question-builder-card').forEach(function(card) {
        const idx = Number(card.getAttribute('data-qcard-idx'));
        card.addEventListener('dragstart', function(e) {
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            e.preventDefault();
            return;
          }
          dragSrcIndex = idx;
          card.classList.add('dragging');
        });
        card.addEventListener('dragend', function() {
          card.classList.remove('dragging');
        });
        card.addEventListener('dragover', function(e) {
          e.preventDefault();
        });
        card.addEventListener('drop', function(e) {
          e.preventDefault();
          if (dragSrcIndex !== null && dragSrcIndex !== idx) {
            moveQuestion(dragSrcIndex, idx);
            dragSrcIndex = null;
          }
        });
      });

      // Text & field inputs without full re-render on each keystroke
      containerEl.querySelectorAll('[data-action="edit-qtext"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const i = Number(el.getAttribute('data-qidx'));
          questions[i].text = el.value;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="edit-qpoints"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const i = Number(el.getAttribute('data-qidx'));
          questions[i].points = Math.max(1, Number(el.value) || 1);
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="edit-qdifficulty"]').forEach(function(el) {
        el.addEventListener('change', function() {
          const i = Number(el.getAttribute('data-qidx'));
          questions[i].difficulty = el.value;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="edit-qexplanation"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const i = Number(el.getAttribute('data-qidx'));
          questions[i].explanation = el.value;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="change-qtype"]').forEach(function(el) {
        el.addEventListener('change', function() {
          const i = Number(el.getAttribute('data-qidx'));
          const newType = el.value;
          const template = getDefaultQuestion(i, newType);
          questions[i].type = newType;
          questions[i].options = template.options;
          questions[i].pairs = template.pairs;
          questions[i].items = template.items;
          questions[i].correct_answer = template.correct_answer;
          render();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="edit-option-text"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const qIdx = Number(el.getAttribute('data-qidx'));
          const oIdx = Number(el.getAttribute('data-oidx'));
          questions[qIdx].options[oIdx].text = el.value;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="set-single-correct"]').forEach(function(el) {
        el.addEventListener('change', function() {
          const qIdx = Number(el.getAttribute('data-qidx'));
          questions[qIdx].correct_answer = el.getAttribute('data-optid');
          render();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="toggle-multi-correct"]').forEach(function(el) {
        el.addEventListener('change', function() {
          const qIdx = Number(el.getAttribute('data-qidx'));
          const optId = el.getAttribute('data-optid');
          let arr = Array.isArray(questions[qIdx].correct_answer) ? questions[qIdx].correct_answer.slice() : [];
          if (el.checked && arr.indexOf(optId) === -1) arr.push(optId);
          if (!el.checked) arr = arr.filter(function(x) { return x !== optId; });
          questions[qIdx].correct_answer = arr;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="add-option"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          const optsList = questions[qIdx].options || [];
          const nextLetter = String.fromCharCode(65 + optsList.length);
          optsList.push({ option_id: nextLetter, text: 'Option ' + nextLetter });
          questions[qIdx].options = optsList;
          render();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="remove-option"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          const oIdx = Number(btn.getAttribute('data-oidx'));
          if (questions[qIdx].options.length <= 2) {
            showToast('Multiple choice questions require at least 2 options.', 'warning');
            return;
          }
          questions[qIdx].options.splice(oIdx, 1);
          render();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="edit-correct-text"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const qIdx = Number(el.getAttribute('data-qidx'));
          questions[qIdx].correct_answer = el.value;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="edit-blank"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const qIdx = Number(el.getAttribute('data-qidx'));
          const bIdx = Number(el.getAttribute('data-bidx'));
          if (!Array.isArray(questions[qIdx].correct_answer)) {
            questions[qIdx].correct_answer = [questions[qIdx].correct_answer || ''];
          }
          questions[qIdx].correct_answer[bIdx] = el.value;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="add-blank"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          if (!Array.isArray(questions[qIdx].correct_answer)) {
            questions[qIdx].correct_answer = [questions[qIdx].correct_answer || ''];
          }
          questions[qIdx].correct_answer.push('');
          render();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="remove-blank"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          const bIdx = Number(btn.getAttribute('data-bidx'));
          if (Array.isArray(questions[qIdx].correct_answer) && questions[qIdx].correct_answer.length > 1) {
            questions[qIdx].correct_answer.splice(bIdx, 1);
            render();
            notifyTotals();
          }
        });
      });

      containerEl.querySelectorAll('[data-action="edit-pair-left"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const qIdx = Number(el.getAttribute('data-qidx'));
          const pIdx = Number(el.getAttribute('data-pidx'));
          questions[qIdx].pairs[pIdx].left = el.value;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="edit-pair-right"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const qIdx = Number(el.getAttribute('data-qidx'));
          const pIdx = Number(el.getAttribute('data-pidx'));
          questions[qIdx].pairs[pIdx].right = el.value;
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="add-pair"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          questions[qIdx].pairs = questions[qIdx].pairs || [];
          const nextNum = questions[qIdx].pairs.length + 1;
          questions[qIdx].pairs.push({ pair_id: 'P' + nextNum, left: '', right: '' });
          render();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="remove-pair"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          const pIdx = Number(btn.getAttribute('data-pidx'));
          if (questions[qIdx].pairs.length <= 2) {
            showToast('Matching questions require at least 2 pairs.', 'warning');
            return;
          }
          questions[qIdx].pairs.splice(pIdx, 1);
          render();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="edit-order-item"]').forEach(function(el) {
        el.addEventListener('input', function() {
          const qIdx = Number(el.getAttribute('data-qidx'));
          const iIdx = Number(el.getAttribute('data-iidx'));
          questions[qIdx].items[iIdx] = el.value;
          questions[qIdx].correct_answer = questions[qIdx].items.slice();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="add-order-item"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          questions[qIdx].items = questions[qIdx].items || [];
          questions[qIdx].items.push('Step ' + (questions[qIdx].items.length + 1));
          render();
          notifyTotals();
        });
      });

      containerEl.querySelectorAll('[data-action="remove-order-item"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          const iIdx = Number(btn.getAttribute('data-iidx'));
          if (questions[qIdx].items.length <= 2) {
            showToast('Ordering questions require at least 2 items.', 'warning');
            return;
          }
          questions[qIdx].items.splice(iIdx, 1);
          render();
          notifyTotals();
        });
      });

      // Action buttons (move, duplicate, delete, preview)
      containerEl.querySelectorAll('[data-action="move-up"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const i = Number(btn.getAttribute('data-qidx'));
          moveQuestion(i, i - 1);
        });
      });

      containerEl.querySelectorAll('[data-action="move-down"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const i = Number(btn.getAttribute('data-qidx'));
          moveQuestion(i, i + 1);
        });
      });

      containerEl.querySelectorAll('[data-action="duplicate-question"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          duplicateQuestion(Number(btn.getAttribute('data-qidx')));
        });
      });

      containerEl.querySelectorAll('[data-action="delete-question"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          const i = Number(btn.getAttribute('data-qidx'));
          const ok = await confirmDialog({
            title: 'Delete Question',
            message: 'Are you sure you want to remove Question #' + (i + 1) + '?'
          });
          if (ok) removeQuestion(i);
        });
      });

      containerEl.querySelectorAll('[data-action="preview-question"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const i = Number(btn.getAttribute('data-qidx'));
          previewQuestionModal(questions[i]);
        });
      });

      // Media upload & deletion
      containerEl.querySelectorAll('[data-action="upload-media"]').forEach(function(input) {
        input.addEventListener('change', async function() {
          const file = input.files && input.files[0];
          if (!file) return;
          const qIdx = Number(input.getAttribute('data-qidx'));
          const mKey = input.getAttribute('data-mkey');
          const check = window.Validation.validateMediaFile(file, mKey);
          if (!check.valid) {
            showToast(check.error, 'error');
            input.value = '';
            return;
          }
          try {
            showToast('Uploading ' + mKey + ' to Google Drive...', 'info', 2500);
            const uploaded = await window.API.uploadMediaFile(file, mKey, questions[qIdx].question_id);
            questions[qIdx].media = questions[qIdx].media || { image: null, audio: null, video: null };
            questions[qIdx].media[mKey] = uploaded;
            showToast(mKey.toUpperCase() + ' uploaded and linked to ' + questions[qIdx].question_id, 'success');
            render();
            notifyTotals();
          } catch (err) {
            showToast('Media upload failed: ' + err.message, 'error');
          }
        });
      });

      containerEl.querySelectorAll('[data-action="remove-media"]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          const qIdx = Number(btn.getAttribute('data-qidx'));
          const mKey = btn.getAttribute('data-mkey');
          const existingMedia = questions[qIdx].media && questions[qIdx].media[mKey];
          if (existingMedia && existingMedia.drive_file_id) {
            try {
              await window.API.request('deleteMedia', { driveFileId: existingMedia.drive_file_id });
            } catch (e) {}
          }
          questions[qIdx].media[mKey] = null;
          render();
          notifyTotals();
          showToast('Media attachment removed.', 'info');
        });
      });
    }

    render();

    return {
      setQuestions: setQuestions,
      getQuestions: getQuestions,
      getTotalPoints: getTotalPoints,
      addQuestion: addQuestion
    };
  }

  /**
   * Initializes mobile sidebar toggle and language switcher on page load.
   */
  document.addEventListener('DOMContentLoaded', function() {
    applyLanguage(getLanguage());

    const toggleBtn = document.querySelector('.sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('open');
      });
    }

    document.querySelectorAll('[data-action="toggle-lang"]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleLanguage();
      });
    });
  });

  window.Helpers = {
    escapeHtml: escapeHtml,
    showToast: showToast,
    confirmDialog: confirmDialog,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatTimer: formatTimer,
    getInitials: getInitials,
    getPerformanceColor: getPerformanceColor,
    renderStatusBadge: renderStatusBadge,
    downloadJsonFile: downloadJsonFile,
    downloadCsvFile: downloadCsvFile,
    getQueryParam: getQueryParam,
    getLanguage: getLanguage,
    applyLanguage: applyLanguage,
    toggleLanguage: toggleLanguage,
    renderPagination: renderPagination,
    createQuestionEditor: createQuestionEditor
  };
})(window);
