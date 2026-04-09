import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar as CalendarIcon, 
  MapPin, 
  Tag, 
  CreditCard,
  Filter,
  Download,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from './ui/dialog';
import { toast } from 'sonner';
import { Expense } from '../types';
import { formatCurrency } from '../lib/salaryUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const CATEGORIES = [
  'Escritório',
  'Transporte',
  'Alimentação',
  'Marketing',
  'Tecnologia',
  'Impostos',
  'Outros'
];

const METHODS = [
  'Transferência',
  'Cartão de Crédito',
  'Numerário',
  'Multicaixa Express'
];

export default function FinanceManager({ isAdmin }: { isAdmin: boolean }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    category: 'Outros',
    date: new Date().toISOString().split('T')[0],
    location: '',
    amount: 0,
    paymentMethod: 'Transferência',
    status: 'Paid'
  });

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await addDoc(collection(db, 'expenses'), newExpense);
      toast.success("Despesa registrada com sucesso");
      setIsDialogOpen(false);
      setNewExpense({
        description: '',
        category: 'Outros',
        date: new Date().toISOString().split('T')[0],
        location: '',
        amount: 0,
        paymentMethod: 'Transferência',
        status: 'Paid'
      });
    } catch (error) {
      toast.error("Erro ao registrar despesa");
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      toast.success("Despesa removida");
    } catch (error) {
      toast.error("Erro ao remover despesa");
    }
  };

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory);

  const totalAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Chart data
  const chartData = CATEGORIES.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0)
  })).filter(d => d.value > 0);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Receipt size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Finanças e Contabilidade</h3>
            <p className="text-sm text-slate-500">Gestão de despesas e relatórios financeiros</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 flex-1 md:flex-none">
                  <Plus size={18} />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Despesa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Descrição (O quê/Como)</Label>
                    <Input 
                      placeholder="Ex: Papel para impressora" 
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select 
                        value={newExpense.category} 
                        onValueChange={(v) => setNewExpense({...newExpense, category: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (Kz)</Label>
                      <Input 
                        type="number" 
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data (Quando)</Label>
                      <Input 
                        type="date" 
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Local (Onde)</Label>
                      <Input 
                        placeholder="Ex: Luanda" 
                        value={newExpense.location}
                        onChange={(e) => setNewExpense({...newExpense, location: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Método de Pagamento</Label>
                    <Select 
                      value={newExpense.paymentMethod} 
                      onValueChange={(v) => setNewExpense({...newExpense, paymentMethod: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METHODS.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddExpense} className="bg-emerald-600 hover:bg-emerald-700">Registrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-emerald-600 text-white">
          <CardContent className="pt-6">
            <p className="text-emerald-100 text-sm font-medium">Total de Despesas</p>
            <h4 className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</h4>
            <div className="mt-4 flex items-center gap-2 text-emerald-100 text-xs">
              <Filter size={14} />
              <span>{filterCategory === 'all' ? 'Todas as categorias' : filterCategory}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-lg bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">Relatório de Despesas</CardTitle>
            <CardDescription>Detalhamento de gastos corporativos</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Descrição (Como/O quê)</TableHead>
                <TableHead className="font-bold text-slate-700">Categoria</TableHead>
                <TableHead className="font-bold text-slate-700">Data (Quando)</TableHead>
                <TableHead className="font-bold text-slate-700">Local (Onde)</TableHead>
                <TableHead className="font-bold text-slate-700">Valor (Quanto)</TableHead>
                <TableHead className="font-bold text-slate-700">Pagamento</TableHead>
                {isAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">Carregando...</TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    Nenhuma despesa encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((exp) => (
                  <TableRow key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{exp.description}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{exp.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-slate-200">
                        {exp.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarIcon size={14} />
                        {new Date(exp.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={14} />
                        {exp.location || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {formatCurrency(exp.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CreditCard size={14} />
                        {exp.paymentMethod}
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-400 hover:text-red-600"
                          onClick={() => exp.id && handleDelete(exp.id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
