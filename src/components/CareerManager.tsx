import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, where, getDocs, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  TrendingUp, 
  Award, 
  History, 
  Plus, 
  ArrowUpRight, 
  Briefcase, 
  DollarSign, 
  User,
  Star,
  MessageSquare
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Employee, PerformanceRecord, CareerAction } from '../types';
import { formatCurrency } from '../lib/salaryUtils';

export default function CareerManager({ isAdmin }: { isAdmin: boolean }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [careerHistory, setCareerHistory] = useState<CareerAction[]>([]);
  const [loading, setLoading] = useState(false);

  const [newPerformance, setNewPerformance] = useState<Partial<PerformanceRecord>>({
    score: 80,
    productivity: 'Medium',
    feedback: ''
  });

  const [newAction, setNewAction] = useState<Partial<CareerAction>>({
    type: 'Promotion',
    description: '',
    previousValue: '',
    newValue: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'employees'), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setPerformance([]);
      setCareerHistory([]);
      return;
    }

    setLoading(true);
    const qPerf = query(
      collection(db, 'performance'), 
      where('employeeId', '==', selectedEmployeeId),
      orderBy('date', 'desc')
    );
    const unsubPerf = onSnapshot(qPerf, (snapshot) => {
      setPerformance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PerformanceRecord)));
    });

    const qCareer = query(
      collection(db, 'career'), 
      where('employeeId', '==', selectedEmployeeId),
      orderBy('date', 'desc')
    );
    const unsubCareer = onSnapshot(qCareer, (snapshot) => {
      setCareerHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CareerAction)));
      setLoading(false);
    });

    return () => {
      unsubPerf();
      unsubCareer();
    };
  }, [selectedEmployeeId]);

  const handleAddPerformance = async () => {
    if (!selectedEmployeeId || !newPerformance.feedback) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await addDoc(collection(db, 'performance'), {
        ...newPerformance,
        employeeId: selectedEmployeeId,
        date: new Date().toISOString().split('T')[0],
        evaluator: 'Admin' // Should be current user name
      });
      toast.success("Avaliação registrada");
      setNewPerformance({ score: 80, productivity: 'Medium', feedback: '' });
    } catch (error) {
      toast.error("Erro ao registrar avaliação");
    }
  };

  const handleAddCareerAction = async () => {
    if (!selectedEmployeeId || !newAction.description) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await addDoc(collection(db, 'career'), {
        ...newAction,
        employeeId: selectedEmployeeId,
        date: new Date().toISOString().split('T')[0]
      });

      // If it's a promotion or salary increase, we might want to update the employee record too
      // For now, just record the history
      
      toast.success("Ação de carreira registrada");
      setNewAction({ type: 'Promotion', description: '', previousValue: '', newValue: '' });
    } catch (error) {
      toast.error("Erro ao registrar ação");
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Carreira e Produtividade</h3>
            <p className="text-sm text-slate-500">Gestão de desempenho, promoções e histórico</p>
          </div>
        </div>

        <div className="w-full md:w-64">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecionar Funcionário" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedEmployeeId ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400">
            <User size={48} className="mb-4 opacity-20" />
            <p>Selecione um funcionário para ver o histórico e gerir a carreira</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-lg bg-white overflow-hidden">
              <div className="h-2 bg-purple-600" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                    {selectedEmployee?.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedEmployee?.name}</CardTitle>
                    <CardDescription>{selectedEmployee?.role} • {selectedEmployee?.department}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Salário Atual</p>
                    <p className="font-bold text-slate-700">{formatCurrency(selectedEmployee?.baseSalary || 0)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Admissão</p>
                    <p className="font-bold text-slate-700">{selectedEmployee?.admissionDate}</p>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="pt-4 space-y-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 gap-2">
                          <Star size={16} /> Avaliar Desempenho
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>Nova Avaliação de Desempenho</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Pontuação (0-100)</Label>
                              <Input 
                                type="number" 
                                value={newPerformance.score}
                                onChange={(e) => setNewPerformance({...newPerformance, score: Number(e.target.value)})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Produtividade</Label>
                              <Select 
                                value={newPerformance.productivity}
                                onValueChange={(v) => setNewPerformance({...newPerformance, productivity: v})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="High">Alta</SelectItem>
                                  <SelectItem value="Medium">Média</SelectItem>
                                  <SelectItem value="Low">Baixa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Feedback / Observações</Label>
                            <Input 
                              placeholder="Descreva o desempenho..." 
                              value={newPerformance.feedback}
                              onChange={(e) => setNewPerformance({...newPerformance, feedback: e.target.value})}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddPerformance} className="bg-purple-600 hover:bg-purple-700">Salvar Avaliação</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full gap-2 border-purple-200 text-purple-600 hover:bg-purple-50">
                          <ArrowUpRight size={16} /> Registar Promoção/Alteração
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>Alteração de Carreira</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Tipo de Ação</Label>
                            <Select 
                              value={newAction.type}
                              onValueChange={(v: any) => setNewAction({...newAction, type: v})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Promotion">Promoção de Cargo</SelectItem>
                                <SelectItem value="Salary_Increase">Aumento Salarial</SelectItem>
                                <SelectItem value="Dept_Change">Mudança de Departamento</SelectItem>
                                <SelectItem value="Contract_Update">Atualização de Contrato</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input 
                              placeholder="Ex: Promovido a Gestor Sénior" 
                              value={newAction.description}
                              onChange={(e) => setNewAction({...newAction, description: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Valor Anterior</Label>
                              <Input 
                                placeholder="De..." 
                                value={newAction.previousValue}
                                onChange={(e) => setNewAction({...newAction, previousValue: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Novo Valor</Label>
                              <Input 
                                placeholder="Para..." 
                                value={newAction.newValue}
                                onChange={(e) => setNewAction({...newAction, newValue: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddCareerAction} className="bg-purple-600 hover:bg-purple-700">Registar Alteração</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <History size={16} className="mr-2" /> Histórico de Carreira
                </TabsTrigger>
                <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Award size={16} className="mr-2" /> Avaliações de Desempenho
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-6">
                <Card className="border-none shadow-lg bg-white overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Alteração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {careerHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-slate-400">Sem histórico registado</TableCell>
                        </TableRow>
                      ) : (
                        careerHistory.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-sm">{h.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {h.type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{h.description}</TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {h.previousValue && <span>{h.previousValue} → </span>}
                              <span className="font-bold text-slate-700">{h.newValue}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <div className="space-y-4">
                  {performance.length === 0 ? (
                    <Card className="border-none shadow-lg bg-white p-12 text-center text-slate-400">
                      Sem avaliações registadas
                    </Card>
                  ) : (
                    performance.map((p) => (
                      <Card key={p.id} className="border-none shadow-lg bg-white overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                p.productivity === 'High' ? 'bg-green-50 text-green-600' :
                                p.productivity === 'Medium' ? 'bg-blue-50 text-blue-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                <Award size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">Avaliação de {p.date}</p>
                                <p className="text-xs text-slate-500">Avaliador: {p.evaluator}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-purple-600">{p.score}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Pontuação</p>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl">
                            <div className="flex items-start gap-2">
                              <MessageSquare size={16} className="text-slate-400 mt-1 shrink-0" />
                              <p className="text-sm text-slate-600 italic">"{p.feedback}"</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
