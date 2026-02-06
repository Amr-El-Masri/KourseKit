function addTodo() {
  const input = document.getElementById("todoInput");
  const list = document.getElementById("todoList");

  if (!input.value.trim()) return;

  const li = document.createElement("li");
  li.className = "todo-card";
  li.innerHTML = `
    <span class="todo-text">${input.value}</span>
    <span class="todo-meta">⏱ Today</span>
  `;

  // click to mark done
  li.onclick = () => {
    li.classList.toggle("done");
  };

  list.appendChild(li);
  input.value = "";
}


console.log("script loaded"); // DEBUG LINE

// for the random name generator for the anon reviews!! we got creative with the names as you can see

const anonNames = [
  "Apple", "Blueberry", "Cherry", "Date", "Elderberry",
  "Fig", "Grape", "Honeydew", "Kiwi", "Lemon",
  "Mango", "Nectarine", "Orange", "Papaya",
  "Pineapple", "Quince", "Raspberry", "Strawberry",
  "Starfruit", "Tangerine", "Ugli Fruit", "Watermelon",
  "Zucchini", "Bazella", "Koussa", "Batata 7arra",
  "Kafta", "Tawouk", "Shawarma", "Falafel", "Hummus", "Tabbouleh", "Fattoush", "Labneh",
  "Man2oushe", "Knefeh", "Baklewa", "Maamoul", "Qatayef", "Matte", "Sa7lab", "Shish Barak", 
  "Loubyeh", "Mloukhiyye", "Wara2 3enab", "Mjaddara", "Kibbeh", "Sambousek", "Kousa Me7shi",
  "Batata Me7shi", "Fatteh", "Zaatar", "Dibis Remmen", "Labneh Mtawwame", "Sfee7a", "Jibneh",
  "Bemye", "Makloubeh", "Shawrabet 3adas", "7alewet el Jibin", "Sfi7a"
];

function getRandomAnon() {
  const index = Math.floor(Math.random() * anonNames.length);
  return anonNames[index];
}

document.addEventListener("DOMContentLoaded", () => {
  // select all anon-name placeholders
  const anonElements = document.querySelectorAll(".anon-name");

  anonElements.forEach(el => {
    el.textContent = getRandomAnon();
  });
});



document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".course-grid");

  const courses = [
    { name: "CMPS 271", prof: "Dr. Mohammad Sakr", time: "Mon & Wed • 12:30 – 13:45" },
    { name: "PHIL 210", prof: "Mr. Mahmoud El Hassanieh", time: "Mon & Wed • 14:00 – 15:15" },
    { name: "CMPS 215", prof: "Dr. Mohammad A. Kobeissi", time: "Mon & Wed • 15:30 – 16:45" },
    { name: "PSYC 222", prof: "Dr. Arne Dietrich", time: "Tue & Thu • 9:30 – 10:45"},
    { name: "PSYC 284", prof: "Dr. Sarine Hagopian", time: "Tue & Thu • 14:00 – 15:15"}
  ];

  grid.innerHTML = "";

  courses.forEach(c => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `
      <h4>${c.name}</h4>
      <p class="prof">${c.prof}</p>
      <p class="time">${c.time}</p>
    `;
    grid.appendChild(card);
  });
});


function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please fill in all fields");
    return;
  }

  // fake validation
  if (password.length < 6) {
    alert("Invalid credentials");
    return;
  }

  alert("Login successful (frontend only)");
  window.location.href = "dashboard.html";
}

let generatedCode = null;
let countdown = 60;
let timerInterval = null;

function checkEmailNote() {
  alert("A verification link has been sent to your email. Click on it to verify and proceed with registration."); }


function addCourse() {
  const container = document.getElementById("courses-container");

  const row = document.createElement("div");
  row.className = "course-row";

  row.innerHTML = `
    <label>Course:</label>
    <input type="text" class="course-name" placeholder="ex: Math 201">

    <label>Grade:</label>
    <input type="number" class="course-grade" placeholder="ex: 3.7">

    <label>Credits:</label>
    <input type="number" class="course-credits" placeholder="ex: 3">
  `;

  container.appendChild(row);
}

function addSemester() {
  const container = document.getElementById("semesters-container");

  const row = document.createElement("div");
  row.className = "course-row-cumulative";

  row.innerHTML = `
    <label>Semester:</label>
    <input type="text" placeholder="ex: Fall 25-26">

    <label>GPA:</label>
    <input type="number" placeholder="ex: 3.67">

    <label>Credits:</label>
    <input type="number" placeholder="ex: 15">
  `;

  container.appendChild(row);
}

function addComponent() {
  const container = document.getElementById("components-container");

  const row = document.createElement("div");
  row.className = "course-row";

  row.innerHTML = `
    <select class="component-type">
      <option>Exam</option>
      <option>Assignment</option>
      <option>Project</option>
      <option>Quiz</option>
    </select>

    <input type="number" class="component-weight" placeholder="Weight %">
    <input type="number" class="component-grade" placeholder="Grade">
  `;

  container.appendChild(row);
}

function calculateCourseGrade() {
  const weights = document.querySelectorAll(".component-weight");
  const grades = document.querySelectorAll(".component-grade");

  let total = 0;
  let weightSum = 0;

  weights.forEach((w, i) => {
    const weight = parseFloat(w.value);
    const grade = parseFloat(grades[i].value);

    if (!isNaN(weight) && !isNaN(grade)) {
      total += (grade * weight);
      weightSum += weight;
    }
  });

  if (weightSum === 0) return;

  const result = (total / weightSum).toFixed(2);
  document.getElementById("course-grade-result").textContent =
    `Current Grade: ${result}%`;
}


function addGradedComponent() {
  const container = document.getElementById("graded-components-container");

  const row = document.createElement("div");
  row.className = "course-row";

  row.innerHTML = `
    <input type="number" class="tg-grade" placeholder="Grade %">
    <input type="number" class="tg-weight" placeholder="Weight %">
  `;

  container.appendChild(row);
}