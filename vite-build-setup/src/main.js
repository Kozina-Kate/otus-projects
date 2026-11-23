import './styles.css';

const counter = document.querySelector('#counter');
const progress = document.querySelector('#counter-progress');
const message = document.querySelector('#counter-message');
const incrementButton = document.querySelector('#increment');
const decrementButton = document.querySelector('#decrement');
const resetButton = document.querySelector('#reset');
const scriptStatus = document.querySelector('#script-status');
const scriptStatusText = document.querySelector('#script-status-text');

const maxSteps = 10;
let steps = 0;

function render() {
  counter.textContent = String(steps);
  progress.value = steps;
  decrementButton.disabled = steps === 0;
  incrementButton.disabled = steps === maxSteps;
  resetButton.disabled = steps === 0;

  if (steps === 0) {
    message.textContent = 'Начнём с первого шага';
  } else if (steps === maxSteps) {
    message.textContent = 'Все 10 шагов пройдены!';
  } else {
    message.textContent = `На пути к идее: ${steps} из ${maxSteps}`;
  }
}

incrementButton.addEventListener('click', () => {
  steps = Math.min(steps + 1, maxSteps);
  render();
});

decrementButton.addEventListener('click', () => {
  steps = Math.max(steps - 1, 0);
  render();
});

resetButton.addEventListener('click', () => {
  steps = 0;
  render();
});

scriptStatus.classList.add('is-ready');
scriptStatusText.textContent = 'JavaScript на связи';
render();
