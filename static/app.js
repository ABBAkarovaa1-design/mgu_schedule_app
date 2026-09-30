const tg = window.Telegram?.WebApp;

tg?.ready();
tg?.expand();

const days = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

const fullDays = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье"
];

let groupId = null;
let week = 0;
let data = {};

const today = new Date();

// Первая неделя расписания: 28 сентября — 4 октября 2026.
const SCHEDULE_START = new Date(2026, 8, 28);

function getScheduleWeekOffset(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const start = new Date(SCHEDULE_START);
  start.setHours(0, 0, 0, 0);

  return Math.floor(
    (d.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
}

week = getScheduleWeekOffset(today);

let selected = today.getDay();
selected = selected === 0 ? 6 : selected - 1;

const group = document.querySelector("#group");
const nav = document.querySelector("#days");
const main = document.querySelector("#schedule");
const weekLabel = document.querySelector("#weekLabel");
const weekDates = document.querySelector("#weekDates");
const dateElement = document.querySelector("#date");

if (dateElement) {
  dateElement.textContent =
    new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "long"
    }).format(today);
}

/* =========================
   DAYS
========================= */

days.forEach((day, index) => {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = day;
  button.title = fullDays[index];

  button.onclick = () => {
    selected = index;

    renderDays();
    render();
  };

  nav.append(button);
});

function renderDays() {
  [...nav.children].forEach((button, index) => {
    button.classList.toggle("active", index === selected);
  });
}

/* =========================
   WEEK DATES
========================= */

function getWeekDates(offset = 0) {
  const monday = new Date(SCHEDULE_START);

  monday.setDate(
    SCHEDULE_START.getDate() + offset * 7
  );

  const sunday = new Date(monday);

  sunday.setDate(
    monday.getDate() + 6
  );

  return { monday, sunday };
}
function formatShortDate(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long"
  }).format(date);
}

function renderWeek() {
  const { monday, sunday } = getWeekDates(week);

  if (week === 0) {
    weekLabel.textContent = "ТЕКУЩАЯ НЕДЕЛЯ";
  } else if (week > 0) {
    weekLabel.textContent = `+${week} НЕД.`;
  } else {
    weekLabel.textContent = `${week} НЕД.`;
  }

  weekDates.textContent =
    `${formatShortDate(monday)} — ${formatShortDate(sunday)}`;
}

/* =========================
   CURRENT LESSON
========================= */

function timeToMinutes(value) {
  if (!value) return null;

  const match = String(value).match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function isCurrentLesson(lesson) {
  if (week !== 0) return false;

  const start = timeToMinutes(lesson.start);
  const end = timeToMinutes(lesson.end);

  if (start === null || end === null) {
    return false;
  }

  const now = new Date();

  const todayIndex =
    now.getDay() === 0
      ? 6
      : now.getDay() - 1;

  if (todayIndex !== selected) {
    return false;
  }

  const current =
    now.getHours() * 60 +
    now.getMinutes();

  return current >= start && current < end;
}

function lessonProgress(lesson) {
  if (!isCurrentLesson(lesson)) {
    return 0;
  }

  const start = timeToMinutes(lesson.start);
  const end = timeToMinutes(lesson.end);

  const now = new Date();

  const current =
    now.getHours() * 60 +
    now.getMinutes();

  const percent =
    ((current - start) / (end - start)) * 100;

  return Math.max(
    0,
    Math.min(100, percent)
  );
}

/* =========================
   RENDER
========================= */

function render() {
  const list = data[fullDays[selected]] || [];

  if (!list.length) {
    main.innerHTML = `
      <div class="empty">
        <div class="empty-line"></div>

        <div class="empty-title">
          Сегодня занятий нет
        </div>

        <div class="empty-subtitle">
          Можно выдохнуть.
        </div>
      </div>
    `;

    return;
  }

  main.innerHTML = list
    .map((lesson, index) => {
      const current = isCurrentLesson(lesson);
      const progress = lessonProgress(lesson);

      return `
        <article
          class="card"
          style="animation-delay:${index * 0.06}s"
        >

          <div class="lesson-number">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <div class="time">
            ${esc(lesson.start || "—")}
            —
            ${esc(lesson.end || "—")}
          </div>

          <div class="lesson-main">

            ${
              current
                ? `
                  <div class="now-badge">
                    СЕЙЧАС
                  </div>
                `
                : ""
            }

            <div class="subject">
              ${esc(lesson.subject || "Без названия")}
            </div>

            <div class="meta">
              ${esc(lesson.teacher || "Преподаватель не указан")}
              ·
              ${esc(lesson.room || "Аудитория не указана")}

              ${
                lesson.lesson_type
                  ? `<br>${esc(lesson.lesson_type)}`
                  : ""
              }

              ${
                lesson.note
                  ? `<br>${esc(lesson.note)}`
                  : ""
              }
            </div>

            ${
              current
                ? `
                  <div class="progress">
                    <div
                      class="progress-bar"
                      style="width:${progress}%"
                    ></div>
                  </div>
                `
                : ""
            }

          </div>

        </article>
      `;
    })
    .join("");
}

/* =========================
   API
========================= */

async function init() {
  try {
    const response = await fetch("/api/groups");

    const groups = await response.json();

    if (!groups.length) {
      group.innerHTML = `
        <option>Нет групп</option>
      `;

      renderWeek();
      renderDays();
      render();

      return;
    }

    group.innerHTML = groups
      .map(
        g => `
          <option value="${g.id}">
            ${esc(g.name)}
            ${g.faculty ? ` — ${esc(g.faculty)}` : ""}
          </option>
        `
      )
      .join("");

    groupId = groups[0].id;

    await load();

  } catch (error) {
    console.error(error);

    main.innerHTML = `
      <div class="empty">
        Не удалось загрузить группы
      </div>
    `;
  }
}

/* =========================
   LOAD SCHEDULE
========================= */

async function load() {
  groupId = Number(group.value);

  if (!groupId) {
    render();
    return;
  }

  main.classList.add("loading");

  try {
    const response = await fetch(
      `/api/schedule/${groupId}?week=${week}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    data = await response.json();

    renderWeek();
    renderDays();
    render();

  } catch (error) {
    console.error(error);

    main.innerHTML = `
      <div class="empty">
        <div class="empty-title">
          Не удалось загрузить расписание
        </div>
      </div>
    `;
  }

  setTimeout(() => {
    main.classList.remove("loading");
  }, 150);
}

/* =========================
   HELPERS
========================= */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    char =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[char]
  );
}

/* =========================
   CONTROLS
========================= */

group.onchange = load;

document.querySelector("#prev").onclick = async () => {
  week--;
  await load();
};

document.querySelector("#next").onclick = async () => {
  week++;
  await load();
};

/* =========================
   START
========================= */

renderWeek();
renderDays();
init();

