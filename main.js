// Utility
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

const animate = (elem, prop, value, duration) => {
  return nextFrame()
    .then(
      () =>
        new Promise((resolve) => {
          elem.style.transition = `${prop} ${duration}ms`;
          elem.style[prop] = `${value}px`;
          const done = () => {
            elem.style.transition = `${prop} 0ms`;
            resolve();
          };
          elem.addEventListener("transitionend", done, { once: true });
        })
    )
    .then(nextFrame);
};

class RollingCounter {
  // 1- El elemento a ser contador
  // 2- La cantidad de digitos del contador
  // 3- Hacia arriba o hacia abajo
  // El valor se declara con su key, por default es 0
  constructor(element, length = 3, upwards = true) {
    this.element = element;
    this._value = 0;
    this.upwards = upwards;
    this.digits = Array.from({ length }, () =>
      element.appendChild(document.createElement("li"))
    );
  }

  get value() {
    return this._value;
  }
  set value(value) {
    this._value = value;
    const numStr = value
      .toString()
      .padStart(this.digits.length, "0")
      .slice(-this.digits.length);
    // Muestra el numero actual en el elemento de contador (sin animacion)
    this.digits.forEach((digit, i) => {
      // Pone tres lineas cada una teniendo un digito, donde la del medio es la actual
      digit.innerHTML = `${(+numStr[i] + (this.upwards ? 9 : 1)) % 10}<br>${
        numStr[i]
      }<br>${(+numStr[i] + (this.upwards ? 1 : 9)) % 10}`;
      digit.style.top = `${-this.element.clientHeight}px`; // scroll the middle digit into view
    });
  }

  async roll(direction = 1, duration = 500) {
    await nextFrame();

    const numChangingDigits = Math.min(
      this.digits.length,
      this.value.toString().length -
        this.value.toString().search(direction > 0 ? /9*$/ : /0*$/) +
        1
    );

    const promises = this.digits
      .slice(-numChangingDigits)
      .map((digit, i) =>
        animate(
          digit,
          "top",
          direction > 0 === this.upwards ? -this.element.clientHeight * 2 : 0,
          duration
        )
      );

    await Promise.all(promises);
    this.value = this.value + direction;

    await nextFrame();
  }

  async rollTo(target, duration = 500, pause = 300) {
    const direction = Math.sign(target - this.value);

    while (this.value !== target) {
      await this.roll(direction, duration);
      await wait(pause);
    }
  }
}

const hpCounter = new RollingCounter(
  document.getElementById("hp-counter"),
  3,
  false
);
const ppCounter = new RollingCounter(
  document.getElementById("pp-counter"),
  3,
  false
);
hpCounter.value = 50;
ppCounter.value = 15;

// ppCounter.rollTo(0, 40, 10);
// hpCounter.rollTo(0, 70, 10);

document.getElementById("action_runaway").addEventListener('click', () => {
  hpCounter.rollTo(0, 70, 10);
})
document.getElementById("action_psi").addEventListener("click", () => {
  ppCounter.rollTo(0, 40, 10);
});