const today = new Date().toISOString().split('T')[0];
document.getElementById('date').textContent = new Date().toDateString();

// ---------- journal title (editable) ----------
const journalTitle = document.getElementById('journalTitle');
const savedTitle = localStorage.getItem('journalTitleText');
if (savedTitle) journalTitle.textContent = savedTitle;
journalTitle.addEventListener('blur', () => {
  localStorage.setItem('journalTitleText', journalTitle.textContent.trim());
});

// ---------- habits ----------
function getHabits() {
  return JSON.parse(localStorage.getItem('habitsList') || '["water plants","read 10 min","stretch"]');
}
function getHistory() {
  return JSON.parse(localStorage.getItem('history') || '{}');
}
function getTodayEntry() {
  return getHistory()[today] || null;
}

function renderMainHabits() {
  const habits = getHabits();
  const entry = getTodayEntry();
  document.getElementById('habitsList').innerHTML = habits.map((h, i) => `
    <label class="habit">
      <input type="checkbox" data-habit-index="${i}" ${entry && entry.habits && entry.habits[i] ? 'checked' : ''}>
      <span class="box"></span>${h}
    </label>
  `).join('');
}

function renderSettingsHabits() {
  const habits = getHabits();
  const container = document.getElementById('habitsSettingsList');
  container.innerHTML = habits.map((h, i) => `
    <div class="settings-habit-row">
      <span>${h}</span>
      <button class="remove-habit-btn" type="button" data-remove-index="${i}">&times;</button>
    </div>
  `).join('');
  container.querySelectorAll('.remove-habit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const habits = getHabits();
      habits.splice(parseInt(btn.dataset.removeIndex), 1);
      localStorage.setItem('habitsList', JSON.stringify(habits));
      renderSettingsHabits();
      renderMainHabits();
    });
  });
}

document.getElementById('addHabitBtn').addEventListener('click', () => {
  const input = document.getElementById('newHabitInput');
  const val = input.value.trim();
  if (!val) return;
  const habits = getHabits();
  habits.push(val);
  localStorage.setItem('habitsList', JSON.stringify(habits));
  input.value = '';
  renderSettingsHabits();
  renderMainHabits();
});

// ---------- mood ----------
let selectedMood = null;
document.querySelectorAll('.mood-picker .mood-dot').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#spread-main > .left-page > .mood-picker .mood-dot').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = parseInt(btn.dataset.mood);
  });
});

// ---------- custom trackers ----------
function getCustomTrackers() {
  return JSON.parse(localStorage.getItem('customTrackersList') || '[]');
}

function renderTrackerSettings() {
  const trackers = getCustomTrackers();
  const container = document.getElementById('trackerSettingsList');
  container.innerHTML = trackers.map((t, i) => `
    <div class="settings-habit-row">
      <span>${t}</span>
      <button class="remove-habit-btn" type="button" data-remove-tracker="${i}">&times;</button>
    </div>
  `).join('');
  container.querySelectorAll('[data-remove-tracker]').forEach(btn => {
    btn.addEventListener('click', () => {
      const trackers = getCustomTrackers();
      trackers.splice(parseInt(btn.dataset.removeTracker), 1);
      localStorage.setItem('customTrackersList', JSON.stringify(trackers));
      renderTrackerSettings();
      renderExtraTrackers();
    });
  });
}

document.getElementById('addTrackerBtn').addEventListener('click', () => {
  const input = document.getElementById('newTrackerInput');
  const val = input.value.trim();
  if (!val) return;
  const trackers = getCustomTrackers();
  trackers.push(val);
  localStorage.setItem('customTrackersList', JSON.stringify(trackers));
  input.value = '';
  renderTrackerSettings();
  renderExtraTrackers();
});

let trackerValues = {};

