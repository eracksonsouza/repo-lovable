import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  Income,
  Expense,
  Category,
  Installment,
  FinanceData,
  MonthlyFinanceSnapshot,
} from '@/types/finance';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Mercado', color: '#10B981', icon: '🛒' },
  { id: '2', name: 'iFood', color: '#EF4444', icon: '🍔' },
  { id: '3', name: 'Transporte', color: '#3B82F6', icon: '🚗' },
  { id: '4', name: 'Saúde', color: '#EC4899', icon: '💊' },
  { id: '5', name: 'Educação', color: '#8B5CF6', icon: '📚' },
];

const STORAGE_KEY = 'financeData';
const SELECTED_MONTH_KEY = 'financeSelectedMonth';
const CURRENT_VERSION = 2;

const createEmptySnapshot = (): MonthlyFinanceSnapshot => ({
  incomes: [],
  expenses: [],
  installments: [],
});

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthKeyFromDate = (date: string) => {
  if (!date) {
    return getCurrentMonthKey();
  }

  return date.slice(0, 7);
};

interface FinanceContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  incomes: Income[];
  expenses: Expense[];
  installments: Installment[];
  allExpenses: Expense[];
  allInstallments: Array<Installment & { month: string }>;
  categories: Category[];
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addInstallment: (
    installment: Omit<Installment, 'id' | 'createdAt' | 'paidInstallments' | 'monthlyAmount'>
  ) => void;
  deleteIncome: (id: string) => void;
  deleteExpense: (id: string) => void;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
  getMonthlyTotals: (month: string) => { income: number; expense: number };
  getMonthSnapshot: (month: string) => MonthlyFinanceSnapshot;
  exportData: () => string;
  importData: (jsonData: string) => void;
  resetData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface LegacyFinanceData {
  incomes?: Income[];
  expenses?: Expense[];
  categories?: Category[];
  installments?: Installment[];
}

