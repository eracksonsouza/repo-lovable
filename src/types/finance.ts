export interface Income {
  id: string;
  date: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  isInstallment?: boolean;
  installmentId?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Installment {
  id: string;
  name: string;
  totalAmount: number;
  installments: number;
  startDate: string;
  category: string;
  monthlyAmount: number;
  paidInstallments: number;
  createdAt: string;
}

export interface MonthlyFinanceSnapshot {
  incomes: Income[];
  expenses: Expense[];
  installments: Installment[];
}

export interface FinanceData {
  version: number;
  categories: Category[];
  monthlyData: Record<string, MonthlyFinanceSnapshot>;
}
