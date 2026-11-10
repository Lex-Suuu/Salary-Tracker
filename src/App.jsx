import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  TrendingDown,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  FileText,
  X,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Archive,
  RotateCcw,
  Receipt,
  ShoppingCart,
  Fuel,
  Home,
  Utensils,
  Zap,
  Film,
  HeartPulse,
  Sparkles,
  CreditCard,
  Layers,
  Building2,
  Trash2,
  Printer,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

const INITIAL_EXPENSE_CATEGORIES = [
  'Grocery & Essentials',
  'Fuel / Gas',
  'Housing',
  'Food & Dining',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Personal Care',
  'Debt/Loans',
  'Other'
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
  const [expenseSubView, setExpenseSubView] = useState('list');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const [showExpenseModal, setShowExpenseModal] = useState(false);

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

  // Account Card Action Modal (Deposit / Withdraw / Close)
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferType, setTransferType] = useState('deposit');
  const [isClosingFlow, setIsClosingFlow] = useState(false);
  const [closeAction, setCloseAction] = useState('transfer');
  const [transferTargetId, setTransferTargetId] = useState('');

  // Settings & Reports State
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportRange, setReportRange] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Add Bank Modal State
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankTag, setNewBankTag] = useState('');
  const [newBankCategory, setNewBankCategory] = useState('Savings');
  const [newBankInitialBalance, setNewBankInitialBalance] = useState('');

  // Helper: Detect whether an account is locked from being spent directly
  const isSpendingAccount = (acc) => {
    if (acc.isClosed) return false;
    const cat = (acc.category || '').toLowerCase();
    const name = (acc.name || '').toLowerCase();

    // Prevent direct spending from Savings, MP2, Assets, Retirement, or Emergency Funds
    if (
      cat.includes('saving') ||
      cat.includes('asset') ||
      cat.includes('mp2') ||
      name.includes('emergency') ||
      name.includes('retirement') ||
      name.includes('saving')
    ) {
      return false;
    }
    return true;
  };

  // Only active spending accounts can be used for payments
  const payableAccounts = accounts.filter(isSpendingAccount);

  // Expense form state
  const [desc, setDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [category, setCategory] = useState(INITIAL_EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState(() => payableAccounts[0]?.id || '');

  // Keep expenseAccountId synced to a valid payment account
  useEffect(() => {
    if (!payableAccounts.some((a) => a.id === expenseAccountId)) {
      setExpenseAccountId(payableAccounts[0]?.id || '');
    }
  }, [payableAccounts, expenseAccountId]);

  const settingsMenuRef = useRef(null);

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

  const getCategoryIcon = (cat = '') => {
    const name = cat.toLowerCase();
    if (name.includes('grocery') || name.includes('essential')) return <ShoppingCart size={17} className="text-slate-600" />;
    if (name.includes('fuel') || name.includes('gas')) return <Fuel size={17} className="text-slate-600" />;
    if (name.includes('food') || name.includes('dining')) return <Utensils size={17} className="text-slate-600" />;
    if (name.includes('housing') || name.includes('rent')) return <Home size={17} className="text-slate-600" />;
    if (name.includes('utilit')) return <Zap size={17} className="text-slate-600" />;
    if (name.includes('entertain')) return <Film size={17} className="text-slate-600" />;
    if (name.includes('health')) return <HeartPulse size={17} className="text-slate-600" />;
    if (name.includes('personal')) return <Sparkles size={17} className="text-slate-600" />;
    if (name.includes('debt') || name.includes('loan')) return <CreditCard size={17} className="text-slate-600" />;
    return <Layers size={17} className="text-slate-600" />;
  };

  // Log Expense Submission
  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    const sourceAccount = accounts.find((a) => a.id === expenseAccountId);

    if (!sourceAccount) {
      showToast('Please select a valid daily spending account (Savings/Emergency funds cannot be used)', 'error');
      return;
    }
    if (!isSpendingAccount(sourceAccount)) {
      showToast('Savings, Emergency Funds, and Retirement accounts cannot be used for payment', 'error');
      return;
    }
    if (!desc.trim()) {
      showToast('Please enter an expense description', 'error');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid expense amount', 'error');
      return;
    }
    if (amt > sourceAccount.balance) {
      showToast(`Insufficient funds in ${sourceAccount.name}`, 'error');
      return;
    }

    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;

    setAccounts(accounts.map((a) => (a.id === sourceAccount.id ? { ...a, balance: a.balance - amt } : a)));

    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'EXPENSE',
      description: desc.trim(),
      amount: amt,
      category: finalCategory,
      fromId: expenseAccountId,
      fromName: sourceAccount.name
    };

    const nextTodayExpenses = todayExpenses + amt;
    setTransactions([newTx, ...transactions]);
    setDesc('');
    setExpenseAmount('');
    setCustomCategory('');
    setShowExpenseModal(false);

    if (nextTodayExpenses >= 1000 && todayExpenses < 1000) {
      showToast(`Daily Warning: Today's expenses reached ₱${nextTodayExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} (₱1,000+ limit crossed)!`, 'warning');
    } else {
      showToast(`Logged: ₱${amt.toLocaleString()} (${finalCategory})`);
    }
  };

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

  // Calendar Helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const selectedDateExpenses = expenseTransactions.filter((tx) => {
    if (!tx?.date) return false;
    const d = new Date(tx.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateStr === selectedCalendarDate;
  });

  const selectedDateTotal = selectedDateExpenses.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

  const filteredAccounts = accounts.filter((acc) => {
    if (activeCategoryFilter === 'Closed') return !!acc.isClosed;
    if (acc.isClosed) return false;
    if (activeCategoryFilter === 'All') return true;
    return (acc.category || '').toLowerCase() === activeCategoryFilter.toLowerCase();
  });

  const transferTargets = accounts.filter((a) => !a.isClosed && a.id !== selectedAccount?.id);

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center text-slate-800 font-sans selection:bg-indigo-500 selection:text-white relative">
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
      <div className="w-full max-w-md min-h-screen bg-[#f1f3f6] shadow-2xl flex flex-col relative pb-24">
        
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

            {/* Settings Dropdown Toggle */}
            <div className="relative" ref={settingsMenuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                title="Settings"
              >
                <SlidersHorizontal size={14} />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 top-11 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
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

          {/* ===================== EXPENSES VIEW ===================== */}
          {mainTab === 'expenses' && (
            <div className="space-y-4">
              
              {/* Total Spent This Month Card with List / Calendar Toggle */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block mb-0.5">Total Spent This Month</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(totalMonthlyExpenses)}
                  </div>
                </div>

                {/* List vs Calendar Toggle Switch */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                  <button
                    onClick={() => setExpenseSubView('list')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      expenseSubView === 'list'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>☰</span> List
                  </button>
                  <button
                    onClick={() => setExpenseSubView('calendar')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      expenseSubView === 'calendar'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <CalendarIcon size={12} /> Calendar
                  </button>
                </div>
              </div>

              {/* LIST VIEW */}
              {expenseSubView === 'list' && (
                <div className="space-y-2.5">
                  {currentMonthExpensesList.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs italic">
                      No expenses logged for this month yet. Tap the purple receipt button below to add one.
                    </div>
                  ) : (
                    currentMonthExpensesList.map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {getCategoryIcon(tx.category || tx.description)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-snug">
                              {tx.description || tx.category || 'Expense'}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                              <span className="text-blue-600 font-semibold">{tx.fromName || 'Wallet'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-black text-red-500 tracking-tight">
                          -{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* CALENDAR VIEW */}
              {expenseSubView === 'calendar' && (
                <div className="space-y-3">
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={prevMonth}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <h3 className="text-xs font-bold text-slate-800 tracking-tight">{monthName}</h3>
                      <button
                        onClick={nextMonth}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
                      <span>S</span>
                      <span>M</span>
                      <span>T</span>
                      <span>W</span>
                      <span>T</span>
                      <span>F</span>
                      <span>S</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isSelected = selectedCalendarDate === dateString;

                        const hasExpense = expenseTransactions.some((tx) => {
                          if (!tx?.date) return false;
                          const d = new Date(tx.date);
                          return (
                            d.getFullYear() === year &&
                            d.getMonth() === month &&
                            d.getDate() === dayNum
                          );
                        });

                        return (
                          <button
                            key={dayNum}
                            onClick={() => setSelectedCalendarDate(dateString)}
                            className={`h-8 rounded-full flex flex-col items-center justify-center font-bold text-xs relative transition-all ${
                              isSelected
                                ? 'bg-red-500 text-white shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{dayNum}</span>
                            {!isSelected && hasExpense && (
                              <span className="w-1 h-1 rounded-full bg-red-500 absolute bottom-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Date: {selectedCalendarDate}</span>
                      <span className="text-xs font-black text-red-500">{formatCurrency(selectedDateTotal)}</span>
                    </div>

                    {selectedDateExpenses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-2">No expenses recorded for this date.</p>
                    ) : (
                      selectedDateExpenses.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-xs py-1">
                          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {tx.description || tx.category}
                          </span>
                          <span className="font-bold text-red-500">-{formatCurrency(tx.amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== NET WORTH VIEW ===================== */}
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

        {/* Floating Action Button (FAB) to Log Expense */}
        <button
          onClick={() => setShowExpenseModal(true)}
          className="fixed bottom-6 right-6 md:right-[calc(50%-180px)] z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all"
          title="Log Expense"
        >
          <Receipt size={22} />
        </button>
      </div>

      {/* Log Expense Modal (Restricted: Savings/Emergency/Retirement accounts are excluded from Pay From) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 text-red-600 rounded-xl">
                  <TrendingDown size={18} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 leading-tight">Log Expense</h4>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Grocery & Essentials"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {INITIAL_EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Custom Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Subscriptions"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-200 bg-amber-50/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Pay From: ONLY shows active spending wallets / cards */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Pay From</label>
                {payableAccounts.length === 0 ? (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700">
                    No active daily spending accounts found. Savings and retirement funds cannot be used.
                  </div>
                ) : (
                  <select
                    value={expenseAccountId}
                    onChange={(e) => setExpenseAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {payableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.bankName}) - {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[9px] text-slate-400 block mt-1">
                  * Savings, MP2, Retirement & Emergency funds are protected and excluded from payments.
                </span>
              </div>

              <button
                type="submit"
                disabled={payableAccounts.length === 0}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Plus size={15} /> Add Expense
              </button>
            </form>
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
                  placeholder="e.g. Daily Expenses, Fuel"
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
                  <option value="Wallet">Wallet (Spendable)</option>
                  <option value="Credit">Credit (Spendable)</option>
                  <option value="Savings">Savings (Protected)</option>
                  <option value="MP2 Savings">MP2 Savings (Protected)</option>
                  <option value="Asset">Asset (Protected)</option>
                  <option value="Loans">Loans</option>
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
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 mt-3">
              <button
                onClick={() => window.print()}
                className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <Printer size={13} /> Print
              </button>
              <button
                onClick={() => {
                  const headers = ['Date', 'Type', 'Description', 'Category', 'Account', 'Amount'];
                  const rows = transactions.map((tx) => [
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
                  link.setAttribute('download', `financial_report.csv`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
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