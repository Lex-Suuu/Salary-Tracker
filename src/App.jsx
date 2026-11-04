import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  TrendingDown,
  Trash2,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
  Edit2,
  Check,
  X,
  PieChart as PieChartIcon,
  Printer
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

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef(null);

  // Ledger Filter & Report Modal State
  const [ledgerView, setLedgerView] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'TRANSFER' | 'SAVINGS'
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportRange, setReportRange] = useState('ALL'); // 'ALL' | 'MONTH' | '30DAYS'

  // Per-card action states
  const [cardModes, setCardModes] = useState({
    acc1: 'deposit',
    acc2: 'transfer',
    acc3: 'transfer'
  });
  const [cardAmounts, setCardAmounts] = useState({
    acc1: '',
    acc2: '',
    acc3: ''
  });

  // Expense form state
  const [desc, setDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [category, setCategory] = useState(INITIAL_EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('acc2');

  // Persistence
  useEffect(() => {
    localStorage.setItem('salary_tracker_ledger', JSON.stringify(transactions));
    localStorage.setItem('salary_tracker_accounts', JSON.stringify(accounts));
  }, [transactions, accounts]);

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Balances calculation
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

  const handleCardSubmit = (e, accId) => {
    e.preventDefault();
    const amt = parseFloat(cardAmounts[accId]);
    const targetAccount = accounts.find((a) => a.id === accId);
    const mainAccount = accounts[0];

    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    const mode = cardModes[accId];

    if (mode === 'deposit' || accId === accounts[0].id) {
      const newTx = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'INCOME',
        description: `Deposit (${targetAccount?.name || 'Account'})`,
        amount: amt,
        toId: targetAccount?.id || accId,
        toName: targetAccount?.name || 'Account'
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Deposited ₱${amt.toLocaleString()} to ${targetAccount?.name}`);
    } else {
      if (amt > (balances[mainAccount.id] || 0)) {
        showToast(`Insufficient funds in ${mainAccount.name}`, 'error');
        return;
      }
      const newTx = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'TRANSFER',
        description: `Transfer: ${mainAccount.name} to ${targetAccount?.name}`,
        amount: amt,
        fromId: mainAccount.id,
        fromName: mainAccount.name,
        toId: targetAccount?.id || accId,
        toName: targetAccount?.name || 'Account'
      };
      setTransactions([newTx, ...transactions]);
      showToast(`Transferred ₱${amt.toLocaleString()} to ${targetAccount?.name}`);
    }

    setCardAmounts({ ...cardAmounts, [accId]: '' });
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

    setTransactions([newTx, ...transactions]);
    setDesc('');
    setExpenseAmount('');
    setCustomCategory('');
    showToast(`Logged expense: ₱${amt.toLocaleString()} (${finalCategory})`);
  };

  const handleDeleteTx = (id) => {
    setTransactions(transactions.filter((tx) => tx.id !== id));
    showToast('Transaction removed');
  };

  // Paste it here:
  const handleResetTransfers = () => {
    if (window.confirm('Are you sure you want to delete all transfer transactions?')) {
      const updated = transactions.filter((tx) => tx.type !== 'TRANSFER');
      setTransactions(updated);
      showToast('All transfers have been reset');
    }
  };

  const handleExportData = () => {
    const backup = { accounts, transactions };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `salary_tracker_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Ledger backup exported');
  };

  const handleImportData = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed)) {
            setTransactions(parsed);
          } else if (parsed?.transactions) {
            setTransactions(parsed.transactions);
            if (parsed.accounts) setAccounts(parsed.accounts);
          }
          showToast('Ledger data successfully restored');
        } catch {
          showToast('Could not parse JSON file', 'error');
        }
      };
    }
  };

  // Safe calculations for Expense Distribution
  const expenseTransactions = (transactions || []).filter((tx) => tx?.type === 'EXPENSE');
  const totalExpenses = expenseTransactions.reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);

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

  // Safe filter for ledger view
  const filteredTransactions = (transactions || []).filter((tx) => {
    if (!tx) return false;
    if (ledgerView === 'EXPENSE') return tx.type === 'EXPENSE';
    if (ledgerView === 'TRANSFER') return tx.type === 'TRANSFER';
    if (ledgerView === 'SAVINGS') {
      const savingsAcc = accounts[2];
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

  // Safe Report Filter calculation
  const getReportTransactions = () => {
    const now = new Date();
    return (transactions || []).filter((tx) => {
      if (!tx?.date) return false;
      const txDate = new Date(tx.date);
      if (reportRange === 'MONTH') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (reportRange === '30DAYS') {
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }
      return true;
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
      const savingsAcc = accounts[2];
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

  const formatCurrency = (val) => {
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Toast */}
      {notification.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 ${
            notification.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-300 shadow-sm"
            >
              <Download size={16} /> Export
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors border border-slate-300 shadow-sm"
            >
              <Upload size={16} /> Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportData}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Account Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((acc, index) => {
            const styles = colorStyles[acc.color] || colorStyles.blue;
            const isEditing = editingAccountId === acc.id;
            const isMainAccount = index === 0;
            const currentMode = isMainAccount ? 'deposit' : (cardModes[acc.id] || 'transfer');

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

                        {/* Reset Transfers Button */}
              <button
                onClick={handleResetTransfers}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg transition-colors border border-amber-200"
              >
                <Trash2 size={14} /> Reset Transfers
              </button>

              {/* Generate Report Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <FileText size={14} /> Generate Report
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

                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles.badge}`}>
                      {acc.badge}
                    </span>
                  </div>

                  <div className={`text-3xl font-extrabold ${styles.text} mb-4`}>
                    {formatCurrency(balances[acc.id] || 0)}
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
                          currentMode === 'transfer' ? 'text-slate-900 underline' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Transfer from {accounts[0].name}
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setCardModes({ ...cardModes, [acc.id]: 'deposit' })}
                        className={`transition-colors ${
                          currentMode === 'deposit' ? 'text-slate-900 underline' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        + Direct Income
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

        {/* Expense Entry & Segmented Line Distribution */}
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
                      {acc.name} ({formatCurrency(balances[acc.id] || 0)})
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

          {/* Line Distribution Bar */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <PieChartIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Expense Distribution</h2>
                    <p className="text-xs text-slate-500">Breakdown across all logged categories</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Total Expenses</span>
                  <span className="text-xl font-extrabold text-red-600">{formatCurrency(totalExpenses)}</span>
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

              {/* Category rows */}
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
                        <span className="text-xs font-bold text-slate-800">{formatCurrency(cat.amount)}</span>
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

        {/* Ledger */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-slate-500" size={20} />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Transaction Ledger</h2>
                <p className="text-xs text-slate-500">Complete record of inflows, outflows, and transfers</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <FileText size={14} /> Generate Report
              </button>
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
                          className={`py-3.5 px-4 text-right font-bold ${
                            isIncome ? 'text-emerald-600' : isExpense ? 'text-red-600' : 'text-slate-700'
                          }`}
                        >
                          {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(tx.amount)}
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

              {/* Range Filters */}
              <div className="flex items-center gap-2 my-4">
                <span className="text-xs font-semibold text-slate-500">Period:</span>
                {[
                  { label: 'All Time', value: 'ALL' },
                  { label: 'This Month', value: 'MONTH' },
                  { label: 'Last 30 Days', value: '30DAYS' }
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

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Total Inflow</span>
                  <span className="text-base font-extrabold text-emerald-800">{formatCurrency(reportInflow)}</span>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">Total Outflow</span>
                  <span className="text-base font-extrabold text-red-800">{formatCurrency(reportOutflow)}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Net Flow</span>
                  <span className="text-base font-extrabold text-blue-800">{formatCurrency(reportInflow - reportOutflow)}</span>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">To Savings</span>
                  <span className="text-base font-extrabold text-teal-800">{formatCurrency(reportSavings)}</span>
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
                    {reportList.map((tx) => (
                      <tr key={tx.id}>
                        <td className="p-2 text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="p-2 font-semibold text-slate-700">{tx.type}</td>
                        <td className="p-2 text-slate-800 truncate max-w-[160px]">{tx.description}</td>
                        <td className="p-2 text-right font-bold text-slate-800">{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
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