/**
 * ============================================================================
 * Lingo Examination & Student Management Platform
 * File: assets/js/validation.js
 * Purpose: Form validation, Exam & Task JSON schema validation, total marks
 *          verification, and media file size/type validation.
 * ============================================================================
 */

(function(window) {
  'use strict';

  const SUPPORTED_QUESTION_TYPES = [
    'multiple_choice_single',
    'multiple_choice_multiple',
    'true_false',
    'short_answer',
    'fill_in_the_blanks',
    'matching',
    'ordering',
    'essay'
  ];

  const MEDIA_LIMITS = {
    image: {
      maxBytes: 10 * 1024 * 1024,
      maxLabel: '10 MB',
      mimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    },
    audio: {
      maxBytes: 20 * 1024 * 1024,
      maxLabel: '20 MB',
      mimes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm']
    },
    video: {
      maxBytes: 50 * 1024 * 1024,
      maxLabel: '50 MB',
      mimes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    }
  };

  /**
   * Validates a Student registration / edit form payload.
   *
   * @param {Object} data
   * @param {boolean} isEdit
   * @return {Object} { valid: boolean, errors: Array<string> }
   */
  function validateStudentForm(data, isEdit) {
    const errors = [];
    const fullName = String(data.fullName || '').trim().replace(/\s+/g, ' ');
    if (!fullName) {
      errors.push('Full Name is required.');
    } else if (fullName.split(' ').length < 3) {
      errors.push('Full Name must be a three-part name (First, Middle, and Last name).');
    }

    const code = String(data.studentCode || '').trim();
    if (!code) {
      errors.push('Student Code is required.');
    } else if (code.length < 3) {
      errors.push('Student Code must be at least 3 characters.');
    }

    if (!isEdit) {
      const password = String(data.password || '');
      if (!password) {
        errors.push('Password is required.');
      } else if (password.length < 4) {
        errors.push('Password must be at least 4 characters long.');
      }
    }

    if (!Array.isArray(data.levelIds) || data.levelIds.length === 0) {
      errors.push('Please assign at least one educational level to the student.');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validates a media file before uploading to Google Drive.
   *
   * @param {File} file
   * @param {string} category - 'image' | 'audio' | 'video'
   * @return {Object} { valid: boolean, error: string|null }
   */
  function validateMediaFile(file, category) {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }
    const cat = String(category || '').toLowerCase();
    const rules = MEDIA_LIMITS[cat];
    if (!rules) {
      return { valid: false, error: 'Unsupported media category: ' + category };
    }
    const mime = String(file.type || '').toLowerCase();
    if (rules.mimes.indexOf(mime) === -1) {
      return {
        valid: false,
        error: 'Unsupported file type (' + (mime || file.name) + '). Allowed types for ' + cat + ': ' + rules.mimes.join(', ')
      };
    }
    if (file.size > rules.maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: 'File size (' + sizeMb + ' MB) exceeds the ' + rules.maxLabel + ' limit for ' + cat + ' uploads.'
      };
    }
    return { valid: true, error: null };
  }

  /**
   * Validates an uploaded or authored Exam / Task JSON object against the platform schema.
   * Checks question types, required fields, level/lesson references, and total marks consistency.
   *
   * @param {Object|string} jsonInput
   * @param {string} expectedType - 'exam' or 'task'
   * @param {Object=} context - Optional { availableLevels: [], availableLessons: [] }
   * @return {Object} { valid: boolean, errors: Array<string>, warnings: Array<string>, parsed: Object|null, calculatedTotalMarks: number }
   */
  function validateAssessmentJson(jsonInput, expectedType, context) {
    const errors = [];
    const warnings = [];
    let obj = null;

    if (typeof jsonInput === 'string') {
      try {
        obj = JSON.parse(jsonInput);
      } catch (e) {
        return {
          valid: false,
          errors: ['Invalid JSON syntax: ' + e.message],
          warnings: [],
          parsed: null,
          calculatedTotalMarks: 0
        };
      }
    } else if (jsonInput && typeof jsonInput === 'object') {
      obj = JSON.parse(JSON.stringify(jsonInput));
    } else {
      return {
        valid: false,
        errors: ['JSON input is empty or not an object.'],
        warnings: [],
        parsed: null,
        calculatedTotalMarks: 0
      };
    }

    const type = String(obj.type || '').toLowerCase();
    if (expectedType && type !== expectedType.toLowerCase()) {
      errors.push('JSON "type" is "' + (obj.type || 'missing') + '", but expected "' + expectedType + '".');
    }

    if (!obj.title || !String(obj.title).trim()) {
      errors.push('Missing required top-level field: "title".');
    }

    if (!obj.level_id || !String(obj.level_id).trim()) {
      errors.push('Missing required top-level field: "level_id".');
    } else if (context && Array.isArray(context.availableLevels) && context.availableLevels.length > 0) {
      const levelExists = context.availableLevels.some(function(l) {
        return String(l.Level_ID).trim() === String(obj.level_id).trim();
      });
      if (!levelExists) {
        warnings.push('Level ID "' + obj.level_id + '" in JSON was not found in the database; please select a target Level before saving.');
      }
    }

    if (obj.lesson_id && context && Array.isArray(context.availableLessons) && context.availableLessons.length > 0) {
      const matchedLesson = context.availableLessons.find(function(les) {
        return String(les.Lesson_ID).trim() === String(obj.lesson_id).trim();
      });
      if (matchedLesson && obj.level_id && String(matchedLesson.Level_ID).trim() !== String(obj.level_id).trim()) {
        errors.push('Lesson "' + obj.lesson_id + '" does not belong to Level "' + obj.level_id + '".');
      }
    }

    if (!Array.isArray(obj.questions) || obj.questions.length === 0) {
      errors.push('JSON must contain a non-empty "questions" array.');
      return {
        valid: false,
        errors: errors,
        warnings: warnings,
        parsed: obj,
        calculatedTotalMarks: 0
      };
    }

    let sumPoints = 0;
    const seenIds = {};

    obj.questions.forEach(function(q, idx) {
      const qLabel = 'Question #' + (idx + 1) + (q && q.question_id ? ' (' + q.question_id + ')' : '');
      if (!q || typeof q !== 'object') {
        errors.push(qLabel + ': Must be a valid object.');
        return;
      }

      if (!q.question_id) {
        q.question_id = 'Q' + String(idx + 1).padStart(3, '0');
      } else if (seenIds[q.question_id]) {
        errors.push(qLabel + ': Duplicate question_id "' + q.question_id + '".');
      }
      seenIds[q.question_id] = true;

      if (!q.type || SUPPORTED_QUESTION_TYPES.indexOf(q.type) === -1) {
        errors.push(qLabel + ': Unsupported question type "' + (q.type || 'missing') + '". Supported: ' + SUPPORTED_QUESTION_TYPES.join(', '));
      }

      if (!q.text || !String(q.text).trim()) {
        errors.push(qLabel + ': Question "text" is required.');
      }

      const pts = Number(q.points);
      if (isNaN(pts) || pts <= 0) {
        errors.push(qLabel + ': "points" must be a number greater than 0.');
      } else {
        sumPoints += pts;
      }

      if (q.type === 'multiple_choice_single' || q.type === 'multiple_choice_multiple') {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push(qLabel + ': Multiple choice questions require at least 2 options.');
        }
        if (q.correct_answer === undefined || q.correct_answer === null || q.correct_answer === '' || (Array.isArray(q.correct_answer) && q.correct_answer.length === 0)) {
          errors.push(qLabel + ': Missing "correct_answer".');
        }
      } else if (q.type === 'true_false') {
        if (q.correct_answer === undefined || q.correct_answer === null || q.correct_answer === '') {
          errors.push(qLabel + ': True/False question must specify a "correct_answer" ("TRUE" or "FALSE").');
        }
      } else if (q.type === 'matching') {
        const hasPairs = Array.isArray(q.pairs) && q.pairs.length >= 2;
        const hasOptions = Array.isArray(q.options) && q.options.length >= 2;
        if (!hasPairs && !hasOptions) {
          errors.push(qLabel + ': Matching question must include at least 2 matching pairs.');
        }
      } else if (q.type === 'ordering') {
        const hasItems = Array.isArray(q.items) && q.items.length >= 2;
        const hasOptions = Array.isArray(q.options) && q.options.length >= 2;
        if (!hasItems && !hasOptions) {
          errors.push(qLabel + ': Ordering question must include at least 2 items to order.');
        }
      }
    });

    const declaredTotal = (type === 'exam' && obj.settings && obj.settings.total_marks !== undefined)
      ? Number(obj.settings.total_marks)
      : Number(obj.total_marks || 0);

    if (declaredTotal > 0 && declaredTotal !== sumPoints) {
      warnings.push('Declared total_marks (' + declaredTotal + ') differs from the sum of question points (' + sumPoints + '). Total marks will be synchronized to ' + sumPoints + '.');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      parsed: obj,
      calculatedTotalMarks: sumPoints
    };
  }

  window.Validation = {
    SUPPORTED_QUESTION_TYPES: SUPPORTED_QUESTION_TYPES,
    MEDIA_LIMITS: MEDIA_LIMITS,
    validateStudentForm: validateStudentForm,
    validateMediaFile: validateMediaFile,
    validateAssessmentJson: validateAssessmentJson
  };
})(window);
