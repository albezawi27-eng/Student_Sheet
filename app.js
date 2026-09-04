/* ==========================================================================
   1. GLOBAL CONFIGURATION & SERVICE INITIALIZATION
   ========================================================================== */
   window.DEFAULT_PASSCODE = '1234'; 
   window.DEFAULT_CENTER_NAME = 'My Community Center';
   
   const SUPABASE_URL = 'https://zvqxydftgxoeagmxqupx.supabase.co';
   const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mxUxGtfnAAlsN1KR_45j-Q_kAWtDrIo';
   
   if (!window.supabaseClientInstance) {
     window.supabaseClientInstance = window.supabase.createClient(
       SUPABASE_URL,
       SUPABASE_PUBLISHABLE_KEY
     );
   }
   
   var supabase = window.supabaseClientInstance;
   
   let appState = {
     isUnlocked: false,
     passcode: window.DEFAULT_PASSCODE,
     centerName: window.DEFAULT_CENTER_NAME,
     classes: [],
     lessons: [],
     students: [],
     evaluations: {},
     theme: 'light',
     maxDictationScore: 10,
     currentClassId: '',
     currentLessonId: ''
   };
   
   const CRITERIA_KEYS = [
     { id: 'attendance', label: 'Attendance', icon: 'fa-user-check' },
     { id: 'hw', label: 'H.W.', icon: 'fa-book-bookmark' },
     { id: 'listening', label: 'Listening', icon: 'fa-headphones' },
     { id: 'reading', label: 'Reading', icon: 'fa-book-open-reader' },
     { id: 'speaking', label: 'Speaking', icon: 'fa-comments' },
     { id: 'writing', label: 'Writing', icon: 'fa-pen-to-square' },
     { id: 'video', label: 'Video', icon: 'fa-video' }
   ];
   
   let currentEnteredPasscode = '';
