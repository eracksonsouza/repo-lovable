import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Wallet, CalendarDays } from 'lucide-react';
import { Category } from '@/types/finance';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (dateString: string) =>
  new Date(`${dateString}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

const formatMonthLabel = (monthKey: string) =>
  new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

const buildCategoryMap = (categories: Category[]) => {
  return categories.reduce<Record<string, { color: string; icon?: string }>>((map, category) => {
    map[category.name] = { color: category.color, icon: category.icon };
    return map;
  }, {});
};

const MonthlyView = () => {
  const {
    selectedMonth,
    incomes,
    expenses,
    installments,
    categories,
    getTotalIncome,
    getTotalExpenses,
    getBalance,
    allExpenses,
  } = useFinance();

  const monthLabel = formatMonthLabel(selectedMonth);
  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories]);

  const sortedIncomes = useMemo(
    () => [...incomes].sort((a, b) => b.date.localeCompare(a.date)),
    [incomes]
  );

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [expenses]
  );

  const installmentSummaries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return installments.map(installment => {
      const relatedExpenses = allExpenses
        .filter(expense => expense.installmentId === installment.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      const paidExpenses = relatedExpenses.filter(expense => {
        const expenseDate = new Date(`${expense.date}T00:00:00`);
        return expenseDate < today;
      });

      const totalPaid = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remainingAmount = Number((installment.totalAmount - totalPaid).toFixed(2));

      const endDate = new Date(`${installment.startDate}T00:00:00`);
      endDate.setMonth(endDate.getMonth() + installment.installments - 1);
      const endMonthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;

      return {
        ...installment,
        totalPaid,
        remainingAmount,
        endMonthLabel: formatMonthLabel(endMonthKey),
      };
    });
  }, [allExpenses, installments]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Visão Mensal</h1>
        </div>
        <p className="text-muted-foreground">Resumo financeiro de {monthLabel}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Receitas do mês"
          value={formatCurrency(getTotalIncome())}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="income"
        />
        <StatsCard
          title="Despesas do mês"
          value={formatCurrency(getTotalExpenses())}
          icon={<TrendingDown className="h-6 w-6" />}
          variant="expense"
        />
        <StatsCard
          title="Saldo do mês"
          value={formatCurrency(getBalance())}
          icon={<Wallet className="h-6 w-6" />}
          variant="balance"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas</CardTitle>
            <p className="text-sm text-muted-foreground">Todos os lançamentos de entrada em {monthLabel}</p>
          </CardHeader>
          <CardContent>
            {sortedIncomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma receita registrada para este mês.</p>
            ) : (
              <div className="space-y-3">
                {sortedIncomes.map(income => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between rounded-lg border bg-card/50 p-4"
                  >
                    <div>
                      <p className="font-medium">{income.description || 'Receita'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(income.date)}</p>
                    </div>
                    <span className="font-semibold text-success">
                      {formatCurrency(income.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas</CardTitle>
            <p className="text-sm text-muted-foreground">Todos os gastos registrados em {monthLabel}</p>
          </CardHeader>
          <CardContent>
            {sortedExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma despesa registrada para este mês.</p>
            ) : (
              <ScrollArea className="h-[360px] pr-2">
                <div className="space-y-3">
                  {sortedExpenses.map(expense => {
                    const categoryInfo = categoryMap[expense.category];
                    return (
                      <div
                        key={expense.id}
                        className="flex items-start justify-between gap-3 rounded-lg border bg-card/50 p-4"
                        style={{ borderLeft: `4px solid ${categoryInfo?.color ?? '#e5e7eb'}` }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{categoryInfo?.icon ?? '💸'}</span>
                            <p className="font-medium">{expense.description || expense.category}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(expense.date)} · {expense.category}
                          </p>
                          {expense.isInstallment && (
                            <Badge variant="outline" className="text-xs">
                              Parcelamento
                            </Badge>
                          )}
                        </div>
                        <span className="font-semibold text-destructive">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parcelamentos iniciados neste mês</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status dos parcelamentos cadastrados em {monthLabel}
          </p>
        </CardHeader>
        <CardContent>
          {installmentSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum parcelamento registrado neste mês.</p>
          ) : (
            <div className="space-y-4">
              {installmentSummaries.map(installment => (
                <div
                  key={installment.id}
                  className="rounded-lg border bg-card/50 p-4"
                  style={{ borderLeft: `4px solid ${categoryMap[installment.category]?.color ?? '#c084fc'}` }}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{installment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Início em {formatDate(installment.startDate)} · termina em {installment.endMonthLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Categoria: {installment.category}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm md:text-right">
                      <p>
                        {installment.installments}x de{' '}
                        <span className="font-semibold">{formatCurrency(installment.monthlyAmount)}</span>
                      </p>
                      <p>
                        Pago: <span className="font-semibold text-success">{formatCurrency(installment.totalPaid)}</span>
                      </p>
                      <p>
                        Restante:{' '}
                        <span className="font-semibold text-destructive">
                          {formatCurrency(installment.remainingAmount)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyView;
