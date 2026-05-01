export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  let rest;

  for (let i = 1; i <= 9; i++) {
    sum += Number(cpf.substring(i - 1, i)) * (11 - i);
  }

  rest = (sum * 10) % 11;
  if (rest >= 10) rest = 0;

  if (rest !== Number(cpf.substring(9, 10))) return false;

  sum = 0;

  for (let i = 1; i <= 10; i++) {
    sum += Number(cpf.substring(i - 1, i)) * (12 - i);
  }

  rest = (sum * 10) % 11;
  if (rest >= 10) rest = 0;

  return rest === Number(cpf.substring(10, 11));
}
