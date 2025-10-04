import { useFinance } from '@/contexts/FinanceContext';
import { StatsCard } from '@/components/StatsCard';
import { ExpenseChart } from '@/components/ExpenseChart';
import { MonthlyChart } from '@/components/MonthlyChart';
import { UpcomingInstallments } from '@/components/UpcomingInstallments';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const formatMonthLabel = (monthKey: string) => {
  const date = new Date(`${monthKey}-01T00:00:00`);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const Dashboard = () => {
  const { getTotalIncome, getTotalExpenses, getBalance, selectedMonth } = useFinance();

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças em {formatMonthLabel(selectedMonth)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total de Receitas"
          value={`R$ ${totalIncome.toFixed(2)}`}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="income"
        />
        <StatsCard
          title="Total de Despesas"
          value={`R$ ${totalExpenses.toFixed(2)}`}
          icon={<TrendingDown className="h-6 w-6" />}
          variant="expense"
        />
        <StatsCard
          title="Saldo Atual"
          value={`R$ ${balance.toFixed(2)}`}
          icon={<Wallet className="h-6 w-6" />}
          variant="balance"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseChart />
        <MonthlyChart />
      </div>

      <UpcomingInstallments />
    </div>
  );
};

export default Dashboard;
