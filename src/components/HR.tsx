import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db'; // تأكد من أن مسار قاعدة البيانات صحيح
import { UserPlus, CalendarCheck, FileSpreadsheet, Banknote, CheckCircle, XCircle } from 'lucide-react';

// --- مكونات مساعدة ---

// مكون أزرار التبويبات
function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-all ${active ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-indigo-400'}`}
    >
      {icon} {label}
    </button>
  );
}

// مكون صف مسير الرواتب (لإصلاح خطأ استخدام Hooks داخل حلقة Map)
function PayrollRow({ emp }: { emp: any }) {
  const [allowances, setAllowances] = useState(0);
  const [deductions, setDeductions] = useState(0);
  
  const insurance = emp.salary * 0.1; // 10% تأمينات
  const net = emp.salary + allowances - deductions - insurance;

  const handlePay = async () => {
    await db.payroll.add({
      employeeId: emp.id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basic: emp.salary,
      allowances,
      deductions,
      insurance,
      net,
      status: 'مدفوع',
      date: new Date().toISOString()
    });
    alert(`تم اعتماد وصرف راتب ${emp.name} بنجاح`);
  };

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-100">
      <td className="py-3 px-4 text-sm font-bold">{emp.name}</td>
      <td className="py-3 px-4 text-sm">{emp.salary.toLocaleString()}</td>
      <td className="py-3 px-4 text-sm text-green-600">
        <input 
          type="number" 
          className="w-24 p-1 border rounded text-xs focus:ring-indigo-500 focus:border-indigo-500" 
          value={allowances} 
          onChange={(e) => setAllowances(Number(e.target.value))}
        />
      </td>
      <td className="py-3 px-4 text-sm text-red-600">
        <input 
          type="number" 
          className="w-24 p-1 border rounded text-xs focus:ring-indigo-500 focus:border-indigo-500" 
          value={deductions} 
          onChange={(e) => setDeductions(Number(e.target.value))}
        />
      </td>
      <td className="py-3 px-4 text-sm text-red-400">{insurance.toFixed(2)}</td>
      <td className="py-3 px-4 text-sm font-bold text-indigo-600">{net.toLocaleString()}</td>
      <td className="py-3 px-4 text-sm">
        <button 
          onClick={handlePay}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 transition-colors"
        >
          اعتماد وصرف
        </button>
      </td>
    </tr>
  );
}