function renderExtraTrackers() {
  const trackers = getCustomTrackers();
  const entry = getTodayEntry();
  trackerValues = (entry && entry.trackers) ? { ...entry.trackers } : {};
  const container = document.getElementById('extraTrackers');

  container.innerHTML = trackers.map(name => {
    const dots = [1, 2, 3, 4, 5].map(v =>
      `<button class="mood-dot${trackerValues[name] === v ? ' selected' : ''}" type="button" data-tracker="${name}" data-value="${v}"></button>`
    ).join('');
    return `<div class="tracker-block"><h2>${name}</h2><div class="mood-picker">${dots}</div></div>`;
  }).join('');

  container.querySelectorAll('.mood-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tracker;
      trackerValues[name] = parseInt(btn.dataset.value);
      container.querySelectorAll(`.mood-dot[data-tracker="${CSS.escape(name)}"]`).forEach(b => {
        b.classList.toggle('selected', parseInt(b.dataset.value) === trackerValues[name]);
      });
    });
  });
}

// ---------- goals ----------
function getGoals() {
  return JSON.parse(localStorage.getItem('goalsList') || '[]');
}

function renderGoals() {
  const goals = getGoals();
  const container = document.getElementById('goalsList');
  container.innerHTML = goals.map((g, i) => {
    if (g.target) {
      const filled = Math.min(5, Math.round((g.progress / g.target) * 5));
      const segs = Array.from({ length: 5 }, (_, s) => `<div class="${s < filled ? 'filled' : ''}"></div>`).join('');
      return `
        <div class="goal-row">
          <div style="flex:1">
            <span class="${g.done ? 'goal-done-text' : ''}">${g.text}</span>
            <div class="goal-progress-row">
              <div class="segbar">${segs}</div>
              <span>${g.progress}/${g.target}</span>
              ${g.done
                ? '<span class="goal-complete-badge">done!</span>'
                : `<button class="log-progress-btn" type="button" data-log-index="${i}">+1</button>`}
            </div>
          </div>
          <button class="remove-habit-btn" type="button" data-remove-goal="${i}">&times;</button>
        </div>`;
    }
    return `
      <div class="goal-row">
        <label class="habit">
          <input type="checkbox" data-goal-index="${i}" ${g.done ? 'checked' : ''}>
          <span class="box"></span>
          <span class="${g.done ? 'goal-done-text' : ''}">${g.text}</span>
        </label>
        <button class="remove-habit-btn" type="button" data-remove-goal="${i}">&times;</button>
      </div>`;
  }).join('');

  container.querySelectorAll('input[data-goal-index]').forEach(cb => {
    cb.addEventListener('change', () => {
      const goals = getGoals();
      goals[parseInt(cb.dataset.goalIndex)].done = cb.checked;
      localStorage.setItem('goalsList', JSON.stringify(goals));
      renderGoals();
      updateGoalsProgress();
    });
  });
  container.querySelectorAll('[data-log-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goals = getGoals();
      const g = goals[parseInt(btn.dataset.logIndex)];
      g.progress = (g.progress || 0) + 1;
      if (g.progress >= g.target) { g.progress = g.target; g.done = true; }
      localStorage.setItem('goalsList', JSON.stringify(goals));
      renderGoals();
      updateGoalsProgress();
    });
  });
  container.querySelectorAll('[data-remove-goal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goals = getGoals();
      goals.splice(parseInt(btn.dataset.removeGoal), 1);
      localStorage.setItem('goalsList', JSON.stringify(goals));
      renderGoals();
      updateGoalsProgress();
    });
  });
}

function updateGoalsProgress() {
  const goals = getGoals();
  const done = goals.filter(g => g.done).length;
  document.getElementById('goalsProgressText').textContent =
    goals.length ? `${done} of ${goals.length} goals complete` : "add a goal to start tracking progress";
}

document.getElementById('addGoalBtn').addEventListener('click', () => {
  const input = document.getElementById('newGoalInput');
  const targetInput = document.getElementById('newGoalTarget');
  const val = input.value.trim();
  if (!val) return;
  const target = parseInt(targetInput.value) || 0;
  const goals = getGoals();
  goals.push(target > 0 ? { text: val, done: false, target, progress: 0 } : { text: val, done: false });
  localStorage.setItem('goalsList', JSON.stringify(goals));
  input.value = '';
  targetInput.value = '';
  renderGoals();
  updateGoalsProgress();
});

