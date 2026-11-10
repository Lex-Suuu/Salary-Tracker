import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  TrendingDown,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Edit2,
  Check,
  X,
  PieChart as PieChartIcon,
  Printer,
  Download,
  Settings,
  Eye,
  EyeOff,
  Building2,
  Trash2,
  Receipt,
  Calculator,
  SlidersHorizontal,
  ChevronRight,
  Archive,
  RotateCcw,
  Users
} from 'lucide-react';

const INITIAL_EXPENSE_CATEGORIES = [
  'Housing',
  'Food & Groceries',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Personal Care',
  'Debt/Loans',
  'Other'
];

const CATEGORY_COLORS = [
  '#10B981', '#F59E0B', '#3B82F6', '#EC4899',
  '#8B5CF6', '#06B6D4', '#F97316', '#6366F1', '#64748B'
];

const FILTER_TABS = ['All', 'Wallet', 'Savings', 'MP2 Savings', 'Credit', 'Loans', 'Closed'];

const DEFAULT_ACCOUNTS = [
  { id: 'acc_gotyme', name: 'Emergency Fund', bankName: 'GO', balance: 0, category: 'Wallet', iconColor: 'bg-emerald-500 text-white', isClosed: false },
  { id: 'acc_bdo', name: 'Emergency Fund', bankName: 'BDO', balance: 0, category: 'Savings', iconColor: 'bg-blue-900 text-amber-400', isClosed: false },
  { id: 'acc_bpi', name: 'Savings', bankName: 'BPI', balance: 0, category: 'Savings', iconColor: 'bg-red-700 text-white', isClosed: false },
  { id: 'acc_mp2', name: 'Retirement Fund', bankName: 'MP2', balance: 0, category: 'MP2 Savings', iconColor: 'bg-indigo-900 text-white', isClosed: false },
  { id: 'acc_maya_sa', name: 'SA/TD/Personal Goal', bankName: 'maya', balance: 0, category: 'Savings', iconColor: 'bg-black text-emerald-400', isClosed: false },
  { id: 'acc_gcash', name: 'Gfund/Invest', bankName: 'G)', balance: 0, category: 'Wallet', iconColor: 'bg-blue-600 text-white', isClosed: false },
  { id: 'acc_crypto', name: 'Fund/Stocks/Crypto', bankName: 'maya', balance: 0, category: 'Wallet', iconColor: 'bg-black text-emerald-400', isClosed: false },
  { id: 'acc_gold', name: 'Gold', bankName: '💍', balance: 0, category: 'Asset', iconColor: 'bg-emerald-100 text-emerald-700', isClosed: false }
];

