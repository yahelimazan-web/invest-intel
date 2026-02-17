const nextStepBtn = document.getElementById("next-step-btn");
const output = document.getElementById("next-step-output");

const steps = [
  "Write a one-sentence value proposition for users.",
  "List 3 user pain points you want to solve first.",
  "Create a tiny demo flow: input -> AI response -> result card.",
  "Define one measurable success metric for week 1.",
];

if (nextStepBtn && output) {
  nextStepBtn.addEventListener("click", () => {
    const index = Math.floor(Math.random() * steps.length);
    output.textContent = `Next step: ${steps[index]}`;
  });
}
