const button = document.getElementById("hello-btn");
const message = document.getElementById("message");

if (button && message) {
  button.addEventListener("click", () => {
    const now = new Date().toLocaleTimeString();
    message.textContent = `Scent Sync AI initialized (${now})`;
  });
}
