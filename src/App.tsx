import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PieChart as PieChartIcon, 
  Target, 
  Settings, 
  Search,
  Calendar,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
  Check,
  Filter,
  Download,
  Trash2,
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  FileText,
  LogOut,
  User as UserIcon,
  Lock,
  Mail,
  FileUp
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line,
  CartesianGrid
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { cn } from './types';
import { supabase } from './lib/supabase';
import type { Category, Transaction, Budget, SavingsGoal, RecurringTemplate, BankAccount, FileAsset, User } from './types';

// Icons mapping for dynamic rendering
import * as LucideIcons from 'lucide-react';

const IconRenderer = ({ name, className }: { name: string, className?: string }) => {
  const Icon = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <Icon className={className} />;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'savings' | 'settings' | 'recurring' | 'banks' | 'files'>('dashboard');
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return null;
    }
  });
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [currency, setCurrency] = useState<{code: string, symbol: string}>(() => {
    try {
      const saved = localStorage.getItem('currency');
      return saved ? JSON.parse(saved) : { code: 'BDT', symbol: '৳' };
    } catch (e) {
      console.error('Error parsing currency from localStorage:', e);
      return { code: 'BDT', symbol: '৳' };
    }
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isAddBudgetModalOpen, setIsAddBudgetModalOpen] = useState(false);
  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isAddRecurringModalOpen, setIsAddRecurringModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState("/public/profile.jpg?t=" + Date.now());
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for new transaction
  const [newTx, setNewTx] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const [newBank, setNewBank] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    balance: '',
    type: 'savings'
  });

  const [newBudget, setNewBudget] = useState({
    category_id: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [newSavings, setNewSavings] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: ''
  });

  const [addFundsAmount, setAddFundsAmount] = useState('');

  const [newRecurring, setNewRecurring] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('currency', JSON.stringify(currency));
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchData = async () => {
    try {
      const endpoints = [
        '/api/transactions',
        '/api/categories',
        '/api/budgets',
        '/api/savings',
        '/api/bank-accounts',
        '/api/recurring',
        '/api/files'
      ];

      const responses = await Promise.all(endpoints.map(url => fetch(url)));
      
      // Check for non-JSON responses
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        if (!res.ok) {
          console.error(`[App] Fetch failed for ${endpoints[i]}: ${res.status}`);
          continue;
        }
        
        const contentType = res.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
          const text = await res.text();
          console.error(`[App] Non-JSON response for ${endpoints[i]}:`, text.substring(0, 100));
          continue;
        }

        const data = await res.json();
        switch (i) {
          case 0: setTransactions(data); break;
          case 1: setCategories(data); break;
          case 2: setBudgets(data); break;
          case 3: setSavings(data); break;
          case 4: setBankAccounts(data); break;
          case 5: setRecurringTemplates(data); break;
          case 6: setFiles(data); break;
        }
      }
    } catch (error) {
      console.error('[App] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecurringStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling recurring status:', error);
    }
  };

  const deleteRecurring = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return;
    try {
      await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget.category_id || !newBudget.amount) return;

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBudget,
          amount: parseFloat(newBudget.amount)
        })
      });
      if (res.ok) {
        setIsAddBudgetModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSavings.name || !newSavings.target_amount) return;

    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSavings,
          target_amount: parseFloat(newSavings.target_amount),
          current_amount: parseFloat(newSavings.current_amount || '0')
        })
      });
      if (res.ok) {
        setIsAddSavingsModalOpen(false);
        setNewSavings({ name: '', target_amount: '', current_amount: '0', deadline: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding savings goal:', error);
    }
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !addFundsAmount) return;

    try {
      const newAmount = selectedGoal.current_amount + parseFloat(addFundsAmount);
      const res = await fetch(`/api/savings/${selectedGoal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_amount: newAmount })
      });
      if (res.ok) {
        setIsAddFundsModalOpen(false);
        setAddFundsAmount('');
        setSelectedGoal(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error adding funds:', error);
    }
  };

  const deleteSavingsGoal = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await fetch(`/api/savings/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting savings goal:', error);
    }
  };

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecurring.amount || !newRecurring.category_id) return;

    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRecurring,
          amount: parseFloat(newRecurring.amount)
        })
      });
      if (res.ok) {
        setIsAddRecurringModalOpen(false);
        setNewRecurring({
          amount: '',
          type: 'expense',
          category_id: '',
          frequency: 'monthly'
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding recurring transaction:', error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.category_id) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTx,
          amount: parseFloat(newTx.amount)
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setNewTx({
          amount: '',
          type: 'expense',
          category_id: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          notes: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile', file);

    try {
      const res = await fetch('/api/upload-profile', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProfilePic(data.url);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const deleteFile = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await fetch(`/api/files/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    // Check if Supabase is configured
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (isSupabaseConfigured) {
      console.log(`Attempting ${authMode} with Supabase`);
      try {
        let result;
        if (authMode === 'login') {
          result = await supabase.auth.signInWithPassword({
            email: authForm.email,
            password: authForm.password,
          });
        } else if (authMode === 'register') {
          result = await supabase.auth.signUp({
            email: authForm.email,
            password: authForm.password,
            options: {
              data: {
                name: authForm.name,
              }
            }
          });
        } else {
          // Forgot password with Supabase
          result = await supabase.auth.resetPasswordForEmail(authForm.email);
          if (!result.error) {
            setAuthSuccess('Password reset email sent!');
          }
        }

        if (result && result.error) {
          setAuthError(result.error.message);
        } else if (result && (result as any).data?.user) {
          const userData = {
            id: (result as any).data.user.id,
            email: (result as any).data.user.email,
            name: (result as any).data.user.user_metadata?.name || authForm.name,
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        return;
      } catch (error) {
        console.error('Supabase Auth error:', error);
        setAuthError('Supabase authentication failed. Check your configuration.');
        return;
      }
    }

    const endpoint = authMode === 'login' ? '/api/auth/login' : authMode === 'register' ? '/api/auth/register' : '/api/auth/forgot-password';
    console.log(`Attempting ${authMode} at ${endpoint}`, authForm);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (data.success) {
          if (authMode === 'forgot') {
            setAuthSuccess(data.message);
          } else {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } else {
          setAuthError(data.message || 'Authentication failed');
        }
      } else {
        const text = await res.text();
        console.error('[App] Non-JSON response from auth:', text.substring(0, 100));
        setAuthError(`Server error (${res.status}). Please check server logs.`);
      }
    } catch (error: any) {
      console.error('[App] Auth error:', error);
      setAuthError(`Connection error: ${error.message || 'Please check if the server is running'}`);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('user');
    setActiveTab('dashboard');
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (!confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/transactions', { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        alert('All transactions deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting all transactions:', error);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.name || !newBank.bank_name || !newBank.balance) return;

    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBank,
          balance: parseFloat(newBank.balance)
        })
      });
      
      if (res.ok) {
        setIsAddBankModalOpen(false);
        setNewBank({
          name: '',
          bank_name: '',
          account_number: '',
          balance: '',
          type: 'savings'
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
    }
  };

  const deleteBank = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    try {
      await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting bank account:', error);
    }
  };

  const handleExport = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.date,
        tx.type,
        tx.category_name,
        tx.amount,
        `"${tx.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthTransactions = transactions.filter(tx => {
    const txDate = parseISO(tx.date);
    return isWithinInterval(txDate, { start: monthStart, end: monthEnd });
  });

  const totalIncome = monthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = monthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = transactions.reduce((sum, tx) => 
    tx.type === 'income' ? sum + tx.amount : sum - tx.amount, 0
  );

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Chart Data
  const expenseByCategory = categories
    .filter(c => c.type === 'expense')
    .map(cat => {
      const amount = monthTransactions
        .filter(tx => tx.category_id === cat.id)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { name: cat.name, value: amount, color: cat.color };
    })
    .filter(item => item.value > 0);

  const trendData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(currentMonth, 5 - i);
    const mStart = startOfMonth(date);
    const mEnd = endOfMonth(date);
    const mIncome = transactions
      .filter(tx => tx.type === 'income' && isWithinInterval(parseISO(tx.date), { start: mStart, end: mEnd }))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const mExpense = transactions
      .filter(tx => tx.type === 'expense' && isWithinInterval(parseISO(tx.date), { start: mStart, end: mEnd }))
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      month: format(date, 'MMM'),
      income: mIncome,
      expense: mExpense
    };
  });

  const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none mb-4">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Juel Rana</h1>
          <p className="text-slate-500 font-medium">Personal Finance Manager</p>
        </div>

        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
          <button 
            onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all", authMode === 'login' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500")}
          >
            Login
          </button>
          <button 
            onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all", authMode === 'register' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {authMode === 'forgot' && (
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Reset Password</h2>
              <p className="text-sm text-slate-500">Enter your email address and we'll send you instructions to reset your password.</p>
            </div>
          )}
          {authMode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                  placeholder="Enter your name"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          {authMode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                {authMode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccess(''); }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {authError && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl text-sm font-medium">
              <AlertCircle size={18} />
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl text-sm font-medium">
              <Check size={18} />
              {authSuccess}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            {authMode === 'login' ? 'Sign In' : authMode === 'register' ? 'Create Account' : 'Send Reset Link'}
          </button>

          {authMode === 'forgot' && (
            <button 
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              className="w-full text-center text-sm font-bold text-slate-500 hover:text-indigo-600"
            >
              Back to Login
            </button>
          )}
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 md:pb-0 md:pl-64">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 z-30">
        <div className="flex items-center gap-3 mb-10">
          <div 
            className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none overflow-hidden cursor-pointer active:scale-95 transition-transform"
            onClick={() => fileInputRef.current?.click()}
          >
            <img 
              src={profilePic} 
              alt="Juel Rana" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Juel";
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">Juel Rana</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium Member</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<ArrowUpRight size={20} />} label="Transactions" />
          <NavItem active={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} icon={<PieChartIcon size={20} />} label="Budgets" />
          <NavItem active={activeTab === 'banks'} onClick={() => setActiveTab('banks')} icon={<Building2 size={20} />} label="Bank Accounts" />
          <NavItem active={activeTab === 'savings'} onClick={() => setActiveTab('savings')} icon={<Target size={20} />} label="Savings" />
          <NavItem active={activeTab === 'recurring'} onClick={() => setActiveTab('recurring')} icon={<Clock size={20} />} label="Recurring" />
          <NavItem active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<FileText size={20} />} label="Files" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider mb-1">Total Balance</p>
            <p className="text-2xl font-bold">{currency.symbol}{(balance + totalBankBalance).toLocaleString()}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex justify-around items-center p-2 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" />
        <MobileNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<ArrowUpRight size={20} />} label="Trans" />
        
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="flex flex-col items-center justify-center -mt-10 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-xl shadow-indigo-300 dark:shadow-none active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>

        <MobileNavItem active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<FileText size={20} />} label="Files" />
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all", 
            isMobileMenuOpen ? "text-indigo-600" : "text-slate-400"
          )}
        >
          <Settings size={20} />
          <span className="text-[10px] font-bold">Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">Menu</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <nav className="space-y-2 flex-1 overflow-y-auto">
              <NavItem active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} icon={<LayoutDashboard size={20} />} label="Dashboard" />
              <NavItem active={activeTab === 'transactions'} onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }} icon={<ArrowUpRight size={20} />} label="Transactions" />
              <NavItem active={activeTab === 'budgets'} onClick={() => { setActiveTab('budgets'); setIsMobileMenuOpen(false); }} icon={<PieChartIcon size={20} />} label="Budgets" />
              <NavItem active={activeTab === 'banks'} onClick={() => { setActiveTab('banks'); setIsMobileMenuOpen(false); }} icon={<Building2 size={20} />} label="Bank Accounts" />
              <NavItem active={activeTab === 'savings'} onClick={() => { setActiveTab('savings'); setIsMobileMenuOpen(false); }} icon={<Target size={20} />} label="Savings" />
              <NavItem active={activeTab === 'recurring'} onClick={() => { setActiveTab('recurring'); setIsMobileMenuOpen(false); }} icon={<Clock size={20} />} label="Recurring" />
              <NavItem active={activeTab === 'files'} onClick={() => { setActiveTab('files'); setIsMobileMenuOpen(false); }} icon={<FileText size={20} />} label="Files" />
              <NavItem active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} icon={<Settings size={20} />} label="Settings" />
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6 md:p-10 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold capitalize tracking-tight">{activeTab}</h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">{format(new Date(), 'EEEE, MMMM do')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setNewTx({...newTx, type: 'income'}); setIsAddModalOpen(true); }}
              className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              <TrendingUp size={20} /> Add Income
            </button>
            <button 
              onClick={() => { setNewTx({...newTx, type: 'expense'}); setIsAddModalOpen(true); }}
              className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Plus size={20} /> Add Expense
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Balance" amount={balance + totalBankBalance} icon={<Wallet className="text-indigo-600" />} color="indigo" currencySymbol={currency.symbol} />
              <StatCard title="Bank Balance" amount={totalBankBalance} icon={<Building2 className="text-indigo-600" />} color="indigo" currencySymbol={currency.symbol} />
              <StatCard title="Income" amount={totalIncome} icon={<TrendingUp className="text-emerald-600" />} color="emerald" currencySymbol={currency.symbol} />
              <StatCard title="Expenses" amount={totalExpense} icon={<TrendingDown className="text-rose-600" />} color="rose" currencySymbol={currency.symbol} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Monthly Trend</h3>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Expense</div>
                  </div>
                </div>
                <div className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-lg mb-6">Expenses by Category</h3>
                <div className="h-[250px] w-full">
                  {expenseByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <PieChartIcon size={48} className="mb-2 opacity-20" />
                      <p className="text-sm">No data for this month</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {expenseByCategory.slice(0, 3).map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}}></div>
                        <span className="text-slate-600 dark:text-slate-400">{cat.name}</span>
                      </div>
                      <span className="font-semibold">৳{cat.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions & Income */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Recent Transactions</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-indigo-600 text-sm font-semibold flex items-center gap-1">
                    View All <ChevronRight size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {transactions.filter(tx => tx.type === 'expense').slice(0, 5).map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} onDelete={deleteTransaction} currencySymbol={currency.symbol} />
                  ))}
                  {transactions.filter(tx => tx.type === 'expense').length === 0 && (
                    <div className="py-10 text-center text-slate-400">
                      <p>No expenses yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Recent Income</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
                    View All <ChevronRight size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {transactions.filter(tx => tx.type === 'income').slice(0, 5).map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} onDelete={deleteTransaction} currencySymbol={currency.symbol} />
                  ))}
                  {transactions.filter(tx => tx.type === 'income').length === 0 && (
                    <div className="py-10 text-center text-slate-400">
                      <p>No income tracked yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'banks' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Your Bank Accounts</h3>
              <button 
                onClick={() => setIsAddBankModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Plus size={18} /> Add Account
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bankAccounts.map(acc => (
                <div key={acc.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Building2 size={24} />
                      </div>
                      <button 
                        onClick={() => deleteBank(acc.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-bold">{acc.name}</h4>
                      <p className="text-sm text-slate-500 font-medium">{acc.bank_name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-1">{acc.account_number || 'No Account Number'}</p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-indigo-600">{currency.symbol}{acc.balance.toLocaleString()}</p>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded-full">
                        {acc.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {bankAccounts.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <Building2 size={48} className="mx-auto mb-4 text-slate-300" />
                  <h4 className="text-lg font-bold text-slate-500">No Bank Accounts Found</h4>
                  <p className="text-slate-400 mb-6">Add your first bank account to start monitoring your savings.</p>
                  <button 
                    onClick={() => setIsAddBankModalOpen(true)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    Add Account Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Download size={20} /> Export
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 p-6 space-y-4">
                {transactions
                  .filter(tx => 
                    tx.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    tx.notes?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} onDelete={deleteTransaction} currencySymbol={currency.symbol} />
                  ))
                }
                {transactions.filter(tx => 
                    tx.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    tx.notes?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                  <div className="py-20 text-center text-slate-400">
                    <p>No transactions found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Monthly Budgets</h3>
              <button 
                onClick={() => setIsAddBudgetModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Plus size={18} /> Set Budget
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.filter(c => c.type === 'expense').map(cat => {
                const budget = budgets.find(b => b.category_id === cat.id);
                const spent = monthTransactions
                  .filter(tx => tx.category_id === cat.id)
                  .reduce((sum, tx) => sum + tx.amount, 0);
                const progress = budget ? (spent / budget.amount) * 100 : 0;
                
                return (
                  <div key={cat.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl" style={{backgroundColor: `${cat.color}20`, color: cat.color}}>
                          <IconRenderer name={cat.icon} />
                        </div>
                        <div>
                          <h4 className="font-bold">{cat.name}</h4>
                          <p className="text-xs text-slate-500">Monthly Budget</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{currency.symbol}{spent.toLocaleString()} / <span className="text-slate-400">{currency.symbol}{budget?.amount.toLocaleString() || '0'}</span></p>
                        <p className={cn("text-xs font-medium", progress > 100 ? "text-rose-500" : progress > 80 ? "text-amber-500" : "text-emerald-500")}>
                          {progress.toFixed(0)}% used
                        </p>
                      </div>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                      <div 
                        className={cn("h-full transition-all duration-500", progress > 100 ? "bg-rose-500" : progress > 80 ? "bg-amber-500" : "bg-indigo-500")}
                        style={{width: `${Math.min(progress, 100)}%`}}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">
                        {progress > 100 
                          ? `Over budget by ${currency.symbol}${(spent - (budget?.amount || 0)).toLocaleString()}` 
                          : `${currency.symbol}${((budget?.amount || 0) - spent).toLocaleString()} remaining`}
                      </p>
                      {!budget && (
                        <button 
                          onClick={() => {
                            setNewBudget({...newBudget, category_id: cat.id.toString()});
                            setIsAddBudgetModalOpen(true);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          Set Budget
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Savings Goals</h3>
              <button 
                onClick={() => setIsAddSavingsModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <Plus size={18} /> New Goal
              </button>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savings.map(goal => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                return (
                  <div key={goal.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                    <button 
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl">
                        <Target size={24} />
                      </div>
                      <div className="text-right pr-8">
                        <h4 className="font-bold text-lg">{goal.name}</h4>
                        <p className="text-sm text-slate-500">Goal: {currency.symbol}{goal.target_amount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Progress</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-500"
                          style={{width: `${Math.min(progress, 100)}%`}}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500">Saved</p>
                        <p className="font-bold text-indigo-600">{currency.symbol}{goal.current_amount.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedGoal(goal);
                          setIsAddFundsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Add Funds
                      </button>
                    </div>
                  </div>
                );
              })}
              
              <button 
                onClick={() => setIsAddSavingsModalOpen(true)}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
              >
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                  <Plus className="text-slate-400 group-hover:text-indigo-600" size={24} />
                </div>
                <span className="font-semibold text-slate-500 group-hover:text-indigo-600">New Savings Goal</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="relative group">
                  <div 
                    className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl cursor-pointer active:scale-95 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <img 
                      src={profilePic} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Juel";
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Juel Rana</h3>
                  <p className="text-slate-500">Personal Finance Account</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[10px] font-bold uppercase rounded-md">Admin</span>
                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-bold uppercase rounded-md">Verified</span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-6">Profile & Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Currency</p>
                    <p className="text-sm text-slate-500">Choose your preferred currency symbol</p>
                  </div>
                  <select 
                    value={currency.code}
                    onChange={(e) => {
                      const code = e.target.value;
                      const symbols: Record<string, string> = { BDT: '৳', USD: '$', EUR: '€', GBP: '£' };
                      setCurrency({ code, symbol: symbols[code] });
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 font-medium outline-none"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Dark Mode</p>
                    <p className="text-sm text-slate-500">Toggle between light and dark themes</p>
                  </div>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-all duration-300",
                      isDarkMode ? "bg-indigo-600" : "bg-slate-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                      isDarkMode ? "right-1" : "left-1"
                    )}></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Account Actions</h3>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <LogOut size={20} /> Logout from Account
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Supabase Connection</h3>
                {import.meta.env.VITE_SUPABASE_URL ? (
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold uppercase rounded-full flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Connected
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold uppercase rounded-full">
                    Not Configured
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  {import.meta.env.VITE_SUPABASE_URL 
                    ? `Your application is connected to Supabase project: ${import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]}`
                    : "Connect your application to Supabase for cloud sync and authentication."}
                </p>
                
                {!import.meta.env.VITE_SUPABASE_URL && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                    <div className="flex gap-3">
                      <AlertCircle className="text-amber-600 shrink-0" size={20} />
                      <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Configuration Required</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                          Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables to enable Supabase features.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-rose-600">Danger Zone</h3>
              <p className="text-sm text-slate-500 mb-6">Once you delete your data, there is no going back. Please be certain.</p>
              <button 
                onClick={handleDeleteAllTransactions}
                className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
              >
                Delete All Transactions
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Recurring Transactions</h3>
                <button 
                  onClick={() => setIsAddRecurringModalOpen(true)}
                  className="flex items-center gap-2 text-indigo-600 text-sm font-bold"
                >
                  <Plus size={16} /> Add New
                </button>
              </div>
              <div className="space-y-4">
                {recurringTemplates.map(template => (
                  <div key={template.id} className={cn("p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between transition-opacity", !template.is_active && "opacity-60")}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
                        <IconRenderer name={template.category_icon || 'Clock'} />
                      </div>
                      <div>
                        <p className="font-bold">{template.category_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{template.frequency} • {currency.symbol}{template.amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleRecurringStatus(template.id, !!template.is_active)}
                        className={cn(
                          "px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-colors",
                          template.is_active 
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" 
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        )}
                      >
                        {template.is_active ? 'Active' : 'Paused'}
                      </button>
                      <button 
                        onClick={() => deleteRecurring(template.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {recurringTemplates.length === 0 && (
                  <div className="py-10 text-center text-slate-400">
                    <p>No recurring transactions set up yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">My Documents</h3>
              <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer">
                <FileUp size={20} /> Upload File
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map(file => (
                <div key={file.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group relative">
                  <button 
                    onClick={() => deleteFile(file.id)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate" title={file.name}>{file.name}</h4>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • {format(parseISO(file.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <a 
                    href={file.path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Download size={16} /> Download
                  </a>
                </div>
              ))}
              {files.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No files uploaded yet.</p>
                  <p className="text-sm">Upload receipts, invoices, or statements.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Recurring Modal */}
      {isAddRecurringModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold">Add Recurring Transaction</h3>
              <button onClick={() => setIsAddRecurringModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRecurring} className="p-6 space-y-5 overflow-y-auto">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setNewRecurring({...newRecurring, type: 'expense'})}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", newRecurring.type === 'expense' ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" : "text-slate-500")}
                >
                  Expense
                </button>
                <button 
                  type="button"
                  onClick={() => setNewRecurring({...newRecurring, type: 'income'})}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", newRecurring.type === 'income' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500")}
                >
                  Income
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">{currency.symbol}</span>
                  <input 
                    type="number" 
                    step="0.01"
                    autoFocus
                    value={newRecurring.amount}
                    onChange={(e) => setNewRecurring({...newRecurring, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select 
                    value={newRecurring.category_id}
                    onChange={(e) => setNewRecurring({...newRecurring, category_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="">Select</option>
                    {categories.filter(c => c.type === newRecurring.type).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Frequency</label>
                  <select 
                    value={newRecurring.frequency}
                    onChange={(e) => setNewRecurring({...newRecurring, frequency: e.target.value as any})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Save Recurring Template
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold">Add Transaction</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-6 space-y-5 overflow-y-auto">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: 'expense'})}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", newTx.type === 'expense' ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" : "text-slate-500")}
                >
                  Expense
                </button>
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: 'income'})}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", newTx.type === 'income' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500")}
                >
                  Income
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">{currency.symbol}</span>
                  <input 
                    type="number" 
                    step="0.01"
                    autoFocus
                    value={newTx.amount}
                    onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-3xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {newTx.type === 'income' ? 'Income Source' : 'Category'}
                  </label>
                  <select 
                    value={newTx.category_id}
                    onChange={(e) => setNewTx({...newTx, category_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="">Select</option>
                    {categories.filter(c => c.type === newTx.type).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <input 
                    type="date" 
                    value={newTx.date}
                    onChange={(e) => setNewTx({...newTx, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes (Optional)</label>
                <textarea 
                  value={newTx.notes}
                  onChange={(e) => setNewTx({...newTx, notes: e.target.value})}
                  placeholder="What was this for?"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold">Add Bank Account</h3>
              <button onClick={() => setIsAddBankModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Name</label>
                <input 
                  type="text" 
                  required
                  value={newBank.name}
                  onChange={(e) => setNewBank({...newBank, name: e.target.value})}
                  placeholder="e.g. My Savings Account"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Name</label>
                <input 
                  type="text" 
                  required
                  value={newBank.bank_name}
                  onChange={(e) => setNewBank({...newBank, bank_name: e.target.value})}
                  placeholder="e.g. Dutch Bangla Bank"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Number</label>
                  <input 
                    type="text" 
                    value={newBank.account_number}
                    onChange={(e) => setNewBank({...newBank, account_number: e.target.value})}
                    placeholder="Optional"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                  <select 
                    value={newBank.type}
                    onChange={(e) => setNewBank({...newBank, type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Balance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">{currency.symbol}</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newBank.balance}
                    onChange={(e) => setNewBank({...newBank, balance: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Add Bank Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {isAddBudgetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Set Monthly Budget</h3>
              <button onClick={() => setIsAddBudgetModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddBudget} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select 
                  required
                  value={newBudget.category_id}
                  onChange={(e) => setNewBudget({...newBudget, category_id: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">{currency.symbol}</span>
                  <input 
                    type="number" 
                    required
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
                Save Budget
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Savings Goal Modal */}
      {isAddSavingsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold">New Savings Goal</h3>
              <button onClick={() => setIsAddSavingsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSavings} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Goal Name</label>
                <input 
                  type="text" 
                  required
                  value={newSavings.name}
                  onChange={(e) => setNewSavings({...newSavings, name: e.target.value})}
                  placeholder="e.g., New Car, Vacation"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">{currency.symbol}</span>
                  <input 
                    type="number" 
                    required
                    value={newSavings.target_amount}
                    onChange={(e) => setNewSavings({...newSavings, target_amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Savings (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">{currency.symbol}</span>
                  <input 
                    type="number" 
                    value={newSavings.current_amount}
                    onChange={(e) => setNewSavings({...newSavings, current_amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {isAddFundsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold">Add Funds</h3>
              <button onClick={() => setIsAddFundsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddFunds} className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount to Add</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">{currency.symbol}</span>
                  <input 
                    type="number" 
                    required
                    autoFocus
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
                Confirm Deposit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden File Input for Profile Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleProfileUpload} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all", 
        active ? "text-indigo-600" : "text-slate-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ title, amount, icon, isPercent, color, currencySymbol }: { title: string, amount: number, icon: React.ReactNode, isPercent?: boolean, color: string, currencySymbol: string }) {
  const colorClasses: Record<string, string> = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
    rose: "bg-rose-50 dark:bg-rose-900/20",
    amber: "bg-amber-50 dark:bg-amber-900/20",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 md:p-2.5 rounded-xl", colorClasses[color])}>
          {icon}
        </div>
        <div className="text-slate-400"><ArrowUpRight size={16} /></div>
      </div>
      <p className="text-xs md:text-sm text-slate-500 font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-xl md:text-2xl font-bold mt-1 tracking-tight">
        {isPercent ? `${amount.toFixed(1)}%` : `${currencySymbol}${amount.toLocaleString()}`}
      </p>
    </div>
  );
}

function TransactionItem({ tx, onDelete, currencySymbol }: { tx: Transaction, onDelete: (id: number) => void | Promise<void>, currencySymbol: string, key?: React.Key }) {
  return (
    <div className="flex items-center justify-between group py-2">
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        {/* Enhanced Icon Container */}
        <div 
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex shrink-0 items-center justify-center shadow-sm transition-transform group-hover:scale-105"
          style={{ 
            backgroundColor: `${tx.category_color}15`, 
            color: tx.category_color,
            border: `1px solid ${tx.category_color}30`
          }}
        >
          <IconRenderer name={tx.category_icon || 'HelpCircle'} className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{tx.category_name}</p>
            {/* Type Badge */}
            <span className={cn(
              "text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0",
              tx.type === 'income' 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            )}>
              {tx.type}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 shrink-0"><Calendar size={10} /> {format(parseISO(tx.date), 'MMM d')}</span>
            {tx.notes && (
              <span className="flex items-center gap-1 truncate italic">
                <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></div>
                {tx.notes}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="text-right">
          <p className={cn(
            "font-bold text-base md:text-lg tracking-tight", 
            tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
          )}>
            {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <button 
          onClick={() => onDelete(tx.id)}
          className="md:opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
          title="Delete transaction"
        >
          <Trash2 size={16} md:size={18} />
        </button>
      </div>
    </div>
  );
}