/* ==========================================================================
   2. APPLICATION LIFECYCLE INITIALIZER
   ========================================================================== */
   document.addEventListener('DOMContentLoaded', async () => {
    await loadDataFromStorage();
    setupRealtimeSync();
    setupEventListeners();
  });
  
  /* ==========================================================================
     3. DATA PERSISTENCE & STORAGE UTILITIES
     ========================================================================== */
  function setupRealtimeSync() {
    supabase
      .channel('app-state-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.1' },
        (payload) => {
          console.log('Realtime update received:', payload);
          const remoteState = payload.new.data;
          if (!remoteState) return;
          appState = { ...appState, ...remoteState };
          renderApp();
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });
  }
  
  async function loadDataFromStorage() {
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('data')
        .eq('id', 1)
        .maybeSingle();
  
      if (error) {
        console.error('Failed to load app state:', error);
        return;
      }
  
      if (data && data.data) {
        appState = { ...appState, ...data.data };
      } else {
        console.log('No database records found. Initializing empty frames.');
        appState.classes = appState.classes || [];
        appState.lessons = appState.lessons || [];
        appState.students = appState.students || [];
        appState.evaluations = appState.evaluations || {};
      }
      console.log('App state processed successfully');
    } catch (error) {
      console.error('Supabase load error:', error);
    }
  }
  async function saveDataToStorage() {
    try {
      const sharedState = { ...appState };
      const { error } = await supabase
        .from('app_state')
        .upsert(
          { id: 1, data: sharedState, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
  
      if (error) {
        console.error('Failed to save app state:', error);
        return;
      }
      console.log('App state saved to Supabase');
    } catch (error) {
      console.error('Supabase save error:', error);
    }
  }
  
  function loadSampleData() {
    appState.centerName = window.DEFAULT_CENTER_NAME;
    appState.passcode = window.DEFAULT_PASSCODE;
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
  
  async function loginStaff(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { console.error(error); alert('Invalid email or password'); return false; }
    return true;
  }
  
  function handlePasscodeVal(val) {}
  function updatePasscodeDots() {}
  
  function showAuthOverlay() {
    currentEnteredPasscode = '';
    const passInput = document.getElementById('passcodeInputField');
    if (passInput) { passInput.value = ''; setTimeout(() => passInput.focus(), 100); }
    const overlay = document.getElementById('authOverlay');
    if (overlay) { overlay.style.display = 'flex'; overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto'; }
  }
  
  function hideAuthOverlay() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) { overlay.style.display = 'none'; overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none'; }
  }
  
  function renderApp() {
    document.getElementById('centerTitleHeading').textContent = appState.centerName;
    document.documentElement.setAttribute('data-theme', appState.theme || 'light');
    renderClassSelector(); renderLessonSelector(); renderTable(); updateStatsSummary();
  }
  function renderClassSelector() {
    const select = document.getElementById('classSelect'); if (!select) return;
    select.innerHTML = ''; if (!appState.classes || appState.classes.length === 0) return;
    appState.classes.forEach(c => {
      const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name;
      if (c.id === appState.currentClassId) opt.selected = true; select.appendChild(opt);
    });
  }
  
  function renderLessonSelector() {
    const select = document.getElementById('lessonSelect'); if (!select) return;
    select.innerHTML = ''; if (!appState.lessons || appState.lessons.length === 0) return;
    const classLessons = appState.lessons.filter(l => l.classId === appState.currentClassId);
    classLessons.forEach(l => {
      const opt = document.createElement('option'); opt.value = l.id; opt.textContent = l.title + ' (' + l.date + ')';
      if (l.id === appState.currentLessonId) opt.selected = true; select.appendChild(opt);
    });
    const currLesson = appState.lessons.find(l => l.id === appState.currentLessonId);
    if (currLesson) { document.getElementById('lessonDatePicker').value = currLesson.date; }
  }
  
  function renderTable() {
    const tbody = document.getElementById('evalTableBody'); if (!tbody) return; tbody.innerHTML = '';
    if (!appState.students || appState.students.length === 0 || !appState.currentClassId) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No student records found.</td></tr>';
      return;
    }
    const searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();
    const filteredStudents = appState.students.filter(s => s.classId === appState.currentClassId).filter(s => s.name.toLowerCase().includes(searchFilter));
  
    filteredStudents.forEach((student, idx) => {
      const evalKey = appState.currentLessonId + '_' + student.id;
      if (!appState.evaluations[evalKey]) {
        appState.evaluations[evalKey] = { dictationMark: 0, criteria: { attendance: true, hw: false, listening: false, reading: false, speaking: false, writing: false, video: false }, notes: '' };
      }
      const evalData = appState.evaluations[evalKey]; const tr = document.createElement('tr');
      const initials = student.name.split(' ').map(n => n).join('').substring(0, 2).toUpperCase(); const gradeObj = calculateGrade(evalData.dictationMark);
      let criteriaHTML = '<div class="criteria-pills-group">';
      CRITERIA_KEYS.forEach(c => {
        const isActive = evalData.criteria && evalData.criteria[c.id];
        criteriaHTML += '<div class="criteria-pill ' + (isActive ? 'active' : '') + '" onclick="toggleCriteria(\'' + student.id + '\', \'' + c.id + '\')"><span class="check-icon">' + (isActive ? '✔' : '') + '</span><i class="fa-solid ' + c.icon + '"></i><span>' + c.label + '</span></div>';
      });
      criteriaHTML += '</div>';
  
      tr.innerHTML = '<td>' + (idx + 1) + '</td>' +
        '<td><div class="student-profile"><div class="avatar-circle">' + initials + '</div><span>' + escapeHtml(student.name) + '</span></div></td>' +
        '<td><div class="dictation-input-wrap"><input type="number" step="0.5" class="dictation-input" value="' + (evalData.dictationMark !== undefined ? evalData.dictationMark : '') + '" onchange="updateDictationMark(\'' + student.id + '\', this.value)"><span class="max-score-tag">/' + appState.maxDictationScore + '</span></div></td>' +
        '<td>' + criteriaHTML + '</td>' +
        '<td><span class="badge-grade ' + gradeObj.cssClass + '">' + gradeObj.label + '</span></td>' +
        '<td><input type="text" class="notes-input" value="' + escapeHtml(evalData.notes || '') + '" onchange="updateStudentNotes(\'' + student.id + '\', this.value)"></td>' +
        '<td style="text-align: right;">' +
'<button class="btn btn-secondary student-report-btn" data-student-id="' + student.id + '">Report</button>' +
'<button class="btn-icon" style="color: red;" onclick="deleteStudent(\'' + student.id + '\')"><i class="fa-solid fa-trash-can"></i></button>' +
'</td>';
      tbody.appendChild(tr);
      const reportButton = tr.querySelector('.student-report-btn');

if (reportButton) {
  reportButton.addEventListener('click', () => {
    openReportModal(reportButton.dataset.studentId);
  });
}
    });
  }
  
  function calculateGrade(mark) {
    const percentage = (mark / appState.maxDictationScore) * 100;
    if (percentage >= 90) return { label: 'Excellent (A+)', cssClass: 'excellent' };
    if (percentage >= 75) return { label: 'Good (B)', cssClass: 'good' };
    return { label: 'Needs Improvement', cssClass: 'needs-work' };
  }
  function toggleCriteria(studentId, criteriaKey) {
    const evalKey = appState.currentLessonId + '_' + studentId; if (!appState.evaluations[evalKey]) return;
    if (!appState.evaluations[evalKey].criteria) appState.evaluations[evalKey].criteria = {};
    appState.evaluations[evalKey].criteria[criteriaKey] = !appState.evaluations[evalKey].criteria[criteriaKey];
    saveDataToStorage(); renderTable(); updateStatsSummary();
  }
  
  function updateDictationMark(studentId, val) {
    const evalKey = appState.currentLessonId + '_' + studentId; if (!appState.evaluations[evalKey]) return;
    let num = parseFloat(val); if (isNaN(num)) num = 0; if (num < 0) num = 0; if (num > appState.maxDictationScore) num = appState.maxDictationScore;
    appState.evaluations[evalKey].dictationMark = num; saveDataToStorage(); renderTable(); updateStatsSummary();
  }
  
  function updateStudentNotes(studentId, text) {
    const evalKey = appState.currentLessonId + '_' + studentId;
    if (appState.evaluations[evalKey]) { appState.evaluations[evalKey].notes = text; saveDataToStorage(); }
  }
  
  function updateStatsSummary() {
    const countEl = document.getElementById('statStudentCount'); if (!countEl) return;
    const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId); const count = currentStudents.length; countEl.textContent = count;
    if (count === 0) { document.getElementById('statDictationAvg').textContent = '0 / ' + appState.maxDictationScore; document.getElementById('statSkillPassRate').textContent = '0%'; document.getElementById('statAttendanceRate').textContent = '0%'; return; }
    let totalDict = 0; let totalSkills = 0; let totalPossible = count * CRITERIA_KEYS.length; let attended = 0;
    currentStudents.forEach(s => {
      const ev = appState.evaluations[appState.currentLessonId + '_' + s.id];
      if (ev) { totalDict += (ev.dictationMark || 0); if (ev.criteria) { if (ev.criteria.attendance) attended++; CRITERIA_KEYS.forEach(c => { if (ev.criteria[c.id]) totalSkills++; }); } }
    });
    document.getElementById('statDictationAvg').textContent = (totalDict / count).toFixed(1) + ' / ' + appState.maxDictationScore;
    document.getElementById('statSkillPassRate').textContent = Math.round((totalSkills / totalPossible) * 100) + '%';
    document.getElementById('statAttendanceRate').textContent = Math.round((attended / count) * 100) + '%';
  }
  
  function openReportModal(studentId) {
    var student = appState.students.find(function(s) { return s.id === studentId; });
    var currentClass = appState.classes.find(function(c) { return c.id === appState.currentClassId; });
    var currentLesson = appState.lessons.find(function(l) { return l.id === appState.currentLessonId; });
    if (!student || !currentLesson) return;
  
    var evalKey = appState.currentLessonId + '_' + student.id;
    var evalData = appState.evaluations[evalKey] || { dictationMark: 0, criteria: {}, notes: '' };
    var reportContainer = document.getElementById('reportCardContent'); 
    if (!reportContainer) return;
  
    var gradeObj = calculateGrade(evalData.dictationMark);
    var feedback = evalData.notes || 'No special evaluation comments registered for this lesson session.';
    
    var skillsHTML = '';
    CRITERIA_KEYS.forEach(function(c) {
      var isPassed = evalData.criteria && evalData.criteria[c.id];
      var statusText = isPassed ? '✓ Achieved' : '— Pending';
      var statusColor = isPassed ? '#10b981' : '#94a3b8';
      skillsHTML += '<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; margin-bottom: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">' +
          '<span style="font-weight: 600; color: #334155;"><i class="fa-solid ' + c.icon + '" style="margin-right: 8px; color: #3b82f6;"></i>' + c.label + '</span>' +
          '<span style="font-weight: bold; color: ' + statusColor + ';">' + statusText + '</span>' +
        '</div>';
    });
  
    reportContainer.innerHTML = '<div style="background: #ffffff; padding: 26px; font-family: Arial, sans-serif; border-radius: 12px; border: 1px solid #cbd5e1; color: #1e293b;">' +
        '<h3 style="text-align: center; margin-top: 0; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">' + escapeHtml(appState.centerName) + ' Evaluation Card</h3>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; font-size: 13px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">' +
          '<div><strong>Student Name:</strong> ' + escapeHtml(student.name) + '</div>' +
          '<div><strong>Class Group:</strong> ' + escapeHtml(currentClass ? currentClass.name : 'General Log') + '</div>' +
          '<div><strong>Lesson Topic:</strong> ' + escapeHtml(currentLesson.title) + '</div>' +
          '<div><strong>Session Date:</strong> ' + currentLesson.date + '</div>' +
        '</div>' +
        '<div style="margin: 16px 0; background: #ecfdf5; border: 2px solid #10b981; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">' +
          '<div><span style="font-size: 11px; color: #047857; font-weight: bold; display: block; letter-spacing: 0.5px;">DICTATION SCALE MARK</span>' +
          '<strong style="font-size: 26px; color: #059669;">' + evalData.dictationMark + ' / ' + appState.maxDictationScore + '</strong></div>' +
          '<div style="background: #10b981; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; text-transform: uppercase;">' + gradeObj.label + '</div>' +
        '</div>' +
        '<h4 style="margin: 18px 0 10px; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Core Metrics Status Checklist</h4>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px;">' + skillsHTML + '</div>' +
        '<h4 style="margin: 0 0 6px; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Teacher Performance Logs & Notes</h4>' +
        '<div style="background: #f1f5f9; padding: 14px; border-left: 4px solid #2563eb; border-radius: 4px; font-style: italic; font-size: 13px; color: #334155; line-height: 1.6;">"' + escapeHtml(feedback) + '"</div>' +
      '</div>';
  
      const copyReportButton = document.getElementById('btnCopyReportText');

      if (copyReportButton) {
        copyReportButton.dataset.shareText =
          "🎓 Report Card: " + student.name +
          " \n✍️ Dictation Score: " +
          evalData.dictationMark + "/" +
          appState.maxDictationScore +
          " (" + gradeObj.label + ")";
      }
      
      openModal('reportModal');
  
  
  function openGlobalReportModal() {
    var currentStudents = appState.students.filter(function(s) { return s.classId === appState.currentClassId; });
    var currentClass = appState.classes.find(function(c) { return c.id === appState.currentClassId; });
    var currentLesson = appState.lessons.find(function(l) { return l.id === appState.currentLessonId; });
    if (currentStudents.length === 0) { alert('No student log records discovered for this class framework.'); return; }
    
    var rows = '';
    currentStudents.forEach(function(student, idx) {
      var evalKey = appState.currentLessonId + '_' + student.id; 
      var ev = appState.evaluations[evalKey] || { dictationMark: 0, criteria: {}, notes: '' };
      var gradeObj = calculateGrade(ev.dictationMark); 
      var cr = ev.criteria || {};
  
      rows += '<tr style="background: ' + (idx % 2 === 0 ? '#ffffff' : '#f8fafc') + ';">' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; padding: 10px; font-weight: bold; color: #64748b;">' + (idx + 1) + '</td>' +
        '<td style="border: 1px solid #cbd5e1; padding: 10px; font-weight: 700; color: #0f172a; font-size: 13px;">' + escapeHtml(student.name) + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; padding: 10px; font-weight: 800; color: #059669; font-size: 13px; background: #f0fdf4;">' + (ev.dictationMark || 0) + ' / ' + appState.maxDictationScore + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; font-size: 15px; font-weight: bold; color: #10b981;">' + (cr.attendance ? '✓' : '—') + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; font-size: 15px; font-weight: bold; color: #10b981;">' + (cr.hw ? '✓' : '—') + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; font-size: 15px; font-weight: bold; color: #2563eb;">' + (cr.listening ? '✓' : '—') + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; font-size: 15px; font-weight: bold; color: #2563eb;">' + (cr.reading ? '✓' : '—') + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; font-size: 15px; font-weight: bold; color: #2563eb;">' + (cr.speaking ? '✓' : '—') + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; font-size: 15px; font-weight: bold; color: #2563eb;">' + (cr.writing ? '✓' : '—') + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; font-size: 15px; font-weight: bold; color: #2563eb;">' + (cr.video ? '✓' : '—') + '</td>' +
        '<td style="border: 1px solid #cbd5e1; text-align: center; padding: 10px;"><span class="badge-grade ' + gradeObj.cssClass + '" style="font-size: 11px; font-weight: bold; text-transform: uppercase;">' + gradeObj.label + '</span></td>' +
        '<td style="border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; color: #475569; font-style: italic; max-width: 200px; word-wrap: break-word;">' + escapeHtml(ev.notes || '—') + '</td>' +
      '</tr>';
    });
  
    var element = document.getElementById('globalReportCardContent'); 
    if (!element) return;
    
    element.innerHTML = '<div style="background: #ffffff; padding: 24px; font-family: Arial, sans-serif; color: #0f172a;">' +
        '<div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #0f172a; margin-bottom: 16px;">' +
          '<div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">' + escapeHtml(appState.centerName) + '</div>' +
          '<div style="font-size: 11px; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase;">Master Spreadsheet Lesson Summary Log</div>' +
        '</div>' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; font-size: 13px; background: #f1f5f9; padding: 12px 18px; border-radius: 6px; border: 1px solid #e2e8f0; color: #334155;">' +
          '<div><strong>Class Group Log:</strong> ' + escapeHtml(currentClass ? currentClass.name : 'General Framework') + '</div>' +
          '<div><strong>Lesson Evaluated:</strong> ' + escapeHtml(currentLesson ? currentLesson.title : 'Evaluation Topic') + '</div>' +
          '<div><strong>Session Tracking Date:</strong> ' + (currentLesson ? currentLesson.date : '') + '</div>' +
        '</div>' +
        '<table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">' +
          '<thead>' +
            '<tr style="background: #0f172a; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: center;">' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 35px;">#</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 8px; text-align: left; width: 220px;">Student Roster Name</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 95px;">Dictation Mark</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 45px;">Att</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 45px;">HW</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 45px;">List</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 45px;">Read</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 45px;">Speak</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 45px;">Write</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 4px; width: 45px;">Vid</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 6px; width: 140px;">Performance Status</th>' +
              '<th style="border: 1px solid #334155; padding: 12px 8px; text-align: left;">Teacher Evaluation Feedback Notes</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  
    element.dataset.className = currentClass ? currentClass.name : 'Class';
    element.dataset.lessonTitle = currentLesson ? currentLesson.title : 'Lesson';
    openModal('globalReportModal');
  }
  
  
  function downloadGlobalClassPDF() {
    const element = document.getElementById('globalReportCardContent'); if (!element) return;
    const opt = { margin: 6, filename: 'Global_Class_Report_' + (element.dataset.className || 'Class') + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    if (typeof html2pdf !== 'undefined') { html2pdf().set(opt).from(element).save(); } else { window.print(); }
  }
  function openAnalyticsModal() {
    const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId); const container = document.getElementById('analyticsBody'); if (!container) return;
    if (currentStudents.length === 0) { container.innerHTML = '<p>No entry log found.</p>'; openModal('analyticsModal'); return; }
    const skillStats = {}; CRITERIA_KEYS.forEach(c => { skillStats[c.id] = 0; });
    currentStudents.forEach(s => { const ev = appState.evaluations[appState.currentLessonId + '_' + s.id]; if (ev && ev.criteria) { CRITERIA_KEYS.forEach(c => { if (ev.criteria[c.id]) skillStats[c.id]++; }); } });
    let bars = ''; CRITERIA_KEYS.forEach(c => { const count = skillStats[c.id]; const pct = Math.round((count / currentStudents.length) * 100); bars += '<div style="margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; font-size: 12px;"><span>' + c.label + '</span><span>' + count + ' (' + pct + '%)</span></div><div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;"><div style="width: ' + pct + '%; background: #10b981; height: 100%;"></div></div></div>'; });
    container.innerHTML = '<h4>Progress Metric Distribution</h4>' + bars; openModal('analyticsModal');
  }
  
  function exportToCSV() {
    const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId); if (currentStudents.length === 0) { alert('No student records found.'); return; }
    let csv = 'data:text/csv;charset=utf-8,Name,Score,Attendance,HW,Notes\n';
    currentStudents.forEach(s => { const ev = appState.evaluations[appState.currentLessonId + '_' + s.id] || {}; const cr = ev.criteria || {}; csv += '"' + s.name.replace(/"/g, '""') + '",' + (ev.dictationMark || 0) + ',' + (cr.attendance ? 'YES' : 'NO') + ',' + (cr.hw ? 'YES' : 'NO') + ',"' + (ev.notes || '').replace(/"/g, '""') + '"\n'; });
    const link = document.createElement('a'); link.setAttribute('href', encodeURI(csv)); link.setAttribute('download', 'Class_Report.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }
  function renderClassList() {
    const container = document.getElementById('classListContainer'); if (!container) return; container.innerHTML = ''; if (!appState.classes || appState.classes.length === 0) { container.innerHTML = '<p>No classes created.</p>'; return; }
    appState.classes.forEach(c => { const count = appState.students.filter(s => s.classId === c.id).length; const div = document.createElement('div'); div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #e2e8f0;'; div.innerHTML = '<div><strong>' + escapeHtml(c.name) + '</strong><div>' + count + ' Students</div></div><button class="btn-icon" style="color: red;" onclick="deleteClass(\'' + c.id + '\')"><i class="fa-solid fa-trash-can"></i></button>'; container.appendChild(div); });
  }
  
  function handleAddClass(e) {
    e.preventDefault(); const name = document.getElementById('newClassNameInput').value.trim(); if (!name) return;
    const newClassId = 'cls_' + Date.now(); appState.classes.push({ id: newClassId, name: name, grade: 'General', group: 'General' });
    const newLessonId = 'les_' + Date.now(); appState.lessons.push({ id: newLessonId, classId: newClassId, title: 'Lesson 1',date: new Date().toISOString().split('T')[0],time: new Date().toISOString().split('T')[1] });
    appState.currentClassId = newClassId; appState.currentLessonId = newLessonId; saveDataToStorage(); closeModal('manageClassesModal'); renderApp();
  }
  
  // Fixed class removal frame rules mapping system safely
  function deleteClass(classId) {
    if (appState.classes.length <= 1) { alert('Cannot remove single remaining class container.'); return; }
    if (confirm('Delete this class framework log?')) { appState.classes = appState.classes.filter(c => c.id !== classId); appState.students = appState.students.filter(s => s.classId !== classId); appState.lessons = appState.lessons.filter(l => l.classId !== classId); appState.currentClassId = appState.classes[0].id; const left = appState.lessons.filter(l => l.classId === appState.currentClassId); if (left.length > 0) appState.currentLessonId = left[0].id; saveDataToStorage(); renderClassList(); renderApp(); }
  }
  
  function populateStudentClassSelect() {
    const select = document.getElementById('studentClassSelect'); if (!select) return; if (!appState.classes || appState.classes.length === 0) { alert("Construct class structure log sheets first."); return; }
    select.innerHTML = ''; appState.classes.forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; if (c.id === appState.currentClassId) opt.selected = true; select.appendChild(opt); });
  }
  
  function handleAddStudent(e) {
    e.preventDefault(); const name = document.getElementById('studentNameInput').value.trim(); if (!name) return;
    const newStudentId = 'std_' + Date.now(); appState.students.push({ id: newStudentId, classId: appState.currentClassId, name: name });
    appState.evaluations[appState.currentLessonId + '_' + newStudentId] = { dictationMark: parseFloat(document.getElementById('studentInitialDictation').value) || 0, criteria: { attendance: true, hw: true, listening: true, reading: true, speaking: true, writing: true, video: true }, notes: '' };
    saveDataToStorage(); closeModal('addStudentModal'); renderTable(); updateStatsSummary();
  }
  
  function handleAddLesson(e) {
    e.preventDefault(); const title = document.getElementById('lessonTitleInput').value.trim(); const date = document.getElementById('newLessonDate').value; if (!title || !date) return;
    const newLessonId = 'les_' + Date.now(); appState.lessons.push({ id: newLessonId, classId: appState.currentClassId, title: title, date: date });
    appState.currentLessonId = newLessonId; saveDataToStorage(); closeModal('addLessonModal'); renderApp();
  }
  
  function handleSaveSettings(e) {
    e.preventDefault(); appState.centerName = document.getElementById('settingCenterName').value.trim(); appState.passcode = document.getElementById('settingPasscode').value.trim() || '1234'; appState.maxDictationScore = parseInt(document.getElementById('settingMaxScore').value, 10) || 10;
    saveDataToStorage(); closeModal('settingsModal'); renderApp();
  }
  
  function deleteStudent(studentId) { if (confirm('Remove profile?')) { appState.students = appState.students.filter(s => s.id !== studentId); saveDataToStorage(); renderTable(); updateStatsSummary(); } }
  function setupEventListeners() {
    const authForm = document.getElementById('authForm'); if (authForm) { authForm.addEventListener('submit', async (e) => { e.preventDefault(); const success = await loginStaff(document.getElementById('emailInput').value.trim(), document.getElementById('passwordInput').value); if (success) { hideAuthOverlay(); await loadDataFromStorage(); renderApp(); } else { alert('Invalid credentials'); } }); }
    const btnSettings = document.getElementById('btnSettings'); if (btnSettings) { btnSettings.addEventListener('click', () => { document.getElementById('settingCenterName').value = appState.centerName || ''; openModal('settingsModal'); }); }
    const btnManageClasses = document.getElementById('btnManageClasses'); if (btnManageClasses) { btnManageClasses.addEventListener('click', () => { renderClassList(); openModal('manageClassesModal'); }); }
    const btnAddStudent = document.getElementById('btnAddStudent'); if (btnAddStudent) { btnAddStudent.addEventListener('click', () => { populateStudentClassSelect(); openModal('addStudentModal'); }); }
    const btnNewLesson = document.getElementById('btnNewLesson'); if (btnNewLesson) { btnNewLesson.addEventListener('click', () => { document.getElementById('newLessonDate').value = new Date().toISOString().split('T'); openModal('addLessonModal'); }); }
    document.getElementById('classSelect').addEventListener('change', (e) => { appState.currentClassId = e.target.value; const cl = appState.lessons.filter(l => l.classId === appState.currentClassId); if (cl.length > 0) appState.currentLessonId = cl[0].id; saveDataToStorage(); renderApp(); });
    document.getElementById('lessonSelect').addEventListener('change', (e) => { appState.currentLessonId = e.target.value; saveDataToStorage(); renderApp(); });
    document.getElementById('searchInput').addEventListener('input', renderTable);
    if (document.getElementById('addClassForm')) document.getElementById('addClassForm').addEventListener('submit', handleAddClass);
    if (document.getElementById('addStudentForm')) document.getElementById('addStudentForm').addEventListener('submit', handleAddStudent);
    if (document.getElementById('addLessonForm')) document.getElementById('addLessonForm').addEventListener('submit', handleAddLesson);
    if (document.getElementById('settingsForm')) document.getElementById('settingsForm').addEventListener('submit', handleSaveSettings);
    document.getElementById('btnThemeToggle').addEventListener('click', () => { appState.theme = appState.theme === 'dark' ? 'light' : 'dark'; saveDataToStorage(); renderApp(); });
    document.getElementById('btnLock').addEventListener('click', () => { appState.isUnlocked = false; showAuthOverlay(); });
  
    const exitTriggers = [
      { btnId: 'btnCloseSettingsModal', modalId: 'settingsModal' }, { btnId: 'btnCancelSettings', modalId: 'settingsModal' },
      { btnId: 'btnCloseManageClassesModal', modalId: 'manageClassesModal' }, { btnId: 'btnCloseClassesFooter', modalId: 'manageClassesModal' },
      { btnId: 'btnCloseAddStudentModal', modalId: 'addStudentModal' }, { btnId: 'btnCancelAddStudent', modalId: 'addStudentModal' },
      { btnId: 'btnCloseAddLessonModal', modalId: 'addLessonModal' }, { btnId: 'btnCancelAddLesson', modalId: 'addLessonModal' },
      { btnId: 'btnCloseReportModal', modalId: 'reportModal' }, { btnId: 'btnCloseGlobalReportModal', modalId: 'globalReportModal' },
      { btnId: 'btnCloseAnalyticsModal', modalId: 'analyticsModal' }
    ];
    exitTriggers.forEach(t => { const el = document.getElementById(t.btnId); if (el) { el.addEventListener('click', (e) => { e.stopPropagation(); closeModal(t.modalId); }); } });
  
    document.getElementById('btnResetSampleData').addEventListener('click', () => { if (confirm('Load mockup profiles?')) { loadSampleData(); closeModal('settingsModal'); renderApp(); } });
    document.getElementById('btnClearAllData').addEventListener('click', () => { if (confirm('Clear workspace?')) { appState.students = []; appState.classes = []; appState.lessons = []; appState.evaluations = {}; saveDataToStorage(); closeModal('settingsModal'); renderApp(); } });
    document.getElementById('btnExportCSV').addEventListener('click', exportToCSV);
    if (document.getElementById('btnDownloadClassPDF')) document.getElementById('btnDownloadClassPDF').addEventListener('click', openGlobalReportModal);
    if (document.getElementById('btnAnalytics')) document.getElementById('btnAnalytics').addEventListener('click', openAnalyticsModal);
    const btnDownloadGlobalPDF = document.getElementById('btnDownloadGlobalPDF'); if (btnDownloadGlobalPDF) { btnDownloadGlobalPDF.addEventListener('click', downloadGlobalClassPDF); }
  }
  
  function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('active'); }
  function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('active'); }
  function escapeHtml(str) { return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  window.openReportModal = openReportModal;
window.openGlobalReportModal = openGlobalReportModal;
window.openAnalyticsModal = openAnalyticsModal;
window.openModal = openModal;
window.closeModal = closeModal;}