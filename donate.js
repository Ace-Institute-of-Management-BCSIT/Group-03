const form = document.getElementById("donateForm");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const type = document.getElementById("donationType").value;

  if (name === "" || email === "" || type === "") {
    alert("Please fill all required fields.");
    return;
  }

  alert("Please sign in or sign up to continue donating.");
  form.reset();
});