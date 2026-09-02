/**
 * Teaching Center - Student Evaluation & Lesson Report Web App
 * JavaScript Engine
 */

// Global State
const DEFAULT_PASSCODE = '8478';
const DEFAULT_CENTER_NAME = 'Apex Teaching Center';

let appState = {
  isUnlocked: false,
  passcode: DEFAULT_PASSCODE,
  centerName: DEFAULT_CENTER_NAME,
  maxDictationScore: 10,
  currentClassId: null,
  currentLessonId: null,
  theme: 'dark',
  classes: [],
  lessons: [],
  students: [],
  evaluations: {} // key: `${lessonId}_${studentId}`
};

// Available Evaluation Criteria List
const CRITERIA_KEYS = [
  { id: 'attendance', label: 'Attendance', icon: 'fa-user-check' },
  { id: 'hw', label: 'H.W.', icon: 'fa-book-bookmark' },
  { id: 'listening', label: 'Listening', icon: 'fa-headphones' },
  { id: 'reading', label: 'Reading', icon: 'fa-book-open-reader' },
  { id: 'speaking', label: 'Speaking', icon: 'fa-comments' },
  { id: 'writing', label: 'Writing', icon: 'fa-pen-to-square' },
  { id: 'video', label: 'Video', icon: 'fa-video' }
];

// Passcode input state
let currentEnteredPasscode = '';

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  setupEventListeners();
  setupNumpad();
  
  if (!appState.isUnlocked) {
    showAuthOverlay();
  } else {
    hideAuthOverlay();
    renderApp();
  }
});

/* ==========================================================================
   DATA PERSISTENCE & INITIAL SAMPLE DATA
   ========================================================================== */
function loadDataFromStorage() {
  const storedState = localStorage.getItem('teachingCenterState');
  if (storedState) {
    try {
      const parsed = JSON.parse(storedState);
      appState = { ...appState, ...parsed };
      if (!appState.passcode || appState.passcode === '1234') {
        appState.passcode = DEFAULT_PASSCODE;
      }
    } catch (e) {
      console.error('Failed to parse saved state', e);
      loadSampleData();
    }
  } else {
    loadSampleData();
  }
}

function saveDataToStorage() {
  localStorage.setItem('teachingCenterState', JSON.stringify(appState));
}

function loadSampleData() {
  appState.centerName = DEFAULT_CENTER_NAME;
  appState.passcode = DEFAULT_PASSCODE;
  appState.maxDictationScore = 10;
  
  appState.classes = [
    { id: 'cls_1', name: 'Grade 4 - Group A (English Star)', grade: 'Grade 4', group: 'Group A' },
    { id: 'cls_2', name: 'Grade 5 - Group B (Advanced)', grade: 'Grade 5', group: 'Group B' }
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  appState.lessons = [
    { id: 'les_1', classId: 'cls_1', title: 'Lesson 5 - Unit 3 Reading & Dictation', date: todayStr },
    { id: 'les_2', classId: 'cls_1', title: 'Lesson 4 - Phonics & Vocabulary', date: '2026-09-01' },
    { id: 'les_3', classId: 'cls_2', title: 'Lesson 8 - Grammar & Writing Essay', date: todayStr }
  ];

  appState.students = [
    { id: 'std_1', classId: 'cls_1', name: 'Sarah Ahmed' },
    { id: 'std_2', classId: 'cls_1', name: 'Youssef Omar' },
    { id: 'std_3', classId: 'cls_1', name: 'Laila Hassan' },
    { id: 'std_4', classId: 'cls_1', name: 'Mohamed Ali' },
    { id: 'std_5', classId: 'cls_1', name: 'Nour El-Din' },
    { id: 'std_6', classId: 'cls_2', name: 'Kareem Mostafa' },
    { id: 'std_7', classId: 'cls_2', name: 'Mariam Ibrahim' }
  ];

  appState.evaluations = {
    'les_1_std_1': { dictationMark: 9.5, criteria: { attendance: true, hw: true, listening: true, reading: true, speaking: true, writing: true, video: true }, notes: 'Excellent effort in dictation!' },
    'les_1_std_2': { dictationMark: 8.0, criteria: { attendance: true, hw: true, listening: true, reading: true, speaking: false, writing: true, video: true }, notes: 'Needs more practice in speaking.' },
    'les_1_std_3': { dictationMark: 10.0, criteria: { attendance: true, hw: true, listening: true, reading: true, speaking: true, writing: true, video: true }, notes: 'Perfect score!' },
    'les_1_std_4': { dictationMark: 6.5, criteria: { attendance: true, hw: false, listening: true, reading: false, speaking: true, writing: false, video: false }, notes: 'Missed homework task.' },
    'les_1_std_5': { dictationMark: 9.0, criteria: { attendance: true, hw: true, listening: true, reading: true, speaking: true, writing: true, video: false }, notes: 'Great listening comprehension.' }
  };

  appState.currentClassId = 'cls_1';
  appState.currentLessonId = 'les_1';
  saveDataToStorage();
}

/* ==========================================================================
   AUTHENTICATION & LOCK SCREEN
   ========================================================================== */
function setupNumpad() {
  const numBtns = document.querySelectorAll('.num-btn');
  numBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      handlePasscodeVal(val);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (!appState.isUnlocked) {
      if (e.key >= '0' && e.key <= '9') {
        handlePasscodeVal(e.key);
      } else if (e.key === 'Backspace') {
        handlePasscodeVal('backspace');
      } else if (e.key === 'Escape') {
        handlePasscodeVal('clear');
      }
    }
  });
}