// --- المكون الرئيسي للموارد البشرية ---
export default function HR() {
  const [tab, setTab] = useState('employees');
  
  // استدعاء البيانات من Dexie DB
  const employees = useLiveQuery(() => db.employees?.toArray()) || [];
  const attendance = useLiveQuery(() => db.attendance?.toArray()) || [];
  const leaveRequests = useLiveQuery(() => db.leaveRequests?.toArray()) || [];

  // حالات نموذج إضافة موظف
  const [name, setName] = useState('');
  const [position, setPosition] = useState('موظف');
  const [employeeType, setEmployeeType] = useState('دوام كامل');
  const [salary, setSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('الإدارة العامة');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  // حالات نموذج الإجازات
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('سنوية');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // القوائم المنسدلة
  const jobTitles = [
    'مدير عام', 'مدير تنفيذي', 'مدير مالي', 'محاسب', 'مدير موارد بشرية',
    'مطور برمجيات', 'مصمم جرافيك', 'مندوب مبيعات', 'أمين مستودع', 
    'موظف استقبال', 'سكرتير', 'عامل', 'سائق', 'حارس أمن'
  ];

  const employeeTypes = ['دوام كامل', 'دوام جزئي', 'عقد سنوي', 'عن بعد (Remote)', 'بالساعة', 'عمل حر'];
  
  const departments = [
    'الإدارة العامة', 'المالية والمحاسبة', 'المبيعات', 'المخازن والمستودعات', 
    'تقنية المعلومات', 'الموارد البشرية', 'التسويق', 'خدمة العملاء'
  ];

  // --- الوظائف (Functions) ---

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !salary) return;
    await db.employees.add({ 
      name, position, type: employeeType, salary: Number(salary), 
      phone, department, joiningDate, status: 'نشط' 
    });
    setName(''); setSalary(''); setPhone('');
  };

  const deleteEmployee = async (id: number) => {
    if(window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      await db.employees.delete(id);
    }
  };

  const markAttendance = async (empId: number, status: string) => {
    await db.attendance.add({
      employeeId: empId,
      date: new Date().toISOString().split('T')[0],
      status: status
    });
  };

  const addLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmpId || !leaveStart || !leaveEnd) return;
    await db.leaveRequests.add({
      employeeId: Number(leaveEmpId),
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason,
      status: 'قيد الانتظار'
    });
    setLeaveEmpId(''); setLeaveStart(''); setLeaveEnd(''); setLeaveReason('');
  };

  const updateLeaveStatus = async (id: number, status: string) => {
    await db.leaveRequests.update(id, { status });
  };

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div className="bg-indigo-50 p-4 rounded-lg border-r-4 border-indigo-600 mb-4">
        <h3 className="text-lg font-bold text-indigo-900">إدارة الكوادر البشرية (HR)</h3>
        <p className="text-sm text-indigo-700 mt-1">نظام متكامل لمتابعة الموظفين، الحضور والانصراف، مسير الرواتب، والإجازات.</p>
      </div>

      {/* التبويبات */}
      <div className="flex gap-4 border-b pb-2 overflow-x-auto bg-white sticky top-0 z-10 custom-scrollbar">
        <TabButton active={tab==='employees'} onClick={()=>setTab('employees')} icon={<UserPlus size={18}/>} label="سجل الموظفين" />
        <TabButton active={tab==='attendance'} onClick={()=>setTab('attendance')} icon={<CalendarCheck size={18}/>} label="الحضور والانصراف" />
        <TabButton active={tab==='leaves'} onClick={()=>setTab('leaves')} icon={<FileSpreadsheet size={18}/>} label="طلبات الإجازة" />
        <TabButton active={tab==='payroll'} onClick={()=>setTab('payroll')} icon={<Banknote size={18}/>} label="مسير الرواتب" />
      </div>

      {/* 1. سجل الموظفين */}
      {tab === 'employees' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={addEmployee} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">اسم الموظف</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">المسمى الوظيفي</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                {jobTitles.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">نوع التوظيف</label>
              <select value={employeeType} onChange={(e) => setEmployeeType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                {employeeTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">القسم</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">رقم الجوال</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">الراتب الأساسي</label>
              <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">تاريخ التعيين</label>
              <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 font-bold shadow transition-colors">إضافة الموظف</button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-right bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-600">الموظف</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">المنصب</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">القسم / النوع</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">الراتب</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">الحالة</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-t hover:bg-indigo-50 transition-colors">
                    <td className="p-3 font-bold text-sm">{emp.name}</td>
                    <td className="p-3 text-sm">{emp.position}</td>
                    <td className="p-3 text-xs text-gray-500">{emp.department} <br/> {emp.type}</td>
                    <td className="p-3 font-mono text-sm">{emp.salary} ر.س</td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{emp.status}</span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => deleteEmployee(emp.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">حذف</button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">لا يوجد موظفين حالياً</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. الحضور والانصراف */}
      {tab === 'attendance' && (
        <div className="space-y-4 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(emp => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayRecord = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);

              return (
                <div key={emp.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-bold text-gray-800">{emp.name}</h4>
                    <p className="text-xs text-gray-500">{emp.position} - {emp.department}</p>
                  </div>
                  <div className="flex gap-2">
                    {todayRecord ? (
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${todayRecord.status === 'حاضر' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                         تم تسجيل: {todayRecord.status}
                       </span>
                    ) : (
                      <>
                        <button onClick={() => markAttendance(emp.id, 'حاضر')} className="text-green-600 border border-green-600 p-1.5 rounded hover:bg-green-50 transition-colors flex items-center gap-1" title="تسجيل حضور"><CheckCircle size={18}/> <span className="text-xs">حاضر</span></button>
                        <button onClick={() => markAttendance(emp.id, 'غائب')} className="text-red-600 border border-red-600 p-1.5 rounded hover:bg-red-50 transition-colors flex items-center gap-1" title="تسجيل غياب"><XCircle size={18}/> <span className="text-xs">غائب</span></button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
         </div>
        </div>
      )}

      {/* 3. الإجازات */}
      {tab === 'leaves' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={addLeaveRequest} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end shadow-sm">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">الموظف</label>
              <select value={leaveEmpId} onChange={(e) => setLeaveEmpId(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required>
                <option value="">اختر موظف...</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">نوع الإجازة</label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                <option value="سنوية">سنوية</option>
                <option value="مرضية">مرضية</option>
                <option value="اضطرارية">اضطرارية</option>
                <option value="بدون راتب">بدون راتب</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">من تاريخ</label>
              <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-700">إلى تاريخ</label>
              <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 font-bold shadow transition-colors">تقديم طلب</button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full bg-white text-right">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b text-sm font-semibold text-gray-600">الموظف</th>
                  <th className="py-3 px-4 border-b text-sm font-semibold text-gray-600">النوع</th>
                  <th className="py-3 px-4 border-b text-sm font-semibold text-gray-600">الفترة</th>
                  <th className="py-3 px-4 border-b text-sm font-semibold text-gray-600">الحالة</th>
                  <th className="py-3 px-4 border-b text-sm font-semibold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((leave) => {
                  const emp = employees.find(e => e.id === leave.employeeId);
                  return (
                    <tr key={leave.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="py-3 px-4 text-sm font-bold">{emp?.name || 'غير معروف'}</td>
                      <td className="py-3 px-4 text-sm">{leave.type}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{leave.startDate} <span className="mx-1">إلى</span> {leave.endDate}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          leave.status === 'مقبول' ? 'bg-green-100 text-green-800' : 
                          leave.status === 'مرفوض' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>{leave.status}</span>
                      </td>
                      <td className="py-3 px-4 text-sm flex gap-2">
                        {leave.status === 'قيد الانتظار' && (
                          <>
                            <button onClick={() => updateLeaveStatus(leave.id, 'مقبول')} className="text-green-600 font-bold hover:underline">قبول</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => updateLeaveStatus(leave.id, 'مرفوض')} className="text-red-600 font-bold hover:underline">رفض</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                 {leaveRequests.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">لا توجد طلبات إجازة حالياً</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. مسير الرواتب */}
      {tab === 'payroll' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
            <strong>ملاحظة هامة:</strong> يتم احتساب الراتب الصافي تلقائياً بالمعادلة التالية: <br/>
            <span className="font-mono bg-white px-2 py-1 rounded mt-2 inline-block">(الراتب الأساسي + البدلات) - (الخصومات + التأمينات 10%)</span>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full bg-white text-right">
              <thead className="bg-indigo-900 text-white">
                <tr>
                  <th className="py-3 px-4 text-sm font-semibold">الموظف</th>
                  <th className="py-3 px-4 text-sm font-semibold">الأساسي</th>
                  <th className="py-3 px-4 text-sm font-semibold">بدلات/إضافي</th>
                  <th className="py-3 px-4 text-sm font-semibold">خصومات/غياب</th>
                  <th className="py-3 px-4 text-sm font-semibold">تأمينات (10%)</th>
                  <th className="py-3 px-4 text-sm font-semibold">الصافي</th>
                  <th className="py-3 px-4 text-sm font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  // استخدام المكون الفرعي الذي أنشأناه لحل مشكلة استخدام Hooks داخل map
                  <PayrollRow key={emp.id} emp={emp} />
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">أضف موظفين أولاً لإنشاء مسير الرواتب</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
