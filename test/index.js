import test from 'tape';
import calculator from '../front-end/calculator';

test('result is an object', function (t) {
  t.equal(typeof calculator(0, 0, 0, 0, 0), 'object');
  t.end();
});

test('results are all numbers', function (t) {
  let out = calculator(0, 0, 0, 0, 0);

  for (let key in out) {
    t.equal(typeof out[key], 'number');
  }

  t.end();
});

test('result is truthy', function (t) {
  t.equal(calculator(0, 0, 0, 0, 0) != null, true);
  t.end();
});

test('result has four keys', function (t) {
  t.equal(Object.keys(calculator(0, 0, 0, 0, 0)).length, 4);
  t.end();
});

test('0 inputs results in 0 outputs', function (t) {
  let out = calculator(0, 0, 0, 0, 0);

  for (let key in out) {
    t.equal(out[key], 0);
  }

  t.end();
});

test('results should not be NaN', function (t) {
  let out = calculator(0, 0, 0, 0, 0);

  for (let key in out) {
    t.equal(isNaN(out[key]), false);
  }

  t.end();
});

test('calculation results return as expected', function (t) {
  let out = calculator(4.5, 344234, 9, 1200, 300);
  let expected = {
    tax: '100.00',
    insurance: '25.00',
    totalMonthlyPayment: '388338.08',
    principleAndInterests: '388213.08'
  };

  for (let key in out) {
    t.equal(out[key].toFixed(2), expected[key]);
  }

  t.end();
});