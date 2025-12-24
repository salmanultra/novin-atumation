import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../services/dbService';
import { useAppContext } from '../App';
import { User, Log, Role, SystemSettings, Letter, LetterStatus, LetterRecipient, RecipientRole } from '../types';

// Helper for image compression
const compressAttachment = (base64Str: string, maxWidth = 800): Promise<string> => {
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
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = () => resolve(base64Str);
    });
};

export const AdminPanel: React.FC = () => {
  const { settings, updateSettings, user: currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'USERS' | 'LETTERS' | 'LOGS' | 'SETTINGS'>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  
  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({ role: Role.EMPLOYEE });

  // Letter Edit State
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const letterFileInputRef = useRef<HTMLInputElement>(null);
  const [newRecipientId, setNewRecipientId] = useState('');
  const [newRecipientRole, setNewRecipientRole] = useState<RecipientRole>('VIEWER');

  // Settings State
  const [siteName, setSiteName] = useState(settings.siteName);
  const [themeColor, setThemeColor] = useState(settings.themeColor);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(dbService.getAllUsers());
    setLogs(dbService.getSystemLogs());
    setLetters(dbService.getAllLettersForAdmin());
  };

  // --- User Logic ---
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
        dbService.updateUser({ ...editingUser, ...userFormData } as User);
    } else {
        const newUser: User = {
            id: Date.now().toString(),
            username: userFormData.username!,
            password: userFormData.password!,
            fullName: userFormData.fullName!,
            position: userFormData.position!,
            role: userFormData.role || Role.EMPLOYEE,
        };
        dbService.addUser(newUser);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserFormData({ role: Role.EMPLOYEE });
    refreshData();
  };

  const handleDeleteUser = (id: string) => {
      if(window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
          dbService.deleteUser(id);
          refreshData();
      }
  }

  const openEditUser = (user: User) => {
      setEditingUser(user);
      setUserFormData(user);
      setIsUserModalOpen(true);
  }

  // --- Letter Logic ---
  const openEditLetter = (letter: Letter) => {
      setEditingLetter({ ...letter }); // Create a copy
      setIsLetterModalOpen(true);
  };

  const handleLetterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editingLetter) return;

      const isImage = file.type.includes('image');
      const limit = isImage ? 5 * 1024 * 1024 : 500 * 1024;

      if (file.size > limit) {
          alert("حجم فایل زیاد است.");
          if (letterFileInputRef.current) letterFileInputRef.current.value = "";
          return;
      }

      const reader = new FileReader();
      reader.onload = async (ev) => {
          if (ev.target?.result) {
              let data = ev.target.result as string;
              if (isImage) {
                  try {
                    data = await compressAttachment(data);
                  } catch (e) {
                      console.error("Compression failed");
                  }
              }

              setEditingLetter({
                  ...editingLetter,
                  attachment: {
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      data: data
                  }
              });
          }
      };
      reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
      if(editingLetter) {
          setEditingLetter({...editingLetter, attachment: undefined});
          if(letterFileInputRef.current) letterFileInputRef.current.value = "";
      }
  };

  const handleAddRecipient = () => {
      if(!editingLetter || !newRecipientId) return;
      
      const exists = editingLetter.recipients.find(r => r.userId === newRecipientId);
      if(exists) {
          alert('این کاربر قبلاً در لیست گیرندگان وجود دارد.');
          return;
      }

      const userToAdd = users.find(u => u.id === newRecipientId);
      if(userToAdd) {
          const newRecipient: LetterRecipient = {
              userId: userToAdd.id,
              userName: userToAdd.fullName,
              role: newRecipientRole,
              status: LetterStatus.PENDING
          };
          setEditingLetter({
              ...editingLetter,
              recipients: [...editingLetter.recipients, newRecipient]
          });
          setNewRecipientId('');
      }
  };

  const handleSaveLetter = () => {
      if(editingLetter) {
          dbService.updateLetter(editingLetter);
          setIsLetterModalOpen(false);
          setEditingLetter(null);
          refreshData();
          alert('تغییرات نامه با موفقیت ذخیره شد.');
      }
  };

  // --- Settings Logic ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) setLogoUrl(ev.target.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const saveSystemSettings = () => {
      updateSettings({
          siteName,
          themeColor,
          logoUrl
      });
      alert('تنظیمات سیستم با موفقیت ذخیره شد.');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">پنل مدیریت سیستم</h2>
      
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full sm:w-fit overflow-x-auto">
        <button onClick={() => setActiveTab('USERS')} className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'USERS' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-900'}`}>کاربران و دسترسی‌ها</button>
        <button onClick={() => setActiveTab('LETTERS')} className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'LETTERS' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-900'}`}>مدیریت نامه‌ها</button>
        <button onClick={() => setActiveTab('LOGS')} className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'LOGS' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-900'}`}>لاگ‌های سیستم</button>
        <button onClick={() => setActiveTab('SETTINGS')} className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'SETTINGS' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-900'}`}>تنظیمات سایت</button>
      </div>

      {/* --- USERS TAB --- */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="font-bold text-gray-700">لیست کاربران</h3>
                <button onClick={() => { setEditingUser(null); setUserFormData({role: Role.EMPLOYEE}); setIsUserModalOpen(true); }} className="w-full sm:w-auto bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">
                    افزودن کاربر جدید
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-6 py-4">نام کامل</th>
                            <th className="px-6 py-4">نام کاربری</th>
                            <th className="px-6 py-4">سمت</th>
                            <th className="px-6 py-4">سطح دسترسی</th>
                            <th className="px-6 py-4">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{u.fullName}</td>
                                <td className="px-6 py-4 text-gray-500">{u.username}</td>
                                <td className="px-6 py-4 text-gray-500">{u.position}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                        u.role === Role.ADMIN ? 'bg-red-100 text-red-700' :
                                        u.role === Role.MANAGER ? 'bg-amber-100 text-amber-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button onClick={() => openEditUser(u)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">ویرایش</button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- LETTERS TAB --- */}
      {activeTab === 'LETTERS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b">
                <h3 className="font-bold text-gray-700">مدیریت کلیه مکاتبات</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-6 py-4">موضوع</th>
                            <th className="px-6 py-4">فرستنده</th>
                            <th className="px-6 py-4">تاریخ ایجاد</th>
                            <th className="px-6 py-4">وضعیت</th>
                            <th className="px-6 py-4">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {letters.map(l => (
                            <tr key={l.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-800 max-w-xs truncate">{l.subject}</td>
                                <td className="px-6 py-4 text-gray-600">{l.senderName}</td>
                                <td className="px-6 py-4 text-gray-500" dir="ltr">{new Date(l.createdAt).toLocaleDateString('fa-IR')}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded-full text-xs ${
                                        l.status === LetterStatus.APPROVED ? 'bg-green-100 text-green-700' :
                                        l.status === LetterStatus.REJECTED ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {l.status === LetterStatus.APPROVED ? 'تایید شده' : 
                                         l.status === LetterStatus.REJECTED ? 'رد شده' : 'در جریان'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => openEditLetter(l)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 rounded-lg transition-colors text-xs font-bold">
                                        ویرایش / ارجاع
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- LOGS TAB --- */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b">
                <h3 className="font-bold text-gray-700">تاریخچه فعالیت‌ها</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                            <tr>
                                <th className="px-6 py-4">زمان</th>
                                <th className="px-6 py-4">کاربر</th>
                                <th className="px-6 py-4">نوع عملیات</th>
                                <th className="px-6 py-4">جزئیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-500" dir="ltr">{new Date(log.timestamp).toLocaleString('fa-IR')}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{log.userName}</td>
                                    <td className="px-6 py-4 text-blue-600 font-mono text-xs">{log.action}</td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={log.details}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
      
      {/* --- SETTINGS TAB --- */}
      {activeTab === 'SETTINGS' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl animate-fade-in">
              <h3 className="font-bold text-gray-700 text-lg mb-6">شخصی‌سازی سیستم</h3>
              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">عنوان سایت</label>
                      <input 
                        type="text" 
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">رنگ تم (اصلی)</label>
                      <div className="flex items-center gap-4">
                        <input 
                            type="color" 
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            className="h-12 w-24 rounded cursor-pointer border-0 p-0"
                        />
                        <span className="font-mono text-gray-500">{themeColor}</span>
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">لوگوی صفحه ورود</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                          <div className="w-24 h-24 border rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                              {logoUrl ? <img src={logoUrl} className="max-w-full max-h-full object-contain" /> : <span className="text-gray-300 text-xs">بدون لوگو</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => logoInputRef.current?.click()} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                                تغییر لوگو
                            </button>
                            {logoUrl && <button onClick={() => setLogoUrl('')} className="text-sm text-red-500 hover:underline px-4 py-2">حذف</button>}
                          </div>
                          <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                      </div>
                  </div>
                  <div className="pt-4 border-t">
                      <button onClick={saveSystemSettings} className="w-full sm:w-auto bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30">
                          ذخیره تنظیمات
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- User Edit/Add Modal --- */}
      {isUserModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">{editingUser ? 'ویرایش کاربر' : 'افزودن کاربر'}</h3>
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                      <input 
                        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="نام کامل" 
                        value={userFormData.fullName || ''} 
                        onChange={e => setUserFormData({...userFormData, fullName: e.target.value})} 
                        required 
                      />
                       <input 
                        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="سمت (مثال: مدیر فنی)" 
                        value={userFormData.position || ''} 
                        onChange={e => setUserFormData({...userFormData, position: e.target.value})} 
                        required 
                      />
                      <input 
                        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" 
                        placeholder="نام کاربری" 
                        value={userFormData.username || ''} 
                        onChange={e => setUserFormData({...userFormData, username: e.target.value})} 
                        required 
                      />
                      <input 
                        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" 
                        type="password" 
                        placeholder="رمز عبور" 
                        value={userFormData.password || ''} 
                        onChange={e => setUserFormData({...userFormData, password: e.target.value})} 
                        required={!editingUser} 
                      />
                      <select 
                        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white" 
                        value={userFormData.role} 
                        onChange={e => setUserFormData({...userFormData, role: e.target.value as Role})}
                      >
                          <option value={Role.EMPLOYEE}>کارمند</option>
                          <option value={Role.MANAGER}>مدیر</option>
                          <option value={Role.ADMIN}>ادمین سیستم</option>
                      </select>

                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">لغو</button>
                          <button type="submit" className="flex-1 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg shadow-md">ذخیره</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- Letter Edit Modal --- */}
      {isLetterModalOpen && editingLetter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-fade-in my-8">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h3 className="text-xl font-bold text-gray-800">ویرایش و ارجاع نامه</h3>
                      <button onClick={() => setIsLetterModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">موضوع نامه</label>
                              <input 
                                  type="text" 
                                  value={editingLetter.subject}
                                  onChange={(e) => setEditingLetter({...editingLetter, subject: e.target.value})}
                                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
                              />
                          </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">فرستنده اولیه</label>
                              <input 
                                  type="text" 
                                  value={editingLetter.senderName}
                                  disabled
                                  className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">متن نامه</label>
                          <textarea 
                              rows={6}
                              value={editingLetter.content}
                              onChange={(e) => setEditingLetter({...editingLetter, content: e.target.value})}
                              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
                          ></textarea>
                      </div>

                      <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                          <label className="block text-sm font-bold text-gray-700 mb-2">پیوست فایل</label>
                          <div className="flex items-center gap-4">
                              <input 
                                  type="file" 
                                  ref={letterFileInputRef}
                                  onChange={handleLetterFileChange}
                                  accept="application/pdf,image/*"
                                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-white file:text-primary-700 hover:file:bg-primary-50"
                              />
                              {editingLetter.attachment && (
                                  <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
                                      <span>📎 {editingLetter.attachment.name}</span>
                                      <button onClick={handleRemoveAttachment} className="text-red-500 hover:text-red-700 font-bold px-1">✕</button>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="border-t pt-4">
                          <label className="block text-sm font-bold text-gray-700 mb-2">مدیریت گیرندگان / ارجاع</label>
                          
                          {/* Current Recipients */}
                          <div className="flex flex-wrap gap-2 mb-4">
                              {editingLetter.recipients.map((r, idx) => (
                                  <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm border">
                                      <span>{r.userName}</span>
                                      <span className="text-xs text-gray-500">({r.role === 'SIGNER' ? 'امضا کننده' : 'رونوشت'})</span>
                                      <span className={`text-[10px] px-1 rounded ${r.status === 'APPROVED' ? 'bg-green-200' : 'bg-amber-200'}`}>{r.status}</span>
                                  </div>
                              ))}
                          </div>

                          {/* Add Recipient */}
                          <div className="flex gap-2 items-end bg-blue-50 p-3 rounded-xl">
                              <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 block">انتخاب کاربر جدید</label>
                                  <select 
                                      value={newRecipientId}
                                      onChange={(e) => setNewRecipientId(e.target.value)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                  >
                                      <option value="">انتخاب کنید...</option>
                                      {users.filter(u => u.id !== editingLetter.senderId && !editingLetter.recipients.find(r => r.userId === u.id)).map(u => (
                                          <option key={u.id} value={u.id}>{u.fullName} ({u.position})</option>
                                      ))}
                                  </select>
                              </div>
                              <div className="w-32">
                                  <label className="text-xs text-gray-500 mb-1 block">نقش</label>
                                  <select 
                                      value={newRecipientRole}
                                      onChange={(e) => setNewRecipientRole(e.target.value as RecipientRole)}
                                      className="w-full p-2 border rounded-lg text-sm"
                                  >
                                      <option value="VIEWER">رونوشت (مشاهده)</option>
                                      <option value="SIGNER">حق امضا</option>
                                  </select>
                              </div>
                              <button 
                                  onClick={handleAddRecipient}
                                  disabled={!newRecipientId}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                  افزودن
                              </button>
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                          <button onClick={() => setIsLetterModalOpen(false)} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl">انصراف</button>
                          <button onClick={handleSaveLetter} className="flex-1 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 font-bold">
                              ذخیره تغییرات
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};