// ---------- exercise bar (max 90 min) ----------
const exerciseInput = document.getElementById('exerciseMinutes');
exerciseInput.addEventListener('input', updateExerciseBar);
function updateExerciseBar() {
  const minutes = parseInt(exerciseInput.value) || 0;
  const filled = Math.min(7, Math.round((minutes / 90) * 7));
  document.querySelectorAll('#exerciseBar div').forEach((seg, i) => seg.classList.toggle('filled', i < filled));
}

// ---------- streak + save ----------
let streak = parseInt(localStorage.getItem('streak') || '0');
document.getElementById('streakCount').textContent = streak;

document.getElementById('saveBtn').addEventListener('click', () => {
  const habitsChecked = {};
  document.querySelectorAll('#habitsList input[type="checkbox"]').forEach(cb => {
    habitsChecked[cb.dataset.habitIndex] = cb.checked;
  });

  const entry = {
    date: today,
    mood: selectedMood,
    habits: habitsChecked,
    trackers: { ...trackerValues },
    exerciseMinutes: parseInt(exerciseInput.value) || 0,
    exerciseNote: document.getElementById('exerciseNote').value,
    text: document.getElementById('journalText').value,
  };

  const history = getHistory();
  const alreadyLoggedToday = !!history[today];
  history[today] = entry;
  localStorage.setItem('history', JSON.stringify(history));

  if (!alreadyLoggedToday) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    if (history[yesterday] || history[dayBefore]) streak += 1;
    else if (streak > 0) streak = Math.ceil(streak / 2);
    else streak = 1;
    localStorage.setItem('streak', streak);
    document.getElementById('streakCount').textContent = streak;
  }

  recomputeLevel();
  showGraceMessage(entry, history, streak);
});

// ---------- XP / leveling ----------
function computeDayXP(entry) {
  const habitsCount = Object.values(entry.habits || {}).filter(Boolean).length;
  const exerciseXP = entry.exerciseMinutes > 0 ? 1 : 0;
  const journalXP = entry.text && entry.text.trim() !== '' ? 1 : 0;
  return habitsCount + exerciseXP + journalXP;
}

function recomputeLevel() {
  const history = getHistory();
  const totalXP = Object.values(history).reduce((sum, e) => sum + computeDayXP(e), 0);
  const level = Math.floor(totalXP / 5) + 1;
  const xpIntoLevel = totalXP % 5;
  document.getElementById('levelNum').textContent = level;
  document.querySelectorAll('#levelBar div').forEach((seg, i) => seg.classList.toggle('filled', i < xpIntoLevel));
  updategraceStage(level);
  return level;
}

function updategraceStage(level) {
  const grace = document.querySelector('.grace');
  grace.classList.remove('stage-1', 'stage-2', 'stage-3');
  grace.classList.add(level <= 2 ? 'stage-1' : level <= 5 ? 'stage-2' : 'stage-3');
}

// ---------- grace messages / insight ----------
function showGraceMessage(entry, history, streak) {
  const habitsCompleted = Object.values(entry.habits).filter(Boolean).length + (entry.exerciseMinutes > 0 ? 1 : 0);
  const insight = getInsight(history);
  let message;
  if (insight) message = insight;
  else if (habitsCompleted >= 3) message = "you did so much today! go grab a latte, you earned it";
  else if (streak >= 5) message = streak + " days in a row?! i'm so proud of you";
  else if (entry.mood && entry.mood <= 2) message = "rough day? that's okay, i'm still growing right alongside you";
  else message = "logged and saved! see you tomorrow";
  document.getElementById('graceMessage').textContent = message;
}

function getInsight(history) {
  const days = Object.values(history);
  const exDays = days.filter(d => d.exerciseMinutes > 0 && d.mood);
  const restDays = days.filter(d => d.exerciseMinutes === 0 && d.mood);
  if (exDays.length >= 2 && restDays.length >= 2) {
    const avg = arr => arr.reduce((s, d) => s + d.mood, 0) / arr.length;
    const exAvg = avg(exDays), restAvg = avg(restDays);
    if (exAvg - restAvg >= 0.5) return `your mood tends to be higher on days you exercise (${exAvg.toFixed(1)} vs ${restAvg.toFixed(1)})`;
  }
  return null;
}

