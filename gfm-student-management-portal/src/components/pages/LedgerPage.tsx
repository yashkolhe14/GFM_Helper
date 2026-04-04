import React from 'react';

export const LedgerPage: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
      <iframe
        src="/ledger.html"
        className="w-full h-full border-none"
        title="BVP Marks & Result Ledger"
      />
    </div>
  );
};
