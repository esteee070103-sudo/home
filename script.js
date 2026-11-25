const tripForm = document.getElementById('tripForm');
const tripSummary = document.getElementById('tripSummary');
const scheduleArea = document.getElementById('scheduleArea');
const dayList = document.getElementById('dayList');
const formMessage = document.getElementById('formMessage');
const addDayBtn = document.getElementById('addDayBtn');

const STORAGE_KEY = 'travelOnePageData';
let trip = null;
let days = [];

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trip, days }));
  } catch (error) {
    formMessage.textContent = '저장 공간을 사용할 수 없어요. 브라우저 설정을 확인해 주세요.';
  }
}

function loadData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;
    const data = JSON.parse(savedData);
    if (!data || !data.trip || !Array.isArray(data.days)) return;
    trip = data.trip;
    days = data.days.map(day => ({
      date: String(day.date || ''),
      activities: Array.isArray(day.activities) ? day.activities.map(String) : [],
      memo: String(day.memo || '')
    }));
    renderTrip();
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

tripForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('tripName').value.trim();
  const destination = document.getElementById('destination').value.trim();
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;

  if (end < start) {
    formMessage.textContent = '도착일은 출발일보다 빠를 수 없어요.';
    return;
  }

  trip = { name, destination, start, end };
  days = [];
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const count = Math.round((endDate - startDate) / 86400000) + 1;

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push({ date: formatDate(date), activities: [], memo: '' });
  }

  formMessage.textContent = '';
  saveData();
  renderTrip();
});

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function renderTrip() {
  tripSummary.classList.remove('empty-summary');
  tripSummary.classList.add('filled');
  tripSummary.innerHTML = `
    <span class="summary-icon">🧳</span>
    <div><strong>${escapeHTML(trip.name)}</strong><p>📍 ${escapeHTML(trip.destination)}</p></div>
    <div class="trip-dates"><strong>${escapeHTML(trip.start)} ~ ${escapeHTML(trip.end)}</strong><p>총 ${days.length}일 여행</p></div>`;
  scheduleArea.classList.remove('hidden');

  document.getElementById('tripName').value = trip.name;
  document.getElementById('destination').value = trip.destination;
  document.getElementById('startDate').value = trip.start;
  document.getElementById('endDate').value = trip.end;
  renderDays();
}

function renderDays() {
  dayList.innerHTML = '';
  days.forEach((day, index) => {
    const card = document.createElement('article');
    card.className = 'day-card';
    card.innerHTML = `
      <div class="day-head"><strong>DAY ${index + 1}</strong><span>${escapeHTML(day.date)}</span></div>
      <div class="day-content">
        <ul class="activity-list">
          ${day.activities.map((activity, activityIndex) => `
            <li>
              <span>📌</span><span class="activity-text">${escapeHTML(activity)}</span>
              <button type="button" class="edit-activity" aria-label="일정 수정" data-edit-day="${index}" data-edit-activity="${activityIndex}">수정</button>
              <button type="button" aria-label="일정 삭제" data-day="${index}" data-activity="${activityIndex}">×</button>
            </li>`).join('')}
        </ul>
        <div class="activity-input-row">
          <input class="activity-input" type="text" placeholder="예: 성산일출봉 방문하기" aria-label="DAY ${index + 1} 일정 입력">
          <button class="add-activity" type="button" data-add-day="${index}">추가</button>
        </div>
        <label class="memo-label" for="memo-${index}">📝 DAY ${index + 1} 메모</label>
        <textarea class="day-memo" id="memo-${index}" data-memo-day="${index}" rows="2" placeholder="준비물이나 예약 정보 등을 기록해 보세요.">${escapeHTML(day.memo || '')}</textarea>
      </div>`;
    dayList.appendChild(card);
  });
}

dayList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-activity]');
  if (deleteButton) {
    const dayIndex = Number(deleteButton.dataset.day);
    const activityIndex = Number(deleteButton.dataset.activity);
    days[dayIndex].activities.splice(activityIndex, 1);
    saveData();
    renderDays();
    return;
  }

  const editButton = event.target.closest('[data-edit-activity]');
  if (editButton) {
    const dayIndex = Number(editButton.dataset.editDay);
    const activityIndex = Number(editButton.dataset.editActivity);
    const updatedValue = prompt('수정할 일정을 입력해 주세요.', days[dayIndex].activities[activityIndex]);
    if (updatedValue === null) return;
    if (!updatedValue.trim()) {
      alert('일정 내용을 입력해 주세요.');
      return;
    }
    days[dayIndex].activities[activityIndex] = updatedValue.trim();
    saveData();
    renderDays();
    return;
  }

  const addButton = event.target.closest('[data-add-day]');
  if (addButton) {
    const dayIndex = Number(addButton.dataset.addDay);
    const input = addButton.parentElement.querySelector('input');
    const value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }
    days[dayIndex].activities.push(value);
    saveData();
    renderDays();
  }
});

dayList.addEventListener('input', (event) => {
  const memoInput = event.target.closest('[data-memo-day]');
  if (!memoInput) return;
  const dayIndex = Number(memoInput.dataset.memoDay);
  days[dayIndex].memo = memoInput.value;
  saveData();
});

addDayBtn.addEventListener('click', () => {
  if (!trip || days.length === 0) return;
  const last = new Date(`${days[days.length - 1].date.replaceAll('.', '-')}T00:00:00`);
  last.setDate(last.getDate() + 1);
  days.push({ date: formatDate(last), activities: [], memo: '' });
  saveData();
  renderDays();
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

loadData();
