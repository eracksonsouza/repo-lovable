import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Investment {
  id: string;
  type: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const Investiments = () => {
  const [selectedType, setSelectedType] = useState("");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    price: "",
  });

  const investmentTypes = [
    { value: "acoes", label: "Ações", icon: "📈" },
    { value: "renda-fixa", label: "Renda Fixa", icon: "💰" },
    { value: "criptos", label: "Criptomoedas", icon: "₿" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddInvestment = () => {
    if (
      !selectedType ||
      !formData.name ||
      !formData.quantity ||
      !formData.price
    ) {
      alert("Preencha todos os campos!");
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);
    const total = quantity * price;

    const newInvestment: Investment = {
      id: Date.now().toString(),
      type: selectedType,
      name: formData.name,
      quantity,
      price,
      total,
    };

    setInvestments([...investments, newInvestment]);
    setFormData({ name: "", quantity: "", price: "" });
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestments(investments.filter((inv) => inv.id !== id));
  };

  // Filtrar investimentos pelo tipo selecionado - CORRIGIDO
  const filteredInvestments = selectedType
    ? investments.filter((inv) => inv.type === selectedType)
    : investments;

  const totalInvested = filteredInvestments.reduce(
    (acc, inv) => acc + inv.total,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-green-600" />
          Investimentos
        </h1>
        <p className="text-muted-foreground">
          Gerencie seus investimentos aqui.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Investimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipo de Investimento
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome do Ativo
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: PETR4, CDB, Bitcoin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantidade
                  </label>
                  <Input
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Ex: 100"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preço (R$)
                  </label>
                  <Input
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Ex: 25.50"
                    step="0.01"
                  />
                </div>
              </div>

              <Button onClick={handleAddInvestment} className="w-full">
                Adicionar Investimento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {selectedType
                  ? investmentTypes.find((t) => t.value === selectedType)?.label
                  : "Todos os Investimentos"}
              </span>
              {selectedType && (
                <span className="text-2xl">
                  {investmentTypes.find((t) => t.value === selectedType)?.icon}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvestments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-muted-foreground">
                  {selectedType
                    ? "Nenhum investimento deste tipo ainda."
                    : "Nenhum investimento adicionado ainda."}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvestments.map((investment) => (
                        <TableRow key={investment.id}>
                          <TableCell className="font-medium">
                            {investment.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {investment.quantity.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {investment.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            R$ {investment.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteInvestment(investment.id)
                              }
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">
                      Total Investido:
                    </span>
                    <span className="text-3xl font-bold text-green-600">
                      R$ {totalInvested.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Investiments;
