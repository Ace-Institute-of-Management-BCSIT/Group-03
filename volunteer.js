const container = document.getElementById("eventsContainer");
const select = document.getElementById("eventSelect");

/* Temporary data (until NGO page is ready) */
let ngoEvents = JSON.parse(localStorage.getItem("ngoEvents")) || [
  {
    id: 1,
    title: "Food Distribution Drive",
    ngo: "CareConnect Foundation",
    location: "Kathmandu",
    date: "2026-06-10"
  },
  {
    id: 2,
    title: "Tree Plantation Program",
    ngo: "Green Earth NGO",
    location: "Lalitpur",
    date: "2026-06-15"
  }
];

function loadEvents() {
  container.innerHTML = "";
  select.innerHTML = `<option value="">Select Event</option>`;

  ngoEvents.forEach(event => {
    container.innerHTML += `
      <div class="event-card">
        <h3>${event.title}</h3>
        <p><b>NGO:</b> ${event.ngo}</p>
        <p><b>Location:</b> ${event.location}</p>
        <p><b>Date:</b> ${event.date}</p>
        <button onclick="selectEvent('${event.title}')">Volunteer</button>
      </div>
    `;

    let option = document.createElement("option");
    option.value = event.title;
    option.textContent = event.title;
    select.appendChild(option);
  });
}

function selectEvent(title) {
  select.value = title;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

document.getElementById("volunteerForm").addEventListener("submit", function(e){
  e.preventDefault();
  alert("Volunteer application submitted successfully!");
  this.reset();
});

loadEvents();
