import React, { useEffect, useState } from 'react';
import { useAppContext } from '../App';
import { dbService } from '../services/dbService';
import { LetterStatus, Letter } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAppContext();
  const [letters, setLetters] = useState<Letter[]>([]);

  useEffect(() => {
    if (user) {
      const data = dbService.getUserLetters(user.id);
      setLetters(data);
    }
  }, [user]);

  const stats = {
    total: letters.length,
    pending: letters.filter(l => l.status === LetterStatus.PENDING).length,
    approved: letters.filter(l => l.status === LetterStatus.APPROVED).length,
    rejected: letters.filter(l => l.status === LetterStatus.REJECTED).length,
  };

  const chartData = [
    { name: 'در انتظار', value: stats.pending, fill: '#f59e0b' },
    { name: 'تایید شده', value: stats.approved, fill: '#10b981' },
    { name: 'رد شده', value: stats.rejected, fill: '#ef4444' },
  ];

  const COLORS = ['#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-2xl">
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black mb-2 tracking-tight">داشبورد مدیریتی</h2>
            <p className="text-slate-300 text-lg">خوش آمدید، {user?.fullName} | {user?.position}</p>
          </div>
          <div className="text-left bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
            <p className="text-xs text-slate-300 mb-1">تاریخ امروز</p>
            <p className="text-xl font-mono font-bold">{new Date().toLocaleDateString('fa-IR')}</p>
          </div>
        </div>
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="کل مکاتبات" 
            value={stats.total} 
            gradient="from-slate-700 to-slate-800" 
            icon="📂" 
            subtext="نامه ثبت شده"
        />
        <StatCard 
            title="در انتظار اقدام" 
            value={stats.pending} 
            gradient="from-amber-500 to-orange-600" 
            icon="⏳" 
            subtext="نیاز به بررسی"
        />
        <StatCard 
            title="تایید نهایی" 
            value={stats.approved} 
            gradient="from-emerald-500 to-teal-600" 
            icon="✅" 
            subtext="امضا شده"
        />
        <StatCard 
            title="رد شده" 
            value={stats.rejected} 
            gradient="from-red-500 to-rose-600" 
            icon="❌" 
            subtext="بایگانی شده"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-sky-500 rounded-full"></span>
            آمار تحلیلی وضعیت نامه‌ها
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontFamily: 'Vazirmatn'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontFamily: 'Vazirmatn'}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}} 
                contentStyle={{
                    fontFamily: 'Vazirmatn', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar dataKey="value" barSize={40} radius={[8, 8, 0, 0]} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                توزیع وضعیت
            </h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{fontFamily: 'Vazirmatn', borderRadius: '12px'}} />
                        <Legend wrapperStyle={{fontFamily: 'Vazirmatn', fontSize: '12px'}} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-slate-500 rounded-full"></span>
                آخرین فعالیت‌های شما
            </h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">۳ مورد اخیر</span>
         </div>
         
         <div className="space-y-4">
             {letters.slice(0, 3).map(letter => (
                 <div key={letter.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition-all duration-300">
                     <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md ${
                            letter.status === LetterStatus.APPROVED ? 'bg-emerald-100 text-emerald-600' :
                            letter.status === LetterStatus.REJECTED ? 'bg-red-100 text-red-600' :
                            'bg-amber-100 text-amber-600'
                         }`}>
                             {letter.status === LetterStatus.APPROVED ? '✓' : letter.status === LetterStatus.REJECTED ? '✕' : '⋯'}
                         </div>
                         <div>
                            <span className="font-bold text-slate-800 block mb-1 group-hover:text-sky-700 transition-colors">{letter.subject}</span>
                            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">
                                {letter.status === LetterStatus.APPROVED ? 'تایید شده' : letter.status === LetterStatus.REJECTED ? 'رد شده' : 'در انتظار بررسی'}
                            </span>
                         </div>
                     </div>
                     <span className="text-sm font-mono text-slate-400">{new Date(letter.createdAt).toLocaleDateString('fa-IR')}</span>
                 </div>
             ))}
             {letters.length === 0 && <p className="text-slate-400 text-center py-8 italic">هنوز فعالیتی ثبت نشده است.</p>}
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, gradient, icon, subtext }: any) => (
  <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br ${gradient} transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
    <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <span className="text-2xl">{icon}</span>
            </div>
            <span className="text-4xl font-black tracking-tighter">{value}</span>
        </div>
        <div>
            <p className="font-bold text-lg opacity-90">{title}</p>
            <p className="text-xs opacity-60 mt-1">{subtext}</p>
        </div>
    </div>
    {/* Decorative Circles */}
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-black opacity-10 rounded-full blur-3xl"></div>
  </div>
);