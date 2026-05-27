const form = document.getElementById("ngoForm");
const list = document.getElementById("ngoList");

// load existing data
let requests = JSON.parse(localStorage.getItem("ngoEvents")) || [];

function render() {
  list.innerHTML = "";

  requests.forEach((r, index) => {
    list.innerHTML += `
      <div class="card">
        <h3>${r.title}</h3>
        <p><b>NGO:</b> ${r.ngo}</p>
        <p><b>Type:</b> ${r.type}</p>
        <p><b>Location:</b> ${r.location}</p>
        <p><b>Date:</b> ${r.date}</p>
        <p>${r.description}</p>
      </div>
    `;
  });
}

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const newRequest = {
    id: Date.now(),
    title: document.getElementById("title").value,
    ngo: document.getElementById("ngo").value,
    location: document.getElementById("location").value,
    date: document.getElementById("date").value,
    type: document.getElementById("type").value,
    description: document.getElementById("description").value
  };

  requests.push(newRequest);

  // SAVE globally (connects to volunteer page)
  localStorage.setItem("ngoEvents", JSON.stringify(requests));

  form.reset();
  render();
});

render();