function handlePasscodeVal(val) {
  const authError = document.getElementById('authError');
  authError.textContent = '';

  if (val === 'clear') {
    currentEnteredPasscode = '';
  } else if (val === 'backspace') {
    currentEnteredPasscode = currentEnteredPasscode.slice(0, -1);
  } else if (currentEnteredPasscode.length < 4) {
    currentEnteredPasscode += val;
  }

  updatePasscodeDots();

  if (currentEnteredPasscode.length === 4) {
    setTimeout(() => {
      if (currentEnteredPasscode === appState.passcode) {
        appState.isUnlocked = true;
        saveDataToStorage();
        hideAuthOverlay();
        renderApp();
      } else {
        const authCard = document.getElementById('authCard');
        authCard.classList.add('shake');
        authError.textContent = 'Incorrect Passcode. Access Denied.';
        setTimeout(() => authCard.classList.remove('shake'), 400);
        currentEnteredPasscode = '';
        updatePasscodeDots();
      }
    }, 150);
  }
}

function updatePasscodeDots() {
  const dots = document.querySelectorAll('#passcodeDots .dot');
  dots.forEach((dot, idx) => {
    if (idx < currentEnteredPasscode.length) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function showAuthOverlay() {
  currentEnteredPasscode = '';
  updatePasscodeDots();
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('authOverlay').style.opacity = '1';
}

function hideAuthOverlay() {
  const overlay = document.getElementById('authOverlay');
  overlay.style.opacity = '0';
  setTimeout(() => overlay.style.display = 'none', 300);
}

/* ==========================================================================
   UI RENDERING & CONTROLLER LOGIC
   ========================================================================== */
function renderApp() {
  // Update Center Title
  document.getElementById('centerTitleHeading').textContent = appState.centerName;

  // Render Theme
  document.documentElement.setAttribute('data-theme', appState.theme);

  // Populate Selectors
  renderClassSelector();
  renderLessonSelector();

  // Render Dashboard Table & Stats
  renderTable();
  updateStatsSummary();
}

function renderClassSelector() {
  const select = document.getElementById('classSelect');
  select.innerHTML = '';
  appState.classes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === appState.currentClassId) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderLessonSelector() {
  const select = document.getElementById('lessonSelect');
  select.innerHTML = '';

  const classLessons = appState.lessons.filter(l => l.classId === appState.currentClassId);
  classLessons.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = `${l.title} (${l.date})`;
    if (l.id === appState.currentLessonId) opt.selected = true;
    select.appendChild(opt);
  });

  const currLesson = appState.lessons.find(l => l.id === appState.currentLessonId);
  if (currLesson) {
    document.getElementById('lessonDatePicker').value = currLesson.date;
  }
}

function renderTable() {
  const tbody = document.getElementById('evalTableBody');
  tbody.innerHTML = '';

  const searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();
  const filteredStudents = appState.students
    .filter(s => s.classId === appState.currentClassId)
    .filter(s => s.name.toLowerCase().includes(searchFilter));

  if (filteredStudents.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
          No student evaluation records found. Click "Add Student" above to start.
        </td>
      </tr>
    `;
    return;
  }

  filteredStudents.forEach((student, idx) => {
    const evalKey = `${appState.currentLessonId}_${student.id}`;
    if (!appState.evaluations[evalKey]) {
      appState.evaluations[evalKey] = {
        dictationMark: 0,
        criteria: { attendance: true, hw: false, listening: false, reading: false, speaking: false, writing: false, video: false },
        notes: ''
      };
    }

    const evalData = appState.evaluations[evalKey];
    const tr = document.createElement('tr');

    // Initials avatar
    const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Grade calculation
    const gradeObj = calculateGrade(evalData.dictationMark);

    // Build Criteria Pills with Green Right Checkmark (✔)
    let criteriaHTML = `<div class="criteria-pills-group">`;
    CRITERIA_KEYS.forEach(c => {
      const isActive = evalData.criteria && evalData.criteria[c.id];
      criteriaHTML += `
        <div class="criteria-pill ${isActive ? 'active' : ''}" 
             onclick="toggleCriteria('${student.id}', '${c.id}')"
             title="Toggle ${c.label}">
          <span class="check-icon">${isActive ? '✔' : ''}</span>
          <i class="fa-solid ${c.icon}" style="font-size: 11px;"></i>
          <span>${c.label}</span>
        </div>
      `;
    });
    criteriaHTML += `</div>`;

    tr.innerHTML = `
      <td style="font-weight: bold; color: var(--text-muted);">${idx + 1}</td>
      <td>
        <div class="student-profile">
          <div class="avatar-circle">${initials}</div>
          <span class="student-name">${escapeHtml(student.name)}</span>
        </div>
      </td>
      <td>
        <div class="dictation-input-wrap">
          <input type="number" step="0.5" min="0" max="${appState.maxDictationScore}" 
                 class="dictation-input" 
                 value="${evalData.dictationMark !== undefined ? evalData.dictationMark : ''}"
                 onchange="updateDictationMark('${student.id}', this.value)"
                 placeholder="0">
          <span class="max-score-tag">/${appState.maxDictationScore}</span>
        </div>
      </td>
      <td>${criteriaHTML}</td>
      <td>
        <span class="badge-grade ${gradeObj.cssClass}">${gradeObj.label}</span>
      </td>
      <td>
        <input type="text" class="notes-input" 
               value="${escapeHtml(evalData.notes || '')}"
               placeholder="Add note..."
               onchange="updateStudentNotes('${student.id}', this.value)">
      </td>
      <td style="text-align: right;">
        <div class="action-btns" style="justify-content: flex-end;">
          <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" 
                  onclick="openReportModal('${student.id}')" title="View & Print Final Report Card">
            <i class="fa-solid fa-file-invoice" style="color: var(--primary);"></i> Report
          </button>
          <button class="btn-icon" style="padding: 6px 8px; color: var(--accent-rose);" 
                  onclick="deleteStudent('${student.id}')" title="Delete Student">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function calculateGrade(mark) {
  const percentage = (mark / appState.maxDictationScore) * 100;
  if (percentage >= 90) return { label: 'Excellent (A+)', cssClass: 'excellent' };
  if (percentage >= 75) return { label: 'Good (B)', cssClass: 'good' };
  return { label: 'Needs Improvement', cssClass: 'needs-work' };
}

/* ==========================================================================
   INTERACTIVE EVALUATION STATE MUTATIONS
   ========================================================================== */
function toggleCriteria(studentId, criteriaKey) {
  const evalKey = `${appState.currentLessonId}_${studentId}`;
  if (!appState.evaluations[evalKey]) return;

  if (!appState.evaluations[evalKey].criteria) {
    appState.evaluations[evalKey].criteria = {};
  }

  const currentVal = !!appState.evaluations[evalKey].criteria[criteriaKey];
  appState.evaluations[evalKey].criteria[criteriaKey] = !currentVal;

  saveDataToStorage();
  renderTable();
  updateStatsSummary();
}

function updateDictationMark(studentId, val) {
  const evalKey = `${appState.currentLessonId}_${studentId}`;
  if (!appState.evaluations[evalKey]) return;

  let num = parseFloat(val);
  if (isNaN(num)) num = 0;
  if (num < 0) num = 0;
  if (num > appState.maxDictationScore) num = appState.maxDictationScore;

  appState.evaluations[evalKey].dictationMark = num;

  saveDataToStorage();
  renderTable();
  updateStatsSummary();
}

function updateStudentNotes(studentId, text) {
  const evalKey = `${appState.currentLessonId}_${studentId}`;
  if (!appState.evaluations[evalKey]) return;

  appState.evaluations[evalKey].notes = text;
  saveDataToStorage();
}

function updateStatsSummary() {
  const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId);
  const count = currentStudents.length;
  document.getElementById('statStudentCount').textContent = count;

  if (count === 0) {
    document.getElementById('statDictationAvg').textContent = `0 / ${appState.maxDictationScore}`;
    document.getElementById('statSkillPassRate').textContent = `0%`;
    document.getElementById('statAttendanceRate').textContent = `0%`;
    return;
  }

  let totalDictation = 0;
  let totalSkillsChecked = 0;
  let totalPossibleSkills = count * CRITERIA_KEYS.length;
  let totalAttended = 0;

  currentStudents.forEach(s => {
    const evalKey = `${appState.currentLessonId}_${s.id}`;
    const ev = appState.evaluations[evalKey];
    if (ev) {
      totalDictation += (ev.dictationMark || 0);
      if (ev.criteria) {
        if (ev.criteria.attendance) totalAttended++;
        CRITERIA_KEYS.forEach(c => {
          if (ev.criteria[c.id]) totalSkillsChecked++;
        });
      }
    }
  });

  const avgDict = (totalDictation / count).toFixed(1);
  const passRate = Math.round((totalSkillsChecked / totalPossibleSkills) * 100);
  const attRate = Math.round((totalAttended / count) * 100);

  document.getElementById('statDictationAvg').textContent = `${avgDict} / ${appState.maxDictationScore}`;
  document.getElementById('statSkillPassRate').textContent = `${passRate}%`;
  document.getElementById('statAttendanceRate').textContent = `${attRate}%`;
}

/* ==========================================================================
   FINAL STUDENT REPORT CARD GENERATOR
   ========================================================================== */
function openReportModal(studentId) {
  const student = appState.students.find(s => s.id === studentId);
  const currentClass = appState.classes.find(c => c.id === appState.currentClassId);
  const currentLesson = appState.lessons.find(l => l.id === appState.currentLessonId);

  if (!student || !currentLesson) return;

  const evalKey = `${appState.currentLessonId}_${student.id}`;
  const evalData = appState.evaluations[evalKey] || { dictationMark: 0, criteria: {}, notes: '' };

  const reportContainer = document.getElementById('reportCardContent');
  
  // Calculate Passed Criteria
  let passedCount = 0;
  CRITERIA_KEYS.forEach(c => {
    if (evalData.criteria && evalData.criteria[c.id]) passedCount++;
  });

  const completionPct = Math.round((passedCount / CRITERIA_KEYS.length) * 100);
  const gradeObj = calculateGrade(evalData.dictationMark);

  // Generate encouraging automated comments if custom notes empty
  let teacherComment = evalData.notes;
  if (!teacherComment || teacherComment.trim() === '') {
    if (evalData.dictationMark >= (appState.maxDictationScore * 0.9)) {
      teacherComment = `${student.name} demonstrated outstanding dictation accuracy and active participation throughout this lesson.`;
    } else if (evalData.dictationMark >= (appState.maxDictationScore * 0.7)) {
      teacherComment = `${student.name} did a solid job overall. Continuous homework practice will help achieve perfection!`;
    } else {
      teacherComment = `${student.name} is encouraged to revise dictation vocabulary and complete all assigned tasks carefully.`;
    }
  }

  // Build Skills Checklist Cards with Green Right Mark (✔)
  let skillsHTML = '';
  CRITERIA_KEYS.forEach(c => {
    const isPassed = evalData.criteria && evalData.criteria[c.id];
    skillsHTML += `
      <div style="display: flex; align-items: center; justify-content: space-between; background: ${isPassed ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${isPassed ? '#86efac' : '#e2e8f0'}; padding: 12px 16px; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid ${c.icon}" style="color: ${isPassed ? '#10b981' : '#94a3b8'}; font-size: 15px;"></i>
          <span style="font-weight: 700; font-size: 14px; color: ${isPassed ? '#0f172a' : '#64748b'};">${c.label}</span>
        </div>
        <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: ${isPassed ? '#059669' : '#94a3b8'};">
          <span>${isPassed ? 'Achieved' : 'Pending'}</span>
          <span style="width: 22px; height: 22px; background: ${isPassed ? '#10b981' : '#cbd5e1'}; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: ${isPassed ? '0 2px 6px rgba(16,185,129,0.3)' : 'none'};">
            ${isPassed ? '✔' : '✖'}
          </span>
        </div>
      </div>
    `;
  });

  reportContainer.dataset.studentName = student.name;
  reportContainer.dataset.lessonTitle = currentLesson.title;

  reportContainer.innerHTML = `
    <div class="report-pdf-wrapper" style="background: #ffffff; color: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 2px solid #e2e8f0; font-family: 'Outfit', sans-serif; padding-bottom: 24px;">
      
      <!-- Top Banner Header -->
      <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #2563eb 100%); padding: 26px 30px; color: #ffffff; position: relative;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; backdrop-filter: blur(4px);">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h2 style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; margin: 0; line-height: 1.1;">${escapeHtml(appState.centerName)}</h2>
              <div style="font-size: 11px; opacity: 0.9; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Official Student Evaluation Report</div>
            </div>
          </div>
          <div style="background: #f59e0b; color: #78350f; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 99px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
            ★ Certified Report Card
          </div>
        </div>
      </div>

      <!-- Student & Lesson Info Grid -->
      <div style="padding: 24px 30px 12px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 12px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Student Name</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${escapeHtml(student.name)}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 12px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Class & Group</div>
            <div style="font-size: 16px; font-weight: 700; color: #2563eb; margin-top: 2px;">${escapeHtml(currentClass ? currentClass.name : '')}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 12px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Lesson Topic</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px;">${escapeHtml(currentLesson.title)}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 12px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Lesson Date</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px;">${currentLesson.date}</div>
          </div>
        </div>

        <!-- Dictation Mark & Performance Badge Banner -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%); border: 2px solid #10b981; padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(16,185,129,0.12);">
          <div>
            <div style="font-size: 12px; color: #047857; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Dictation Mark</div>
            <div style="font-size: 36px; font-weight: 900; color: #059669; line-height: 1.1; margin-top: 2px;">
              ${evalData.dictationMark} <span style="font-size: 20px; color: #64748b; font-weight: 700;">/ ${appState.maxDictationScore}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #10b981; color: #ffffff; font-size: 14px; font-weight: 800; padding: 8px 18px; border-radius: 99px; display: inline-block; box-shadow: 0 4px 10px rgba(16,185,129,0.25);">
              ${gradeObj.label}
            </div>
            <div style="font-size: 12px; color: #475569; font-weight: 700; margin-top: 8px;">
              Skill Mastery: <strong style="color: #059669;">${completionPct}%</strong>
            </div>
          </div>
        </div>

        <!-- 7 Core Criteria Green Right Checkmark (✔) Grid -->
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            <i class="fa-solid fa-square-check" style="color: #10b981; font-size: 17px;"></i>
            7 Core Lesson Criteria (Green Checkmark ✔ = Achieved)
          </h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            ${skillsHTML}
          </div>
        </div>

        <!-- Teacher Notes Section -->
        <div style="background: #f8fafc; border-left: 5px solid #10b981; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-comment-dots"></i> Teacher & Assistant Feedback
          </div>
          <div style="font-size: 14px; color: #334155; line-height: 1.6; font-weight: 500;">
            "${escapeHtml(teacherComment)}"
          </div>
        </div>

        <!-- Stamp & Signature Footer -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 2px dashed #cbd5e1; padding-top: 18px; margin-top: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 34px; height: 34px; background: #ecfdf5; border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 15px;">
              <i class="fa-solid fa-award"></i>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Verified Center Seal</div>
              <div style="font-size: 10px; color: #64748b;">Issued on ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; font-weight: 700; color: #475569;">Teacher / Assistant Signature:</div>
            <div style="font-size: 14px; color: #0f172a; margin-top: 4px; border-bottom: 1px solid #94a3b8; padding-bottom: 2px; display: inline-block; min-width: 140px; text-align: center; font-weight: 600;">
              Approved Evaluation
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach shareable text summary to button dataset
  const shareText = `🎓 *${appState.centerName} - Student Report Card*\n\n👤 *Student:* ${student.name}\n📚 *Lesson:* ${currentLesson.title}\n📅 *Date:* ${currentLesson.date}\n\n✍️ *Dictation Mark:* ${evalData.dictationMark}/${appState.maxDictationScore}\n🌟 *Grade:* ${gradeObj.label}\n\n✅ *Skills Checklist:*\n${CRITERIA_KEYS.map(c => `${evalData.criteria && evalData.criteria[c.id] ? '✔' : '❌'} ${c.label}`).join('\n')}\n\n📝 *Notes:* ${teacherComment}`;
  document.getElementById('btnCopyReportText').dataset.shareText = shareText;

  openModal('reportModal');
}

function downloadPDFReport() {
  const element = document.getElementById('reportCardContent');
  const studentName = element.dataset.studentName || 'Student';
  const lessonTitle = element.dataset.lessonTitle || 'Lesson';

  const opt = {
    margin:       [8, 8, 8, 8],
    filename:     `Report_${studentName.replace(/\s+/g, '_')}_${lessonTitle.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (typeof html2pdf !== 'undefined') {
    html2pdf().set(opt).from(element).save();
  } else {
    window.print();
  }
}

/* ==========================================================================
   EVENT LISTENERS & MODAL CONTROLLERS
   ========================================================================== */
function setupEventListeners() {
  // Class Select Change
  document.getElementById('classSelect').addEventListener('change', (e) => {
    appState.currentClassId = e.value || e.target.value;
    // Set default lesson for class
    const classLessons = appState.lessons.filter(l => l.classId === appState.currentClassId);
    if (classLessons.length > 0) {
      appState.currentLessonId = classLessons[0].id;
    }
    saveDataToStorage();
    renderApp();
  });

  // Lesson Select Change
  document.getElementById('lessonSelect').addEventListener('change', (e) => {
    appState.currentLessonId = e.target.value;
    saveDataToStorage();
    renderApp();
  });

  // Date Picker Change
  document.getElementById('lessonDatePicker').addEventListener('change', (e) => {
    const currLesson = appState.lessons.find(l => l.id === appState.currentLessonId);
    if (currLesson) {
      currLesson.date = e.target.value;
      saveDataToStorage();
      renderLessonSelector();
    }
  });

  // Search Bar Filter
  document.getElementById('searchInput').addEventListener('input', () => {
    renderTable();
  });

  // Lock Button
  document.getElementById('btnLock').addEventListener('click', () => {
    appState.isUnlocked = false;
    saveDataToStorage();
    showAuthOverlay();
  });

  // Theme Toggle
  document.getElementById('btnThemeToggle').addEventListener('click', () => {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    saveDataToStorage();
    document.documentElement.setAttribute('data-theme', appState.theme);
  });

  // Print & PDF Export Report Card
  document.getElementById('btnPrintReport').addEventListener('click', () => {
    window.print();
  });

  const btnPDF = document.getElementById('btnDownloadPDF');
  if (btnPDF) {
    btnPDF.addEventListener('click', downloadPDFReport);
  }

  // Copy Text Summary for WhatsApp
  document.getElementById('btnCopyReportText').addEventListener('click', (e) => {
    const text = e.target.dataset.shareText || document.getElementById('btnCopyReportText').dataset.shareText;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Report text summary copied to clipboard! You can paste it in WhatsApp or SMS.');
      });
    }
  });

  // Close Report Modal
  document.getElementById('btnCloseReportModal').addEventListener('click', () => closeModal('reportModal'));

  // Add Student Modals
  document.getElementById('btnAddStudent').addEventListener('click', () => {
    populateStudentClassSelect();
    openModal('addStudentModal');
  });
  document.getElementById('btnCloseAddStudentModal').addEventListener('click', () => closeModal('addStudentModal'));
  document.getElementById('btnCancelAddStudent').addEventListener('click', () => closeModal('addStudentModal'));
  document.getElementById('addStudentForm').addEventListener('submit', handleAddStudent);

  // Manage Classes, Grades & Groups Modals
  document.getElementById('btnManageClasses').addEventListener('click', openManageClassesModal);
  document.getElementById('btnCloseManageClassesModal').addEventListener('click', () => closeModal('manageClassesModal'));
  document.getElementById('btnCloseClassesFooter').addEventListener('click', () => closeModal('manageClassesModal'));
  document.getElementById('addClassForm').addEventListener('submit', handleAddClass);

  // Auto assemble full display title when Grade/Group typed
  const gradeInput = document.getElementById('newGradeInput');
  const groupInput = document.getElementById('newGroupInput');
  const nameInput = document.getElementById('newClassNameInput');

  const updateAutoClassName = () => {
    const g = gradeInput.value.trim();
    const grp = groupInput.value.trim();
    if (g && grp) {
      nameInput.value = `${g} - ${grp}`;
    } else if (g) {
      nameInput.value = g;
    }
  };

  gradeInput.addEventListener('input', updateAutoClassName);
  groupInput.addEventListener('input', updateAutoClassName);

  // Add Lesson Modals
  document.getElementById('btnNewLesson').addEventListener('click', () => {
    document.getElementById('newLessonDate').value = new Date().toISOString().split('T')[0];
    openModal('addLessonModal');
  });
  document.getElementById('btnCloseAddLessonModal').addEventListener('click', () => closeModal('addLessonModal'));
  document.getElementById('btnCancelAddLesson').addEventListener('click', () => closeModal('addLessonModal'));
  document.getElementById('addLessonForm').addEventListener('submit', handleAddLesson);

  // Settings Modals
  document.getElementById('btnSettings').addEventListener('click', () => {
    document.getElementById('settingCenterName').value = appState.centerName;
    document.getElementById('settingPasscode').value = appState.passcode;
    document.getElementById('settingMaxScore').value = appState.maxDictationScore;
    openModal('settingsModal');
  });
  document.getElementById('btnCloseSettingsModal').addEventListener('click', () => closeModal('settingsModal'));
  document.getElementById('btnCancelSettings').addEventListener('click', () => closeModal('settingsModal'));
  document.getElementById('settingsForm').addEventListener('submit', handleSaveSettings);

  // Settings: Reset & Sample Data Buttons
  document.getElementById('btnResetSampleData').addEventListener('click', () => {
    if (confirm('Load sample demonstration data? Existing records will be reset.')) {
      loadSampleData();
      closeModal('settingsModal');
      renderApp();
    }
  });

  document.getElementById('btnClearAllData').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      appState.students = [];
      appState.evaluations = {};
      saveDataToStorage();
      closeModal('settingsModal');
      renderApp();
    }
  });

  // Quick Batch Actions Bar
  document.getElementById('btnBatchMarkAll').addEventListener('click', () => {
    const batchBar = document.getElementById('batchBar');
    batchBar.style.display = batchBar.style.display === 'none' ? 'flex' : 'none';
  });

  document.getElementById('btnCloseBatchBar').addEventListener('click', () => {
    document.getElementById('batchBar').style.display = 'none';
  });

  document.getElementById('btnMarkAllAttendance').addEventListener('click', () => {
    const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId);
    currentStudents.forEach(s => {
      const evalKey = `${appState.currentLessonId}_${s.id}`;
      if (!appState.evaluations[evalKey]) {
        appState.evaluations[evalKey] = { dictationMark: 0, criteria: {}, notes: '' };
      }
      if (!appState.evaluations[evalKey].criteria) appState.evaluations[evalKey].criteria = {};
      appState.evaluations[evalKey].criteria.attendance = true;
    });
    saveDataToStorage();
    renderTable();
    updateStatsSummary();
  });

  document.getElementById('btnMarkAllHW').addEventListener('click', () => {
    const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId);
    currentStudents.forEach(s => {
      const evalKey = `${appState.currentLessonId}_${s.id}`;
      if (!appState.evaluations[evalKey]) {
        appState.evaluations[evalKey] = { dictationMark: 0, criteria: {}, notes: '' };
      }
      if (!appState.evaluations[evalKey].criteria) appState.evaluations[evalKey].criteria = {};
      appState.evaluations[evalKey].criteria.hw = true;
    });
    saveDataToStorage();
    renderTable();
    updateStatsSummary();
  });

  // Export to CSV
  document.getElementById('btnExportCSV').addEventListener('click', exportToCSV);

  // Analytics Button
  document.getElementById('btnAnalytics').addEventListener('click', openAnalyticsModal);
  document.getElementById('btnCloseAnalyticsModal').addEventListener('click', () => closeModal('analyticsModal'));
}

