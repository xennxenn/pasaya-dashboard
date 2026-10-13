import React from 'react';
import { FileText, Sparkles, Plus, Edit } from 'lucide-react';
import { useSales } from '../../context/SalesContext';

interface CustomPageViewProps {
  pageId: string;
}

export const CustomPageView: React.FC<CustomPageViewProps> = ({ pageId }) => {
  const { sidebarItems } = useSales();
  const currentItem = sidebarItems.find((item) => item.id === pageId);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-3 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-cyan-400" />
          <span>{currentItem?.label || 'หน้าเพจที่กำหนดเอง'}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            Custom View
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {currentItem?.customDescription || 'หน้านี้ถูกสร้างขึ้นผ่านระบบจัดการ Sidebar'}
        </p>
      </div>

      <div className="rounded-2xl glass-panel border border-cyan-500/20 p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">
          พื้นที่บันทึกข้อมูลและรายงานเฉพาะด้าน
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          คุณสามารถใช้หน้านี้เป็นส่วนบันทึกข้อมูลเฉพาะกิจ, แผนงานโปรโมชั่นประจำเดือน หรือสรุปสาระสำคัญของสาขาในเครือ PASAYA Curtain Center
        </p>
      </div>
    </div>
  );
};
