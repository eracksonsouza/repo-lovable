import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceContext';
import { CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return '—';
  }
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export const UpcomingInstallments = () => {
  const { allInstallments, allExpenses } = useFinance();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingPayments = allInstallments
    .map(installment => {
      const relatedExpenses = allExpenses
        .filter(expense => expense.installmentId === installment.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (relatedExpenses.length === 0) {
        return null;
      }

      const paidCount = relatedExpenses.filter(expense => {
        const expenseDate = new Date(`${expense.date}T00:00:00`);
        return expenseDate < today;
      }).length;

      const nextPayment = relatedExpenses.find(expense => {
        const expenseDate = new Date(`${expense.date}T00:00:00`);
        return expenseDate >= today;
      });

      const remaining = Math.max(installment.installments - paidCount, 0);
      const remainingAmount = Number((remaining * installment.monthlyAmount).toFixed(2));

      if (remaining <= 0) {
        return null;
      }

      return {
        ...installment,
        paidCount,
        remaining,
        remainingAmount,
        nextPaymentDate: nextPayment?.date,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (!a.nextPaymentDate) return 1;
      if (!b.nextPaymentDate) return -1;
      return a.nextPaymentDate.localeCompare(b.nextPaymentDate);
    })
    .slice(0, 5);

  if (upcomingPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Próximas Parcelas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Nenhuma parcela pendente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Próximas Parcelas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingPayments.map(payment => (
            <div key={payment.id} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div className="flex-1 space-y-1">
                <p className="font-medium">{payment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {payment.paidCount}/{payment.installments} pagas
                </p>
                <p className="text-xs text-muted-foreground">
                  Próxima parcela: {formatDate(payment.nextPaymentDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-destructive">
                  R$ {payment.remainingAmount.toFixed(2)}
                </p>
                <Badge variant="outline" className="text-xs">
                  {payment.remaining}x de R$ {payment.monthlyAmount.toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
