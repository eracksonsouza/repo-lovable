import { useEffect, useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export const AddExpenseForm = () => {
  const { addExpense, categories, selectedMonth } = useFinance();

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
  const [category, setCategory] = useState('');
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

    if (!category) {
      toast.error('Por favor, selecione uma categoria');
      return;
    }

    addExpense({
      date,
      amount: parseFloat(amount),
      category,
      description,
    });

    toast.success('Despesa adicionada com sucesso!');
    setAmount('');
    setDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
          Adicionar Despesa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-date">Data</Label>
            <Input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Valor (R$)</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-category">Categoria</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="expense-category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-description">Descrição</Label>
            <Textarea
              id="expense-description"
              placeholder="Detalhes da despesa"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            Adicionar Despesa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
