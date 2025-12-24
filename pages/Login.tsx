import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import { dbService } from '../services/dbService';

export const Login: React.FC = () => {
  const { setUser, settings } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle Scroll Effect for Navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
        const user = dbService.login(username, password);
        if (user) {
          setUser(user);
        } else {
          setError('نام کاربری یا رمز عبور اشتباه است.');
          setIsLoading(false);
        }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-sky-500 selection:text-white">
      
      {/* --- Navbar --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'dark-glass py-3 shadow-lg' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className={`font-black text-2xl tracking-tight ${scrolled ? 'text-white' : 'text-slate-900'}`}>{settings.siteName}</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className={`${scrolled ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>ویژگی‌ها</a>
            <a href="#ai" className={`${scrolled ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>هوش مصنوعی</a>
            <a href="#security" className={`${scrolled ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>امنیت</a>
          </div>

          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-white text-slate-900 px-5 py-2 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors shadow-md">
            ورود به سامانه
          </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-slate-900">
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-600/20 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Text Content */}
            <div className="text-center lg:text-right space-y-6 animate-fade-in-up">
                <div className="inline-block px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm font-bold mb-4 backdrop-blur-md">
                    ✨ نسل جدید اتوماسیون اداری
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight">
                    مدیریت هوشمند مکاتبات <br/>
                    با طعم <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">هوش مصنوعی</span>
                </h1>
                <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                    سامانه نوین با بهره‌گیری از هوش مصنوعی Pollinations و امضای دیجیتال، سرعت و امنیت را به سازمان شما هدیه می‌دهد. بدون کاغذ، بدون مرز.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                    <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-sky-500/30 transition-all transform hover:-translate-y-1">
                        شروع رایگان
                    </button>
                    <button className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-2">
                        <span>▶</span> دموی ویدیویی
                    </button>
                </div>
                
                <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 text-slate-500 text-sm font-mono">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span>آپتایم ۹۹.۹٪</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                        <span>رمزنگاری AES-256</span>
                    </div>
                </div>
            </div>

            {/* Login Card (Floating) */}
            <div className="relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl blur-2xl opacity-30 transform rotate-6"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-xl border border-white/10 p-8 lg:p-10 rounded-3xl shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">ورود به پورتال</h2>
                        <p className="text-slate-400 text-sm">برای دسترسی به کارتابل وارد شوید</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                             <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
                                 {error}
                             </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm font-medium">نام کاربری</label>
                            <input 
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                placeholder="مثال: admin"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-slate-300 text-sm font-medium">رمز عبور</label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                dir="ltr"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                             <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                                 <input type="checkbox" className="rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500" />
                                 <span>مرا به خاطر بسپار</span>
                             </label>
                             <a href="#" className="text-sky-400 hover:text-sky-300">فراموشی رمز؟</a>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-sky-500/25 flex justify-center items-center"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'ورود امن'}
                        </button>
                    </form>

                     <div className="mt-6 pt-6 border-t border-white/5 text-center">
                         <p className="text-xs text-slate-500 mb-2">اکانت‌های دمو:</p>
                         <div className="flex justify-center gap-2">
                            <code className="bg-slate-900 px-2 py-1 rounded text-[10px] text-sky-400 font-mono">admin / 123</code>
                            <code className="bg-slate-900 px-2 py-1 rounded text-[10px] text-emerald-400 font-mono">manager / 123</code>
                         </div>
                     </div>
                </div>
            </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
             <svg className="fill-slate-50 w-full h-12 lg:h-24" viewBox="0 0 1440 320"><path fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section id="features" className="py-20 lg:py-32 bg-slate-50 relative">
          <div className="container mx-auto px-6">
              <div className="text-center mb-20">
                  <span className="text-sky-600 font-bold text-sm tracking-wider uppercase mb-2 block">امکانات پیشرفته</span>
                  <h2 className="text-3xl lg:text-5xl font-black text-slate-800 mb-4">هر آنچه برای مدیریت نیاز دارید</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">ما ابزارهای سنتی را بازطراحی کرده‌ایم تا با نیازهای مدرن سازمان شما هماهنگ شوند.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <FeatureCard 
                    icon="✨" 
                    title="دستیار هوشمند AI" 
                    desc="تنها با نوشتن موضوع، متن نامه‌های رسمی و اداری را به صورت خودکار و کاملاً حرفه‌ای تولید کنید." 
                  />
                  <FeatureCard 
                    icon="✍️" 
                    title="امضای دیجیتال" 
                    desc="رسم امضا با قلم نوری، موس یا بارگذاری تصویر مهر و امضا با قابلیت درج خودکار در اسناد." 
                  />
                  <FeatureCard 
                    icon="📊" 
                    title="گزارش‌گیری بصری" 
                    desc="داشبورد مدیریتی قدرتمند با نمودارهای تحلیلی برای رصد لحظه‌ای وضعیت مکاتبات." 
                  />
                  <FeatureCard 
                    icon="👥" 
                    title="مدیریت سطوح دسترسی" 
                    desc="تعریف نقش‌های کاربری مختلف (مدیر، کارمند، ادمین) با دسترسی‌های کاملاً تفکیک شده." 
                  />
                  <FeatureCard 
                    icon="📱" 
                    title="واکنش‌گرا (Responsive)" 
                    desc="دسترسی کامل به سامانه از طریق موبایل، تبلت و دسکتاپ بدون محدودیت مکانی." 
                  />
                  <FeatureCard 
                    icon="🚀" 
                    title="سرعت فوق‌العاده" 
                    desc="بهره‌گیری از تکنولوژی‌های مدرن وب برای تجربه کاربری روان و بدون تاخیر." 
                  />
              </div>
          </div>
      </section>

      {/* --- AI Showcase Section --- */}
      <section id="ai" className="py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-600/30 rounded-full blur-[120px]"></div>
          
          <div className="container mx-auto px-6 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                  <div className="lg:w-1/2 space-y-8">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30 text-purple-300 text-sm font-bold">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                          </span>
                          Powered by Pollinations AI
                      </div>
                      <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight">
                          دیگر نگران <br/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">نگارش نامه‌های اداری</span> نباشید
                      </h2>
                      <p className="text-slate-400 text-lg leading-relaxed">
                          با ادغام مدل‌های زبانی بزرگ، نوین اتوماسیون محتوای درخواست شما را درک کرده و آن را به زبان رسمی و استاندارد اداری تبدیل می‌کند.
                      </p>
                      
                      <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">⚡</div>
                              <div className="text-white">
                                  <h4 className="font-bold">صرفه‌جویی در زمان</h4>
                                  <p className="text-sm text-slate-400">کاهش زمان نگارش نامه از ۱۰ دقیقه به ۱۰ ثانیه</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-2xl">🎯</div>
                              <div className="text-white">
                                  <h4 className="font-bold">دقت و استانداردسازی</h4>
                                  <p className="text-sm text-slate-400">رعایت کامل اصول نگارش و ادبیات اداری</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="lg:w-1/2 w-full">
                      <div className="relative rounded-3xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl p-2 shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500">
                           <div className="bg-slate-900 rounded-2xl p-6 space-y-4 font-mono text-sm">
                               {/* Mock Chat Interface */}
                               <div className="flex gap-4">
                                   <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">👤</div>
                                   <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none text-slate-300 max-w-[80%]">
                                       موضوع: درخواست مرخصی برای هفته آینده. گیرنده: مدیر منابع انسانی
                                   </div>
                               </div>
                               <div className="flex gap-4 flex-row-reverse">
                                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">AI</div>
                                   <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/20 p-4 rounded-2xl rounded-tr-none text-purple-100 max-w-[90%] shadow-lg">
                                       <p className="font-sans mb-2 font-bold text-purple-300">متن پیشنهادی:</p>
                                       <p className="font-sans leading-7 text-justify opacity-90">
                                           جناب آقای مدیر منابع انسانی،<br/>
                                           با سلام و احترام،<br/>
                                           بدینوسیله به استحضار می‌رساند اینجانب درخواست مرخصی استحقاقی خود را از تاریخ ... لغایت ... جهت انجام امور شخصی تقدیم می‌دارم. خواهشمند است دستور فرمایید اقدام مقتضی مبذول گردد.<br/>
                                           با تشکر
                                       </p>
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
          <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                  <div className="col-span-1 md:col-span-2">
                      <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                         <span className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-sm">N</span>
                         نوین اتوماسیون
                      </h3>
                      <p className="max-w-sm leading-relaxed mb-6">
                          ارائه‌دهنده راهکارهای نوین سازمانی جهت تسهیل فرآیندهای اداری و حذف کاغذبازی با تکیه بر تکنولوژی‌های روز دنیا.
                      </p>
                      <div className="flex gap-4">
                          <SocialIcon path="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          <SocialIcon path="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </div>
                  </div>
                  
                  <div>
                      <h4 className="text-white font-bold mb-4">لینک‌های مفید</h4>
                      <ul className="space-y-2 text-sm">
                          <li><a href="#" className="hover:text-sky-400 transition-colors">درباره ما</a></li>
                          <li><a href="#" className="hover:text-sky-400 transition-colors">تماس با ما</a></li>
                          <li><a href="#" className="hover:text-sky-400 transition-colors">حریم خصوصی</a></li>
                          <li><a href="#" className="hover:text-sky-400 transition-colors">سوالات متداول</a></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-4">تماس</h4>
                      <ul className="space-y-2 text-sm">
                          <li>تهران، پارک فناوری پردیس</li>
                          <li dir="ltr">+98 21 8888 8888</li>
                          <li>info@novinauto.com</li>
                      </ul>
                  </div>
              </div>
              
              <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                  <p>© ۱۴۰۳ نوین اتوماسیون. تمامی حقوق محفوظ است.</p>
                  <p className="flex items-center gap-1">
                      Design with <span className="text-red-500">♥</span> by Novin Team
                  </p>
              </div>
          </div>
      </footer>
    </div>
  );
};

// --- Helper Components ---

const FeatureCard = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
    <div className="group bg-white p-8 rounded-3xl border border-slate-100 hover:border-sky-200 shadow-sm hover:shadow-2xl hover:shadow-sky-900/5 transition-all duration-300 transform hover:-translate-y-2">
        <div className="w-14 h-14 bg-slate-50 group-hover:bg-sky-500 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-colors duration-300">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-sky-600 transition-colors">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
);

const SocialIcon = ({ path }: { path: string }) => (
    <a href="#" className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center hover:bg-sky-600 hover:border-sky-500 text-white transition-all">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d={path}/></svg>
    </a>
);