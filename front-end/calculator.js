export default function calculator(interestRate, loanAmount, yearsOfMortgage, annualTax, annualInsurance) {
  let principleAndInterests = (
    (interestRate) / 12) * loanAmount / (1 - Math.pow((1 + ((interestRate / 100)/12)), -yearsOfMortgage * 12)
  );
  let tax = annualTax / 12;
  let insurance = annualInsurance / 12;
  let totalMonthlyPayment = principleAndInterests + tax + insurance;

  if (isNaN(tax)) tax = 0;
  if (isNaN(insurance)) insurance = 0;
  if (isNaN(totalMonthlyPayment)) totalMonthlyPayment = 0;
  if (isNaN(principleAndInterests)) principleAndInterests = 0;

  return {
    tax,
    insurance,
    totalMonthlyPayment,
    principleAndInterests
  };
}