// ---------- weekly summary ----------
const MOOD_COLORS = ['#F6D6E2', '#EDB6CF', '#E294B9', '#D571A0', '#A83E5C'];

function renderWeeklySummary() {
  const history = getHistory();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    days.push({ key, date: d, entry: history[key] || null });
  }

  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  document.getElementById('weekMoodStrip').innerHTML = days.map(d => {
    const mood = d.entry ? d.entry.mood : null;
    const style = mood ? `background:${MOOD_COLORS[mood - 1]}` : '';
    const cls = mood ? '' : ' empty';
    return `<div class="week-day"><div class="week-dot${cls}" style="${style}"></div><span>${dayLetters[d.date.getDay()]}</span></div>`;
  }).join('');

  const moodDays = days.filter(d => d.entry && d.entry.mood);
  const avgMood = moodDays.length ? (moodDays.reduce((s, d) => s + d.entry.mood, 0) / moodDays.length) : null;
  document.getElementById('weekAvgMoodText').textContent = avgMood
    ? `avg mood: ${avgMood.toFixed(1)} / 5`
    : "log a few days to see your average mood";

  document.getElementById('weekInsightText').textContent = getInsight(history) || '';

  const habitsPerDay = getHabits().length;
  const loggedDays = days.filter(d => d.entry);
  const totalPossible = habitsPerDay * loggedDays.length;
  const totalCompleted = loggedDays.reduce((s, d) => s + Object.values(d.entry.habits || {}).filter(Boolean).length, 0);
  const pct = totalPossible ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  const filledSegs = Math.round((pct / 100) * 5);
  document.querySelectorAll('#weekHabitsBar div').forEach((seg, i) => seg.classList.toggle('filled', i < filledSegs));
  document.getElementById('weekHabitsText').textContent = totalPossible
    ? `${pct}% of habits completed this week`
    : "no habits logged yet this week";

  const exerciseTotal = loggedDays.reduce((s, d) => s + (d.entry.exerciseMinutes || 0), 0);
  document.getElementById('weekExerciseText').textContent = `${exerciseTotal} min total this week`;

  document.getElementById('weekStreakText').textContent = `${streak} day${streak === 1 ? '' : 's'} in a row`;
}
// ---------- to-do list ----------
function getTodos() {
  return JSON.parse(localStorage.getItem('todoList') || '[]');
}

function renderTodos() {
  const todos = getTodos();
  const container = document.getElementById('todoList');
  container.innerHTML = todos.map((t, i) => `
    <div class="todo-row">
      <label class="habit">
        <input type="checkbox" data-todo-index="${i}" ${t.done ? 'checked' : ''}>
        <span class="box"></span>
        <span class="${t.done ? 'todo-done-text' : ''}">${t.text}</span>
      </label>
      <button class="remove-habit-btn" type="button" data-remove-todo="${i}">&times;</button>
    </div>
  `).join('');

  container.querySelectorAll('input[data-todo-index]').forEach(cb => {
    cb.addEventListener('change', () => {
      const todos = getTodos();
      todos[parseInt(cb.dataset.todoIndex)].done = cb.checked;
      localStorage.setItem('todoList', JSON.stringify(todos));
      renderTodos();
    });
  });
  container.querySelectorAll('[data-remove-todo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const todos = getTodos();
      todos.splice(parseInt(btn.dataset.removeTodo), 1);
      localStorage.setItem('todoList', JSON.stringify(todos));
      renderTodos();
    });
  });
}

document.getElementById('addTodoBtn').addEventListener('click', () => {
  const input = document.getElementById('newTodoInput');
  const val = input.value.trim();
  if (!val) return;
  const todos = getTodos();
  todos.push({ text: val, done: false });
  localStorage.setItem('todoList', JSON.stringify(todos));
  input.value = '';
  renderTodos();
});

// ---------- monthly grid view ----------
const MOOD_LABELS = ['rough', 'meh', 'okay', 'good', 'great'];

