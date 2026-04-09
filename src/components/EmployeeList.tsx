import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Search, Edit2, Trash2, UserPlus, MoreVertical, FileText, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Employee } from '../types';
import EmployeeForm from './EmployeeForm';
import { formatCurrency } from '../lib/salaryUtils';

export default function EmployeeList({ isAdmin }: { isAdmin: boolean }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(docs);
    }, (error) => {
      console.error("Error fetching employees:", error);
      toast.error("Erro ao carregar funcionários");
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este funcionário?')) return;
    try {
      await deleteDoc(doc(db, 'employees', id));
      toast.success('Funcionário removido com sucesso');
    } catch (error) {
      toast.error('Erro ao remover funcionário');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.bi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Pesquisar por nome, BI ou departamento..." 
            className="pl-10 bg-white border-slate-200 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => {
              setEditingEmployee(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-200"
          >
            <UserPlus size={18} />
            Novo Funcionário
          </Button>
        )}
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Lista de Funcionários ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Funcionário</TableHead>
                  <TableHead className="font-bold text-slate-700">BI / NIF</TableHead>
                  <TableHead className="font-bold text-slate-700">Departamento / Cargo</TableHead>
                  <TableHead className="font-bold text-slate-700">Salário Base</TableHead>
                  <TableHead className="font-bold text-slate-700">Contrato</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-32 text-center text-slate-400">
                      Nenhum funcionário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{emp.name}</p>
                            <p className="text-xs text-slate-500">Admitido em: {new Date(emp.admissionDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-slate-700"><span className="text-slate-400 text-xs mr-1">BI:</span>{emp.bi}</p>
                          <p className="text-slate-700"><span className="text-slate-400 text-xs mr-1">NIF:</span>{emp.nif}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-slate-800">{emp.department}</p>
                          <p className="text-slate-500">{emp.role}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-blue-700">
                        {formatCurrency(emp.baseSalary)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={emp.contractType === 'Efetivo' ? 'border-green-200 text-green-700 bg-green-50' : 'border-orange-200 text-orange-700 bg-orange-50'}>
                          {emp.contractType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={emp.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-400'}>
                          {emp.status === 'Active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-blue-600"
                              onClick={() => {
                                setEditingEmployee(emp);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              onClick={() => emp.id && handleDelete(emp.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EmployeeForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        employee={editingEmployee} 
      />
    </div>
  );
}
