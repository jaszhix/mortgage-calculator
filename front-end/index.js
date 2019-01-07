import './assets/styles/index.scss';
import calculator from './calculator';

Number.prototype.format = function(n, x) {
  let re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
  return `$${this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,')}`;
};

class Button {
  constructor({parentElement, onClick}) {
    let button = document.createElement('button');
    button.innerText = 'Calculate';

    parentElement.appendChild(button);

    if (typeof onClick !== 'function') return;

    button.addEventListener('click', (...args) => onClick(...args));
  }
}

class Result {
  constructor({parentElement, text = '', value = 0}) {
    let row = document.createElement('div');
    row.classList.add('row');

    let leftCol = document.createElement('div');
    leftCol.classList.add('half-col');
    leftCol.innerText = text;

    let rightCol = document.createElement('div');
    rightCol.classList.add('half-col');

    row.appendChild(leftCol);
    row.appendChild(rightCol);

    parentElement.appendChild(row);

    this.rightCol = rightCol;
    this.setValue(value);
  }

  setValue(value) {
    if (isNaN(value) || !isFinite(value)) value = 0;
    this.rightCol.innerText = value.format(2);
  }
}

class Input {
  constructor({parentElement, text = '', className = '', onChange = null, id = ''}) {
    this.id = id;
    this.parentElement = parentElement;
    this.onChange = onChange;

    let div = document.createElement('div');
    if (className) div.classList.add(className);

    let input = document.createElement('input');
    input.setAttribute('type', 'number');
    input.setAttribute('value', '');

    let label = document.createElement('div');
    label.innerText = text;

    div.appendChild(label);
    div.appendChild(input);

    parentElement.appendChild(div);

    input.addEventListener('input', (...args) => this.onValueChange(...args))

    this.input = input;

  }

  onValueChange(e) {
    this.input.value = this.input.value.replace(/[^0-9]+/g);
    let int = parseFloat(this.input.value);

    if (isNaN(int)) return;

    this.value = int;

    if (this.onChange) this.onChange(this.id, int);
  }
}

class RangeSlider {
  constructor({parentElement, min = 0, max = 100, step = 1, text = '', className = '', id = '', onChange = null}) {
    this.id = id;
    this.parentElement = parentElement;
    this.onChange = onChange;

    let div = document.createElement('div');
    if (className) div.classList.add(className);

    let input = document.createElement('input');
    input.classList.add('slider-range');
    input.setAttribute('type', 'range')
    input.setAttribute('value', 0)
    input.setAttribute('min', min);
    input.setAttribute('max', max);
    input.setAttribute('step', step);

    let label = document.createElement('div');
    label.innerText = text;
    div.appendChild(label);

    let span = document.createElement('span');
    span.classList.add('slider-value');
    span.innerText = '0';

    div.appendChild(input)
    div.appendChild(span);

    parentElement.appendChild(div)

    input.addEventListener('input', (...args) => this.onValueChange(...args));

    this.div = div;
    this.input = input;
    this.span = span;
    this.value = 0;
    this.min = min;
    this.max = max;
  }

  onValueChange(e) {
    let {min, max} = this;
    let int = parseFloat(this.input.value);

    if (isNaN(int)) return;

    this.span.innerText = int;

    let progress = (int - min) / (max - min);

    // Set the background colors before and after the slider thumb.
    this.input.style.backgroundImage =
      `-webkit-gradient(
        linear,
        left top,
        right top,
        color-stop(${progress}, #1391CE),
        color-stop(${progress}, #D9D8DA )
      )`;

    this.value = int;

    if (this.onChange) this.onChange(this.id, int);
  }
}

const sliderContainer = document.querySelector('.sliders');
const inputContainer = document.querySelector('.inputs');
const inputRow1 = document.getElementById('inputs__row1');
const inputRow2 = document.getElementById('inputs__row2');
const buttonContainer = document.querySelector('.button-container');
const resultsContainer = document.querySelector('.results');

const sliderClass = 'slider';

class MortgageCalculator {
  constructor() {
    this.yearsOfMortgage = 0;
    this.interestRate = 0;

    this.loanAmount = 0;
    this.annualTax = 0;
    this.annualInsurance = 0;

    this.initialClick = false;

    this.inputs = [
      new RangeSlider({
        parentElement: sliderContainer,
        text: 'Years of mortgage',
        className: sliderClass,
        min: 1,
        max: 40,
        id: 'yearsOfMortgage',
        onChange: (...args) => this.onInputChange(...args)
      }),
      new RangeSlider({
        parentElement: sliderContainer,
        text: 'Rate of Interest (%)',
        className: sliderClass,
        min: 0.1,
        max: 10,
        step: 0.1,
        id: 'interestRate',
        onChange: (...args) => this.onInputChange(...args)
      }),
      new Input({
        parentElement: inputRow1,
        text: 'Loan Amount',
        className: 'full-col',
        id: 'loanAmount',
        onChange: (...args) => this.onInputChange(...args)
      }),
      new Input({
        parentElement: inputRow2,
        text: 'Annual Tax',
        className: 'half-col',
        id: 'annualTax',
        onChange: (...args) => this.onInputChange(...args)
      }),
      new Input({
        parentElement: inputRow2,
        text: 'Annual Insurance',
        className: 'half-col',
        id: 'annualInsurance',
        onChange: (...args) => this.onInputChange(...args)
      }),
      new Button({
        parentElement: buttonContainer,
        onClick: () => this.onClick()
      })
    ];

    this.interest = new Result({
      parentElement: resultsContainer,
      text: 'Principle & Interest',
    });

    this.tax = new Result({
      parentElement: resultsContainer,
      text: 'Tax',
    });

    this.insurance = new Result({
      parentElement: resultsContainer,
      text: 'Insurance',
    });

    this.totalMonthlyPayment = new Result({
      parentElement: resultsContainer,
      text: 'Total Monthly Payment',
    });
  }

  onInputChange(id, value) {
    this[id] = value;
    this.doCalculation();
  }

  onClick() {
    this.initialClick = true;
    resultsContainer.style.top = '0px';
  }

  doCalculation() {
    if (!this.initialClick) return;

    let {interestRate, loanAmount, yearsOfMortgage, annualTax, annualInsurance} = this;
    let {tax, insurance, totalMonthlyPayment, principleAndInterests} = calculator(
      interestRate,
      loanAmount,
      yearsOfMortgage,
      annualTax,
      annualInsurance
    );

    this.interest.setValue(principleAndInterests);
    this.tax.setValue(tax);
    this.insurance.setValue(insurance);
    this.totalMonthlyPayment.setValue(totalMonthlyPayment);

    // Uglifyjs removes console statements in production
    console.log({interestRate, loanAmount, yearsOfMortgage, annualTax, annualInsurance, principleAndInterests, tax, insurance, totalMonthlyPayment})
  }
}

new MortgageCalculator();
