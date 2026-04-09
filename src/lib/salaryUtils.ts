/**
 * Angolan Salary Calculation Utilities (2024/2025)
 */

export const calculateINSSWorker = (baseSalary: number): number => {
  return baseSalary * 0.03;
};

export const calculateINSSCompany = (baseSalary: number): number => {
  return baseSalary * 0.08;
};

/**
 * IRT Calculation (Imposto sobre Rendimento do Trabalho)
 * Based on the progressive table for Angola.
 * Note: IRT is calculated on (Base Salary - INSS).
 */
export const calculateIRT = (taxableIncome: number): number => {
  if (taxableIncome <= 100000) return 0;

  if (taxableIncome <= 150000) {
    return (taxableIncome - 100000) * 0.10;
  }
  if (taxableIncome <= 200000) {
    return 5000 + (taxableIncome - 150000) * 0.13;
  }
  if (taxableIncome <= 300000) {
    return 11500 + (taxableIncome - 200000) * 0.16;
  }
  if (taxableIncome <= 500000) {
    return 27500 + (taxableIncome - 300000) * 0.18;
  }
  if (taxableIncome <= 1000000) {
    return 63500 + (taxableIncome - 500000) * 0.19;
  }
  if (taxableIncome <= 1500000) {
    return 158500 + (taxableIncome - 1000000) * 0.20;
  }
  if (taxableIncome <= 2000000) {
    return 258500 + (taxableIncome - 1500000) * 0.21;
  }
  if (taxableIncome <= 5000000) {
    return 363500 + (taxableIncome - 2000000) * 0.22;
  }
  if (taxableIncome <= 10000000) {
    return 1023500 + (taxableIncome - 5000000) * 0.23;
  }
  
  return 2173500 + (taxableIncome - 10000000) * 0.25;
};

export const calculateNetSalary = (baseSalary: number) => {
  const inssWorker = calculateINSSWorker(baseSalary);
  const taxableIncome = baseSalary - inssWorker;
  const irt = calculateIRT(taxableIncome);
  const netSalary = taxableIncome - irt;

  return {
    inssWorker,
    inssCompany: calculateINSSCompany(baseSalary),
    irt,
    netSalary,
    taxableIncome
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
  }).format(value).replace('AOA', 'Kz');
};
