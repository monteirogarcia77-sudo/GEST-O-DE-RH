import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, Plane, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
import { toast } from 'sonner';
import { Employee, Attendance } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AttendanceTracker({ isAdmin }: { isAdmin: boolean }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'employees'), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(docs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'attendance'), where('date', '==', selectedDate));
        const snapshot = await getDocs(q);
        const records: Record<string, Attendance> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data() as Attendance;
          records[data.employeeId] = { id: doc.id, ...data };
        });
        setAttendanceRecords(records);
      } catch (error) {
        toast.error("Erro ao carregar presenças");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedDate]);

  const handleStatusChange = async (employeeId: string, status: Attendance['status']) => {
    if (!isAdmin) return;
    
    const existing = attendanceRecords[employeeId];
    try {
      if (existing?.id) {
        await updateDoc(doc(db, 'attendance', existing.id), { status });
        setAttendanceRecords(prev => ({
          ...prev,
          [employeeId]: { ...prev[employeeId], status }
        }));
      } else {
        const newRecord: Attendance = {
          employeeId,
          date: selectedDate,
          status,
          overtimeHours: 0
        };
        const docRef = await addDoc(collection(db, 'attendance'), newRecord);
        setAttendanceRecords(prev => ({
          ...prev,
          [employeeId]: { id: docRef.id, ...newRecord }
        }));
      }
      toast.success("Presença atualizada");
    } catch (error) {
      toast.error("Erro ao atualizar presença");
    }
  };

  const handleOvertimeChange = async (employeeId: string, hours: number) => {
    if (!isAdmin) return;
    const existing = attendanceRecords[employeeId];
    if (!existing?.id) return;

    try {
      await updateDoc(doc(db, 'attendance', existing.id), { overtimeHours: hours });
      setAttendanceRecords(prev => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], overtimeHours: hours }
      }));
    } catch (error) {
      toast.error("Erro ao atualizar horas extras");
    }
  };

  const handleNotesChange = async (employeeId: string, notes: string) => {
    if (!isAdmin) return;
    const existing = attendanceRecords[employeeId];
    if (!existing?.id) return;

    try {
      await updateDoc(doc(db, 'attendance', existing.id), { notes });
      setAttendanceRecords(prev => ({
        ...prev,
        [employeeId]: { ...prev[employeeId], notes }
      }));
    } catch (error) {
      toast.error("Erro ao atualizar notas");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Controle Diário</h3>
            <p className="text-sm text-slate-500">Marque as presenças e horas extras</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
          >
            <ChevronLeft size={18} />
          </Button>
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Funcionário</TableHead>
                <TableHead className="font-bold text-slate-700">Status de Presença</TableHead>
                <TableHead className="font-bold text-slate-700">Horas Extras</TableHead>
                <TableHead className="font-bold text-slate-700">Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex justify-center items-center gap-2 text-slate-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-400">
                    Nenhum funcionário ativo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const record = attendanceRecords[emp.id!];
                  return (
                    <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {emp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{emp.name}</p>
                            <p className="text-xs text-slate-500">{emp.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={record?.status === 'Present' ? 'default' : 'outline'}
                            className={record?.status === 'Present' ? 'bg-green-600 hover:bg-green-700' : 'text-slate-500'}
                            onClick={() => handleStatusChange(emp.id!, 'Present')}
                            disabled={!isAdmin}
                          >
                            <CheckCircle2 size={16} className="mr-1" /> Presente
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'Absent_J' ? 'default' : 'outline'}
                            className={record?.status === 'Absent_J' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-500'}
                            onClick={() => handleStatusChange(emp.id!, 'Absent_J')}
                            disabled={!isAdmin}
                          >
                            <CheckCircle2 size={16} className="mr-1" /> Falta Just.
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'Absent_U' ? 'destructive' : 'outline'}
                            className={record?.status === 'Absent_U' ? 'bg-red-600 hover:bg-red-700' : 'text-slate-500'}
                            onClick={() => handleStatusChange(emp.id!, 'Absent_U')}
                            disabled={!isAdmin}
                          >
                            <XCircle size={16} className="mr-1" /> Falta Injust.
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'Late' ? 'default' : 'outline'}
                            className={record?.status === 'Late' ? 'bg-amber-500 hover:bg-amber-600' : 'text-slate-500'}
                            onClick={() => handleStatusChange(emp.id!, 'Late')}
                            disabled={!isAdmin}
                          >
                            <Clock size={16} className="mr-1" /> Atraso
                          </Button>
                          <Button
                            size="sm"
                            variant={record?.status === 'Vacation' ? 'default' : 'outline'}
                            className={record?.status === 'Vacation' ? 'bg-blue-500 hover:bg-blue-600' : 'text-slate-500'}
                            onClick={() => handleStatusChange(emp.id!, 'Vacation')}
                            disabled={!isAdmin}
                          >
                            <Plane size={16} className="mr-1" /> Férias
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            className="w-20 h-8" 
                            value={record?.overtimeHours || 0}
                            onChange={(e) => handleOvertimeChange(emp.id!, Number(e.target.value))}
                            disabled={!isAdmin || !record}
                          />
                          <span className="text-xs text-slate-400">horas</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Obs..." 
                          className="h-8 text-xs" 
                          value={record?.notes || ''}
                          onChange={(e) => handleNotesChange(emp.id!, e.target.value)}
                          disabled={!isAdmin || !record}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
