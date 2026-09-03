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
   
   // Clean workspace definition defaults to shield against empty database returns
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
         console.log('No database records found. Ready to initialize clean dashboard frames.');
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
   
   /* ==========================================================================
      4. AUTHENTICATION & ACCESS CONTROL
      ========================================================================== */
   async function loginStaff(email, password) {
     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
     if (error) {
       console.error(error);
       alert('Invalid email or password');
       return false;
     }
     return true;
   }
   
   function handlePasscodeVal(val) {
     window.numpadPress(val);
   }
   
   function updatePasscodeDots() {}
   
   function showAuthOverlay() {
     currentEnteredPasscode = '';
     const passInput = document.getElementById('passcodeInputField');
     if (passInput) {
       passInput.value = '';
       setTimeout(() => passInput.focus(), 100);
     }
   
     const overlay = document.getElementById('authOverlay');
     if (overlay) {
       overlay.style.display = 'flex';
       overlay.style.opacity = '1';
       overlay.style.pointerEvents = 'auto';
     }
   }
   
   function hideAuthOverlay() {
     const overlay = document.getElementById('authOverlay');
     if (overlay) {
       overlay.style.display = 'none';
       overlay.style.opacity = '0';
       overlay.style.pointerEvents = 'none';
     }
   }
   
   /* ==========================================================================
      5. INTERFACE VIEW GENERATOR CONTROLLERS
      ========================================================================== */
   function renderApp() {
     document.getElementById('centerTitleHeading').textContent = appState.centerName;
     document.documentElement.setAttribute('data-theme', appState.theme || 'light');
   
     renderClassSelector();
     renderLessonSelector();
     renderTable();
     updateStatsSummary();
   }
   
   function renderClassSelector() {
     const select = document.getElementById('classSelect');
     if (!select) return;
     select.innerHTML = '';
     
     if (!appState.classes || appState.classes.length === 0) return;
   
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
     if (!select) return;
     select.innerHTML = '';
   
     if (!appState.lessons || appState.lessons.length === 0) return;
   
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
     if (!tbody) return;
     tbody.innerHTML = '';
   
     if (!appState.students || appState.students.length === 0 || !appState.currentClassId) {
       tbody.innerHTML = `
         <tr>
           <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
             <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
             No student evaluation records found. Click "Add Student" above or open settings to populate demonstration logs.
           </td>
         </tr>
       `;
       return;
     }
   
     const searchFilter = document.getElementById('searchInput').value.toLowerCase().trim();
     const filteredStudents = appState.students
       .filter(s => s.classId === appState.currentClassId)
       .filter(s => s.name.toLowerCase().includes(searchFilter));
   
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
       const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
       const gradeObj = calculateGrade(evalData.dictationMark);
   
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
         <td><span class="badge-grade ${gradeObj.cssClass}">${gradeObj.label}</span></td>
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
      6. STATE MUTATIONS & MUTATORS
      ========================================================================== */
   function toggleCriteria(studentId, criteriaKey) {
     const evalKey = `${appState.currentLessonId}_${studentId}`;
     if (!appState.evaluations[evalKey]) return;
     if (!appState.evaluations[evalKey].criteria) appState.evaluations[evalKey].criteria = {};
   
     appState.evaluations[evalKey].criteria[criteriaKey] = !appState.evaluations[evalKey].criteria[criteriaKey];
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
     const countEl = document.getElementById('statStudentCount');
     if (!countEl) return;
   
     const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId);
     const count = currentStudents.length;
     countEl.textContent = count;
   
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
      7. STUDENT PERFORMANCE REPORT ARCHITECTS
      ========================================================================== */
   function openReportModal(studentId) {
     const student = appState.students.find(s => s.id === studentId);
     const currentClass = appState.classes.find(c => c.id === appState.currentClassId);
     const currentLesson = appState.lessons.find(l => l.id === appState.currentLessonId);
   
     if (!student || !currentLesson) return;
   
     const evalKey = `${appState.currentLessonId}_${student.id}`;
     const evalData = appState.evaluations[evalKey] || { dictationMark: 0, criteria: {}, notes: '' };
     const reportContainer = document.getElementById('reportCardContent');
     
     let passedCount = 0;
     CRITERIA_KEYS.forEach(c => {
       if (evalData.criteria && evalData.criteria[c.id]) passedCount++;
     });
   
     const completionPct = Math.round((passedCount / CRITERIA_KEYS.length) * 100);
     const gradeObj = calculateGrade(evalData.dictationMark);
   
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
   
     let skillsHTML = '';
     CRITERIA_KEYS.forEach(c => {
       const isPassed = evalData.criteria && evalData.criteria[c.id];
       skillsHTML += `
         <div style="display: flex; align-items: center; justify-content: space-between; background: \${isPassed ? '#f0fdf4' : '#f8fafc'}; border: 1px solid \${isPassed ? '#86efac' : '#e2e8f0'}; padding: 12px 16px; border-radius: 12px;">
           <div style="display: flex; align-items: center; gap: 10px;">
             <i class="fa-solid \${c.icon}" style="color: \${isPassed ? '#10b981' : '#94a3b8'}; font-size: 15px;"></i>
             <span style="font-weight: 700; font-size: 14px; color: \${isPassed ? '#0f172a' : '#64748b'};">\${c.label}</span>
           </div>
           <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: \ Bell ? '#059669' : '#94a3b8';">
             <span>\${isPassed ? 'Achieved' : 'Pending'}</span>
             <span style="width: 22px; height: 22px; background: 	ext = isPassed ? '#10b981' : '#cbd5e1'; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">
               \${isPassed ? '✔' : '✖'}
             </span>
           </div>
         </div>
       `;
     });
   
     reportContainer.dataset.studentName = student.name;
     reportContainer.dataset.lessonTitle = currentLesson.title;
   
     reportContainer.innerHTML = `
       <div class="report-pdf-wrapper" style="background: #ffffff; color: #0f172a; border-radius: 16px; overflow: hidden; padding-bottom: 24px; font-family: sans-serif; text-align: left;">
         <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #2563eb 100%); padding: 26px 30px; color: #ffffff;">
           <h2 style="margin: 0; font-size: 22px; font-weight: 800;">\${escapeHtml(appState.centerName)}</h2>
           <div style="font-size: 11px; opacity: 0.9; margin-top: 4px;">OFFICIAL PERFORMANCE REPORT CARD</div>
         </div>
         <div style="padding: 24px 30px;">
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; font-size: 14px;">
             <div><strong>Student:</strong> \${escapeHtml(student.name)}</div>
             <div><strong>Class:</strong> \${escapeHtml(currentClass ? currentClass.name : '')}</div>
             <div><strong>Topic:</strong> \${escapeHtml(currentLesson.title)}</div>
             <div><strong>Date:</strong> \${currentLesson.date}</div>
           </div>
           <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
             <div>
               <span style="font-size: 12px; color: #047857; font-weight: bold;">DICTATION MARK</span>
               <div style="font-size: 32px; font-weight: 900; color: #059669;">\${evalData.dictationMark} / \ Professional = appState.maxDictationScore}</div>
             </div>
             <div style="background: #10b981; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-weight: bold;">\${gradeObj.label}</div>
           </div>
           <div style="margin-bottom: 24px;">
             <h4 style="margin-bottom: 12px; font-size: 16px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Core Criteria Checklist</h4>
             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">\${skillsHTML}</div>
           </div>
           <div style="background: #f8fafc; border-left: 5px solid #10b981; padding: 18px; border-radius: 4px; font-size: 14px; line-height: 1.5;">
             <strong>Feedback:</strong> "\${escapeHtml(teacherComment)}"
           </div>
         </div>
       </div>
     `;
   
     const shareText = `🎓 *\${appState.centerName} - Student Report Card*
   
   👤 *Student:* \${student.name}
   📚 *Lesson:* \${currentLesson.title}
   ✍ *Dictation:* \${evalData.dictationMark}/\${appState.maxDictationScore}
   🌟 *Grade:* \${gradeObj.label}
   
   📝 *Notes:* \${teacherComment}`;
     document.getElementById('btnCopyReportText').dataset.shareText = shareText;
   
     openModal('reportModal');
   }
   
   function downloadPDFReport() {
     const element = document.getElementById('reportCardContent');
     const studentName = element.dataset.studentName || 'Student';
     const lessonTitle = element.dataset.lessonTitle || 'Lesson';
   
     const opt = {
       margin: [8, 8, 8, 8],
       filename: `Report_\${studentName.replace(/\s+/g, '_')}_\ Bell = lessonTitle.replace(/\s+/g, '_')}.pdf`,
       image: { type: 'jpeg', quality: 0.98 },
       html2canvas: { scale: 2, useCORS: true, logging: false },
       jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
     };
   
     if (typeof html2pdf !== 'undefined') {
       html2pdf().set(opt).from(element).save();
     } else {
       window.print();
     }
   }
   
   /* ==========================================================================
      8. COMPACT FRAMEWORK MANAGER WINDOWS
      ========================================================================== */
   function openManageClassesModal() {
     renderClassList();
     openModal('manageClassesModal');
   }
   
   function renderClassList() {
     const container = document.getElementById('classListContainer');
     if (!container) return;
     container.innerHTML = '';
   
     if (!appState.classes || appState.classes.length === 0) {
       container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No classes created yet.</p>`;
       return;
     }
   
     appState.classes.forEach(c => {
       const studentCount = appState.students.filter(s => s.classId === c.id).length;
       const div = document.createElement('div');
       div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: var(--bg-input); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 8px;';
       div.innerHTML = `
         <div>
           <div style="font-weight: 700; color: var(--text-main);">\${escapeHtml(c.name)}</div>
           <div style="font-size: 11px; color: #10b981; margin-top: 4px;">\${studentCount} Registered Students</div>
         </div>
         <button class="btn-icon" style="color: var(--accent-rose);" onclick="deleteClass('\${c.id}')"><i class="fa-solid fa-trash-can"></i></button>
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
   
     const newClassId = `cls_\${Date.now()}`;
     appState.classes.push({ id: newClassId, name, grade: grade || 'General', group: group || 'General' });
   
     const newLessonId = `les_\${Date.now()}`;
     appState.lessons.push({ id: newLessonId, classId: newClassId, title: 'Lesson 1 - Evaluation Log', date: new Date().toISOString().split('T')[0] });
   
     appState.currentClassId = newClassId;
     appState.currentLessonId = newLessonId;
   
     saveDataToStorage();
     gradeInput.value = ''; groupInput.value = ''; nameInput.value = '';
     closeModal('manageClassesModal');
     renderApp();
   }
   
   function deleteClass(classId) {
     if (appState.classes.length <= 1) {
       alert('Cannot delete the last existing class frame.');
       return;
     }
     if (confirm('Delete this class and all associated student profiles permanently?')) {
       appState.classes = appState.classes.filter(c => c.id !== classId);
       appState.students = appState.students.filter(s => s.classId !== classId);
       appState.lessons = appState.lessons.filter(l => l.classId !== classId);
       appState.currentClassId = appState.classes[0].id;
       
       const lessonsLeft = appState.lessons.filter(l => l.classId === appState.currentClassId);
       if (lessonsLeft.length > 0) appState.currentLessonId = lessonsLeft[0].id;
   
       saveDataToStorage();
       renderClassList();
       renderApp();
     }
   }
   
   function populateStudentClassSelect() {
     const select = document.getElementById('studentClassSelect');
     if (!select) return;
     
     if (!appState.classes || appState.classes.length === 0) {
       alert("Please open 'Manage Classes' and build your first room log framework before registering profiles.");
       return;
     }
   
     select.innerHTML = '';
     appState.classes.forEach(c => {
       const opt = document.createElement('option');
       opt.value = c.id;
       opt.textContent = c.name;
       if (c.id === appState.currentClassId) opt.selected = true;
       select.appendChild(opt);
     });
   }
   
   function handleAddStudent(e) {
     e.preventDefault();
     const nameInput = document.getElementById('studentNameInput');
     const classSelect = document.getElementById('studentClassSelect');
     const name = nameInput.value.trim();
     if (!name) return;
   
     const targetClassId = classSelect ? classSelect.value : appState.currentClassId;
     const newStudentId = `std_\${Date.now()}`;
     appState.students.push({ id: newStudentId, classId: targetClassId, name });
   
     const evalKey = `${appState.currentLessonId}_\${newStudentId}`;
     appState.evaluations[evalKey] = {
       dictationMark: parseFloat(document.getElementById('studentInitialDictation').value) || 0,
       criteria: { attendance: true, hw: true, listening: true, reading: true, speaking: true, writing: true, video: true },
       notes: ''
     };
   
     saveDataToStorage();
     nameInput.value = '';
     document.getElementById('studentInitialDictation').value = '';
     closeModal('addStudentModal');
     renderTable();
     updateStatsSummary();
   }
   
   function handleAddLesson(e) {
     e.preventDefault();
     const title = document.getElementById('lessonTitleInput').value.trim();
     const date = document.getElementById('newLessonDate').value;
     if (!title || !date) return;
   
     const newLessonId = `les_\${Date.now()}`;
     appState.lessons.push({ id: newLessonId, classId: appState.currentClassId, title, date });
     appState.currentLessonId = newLessonId;
   
     saveDataToStorage();
     document.getElementById('lessonTitleInput').value = '';
     closeModal('addLessonModal');
     renderApp();
   }
   
   function handleSaveSettings(e) {
     e.preventDefault();
     appState.centerName = document.getElementById('settingCenterName').value.trim();
     appState.passcode = document.getElementById('settingPasscode').value.trim() || '1234';
     appState.maxDictationScore = parseInt(document.getElementById('settingMaxScore').value, 10) || 10;
     
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
   
   function openGlobalReportModal() {
     const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId);
     const currentClass = appState.classes.find(c => c.id === appState.currentClassId);
     const currentLesson = appState.lessons.find(l => l.id === appState.currentLessonId);
   
     if (currentStudents.length === 0) {
       alert('No students found in this class to generate report.');
       return;
     }
   
     let tableRowsHTML = '';
     currentStudents.forEach((student, idx) => {
       const evalKey = `\${appState.currentLessonId}_\${student.id}`;
       const ev = appState.evaluations[evalKey] || { dictationMark: 0, criteria: {}, notes: '' };
       const gradeObj = calculateGrade(ev.dictationMark);
       const cr = ev.criteria || {};
   
       tableRowsHTML += `
         <tr>
           <td style="border: 1px solid #bfc5cc; padding: 6px 5px; text-align: center;">\${idx + 1}</td>
           <td style="border: 1px solid #bfc5cc; padding: 6px 8px; font-weight: 600; text-align: left;">\${escapeHtml(student.name)}</td>
           <td style="border: 1px solid #bfc5cc; padding: 6px 5px; text-align: center;">\${ev.dictationMark || 0}/\${appState.maxDictationScore}</td>
           <td style="border: 1px solid #bfc5cc; text-align: center;">\${cr.attendance ? '✓' : ''}</td>
           <td style="border: 1px solid #bfc5cc; text-align: center;">\${cr.hw ? '✓' : ''}</td>
           <td style="border: 1px solid #bfc5cc; text-align: center;">\${cr.listening ? '✓' : ''}</td>
           <td style="border: 1px solid #bfc5cc; text-align: center;">\${cr.reading ? '✓' : ''}</td>
           <td style="border: 1px solid #bfc5cc; text-align: center;">\${cr.speaking ? '✓' : ''}</td>
           <td style="border: 1px solid #bfc5cc; text-align: center;">\${cr.writing ? '✓' : ''}</td>
           <td style="border: 1px solid #bfc5cc; text-align: center;">\${cr.video ? '✓' : ''}</td>
           <td style="border: 1px solid #bfc5cc; padding: 6px 5px; text-align: center; font-weight: 700;">\hat = gradeObj.label}</td>
           <td style="border: 1px solid #bfc5cc; padding: 6px 8px; text-align: left;">\${escapeHtml(ev.notes || '')}</td>
         </tr>
       `;
     });
   
     document.getElementById('globalReportCardContent').innerHTML = `
       <div style="background: #ffffff; color: #111827; padding: 24px; font-family: Arial, sans-serif;">
         <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #374151; margin-bottom: 16px;">
           <div style="font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">\${escapeHtml(appState.centerName)}</div>
           <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">STUDENT PERFORMANCE SUMMARY</div>
         </div>
         <div style="text-align: center; margin-bottom: 18px;">
           <div style="font-size: 18px; font-weight: 700;">\${escapeHtml(currentClass ? currentClass.name : '')}</div>
           <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Lesson: \${escapeHtml(currentLesson ? currentLesson.title : '')} | Date: \${currentLesson ? currentLesson.date : ''}</div>
         </div>
         <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #9ca3af;">
           <thead>
             <tr style="background: #e5e7eb; color: #111827; font-weight: 700;">
               <th style="border: 1px solid #9ca3af; padding: 7px 4px; width: 30px;">#</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 6px; text-align: left;">Student Name</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">Dictation</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">Att.</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">H.W.</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">List.</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">Read.</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">Spek.</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">Writ.</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">Vid.</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 4px;">Grade</th>
               <th style="border: 1px solid #9ca3af; padding: 7px 6px; text-align: left; width: 20%;">Notes</th>
             </tr>
           </thead>
           <tbody>
             \${tableRowsHTML}
           </tbody>
         </table>
       </div>
     `;
   
     const reportElement = document.getElementById('globalReportCardContent');
     reportElement.dataset.className = currentClass ? currentClass.name : 'Class';
     reportElement.dataset.lessonTitle = currentLesson ? currentLesson.title : 'Lesson';
   
     openModal('globalReportModal');
   }
   
   function downloadGlobalClassPDF() {
     const element = document.getElementById('globalReportCardContent');
     if (!element) return;
   
     const className = element.dataset.className || 'Class';
     const lessonTitle = element.dataset.lessonTitle || 'Lesson';
   
     const opt = {
       margin: [6, 6, 6, 6],
       filename: `Global_Class_Report_\${className.replace(/\s+/g, '_')}_\ Bell = lessonTitle.replace(/\s+/g, '_')}.pdf`,
       image: { type: 'jpeg', quality: 0.98 },
       html2canvas: { scale: 2, useCORS: true, logging: false },
       jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
     };
   
     if (typeof html2pdf !== 'undefined') {
       html2pdf().set(opt).from(element).save();
     } else {
       window.print();
     }
   }
   
   function openAnalyticsModal() {
     const currentStudents = appState.students.filter(s => s.classId === appState.currentClassId);
     const currentLesson = appState.lessons.find(l => l.id === appState.currentLessonId);
   
     const container = document.getElementById('analyticsBody');
     if (!container) return;
     
     if (currentStudents.length === 0) {
       container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No student data available for analytics.</p>';
       openModal('analyticsModal');
       return;
     }
   
     const skillStats = {};
     CRITERIA_KEYS.forEach(c => { skillStats[c.id] = 0; });
   
     currentStudents.forEach(s => {
       const evalKey = `\${appState.currentLessonId}_\${s.id}`;
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
         <div style="margin-bottom: 14px; text-align: left;">
           <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
             <span><i class="fa-solid \${c.icon}"></i> \${c.label}</span>
             <span>\${count} / \${currentStudents.length} (\${pct}%)</span>
           </div>
           <div style="width: 100%; background: var(--bg-input); height: 10px; border-radius: 5px; overflow: hidden;">
             <div style="width: \${pct}%; background: var(--primary); height: 100%; border-radius: 5px;"></div>
           </div>
         </div>
       `;
     });
   
     container.innerHTML = `
       <div style="margin-bottom: 20px; text-align: left;">
         <h4>Lesson Summary: \${escapeHtml(currentLesson ? currentLesson.title : '')}</h4>
         <p style="font-size: 13px; color: var(--text-muted);">Class Evaluation & Skill Mastery Distribution</p>
       </div>
       \${skillBarsHTML}
     `;
   
     openModal('analyticsModal');
   }
   
   /* ==========================================================================
      9. GLOBAL SYNCHRONIZED INTERACTION LISTENERS SYSTEM
      ========================================================================== */
   function setupEventListeners() {
     
     // Submit Listener for Authentication Dashboard Interface Form
     const authForm = document.getElementById('authForm');
     if (authForm) {
       authForm.addEventListener('submit', async (event) => {
         event.preventDefault();
         const email = document.getElementById('emailInput').value.trim();
         const password = document.getElementById('passwordInput').value;
         const errorElement = document.getElementById('authError');
         const loginButton = document.getElementById('btnLogin');
   
         errorElement.textContent = '';
         loginButton.disabled = true;
         loginButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
   
         const success = await loginStaff(email, password);
         if (success) {
           hideAuthOverlay();
           await loadDataFromStorage();
           renderApp();
         } else {
           errorElement.textContent = 'Invalid credentials.';
           loginButton.disabled = false;
           loginButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Log In';
         }
       });
     }
   
     // Application Settings Module Interface Configuration
     const btnSettings = document.getElementById('btnSettings');
     if (btnSettings) {
       btnSettings.addEventListener('click', () => {
         document.getElementById('settingCenterName').value = appState.centerName || '';
         document.getElementById('settingPasscode').value = appState.passcode || '1234';
         document.getElementById('settingMaxScore').value = appState.maxDictationScore || 10;
         openModal('settingsModal');
       });
     }
   
     const btnManageClasses = document.getElementById('btnManageClasses');
     if (btnManageClasses) {
       btnManageClasses.addEventListener('click', openManageClassesModal);
     }
   
     const btnAddStudent = document.getElementById('btnAddStudent');
     if (btnAddStudent) {
       btnAddStudent.addEventListener('click', () => {
         populateStudentClassSelect();
         openModal('addStudentModal');
       });
     }
   
     const btnNewLesson = document.getElementById('btnNewLesson');
     if (btnNewLesson) {
       btnNewLesson.addEventListener('click', () => {
         document.getElementById('newLessonDate').value = new Date().toISOString().split('T')[0];
         openModal('addLessonModal');
       });
     }
   
     // Dashboard Selector Mutation Actions
     const classSelect = document.getElementById('classSelect');
     if (classSelect) {
       classSelect.addEventListener('change', (e) => {
         appState.currentClassId = e.target.value;
         const cl = appState.lessons.filter(l => l.classId === appState.currentClassId);
         if (cl.length > 0) appState.currentLessonId = cl[0].id;
         saveDataToStorage(); renderApp();
       });
     }
   
     const lessonSelect = document.getElementById('lessonSelect');
     if (lessonSelect) {
       lessonSelect.addEventListener('change', (e) => {
         appState.currentLessonId = e.target.value;
         saveDataToStorage(); renderApp();
       });
     }
   
     const searchInput = document.getElementById('searchInput');
     if (searchInput) {
       searchInput.addEventListener('input', renderTable);
     }
   
     // Form Submission Routing Map hooks
     if (document.getElementById('addClassForm')) document.getElementById('addClassForm').addEventListener('submit', handleAddClass);
     if (document.getElementById('addStudentForm')) document.getElementById('addStudentForm').addEventListener('submit', handleAddStudent);
     if (document.getElementById('addLessonForm')) document.getElementById('addLessonForm').addEventListener('submit', handleAddLesson);
     if (document.getElementById('settingsForm')) document.getElementById('settingsForm').addEventListener('submit', handleSaveSettings);
   
     // Theme & App Actions Toggle Triggers
     const btnThemeToggle = document.getElementById('btnThemeToggle');
     if (btnThemeToggle) {
       btnThemeToggle.addEventListener('click', () => {
         appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
         saveDataToStorage(); renderApp();
       });
     }
   
     const btnLock = document.getElementById('btnLock');
     if (btnLock) {
       btnLock.addEventListener('click', () => {
         appState.isUnlocked = false; showAuthOverlay();
       });
     }
   
     // Modal Structural Closure Hooks loop mapping system
     document.querySelectorAll('[id^="btnClose"], [id^="btnCancel"]').forEach(btn => {
       btn.addEventListener('click', (e) => {
         const modal = e.target.closest('.modal') || e.target.closest('[id$="Modal"]');
         if (modal) closeModal(modal.id);
       });
     });
   
     // Structural Demonstration Generator Hook Trigger
     const btnResetSampleData = document.getElementById('btnResetSampleData');
     if (btnResetSampleData) {
       btnResetSampleData.addEventListener('click', () => {
         if (confirm('Load demonstration mockup profiles? Existing workspace configurations will clear.')) {
           loadSampleData(); closeModal('settingsModal'); renderApp();
         }
       });
     }
   
     const btnClearAllData = document.getElementById('btnClearAllData');
     if (btnClearAllData) {
       btnClearAllData.addEventListener('click', () => {
         if (confirm('Clear workspace?')) {
           appState.students = []; appState.classes = []; appState.lessons = []; appState.evaluations = {};
           saveDataToStorage(); closeModal('settingsModal'); renderApp();
         }
       });
     }
   
     // Document Management Export Framework triggers
     if (document.getElementById('btnExportCSV')) document.getElementById('btnExportCSV').addEventListener('click', exportToCSV);
     if (document.getElementById('btnDownloadClassPDF')) document.getElementById('btnDownloadClassPDF').addEventListener('click', openGlobalReportModal);
     if (document.getElementById('btnAnalytics')) document.getElementById('btnAnalytics').addEventListener('click', openAnalyticsModal);
     
     const btnDownloadGlobalPDF = document.getElementById('btnDownloadGlobalPDF');
     if (btnDownloadGlobalPDF) btnDownloadGlobalPDF.addEventListener('click', downloadGlobalClassPDF);
     
     const btnDownloadPDF = document.getElementById('btnDownloadPDF');
     if (btnDownloadPDF) btnDownloadPDF.addEventListener('click', downloadPDFReport);
   
     const btnCopyReportText = document.getElementById('btnCopyReportText');
     if (btnCopyReportText) {
       btnCopyReportText.addEventListener('click', (e) => {
         const text = e.target.dataset.shareText || document.getElementById('btnCopyReportText').dataset.shareText;
         if (text) navigator.clipboard.writeText(text).then(() => alert('Report summary copied!'));
       });
     }
   }
   
   function openModal(id) {
     const el = document.getElementById(id);
     if (el) el.classList.add('active');
   }
   
   function closeModal(id) {
     const el = document.getElementById(id);
     if (el) el.classList.remove('active');
   }
   
   function escapeHtml(str) {
     return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
   }
   