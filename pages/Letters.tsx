import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../App';
import { dbService } from '../services/dbService';
import { draftLetterWithAI } from '../services/geminiService';
import { Letter, LetterStatus, Role, User, Attachment, LetterRecipient, RecipientRole } from '../types';

// Helper for image compression (Inline to keep file count same)
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
            resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compressing to 60% quality
        };
        img.onerror = () => resolve(base64Str); // Fallback
    });
};

export const Letters: React.FC = () => {
  const { user } = useAppContext();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [view, setView] = useState<'INBOX' | 'SENT' | 'CREATE'>('INBOX');
  const [users, setUsers] = useState<User[]>([]);
  
  // Create Letter State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-Recipient State
  const [selectedRecipients, setSelectedRecipients] = useState<{userId: string, role: RecipientRole}[]>([]);
  const [currentRecipientId, setCurrentRecipientId] = useState('');
  const [currentRole, setCurrentRole] = useState<RecipientRole>('SIGNER');

  // View Letter State
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  // Approval Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalAction, setApprovalAction] = useState<LetterStatus.APPROVED | LetterStatus.REJECTED>(LetterStatus.APPROVED);

  useEffect(() => {
    refreshData();
  }, [user]);

  const refreshData = () => {
    if (user) {
      setLetters(dbService.getUserLetters(user.id));
      setUsers(dbService.getAllUsers());
    }
  };

  const handleLetterClick = (letter: Letter) => {
      setSelectedLetter(letter);
      setShowPdfPreview(false);
      // Scroll to detail view on mobile
      if (window.innerWidth < 1024) {
          setTimeout(() => {
              detailRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  };

  const handleAddRecipient = () => {
      if (!currentRecipientId) return;
      if (selectedRecipients.some(r => r.userId === currentRecipientId)) {
          alert("این کاربر قبلاً اضافه شده است.");
          return;
      }
      setSelectedRecipients([...selectedRecipients, { userId: currentRecipientId, role: currentRole }]);
      setCurrentRecipientId('');
  };

  const handleRemoveRecipient = (userId: string) => {
      setSelectedRecipients(selectedRecipients.filter(r => r.userId !== userId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isImage = file.type.includes('image');
      const limit = isImage ? 5 * 1024 * 1024 : 500 * 1024; // 5MB for images (will be compressed), 500KB for PDF

      if (file.size > limit) {
          alert(isImage ? "حجم تصویر زیاد است." : "حجم فایل PDF نباید بیشتر از ۵۰۰ کیلوبایت باشد.");
          if (fileInputRef.current) fileInputRef.current.value = "";
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

              setAttachment({
                  name: file.name,
                  type: file.type,
                  size: file.size, // Original size for display
                  data: data
              });
          }
      };
      reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;

    // Safety check: User selected someone in dropdown but forgot to click 'Add'
    if (selectedRecipients.length === 0 && currentRecipientId) {
        alert("شما کاربری را در لیست انتخاب کردید اما دکمه 'افزودن' را نزنید. لطفاً ابتدا دکمه افزودن را بزنید تا گیرنده به لیست اضافه شود.");
        return;
    }

    if (!user || selectedRecipients.length === 0) {
        alert("لطفاً حداقل یک گیرنده را اضافه کنید.");
        return;
    }

    setIsSending(true);

    try {
        // Safer logic to build recipient list
        const recipientsList: LetterRecipient[] = [];
        for (const sr of selectedRecipients) {
            const u = users.find(user => user.id === sr.userId);
            if (u) {
                recipientsList.push({
                    userId: u.id,
                    userName: u.fullName,
                    role: sr.role,
                    status: LetterStatus.PENDING
                });
            }
        }
        
        if (recipientsList.length === 0) {
            throw new Error("No valid recipients found");
        }

        const newLetter: Letter = {
          id: Date.now().toString(),
          senderId: user.id,
          senderName: user.fullName,
          recipients: recipientsList,
          subject,
          content,
          status: LetterStatus.PENDING,
          createdAt: Date.now(),
          attachment: attachment
        };

        dbService.createLetter(newLetter);
        
        setSubject('');
        setContent('');
        setSelectedRecipients([]);
        setAttachment(undefined);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Ensure UI updates
        alert("نامه با موفقیت ارسال شد.");
        setView('SENT');
        refreshData();
    } catch (err) {
        console.error("Failed to send letter", err);
        alert("خطا در ارسال نامه. لطفاً بررسی کنید که آیا حجم فایل پیوست زیاد است یا حافظه مرورگر پر شده است.");
    } finally {
        setIsSending(false);
    }
  };

  const handleAiDraft = async () => {
    try {
        if (!user || !subject || selectedRecipients.length === 0) {
            alert("لطفاً موضوع و حداقل یک گیرنده را مشخص کنید.");
            return;
        }

        // Use filter(Boolean) to remove undefined/null values
        const recipientNames = selectedRecipients
            .map(sr => users.find(u => u.id === sr.userId)?.fullName)
            .filter(name => !!name)
            .join(' و ');

        setIsDrafting(true);
        const draft = await draftLetterWithAI(subject, user.fullName, recipientNames);
        
        if (draft.startsWith('خطا')) {
             alert(draft);
        } else {
             setContent(draft);
        }
    } catch (e) {
        console.error("AI Draft Error", e);
        alert("خطا در نگارش هوشمند. لطفا اتصال اینترنت خود را بررسی کنید.");
    } finally {
        setIsDrafting(false);
    }
  };

  const openApprovalModal = (action: LetterStatus.APPROVED | LetterStatus.REJECTED) => {
      setApprovalAction(action);
      setApprovalComment('');
      setShowApprovalModal(true);
  };

  const confirmApproval = () => {
      if(!user || !selectedLetter) return;
      
      try {
          dbService.signLetter(
              selectedLetter.id, 
              user.id, 
              user.fullName, 
              approvalAction, 
              approvalComment, 
              user.signatureImage
          );
          
          setShowApprovalModal(false);
          setSelectedLetter(null);
          refreshData();
      } catch (err) {
          alert("خطا در ثبت امضا (حافظه پر است).");
      }
  };

  const filteredLetters = letters.filter(l => {
    if (view === 'INBOX') {
        // Show if current user is a recipient
        return l.recipients && l.recipients.some(r => r.userId === user?.id);
    } 
    if (view === 'SENT') return l.senderId === user?.id;
    return false;
  });

  // Check if current user is a Signer and hasn't acted yet
  const canSign = selectedLetter && user && selectedLetter.recipients?.some(r => 
      r.userId === user.id && 
      r.role === 'SIGNER' && 
      r.status === LetterStatus.PENDING
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">کارتابل مکاتبات</h2>
        <button 
          onClick={() => { setView('CREATE'); setSelectedLetter(null); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <span>➕</span>
          <span>نامه جدید</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full sm:w-fit overflow-x-auto">
        <button onClick={() => { setView('INBOX'); setSelectedLetter(null); }} className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'INBOX' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-900'}`}>دریافتی</button>
        <button onClick={() => { setView('SENT'); setSelectedLetter(null); }} className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'SENT' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-900'}`}>ارسالی</button>
      </div>

      {view === 'CREATE' && (
        <div className="bg-white p-4 lg:p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <h3 className="text-lg font-bold mb-6 text-gray-700">ایجاد نامه جدید</h3>
          <form onSubmit={handleCreate} className="space-y-6 max-w-4xl">
            
            {/* Recipient Builder */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">گیرندگان نامه</label>
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                    <select 
                        value={currentRecipientId}
                        onChange={(e) => setCurrentRecipientId(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="">انتخاب کاربر...</option>
                        {users.filter(u => u.id !== user?.id).map(u => (
                            <option key={u.id} value={u.id}>{u.fullName} ({u.position})</option>
                        ))}
                    </select>
                    <select 
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value as RecipientRole)}
                        className="w-full md:w-40 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="SIGNER">حق امضا (تایید)</option>
                        <option value="VIEWER">رونوشت (مشاهده)</option>
                    </select>
                    <button type="button" onClick={handleAddRecipient} className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700">افزودن</button>
                </div>
                
                {selectedRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedRecipients.map(sr => {
                            const u = users.find(user => user.id === sr.userId);
                            return (
                                <div key={sr.userId} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${sr.role === 'SIGNER' ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>
                                    <span>{u?.fullName}</span>
                                    <span className="text-xs opacity-75">({sr.role === 'SIGNER' ? 'امضا کننده' : 'رونوشت'})</span>
                                    <button type="button" onClick={() => handleRemoveRecipient(sr.userId)} className="hover:text-red-500 font-bold px-1">×</button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">موضوع</label>
                    <input 
                        required
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50"
                        placeholder="موضوع نامه..."
                    />
                </div>
            </div>

            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">متن نامه</label>
                    <button 
                        type="button"
                        onClick={handleAiDraft}
                        disabled={isDrafting}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center"
                    >
                        {isDrafting ? 'در حال نگارش...' : '✨ نگارش هوشمند با هوش مصنوعی'}
                    </button>
                </div>
                <textarea 
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-50"
                    placeholder="متن نامه را بنویسید..."
                ></textarea>
            </div>

            <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <label className="block text-sm font-medium text-gray-700 mb-2">پیوست فایل (PDF یا تصویر)</label>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="application/pdf,image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                />
                <p className="text-xs text-gray-400 mt-2">حداکثر حجم: تصویر (۵ مگابایت - فشرده می‌شود)، PDF (۵۰۰ کیلوبایت)</p>
                {attachment && (
                    <div className="mt-2 text-sm text-green-600 flex items-center gap-2 flex-wrap">
                        <span>📎 {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB) آماده ارسال</span>
                        <button type="button" onClick={() => {setAttachment(undefined); if(fileInputRef.current) fileInputRef.current.value = "";}} className="text-red-500 hover:text-red-700">حذف</button>
                    </div>
                )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setView('INBOX')} className="w-full sm:w-auto px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">انصراف</button>
                <button 
                    type="submit" 
                    disabled={isSending}
                    className={`w-full sm:w-auto px-8 py-2 text-white rounded-lg shadow-md transition-colors ${isSending ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                    {isSending ? 'در حال ارسال...' : 'ارسال نامه'}
                </button>
            </div>
          </form>
        </div>
      )}

      {(view === 'INBOX' || view === 'SENT') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-250px)]">
            {/* List */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 lg:overflow-y-auto max-h-[500px] lg:max-h-full overflow-y-auto">
                {filteredLetters.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">نامه‌ای موجود نیست.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredLetters.map(letter => (
                            <div 
                                key={letter.id} 
                                onClick={() => handleLetterClick(letter)}
                                className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedLetter?.id === letter.id ? 'bg-blue-50 border-r-4 border-primary-500' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-gray-800 truncate flex items-center gap-2">
                                        {letter.subject}
                                        {letter.attachment && <span title="دارای پیوست">📎</span>}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        letter.status === LetterStatus.APPROVED ? 'bg-green-100 text-green-700' :
                                        letter.status === LetterStatus.REJECTED ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {letter.status === LetterStatus.APPROVED ? 'تایید شده' : 
                                         letter.status === LetterStatus.REJECTED ? 'رد شده' : 'در جریان'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>از: {letter.senderName}</span>
                                    <span>{new Date(letter.createdAt).toLocaleDateString('fa-IR')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail View */}
            <div ref={detailRef} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-8 lg:overflow-y-auto">
                {selectedLetter ? (
                    <div className="relative min-h-full flex flex-col">
                        <div className="border-b pb-4 mb-6">
                            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">{selectedLetter.subject}</h1>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                                <p><span className="font-bold">فرستنده:</span> {selectedLetter.senderName}</p>
                                <p><span className="font-bold">تاریخ:</span> {new Date(selectedLetter.createdAt).toLocaleString('fa-IR')}</p>
                                <p className="col-span-1 sm:col-span-2">
                                    <span className="font-bold">گیرندگان:</span> 
                                    <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedLetter.recipients?.map(r => (
                                        <span key={r.userId} className="mr-1 inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 border text-gray-600">
                                            {r.userName} ({r.role === 'SIGNER' ? 'امضا کننده' : 'رونوشت'})
                                        </span>
                                    ))}
                                    </div>
                                </p>
                            </div>
                        </div>

                        {/* Letter Content */}
                        <div className="whitespace-pre-wrap text-gray-800 leading-8 text-justify pl-4 min-h-[100px] mb-8">
                            {selectedLetter.content}
                        </div>

                        <div className="flex-1"></div>

                        {/* Attachment and Signatures (Footer Area) */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mt-auto">
                            
                            {/* Attachment Section */}
                            {selectedLetter.attachment && (
                                <div className="mb-8 border-b pb-6">
                                    <h4 className="text-sm font-bold text-gray-500 mb-3">پیوست‌های نامه</h4>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl w-full border border-gray-200">
                                            <div className="bg-red-500 text-white p-2 rounded-lg">
                                                📄
                                            </div>
                                            <div className="flex-1 text-right overflow-hidden">
                                                <p className="font-bold text-slate-700 truncate">{selectedLetter.attachment.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {selectedLetter.attachment.type.includes('pdf') ? 'سند PDF' : 'تصویر'} - 
                                                    {(selectedLetter.attachment.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <a 
                                                    href={selectedLetter.attachment.data} 
                                                    download={selectedLetter.attachment.name}
                                                    className="text-xs sm:text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <span>⬇️</span>
                                                    <span>دانلود</span>
                                                </a>
                                                <button 
                                                    onClick={() => setShowPdfPreview(!showPdfPreview)}
                                                    className="text-xs sm:text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1 rounded-lg transition-colors"
                                                >
                                                    {showPdfPreview ? 'بستن' : 'مشاهده'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {showPdfPreview && (
                                            <div className="mt-2 p-4 flex justify-center bg-slate-200 rounded-xl border border-slate-300 animate-fade-in">
                                                {selectedLetter.attachment.type.includes('image') ? (
                                                    <img src={selectedLetter.attachment.data} alt="attachment" className="max-h-96 rounded shadow-lg" />
                                                ) : selectedLetter.attachment.type === 'application/pdf' ? (
                                                    <iframe src={selectedLetter.attachment.data} className="w-full h-[300px] lg:h-[500px] rounded shadow-lg bg-white" title="PDF Preview"></iframe>
                                                ) : (
                                                    <div className="text-gray-500 py-8">پیش‌نمایش برای این نوع فایل موجود نیست.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Signatures List */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 mb-3">امضاها و هامش‌ها</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedLetter.recipients?.filter(r => r.status === LetterStatus.APPROVED).map(signer => (
                                        <div key={signer.userId} className="border-2 border-green-600 text-green-700 p-3 rounded-xl bg-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-bl">امضا شده</div>
                                            <div className="h-14 flex items-center justify-center my-1">
                                                {signer.signatureImage ? (
                                                    <img src={signer.signatureImage} alt="signature" className="max-h-full max-w-full mix-blend-multiply" />
                                                ) : (
                                                    <p className="font-dancing text-xl italic">{signer.userName}</p>
                                                )}
                                            </div>
                                            <div className="text-center text-xs border-t border-green-200 pt-1">
                                                <p className="font-bold">{signer.userName}</p>
                                                <p className="text-[10px] text-gray-500">{signer.actionDate ? new Date(signer.actionDate).toLocaleDateString('fa-IR') : ''}</p>
                                            </div>
                                            {signer.comment && <div className="mt-2 text-[10px] bg-green-50 p-1 rounded text-green-800">✍️ {signer.comment}</div>}
                                        </div>
                                    ))}
                                    {/* Rejected status display */}
                                    {selectedLetter.recipients?.filter(r => r.status === LetterStatus.REJECTED).map(signer => (
                                        <div key={signer.userId} className="border-2 border-red-600 text-red-700 p-3 rounded-xl bg-red-50 relative">
                                            <p className="font-bold text-center text-lg mt-2">مردود توسط {signer.userName}</p>
                                            {signer.comment && <p className="text-xs mt-2 text-center">علت: {signer.comment}</p>}
                                        </div>
                                    ))}
                                    {selectedLetter.recipients?.filter(r => r.status === LetterStatus.APPROVED || r.status === LetterStatus.REJECTED).length === 0 && (
                                        <p className="text-xs text-gray-400 italic col-span-2 text-center py-4">هنوز امضایی ثبت نشده است.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons (Only for current user if they are a Signer and Pending) */}
                        {canSign && (
                            <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row gap-4 justify-end">
                                <button 
                                    onClick={() => openApprovalModal(LetterStatus.REJECTED)}
                                    className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-6 py-2 rounded-lg transition-colors border border-red-200 w-full sm:w-auto"
                                >
                                    رد درخواست
                                </button>
                                <button 
                                    onClick={() => openApprovalModal(LetterStatus.APPROVED)}
                                    className="bg-green-600 text-white hover:bg-green-700 px-6 py-2 rounded-lg shadow-lg shadow-green-600/30 transition-colors w-full sm:w-auto"
                                >
                                    امضا و تایید
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 py-12">
                        <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <p>لطفاً یک نامه را برای مشاهده انتخاب کنید</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                  <h3 className={`text-xl font-bold mb-4 ${approvalAction === LetterStatus.APPROVED ? 'text-green-600' : 'text-red-600'}`}>
                      {approvalAction === LetterStatus.APPROVED ? 'تایید و امضای نامه' : 'رد درخواست نامه'}
                  </h3>
                  
                  {approvalAction === LetterStatus.APPROVED && !user?.signatureImage && (
                      <div className="mb-4 bg-amber-50 text-amber-800 text-sm p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                          <span>⚠️</span>
                          <p>شما هنوز امضای تصویری تنظیم نکرده‌اید. نام شما به صورت متنی درج خواهد شد.</p>
                      </div>
                  )}

                  {approvalAction === LetterStatus.APPROVED && user?.signatureImage && (
                       <div className="mb-4">
                           <p className="text-sm text-gray-500 mb-1">امضای شما:</p>
                           <img src={user.signatureImage} className="h-16 border rounded bg-white p-1" alt="signature" />
                       </div>
                  )}

                  <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          {approvalAction === LetterStatus.APPROVED ? 'توضیحات / هامش (اختیاری)' : 'علت رد درخواست (الزامی)'}
                      </label>
                      <textarea 
                        rows={4}
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder={approvalAction === LetterStatus.APPROVED ? 'مثال: اقدام شود...' : 'لطفاً علت رد را بنویسید...'}
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                      ></textarea>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setShowApprovalModal(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">انصراف</button>
                      <button 
                        onClick={confirmApproval}
                        disabled={approvalAction === LetterStatus.REJECTED && !approvalComment.trim()}
                        className={`flex-1 py-2 text-white rounded-lg shadow-md ${
                            approvalAction === LetterStatus.APPROVED 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                        }`}
                      >
                          ثبت نهایی
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};