import { useEffect, useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export const AddIncomeForm = () => {
  const { addIncome, selectedMonth } = useFinance();

  const defaultDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() + 1 === month) {
      return today.toISOString().split('T')[0];
    }
    return `${selectedMonth}-01`;
  }, [selectedMonth]);

  const [date, setDate] = useState(defaultDate);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Por favor, insira um valor válido');
      return;
    }

    addIncome({
      date,
      amount: parseFloat(amount),
      description,
    });

    toast.success('Receita adicionada com sucesso!');
    setAmount('');
    setDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-success" />
          Adicionar Receita
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-date">Data</Label>
            <Input
              id="income-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-amount">Valor (R$)</Label>
            <Input
              id="income-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-description">Descrição</Label>
            <Textarea
              id="income-description"
              placeholder="Salário, freelance, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            Adicionar Receita
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
