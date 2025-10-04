import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  variant?: 'income' | 'expense' | 'balance';
  trend?: string;
}

export const StatsCard = ({ title, value, icon, variant = 'balance', trend }: StatsCardProps) => {
  const variantStyles = {
    income: 'border-success/20 bg-success/5',
    expense: 'border-destructive/20 bg-destructive/5',
    balance: 'border-primary/20 bg-primary/5',
  };

  const iconStyles = {
    income: 'bg-success/10 text-success',
    expense: 'bg-destructive/10 text-destructive',
    balance: 'bg-primary/10 text-primary',
  };

  return (
    <Card className={cn('border-2 transition-all hover:shadow-lg', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground">{trend}</p>
            )}
          </div>
          <div className={cn('rounded-full p-3', iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
