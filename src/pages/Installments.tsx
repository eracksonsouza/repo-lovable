import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { UpcomingInstallments } from '@/components/UpcomingInstallments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreditCard } from 'lucide-react';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (dateString?: string) =>
  dateString
    ? new Date(`${dateString}T00:00:00`).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : '—';

const Installments = () => {
  const { allInstallments, allExpenses, categories } = useFinance();

  const categoryMap = useMemo(() => {
    return categories.reduce<Record<string, { icon?: string }>>((map, category) => {
      map[category.name] = { icon: category.icon };
      return map;
    }, {});
  }, [categories]);

  const today = useMemo(() => {
    const reference = new Date();
    reference.setHours(0, 0, 0, 0);
    return reference;
  }, []);

  const installmentsWithStats = useMemo(() => {
    return allInstallments
      .map(installment => {
        const relatedExpenses = allExpenses
          .filter(expense => expense.installmentId === installment.id)
          .sort((a, b) => a.date.localeCompare(b.date));

        const paidExpenses = relatedExpenses.filter(expense => {
          const expenseDate = new Date(`${expense.date}T00:00:00`);
          return expenseDate < today;
        });

        const paidCount = paidExpenses.length;
        const totalPaid = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const remainingPayments = Math.max(installment.installments - paidCount, 0);
        const nextPayment = relatedExpenses.find(expense => {
          const expenseDate = new Date(`${expense.date}T00:00:00`);
          return expenseDate >= today;
        });

        const remainingAmount = Number((remainingPayments * installment.monthlyAmount).toFixed(2));

        const statusLabel = remainingPayments === 0
          ? 'Concluído'
          : nextPayment && new Date(`${nextPayment.date}T00:00:00`) < today
          ? 'Atrasado'
          : 'Em andamento';

        return {
          ...installment,
          paidCount,
          totalPaid,
          remainingPayments,
          remainingAmount,
          nextPaymentDate: nextPayment?.date,
          statusLabel,
        };
      })
      .sort((a, b) => {
        if (!a.nextPaymentDate) return 1;
        if (!b.nextPaymentDate) return -1;
        return a.nextPaymentDate.localeCompare(b.nextPaymentDate);
      });
  }, [allExpenses, allInstallments, today]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Parcelamentos</h1>
      </div>
      <p className="text-muted-foreground">
        Acompanhe todas as compras parceladas, próximos vencimentos e valores restantes.
      </p>

      <UpcomingInstallments />

      <Card>
        <CardHeader>
          <CardTitle>Todos os parcelamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {installmentsWithStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum parcelamento cadastrado até o momento.</p>
          ) : (
            <ScrollArea className="h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Próxima parcela</TableHead>
                    <TableHead>Total pago</TableHead>
                    <TableHead>Restante</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentsWithStats.map(installment => (
                    <TableRow key={installment.id}>
                      <TableCell className="font-medium">{installment.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryMap[installment.category]?.icon ?? '💳'}</span>
                          {installment.category}
                        </div>
                      </TableCell>
                      <TableCell>
                        {installment.paidCount}/{installment.installments}
                      </TableCell>
                      <TableCell>{formatDate(installment.nextPaymentDate)}</TableCell>
                      <TableCell className="text-success font-semibold">
                        {formatCurrency(installment.totalPaid)}
                      </TableCell>
                      <TableCell className="text-destructive font-semibold">
                        {formatCurrency(installment.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            installment.statusLabel === 'Concluído'
                              ? 'default'
                              : installment.statusLabel === 'Atrasado'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {installment.statusLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Installments;
