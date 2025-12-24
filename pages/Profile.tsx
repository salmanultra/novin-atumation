import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../App';
import { dbService } from '../services/dbService';

// Helper for image compression
const compressImage = (base64Str: string, maxWidth = 300, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
};

export const Profile: React.FC = () => {
  const { user, setUser } = useAppContext();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [password, setPassword] = useState(user?.password || '');
  const [signatureImage, setSignatureImage] = useState(user?.signatureImage || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [signatureTab, setSignatureTab] = useState<'DRAW' | 'UPLOAD'>('DRAW');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  if (!user) return null;

  // --- Signature Pad Logic ---
  useEffect(() => {
    if (signatureTab === 'DRAW' && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
        }
    }
  }, [signatureTab]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }
      
      return {
          x: clientX - rect.left,
          y: clientY - rect.top
      };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); 
      setIsDrawing(true);
      const { x, y } = getPos(e);
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.beginPath();
      ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); 
      if (!isDrawing) return;
      const { x, y } = getPos(e);
      const ctx = canvasRef.current?.getContext('2d');
      ctx?.lineTo(x, y);
      ctx?.stroke();
  };

  const stopDrawing = () => {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
          // Signature doesn't need heavy compression usually, but good to be safe
          setSignatureImage(canvas.toDataURL('image/png', 0.5));
      }
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setSignatureImage('');
      }
  };

  // --- File Upload Logic ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          try {
            const compressed = await compressImage(ev.target.result as string, 400);
            setSignatureImage(compressed);
          } catch (err) {
            alert('خطا در پردازش تصویر');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          try {
             // Aggressive compression for avatars to save DB space
            const compressed = await compressImage(ev.target.result as string, 200, 0.6);
            setAvatarUrl(compressed);
          } catch (err) {
              alert('خطا در پردازش تصویر');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const updatedUser = {
        ...user,
        fullName,
        password,
        signatureImage,
        avatarUrl,
        };
        
        dbService.updateUser(updatedUser);
        setUser(updatedUser);
        localStorage.setItem('session_user', JSON.stringify(updatedUser));
        alert('اطلاعات پروفایل با موفقیت ذخیره شد.');
    } catch (err) {
        // Error is handled in dbService but we catch here to prevent crash
        console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">تنظیمات پروفایل کاربری</h2>
        
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-200 flex items-center justify-center shadow-lg">
                      {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                          <span className="text-4xl text-gray-400">👤</span>
                      )}
                  </div>
                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">تغییر عکس</span>
                  </div>
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
              </div>
              <p className="text-xs text-gray-400 mt-2">برای تغییر تصویر پروفایل کلیک کنید</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام کامل</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رمز عبور</label>
              <input 
                type="text" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none bg-gray-50"
                placeholder="تغییر رمز عبور..."
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
                <label className="block text-lg font-bold text-gray-800">امضای دیجیتال</label>
                <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
                    <button 
                        type="button" 
                        onClick={() => setSignatureTab('DRAW')} 
                        className={`px-4 py-1.5 rounded-md transition-colors ${signatureTab === 'DRAW' ? 'bg-white shadow-sm text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        رسم امضا
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setSignatureTab('UPLOAD')} 
                        className={`px-4 py-1.5 rounded-md transition-colors ${signatureTab === 'UPLOAD' ? 'bg-white shadow-sm text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        آپلود عکس
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="order-2 md:order-1">
                {signatureTab === 'DRAW' ? (
                    <div className="space-y-2">
                         <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner cursor-crosshair touch-none">
                            <canvas 
                                ref={canvasRef}
                                width={350}
                                height={200}
                                className="w-full h-[200px]"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                            <span>امضای خود را در کادر بالا رسم کنید</span>
                            <button type="button" onClick={clearCanvas} className="text-red-500 hover:text-red-700">پاک کردن</button>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer h-[230px] flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            className="hidden" 
                            accept="image/*"
                        />
                        <div className="text-4xl mb-3">📤</div>
                        <p className="text-sm text-gray-600 font-medium">کلیک برای انتخاب تصویر امضا</p>
                        <p className="text-xs text-gray-400 mt-2">فرمت‌های مجاز: PNG, JPG</p>
                    </div>
                )}
              </div>
              
              <div className="order-1 md:order-2">
                <p className="text-sm text-gray-500 mb-2 font-medium">پیش‌نمایش نهایی:</p>
                <div className="h-[230px] border border-gray-200 rounded-xl bg-white flex items-center justify-center relative shadow-sm overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                   {signatureImage ? (
                       <img src={signatureImage} alt="Signature Preview" className="max-h-32 max-w-full object-contain drop-shadow-sm" />
                   ) : (
                       <div className="text-center text-gray-300">
                           <p className="text-4xl mb-2">✍️</p>
                           <p className="text-sm">هنوز امضایی ثبت نشده است</p>
                       </div>
                   )}
                   {signatureImage && (
                       <button 
                        type="button"
                        onClick={() => {setSignatureImage(''); if(canvasRef.current) clearCanvas();}}
                        className="absolute top-2 left-2 bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs hover:bg-red-100 border border-red-100 transition-colors"
                       >
                           حذف امضا
                       </button>
                   )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
                type="submit"
                className="bg-gradient-to-l from-sky-600 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-sky-700 hover:to-blue-700 transition-all shadow-lg shadow-sky-600/20 font-bold flex items-center gap-2 transform active:scale-95"
            >
                <span>💾</span>
                <span>ذخیره تغییرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};