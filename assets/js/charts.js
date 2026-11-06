/**
 * ============================================================================
 * Lingo Examination & Student Management Platform
 * File: assets/js/charts.js
 * Purpose: Reusable Chart.js builders for Admin Dashboard, Student Analytics,
 *          Level Comparisons, Performance Distribution, and Printable Reports.
 * ============================================================================
 */

(function(window) {
  'use strict';

  const chartInstances = {};

  function destroyChart(canvasId) {
    if (chartInstances[canvasId]) {
      try {
        chartInstances[canvasId].destroy();
      } catch (e) {}
      delete chartInstances[canvasId];
    }
  }

  /**
   * 1. Student Performance Distribution Bar Chart (Admin Dashboard)
   */
  function renderPerformanceDistributionChart(canvasId, distData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;
    destroyChart(canvasId);

    const labels = (distData && distData.labels) || ['90-100%', '80-89%', '70-79%', '60-69%', '50-59%', 'Below 50%'];
    const values = (distData && distData.values) || [0, 0, 0, 0, 0, 0];

    chartInstances[canvasId] = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Students',
          data: values,
          backgroundColor: ['#10b981', '#22c55e', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
          borderRadius: 8,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  /**
   * 2. Overall Exam Results Doughnut Chart (Passed / Failed / Pending)
   */
  function renderExamResultsChart(canvasId, examData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;
    destroyChart(canvasId);

    const labels = (examData && examData.labels) || ['Passed', 'Failed', 'Pending Review'];
    const values = (examData && examData.values) || [0, 0, 0];

    chartInstances[canvasId] = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  /**
   * 3. Student Activity Line Chart (Last 7 Days)
   */
  function renderStudentActivityChart(canvasId, actData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;
    destroyChart(canvasId);

    const labels = (actData && actData.labels) || [];
    const values = (actData && actData.values) || [];

    chartInstances[canvasId] = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Learning Activities',
          data: values,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#4f46e5'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  /**
   * 4. Performance & Completion Rate by Level Grouped Bar Chart
   */
  function renderPerformanceByLevelChart(canvasId, levelList) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;
    destroyChart(canvasId);

    const list = Array.isArray(levelList) ? levelList : [];
    const labels = list.map(function(l) { return l.levelName; });
    const examAvgs = list.map(function(l) { return Number(l.examAverage || 0); });
    const taskAvgs = list.map(function(l) { return Number(l.taskAverage || 0); });
    const completionRates = list.map(function(l) { return Number(l.completionRate || 0); });

    chartInstances[canvasId] = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Exam Avg (%)',
            data: examAvgs,
            backgroundColor: '#4f46e5',
            borderRadius: 6
          },
          {
            label: 'Task Avg (%)',
            data: taskAvgs,
            backgroundColor: '#0ea5e9',
            borderRadius: 6
          },
          {
            label: 'Completion Rate (%)',
            data: completionRates,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  /**
   * 5. Chronological Student Score Trend Chart (Exams & Tasks over time)
   */
  function renderStudentTrendChart(canvasId, trendsObj) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;
    destroyChart(canvasId);

    const points = (trendsObj && Array.isArray(trendsObj.performanceOverTime)) ? trendsObj.performanceOverTime : [];
    const labels = points.map(function(p) {
      const dateStr = p.date ? new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
      return (p.title || p.referenceId || p.type) + (dateStr ? ' (' + dateStr + ')' : '');
    });
    const scores = points.map(function(p) { return Number(p.percentage || 0); });
    const colors = points.map(function(p) { return p.type === 'EXAM' ? '#4f46e5' : '#0ea5e9'; });

    chartInstances[canvasId] = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Score Percentage (%)',
          data: scores,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  window.Charts = {
    destroyChart: destroyChart,
    renderPerformanceDistributionChart: renderPerformanceDistributionChart,
    renderExamResultsChart: renderExamResultsChart,
    renderStudentActivityChart: renderStudentActivityChart,
    renderPerformanceByLevelChart: renderPerformanceByLevelChart,
    renderStudentTrendChart: renderStudentTrendChart
  };
})(window);