/* ==========================================================================
   CLASS, GRADE & GROUP MANAGEMENT
   ========================================================================== */
function openManageClassesModal() {
  renderClassList();
  openModal('manageClassesModal');
}

function renderClassList() {
  const container = document.getElementById('classListContainer');
  container.innerHTML = '';

  if (appState.classes.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No classes created yet.</p>`;
    return;
  }

  appState.classes.forEach(c => {
    const studentCount = appState.students.filter(s => s.classId === c.id).length;
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: var(--bg-input); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);';

    div.innerHTML = `
      <div>
        <div style="font-weight: 700; font-size: 15px; color: var(--text-main);">${escapeHtml(c.name)}</div>
        <div style="display: flex; gap: 6px; margin-top: 4px;">
          ${c.grade ? `<span style="font-size: 11px; background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 2px 8px; border-radius: 99px; font-weight: 600;">Grade: ${escapeHtml(c.grade)}</span>` : ''}
          ${c.group ? `<span style="font-size: 11px; background: rgba(139, 92, 246, 0.15); color: #8b5cf6; padding: 2px 8px; border-radius: 99px; font-weight: 600;">Group: ${escapeHtml(c.group)}</span>` : ''}
          <span style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 8px; border-radius: 99px; font-weight: 600;">${studentCount} Students</span>
        </div>
      </div>
      <div>
        <button class="btn-icon" style="color: var(--accent-rose); padding: 6px 10px;" onclick="deleteClass('${c.id}')" title="Delete Class">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}

function handleAddClass(e) {
  e.preventDefault();
  const gradeInput = document.getElementById('newGradeInput');
  const groupInput = document.getElementById('newGroupInput');
  const nameInput = document.getElementById('newClassNameInput');

  const grade = gradeInput.value.trim();
  const group = groupInput.value.trim();
  const name = nameInput.value.trim();

  if (!name) return;

  const newClassId = `cls_${Date.now()}`;
  const newClass = {
    id: newClassId,
    name: name,
    grade: grade || 'Uncategorized Grade',
    group: group || 'General Group'
  };

  appState.classes.push(newClass);

  // Automatically create initial default lesson for this class
  const newLessonId = `les_${Date.now()}`;
  const todayStr = new Date().toISOString().split('T')[0];
  appState.lessons.push({
    id: newLessonId,
    classId: newClassId,
    title: 'Lesson 1 - Initial Evaluation & Dictation',
    date: todayStr
  });

  appState.currentClassId = newClassId;
  appState.currentLessonId = newLessonId;

  saveDataToStorage();

  gradeInput.value = '';
  groupInput.value = '';
  nameInput.value = '';

  renderClassList();
  renderApp();
  alert(`Class "${name}" successfully created!`);
}

function deleteClass(classId) {
  if (appState.classes.length <= 1) {
    alert('Cannot delete the only remaining class.');
    return;
  }

  const cls = appState.classes.find(c => c.id === classId);
  if (confirm(`Are you sure you want to delete class "${cls ? cls.name : ''}" and its associated records?`)) {
    appState.classes = appState.classes.filter(c => c.id !== classId);
    appState.students = appState.students.filter(s => s.classId !== classId);
    appState.lessons = appState.lessons.filter(l => l.classId !== classId);

    if (appState.currentClassId === classId) {
      appState.currentClassId = appState.classes[0].id;
      const classLessons = appState.lessons.filter(l => l.classId === appState.currentClassId);
      if (classLessons.length > 0) appState.currentLessonId = classLessons[0].id;
    }

    saveDataToStorage();
    renderClassList();
    renderApp();
  }
}

function populateStudentClassSelect() {
  const select = document.getElementById('studentClassSelect');
  if (!select) return;
  select.innerHTML = '';

  appState.classes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === appState.currentClassId) opt.selected = true;
    select.appendChild(opt);
  });
}

