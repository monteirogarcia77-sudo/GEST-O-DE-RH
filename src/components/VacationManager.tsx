import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, where, getDocs, updateDoc } from 'firebase/firestore';
import { Plane, Plus, Trash2, CheckCircle, Clock, Calendar as CalendarIcon, User } from 'lucide-react';
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
import { Employee, Vacation } from '../types';
import { differenceInBusinessDays, parseISO } from 'date-fns';

export default function VacationManager({ isAdmin }: { isAdmin: boolean }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newVacation, setNewVacation] = useState<Partial<Vacation>>({
    employeeId: '',
    startDate: '',
    endDate: '',
    status: 'Planned',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    const q = query(collection(db, 'employees'), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'vacations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVacations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vacation)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddVacation = async () => {
    if (!newVacation.employeeId || !newVacation.startDate || !newVacation.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const start = parseISO(newVacation.startDate);
    const end = parseISO(newVacation.endDate);
    const days = differenceInBusinessDays(end, start) + 1;

    if (days <= 0) {
      toast.error("A data de fim deve ser posterior à data de início");
      return;
    }

    const employee = employees.find(e => e.id === newVacation.employeeId);

    try {
      await addDoc(collection(db, 'vacations'), {
        ...newVacation,
        employeeName: employee?.name,
        days,
        year: new Date(newVacation.startDate).getFullYear()
      });
      toast.success("Férias agendadas com sucesso");
      setIsDialogOpen(false);
      setNewVacation({
        employeeId: '',
        startDate: '',
        endDate: '',
        status: 'Planned',
        year: new Date().getFullYear()
      });
    } catch (error) {
      toast.error("Erro ao agendar férias");
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'vacations', id));
      toast.success("Registro removido");
    } catch (error) {
      toast.error("Erro ao remover registro");
    }
  };

  const handleStatusChange = async (id: string, status: Vacation['status']) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'vacations', id), { status });
      toast.success("Status atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusBadge = (status: Vacation['status']) => {
    switch (status) {
      case 'Approved': return <Badge className="bg-green-500">Aprovado</Badge>;
      case 'Completed': return <Badge className="bg-blue-500">Concluído</Badge>;
      case 'Planned': return <Badge className="bg-amber-500">Planejado</Badge>;
      case 'Cancelled': return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Plane size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Gestão de Férias</h3>
            <p className="text-sm text-slate-500">Controle de períodos de descanso (22 dias úteis/ano)</p>
          </div>
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus size={18} />
                Agendar Férias
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Novo Período de Férias</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Funcionário</Label>
                  <Select 
                    value={newVacation.employeeId} 
                    onValueChange={(v) => setNewVacation({...newVacation, employeeId: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input 
                      type="date" 
                      value={newVacation.startDate} 
                      onChange={(e) => setNewVacation({...newVacation, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <Input 
                      type="date" 
                      value={newVacation.endDate} 
                      onChange={(e) => setNewVacation({...newVacation, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status Inicial</Label>
                  <Select 
                    value={newVacation.status} 
                    onValueChange={(v: any) => setNewVacation({...newVacation, status: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planned">Planejado</SelectItem>
                      <SelectItem value="Approved">Aprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddVacation} className="bg-blue-600 hover:bg-blue-700">Agendar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {employees.map(emp => {
          const empVacations = vacations.filter(v => v.employeeId === emp.id && v.status !== 'Cancelled');
          const daysUsed = empVacations.reduce((acc, v) => acc + v.days, 0);
          const daysRemaining = 22 - daysUsed;
          
          return (
            <Card key={emp.id} className="border-none shadow-lg overflow-hidden">
              <div className="h-2 bg-blue-600" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {emp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">{emp.name}</CardTitle>
                    <p className="text-xs text-slate-500">{emp.department}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Dias Usados</p>
                    <p className="text-2xl font-bold text-slate-800">{daysUsed} / 22</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Restantes</p>
                    <p className={`text-2xl font-bold ${daysRemaining < 5 ? 'text-red-500' : 'text-green-600'}`}>
                      {daysRemaining}
                    </p>
                  </div>
                </div>
                <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500" 
                    style={{ width: `${(daysUsed / 22) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-800">Histórico de Férias</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Funcionário</TableHead>
                <TableHead className="font-bold text-slate-700">Período</TableHead>
                <TableHead className="font-bold text-slate-700">Dias Úteis</TableHead>
                <TableHead className="font-bold text-slate-700">Ano Ref.</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                {isAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">Carregando...</TableCell>
                </TableRow>
              ) : vacations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    Nenhum registro de férias encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                vacations.map((v) => (
                  <TableRow key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">{v.employeeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon size={14} className="text-slate-400" />
                        {new Date(v.startDate).toLocaleDateString()} - {new Date(v.endDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-blue-700">{v.days} dias</TableCell>
                    <TableCell>{v.year}</TableCell>
                    <TableCell>{getStatusBadge(v.status)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {v.status === 'Planned' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => handleStatusChange(v.id!, 'Approved')}
                            >
                              <CheckCircle size={18} />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400 hover:text-red-600"
                            onClick={() => v.id && handleDelete(v.id)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
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
