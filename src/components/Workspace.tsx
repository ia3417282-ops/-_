import React, { useState, useRef, useEffect } from 'react';
import { Download, Share2, Save, FileText, Trello, Ticket, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Workspace() {
  const [activeTab, setActiveTab] = useState('notes');
  
  // Notes State
  const editorRef = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState<'rtl' | 'ltr'>('rtl');
  const [isSaved, setIsSaved] = useState(true);

  // Data
  const workspaces = useLiveQuery(() => db.workspaces.toArray()) || [];
  const documents = useLiveQuery(() => db.documents.toArray()) || [];
  const employees = useLiveQuery(() => db.employees.toArray()) || [];

  // Kanban State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const kanbanTasks = workspaces.filter(w => w.type === 'kanban');

  // Ticket State
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketContent, setNewTicketContent] = useState('');
  const tickets = workspaces.filter(w => w.type === 'ticket');

  // DMS State
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  useEffect(() => {
    if (activeTab === 'notes') {
      const savedContent = localStorage.getItem('aamali_workspace_content');
      const savedDir = localStorage.getItem('aamali_workspace_dir');
      
      if (savedContent && editorRef.current) {
        editorRef.current.innerHTML = savedContent;
      }
      if (savedDir === 'rtl' || savedDir === 'ltr') {
        setDir(savedDir);
      }
    }
  }, [activeTab]);

  // Notes Functions
  const handleInput = () => setIsSaved(false);
  const saveContent = () => {
    if (editorRef.current) {
      localStorage.setItem('aamali_workspace_content', editorRef.current.innerHTML);
      localStorage.setItem('aamali_workspace_dir', dir);
      setIsSaved(true);
    }
  };
  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };
  const handleDownload = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerText || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مستند_مساحة_العمل_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleShare = async () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerText || '';
    if (navigator.share) {
      try { await navigator.share({ title: 'مستند من Aamali ERP', text: content }); } 
      catch (error) { console.error('Error sharing:', error); }
    } else {
      alert('ميزة المشاركة غير مدعومة في هذا المتصفح. يمكنك نسخ النص أو تنزيله.');
    }
  };

  // Kanban Functions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    await db.workspaces.add({
      type: 'kanban',
      title: newTaskTitle,
      status: 'todo',
      dueDate: new Date().toISOString()
    });
    setNewTaskTitle('');
  };
  const updateTaskStatus = async (id: number, status: string) => {
    await db.workspaces.update(id, { status });
  };
  const deleteTask = async (id: number) => {
    await db.workspaces.delete(id);
  };

  // Ticket Functions
  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketContent) return;
    await db.workspaces.add({
      type: 'ticket',
      title: newTicketTitle,
      content: newTicketContent,
      status: 'open',
      dueDate: new Date().toISOString()
    });
    setNewTicketTitle('');
    setNewTicketContent('');
  };

  // DMS Functions
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docFile) return;

    // In a real app, we'd upload to a server. Here we just store metadata and a local object URL (which expires, but works for demo).
    const url = URL.createObjectURL(docFile);
    
    await db.documents.add({
      title: docTitle,
      fileType: docFile.type || 'unknown',
      uploadDate: new Date().toISOString(),
      size: docFile.size,
      url: url
    });

    setDocTitle('');
    setDocFile(null);
  };

  const deleteDoc = async (id: number) => {
    await db.documents.delete(id);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'notes' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FileText size={18} /> الملاحظات والمسودات</button>
        <button onClick={() => setActiveTab('kanban')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'kanban' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Trello size={18} /> لوحة المهام (Kanban)</button>
        <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Ticket size={18} /> التذاكر الداخلية</button>
        <button onClick={() => setActiveTab('dms')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'dms' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FolderOpen size={18} /> الأرشيف (DMS)</button>
      </div>

      {activeTab === 'notes' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-indigo-900">الملاحظات والمسودات</h2>
              <p className="text-sm text-gray-500">مساحة لكتابة الملاحظات، المهام، أو مسودات العقود. يتم حفظها محلياً.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={saveContent} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${isSaved ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                <Save size={18} /> {isSaved ? 'تم الحفظ' : 'حفظ'}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-bold">
                <Download size={18} /> تنزيل
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-bold">
                <Share2 size={18} /> مشاركة
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <button onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded font-bold w-10 h-10 flex items-center justify-center transition-colors" title="عريض">B</button>
                <button onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded italic w-10 h-10 flex items-center justify-center transition-colors" title="مائل">I</button>
                <button onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded underline w-10 h-10 flex items-center justify-center transition-colors" title="تسطير">U</button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-200 rounded w-10 h-10 flex items-center justify-center transition-colors" title="محاذاة لليسار">⫷</button>
                <button onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-200 rounded w-10 h-10 flex items-center justify-center transition-colors" title="توسيط">≡</button>
                <button onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-200 rounded w-10 h-10 flex items-center justify-center transition-colors" title="محاذاة لليمين">⫸</button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded w-10 h-10 flex items-center justify-center transition-colors" title="قائمة رقمية">1.</button>
                <button onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded w-10 h-10 flex items-center justify-center transition-colors" title="قائمة نقطية">•</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setDir('rtl'); handleInput(); }} className={`px-3 py-1 text-sm font-bold rounded-lg transition-colors ${dir === 'rtl' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>عربي (RTL)</button>
                <button onClick={() => { setDir('ltr'); handleInput(); }} className={`px-3 py-1 text-sm font-bold rounded-lg transition-colors ${dir === 'ltr' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>English (LTR)</button>
              </div>
            </div>
            
            <div 
              ref={editorRef}
              onInput={handleInput}
              onBlur={saveContent}
              className="flex-1 p-6 outline-none overflow-y-auto text-lg leading-relaxed"
              contentEditable
              dir={dir}
              style={{ minHeight: '400px' }}
              data-placeholder="ابدأ الكتابة هنا..."
            ></div>
          </div>
        </>
      )}

      {activeTab === 'kanban' && (
        <div className="space-y-6 flex-1 flex flex-col">
          <form onSubmit={handleAddTask} className="flex gap-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="عنوان المهمة الجديدة..." className="flex-1 p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-bold flex items-center gap-2"><Plus size={18} /> إضافة مهمة</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {/* To Do */}
            <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-3">
              <h3 className="font-bold text-gray-700 flex items-center justify-between">
                <span>قيد الانتظار (To Do)</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{kanbanTasks.filter(t => t.status === 'todo').length}</span>
              </h3>
              {kanbanTasks.filter(t => t.status === 'todo').map(task => (
                <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 group">
                  <p className="font-semibold text-gray-800 mb-2">{task.title}</p>
                  <div className="flex justify-between items-center mt-2">
                    <button onClick={() => updateTaskStatus(task.id!, 'in_progress')} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold">بدء العمل &larr;</button>
                    <button onClick={() => deleteTask(task.id!)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>

            {/* In Progress */}
            <div className="bg-blue-50 rounded-xl p-4 flex flex-col gap-3 border border-blue-100">
              <h3 className="font-bold text-blue-800 flex items-center justify-between">
                <span>قيد التنفيذ (In Progress)</span>
                <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">{kanbanTasks.filter(t => t.status === 'in_progress').length}</span>
              </h3>
              {kanbanTasks.filter(t => t.status === 'in_progress').map(task => (
                <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-blue-200 group">
                  <p className="font-semibold text-gray-800 mb-2">{task.title}</p>
                  <div className="flex justify-between items-center mt-2">
                    <button onClick={() => updateTaskStatus(task.id!, 'todo')} className="text-xs text-gray-500 hover:text-gray-700 font-bold">&rarr; تراجع</button>
                    <button onClick={() => updateTaskStatus(task.id!, 'done')} className="text-xs text-green-600 hover:text-green-800 font-bold">إنجاز &larr;</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Done */}
            <div className="bg-green-50 rounded-xl p-4 flex flex-col gap-3 border border-green-100">
              <h3 className="font-bold text-green-800 flex items-center justify-between">
                <span>مكتمل (Done)</span>
                <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">{kanbanTasks.filter(t => t.status === 'done').length}</span>
              </h3>
              {kanbanTasks.filter(t => t.status === 'done').map(task => (
                <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-green-200 group opacity-75">
                  <p className="font-semibold text-gray-800 line-through mb-2">{task.title}</p>
                  <div className="flex justify-between items-center mt-2">
                    <button onClick={() => updateTaskStatus(task.id!, 'in_progress')} className="text-xs text-blue-600 hover:text-blue-800 font-bold">&rarr; إعادة فتح</button>
                    <button onClick={() => deleteTask(task.id!)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-6">
          <form onSubmit={handleAddTicket} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">فتح تذكرة دعم داخلي</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان التذكرة</label>
                <input type="text" value={newTicketTitle} onChange={(e) => setNewTicketTitle(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">التفاصيل</label>
                <textarea value={newTicketContent} onChange={(e) => setNewTicketContent(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500 h-24" required></textarea>
              </div>
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-bold flex items-center justify-center gap-2">
              <Plus size={20} /> إرسال التذكرة
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">رقم التذكرة</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">العنوان</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">التاريخ</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">الحالة</th>
                  <th className="py-3 px-4 border-b text-center font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b font-bold text-indigo-600" dir="ltr">#{ticket.id}</td>
                    <td className="py-3 px-4 border-b font-bold">{ticket.title}</td>
                    <td className="py-3 px-4 border-b" dir="ltr">{new Date(ticket.dueDate).toLocaleString('ar-EG')}</td>
                    <td className="py-3 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {ticket.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <div className="flex justify-center gap-2">
                        {ticket.status === 'open' && (
                          <button onClick={() => updateTaskStatus(ticket.id!, 'closed')} className="text-green-600 hover:text-green-800 font-bold text-xs bg-green-50 px-2 py-1 rounded">إغلاق</button>
                        )}
                        <button onClick={() => deleteTask(ticket.id!)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">لا توجد تذاكر مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dms' && (
        <div className="space-y-6">
          <form onSubmit={handleUploadDoc} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">أرشفة مستند جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستند</label>
                <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الملف</label>
                <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="w-full p-1.5 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-bold flex items-center justify-center gap-2">
              <Plus size={20} /> رفع وأرشفة
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">اسم المستند</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">النوع</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">الحجم</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">تاريخ الرفع</th>
                  <th className="py-3 px-4 border-b text-center font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b font-bold">{doc.title}</td>
                    <td className="py-3 px-4 border-b text-gray-500" dir="ltr">{doc.fileType}</td>
                    <td className="py-3 px-4 border-b text-gray-500" dir="ltr">{(doc.size / 1024).toFixed(2)} KB</td>
                    <td className="py-3 px-4 border-b" dir="ltr">{new Date(doc.uploadDate).toLocaleString('ar-EG')}</td>
                    <td className="py-3 px-4 border-b text-center">
                      <div className="flex justify-center gap-2">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-bold text-xs bg-indigo-50 px-2 py-1 rounded">عرض / تحميل</a>
                        <button onClick={() => deleteDoc(doc.id!)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">لا توجد مستندات مؤرشفة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
