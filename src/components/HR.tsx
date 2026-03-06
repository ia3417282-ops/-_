import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function HR() {
  const [tab, setTab] = useState('employees');
  const employees = useLiveQuery(() => db.employees.toArray());
  const attendance = useLiveQuery(() => db.attendance.toArray());
  const payroll = useLiveQuery(() => db.payroll.toArray());
  const leaveRequests = useLiveQuery(() => db.leaveRequests?.toArray());
  const deductionsList = useLiveQuery(() => db.deductions?.toArray());

  const [name, setName] = useState('');
  const [position, setPosition] = useState('موظف');
  const [employeeType, setEmployeeType] = useState('دوام كامل');
  const [salary, setSalary] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('الإدارة العامة');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  // Leave Request State
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('سنوية');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Deduction State
  const [dedEmpId, setDedEmpId] = useState('');
  const [dedType, setDedType] = useState('خصم غياب');
  const [dedAmount, setDedAmount] = useState('');
  const [dedReason, setDedReason] = useState('');

  const jobTitles = [
    'مدير عام', 'مدير تنفيذي', 'مدير مالي', 'مدير تسويق', 'مدير مبيعات', 'محاسب', 
    'محاسب قانوني', 'محاسب تكاليف', 'مدير موارد بشرية', 'أخصائي توظيف', 'أخصائي تدريب',
    'مدير تقنية معلومات', 'مطور برمجيات (Frontend)', 'مطور برمجيات (Backend)', 'مطور برمجيات (Fullstack)',
    'مهندس نظم', 'مدير قواعد بيانات', 'مصمم جرافيك', 'مصمم واجهات (UI/UX)', 'مندوب مبيعات', 
    'مشرف مبيعات', 'أمين مستودع', 'موظف استقبال', 'سكرتير تنفيذي', 'فني تقني', 'عامل', 'سائق', 
    'حارس أمن', 'عامل نظافة', 'منسق إداري', 'مدير جودة', 'محلل بيانات'
  ];

  const employeeTypes = [
    'دوام كامل', 'دوام جزئي', 'عقد سنوي', 'عقد سنتين', 'عقد مؤقت', 
    'تدريب (Intern)', 'عن بعد (Remote)', 'بالساعة', 'عمل حر (Freelance)'
  ];

  const departments = [
    'الإدارة العامة', 'المالية والمحاسبة', 'المبيعات', 'المشتريات', 'المخازن والمستودعات', 
    'تقنية المعلومات', 'الموارد البشرية', 'التسويق والإعلام', 'الصيانة والتشغيل', 
    'الخدمات اللوجستية', 'إدارة الجودة', 'خدمة العملاء', 'الشؤون القانونية', 'البحث والتطوير'
  ];

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !position || !salary) return;
    await db.employees.add({
      name,
      position,
      type: employeeType,
      salary: Number(salary),
      phone,
      department,
      joiningDate,
      status: 'نشط'
    });
    setName('');
    setSalary('');
    setPhone('');
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
    setLeaveEmpId('');
    setLeaveStart('');
    setLeaveEnd('');
    setLeaveReason('');
  };

  const updateLeaveStatus = async (id: number, status: string) => {
    await db.leaveRequests.update(id, { status });
  };

  const deleteEmployee = async (id: number) => {
    await db.employees.delete(id);
  };

  const markAttendance = async (empId: number, status: string) => {
    await db.attendance.add({ 
      employeeId: empId, 
      date: new Date().toISOString().split('T')[0], 
      status 
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border-r-4 border-indigo-600 mb-4">
        <h3 className="text-lg font-bold text-indigo-900">قسم الموارد البشرية (HR)</h3>
        <p className="text-sm text-indigo-700">إدارة شاملة لشؤون الموظفين، الحضور والانصراف، مسير الرواتب، وإدارة الإجازات والمناصب الوظيفية.</p>
      </div>

      <div className="flex gap-4 border-b pb-2 overflow-x-auto">
        <button onClick={() => setTab('employees')} className={`px-4 py-2 whitespace-nowrap ${tab === 'employees' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>سجل الموظفين</button>
        <button onClick={() => setTab('attendance')} className={`px-4 py-2 whitespace-nowrap ${tab === 'attendance' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>إدارة الحضور</button>
        <button onClick={() => setTab('leaves')} className={`px-4 py-2 whitespace-nowrap ${tab === 'leaves' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>إدارة الإجازات</button>
        <button onClick={() => setTab('payroll')} className={`px-4 py-2 whitespace-nowrap ${tab === 'payroll' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>مسير الرواتب</button>
      </div>

      {tab === 'employees' && (
        <>
          <form onSubmit={addEmployee} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الموظف</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                {jobTitles.map(title => <option key={title} value={title}>{title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع التوظيف</label>
              <select value={employeeType} onChange={(e) => setEmployeeType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                {employeeTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الجوال</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الأساسي</label>
              <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التعيين</label>
              <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">إضافة موظف</button>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الاسم</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">المسمى</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">النوع</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">القسم</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الراتب</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الحالة</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b text-sm font-bold">{emp.name}</td>
                    <td className="py-3 px-4 border-b text-sm">{emp.position}</td>
                    <td className="py-3 px-4 border-b text-sm">{emp.type}</td>
                    <td className="py-3 px-4 border-b text-sm">{emp.department}</td>
                    <td className="py-3 px-4 border-b text-sm">{emp.salary}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{emp.status}</span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm">
                      <button onClick={() => deleteEmployee(emp.id)} className="text-red-600 hover:text-red-800">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'leaves' && (
        <div className="space-y-6">
          <form onSubmit={addLeaveRequest} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموظف</label>
              <select value={leaveEmpId} onChange={(e) => setLeaveEmpId(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required>
                <option value="">اختر موظف...</option>
                {employees?.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع الإجازة</label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                <option value="سنوية">سنوية</option>
                <option value="مرضية">مرضية</option>
                <option value="اضطرارية">اضطرارية</option>
                <option value="بدون راتب">بدون راتب</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
              <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
              <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">تقديم طلب</button>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الموظف</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">النوع</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الفترة</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الحالة</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests?.map((leave) => {
                  const emp = employees?.find(e => e.id === leave.employeeId);
                  return (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b text-sm">{emp?.name || 'غير معروف'}</td>
                      <td className="py-3 px-4 border-b text-sm">{leave.type}</td>
                      <td className="py-3 px-4 border-b text-sm">{leave.startDate} إلى {leave.endDate}</td>
                      <td className="py-3 px-4 border-b text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          leave.status === 'مقبول' ? 'bg-green-100 text-green-800' : 
                          leave.status === 'مرفوض' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>{leave.status}</span>
                      </td>
                      <td className="py-3 px-4 border-b text-sm flex gap-2">
                        {leave.status === 'قيد الانتظار' && (
                          <>
                            <button onClick={() => updateLeaveStatus(leave.id, 'مقبول')} className="text-green-600 hover:underline">قبول</button>
                            <button onClick={() => updateLeaveStatus(leave.id, 'مرفوض')} className="text-red-600 hover:underline">رفض</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الموظف</th>
                <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">القسم</th>
                <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">تسجيل اليوم ({new Date().toISOString().split('T')[0]})</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => {
                const todayRecord = attendance?.find(a => a.employeeId === emp.id && a.date === new Date().toISOString().split('T')[0]);
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b text-sm">{emp.name}</td>
                    <td className="py-3 px-4 border-b text-sm">{emp.department}</td>
                    <td className="py-3 px-4 border-b text-sm flex gap-2">
                      {todayRecord ? (
                        <span className={`px-2 py-1 rounded text-xs ${todayRecord.status === 'حاضر' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {todayRecord.status}
                        </span>
                      ) : (
                        <>
                          <button onClick={() => markAttendance(emp.id, 'حاضر')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200">حاضر</button>
                          <button onClick={() => markAttendance(emp.id, 'غائب')} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-200">غائب</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
            <strong>نظام الرواتب المطور:</strong> يتم احتساب الراتب الصافي تلقائياً بناءً على: (الراتب الأساسي + البدلات) - (الخصومات + التأمينات).
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الموظف</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الراتب الأساسي</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">بدلات (سكن/نقل/إضافي)</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">خصومات (غياب/تأخير/جزاءات)</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">تأمينات (10%)</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الصافي</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {employees?.map((emp) => {
                  const [allowances, setAllowances] = useState(0);
                  const [deductions, setDeductions] = useState(0);
                  const insurance = emp.salary * 0.1;
                  const net = emp.salary + allowances - deductions - insurance;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b text-sm font-bold">{emp.name}</td>
                      <td className="py-3 px-4 border-b text-sm">{emp.salary.toLocaleString()}</td>
                      <td className="py-3 px-4 border-b text-sm text-green-600">
                        <input 
                          type="number" 
                          className="w-24 p-1 border rounded text-xs" 
                          value={allowances} 
                          onChange={(e) => setAllowances(Number(e.target.value))}
                        />
                      </td>
                      <td className="py-3 px-4 border-b text-sm text-red-600">
                        <input 
                          type="number" 
                          className="w-24 p-1 border rounded text-xs" 
                          value={deductions} 
                          onChange={(e) => setDeductions(Number(e.target.value))}
                        />
                      </td>
                      <td className="py-3 px-4 border-b text-sm text-red-400">
                        {insurance.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 border-b text-sm font-bold text-indigo-600">{net.toLocaleString()}</td>
                      <td className="py-3 px-4 border-b text-sm">
                        <button 
                          onClick={async () => {
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
                          }}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
                        >
                          اعتماد وصرف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
