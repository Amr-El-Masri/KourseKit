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

function sendCode() {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  if (!email || !password) {
    alert("Fill email and password first");
    return;
  }

  generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("Verification code (demo):", generatedCode);

  document.getElementById("codeSection").classList.remove("hidden");

  countdown = 60;
  updateTimer();

  timerInterval = setInterval(() => {
    countdown--;
    updateTimer();

    if (countdown <= 0) {
      clearInterval(timerInterval);
      generatedCode = null;
      alert("Code expired. Please resend.");
    }
  }, 1000);
}

function updateTimer() {
  document.getElementById("timer").innerText =
    `Code expires in ${countdown}s`;
}

function verifyCode() {
  const input = document.getElementById("codeInput").value;

  if (input === generatedCode) {
    alert("Registration successful");
    window.location.href = "login.html";
  } else {
    alert("Incorrect code");
  }
}


