import React, { useState } from 'react';
import { useAppContext } from '../App';
import { dbService } from '../services/dbService';

export const Login: React.FC = () => {
  const { setUser, settings } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small network delay for better UX feel
    setTimeout(() => {
        const user = dbService.login(username, password);
        if (user) {
          setUser(user);
        } else {
          setError('نام کاربری یا رمز عبور اشتباه است.');
          setIsLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden">
        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 animate-fade-in relative z-10">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center lg:text-right">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-sky-50 text-sky-600 mb-6 shadow-sm overflow-hidden p-2">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{settings.siteName}</h1>
                    <p className="mt-3 text-slate-500 text-sm leading-relaxed">
                        سامانه یکپارچه مدیریت مکاتبات و فرآیندهای اداری
                        <br className="hidden lg:block"/>
                        لطفاً جهت دسترسی به پنل، احراز هویت کنید.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 animate-pulse">
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="relative group">
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">نام کاربری</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all duration-200 font-mono text-left text-slate-800 group-hover:bg-white"
                                    placeholder="Username"
                                    dir="ltr"
                                />
                                <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none pr-3.5">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">رمز عبور</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-4 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all duration-200 font-mono text-left text-slate-800 group-hover:bg-white"
                                    placeholder="••••••••"
                                    dir="ltr"
                                />
                                <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none pr-3.5">
                                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                            <span className="text-sm text-slate-500 group-hover:text-sky-600 transition-colors">مرا به خاطر بسپار</span>
                        </label>
                        <a href="#" className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline">فراموشی رمز عبور؟</a>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-sky-600/20 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'ورود به پورتال'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs text-center text-slate-400 mb-3">حساب‌های آزمایشی جهت بررسی:</p>
                    <div className="flex justify-center gap-2 text-xs font-mono">
                        <code className="px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200">admin / 123</code>
                        <code className="px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200">manager / 123</code>
                    </div>
                </div>
            </div>
        </div>

        {/* Left Side - Abstract Visual */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-sky-500/20 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>

            {/* Glass Card Content */}
            <div className="relative z-10 max-w-lg p-10 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl text-white">
                <div className="text-4xl font-black mb-6 leading-tight">
                    سرعت، دقت و امنیت <br/> در <span className="text-sky-400">مکاتبات اداری</span>
                </div>
                <p className="text-lg text-slate-300 leading-relaxed mb-8">
                    با سیستم اتوماسیون پارس، تمامی فرآیندهای نامه‌نگاری، بایگانی و گردش کار سازمان خود را به صورت دیجیتال و هوشمند مدیریت کنید.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-2xl">⚡</span>
                        <div>
                            <p className="font-bold text-sm">سرعت بالا</p>
                            <p className="text-xs text-slate-400">گردش آنی نامه‌ها</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-2xl">🛡️</span>
                        <div>
                            <p className="font-bold text-sm">امنیت داده</p>
                            <p className="text-xs text-slate-400">رمزنگاری پیشرفته</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-2xl">🤖</span>
                        <div>
                            <p className="font-bold text-sm">هوش مصنوعی</p>
                            <p className="text-xs text-slate-400">نگارش خودکار</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-2xl">✍️</span>
                        <div>
                            <p className="font-bold text-sm">امضای دیجیتال</p>
                            <p className="text-xs text-slate-400">معتبر و قانونی</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
        </div>
    </div>
  );
};