const button = document.getElementById("hello-btn");
const message = document.getElementById("message");

if (button && message) {
  button.addEventListener("click", () => {
    const now = new Date().toLocaleTimeString();
    message.textContent = `Great, your project is running! (${now})`;
  });
}
