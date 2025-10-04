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
  MonthlyFinanceSnapshot,
} from '@/types/finance';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

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
  loading: boolean;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addInstallment: (
    installment: Omit<Installment, 'id' | 'createdAt' | 'paidInstallments' | 'monthlyAmount'>
  ) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
  getMonthlyTotals: (month: string) => { income: number; expense: number };
  getMonthSnapshot: (month: string) => MonthlyFinanceSnapshot;
  resetData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allInstallments, setAllInstallments] = useState<Array<Installment & { month: string }>>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [loading, setLoading] = useState(true);

  // Load data when user changes
  useEffect(() => {
    const loadCategories = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }

      const formattedCategories: Category[] = data.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      }));

      setCategories(formattedCategories);
    };

    const loadIncomes = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar receitas:', error);
        return;
      }

      const formattedIncomes: Income[] = data.map(income => ({
        id: income.id,
        date: income.date,
        amount: parseFloat(income.amount),
        description: income.description,
        createdAt: income.created_at,
      }));

      setIncomes(formattedIncomes);
    };

    const loadExpenses = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          categories (name)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar despesas:', error);
        return;
      }

      const formattedExpenses: Expense[] = data.map(expense => ({
        id: expense.id,
        date: expense.date,
        amount: parseFloat(expense.amount),
        description: expense.description,
        category: expense.categories?.name || 'Sem categoria',
        isInstallment: expense.is_installment || false,
        installmentId: expense.installment_id,
        createdAt: expense.created_at,
      }));

      setExpenses(formattedExpenses);
      setAllExpenses(formattedExpenses);
    };

    const loadInstallments = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('installments')
        .select(`
          *,
          categories (name)
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar parcelamentos:', error);
        return;
      }

      const formattedInstallments: Installment[] = data.map(installment => ({
        id: installment.id,
        name: installment.name,
        totalAmount: parseFloat(installment.total_amount),
        installments: installment.installments,
        monthlyAmount: parseFloat(installment.monthly_amount),
        paidInstallments: installment.paid_installments,
        startDate: installment.start_date,
        category: installment.categories?.name || 'Sem categoria',
        createdAt: installment.created_at,
      }));

      setInstallments(formattedInstallments);
      
      // Add month info for allInstallments
      const installmentsWithMonth = formattedInstallments.map(inst => ({
        ...inst,
        month: getMonthKeyFromDate(inst.startDate),
      }));
      setAllInstallments(installmentsWithMonth);
    };

    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        await Promise.all([
          loadCategories(),
          loadExpenses(),
          loadIncomes(),
          loadInstallments(),
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    } else {
      // Clear data when user logs out
      setCategories([]);
      setIncomes([]);
      setExpenses([]);
      setInstallments([]);
      setAllExpenses([]);
      setAllInstallments([]);
      setLoading(false);
    }
  }, [user]);



  // Filtered data based on selected month
  const currentMonthIncomes = useMemo(() => {
    return incomes.filter(income => getMonthKeyFromDate(income.date) === selectedMonth);
  }, [incomes, selectedMonth]);

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(expense => getMonthKeyFromDate(expense.date) === selectedMonth);
  }, [expenses, selectedMonth]);

  const currentMonthInstallments = useMemo(() => {
    return installments.filter(installment => getMonthKeyFromDate(installment.startDate) === selectedMonth);
  }, [installments, selectedMonth]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    incomes.forEach(income => months.add(getMonthKeyFromDate(income.date)));
    expenses.forEach(expense => months.add(getMonthKeyFromDate(expense.date)));
    installments.forEach(installment => months.add(getMonthKeyFromDate(installment.startDate)));
    
    // Always include current month
    months.add(getCurrentMonthKey());
    
    return Array.from(months).sort((a, b) => a.localeCompare(b));
  }, [incomes, expenses, installments]);

  const addIncome = useCallback(async (income: Omit<Income, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('incomes')
      .insert({
        user_id: user.id,
        amount: income.amount,
        description: income.description,
        date: income.date,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar receita:', error);
      throw error;
    }

    const newIncome: Income = {
      id: data.id,
      date: data.date,
      amount: parseFloat(data.amount),
      description: data.description,
      createdAt: data.created_at,
    };

    setIncomes(prev => [newIncome, ...prev]);
  }, [user]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) return;

    // Find category ID by name
    const category = categories.find(cat => cat.name === expense.category);

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        category_id: category?.id || null,
        is_installment: expense.isInstallment || false,
        installment_id: expense.installmentId || null,
      })
      .select(`
        *,
        categories (name)
      `)
      .single();

    if (error) {
      console.error('Erro ao adicionar despesa:', error);
      throw error;
    }

    const newExpense: Expense = {
      id: data.id,
      date: data.date,
      amount: parseFloat(data.amount),
      description: data.description,
      category: data.categories?.name || 'Sem categoria',
      isInstallment: data.is_installment || false,
      installmentId: data.installment_id,
      createdAt: data.created_at,
    };

    setExpenses(prev => [newExpense, ...prev]);
    setAllExpenses(prev => [newExpense, ...prev]);
  }, [user, categories]);

  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: category.name,
        color: category.color,
        icon: category.icon || '📁',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar categoria:', error);
      throw error;
    }

    const newCategory: Category = {
      id: data.id,
      name: data.name,
      color: data.color,
      icon: data.icon,
    };

    setCategories(prev => [...prev, newCategory]);
  }, [user]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar categoria:', error);
      throw error;
    }

    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, [user]);

  const addInstallment = useCallback(async (
    installment: Omit<Installment, 'id' | 'createdAt' | 'paidInstallments' | 'monthlyAmount'>
  ) => {
    if (!user) return;

    const monthlyAmount = Number((installment.totalAmount / installment.installments).toFixed(2));
    const category = categories.find(cat => cat.name === installment.category);

    const { data, error } = await supabase
      .from('installments')
      .insert({
        user_id: user.id,
        name: installment.name,
        total_amount: installment.totalAmount,
        installments: installment.installments,
        monthly_amount: monthlyAmount,
        paid_installments: 0,
        start_date: installment.startDate,
        category_id: category?.id || null,
      })
      .select(`
        *,
        categories (name)
      `)
      .single();

    if (error) {
      console.error('Erro ao adicionar parcelamento:', error);
      throw error;
    }

    const newInstallment: Installment = {
      id: data.id,
      name: data.name,
      totalAmount: parseFloat(data.total_amount),
      installments: data.installments,
      monthlyAmount: parseFloat(data.monthly_amount),
      paidInstallments: data.paid_installments,
      startDate: data.start_date,
      category: data.categories?.name || 'Sem categoria',
      createdAt: data.created_at,
    };

    setInstallments(prev => [newInstallment, ...prev]);

    // Create expenses for each installment
    const startDate = new Date(installment.startDate);
    const expensePromises = [];

    for (let index = 0; index < installment.installments; index++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + index);
      const dateString = installmentDate.toISOString().split('T')[0];

      expensePromises.push(
        addExpense({
          date: dateString,
          amount: monthlyAmount,
          category: installment.category,
          description: `${installment.name} (${index + 1}/${installment.installments})`,
          isInstallment: true,
          installmentId: data.id,
        })
      );
    }

    await Promise.all(expensePromises);
  }, [user, categories, addExpense]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar receita:', error);
      throw error;
    }

    setIncomes(prev => prev.filter(income => income.id !== id));
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar despesa:', error);
      throw error;
    }

    setExpenses(prev => prev.filter(expense => expense.id !== id));
    setAllExpenses(prev => prev.filter(expense => expense.id !== id));
  }, [user]);

  const getTotalIncome = useCallback(() => {
    return currentMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
  }, [currentMonthIncomes]);

  const getTotalExpenses = useCallback(() => {
    return currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [currentMonthExpenses]);

  const getBalance = useCallback(() => {
    return getTotalIncome() - getTotalExpenses();
  }, [getTotalIncome, getTotalExpenses]);

  const getMonthlyTotals = useCallback(
    (month: string) => {
      const monthIncomes = incomes.filter(income => getMonthKeyFromDate(income.date) === month);
      const monthExpenses = expenses.filter(expense => getMonthKeyFromDate(expense.date) === month);
      
      const income = monthIncomes.reduce((sum, item) => sum + item.amount, 0);
      const expense = monthExpenses.reduce((sum, item) => sum + item.amount, 0);

      return { income, expense };
    },
    [incomes, expenses]
  );

  const getMonthSnapshot = useCallback(
    (month: string) => {
      const monthIncomes = incomes.filter(income => getMonthKeyFromDate(income.date) === month);
      const monthExpenses = expenses.filter(expense => getMonthKeyFromDate(expense.date) === month);
      const monthInstallments = installments.filter(installment => getMonthKeyFromDate(installment.startDate) === month);

      return {
        incomes: monthIncomes,
        expenses: monthExpenses,
        installments: monthInstallments,
      };
    },
    [incomes, expenses, installments]
  );

  const resetData = useCallback(async () => {
    if (!user) return;

    // Delete all user data
    await Promise.all([
      supabase.from('expenses').delete().eq('user_id', user.id),
      supabase.from('incomes').delete().eq('user_id', user.id),
      supabase.from('installments').delete().eq('user_id', user.id),
      supabase.from('categories').delete().eq('user_id', user.id),
    ]);

    // Clear local state
    setCategories([]);
    setIncomes([]);
    setExpenses([]);
    setInstallments([]);
    setAllExpenses([]);
    setAllInstallments([]);
  }, [user]);

  const contextValue: FinanceContextType = {
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    incomes: currentMonthIncomes,
    expenses: currentMonthExpenses,
    installments: currentMonthInstallments,
    allExpenses,
    allInstallments,
    categories,
    loading,
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
    resetData,
  };

  return <FinanceContext.Provider value={contextValue}>{children}</FinanceContext.Provider>;
};