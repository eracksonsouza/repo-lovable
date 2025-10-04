import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddIncomeForm } from '@/components/AddIncomeForm';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { AddInstallmentForm } from '@/components/AddInstallmentForm';

const AddEntry = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Adicionar Lançamento</h1>
        <p className="text-muted-foreground">Registre suas receitas, despesas ou parcelamentos</p>
      </div>

      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income">Receita</TabsTrigger>
          <TabsTrigger value="expense">Despesa</TabsTrigger>
          <TabsTrigger value="installment">Parcelamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="income" className="mt-6">
          <AddIncomeForm />
        </TabsContent>
        
        <TabsContent value="expense" className="mt-6">
          <AddExpenseForm />
        </TabsContent>
        
        <TabsContent value="installment" className="mt-6">
          <AddInstallmentForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddEntry;