const mergeCategories = (saved?: Category[]) => {
  if (!saved || saved.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  const existingNames = new Set(saved.map(category => category.name));
  const missingDefaults = DEFAULT_CATEGORIES.filter(defaultCategory => !existingNames.has(defaultCategory.name));

  return [...saved, ...missingDefaults];
};

const migrateLegacyData = (legacy: LegacyFinanceData): FinanceData => {
  const monthlyData: Record<string, MonthlyFinanceSnapshot> = {};

  const ensureMonth = (month: string) => {
    if (!monthlyData[month]) {
      monthlyData[month] = createEmptySnapshot();
    }
    return monthlyData[month];
  };

  legacy.incomes?.forEach(income => {
    const monthKey = getMonthKeyFromDate(income.date);
    const monthData = ensureMonth(monthKey);
    monthData.incomes = [...monthData.incomes, income];
  });

  legacy.expenses?.forEach(expense => {
    const monthKey = getMonthKeyFromDate(expense.date);
    const monthData = ensureMonth(monthKey);
    monthData.expenses = [...monthData.expenses, expense];
  });

  legacy.installments?.forEach(installment => {
    const monthKey = getMonthKeyFromDate(installment.startDate);
    const monthData = ensureMonth(monthKey);
    monthData.installments = [...monthData.installments, installment];
  });

  if (Object.keys(monthlyData).length === 0) {
    monthlyData[getCurrentMonthKey()] = createEmptySnapshot();
  }

  return {
    version: CURRENT_VERSION,
    categories: mergeCategories(legacy.categories),
    monthlyData,
  };
};

const normalizeFinanceData = (raw: unknown): FinanceData => {
  if (!raw || typeof raw !== 'object') {
    return {
      version: CURRENT_VERSION,
      categories: DEFAULT_CATEGORIES,
      monthlyData: { [getCurrentMonthKey()]: createEmptySnapshot() },
    };
  }

  const candidate = raw as Partial<FinanceData> & { version?: number };

  if (typeof candidate.version === 'number' && candidate.monthlyData) {
    const monthlyData: Record<string, MonthlyFinanceSnapshot> = {};

    Object.entries(candidate.monthlyData).forEach(([monthKey, snapshot]) => {
      const safeSnapshot = snapshot as Partial<MonthlyFinanceSnapshot> | undefined;
      monthlyData[monthKey] = {
        incomes: Array.isArray(safeSnapshot?.incomes) ? safeSnapshot!.incomes : [],
        expenses: Array.isArray(safeSnapshot?.expenses) ? safeSnapshot!.expenses : [],
        installments: Array.isArray(safeSnapshot?.installments) ? safeSnapshot!.installments : [],
      };
    });

    if (Object.keys(monthlyData).length === 0) {
      monthlyData[getCurrentMonthKey()] = createEmptySnapshot();
    }

    return {
      version: CURRENT_VERSION,
      categories: mergeCategories(candidate.categories),
      monthlyData,
    };
  }

  return migrateLegacyData(raw as LegacyFinanceData);
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyFinanceSnapshot>>({
    [getCurrentMonthKey()]: createEmptySnapshot(),
  });
  const [selectedMonth, setSelectedMonthState] = useState<string>(getCurrentMonthKey());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedMonth = localStorage.getItem(SELECTED_MONTH_KEY);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const normalized = normalizeFinanceData(parsed);

        setCategories(normalized.categories);
        setMonthlyData(normalized.monthlyData);

        const months = Object.keys(normalized.monthlyData).sort((a, b) => a.localeCompare(b));
        if (savedMonth && normalized.monthlyData[savedMonth]) {
          setSelectedMonthState(savedMonth);
        } else if (months.length > 0) {
          const current = getCurrentMonthKey();
          const fallback = months.includes(current) ? current : months[months.length - 1];
          setSelectedMonthState(fallback);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const data: FinanceData = {
      version: CURRENT_VERSION,
      categories,
      monthlyData,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [categories, monthlyData, isInitialized]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    localStorage.setItem(SELECTED_MONTH_KEY, selectedMonth);
  }, [selectedMonth, isInitialized]);

  const availableMonths = useMemo(() => {
    return Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
  }, [monthlyData]);

  const currentSnapshot = useMemo(() => {
    return monthlyData[selectedMonth] ?? createEmptySnapshot();
  }, [monthlyData, selectedMonth]);

  const allExpenses = useMemo(() => {
    return Object.values(monthlyData).flatMap(snapshot => snapshot.expenses);
  }, [monthlyData]);

  const allInstallments = useMemo(() => {
    return Object.entries(monthlyData).flatMap(([month, snapshot]) =>
      snapshot.installments.map(installment => ({ ...installment, month }))
    );
  }, [monthlyData]);

  const ensureMonthExists = useCallback((month: string) => {
    setMonthlyData(prev => {
      if (prev[month]) {
        return prev;
      }
      return {
        ...prev,
        [month]: createEmptySnapshot(),
      };
    });
  }, []);

  const setSelectedMonth = useCallback(
    (month: string) => {
      ensureMonthExists(month);
      setSelectedMonthState(month);
    },
    [ensureMonthExists]
  );

  const addIncome = useCallback((income: Omit<Income, 'id' | 'createdAt'>) => {
    const monthKey = getMonthKeyFromDate(income.date);
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setMonthlyData(prev => {
      const snapshot = prev[monthKey] ?? createEmptySnapshot();
      return {
        ...prev,
        [monthKey]: {
          ...snapshot,
          incomes: [...snapshot.incomes, newIncome],
        },
      };
    });
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const monthKey = getMonthKeyFromDate(expense.date);
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setMonthlyData(prev => {
      const snapshot = prev[monthKey] ?? createEmptySnapshot();
      return {
        ...prev,
        [monthKey]: {
          ...snapshot,
          expenses: [...snapshot.expenses, newExpense],
        },
      };
    });
  }, []);

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    };

    setCategories(prev => [...prev, newCategory]);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(category => category.id !== id));
  }, []);

  const addInstallment = useCallback(
    (
      installment: Omit<Installment, 'id' | 'createdAt' | 'paidInstallments' | 'monthlyAmount'>
    ) => {
      const monthlyAmount = Number((installment.totalAmount / installment.installments).toFixed(2));
      const newInstallment: Installment = {
        ...installment,
        id: crypto.randomUUID(),
        monthlyAmount,
        paidInstallments: 0,
        createdAt: new Date().toISOString(),
      };

      const startDate = new Date(installment.startDate);

      setMonthlyData(prev => {
        const updated = { ...prev } as Record<string, MonthlyFinanceSnapshot>;

        const addToMonth = (monthKey: string, updater: (snapshot: MonthlyFinanceSnapshot) => MonthlyFinanceSnapshot) => {
          const snapshot = updated[monthKey] ?? createEmptySnapshot();
          updated[monthKey] = updater(snapshot);
        };

        const startMonthKey = getMonthKeyFromDate(installment.startDate);
        addToMonth(startMonthKey, snapshot => ({
          ...snapshot,
          installments: [...snapshot.installments, newInstallment],
        }));

        for (let index = 0; index < installment.installments; index += 1) {
          const installmentDate = new Date(startDate);
          installmentDate.setMonth(startDate.getMonth() + index);

          const dateString = installmentDate.toISOString().split('T')[0];

          const expenseEntry: Expense = {
            id: crypto.randomUUID(),
            date: dateString,
            amount: monthlyAmount,
            category: installment.category,
            description: `${installment.name} (${index + 1}/${installment.installments})`,
            isInstallment: true,
            installmentId: newInstallment.id,
            createdAt: new Date().toISOString(),
          };

          const expenseMonthKey = getMonthKeyFromDate(dateString);
          addToMonth(expenseMonthKey, snapshot => ({
            ...snapshot,
            expenses: [...snapshot.expenses, expenseEntry],
          }));
        }

        return updated;
      });
    },
    []
  );

  const deleteById = useCallback(
    (id: string, key: 'incomes' | 'expenses') => {
      setMonthlyData(prev => {
        let hasChanges = false;
        const nextEntries: Record<string, MonthlyFinanceSnapshot> = {};

        Object.entries(prev).forEach(([month, snapshot]) => {
          const filtered = snapshot[key].filter(item => item.id !== id);
          if (filtered.length !== snapshot[key].length) {
            hasChanges = true;
            nextEntries[month] = {
              ...snapshot,
              [key]: filtered,
            };
          } else {
            nextEntries[month] = snapshot;
          }
        });

        return hasChanges ? nextEntries : prev;
      });
    },
    []
  );

  const deleteIncome = useCallback((id: string) => {
    deleteById(id, 'incomes');
  }, [deleteById]);

  const deleteExpense = useCallback((id: string) => {
    deleteById(id, 'expenses');
  }, [deleteById]);

  const getTotalIncome = useCallback(() => {
    return currentSnapshot.incomes.reduce((sum, income) => sum + income.amount, 0);
  }, [currentSnapshot]);

  const getTotalExpenses = useCallback(() => {
    return currentSnapshot.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [currentSnapshot]);

  const getBalance = useCallback(() => {
    return getTotalIncome() - getTotalExpenses();
  }, [getTotalIncome, getTotalExpenses]);

  const getMonthlyTotals = useCallback(
    (month: string) => {
      const snapshot = monthlyData[month] ?? createEmptySnapshot();
      const income = snapshot.incomes.reduce((sum, item) => sum + item.amount, 0);
      const expense = snapshot.expenses.reduce((sum, item) => sum + item.amount, 0);

      return { income, expense };
    },
    [monthlyData]
  );

  const getMonthSnapshot = useCallback(
    (month: string) => {
      return monthlyData[month] ?? createEmptySnapshot();
    },
    [monthlyData]
  );

  const exportData = useCallback(() => {
    const data: FinanceData = {
      version: CURRENT_VERSION,
      categories,
      monthlyData,
    };
    return JSON.stringify(data, null, 2);
  }, [categories, monthlyData]);

  const importData = useCallback((jsonData: string) => {
    const parsed = JSON.parse(jsonData);
    const normalized = normalizeFinanceData(parsed);

    setCategories(normalized.categories);
    setMonthlyData(normalized.monthlyData);

    const months = Object.keys(normalized.monthlyData).sort((a, b) => a.localeCompare(b));
    const fallbackMonth = months.includes(selectedMonth)
      ? selectedMonth
      : months[months.length - 1] ?? getCurrentMonthKey();

    setSelectedMonthState(fallbackMonth);
  }, [selectedMonth]);

  const resetData = useCallback(() => {
    const current = getCurrentMonthKey();
    setCategories(DEFAULT_CATEGORIES);
    setMonthlyData({ [current]: createEmptySnapshot() });
    setSelectedMonthState(current);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SELECTED_MONTH_KEY);
  }, []);

  const contextValue: FinanceContextType = {
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    incomes: currentSnapshot.incomes,
    expenses: currentSnapshot.expenses,
    installments: currentSnapshot.installments,
    allExpenses,
    allInstallments,
    categories,
    addIncome,
    addExpense,
    addCategory,
    deleteCategory,
    addInstallment,
    deleteIncome,
    deleteExpense,
    getTotalIncome,
    getTotalExpenses,
    getBalance,
    getMonthlyTotals,
    getMonthSnapshot,
    exportData,
    importData,
    resetData,
  };

  return <FinanceContext.Provider value={contextValue}>{children}</FinanceContext.Provider>;
};
