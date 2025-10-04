import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceContext';

const formatMonthLabel = (monthKey: string, options?: Intl.DateTimeFormatOptions) => {
  const date = new Date(`${monthKey}-01T00:00:00`);
  return date.toLocaleDateString('pt-BR', options);
};

export const MonthlyChart = () => {
  const { availableMonths, selectedMonth, getMonthlyTotals } = useFinance();

  const chartMonths = useMemo(() => {
    const uniqueMonths = new Set([...availableMonths, selectedMonth]);
    const sorted = Array.from(uniqueMonths).sort((a, b) => a.localeCompare(b));

    if (sorted.length <= 6) {
      return sorted;
    }

    const selectedIndex = sorted.indexOf(selectedMonth);

    if (selectedIndex === -1) {
      return sorted.slice(-6);
    }

    const start = Math.max(0, selectedIndex - 5);
    return sorted.slice(start, selectedIndex + 1);
  }, [availableMonths, selectedMonth]);

  const chartData = chartMonths.map(month => {
    const totals = getMonthlyTotals(month);
    return {
      month: formatMonthLabel(month, { month: 'short', year: '2-digit' }),
      Receitas: totals.income,
      Despesas: totals.expense,
    };
  });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência Mensal</CardTitle>
          <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência Mensal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimos {chartData.length} meses até {formatMonthLabel(selectedMonth, { month: 'long', year: 'numeric' })}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="Receitas" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Despesas" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
