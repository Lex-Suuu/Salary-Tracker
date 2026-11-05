import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  TrendingDown,
  Trash2,
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
  Building2
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

export default function App() {
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('salary_tracker_accounts');
      return saved ? JSON.parse(saved) : [
        { id: 'acc1', name: 'RCBC', tag: 'Payroll', badge: 'Main', color: 'blue' },
        { id: 'acc2', name: 'MariBank', tag: 'Expenses', badge: 'Daily', color: 'amber' },
        { id: 'acc3', name: 'GoTyme', tag: 'Savings', badge: 'Savings', color: 'emerald' }
      ];
    } catch {
      return [
        { id: 'acc1', name: 'RCBC', tag: 'Payroll', badge: 'Main', color: 'blue' },
        { id: 'acc2', name: 'MariBank', tag: 'Expenses', badge: 'Daily', color: 'amber' },
        { id: 'acc3', name: 'GoTyme', tag: 'Savings', badge: 'Savings', color: 'emerald' }
      ];
    }
  });

  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editNameInput, setEditNameInput] = useState('');

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('salary_tracker_ledger');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Individual card eye hide/show state
  const [hiddenAccounts, setHiddenAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('salary_tracker_hidden_accounts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Independent Total balance hide/show state
  const [hideTotalBalance, setHideTotalBalance] = useState(() => {
    return localStorage.getItem('salary_tracker_hide_total') === 'true';
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const settingsMenuRef = useRef(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Add Bank Modal State
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankTag, setNewBankTag] = useState('');
  const [newBankBadge, setNewBankBadge] = useState('');
  const [newBankColor, setNewBankColor] = useState('blue');

  // Ledger Filter & Report Modal State
  const [ledgerView, setLedgerView] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'TRANSFER' | 'SAVINGS'
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportRange, setReportRange] = useState('ALL'); // 'ALL' | 'MONTH' | 'WEEK' | 'TODAY' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Per-card action states
  const [cardModes, setCardModes] = useState({
    acc1: 'deposit',
    acc2: 'transfer',
    acc3: 'transfer'
  });
  const [cardAmounts, setCardAmounts] = useState({});

  // Expense form state
  const [desc, setDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [category, setCategory] = useState(INITIAL_EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState(() => accounts[1]?.id || accounts[0]?.id || 'acc1');

  // Persistence
  useEffect(() => {
    localStorage.setItem('salary_tracker_ledger', JSON.stringify(transactions));
    localStorage.setItem('salary_tracker_accounts', JSON.stringify(accounts));
    localStorage.setItem('salary_tracker_hidden_accounts', JSON.stringify(hiddenAccounts));
    localStorage.setItem('salary_tracker_hide_total', hideTotalBalance);
  }, [transactions, accounts, hiddenAccounts, hideTotalBalance]);

  // Click outside to close settings menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
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

  const toggleAccountVisibility = (accId) => {
    setHiddenAccounts((prev) => ({
      ...prev,
      [accId]: !prev[accId]
    }));
  };

  // Live Balances
  const balances = (accounts || []).reduce((acc, curr) => {
    acc[curr.id] = 0;
    return acc;
  }, {});

  (transactions || []).forEach((tx) => {
    const amt = parseFloat(tx.amount) || 0;
    if (tx.type === 'INCOME') {
      if (balances[tx.toId] !== undefined) balances[tx.toId] += amt;
    } else if (tx.type === 'TRANSFER') {
      if (balances[tx.fromId] !== undefined) balances[tx.fromId] -= amt;
      if (balances[tx.toId] !== undefined) balances[tx.toId] += amt;
    } else if (tx.type === 'EXPENSE') {
      if (balances[tx.fromId] !== undefined) balances[tx.fromId] -= amt;
    }
  });

  // Calculate Total Net Worth across all accounts
  const totalBalance = Object.values(balances).reduce((sum, val) => sum + val, 0);

  const handleStartEdit = (acc) => {
    setEditingAccountId(acc.id);
    setEditNameInput(acc.name);
  };

  const handleSaveEdit = (accId) => {
    if (!editNameInput.trim()) {
      showToast('Account name cannot be empty', 'error');
      return;
    }
    setAccounts(accounts.map((a) => (a.id === accId ? { ...a, name: editNameInput.trim() } : a)));
    setEditingAccountId(null);
    showToast('Account name updated');
  };

  const handleAddBankSubmit = (e) => {
    e.preventDefault();
    if (!newBankName.trim()) {
      showToast('Bank name is required', 'error');
      return;
    }
    const newAcc = {
      id: 'acc_' + Date.now().toString(),
      name: newBankName.trim(),
      tag: newBankTag.trim() || 'General',
      badge: newBankBadge.trim() || 'Bank',
      color: newBankColor
    };

    setAccounts([...accounts, newAcc]);
    setCardModes((prev) => ({ ...prev, [newAcc.id]: 'transfer' }));
    setNewBankName('');
    setNewBankTag('');
    setNewBankBadge('');
    setShowAddBankModal(false);
    showToast(`Added ${newAcc.name} to your accounts`);
  };

  const handleCardSubmit = (e, accId) => {
    e.preventDefault();
    const amt = parseFloat(cardAmounts[accId]);
    const targetAccount = accounts.find((a) => a.id === accId);
    const mainAccount = accounts[0];

    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    const mode = cardModes[accId] || (accId === accounts[0]?.id ? 'deposit' : 'transfer');

    if (mode === 'deposit' || accId === accounts[0]?.id) {
      const isMain = accId === accounts[0]?.id;
      const newTx = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'INCOME',
        description: isMain ? `Deposit (${targetAccount?.name || 'Account'})` : `Extra Money (${targetAccount?.name || 'Account'})`,
        amount: amt,
        toId: targetAccount?.id || accId,
        toName: targetAccount?.name || 'Account'
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Added ₱${amt.toLocaleString()} to ${targetAccount?.name}`);
    } else {
      if (amt > (balances[mainAccount?.id] || 0)) {
        showToast(`Insufficient funds in ${mainAccount?.name || 'Main Account'}`, 'error');
        return;
      }
      const newTx = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'TRANSFER',
        description: `Transfer: ${mainAccount?.name} to ${targetAccount?.name}`,
        amount: amt,
        fromId: mainAccount?.id,
        fromName: mainAccount?.name,
        toId: targetAccount?.id || accId,
        toName: targetAccount?.name || 'Account'
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Transferred ₱${amt.toLocaleString()} to ${targetAccount?.name}`);
    }

    setCardAmounts({ ...cardAmounts, [accId]: '' });
  };

  // Calculations for Lifetime and Today's Expenses
  const expenseTransactions = (transactions || []).filter((tx) => tx?.type === 'EXPENSE');
  const totalExpenses = expenseTransactions.reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);

  // Daily Expense Calculation (Resets every day)
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todayExpenses = expenseTransactions
    .filter((tx) => isToday(tx.date))
    .reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);

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

    const available = balances[expenseAccountId] || 0;
    if (amt > available) {
      showToast(`Insufficient funds in ${sourceAccount?.name || 'account'}`, 'error');
      return;
    }

    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;

    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'EXPENSE',
      description: desc.trim(),
      amount: amt,
      category: finalCategory,
      fromId: expenseAccountId,
      fromName: sourceAccount?.name || 'Unknown'
    };

    const nextTodayExpenses = todayExpenses + amt;
    setTransactions([newTx, ...transactions]);
    setDesc('');
    setExpenseAmount('');
    setCustomCategory('');

    // Daily warning trigger
    if (nextTodayExpenses >= 1000 && todayExpenses < 1000) {
      showToast(`Daily Warning: Today's expenses reached ₱${nextTodayExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} (₱1,000+ daily limit crossed)!`, 'warning');
    } else if (nextTodayExpenses >= 800 && nextTodayExpenses < 1000) {
      showToast(`Daily Notice: You've spent ₱${nextTodayExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} today — almost ₱1,000!`, 'warning');
    } else {
      showToast(`Logged expense: ₱${amt.toLocaleString()} (${finalCategory})`);
    }
  };

  const handleDeleteTx = (id) => {
    setTransactions(transactions.filter((tx) => tx.id !== id));
    showToast('Transaction removed');
  };

  const handleClearAll = () => {
    setShowSettingsMenu(false);
    if (window.confirm('Are you sure you want to completely clear all transactions and reset balances?')) {
      setTransactions([]);
      localStorage.removeItem('salary_tracker_ledger');
      showToast('All transaction records cleared');
    }
  };

  const categoryTotals = expenseTransactions.reduce((acc, tx) => {
    const cat = tx?.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (parseFloat(tx.amount) || 0);
    return acc;
  }, {});

  const categoryList = Object.keys(categoryTotals).map((name, index) => {
    const amount = categoryTotals[name];
    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
    return {
      name,
      amount,
      percentage,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    };
  });

  // Filter for Ledger View
  const filteredTransactions = (transactions || []).filter((tx) => {
    if (!tx) return false;
    if (ledgerView === 'EXPENSE') return tx.type === 'EXPENSE';
    if (ledgerView === 'TRANSFER') return tx.type === 'TRANSFER';
    if (ledgerView === 'SAVINGS') {
      const savingsAcc = accounts.find((a) => (a.tag || '').toLowerCase().includes('saving') || (a.badge || '').toLowerCase().includes('saving')) || accounts[2];
      const descText = (tx.description || '').toLowerCase();
      const catText = (tx.category || '').toLowerCase();
      return (
        (savingsAcc && tx.toId === savingsAcc.id) ||
        descText.includes('savings') ||
        catText.includes('savings')
      );
    }
    return true; // 'ALL'
  });

  // Report Date Filter (Today, This Week, This Month, All Time, Custom Range)
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
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      if (reportRange === 'CUSTOM') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date('1970-01-01');
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date('2099-12-31');
        return txDate >= start && txDate <= end;
      }
      return true; // 'ALL'
    });
  };

  const reportList = getReportTransactions();
  const reportInflow = reportList
    .filter((tx) => tx?.type === 'INCOME')
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  const reportOutflow = reportList
    .filter((tx) => tx?.type === 'EXPENSE')
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  const reportSavings = reportList
    .filter((tx) => {
      const savingsAcc = accounts.find((a) => (a.tag || '').toLowerCase().includes('saving') || (a.badge || '').toLowerCase().includes('saving')) || accounts[2];
      const descText = (tx?.description || '').toLowerCase();
      return (savingsAcc && tx?.toId === savingsAcc.id) || descText.includes('savings');
    })
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'From', 'To', 'Amount'];
    const rows = reportList.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.type || '',
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${tx.category || ''}"`,
      `"${tx.fromName || ''}"`,
      `"${tx.toName || ''}"`,
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

  const formatCurrency = (val, isHidden = false) => {
    if (isHidden) {
      return '₱••••••';
    }
    return '₱' + (parseFloat(val) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const colorStyles = {
    blue: {
      text: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      btn: 'bg-blue-600 hover:bg-blue-700',
      ring: 'focus:ring-blue-500'
    },
    amber: {
      text: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      btn: 'bg-amber-600 hover:bg-amber-700',
      ring: 'focus:ring-amber-500'
    },
    emerald: {
      text: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
      ring: 'focus:ring-emerald-500'
    },
    purple: {
      text: 'text-purple-600',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      btn: 'bg-purple-600 hover:bg-purple-700',
      ring: 'focus:ring-purple-500'
    },
    rose: {
      text: 'text-rose-600',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      btn: 'bg-rose-600 hover:bg-rose-700',
      ring: 'focus:ring-rose-500'
    },
    cyan: {
      text: 'text-cyan-600',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      btn: 'bg-cyan-600 hover:bg-cyan-700',
      ring: 'focus:ring-cyan-500'
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Toast Alert */}
      {notification.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 ${
            notification.type === 'error'
              ? 'bg-red-600'
              : notification.type === 'warning'
              ? 'bg-amber-600'
              : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle size={20} />
          ) : notification.type === 'warning' ? (
            <AlertTriangle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Salary & Budget Tracker</h1>
              <p className="text-xs text-slate-500">Track multi-account balances & breakdown</p>
            </div>
          </div>

          {/* Action Bar: Total Balance Badge, Generate Report, and Settings Gear Icon */}
          <div className="flex items-center gap-2.5 relative">
            {/* Total Balance Pill with its own Eye toggle */}
            <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200/90 px-3 py-1.5 rounded-lg shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total:</span>
              <span className="text-sm font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(totalBalance, hideTotalBalance)}
              </span>
              <button
                type="button"
                onClick={() => setHideTotalBalance(!hideTotalBalance)}
                className={`p-0.5 ml-0.5 rounded transition-colors ${
                  hideTotalBalance
                    ? 'text-slate-800 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={hideTotalBalance ? 'Show Total Balance' : 'Hide Total Balance'}
              >
                {hideTotalBalance ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors border border-blue-200 shadow-sm"
            >
              <FileText size={16} /> Generate Report
            </button>

            {/* Settings Gear Dropdown Toggle */}
            <div className="relative" ref={settingsMenuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`p-2 rounded-lg border transition-all ${
                  showSettingsMenu
                    ? 'bg-slate-200 border-slate-300 text-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-sm'
                }`}
                title="Settings"
              >
                <Settings size={18} />
              </button>

              {/* Settings Dropdown Menu */}
              {showSettingsMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account & Storage</span>
                  </div>

                  {/* Add New Bank Button */}
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setShowAddBankModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Building2 size={15} className="text-blue-600" /> + Add New Bank
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleClearAll}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} className="text-red-500" /> Clear All Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Account Cards with Individual Eye Toggles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((acc, index) => {
            const styles = colorStyles[acc.color] || colorStyles.blue;
            const isEditing = editingAccountId === acc.id;
            const isMainAccount = index === 0;
            const currentMode = cardModes[acc.id] || (isMainAccount ? 'deposit' : 'transfer');
            const isCardHidden = !!hiddenAccounts[acc.id];

            return (
              <div key={acc.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          className="text-xs font-semibold uppercase border border-slate-300 rounded px-1.5 py-0.5"
                          placeholder="Bank name"
                        />
                        <button onClick={() => handleSaveEdit(acc.id)} className="text-emerald-600 hover:text-emerald-700 p-0.5">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingAccountId(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                          {acc.name} ({acc.tag})
                        </span>
                        <button
                          onClick={() => handleStartEdit(acc)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Rename account"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      {/* Individual Eye Toggle Button */}
                      <button
                        onClick={() => toggleAccountVisibility(acc.id)}
                        className={`p-1 rounded-md transition-colors ${
                          isCardHidden
                            ? 'bg-slate-200 text-slate-800'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isCardHidden ? `Show ${acc.name} balance` : `Hide ${acc.name} balance`}
                      >
                        {isCardHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>

                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles.badge}`}>
                        {acc.badge}
                      </span>
                    </div>
                  </div>

                  {/* Individual Account Balance with Eye Mask */}
                  <div className={`text-3xl font-extrabold ${styles.text} mb-4 tracking-tight`}>
                    {formatCurrency(balances[acc.id] || 0, isCardHidden)}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  {isMainAccount ? (
                    <label className="text-xs font-semibold text-slate-600 block">Deposit Salary</label>
                  ) : (
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setCardModes({ ...cardModes, [acc.id]: 'transfer' })}
                        className={`transition-colors ${
                          currentMode === 'transfer' ? 'text-slate-900 underline font-bold' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Transfer from {accounts[0]?.name || 'Main'}
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setCardModes({ ...cardModes, [acc.id]: 'deposit' })}
                        className={`transition-colors ${
                          currentMode === 'deposit' ? 'text-slate-900 underline font-bold' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        + Extra Money
                      </button>
                    </div>
                  )}

                  <form onSubmit={(e) => handleCardSubmit(e, acc.id)} className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="₱ Amount"
                      value={cardAmounts[acc.id] || ''}
                      onChange={(e) => setCardAmounts({ ...cardAmounts, [acc.id]: e.target.value })}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${styles.ring}`}
                    />
                    <button
                      type="submit"
                      className={`px-4 py-2 ${styles.btn} text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-1 whitespace-nowrap`}
                    >
                      {currentMode === 'deposit' ? <><Plus size={16} /> Deposit</> : 'Transfer'}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </section>

        {/* Expense Entry & Segmented Progress Bar */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingDown className="text-red-500" size={20} />
              Log Expense
            </h2>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Groceries"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {INITIAL_EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Specify Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Subscriptions, Pet Supplies"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 bg-amber-50/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Pay From</label>
                <select
                  value={expenseAccountId}
                  onChange={(e) => setExpenseAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(balances[acc.id] || 0, !!hiddenAccounts[acc.id])})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> Add Expense
              </button>
            </form>
          </div>

          {/* Line Distribution Breakdown & Daily Spending Threshold Warning */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              {/* Dynamic Daily Spending Warning Banner (Resets Every Day) */}
              {todayExpenses >= 1000 ? (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-semibold">
                  <AlertCircle size={18} className="shrink-0 text-red-600" />
                  <span>
                    Daily Warning: You have spent <strong>{formatCurrency(todayExpenses)}</strong> today, exceeding your ₱1,000 daily limit!
                  </span>
                </div>
              ) : todayExpenses >= 800 ? (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-800 text-xs font-semibold">
                  <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                  <span>
                    Daily Heads Up: You have spent <strong>{formatCurrency(todayExpenses)}</strong> today. You are almost at your ₱1,000 daily limit.
                  </span>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <PieChartIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Expense Distribution</h2>
                    <p className="text-xs text-slate-500">
                      Breakdown across all categories • Today: {formatCurrency(todayExpenses)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Total Expenses</span>
                  <span className={`text-xl font-extrabold ${todayExpenses >= 1000 ? 'text-red-700' : 'text-red-600'}`}>
                    {formatCurrency(totalExpenses, false)}
                  </span>
                </div>
              </div>

              {/* Progress Line */}
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex my-4 border border-slate-200/60">
                {totalExpenses === 0 ? (
                  <div className="w-full h-full bg-slate-200" />
                ) : (
                  categoryList.map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color
                      }}
                      className="h-full transition-all duration-300"
                      title={`${cat.name}: ${cat.percentage.toFixed(1)}%`}
                    />
                  ))
                )}
              </div>

              {/* Category Rows with Badges */}
              <div className="space-y-2 mt-4 max-h-56 overflow-y-auto pr-1">
                {categoryList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No expenses recorded yet.</p>
                ) : (
                  categoryList.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-semibold text-slate-700">{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{formatCurrency(cat.amount, false)}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 min-w-[45px] text-center">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-slate-100 mt-4">
              <span>{accounts.length} linked accounts</span>
              <span>{categoryList.length} active categories</span>
            </div>
          </div>
        </section>

        {/* Transaction Ledger Table (Always Unhidden) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-slate-500" size={20} />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Transaction Ledger</h2>
                <p className="text-xs text-slate-500">Complete record of inflows, outflows, and transfers</p>
              </div>
            </div>

            {/* View Switcher Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Expenses', value: 'EXPENSE' },
                { label: 'Transfers', value: 'TRANSFER' },
                { label: 'Savings', value: 'SAVINGS' }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setLedgerView(item.value)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    ledgerView === item.value
                      ? 'bg-white text-blue-600 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <p className="text-sm">No transactions found for this view.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Category / Route</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const isExpense = tx.type === 'EXPENSE';
                    const isIncome = tx.type === 'INCOME';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700'
                                : isExpense
                                ? 'bg-red-50 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{tx.description}</td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          {isExpense ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium text-slate-700">{tx.category || 'Other'}</span>
                              <span className="text-slate-400 font-normal">({tx.fromName})</span>
                            </span>
                          ) : tx.type === 'TRANSFER' ? (
                            `${tx.fromName} ➔ ${tx.toName}`
                          ) : (
                            `Direct to ${tx.toName}`
                          )}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold tracking-tight ${
                            isIncome ? 'text-emerald-600' : isExpense ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(tx.amount, false)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteTx(tx.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Add New Bank Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Add New Bank / Wallet</h3>
                  <p className="text-xs text-slate-500">Create a new account card for tracking</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddBankModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBankSubmit} className="space-y-4 my-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. BDO, Maya, GCash"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Purpose / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Bills, Emergency, Side Income"
                  value={newBankTag}
                  onChange={(e) => setNewBankTag(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Badge Label</label>
                <input
                  type="text"
                  placeholder="e.g. Daily, Savings, Reserve"
                  value={newBankBadge}
                  onChange={(e) => setNewBankBadge(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Color Theme</label>
                <select
                  value={newBankColor}
                  onChange={(e) => setNewBankColor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blue">Blue</option>
                  <option value="amber">Amber / Gold</option>
                  <option value="emerald">Emerald / Green</option>
                  <option value="purple">Purple</option>
                  <option value="rose">Rose / Pink</option>
                  <option value="cyan">Cyan</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="w-1/2 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Financial Summary Report</h3>
                    <p className="text-xs text-slate-500">Detailed overview of inflows, outflows, and savings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Range Filters: Today, This Week, This Month, All Time, Custom Range */}
              <div className="flex flex-wrap items-center gap-2 my-4">
                <span className="text-xs font-semibold text-slate-500">Period:</span>
                {[
                  { label: 'Today', value: 'TODAY' },
                  { label: 'This Week', value: 'WEEK' },
                  { label: 'This Month', value: 'MONTH' },
                  { label: 'All Time', value: 'ALL' },
                  { label: 'Custom Range', value: 'CUSTOM' }
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setReportRange(period.value)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors border ${
                      reportRange === period.value
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Picker Inputs */}
              {reportRange === 'CUSTOM' && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl mb-4 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-600">From:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-600">To:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {(customStartDate || customEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium ml-auto"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Total Inflow</span>
                  <span className="text-base font-extrabold text-emerald-800">{formatCurrency(reportInflow, false)}</span>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">Total Outflow</span>
                  <span className="text-base font-extrabold text-red-800">{formatCurrency(reportOutflow, false)}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Net Flow</span>
                  <span className="text-base font-extrabold text-blue-800">{formatCurrency(reportInflow - reportOutflow, false)}</span>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">To Savings</span>
                  <span className="text-base font-extrabold text-teal-800">{formatCurrency(reportSavings, false)}</span>
                </div>
              </div>

              {/* Scrollable Records */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-3 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2 font-semibold">Date</th>
                      <th className="p-2 font-semibold">Type</th>
                      <th className="p-2 font-semibold">Description</th>
                      <th className="p-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-slate-400 italic">
                          No transactions found for this date range.
                        </td>
                      </tr>
                    ) : (
                      reportList.map((tx) => (
                        <tr key={tx.id}>
                          <td className="p-2 text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="p-2 font-semibold text-slate-700">{tx.type}</td>
                          <td className="p-2 text-slate-800 truncate max-w-[160px]">{tx.description}</td>
                          <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(tx.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
              <span className="text-xs text-slate-500">{reportList.length} total entries</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Printer size={14} /> Print
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  <Download size={14} /> Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}