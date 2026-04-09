import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  UserCircle,
  Building2,
  Plane,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import EmployeeList from './components/EmployeeList';
import AttendanceTracker from './components/AttendanceTracker';
import PayrollManager from './components/PayrollManager';
import VacationManager from './components/VacationManager';
import FinanceManager from './components/FinanceManager';
import CareerManager from './components/CareerManager';
import Reports from './components/Reports';
import { UserProfile } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Default profile for first-time login
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            role: user.email === 'monteirogarcia77@gmail.com' ? 'admin' : 'user'
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-blue-100 text-center"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <Building2 className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">RH Angola</h1>
          <p className="text-slate-500 mb-8 text-lg">Sistema de Gestão de Recursos Humanos</p>
          
          <Button 
            onClick={handleLogin}
            className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-blue-200"
          >
            Entrar com Google
          </Button>
          
          <p className="mt-6 text-xs text-slate-400">
            Versão Profissional • Angola 2026
          </p>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'employees', label: 'Funcionários', icon: Users },
    { id: 'attendance', label: 'Presenças', icon: Calendar },
    { id: 'vacation', label: 'Férias', icon: Plane },
    { id: 'career', label: 'Carreira', icon: TrendingUp },
    { id: 'finance', label: 'Finanças', icon: Receipt },
    { id: 'payroll', label: 'Folha Salarial', icon: CreditCard },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white shadow-2xl z-20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">RH Angola</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserCircle size={20} />
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold truncate max-w-[120px]">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{profile?.role === 'admin' ? 'Administrador' : 'Utilizador'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation (Scrollable) */}
      <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 py-2 overflow-x-auto flex gap-2 no-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={16} />
            <span className="font-medium text-xs whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{new Date().toLocaleDateString('pt-AO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-slate-500">Luanda, Angola</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'employees' && <EmployeeList isAdmin={profile?.role === 'admin'} />}
              {activeTab === 'attendance' && <AttendanceTracker isAdmin={profile?.role === 'admin'} />}
              {activeTab === 'vacation' && <VacationManager isAdmin={profile?.role === 'admin'} />}
              {activeTab === 'career' && <CareerManager isAdmin={profile?.role === 'admin'} />}
              {activeTab === 'finance' && <FinanceManager isAdmin={profile?.role === 'admin'} />}
              {activeTab === 'payroll' && <PayrollManager isAdmin={profile?.role === 'admin'} />}
              {activeTab === 'reports' && <Reports />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