/* ==========================================================================
   FORM HANDLERS
   ========================================================================== */
function handleAddStudent(e) {
  e.preventDefault();
  const nameInput = document.getElementById('studentNameInput');
  const classSelect = document.getElementById('studentClassSelect');
  const dictInput = document.getElementById('studentInitialDictation');

  const name = nameInput.value.trim();
  if (!name) return;

  const targetClassId = classSelect ? classSelect.value : appState.currentClassId;

  const newStudentId = `std_${Date.now()}`;
  appState.students.push({
    id: newStudentId,
    classId: targetClassId,
    name: name
  });

  let initialDictation = parseFloat(dictInput.value);
  if (isNaN(initialDictation)) initialDictation = 0;

  // Make sure lesson exists for target class
  let lessonId = appState.currentLessonId;
  if (targetClassId !== appState.currentClassId) {
    const classLessons = appState.lessons.filter(l => l.classId === targetClassId);
    if (classLessons.length > 0) {
      lessonId = classLessons[0].id;
    }
  }

  const evalKey = `${lessonId}_${newStudentId}`;
  appState.evaluations[evalKey] = {
    dictationMark: initialDictation,
    criteria: { attendance: true, hw: true, listening: true, reading: true, speaking: true, writing: true, video: true },
    notes: ''
  };

  saveDataToStorage();
  nameInput.value = '';
  dictInput.value = '';
  closeModal('addStudentModal');
  renderTable();
  updateStatsSummary();
}