export default function App() {
  const [mainTab, setMainTab] = useState('expenses');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('salary_tracker_accounts_v2');
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('salary_tracker_ledger');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [hideNetWorth, setHideNetWorth] = useState(() => {
    return localStorage.getItem('salary_tracker_hide_total') === 'true';
  });

  // Selected account for card interaction modal
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferType, setTransferType] = useState('deposit');

  // Close Account sub-flow states
  const [isClosingFlow, setIsClosingFlow] = useState(false);
  const [closeAction, setCloseAction] = useState('transfer');
  const [transferTargetId, setTransferTargetId] = useState('');

  // Settings dropdown & notifications
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  // Financial Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportRange, setReportRange] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Split Calculator Modal State
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitBillAmount, setSplitBillAmount] = useState('');
  const [splitPeopleCount, setSplitPeopleCount] = useState('2');
  const [splitTipPercent, setSplitTipPercent] = useState('0');

  // Expense form state
  const [desc, setDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [category, setCategory] = useState(INITIAL_EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState(() => accounts.find(a => !a.isClosed)?.id || '');

  // Add Bank Modal
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankTag, setNewBankTag] = useState('');
  const [newBankCategory, setNewBankCategory] = useState('Savings');
  const [newBankInitialBalance, setNewBankInitialBalance] = useState('');

  useEffect(() => {
    localStorage.setItem('salary_tracker_accounts_v2', JSON.stringify(accounts));
    localStorage.setItem('salary_tracker_ledger', JSON.stringify(transactions));
    localStorage.setItem('salary_tracker_hide_total', hideNetWorth);
  }, [accounts, transactions, hideNetWorth]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const activeAccounts = accounts.filter((a) => !a.isClosed);
  const totalNetWorth = activeAccounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);

  const filteredAccounts = accounts.filter((acc) => {
    if (activeCategoryFilter === 'Closed') {
      return !!acc.isClosed;
    }
    if (acc.isClosed) return false;
    if (activeCategoryFilter === 'All') return true;
    return (acc.category || '').toLowerCase() === activeCategoryFilter.toLowerCase();
  });

  const formatCurrency = (val, isMasked = false) => {
    if (isMasked) return '₱••••••••';
    return (
      '₱' +
      (parseFloat(val) || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  };

  const isCurrentMonth = (dateString) => {
    if (!dateString) return false;
    const txDate = new Date(dateString);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const txDate = new Date(dateString);
    const today = new Date();
    return (
      txDate.getDate() === today.getDate() &&
      txDate.getMonth() === today.getMonth() &&
      txDate.getFullYear() === today.getFullYear()
    );
  };

  const expenseTransactions = (transactions || []).filter((tx) => tx?.type === 'EXPENSE');
  const currentMonthExpensesList = expenseTransactions.filter((tx) => isCurrentMonth(tx?.date));
  const totalMonthlyExpenses = currentMonthExpensesList.reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);
  const todayExpenses = expenseTransactions.filter((tx) => isToday(tx?.date)).reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const categoryTotals = currentMonthExpensesList.reduce((acc, tx) => {
    const cat = tx?.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (parseFloat(tx.amount) || 0);
    return acc;
  }, {});

  const categoryList = Object.keys(categoryTotals).map((name, index) => {
    const amount = categoryTotals[name];
    const percentage = totalMonthlyExpenses > 0 ? (amount / totalMonthlyExpenses) * 100 : 0;
    return {
      name,
      amount,
      percentage,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    };
  });

  const handleAccountBalanceUpdate = (e) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (transferType === 'withdraw' && amt > selectedAccount.balance) {
      showToast('Insufficient funds in this account', 'error');
      return;
    }

    const updatedBalance = transferType === 'deposit' 
      ? selectedAccount.balance + amt 
      : selectedAccount.balance - amt;

    setAccounts(accounts.map((a) => (a.id === selectedAccount.id ? { ...a, balance: updatedBalance } : a)));

    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: transferType === 'deposit' ? 'INCOME' : 'EXPENSE',
      description: transferType === 'deposit' ? `Deposit (${selectedAccount.name})` : `Withdrawal (${selectedAccount.name})`,
      amount: amt,
      category: 'Adjustment',
      fromName: selectedAccount.name,
      toName: selectedAccount.name
    };

    setTransactions([newTx, ...transactions]);
    setSelectedAccount(null);
    setTransferAmount('');
    showToast(`Updated ${selectedAccount.name} balance`);
  };

  const handleCloseAccount = () => {
    if (!selectedAccount) return;
    const remainingBalance = parseFloat(selectedAccount.balance) || 0;

    let updatedAccounts = [...accounts];
    const newTxList = [...transactions];

    if (remainingBalance > 0) {
      if (closeAction === 'transfer') {
        const targetAcc = accounts.find((a) => a.id === transferTargetId && !a.isClosed && a.id !== selectedAccount.id);
        if (!targetAcc) {
          showToast('Please select an active destination account to transfer funds', 'error');
          return;
        }

        updatedAccounts = updatedAccounts.map((a) => {
          if (a.id === targetAcc.id) {
            return { ...a, balance: a.balance + remainingBalance };
          }
          if (a.id === selectedAccount.id) {
            return { ...a, balance: 0, isClosed: true };
          }
          return a;
        });

        newTxList.unshift({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: 'TRANSFER',
          description: `Account Closure: Transferred ${formatCurrency(remainingBalance)} from ${selectedAccount.name} to ${targetAcc.name}`,
          amount: remainingBalance,
          category: 'Account Closed',
          fromName: selectedAccount.name,
          toName: targetAcc.name
        });

        showToast(`Closed ${selectedAccount.name} and transferred ${formatCurrency(remainingBalance)} to ${targetAcc.name}`);
      } else {
        updatedAccounts = updatedAccounts.map((a) => (a.id === selectedAccount.id ? { ...a, isClosed: true } : a));

        newTxList.unshift({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: 'EXPENSE',
          description: `Account Closed (${selectedAccount.name}) - Balance Liquidated`,
          amount: remainingBalance,
          category: 'Account Closed',
          fromName: selectedAccount.name,
          toName: 'Liquidated'
        });

        showToast(`Closed ${selectedAccount.name} with remaining balance of ${formatCurrency(remainingBalance)}`);
      }
    } else {
      updatedAccounts = updatedAccounts.map((a) => (a.id === selectedAccount.id ? { ...a, isClosed: true } : a));
      newTxList.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'TRANSFER',
        description: `Account Closed (${selectedAccount.name})`,
        amount: 0,
        category: 'Account Closed',
        fromName: selectedAccount.name,
        toName: 'Closed'
      });
      showToast(`Closed account ${selectedAccount.name}`);
    }

    setAccounts(updatedAccounts);
    setTransactions(newTxList);
    setSelectedAccount(null);
    setIsClosingFlow(false);
  };

  const handleReopenAccount = (accId) => {
    setAccounts(accounts.map((a) => (a.id === accId ? { ...a, isClosed: false } : a)));
    showToast('Account reopened and added back to active accounts');
    setSelectedAccount(null);
  };

  // FULL RESET DATA: Resets all account balances, ledger records, and Net Worth to 0
  const handleFullResetData = () => {
    setShowSettingsMenu(false);
    if (window.confirm('Are you sure you want to completely RESET ALL DATA? All account balances, transactions, and net worth will be set to ₱0.00.')) {
      const resetAccounts = DEFAULT_ACCOUNTS.map(a => ({ ...a, balance: 0, isClosed: false }));
      setAccounts(resetAccounts);
      setTransactions([]);
      localStorage.removeItem('salary_tracker_accounts_v2');
      localStorage.removeItem('salary_tracker_ledger');
      localStorage.removeItem('salary_tracker_accounts');
      localStorage.removeItem('salary_tracker_hidden_accounts');
      showToast('All accounts and net worth have been reset to ₱0.00');
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    const sourceAccount = accounts.find((a) => a.id === expenseAccountId);

    if (!desc.trim()) {
      showToast('Please enter an expense description', 'error');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid expense amount', 'error');
      return;
    }
    if (sourceAccount && amt > sourceAccount.balance) {
      showToast(`Insufficient funds in ${sourceAccount.name}`, 'error');
      return;
    }

    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;

    if (sourceAccount) {
      setAccounts(accounts.map((a) => (a.id === sourceAccount.id ? { ...a, balance: a.balance - amt } : a)));
    }

    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'EXPENSE',
      description: desc.trim(),
      amount: amt,
      category: finalCategory,
      fromId: expenseAccountId,
      fromName: sourceAccount?.name || 'Wallet'
    };

    const nextTodayExpenses = todayExpenses + amt;
    setTransactions([newTx, ...transactions]);
    setDesc('');
    setExpenseAmount('');
    setCustomCategory('');

    if (nextTodayExpenses >= 1000 && todayExpenses < 1000) {
      showToast(`Daily Warning: Today's expenses reached ₱${nextTodayExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} (₱1,000+ limit crossed)!`, 'warning');
    } else if (nextTodayExpenses >= 800 && nextTodayExpenses < 1000) {
      showToast(`Daily Notice: You've spent ₱${nextTodayExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} today — almost ₱1,000!`, 'warning');
    } else {
      showToast(`Logged: ₱${amt.toLocaleString()} (${finalCategory})`);
    }
  };

  const handleAddAccountSubmit = (e) => {
    e.preventDefault();
    if (!newBankName.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    const initialAmt = parseFloat(newBankInitialBalance) || 0;
    const newAcc = {
      id: 'acc_' + Date.now().toString(),
      name: newBankTag.trim() || 'Savings',
      bankName: newBankName.trim(),
      balance: initialAmt,
      category: newBankCategory,
      iconColor: 'bg-blue-600 text-white',
      isClosed: false
    };

    setAccounts([...accounts, newAcc]);
    setNewBankName('');
    setNewBankTag('');
    setNewBankInitialBalance('');
    setShowAddBankModal(false);
    showToast(`Added ${newAcc.bankName} to ${newAcc.category}`);
  };

  const getReportTransactions = () => {
    const now = new Date();
    return (transactions || []).filter((tx) => {
      if (!tx?.date) return false;
      const txDate = new Date(tx.date);

      if (reportRange === 'TODAY') {
        return (
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      if (reportRange === 'WEEK') {
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (reportRange === 'MONTH') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (reportRange === 'CUSTOM') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date('1970-01-01');
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date('2099-12-31');
        return txDate >= start && txDate <= end;
      }
      return true;
    });
  };

  const reportList = getReportTransactions();
  const reportInflow = reportList.filter((tx) => tx?.type === 'INCOME').reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  const reportOutflow = reportList.filter((tx) => tx?.type === 'EXPENSE').reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Account', 'Amount'];
    const rows = reportList.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.type || '',
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${tx.category || ''}"`,
      `"${tx.fromName || tx.toName || ''}"`,
      tx.amount || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${reportRange.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Split Calculations
  const billVal = parseFloat(splitBillAmount) || 0;
  const numPeople = Math.max(1, parseInt(splitPeopleCount) || 1);
  const tipPct = parseFloat(splitTipPercent) || 0;
  const tipAmount = billVal * (tipPct / 100);
  const totalWithTip = billVal + tipAmount;
  const perPersonShare = totalWithTip / numPeople;

  const handleApplySplitToExpense = () => {
    if (perPersonShare <= 0) return;
    setDesc(`Split Bill (${numPeople} people)`);
    setExpenseAmount(perPersonShare.toFixed(2));
    setCategory('Food & Groceries');
    setShowSplitModal(false);
    setMainTab('expenses');
    showToast(`Filled ₱${perPersonShare.toFixed(2)} into Log Expense form`);
  };

  const transferTargets = accounts.filter((a) => !a.isClosed && a.id !== selectedAccount?.id);

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Alert */}
      {notification.show && (
        <div
          className={`fixed top-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-white text-xs font-semibold animate-in fade-in duration-200 ${
            notification.type === 'error'
              ? 'bg-red-600'
              : notification.type === 'warning'
              ? 'bg-amber-600'
              : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle size={16} /> : notification.type === 'warning' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Mobile App Container */}
      <div className="w-full max-w-md min-h-screen bg-[#f1f3f6] shadow-2xl flex flex-col relative pb-20">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-[#f1f3f6]/95 backdrop-blur-md px-5 pt-4 pb-3 border-b border-slate-200/60">
          <div className="flex items-center justify-between gap-2">
            
            {/* View Switcher: Expenses vs Net Worth */}
            <div className="flex bg-slate-200/90 p-1 rounded-2xl border border-slate-300/70 shadow-inner">
              <button
                onClick={() => setMainTab('expenses')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mainTab === 'expenses'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Receipt size={14} className={mainTab === 'expenses' ? 'text-indigo-600' : ''} />
                Expenses
              </button>
              <button
                onClick={() => setMainTab('networth')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mainTab === 'networth'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wallet size={14} className={mainTab === 'networth' ? 'text-indigo-600' : ''} />
                Net Worth
              </button>
            </div>

            {/* Quick Action Tools: Split & Settings */}
            <div className="flex items-center space-x-1.5" ref={settingsMenuRef}>
              <button
                onClick={() => setShowSplitModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 active:scale-95 transition-all"
              >
                <Calculator size={13} />
                Split
              </button>

              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                title="Settings"
              >
                <SlidersHorizontal size={14} />
              </button>

              {/* Settings Dropdown */}
              {showSettingsMenu && (
                <div className="absolute right-5 top-14 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setShowAddBankModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Building2 size={14} className="text-blue-600" /> + Add Bank / Wallet
                  </button>

                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <FileText size={14} className="text-emerald-600" /> View Reports & Export
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleFullResetData}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={13} className="text-red-500" /> Reset All Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-4 pt-3 space-y-4">

          {/* EXPENSES & LEDGER VIEW */}
          {mainTab === 'expenses' && (
            <div className="space-y-4">
              {/* Daily Warning Alert */}
              {todayExpenses >= 1000 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-700 text-xs font-semibold">
                  <AlertCircle size={18} className="shrink-0 text-red-600" />
                  <span>
                    Daily Limit Warning: You have spent <strong>{formatCurrency(todayExpenses)}</strong> today (₱1,000 threshold crossed).
                  </span>
                </div>
              ) : todayExpenses >= 800 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs font-semibold">
                  <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                  <span>
                    Daily Notice: You have spent <strong>{formatCurrency(todayExpenses)}</strong> today. Almost at ₱1,000 limit.
                  </span>
                </div>
              ) : null}

              {/* Log Expense Form (Positioned Upper) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingDown className="text-red-500" size={17} />
                  Log Expense
                </h3>

                <form onSubmit={handleAddExpense} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Groceries, Coffee"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Amount (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {INITIAL_EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {category === 'Other' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Custom Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Subscriptions"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-200 bg-amber-50/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Deduct From</label>
                    <select
                      value={expenseAccountId}
                      onChange={(e) => setExpenseAccountId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {activeAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.bankName}) - {formatCurrency(acc.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Plus size={15} /> Add Expense
                  </button>
                </form>
              </div>

              {/* Monthly Expense Distribution Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PieChartIcon size={18} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">Expense Distribution</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total ({currentMonthName})</span>
                    <span className="text-base font-extrabold text-red-600">{formatCurrency(totalMonthlyExpenses)}</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex my-3 border border-slate-200/50">
                  {totalMonthlyExpenses === 0 ? (
                    <div className="w-full h-full bg-slate-200" />
                  ) : (
                    categoryList.map((cat, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                        className="h-full transition-all duration-300"
                        title={`${cat.name}: ${cat.percentage.toFixed(1)}%`}
                      />
                    ))
                  )}
                </div>

                <div className="space-y-1.5 mt-3 max-h-40 overflow-y-auto no-scrollbar">
                  {categoryList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-2">No expenses logged for {currentMonthName}.</p>
                  ) : (
                    categoryList.map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100/80">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-xs font-semibold text-slate-700">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{formatCurrency(cat.amount)}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 min-w-[38px] text-center">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Transaction Ledger Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <h4 className="text-xs font-bold text-slate-800">Recent Transactions</h4>
                  </div>
                  <span className="text-[10px] text-slate-400">{transactions.length} entries</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                  {transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No records found.</p>
                  ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <div className="font-bold text-slate-800 line-clamp-1">{tx.description}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(tx.date).toLocaleDateString()} • {tx.category || tx.fromName || 'General'}
                          </div>
                        </div>
                        <div className={`font-extrabold ${tx.type === 'EXPENSE' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NET WORTH VIEW */}
          {mainTab === 'networth' && (
            <>
              {/* Total Net Worth Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-medium">Total Net Worth</span>
                  <button
                    onClick={() => setHideNetWorth(!hideNetWorth)}
                    className="p-1 hover:text-slate-600 transition-colors"
                    title={hideNetWorth ? 'Show Net Worth' : 'Hide Net Worth'}
                  >
                    {hideNetWorth ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className={`text-3xl font-extrabold text-slate-900 tracking-tight transition-all duration-200 ${hideNetWorth ? 'blur-md select-none' : ''}`}>
                  {formatCurrency(totalNetWorth)}
                </div>
              </div>

              {/* Category Pill Switcher Row */}
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCategoryFilter(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      activeCategoryFilter === tab
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200/80'
                    }`}
                  >
                    {tab} {tab === 'Closed' && accounts.some(a => a.isClosed) && `(${accounts.filter(a => a.isClosed).length})`}
                  </button>
                ))}
              </div>

              {/* 2-Column Accounts Grid */}
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic bg-white rounded-3xl border border-slate-100">
                  {activeCategoryFilter === 'Closed' ? 'No closed accounts.' : 'No accounts in this category.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {filteredAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccount(acc);
                        setIsClosingFlow(false);
                        setTransferTargetId(transferTargets[0]?.id || '');
                      }}
                      className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md cursor-pointer transition-all active:scale-[0.98] ${
                        acc.isClosed ? 'border-dashed border-slate-300 opacity-60' : 'border-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shadow-xs ${acc.iconColor || 'bg-slate-900 text-white'}`}>
                            {acc.bankName}
                          </div>
                          <span className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                            {acc.name}
                          </span>
                        </div>

                        <div className={`text-base font-extrabold text-slate-900 tracking-tight ${hideNetWorth ? 'blur-xs select-none' : ''}`}>
                          {formatCurrency(acc.balance)}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className={acc.isClosed ? 'text-red-500 font-bold' : ''}>
                          {acc.isClosed ? 'Closed' : acc.category}
                        </span>
                        <ChevronRight size={12} className="text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Split Bill Calculator Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Calculator size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">Split Expense</h4>
                  <span className="text-[10px] text-slate-400">Divide a bill among people</span>
                </div>
              </div>
              <button onClick={() => setShowSplitModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Total Bill Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={splitBillAmount}
                  onChange={(e) => setSplitBillAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">People</label>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 px-2 py-1.5">
                    <Users size={14} className="text-slate-400 mr-1.5 shrink-0" />
                    <input
                      type="number"
                      min="1"
                      value={splitPeopleCount}
                      onChange={(e) => setSplitPeopleCount(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tip / Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={splitTipPercent}
                    onChange={(e) => setSplitTipPercent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Per Person Calculated Share Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center mt-2">
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Each Person Pays</span>
                <span className="text-xl font-extrabold text-emerald-800">{formatCurrency(perPersonShare)}</span>
                {tipAmount > 0 && (
                  <span className="text-[9px] text-emerald-600 block mt-0.5">
                    Includes {formatCurrency(tipAmount)} tip ({formatCurrency(totalWithTip)} total)
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="w-1/2 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleApplySplitToExpense}
                  disabled={perPersonShare <= 0}
                  className="w-1/2 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Log My Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Balance Action Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${selectedAccount.iconColor}`}>
                  {selectedAccount.bankName}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">{selectedAccount.name}</h4>
                  <span className="text-[10px] text-slate-400">{selectedAccount.category}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAccount(null);
                  setIsClosingFlow(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center mb-3">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Current Balance</span>
              <span className="text-lg font-extrabold text-slate-900">{formatCurrency(selectedAccount.balance)}</span>
              {selectedAccount.isClosed && (
                <span className="inline-block px-2 py-0.5 mt-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                  Account is Closed
                </span>
              )}
            </div>

            {selectedAccount.isClosed ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-500 text-center">This account is currently closed and hidden from your active Net Worth.</p>
                <button
                  type="button"
                  onClick={() => handleReopenAccount(selectedAccount.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RotateCcw size={14} /> Reopen Account
                </button>
              </div>
            ) : !isClosingFlow ? (
              <div>
                <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setTransferType('deposit')}
                    className={`w-1/2 py-1 text-xs font-bold rounded-lg transition-all ${
                      transferType === 'deposit' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    + Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType('withdraw')}
                    className={`w-1/2 py-1 text-xs font-bold rounded-lg transition-all ${
                      transferType === 'withdraw' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    - Withdraw
                  </button>
                </div>

                <form onSubmit={handleAccountBalanceUpdate} className="space-y-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="₱ Amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
                  <button
                    type="submit"
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-95 ${
                      transferType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Confirm {transferType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setIsClosingFlow(true)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Archive size={13} /> Close This Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-800">
                  <span className="font-bold block mb-0.5 flex items-center gap-1">
                    <AlertTriangle size={13} className="text-red-600 shrink-0" /> Close Account Confirmation
                  </span>
                  {selectedAccount.balance > 0 ? (
                    <span>This account has an active balance of <strong>{formatCurrency(selectedAccount.balance)}</strong>. Choose what to do with the funds:</span>
                  ) : (
                    <span>Are you sure you want to close this account? It will be moved to the Closed tab.</span>
                  )}
                </div>

                {selectedAccount.balance > 0 && (
                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="closeAction"
                        checked={closeAction === 'transfer'}
                        onChange={() => setCloseAction('transfer')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 block">Transfer Balance</span>
                        <span className="text-[10px] text-slate-500 block mb-1.5">Move all funds to another active account</span>
                        
                        {closeAction === 'transfer' && (
                          <select
                            value={transferTargetId}
                            onChange={(e) => setTransferTargetId(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                          >
                            {transferTargets.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.bankName})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="closeAction"
                        checked={closeAction === 'remove'}
                        onChange={() => setCloseAction('remove')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Liquidate / Remove Balance</span>
                        <span className="text-[10px] text-slate-500">Close account and write off the remaining balance</span>
                      </div>
                    </label>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsClosingFlow(false)}
                    className="w-1/2 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseAccount}
                    className="w-1/2 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Confirm Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Bank / Wallet Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-800">Add Bank / Asset</h4>
              <button onClick={() => setShowAddBankModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Bank Tag (e.g. BDO, Maya, MP2)</label>
                <input
                  type="text"
                  placeholder="e.g. GCash"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Account Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund, Gold"
                  value={newBankTag}
                  onChange={(e) => setNewBankTag(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Category Filter</label>
                <select
                  value={newBankCategory}
                  onChange={(e) => setNewBankCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Wallet">Wallet</option>
                  <option value="Savings">Savings</option>
                  <option value="MP2 Savings">MP2 Savings</option>
                  <option value="Credit">Credit</option>
                  <option value="Loans">Loans</option>
                  <option value="Asset">Asset</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Initial Balance (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newBankInitialBalance}
                  onChange={(e) => setNewBankInitialBalance(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Financial Summary & Export Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText size={17} className="text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-800">Financial Summary</h4>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 my-3 overflow-x-auto no-scrollbar">
                {[
                  { label: 'Today', value: 'TODAY' },
                  { label: 'Week', value: 'WEEK' },
                  { label: 'Month', value: 'MONTH' },
                  { label: 'All', value: 'ALL' },
                  { label: 'Custom', value: 'CUSTOM' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setReportRange(item.value)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-bold border ${
                      reportRange === item.value ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {reportRange === 'CUSTOM' && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl mb-3 text-[10px]">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="border border-slate-200 rounded p-1"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="border border-slate-200 rounded p-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 my-2">
                <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[9px] font-bold uppercase text-emerald-700 block">Total Inflow</span>
                  <span className="text-sm font-extrabold text-emerald-800">{formatCurrency(reportInflow)}</span>
                </div>
                <div className="p-2.5 bg-red-50 rounded-2xl border border-red-100">
                  <span className="text-[9px] font-bold uppercase text-red-700 block">Total Outflow</span>
                  <span className="text-sm font-extrabold text-red-800">{formatCurrency(reportOutflow)}</span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden mt-3 max-h-40 overflow-y-auto no-scrollbar">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportList.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-3 text-center text-slate-400 italic">No entries for this period.</td>
                      </tr>
                    ) : (
                      reportList.map((tx) => (
                        <tr key={tx.id}>
                          <td className="p-2 text-slate-400">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="p-2 font-medium text-slate-700 truncate max-w-[110px]">{tx.description}</td>
                          <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(tx.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 mt-3">
              <button
                onClick={() => window.print()}
                className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <Printer size={13} /> Print
              </button>
              <button
                onClick={handleDownloadCSV}
                className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <Download size={13} /> CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}