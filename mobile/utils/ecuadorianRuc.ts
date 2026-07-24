export type RucValidationResult =
  | { status: 'empty' | 'incomplete' | 'invalid'; message: string }
  | { status: 'valid'; message: string };

const VALID_PROVINCE_CODES = new Set([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
  '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '30',
]);

function modulo11CheckDigit(digits: number[], weights: number[]): number {
  const remainder = digits.reduce((sum, digit, index) => sum + digit * weights[index], 0) % 11;
  const result = 11 - remainder;

  return result === 11 ? 0 : result === 10 ? -1 : result;
}

function hasValidNaturalPersonId(ruc: string): boolean {
  const digits = ruc.slice(0, 10).split('').map(Number);

  // En módulo 10, los productos mayores a 9 se reducen sumando sus dígitos.
  const normalizedSum = digits.slice(0, 9).reduce((sum, digit, index) => {
    const product = digit * (index % 2 === 0 ? 2 : 1);
    return sum + (product > 9 ? product - 9 : product);
  }, 0);
  const checkDigit = (10 - (normalizedSum % 10)) % 10;

  return checkDigit === digits[9] && Number(ruc.slice(10)) > 0;
}

export function validateEcuadorianRuc(value: string): RucValidationResult {
  if (value.length === 0) {
    return { status: 'empty', message: 'Ingresa el RUC de tu negocio.' };
  }

  if (!/^\d+$/.test(value) || value.length !== 13) {
    return { status: 'incomplete', message: 'El RUC debe contener 13 digitos.' };
  }

  if (!VALID_PROVINCE_CODES.has(value.slice(0, 2)) || value === '0000000000000') {
    return { status: 'invalid', message: 'Ingresa un RUC ecuatoriano valido.' };
  }

  const digits = value.split('').map(Number);
  const thirdDigit = digits[2];
  let isValid = false;

  if (thirdDigit >= 0 && thirdDigit <= 5) {
    isValid = hasValidNaturalPersonId(value);
  } else if (thirdDigit === 6) {
    const checkDigit = modulo11CheckDigit(digits.slice(0, 8), [3, 2, 7, 6, 5, 4, 3, 2]);
    isValid = checkDigit === digits[8] && Number(value.slice(9)) > 0;
  } else if (thirdDigit === 9) {
    const checkDigit = modulo11CheckDigit(digits.slice(0, 9), [4, 3, 2, 7, 6, 5, 4, 3, 2]);
    isValid = checkDigit === digits[9] && Number(value.slice(10)) > 0;
  }

  return isValid
    ? { status: 'valid', message: 'RUC valido.' }
    : { status: 'invalid', message: 'Ingresa un RUC ecuatoriano valido.' };
}