function handleAddLesson(e) {
  e.preventDefault();
  const titleInput = document.getElementById('lessonTitleInput');
  const dateInput = document.getElementById('newLessonDate');

  const title = titleInput.value.trim();
  const date = dateInput.value;
  if (!title || !date) return;

  const newLessonId = `les_${Date.now()}`;
  appState.lessons.push({
    id: newLessonId,
    classId: appState.currentClassId,
    title: title,
    date: date
  });

  appState.currentLessonId = newLessonId;

  saveDataToStorage();
  titleInput.value = '';
  closeModal('addLessonModal');
  renderApp();
}

function handleSaveSettings(e) {
  e.preventDefault();
  const centerName = document.getElementById('settingCenterName').value.trim();
  const passcode = document.getElementById('settingPasscode').value.trim();
  const maxScore = parseInt(document.getElementById('settingMaxScore').value, 10);

  if (centerName) appState.centerName = centerName;
  if (passcode && passcode.length === 4) appState.passcode = passcode;
  if (maxScore) appState.maxDictationScore = maxScore;

  saveDataToStorage();
  closeModal('settingsModal');
  renderApp();
}

function deleteStudent(studentId) {
  if (confirm('Are you sure you want to remove this student?')) {
    appState.students = appState.students.filter(s => s.id !== studentId);
    saveDataToStorage();
    renderTable();
    updateStatsSummary();
  }
}