function renderMonthlyGrid() {
  const history = getHistory();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  document.getElementById('monthGridLabel').textContent =
    now.toLocaleString('default', { month: 'long' }) + ' ' + year;

  const habits = getHabits();
  let headerRow = '<tr><th class="habit-name-col"></th>';
  for (let d = 1; d <= daysInMonth; d++) headerRow += `<th class="day-col">${d}</th>`;
  headerRow += '</tr>';

  const bodyRows = habits.map((h, hi) => {
    let row = `<tr><td class="habit-name-cell">${h}</td>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = history[dateKey];
      const done = entry && entry.habits && entry.habits[hi];
      const isToday = dateKey === today;
      row += `<td><span class="grid-cell${done ? ' filled' : ''}${isToday ? ' today' : ''}"></span></td>`;
    }
    return row + '</tr>';
  }).join('');

  document.getElementById('habitGridTable').innerHTML = headerRow + bodyRows;

  let calHtml = '';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entry = history[dateKey];
    const isFuture = dateKey > today;
    const style = entry && entry.mood ? `background:${MOOD_COLORS[entry.mood - 1]}` : '';
    calHtml += `<div class="mood-cal-day${isFuture ? ' future' : ''}" style="${style}">${d}</div>`;
  }
  document.getElementById('moodCalendarGrid').innerHTML = calHtml;

  document.getElementById('moodLegend').innerHTML = MOOD_COLORS.map((c, i) => `
    <div class="mood-legend-row"><span class="mood-legend-dot" style="background:${c}"></span>${MOOD_LABELS[i]}</div>
  `).join('');

  requestAnimationFrame(() => {
  const wrap = document.querySelector('.habit-grid-wrap');
  const todayCell = document.querySelector('.grid-cell.today');
  if (wrap && todayCell) wrap.scrollLeft = todayCell.closest('td').offsetLeft - 60;
});
}
// ---------- page flip ----------
const book = document.getElementById('book');
const spreadIds = ['spread-main', 'spread-settings', 'spread-goals', 'spread-weekly', 'spread-monthly'];
let currentSpread = 0;

function flip(direction) {
  book.style.transition = 'transform 0.25s ease-in, opacity 0.25s ease-in';
  book.style.transform = `rotateY(${direction * 90}deg) scale(0.95)`;
  book.style.opacity = '0.3';

  setTimeout(() => {
    document.getElementById(spreadIds[currentSpread]).style.display = 'none';
    currentSpread = (currentSpread + direction + spreadIds.length) % spreadIds.length;
    document.getElementById(spreadIds[currentSpread]).style.display = 'flex';
    renderWeeklySummary();
    renderMonthlyGrid();

    book.style.transition = 'none';
    book.style.transform = `rotateY(${-direction * 90}deg) scale(0.95)`;
    book.offsetHeight;

    book.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
    book.style.transform = 'rotateY(0deg) scale(1)';
    book.style.opacity = '1';
  }, 250);
}
document.getElementById('nextPage').addEventListener('click', () => flip(1));
document.getElementById('prevPage').addEventListener('click', () => flip(-1));

// ---------- init ----------
function prefillToday() {
  const entry = getTodayEntry();
  if (!entry) return;
  if (entry.mood) {
    selectedMood = entry.mood;
    document.querySelectorAll('.mood-picker .mood-dot').forEach(b => {
      if (b.dataset.mood) b.classList.toggle('selected', parseInt(b.dataset.mood) === entry.mood);
    });
  }
  if (entry.text) document.getElementById('journalText').value = entry.text;
  if (entry.exerciseMinutes) exerciseInput.value = entry.exerciseMinutes;
  if (entry.exerciseNote) document.getElementById('exerciseNote').value = entry.exerciseNote;
}

renderMainHabits();
renderTrackerSettings();
renderExtraTrackers();
renderSettingsHabits();
renderGoals();
updateGoalsProgress();
renderWeeklySummary();
prefillToday();
updateExerciseBar();
recomputeLevel();
renderTodos();
renderMonthlyGrid();