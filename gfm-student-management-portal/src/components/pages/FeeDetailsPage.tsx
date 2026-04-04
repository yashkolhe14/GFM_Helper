import React, { useState } from 'react';
import { IndianRupee, Search, Download, TrendingUp, PieChart as PieChartIcon, CheckSquare, Square, Edit3, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FeeRecord } from '../../types';

export const FeeDetailsPage: React.FC = () => {
  const { appData, selectedContext, updateFeeRecords } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  if (!appData || !selectedContext) return null;

  const filteredFees = appData.feeRecords.filter(f => {
    const gfmMatch = f.gfmName === selectedContext.gfmName;
    const classMatch = selectedContext.class === 'N/A' || f.class === selectedContext.class;
    const divMatch = selectedContext.division === 'N/A' || f.division === selectedContext.division;
    const searchMatch = searchQuery === '' || 
      String(f.studentName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return gfmMatch && classMatch && divMatch && searchMatch;
  });

  const totalPaid = filteredFees.filter(f => f.status === 'Paid').length;
  const totalPartial = filteredFees.filter(f => f.status === 'Partial').length;
  const totalPending = filteredFees.filter(f => f.status === 'Pending').length;
  
  const totalAmountDue = filteredFees.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalAmountPaid = filteredFees.reduce((acc, curr) => acc + curr.amountPaid, 0);
  
  const collectionRate = totalAmountDue > 0 
    ? Math.round((totalAmountPaid / totalAmountDue) * 100)
    : 0;

  const chartData = [
    { name: 'Paid', value: totalPaid },
    { name: 'Partial', value: totalPartial },
    { name: 'Pending', value: totalPending },
  ];

  const COLORS = ['#10b981', '#6366f1', '#f59e0b'];

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredFees.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = filteredFees.map(f => f.id).filter(Boolean) as string[];
      setSelectedIds(new Set(allIds));
    }
  };

  const handleBulkEditSave = (updates: Partial<FeeRecord>) => {
    updateFeeRecords(Array.from(selectedIds), updates);
    setSelectedIds(new Set());
    setIsBulkEditModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fee Management</h2>
          <p className="text-slate-500 font-medium">Financial tracking and collection oversight</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Paid</p>
              <p className="text-3xl font-black text-slate-900">{totalPaid}</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Students cleared</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending / Partial</p>
              <p className="text-3xl font-black text-slate-900">{totalPending + totalPartial}</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase">Awaiting full payment</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collection Rate</p>
                <p className="text-3xl font-black text-slate-900">{collectionRate}%</p>
              </div>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-1000" 
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Distribution</h3>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Financial Ledger</h3>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                {filteredFees.length} Records
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button 
                onClick={() => setIsBulkEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Bulk Edit ({selectedIds.size})</span>
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search student..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-slate-700"
            />
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {selectedIds.size === filteredFees.length && filteredFees.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFees.length > 0 ? (
                filteredFees.map((record, idx) => {
                  const isSelected = record.id && selectedIds.has(record.id);
                  return (
                    <tr key={idx} className={cn("group hover:bg-slate-50/50 transition-colors", isSelected && "bg-indigo-50/30")}>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => record.id && toggleSelection(record.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{record.rollNo || '-'}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase text-sm">
                          {record.studentName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">₹{record.totalAmount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-emerald-600">₹{record.amountPaid.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-amber-600">₹{record.amountPending.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit",
                            record.status === 'Paid' ? "bg-emerald-100 text-emerald-700" : 
                            record.status === 'Partial' ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {record.status}
                          </span>
                          {record.status !== 'Paid' && record.dueDate && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                              Due: {record.dueDate}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-400 italic">{record.remark || '-'}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-3xl text-slate-400">
                        <IndianRupee className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium">No fee records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isBulkEditModalOpen && (
        <BulkEditModal 
          selectedCount={selectedIds.size}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSave={handleBulkEditSave}
        />
      )}
    </div>
  );
};

const BulkEditModal: React.FC<{ selectedCount: number; onClose: () => void; onSave: (updates: Partial<FeeRecord>) => void }> = ({ selectedCount, onClose, onSave }) => {
  const [field, setField] = useState<keyof FeeRecord>('status');
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ [field]: value });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Bulk Edit Fees</h3>
              <p className="text-slate-500 font-medium">Updating {selectedCount} records</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Field to Update</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={field}
                onChange={(e) => {
                  setField(e.target.value as keyof FeeRecord);
                  setValue('');
                }}
              >
                <option value="status">Payment Status</option>
                <option value="dueDate">Due Date</option>
                <option value="remark">Remark</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Value</label>
              {field === 'status' ? (
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                </select>
              ) : (
                <input 
                  type={field === 'dueDate' ? 'date' : 'text'}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Enter new ${field}...`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