/* ==========================================================================
   ANALYTICS & EXPORT UTILITIES
   ========================================================================== */
function openAnalyticsModal() {
  const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId);
  const currentLesson = appState.lessons.find(l => l.id === appState.currentLessonId);

  const container = document.getElementById('analyticsBody');
  if (currentStudents.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No student data available for analytics.</p>';
    openModal('analyticsModal');
    return;
  }

  // Calculate Breakdown for each of the 7 criteria
  const skillStats = {};
  CRITERIA_KEYS.forEach(c => { skillStats[c.id] = 0; });

  currentStudents.forEach(s => {
    const evalKey = `${appState.currentLessonId}_${s.id}`;
    const ev = appState.evaluations[evalKey];
    if (ev && ev.criteria) {
      CRITERIA_KEYS.forEach(c => {
        if (ev.criteria[c.id]) skillStats[c.id]++;
      });
    }
  });

  let skillBarsHTML = '';
  CRITERIA_KEYS.forEach(c => {
    const count = skillStats[c.id];
    const pct = Math.round((count / currentStudents.length) * 100);
    skillBarsHTML += `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
          <span><i class="fa-solid ${c.icon}"></i> ${c.label}</span>
          <span>${count} / ${currentStudents.length} (${pct}%)</span>
        </div>
        <div style="width: 100%; background: var(--bg-input); height: 10px; border-radius: 5px; overflow: hidden;">
          <div style="width: ${pct}%; background: var(--primary); height: 100%; border-radius: 5px; transition: width 0.4s;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h4>Lesson Summary: ${escapeHtml(currentLesson ? currentLesson.title : '')}</h4>
      <p style="font-size: 13px; color: var(--text-muted);">Class Evaluation & Skill Mastery Distribution</p>
    </div>
    ${skillBarsHTML}
  `;

  openModal('analyticsModal');
}

function exportToCSV() {
  const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId);
  const currentLesson = appState.lessons.find(l => l.id === appState.currentLessonId);

  if (currentStudents.length === 0) {
    alert('No data to export.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += `Student Name,Dictation Mark (/${appState.maxDictationScore}),Attendance,HW,Listening,Reading,Speaking,Writing,Video,Notes\n`;

  currentStudents.forEach(s => {
    const evalKey = `${appState.currentLessonId}_${s.id}`;
    const ev = appState.evaluations[evalKey] || { dictationMark: 0, criteria: {}, notes: '' };
    const cr = ev.criteria || {};

    const row = [
      `"${s.name.replace(/"/g, '""')}"`,
      ev.dictationMark || 0,
      cr.attendance ? 'YES' : 'NO',
      cr.hw ? 'YES' : 'NO',
      cr.listening ? 'YES' : 'NO',
      cr.reading ? 'YES' : 'NO',
      cr.speaking ? 'YES' : 'NO',
      cr.writing ? 'YES' : 'NO',
      cr.video ? 'YES' : 'NO',
      `"${(ev.notes || '').replace(/"/g, '""')}"`
    ];

    csvContent += row.join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Report_${currentLesson ? currentLesson.title.replace(/[^a-zA-Z0-9]/g, '_') : 'lesson'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helpers
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
