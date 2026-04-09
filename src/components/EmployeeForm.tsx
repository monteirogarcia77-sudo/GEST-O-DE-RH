import * as React from 'react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { toast } from 'sonner';
import { Employee } from '../types';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export default function EmployeeForm({ isOpen, onClose, employee }: EmployeeFormProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    bi: '',
    nif: '',
    inss: '',
    role: '',
    department: '',
    baseSalary: 0,
    admissionDate: new Date().toISOString().split('T')[0],
    contractType: 'Efetivo',
    status: 'Active'
  });

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        name: '',
        bi: '',
        nif: '',
        inss: '',
        role: '',
        department: '',
        baseSalary: 0,
        admissionDate: new Date().toISOString().split('T')[0],
        contractType: 'Efetivo',
        status: 'Active'
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (employee?.id) {
        await updateDoc(doc(db, 'employees', employee.id), formData);
        toast.success('Funcionário atualizado com sucesso');
      } else {
        await addDoc(collection(db, 'employees'), formData);
        toast.success('Funcionário cadastrado com sucesso');
      }
      onClose();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error('Erro ao salvar funcionário');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {employee ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: João Manuel Garcia"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bi">Nº do BI</Label>
              <Input 
                id="bi" 
                required 
                value={formData.bi} 
                onChange={(e) => setFormData({...formData, bi: e.target.value})}
                placeholder="Ex: 001234567LA041"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nif">NIF</Label>
              <Input 
                id="nif" 
                required 
                value={formData.nif} 
                onChange={(e) => setFormData({...formData, nif: e.target.value})}
                placeholder="Ex: 5417001234"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inss">Nº INSS</Label>
              <Input 
                id="inss" 
                required 
                value={formData.inss} 
                onChange={(e) => setFormData({...formData, inss: e.target.value})}
                placeholder="Ex: 1234567890"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admissionDate">Data de Admissão</Label>
              <Input 
                id="admissionDate" 
                type="date" 
                required 
                value={formData.admissionDate} 
                onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input 
                id="department" 
                required 
                value={formData.department} 
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                placeholder="Ex: Recursos Humanos"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Input 
                id="role" 
                required 
                value={formData.role} 
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                placeholder="Ex: Analista de RH"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="baseSalary">Salário Base (Kz)</Label>
              <Input 
                id="baseSalary" 
                type="number" 
                required 
                value={formData.baseSalary} 
                onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                placeholder="Ex: 150000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contractType">Tipo de Contrato</Label>
              <Select 
                value={formData.contractType} 
                onValueChange={(value: any) => setFormData({...formData, contractType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efetivo">Efetivo</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Ativo</SelectItem>
                  <SelectItem value="Inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {employee ? 'Salvar Alterações' : 'Cadastrar Funcionário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
