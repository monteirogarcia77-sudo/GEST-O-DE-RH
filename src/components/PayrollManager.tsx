import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { 
  CreditCard, 
  Calculator, 
  Download, 
  CheckCircle, 
  History,
  FileSpreadsheet,
  Printer
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { toast } from 'sonner';
import { Employee, Payroll } from '../types';
import { calculateNetSalary, formatCurrency } from '../lib/salaryUtils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function PayrollManager({ isAdmin }: { isAdmin: boolean }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    const q = query(collection(db, 'employees'), where('status', '==', 'Active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPayrolls = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'payrolls'), 
          where('month', '==', selectedMonth),
          where('year', '==', selectedYear)
        );
        const snapshot = await getDocs(q);
        setPayrolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
      } catch (error) {
        toast.error("Erro ao carregar folha salarial");
      } finally {
        setLoading(false);
      }
    };
    fetchPayrolls();
  }, [selectedMonth, selectedYear]);

  const generatePayroll = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const batch = [];
      for (const emp of employees) {
        // Check if already exists
        const existing = payrolls.find(p => p.employeeId === emp.id);
        if (existing) continue;

        const { inssWorker, inssCompany, irt, netSalary } = calculateNetSalary(emp.baseSalary);
        
        const newPayroll: Payroll = {
          employeeId: emp.id!,
          employeeName: emp.name,
          month: selectedMonth,
          year: selectedYear,
          baseSalary: emp.baseSalary,
          inssWorker,
          inssCompany,
          irt,
          netSalary,
          status: 'Draft',
          createdAt: new Date().toISOString()
        };
        
        batch.push(addDoc(collection(db, 'payrolls'), newPayroll));
      }
      
      if (batch.length > 0) {
        await Promise.all(batch);
        toast.success(`${batch.length} registros gerados com sucesso`);
        // Refresh
        const q = query(
          collection(db, 'payrolls'), 
          where('month', '==', selectedMonth),
          where('year', '==', selectedYear)
        );
        const snapshot = await getDocs(q);
        setPayrolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
      } else {
        toast.info("Todos os funcionários já possuem registros para este mês");
      }
    } catch (error) {
      toast.error("Erro ao gerar folha");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = payrolls.map(p => ({
      'Funcionário': p.employeeName || 'N/A',
      'Mês/Ano': `${months[p.month-1]}/${p.year}`,
      'Salário Base': p.baseSalary,
      'INSS (3%)': p.inssWorker,
      'IRT': p.irt,
      'Salário Líquido': p.netSalary,
      'Status': p.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Folha Salarial");
    XLSX.writeFile(wb, `Folha_Salarial_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const generateReceipt = (payroll: Payroll) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 119, 190); // Ocean Blue
    doc.text('RECIBO DE SALÁRIO', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('RH Angola - Sistema de Gestão', 105, 28, { align: 'center' });
    
    // Info
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Funcionário: ${payroll.employeeName}`, 20, 45);
    doc.text(`Mês/Ano: ${months[payroll.month-1]} / ${payroll.year}`, 20, 52);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, 20, 59);
    
    // Table
    (doc as any).autoTable({
      startY: 70,
      head: [['Descrição', 'Vencimentos', 'Descontos']],
      body: [
        ['Salário Base', formatCurrency(payroll.baseSalary), ''],
        ['INSS (3%)', '', formatCurrency(payroll.inssWorker)],
        ['IRT (Progressivo)', '', formatCurrency(payroll.irt)],
        ['', '', ''],
        ['TOTAIS', formatCurrency(payroll.baseSalary), formatCurrency(payroll.inssWorker + payroll.irt)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 119, 190] }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`LÍQUIDO A RECEBER: ${formatCurrency(payroll.netSalary)}`, 20, finalY);
    
    doc.setFontSize(10);
    doc.text('_________________________________', 105, finalY + 40, { align: 'center' });
    doc.text('Assinatura do Funcionário', 105, finalY + 45, { align: 'center' });
    
    doc.save(`Recibo_${payroll.employeeName}_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-none shadow-lg bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calculator className="text-blue-600" />
                  Cálculo de Folha
                </CardTitle>
                <CardDescription>Gerencie os pagamentos mensais</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button 
              onClick={generatePayroll} 
              disabled={loading || !isAdmin}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Calculator size={18} />
              Gerar Folha do Mês
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              disabled={payrolls.length === 0}
              className="gap-2"
            >
              <FileSpreadsheet size={18} />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-blue-100 text-sm">Total Líquido</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(payrolls.reduce((acc, p) => acc + p.netSalary, 0))}
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <span>Funcionários: {payrolls.length}</span>
                <span>IRT Total: {formatCurrency(payrolls.reduce((acc, p) => acc + p.irt, 0))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Funcionário</TableHead>
                <TableHead className="font-bold text-slate-700">Salário Base</TableHead>
                <TableHead className="font-bold text-slate-700">INSS (3%)</TableHead>
                <TableHead className="font-bold text-slate-700">IRT</TableHead>
                <TableHead className="font-bold text-slate-700">Líquido</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">Carregando...</TableCell>
                </TableRow>
              ) : payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    Nenhum registro para este período. Clique em "Gerar Folha".
                  </TableCell>
                </TableRow>
              ) : (
                payrolls.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">{p.employeeName}</TableCell>
                    <TableCell>{formatCurrency(p.baseSalary)}</TableCell>
                    <TableCell className="text-red-500">-{formatCurrency(p.inssWorker)}</TableCell>
                    <TableCell className="text-red-500">-{formatCurrency(p.irt)}</TableCell>
                    <TableCell className="font-bold text-blue-700">{formatCurrency(p.netSalary)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'Paid' ? 'default' : 'outline'} className={p.status === 'Paid' ? 'bg-green-500' : ''}>
                        {p.status === 'Paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Gerar Recibo PDF"
                        onClick={() => generateReceipt(p)}
                      >
                        <Printer size={18} className="text-slate-400 hover:text-blue-600" />
                      </Button>
                    </TableCell>
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
