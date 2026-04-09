import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Users, TrendingUp, Wallet, AlertCircle, Briefcase, Calendar, ShieldCheck, DollarSign, Receipt } from 'lucide-react';
import { formatCurrency } from '../lib/salaryUtils';

export default function Reports() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    avgSalary: 0,
    totalIRT: 0,
    totalINSS: 0,
    activeEmployees: 0,
    totalExpenses: 0,
    avgProductivity: 0,
    departmentData: [] as any[],
    monthlyTrend: [] as any[],
    contractData: [] as any[],
    expenseCategoryData: [] as any[]
  });

  useEffect(() => {
    const fetchData = async () => {
      const empSnap = await getDocs(collection(db, 'employees'));
      const paySnap = await getDocs(collection(db, 'payrolls'));
      const expSnap = await getDocs(collection(db, 'expenses'));
      const perfSnap = await getDocs(collection(db, 'performance'));
      
      const employees = empSnap.docs.map(d => d.data());
      const payrolls = paySnap.docs.map(d => d.data());
      const expenses = expSnap.docs.map(d => d.data());
      const performances = perfSnap.docs.map(d => d.data());
      
      // Dept stats
      const depts: Record<string, number> = {};
      const contracts: Record<string, number> = {};
      employees.forEach(e => {
        depts[e.department] = (depts[e.department] || 0) + 1;
        contracts[e.contractType] = (contracts[e.contractType] || 0) + 1;
      });
      
      const deptData = Object.entries(depts).map(([name, value]) => ({ name, value }));
      const contractData = Object.entries(contracts).map(([name, value]) => ({ name, value }));
      
      // Expense stats
      const expCats: Record<string, number> = {};
      expenses.forEach(e => {
        expCats[e.category] = (expCats[e.category] || 0) + e.amount;
      });
      const expenseCategoryData = Object.entries(expCats).map(([name, value]) => ({ name, value }));

      // Monthly trend
      const monthly: Record<string, { total: number, irt: number, inss: number, expenses: number }> = {};
      payrolls.forEach(p => {
        const key = `${p.month}/${p.year}`;
        if (!monthly[key]) monthly[key] = { total: 0, irt: 0, inss: 0, expenses: 0 };
        monthly[key].total += p.netSalary;
        monthly[key].irt += p.irt;
        monthly[key].inss += p.inssWorker;
      });

      expenses.forEach(e => {
        const date = new Date(e.date);
        const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
        if (!monthly[key]) monthly[key] = { total: 0, irt: 0, inss: 0, expenses: 0 };
        monthly[key].expenses += e.amount;
      });
      
      const monthlyTrend = Object.entries(monthly)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => {
          const [m1, y1] = a.name.split('/').map(Number);
          const [m2, y2] = b.name.split('/').map(Number);
          return y1 !== y2 ? y1 - y2 : m1 - m2;
        });

      const totalPayroll = payrolls.reduce((acc, p) => acc + p.netSalary, 0);
      const totalIRT = payrolls.reduce((acc, p) => acc + p.irt, 0);
      const totalINSS = payrolls.reduce((acc, p) => acc + p.inssWorker, 0);
      const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
      const avgProductivity = performances.length 
        ? performances.reduce((acc, p) => acc + (p as any).score, 0) / performances.length 
        : 0;
      
      setStats({
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === 'Active').length,
        totalPayroll,
        totalIRT,
        totalINSS,
        totalExpenses,
        avgProductivity,
        avgSalary: employees.length ? employees.reduce((acc, e) => acc + (e as any).baseSalary, 0) / employees.length : 0,
        departmentData: deptData,
        monthlyTrend,
        contractData,
        expenseCategoryData
      });
    };
    
    fetchData();
  }, []);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-blue-100 transition-all">
          <div className="h-1 bg-blue-600 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Equipa</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.totalEmployees}</h4>
                <p className="text-[10px] text-green-600 font-medium">{stats.activeEmployees} Ativos</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-green-100 transition-all">
          <div className="h-1 bg-green-600 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Salários</p>
                <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalPayroll)}</h4>
                <p className="text-[10px] text-slate-400">Total Líquido</p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Wallet size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-emerald-100 transition-all">
          <div className="h-1 bg-emerald-500 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Despesas</p>
                <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalExpenses)}</h4>
                <p className="text-[10px] text-emerald-600 font-medium">Operacional</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Receipt size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-amber-100 transition-all">
          <div className="h-1 bg-amber-500 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">IRT</p>
                <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalIRT)}</h4>
                <p className="text-[10px] text-amber-600 font-medium">Impostos</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <DollarSign size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-purple-100 transition-all">
          <div className="h-1 bg-purple-600 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Produtividade</p>
                <h4 className="text-2xl font-bold text-slate-900">{stats.avgProductivity.toFixed(1)}%</h4>
                <p className="text-[10px] text-purple-600 font-medium">Média Global</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              Evolução Financeira Mensal
            </CardTitle>
            <CardDescription>Comparativo entre Salários, Despesas e Impostos</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}}
                  tickFormatter={(value) => `Kz ${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="total" name="Salários" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                <Area type="monotone" dataKey="irt" name="IRT" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Distribuição de Despesas</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats.expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {stats.expenseCategoryData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                    <span className="text-xs text-slate-600 truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Departamentos (Equipa)</CardTitle>
            </CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.departmentData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12}} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
