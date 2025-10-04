import { useEffect, useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export const AddInstallmentForm = () => {
  const { addInstallment, categories, selectedMonth } = useFinance();
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('');
  const defaultDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() + 1 === month) {
      return today.toISOString().split('T')[0];
    }
    return `${selectedMonth}-01`;
  }, [selectedMonth]);

  const [startDate, setStartDate] = useState(defaultDate);
  const [category, setCategory] = useState('');

  useEffect(() => {
    setStartDate(defaultDate);
  }, [defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error('Por favor, insira um valor total válido');
      return;
    }

    if (!installments || parseInt(installments) <= 0) {
      toast.error('Por favor, insira um número válido de parcelas');
      return;
    }

    if (!category) {
      toast.error('Por favor, selecione uma categoria');
      return;
    }

    addInstallment({
      name,
      totalAmount: parseFloat(totalAmount),
      installments: parseInt(installments),
      startDate,
      category,
    });

    toast.success('Parcelamento adicionado com sucesso!');
    setName('');
    setTotalAmount('');
    setInstallments('');
    setStartDate(defaultDate);
  };

  const monthlyAmount = totalAmount && installments ? 
    (parseFloat(totalAmount) / parseInt(installments)).toFixed(2) : '0.00';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          Adicionar Parcelamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="installment-name">Nome do Item</Label>
            <Input
              id="installment-name"
              type="text"
              placeholder="Ex: Notebook, Sofá, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installment-total">Valor Total (R$)</Label>
            <Input
              id="installment-total"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installment-count">Número de Parcelas</Label>
            <Input
              id="installment-count"
              type="number"
              placeholder="12"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              required
            />
          </div>

          {totalAmount && installments && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Valor mensal:</p>
              <p className="text-lg font-bold">R$ {monthlyAmount}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="installment-date">Data de Início</Label>
            <Input
              id="installment-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="installment-category">Categoria</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="installment-category">
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

          <Button type="submit" className="w-full">
            Adicionar Parcelamento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
