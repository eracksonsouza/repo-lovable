import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const formatMonthLabel = (monthKey: string) => {
  const date = new Date(`${monthKey}-01T00:00:00`);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const getMonthOffsetKey = (monthKey: string, offset: number) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const MonthSelector = () => {
  const { selectedMonth, setSelectedMonth, availableMonths } = useFinance();

  const monthOptions = useMemo(() => {
    const unique = new Set([...availableMonths, selectedMonth]);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [availableMonths, selectedMonth]);

  const handleOffset = (offset: number) => {
    const target = getMonthOffsetKey(selectedMonth, offset);
    setSelectedMonth(target);
  };

  return (
    <div className="w-full rounded-xl border bg-card/60 backdrop-blur p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Controle Mensal</p>
            <p className="text-lg font-semibold capitalize">{formatMonthLabel(selectedMonth)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleOffset(-1)}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] capitalize">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent className="capitalize">
                {monthOptions
                  .slice()
                  .reverse()
                  .map(month => (
                    <SelectItem key={month} value={month}>
                      {formatMonthLabel(month)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleOffset(1)}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Input
            type="month"
            value={selectedMonth}
            onChange={(event) => event.target.value && setSelectedMonth(event.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
};
