/**
 * ============================================================================
 * Lingo Examination & Student Management Platform
 * File: assets/js/reports.js
 * Purpose: Student Performance Profile Modal (Section 13.2), Printable 12-Section
 *          Academic Performance Report Renderer (Section 14), Print/PDF & CSV Export.
 * ============================================================================
 */

(function(window) {
  'use strict';

  const esc = window.Helpers.escapeHtml;
  const fmtDate = window.Helpers.formatDate;
  const fmtDateTime = window.Helpers.formatDateTime;

  /**
   * Renders the complete 12-Section Printable Student Performance Report inside `containerEl`.
   *
   * @param {HTMLElement} containerEl
   * @param {Object} rpt - Report object returned by `API.generateStudentReport`
   */
  function renderPrintableReport(containerEl, rpt) {
    if (!containerEl || !rpt) return;

    const stu = rpt.personalInfo || {};
    const ov = rpt.overallPerformance || {};
    const evalBox = rpt.finalEvaluation || {};
    const levels = rpt.levelByLevelAnalysis || [];
    const exams = rpt.examResults || [];
    const tasks = rpt.taskResults || [];
    const lessonStats = rpt.lessonCompletionStats || {};

    containerEl.innerHTML = `
      <div class="report-sheet report-printable-area" id="printable-report-sheet">
        <!-- Report Header -->
        <div class="report-header-banner">
          <div class="d-flex align-center gap-3">
            <div class="sidebar-logo" style="width:54px;height:54px;font-size:1.5rem;">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h1 style="font-size:1.45rem;color:var(--text-main);">${esc(rpt.reportHeaderTitle || 'Official Student Performance Report')}</h1>
              <p class="text-muted text-sm">${esc(rpt.platformName || 'Lingo Examination & Learning Platform')}</p>
            </div>
          </div>
          <div style="text-align:end;font-size:0.84rem;color:var(--text-secondary);">
            <div><strong>Report ID:</strong> <code>${esc(rpt.reportId || '')}</code></div>
            <div><strong>Date of Report:</strong> ${fmtDateTime(rpt.generatedAt)}</div>
          </div>
        </div>

        <!-- 1. Student Personal Information & 2. Assigned Levels -->
        <div class="report-section">
          <h3 class="report-section-title"><i class="fa-solid fa-id-card"></i> 1 &amp; 2. Student Personal Information &amp; Assigned Levels</h3>
          <div class="form-row-3" style="background:var(--bg-body);padding:1.15rem;border-radius:10px;border:1px solid var(--border-color);">
            <div>
              <span class="text-xs text-muted d-block">Full Name</span>
              <strong style="font-size:1rem;">${esc(stu.Full_Name)}</strong>
            </div>
            <div>
              <span class="text-xs text-muted d-block">Student Code</span>
              <strong style="font-family:monospace;font-size:0.95rem;">${esc(stu.Student_Code)}</strong>
            </div>
            <div>
              <span class="text-xs text-muted d-block">Phone Number</span>
              <strong>${esc(stu.Phone || 'Not Provided')}</strong>
            </div>
            <div>
              <span class="text-xs text-muted d-block">Account Status</span>
              ${window.Helpers.renderStatusBadge(stu.Account_Status)}
            </div>
            <div>
              <span class="text-xs text-muted d-block">Registration Date</span>
              <strong>${fmtDate(stu.Created_At)}</strong>
            </div>
            <div>
              <span class="text-xs text-muted d-block">Last Activity</span>
              <strong>${fmtDateTime(stu.Last_Activity || stu.Last_Login)}</strong>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-xs text-muted font-semibold uppercase">Assigned Educational Levels:</span>
            <div class="d-flex flex-wrap gap-2 mt-1">
              ${levels.length > 0 ? levels.map(function(l) {
                return `<span class="badge badge-primary" style="font-size:0.82rem;padding:0.35rem 0.85rem;">
                  <i class="fa-solid fa-layer-group"></i> ${esc(l.levelName)} (${l.completionRate}% Completed)
                </span>`;
              }).join('') : '<span class="text-muted text-sm">No levels currently assigned.</span>'}
            </div>
          </div>
        </div>

        <!-- 3. Overall Academic Performance & 4. Performance Summary -->
        <div class="report-section">
          <h3 class="report-section-title"><i class="fa-solid fa-chart-pie"></i> 3 &amp; 4. Overall Academic Performance &amp; Summary</h3>
          <div class="kpi-grid" style="margin-bottom:1rem;">
            <div class="kpi-card">
              <div class="kpi-info">
                <span class="kpi-label">Overall Average</span>
                <h3 class="kpi-value" style="color:${window.Helpers.getPerformanceColor(ov.overallAveragePercentage)};">${ov.overallAveragePercentage}%</h3>
                <p class="kpi-sub">Normalized Academic Score</p>
              </div>
              <div class="kpi-icon indigo"><i class="fa-solid fa-award"></i></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-info">
                <span class="kpi-label">Exam Average</span>
                <h3 class="kpi-value">${ov.hasExamScores ? ov.averageExamScore + '%' : 'N/A'}</h3>
                <p class="kpi-sub">${ov.passedExams} Passed / ${ov.failedExams} Failed</p>
              </div>
              <div class="kpi-icon emerald"><i class="fa-solid fa-file-signature"></i></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-info">
                <span class="kpi-label">Task Average</span>
                <h3 class="kpi-value">${ov.hasTaskScores ? ov.averageTaskScore + '%' : 'N/A'}</h3>
                <p class="kpi-sub">${ov.completedTasks} Submitted / ${ov.pendingTasks} Pending</p>
              </div>
              <div class="kpi-icon sky"><i class="fa-solid fa-list-check"></i></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-info">
                <span class="kpi-label">Curriculum Progress</span>
                <h3 class="kpi-value">${ov.levelCompletionPercentage}%</h3>
                <p class="kpi-sub">${ov.completedLessons}/${ov.availableLessons} Lessons Completed</p>
              </div>
              <div class="kpi-icon amber"><i class="fa-solid fa-book-open-reader"></i></div>
            </div>
          </div>
        </div>

        <!-- 5. Level-by-Level Analysis & 8. Lesson Completion Statistics -->
        <div class="report-section">
          <h3 class="report-section-title"><i class="fa-solid fa-layer-group"></i> 5 &amp; 8. Level-by-Level Analysis &amp; Lesson Completion Statistics</h3>
          ${levels.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Level Name</th>
                    <th>Lessons Progress</th>
                    <th>Exams Completed</th>
                    <th>Tasks Completed</th>
                    <th>Exam Avg</th>
                    <th>Task Avg</th>
                    <th>Best / Weakest</th>
                    <th>Completion Rate</th>
                    <th>Overall Level Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${levels.map(function(l) {
                    return `
                      <tr>
                        <td><strong>${esc(l.levelName)}</strong></td>
                        <td>${l.lessonsCompleted} / ${l.lessonsTotal}</td>
                        <td>${l.examsCompleted} / ${l.examsTotal} (${l.attemptsCount} attempts)</td>
                        <td>${l.tasksCompleted} / ${l.tasksTotal}</td>
                        <td>${l.hasExamScores ? l.examAverage + '%' : '—'}</td>
                        <td>${l.hasTaskScores ? l.taskAverage + '%' : '—'}</td>
                        <td>${(l.hasExamScores || l.hasTaskScores) ? (l.bestScore + '% / ' + l.weakestPerformance + '%') : '—'}</td>
                        <td>
                          <div class="d-flex align-center gap-2">
                            <div class="progress-bar-wrap" style="width:70px;"><div class="progress-bar-fill" style="width:${l.completionRate}%;"></div></div>
                            <span class="text-xs font-bold">${l.completionRate}%</span>
                          </div>
                        </td>
                        <td><span class="badge" style="background:${window.Helpers.getPerformanceColor(l.overallLevelPerformance)}20;color:${window.Helpers.getPerformanceColor(l.overallLevelPerformance)};">${l.overallLevelPerformance}%</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p class="text-muted">No level records available.</p>'}
        </div>

        <!-- 6. Detailed Exam Results -->
        <div class="report-section">
          <h3 class="report-section-title"><i class="fa-solid fa-file-circle-check"></i> 6. Detailed Exam Results</h3>
          ${exams.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Level</th>
                    <th>Attempt #</th>
                    <th>Submission Date</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${exams.map(function(ex) {
                    return `
                      <tr>
                        <td><strong>${esc(ex.Exam_Title)}</strong></td>
                        <td>${esc(ex.Level_Name || ex.Level_ID)}</td>
                        <td>#${ex.Attempt_Number}</td>
                        <td>${fmtDateTime(ex.Submit_Time || ex.Start_Time)}</td>
                        <td>${ex.Score} / ${ex.Total_Marks}</td>
                        <td><strong>${ex.Percentage}%</strong></td>
                        <td>${window.Helpers.renderStatusBadge(ex.Result_Status)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p class="text-muted">No submitted exam attempts recorded yet.</p>'}
        </div>

        <!-- 7. Detailed Task Results -->
        <div class="report-section">
          <h3 class="report-section-title"><i class="fa-solid fa-clipboard-check"></i> 7. Detailed Task Results</h3>
          ${tasks.length > 0 ? `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Level / Lesson</th>
                    <th>Submission Date</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Grading Status</th>
                    <th>Teacher Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  ${tasks.map(function(tk) {
                    return `
                      <tr>
                        <td><strong>${esc(tk.Task_Title)}</strong></td>
                        <td>${esc(tk.Level_Name || tk.Level_ID)}${tk.Lesson_Title ? ' &bull; ' + esc(tk.Lesson_Title) : ''}</td>
                        <td>${fmtDateTime(tk.Submission_Date)}</td>
                        <td>${tk.Score} / ${tk.Total_Marks}</td>
                        <td><strong>${tk.Percentage}%</strong></td>
                        <td>${window.Helpers.renderStatusBadge(tk.Grading_Status)}</td>
                        <td class="text-sm text-secondary">${esc(tk.Teacher_Feedback || '—')}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p class="text-muted">No task submissions recorded yet.</p>'}
        </div>

        <!-- 9. Performance Trends Chart -->
        <div class="report-section">
          <h3 class="report-section-title"><i class="fa-solid fa-chart-line"></i> 9. Academic Performance Trends</h3>
          <div class="form-row">
            <div class="card" style="padding:1rem;">
              <h4 class="text-sm font-bold mb-2">Assessment Score Progression</h4>
              <div style="height:220px;"><canvas id="report-trend-chart-canvas"></canvas></div>
            </div>
            <div class="card" style="padding:1rem;">
              <h4 class="text-sm font-bold mb-2">Performance Comparison by Level</h4>
              <div style="height:220px;"><canvas id="report-level-chart-canvas"></canvas></div>
            </div>
          </div>
        </div>

        <!-- 10. Strengths & Weaknesses & 11. Areas Requiring Improvement -->
        <div class="report-section">
          <h3 class="report-section-title"><i class="fa-solid fa-magnifying-glass-chart"></i> 10 &amp; 11. Strengths, Weaknesses &amp; Areas Requiring Improvement</h3>
          <div class="form-row-3">
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:1rem;">
              <h4 style="color:#065f46;font-size:0.92rem;margin-bottom:0.6rem;"><i class="fa-solid fa-thumbs-up"></i> Key Strengths</h4>
              <ul style="padding-inline-start:1.2rem;font-size:0.86rem;color:#064e3b;">
                ${(rpt.strengths || []).map(function(s) { return `<li class="mb-1">${esc(s)}</li>`; }).join('')}
              </ul>
            </div>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:1rem;">
              <h4 style="color:#991b1b;font-size:0.92rem;margin-bottom:0.6rem;"><i class="fa-solid fa-triangle-exclamation"></i> Identified Weaknesses</h4>
              <ul style="padding-inline-start:1.2rem;font-size:0.86rem;color:#7f1d1d;">
                ${(rpt.weaknesses || []).map(function(w) { return `<li class="mb-1">${esc(w)}</li>`; }).join('')}
              </ul>
            </div>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:1rem;">
              <h4 style="color:#92400e;font-size:0.92rem;margin-bottom:0.6rem;"><i class="fa-solid fa-lightbulb"></i> Actionable Improvement Plan</h4>
              <ul style="padding-inline-start:1.2rem;font-size:0.86rem;color:#78350f;">
                ${(rpt.areasRequiringImprovement || []).map(function(a) { return `<li class="mb-1">${esc(a)}</li>`; }).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- 12. Final Performance Evaluation -->
        <div class="report-section" style="margin-bottom:0;">
          <h3 class="report-section-title"><i class="fa-solid fa-stamp"></i> 12. Final Performance Evaluation</h3>
          <div style="background:var(--bg-body);border-inline-start:5px solid ${evalBox.ratingColor || '#4f46e5'};border-radius:10px;padding:1.35rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;">
            <div style="flex:1;min-width:240px;">
              <div class="d-flex align-center gap-2 mb-1">
                <span class="badge" style="background:${evalBox.ratingColor || '#4f46e5'};color:#fff;font-size:0.85rem;">${esc(evalBox.gradeBand || 'N/A')}</span>
                <strong style="font-size:1.1rem;color:var(--text-main);">${esc(evalBox.ratingLabel || '')}</strong>
              </div>
              <p class="text-secondary text-sm">${esc(evalBox.recommendation || '')}</p>
            </div>
            <div style="text-align:center;padding:0.75rem 1.25rem;background:#fff;border-radius:10px;border:1px solid var(--border-color);">
              <span class="text-xs text-muted d-block">Final Score</span>
              <strong style="font-size:1.65rem;color:${evalBox.ratingColor || '#4f46e5'};">${evalBox.overallPercentage || 0}%</strong>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.Charts) {
      window.Charts.renderStudentTrendChart('report-trend-chart-canvas', rpt.trends);
      window.Charts.renderPerformanceByLevelChart('report-level-chart-canvas', levels);
    }
  }

  /**
   * Exports a student's complete exam and task results to a CSV file.
   */
  function exportStudentReportCsv(rpt) {
    if (!rpt || !rpt.personalInfo) return;
    const stu = rpt.personalInfo;
    const headers = [
      'Student Code', 'Full Name', 'Record Type', 'Assessment ID', 'Title',
      'Level', 'Attempt / Status', 'Date', 'Score', 'Total Marks', 'Percentage (%)', 'Result / Grading Status', 'Feedback'
    ];
    const rows = [];

    (rpt.examResults || []).forEach(function(ex) {
      rows.push([
        stu.Student_Code,
        stu.Full_Name,
        'EXAM',
        ex.Exam_ID,
        ex.Exam_Title,
        ex.Level_Name || ex.Level_ID,
        'Attempt #' + ex.Attempt_Number,
        ex.Submit_Time || ex.Start_Time,
        ex.Score,
        ex.Total_Marks,
        ex.Percentage,
        ex.Result_Status,
        ex.Teacher_Feedback || ''
      ]);
    });

    (rpt.taskResults || []).forEach(function(tk) {
      rows.push([
        stu.Student_Code,
        stu.Full_Name,
        'TASK',
        tk.Task_ID,
        tk.Task_Title,
        tk.Level_Name || tk.Level_ID,
        tk.Submission_Status,
        tk.Submission_Date,
        tk.Score,
        tk.Total_Marks,
        tk.Percentage,
        tk.Grading_Status,
        tk.Teacher_Feedback || ''
      ]);
    });

    const filename = 'Student_Report_' + (stu.Student_Code || stu.Student_ID) + '_' + new Date().toISOString().substring(0, 10) + '.csv';
    window.Helpers.downloadCsvFile(filename, headers, rows);
  }

  /**
   * Opens a comprehensive Student Performance Details modal (Section 13.2)
   * when clicking any student circular card or "View Profile" action.
   *
   * @param {string} studentId
   */
  async function openStudentProfileModal(studentId) {
    let modal = document.getElementById('student-profile-detail-modal');
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);

    modal = document.createElement('div');
    modal.id = 'student-profile-detail-modal';
    modal.className = 'modal-backdrop active';
    modal.innerHTML = `
      <div class="modal-dialog modal-xl">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fa-solid fa-user-graduate text-primary"></i> Student Performance Profile</h3>
          <button type="button" class="modal-close" data-close-stu-modal>&times;</button>
        </div>
        <div class="modal-body" id="student-profile-modal-body">
          <div class="loading-state"><span class="spinner"></span><p class="mt-2">Loading student academic records...</p></div>
        </div>
        <div class="modal-footer justify-between">
          <a href="reports.html?studentId=${encodeURIComponent(studentId)}" class="btn btn-primary">
            <i class="fa-solid fa-file-pdf"></i> Open Full Printable Report
          </a>
          <button type="button" class="btn btn-secondary" data-close-stu-modal>Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-close-stu-modal]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        modal.classList.remove('active');
      });
    });

    try {
      const rpt = await window.API.generateStudentReport({ studentId: studentId });
      const body = modal.querySelector('#student-profile-modal-body');
      renderPrintableReport(body, rpt);
    } catch (err) {
      const body = modal.querySelector('#student-profile-modal-body');
      body.innerHTML = `<div class="empty-state"><p class="text-danger">${esc(err.message)}</p></div>`;
    }
  }

  window.ReportsUI = {
    renderPrintableReport: renderPrintableReport,
    exportStudentReportCsv: exportStudentReportCsv,
    openStudentProfileModal: openStudentProfileModal,
    printReport: function() { window.print(); }
  };
})(window);
