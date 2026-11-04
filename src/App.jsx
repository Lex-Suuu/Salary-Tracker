import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  Wallet, 
  TrendingDown, 
  Trash2, 
  Download, 
  Upload, 
  Plus,
  CheckCircle2,
  AlertCircle,
  PieChart as PieChartIcon,
  Calendar,
  FileText
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Legend, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function App() {
  // State: Ledger System
  const [transactions, setTransactions] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef(null);

  // Form States
  const [incomeAmount, setIncomeAmount] = useState('');
  const [transferMariBankAmount, setTransferMariBankAmount] = useState('');
  const [transferGoTymeAmount, setTransferGoTymeAmount] = useState('');

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Housing');
  const [source, setSource] = useState('MariBank');

  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Helper to get current Philippine Time
  const getPHTTimestamp = () => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date());
  };

  // Updated Categories
  const categories = [
    'Housing', 
    'Food', 
    'Transportation', 
    'Transportation Maintenance', 
    'Utilities', 
    'Entertainment', 
    'Healthcare', 
    'Savings', 
    'Other'
  ];

  // Load from LocalStorage and Handle Migration from V1
  useEffect(() => {
    const savedTransactions = localStorage.getItem('tracker_transactions');
    
    // Legacy state keys for migration
    const savedSalary = localStorage.getItem('tracker_salary');
    const savedTransfer = localStorage.getItem('tracker_transfer');
    const savedExpenses = localStorage.getItem('tracker_expenses');

    let initialTransactions = [];

    if (savedTransactions) {
      try {
        initialTransactions = JSON.parse(savedTransactions);
      } catch (e) {
        console.error("Could not parse saved transactions");
      }
    } else if (savedSalary || savedExpenses) {
      // Migrate old version data to the new ledger system automatically
      if (savedSalary) {
        const sal = parseFloat(savedSalary) || 0;
        if (sal > 0) {
          initialTransactions.push({ id: 'mig-inc', timestamp: Date.now(), date: getPHTTimestamp(), type: 'INCOME', amount: sal, description: 'Initial Salary Migration' });
          
          const trans = parseFloat(savedTransfer) || 0;
          if (trans > 0) {
            initialTransactions.push({ id: 'mig-tr-go', timestamp: Date.now(), date: getPHTTimestamp(), type: 'TRANSFER', dest: 'GoTyme', amount: trans, description: 'Initial GoTyme Setup' });
          }
          
          const mariTrans = sal - trans;
          if (mariTrans > 0) {
             initialTransactions.push({ id: 'mig-tr-ma', timestamp: Date.now(), date: getPHTTimestamp(), type: 'TRANSFER', dest: 'MariBank', amount: mariTrans, description: 'Initial MariBank Setup' });
          }
        }
      }
      if (savedExpenses) {
        try {
          const exps = JSON.parse(savedExpenses);
          exps.forEach(e => {
            initialTransactions.push({
              id: e.id, timestamp: Date.now(), date: e.date, type: 'EXPENSE', source: e.source, category: e.category, amount: e.amount, description: e.description
            });
          });
        } catch(e) {}
      }
    }
    
    setTransactions(initialTransactions);
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('tracker_transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  // Actions
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Calculations
  const rcbcIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const rcbcTransfers = transactions.filter(t => t.type === 'TRANSFER').reduce((sum, t) => sum + t.amount, 0);
  const rcbcBalance = rcbcIncome - rcbcTransfers;

  const mariBankTransfers = transactions.filter(t => t.type === 'TRANSFER' && t.dest === 'MariBank').reduce((sum, t) => sum + t.amount, 0);
  const mariBankExpenses = transactions.filter(t => t.type === 'EXPENSE' && t.source === 'MariBank').reduce((sum, t) => sum + t.amount, 0);
  const maribankBalance = mariBankTransfers - mariBankExpenses;

  const goTymeTransfers = transactions.filter(t => t.type === 'TRANSFER' && t.dest === 'GoTyme').reduce((sum, t) => sum + t.amount, 0);
  const gotymeExpenses = transactions.filter(t => t.type === 'EXPENSE' && t.source === 'GoTyme').reduce((sum, t) => sum + t.amount, 0);
  const gotymeBalance = goTymeTransfers - gotymeExpenses;

  // Handlers
  const handleAddIncome = () => {
    const num = parseFloat(incomeAmount);
    if (!num || num <= 0) return;
    
    const newTx = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: getPHTTimestamp(),
      type: 'INCOME',
      amount: num,
      description: 'Income Deposit'
    };
    setTransactions([newTx, ...transactions]);
    setIncomeAmount('');
    showNotification('Income added successfully');
  };

  const handleTransfer = (dest, amountStr, setAmountFunc) => {
    const num = parseFloat(amountStr);
    if (!num || num <= 0) return;
    if (num > rcbcBalance) {
      showNotification(`Insufficient funds in RCBC for this transfer`, 'error');
      return;
    }

    const newTx = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: getPHTTimestamp(),
      type: 'TRANSFER',
      dest,
      amount: num,
      description: `Fund Transfer`
    };
    setTransactions([newTx, ...transactions]);
    setAmountFunc('');
    showNotification(`Successfully transferred to ${dest}`);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!desc || !num || num <= 0) return;

    const newTx = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: getPHTTimestamp(),
      type: 'EXPENSE',
      source,
      category,
      amount: num,
      description: desc
    };

    setTransactions([newTx, ...transactions]);
    setDesc('');
    setAmount('');
    showNotification('Expense recorded successfully');
  };

  const handleDeleteTx = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    showNotification('Transaction deleted');
  };

  // Import / Export
  const handleExport = () => {
    const data = { transactions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial_ledger_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          showNotification('Ledger imported successfully');
        } else {
          showNotification('Invalid format. Missing transactions array.', 'error');
        }
      } catch (error) {
        showNotification('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadCSV = () => {
    const filtered = transactions.filter(tx => {
      const txTime = tx.timestamp || parseInt(tx.id);
      if (isNaN(txTime)) return true;
      
      let match = true;
      if (reportStartDate) {
        const start = new Date(reportStartDate).setHours(0, 0, 0, 0);
        if (txTime < start) match = false;
      }
      if (reportEndDate) {
        const end = new Date(reportEndDate).setHours(23, 59, 59, 999);
        if (txTime > end) match = false;
      }
      return match;
    });

    if (filtered.length === 0) {
      showNotification('No transactions found in this date range.', 'error');
      return;
    }

    const headers = ['Date', 'Type', 'Description', 'Category', 'Source/Dest', 'Amount'];
    const rows = filtered.map(tx => [
      `"${tx.date}"`,
      tx.type,
      `"${tx.description}"`,
      tx.category || '-',
      tx.type === 'INCOME' ? 'RCBC' : (tx.type === 'TRANSFER' ? tx.dest : tx.source),
      tx.amount
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial_report_${reportStartDate || 'start'}_to_${reportEndDate || 'end'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('CSV Report downloaded successfully');
  };

  // Chart Data (Expenses Only)
  const expensesOnly = transactions.filter(t => t.type === 'EXPENSE');
  const categoryData = categories.map(cat => ({
    name: cat,
    value: expensesOnly.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(cat => cat.value > 0).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'];

  const formatMoney = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-8 h-8 text-blue-600" />
              Salary Tracker
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage your income, transfers, and expenses</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm">
              <Download className="w-4 h-4" /> Export Ledger
            </button>
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm border border-blue-200">
              <Upload className="w-4 h-4" /> Import Data
            </button>
          </div>
        </div>

        {/* Custom Notification Toast */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
            {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {notification.message}
          </div>
        )}

        {/* Dashboard Balances Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* RCBC Master Account */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                  RCBC Balance (Income)
                  <img src="https://logo.clearbit.com/rcbc.com" alt="RCBC" className="h-4 rounded-sm bg-white" onError={(e) => e.target.style.display = 'none'} />
                </p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(rcbcBalance)}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Deposit Income</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                  <input
                    type="number"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <button onClick={handleAddIncome} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* MariBank Account */}
          <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between ${maribankBalance < 0 ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium flex items-center gap-2 ${maribankBalance < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  MariBank (Expenses)
                  <img src="https://logo.clearbit.com/maribank.ph" alt="MariBank" className="h-4 rounded-sm bg-white" onError={(e) => e.target.style.display = 'none'} />
                </p>
                <h3 className={`text-2xl font-bold mt-1 ${maribankBalance < 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                  {formatMoney(maribankBalance)}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${maribankBalance < 0 ? 'bg-rose-100' : 'bg-orange-50'}`}>
                <TrendingDown className={`w-6 h-6 ${maribankBalance < 0 ? 'text-rose-600' : 'text-orange-500'}`} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100/50">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Transfer from RCBC</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                  <input
                    type="number"
                    value={transferMariBankAmount}
                    onChange={(e) => setTransferMariBankAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <button onClick={() => handleTransfer('MariBank', transferMariBankAmount, setTransferMariBankAmount)} className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors text-sm">
                  Transfer
                </button>
              </div>
            </div>
          </div>

          {/* GoTyme Account */}
          <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between ${gotymeBalance < 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium flex items-center gap-2 ${gotymeBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  GoTyme (Savings)
                  <img src="https://logo.clearbit.com/gotyme.com.ph" alt="GoTyme" className="h-4 rounded-sm bg-white" onError={(e) => e.target.style.display = 'none'} />
                </p>
                <h3 className={`text-2xl font-bold mt-1 ${gotymeBalance < 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                  {formatMoney(gotymeBalance)}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${gotymeBalance < 0 ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                <Wallet className={`w-6 h-6 ${gotymeBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-black/5">
              <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${gotymeBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                Transfer from RCBC
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${gotymeBalance < 0 ? 'text-rose-400' : 'text-emerald-500'}`}>₱</span>
                  <input
                    type="number"
                    value={transferGoTymeAmount}
                    onChange={(e) => setTransferGoTymeAmount(e.target.value)}
                    placeholder="Amount"
                    className={`w-full pl-7 pr-3 py-2 bg-white/50 border rounded-lg focus:ring-2 outline-none transition-all ${
                      gotymeBalance < 0 ? 'border-rose-200 focus:ring-rose-500' : 'border-emerald-200 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                <button onClick={() => handleTransfer('GoTyme', transferGoTymeAmount, setTransferGoTymeAmount)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm">
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add Expense Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" /> Log an Expense
            </h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Groceries"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deduct From</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="MariBank">MariBank</option>
                  <option value="GoTyme">GoTyme</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors mt-2">
                Log Expense
              </button>
            </form>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Ledger History</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No transactions recorded yet.</p>
                <p className="text-slate-400 text-sm mt-1">Add income to RCBC to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Account/Category</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.type === 'INCOME' ? 'bg-blue-100 text-blue-700' :
                            tx.type === 'TRANSFER' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                           <div className="flex flex-col">
                             <span className="text-sm font-medium text-slate-700">
                               {tx.type === 'INCOME' ? 'RCBC' : tx.type === 'TRANSFER' ? `RCBC ➔ ${tx.dest}` : tx.source}
                             </span>
                             {tx.type === 'EXPENSE' && tx.category && (
                               <span className="text-xs text-slate-500">{tx.category}</span>
                             )}
                           </div>
                        </td>
                        <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${
                           tx.type === 'INCOME' ? 'text-blue-600' :
                           tx.type === 'TRANSFER' ? 'text-emerald-600' : 'text-slate-800'
                        }`}>
                          {tx.type === 'EXPENSE' ? '-' : '+'}{formatMoney(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteTx(tx.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Report & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Generate Report Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Generate Report
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> End Date
                  </label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="w-full px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Download className="w-4 h-4" /> Download CSV Report
              </button>
            </div>
          </div>

          {/* Expense Breakdown Pie Chart */}
          {expensesOnly.length > 0 ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-500" /> Expense Breakdown
              </h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [formatMoney(value), 'Total']} 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <PieChartIcon className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No expenses yet.</p>
              <p className="text-slate-400 text-sm mt-1">Log an expense to see your visual breakdown.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}