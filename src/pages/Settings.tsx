import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { exportData, importData, resetData } = useFinance();
  const [importText, setImportText] = useState('');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso!');
  };

  const handleImport = () => {
    try {
      importData(importText);
      toast.success('Dados importados com sucesso!');
      setImportText('');
    } catch (error) {
      toast.error('Erro ao importar dados. Verifique o formato JSON.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita!')) {
      if (window.confirm('Última confirmação: Apagar todos os dados permanentemente?')) {
        resetData();
        toast.success('Todos os dados foram apagados.');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seus dados e preferências</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Dados
            </CardTitle>
            <CardDescription>
              Faça backup dos seus dados em formato JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport}>
              Exportar para JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Dados
            </CardTitle>
            <CardDescription>
              Restaure seus dados de um arquivo JSON exportado anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole o conteúdo JSON aqui..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <Button onClick={handleImport} disabled={!importText}>
              Importar Dados
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis - use com cautela
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleReset}>
              Apagar Todos os Dados
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
