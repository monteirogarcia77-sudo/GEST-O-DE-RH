export interface Employee {
  id?: string;
  name: string;
  bi: string;
  nif: string;
  inss: string;
  role: string;
  department: string;
  baseSalary: number;
  admissionDate: string;
  contractType: 'Efetivo' | 'Temporário';
  status: 'Active' | 'Inactive';
}

export interface Attendance {
  id?: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent_J' | 'Absent_U' | 'Late' | 'Vacation';
  overtimeHours: number;
  notes?: string;
}

export interface PerformanceRecord {
  id?: string;
  employeeId: string;
  date: string;
  score: number; // 0-100
  productivity: string; // High, Medium, Low
  feedback: string;
  evaluator: string;
}

export interface CareerAction {
  id?: string;
  employeeId: string;
  date: string;
  type: 'Promotion' | 'Salary_Increase' | 'Dept_Change' | 'Contract_Update';
  description: string;
  previousValue: string;
  newValue: string;
}

export interface Payroll {
  id?: string;
  employeeId: string;
  employeeName?: string;
  month: number;
  year: number;
  baseSalary: number;
  inssWorker: number;
  inssCompany: number;
  irt: number;
  netSalary: number;
  status: 'Draft' | 'Paid';
  createdAt: string;
}

export interface Vacation {
  id?: string;
  employeeId: string;
  employeeName?: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'Planned' | 'Approved' | 'Completed' | 'Cancelled';
  year: number;
}

export interface Expense {
  id?: string;
  description: string;
  category: string;
  date: string;
  location: string;
  amount: number;
  paymentMethod: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}
