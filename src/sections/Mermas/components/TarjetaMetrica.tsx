import React from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  isAlert?: boolean;
}

export const TarjetaMetrica: React.FC<Props> = ({ label, value, icon, isAlert }) => {
  return (
    <div className={`flex items-center gap-4 p-4 border-2 bg-white min-w-[200px] shrink-0 transition-transform hover:-translate-y-1 cursor-default rounded-none ${
      isAlert ? 'border-[#EF4444] shadow-[4px_4px_0_0_#EF4444]' : 'border-[#1E293B] shadow-[4px_4px_0_0_#1E293B]'
    }`}>
      <div className={`w-10 h-10 flex items-center justify-center border-2 rounded-none shrink-0 ${
        isAlert ? 'bg-[#FEF2F2] border-[#EF4444] text-[#EF4444]' : 'bg-[#F8FAFC] border-[#1E293B] text-[#1E293B]'
      }`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest truncate">{label}</p>
        <p className={`text-lg font-black uppercase tracking-wider truncate ${
          isAlert ? 'text-[#EF4444]' : 'text-[#1E293B]'
        }`}>
          {value}
        </p>
      </div>
    </div>
  );
};