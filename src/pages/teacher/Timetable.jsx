import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, doc, getDoc, setDoc } from "../../services/firebase";

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayShort = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat" };
const periods = Array.from({ length: 8 }, (_, i) => `Period ${i + 1}`);
const subjectOptions = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "Sanskrit", "History", "Geography", "Computer Science", "Physical Education", "Art", "Music"];
const teacherOptions = ["Anita Desai", "Rajesh Kumar", "Meena Joshi", "Sunita Sharma", "Vikram Rao", "-- Free --"];

const emptyCells = {};
for (const d of allDays) {
  for (const p of periods) {
    emptyCells[`${dayShort[d]}-${p}`] = { subject: "-- Free --", teacher: "-- Free --" };
  }
}

export default function Timetable() {
  const navigate = useNavigate();
  const [cells, setCells] = useState(emptyCells);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sidebar, setSidebar] = useState(null);
  const [picker, setPicker] = useState(null);
  const [form, setForm] = useState({ days: [], period: "", subject: "", teacher: "" });

  useEffect(() => { loadTimetable() }, []);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "timetables", "teacher_combined"));
      if (snap.exists()) {
        const data = snap.data().cells || {};
        const merged = { ...emptyCells };
        for (const key of Object.keys(data)) {
          if (merged[key] !== undefined) merged[key] = data[key];
        }
        setCells(merged);
      } else {
        setCells({ ...emptyCells });
      }
    } catch (err) {
      console.error("Failed to load timetable:", err);
    } finally { setLoading(false); }
  };

  const updateCell = (day, period, field, value) => {
    setCells(prev => ({ ...prev, [`${day}-${period}`]: { ...prev[`${day}-${period}`], [field]: value } }));
  };

  const handleAddEntry = () => {
    if (!form.days.length || !form.period || !form.subject) {
      return;
    }
    const updated = { ...cells };
    for (const day of form.days) {
      updated[`${dayShort[day]}-${form.period}`] = { subject: form.subject || "-- Free --", teacher: form.teacher || "-- Free --" };
    }
    setCells(updated);
    setForm({ days: [], period: "", subject: "", teacher: "" });
    setShowModal(false);
  };

  const saveToFirebase = async (newCells) => {
    try {
      await setDoc(doc(db, "timetables", "teacher_combined"), { cells: newCells ?? cells, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error("Failed to save timetable:", err);
    }
  };

  const toggleSelectAll = () => {
    setForm(prev => ({ ...prev, days: prev.days.length === allDays.length ? [] : [...allDays] }));
  };

  const toggleDay = (day) => {
    setForm(prev => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day] }));
  };

  const getCell = (day, period) => cells[`${day}-${period}`] || { subject: "-- Free --", teacher: "-- Free --" };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">&larr; Back</button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">My Timetable</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { saveToFirebase(); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors whitespace-nowrap">Save</button>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors whitespace-nowrap">+ Add Entry</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading timetable...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white dark:bg-gray-800 rounded-xl shadow">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-3 text-left text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">Period</th>
                  {allDays.map(d => <th key={d} className="p-3 text-center text-gray-500 dark:text-gray-400 font-medium min-w-[140px]">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {periods.map(p => (
                  <tr key={p} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <td className="p-3 text-gray-600 dark:text-gray-400 font-medium">{p}</td>
                    {allDays.map(d => {
                      const cell = getCell(dayShort[d], p);
                      return (
                        <td key={d} className="p-2 text-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          onClick={() => setSidebar({ day: d, dayShort: dayShort[d], period: p, subject: cell.subject, teacher: cell.teacher })}>
                          <div className="text-gray-900 dark:text-white font-medium">{cell.subject}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{cell.teacher}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Timetable Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>

            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Day(s)</label>
            <div className="flex items-center gap-2 mb-1">
              <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.days.length === allDays.length} onChange={toggleSelectAll} className="rounded border-gray-300 dark:border-gray-600" />
                Select All
              </label>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              {allDays.map(day => (
                <label key={day} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.days.includes(day)} onChange={() => toggleDay(day)} className="rounded border-gray-300 dark:border-gray-600" />
                  {day}
                </label>
              ))}
            </div>

            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Period</label>
            <div className="flex gap-2 mb-4">
              <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="e.g. Period 1" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
              <button onClick={() => setPicker("period")} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm" title="Browse periods">☰</button>
            </div>

            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</label>
            <div className="flex gap-2 mb-4">
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Type or select subject" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
              <button onClick={() => setPicker("subject")} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm" title="Browse subjects">☰</button>
            </div>

            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teacher</label>
            <div className="flex gap-2 mb-4">
              <input value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} placeholder="Type or select teacher" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" />
              <button onClick={() => setPicker("teacher")} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm" title="Browse teachers">☰</button>
            </div>

            <div className="flex gap-2">
              <button onClick={handleAddEntry} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">Add Entry</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {picker && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setPicker(null)}>
          <div className="w-full max-w-xs bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">Select {picker}</h3>
              <button onClick={() => setPicker(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-2">
              {(picker === "period" ? periods : picker === "subject" ? subjectOptions : teacherOptions).map(opt => (
                <button key={opt} onClick={() => {
                  setForm(f => ({ ...f, [picker]: opt }));
                  setPicker(null);
                }} className="w-full text-left px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition">{opt}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {sidebar && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSidebar(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cell Details</h2>
              <button onClick={() => setSidebar(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Day</label>
                <p className="text-sm text-gray-900 dark:text-white">{sidebar.day} ({sidebar.dayShort})</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Period</label>
                <p className="text-sm text-gray-900 dark:text-white">{sidebar.period}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</label>
                <div className="flex gap-2">
                  <input value={sidebar.subject} onChange={e => {
                    const v = e.target.value;
                    setSidebar(s => ({ ...s, subject: v }));
                    updateCell(sidebar.dayShort, sidebar.period, "subject", v);
                  }} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => setPicker("subject")} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm" title="Browse subjects">☰</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teacher</label>
                <div className="flex gap-2">
                  <input value={sidebar.teacher} onChange={e => {
                    const v = e.target.value;
                    setSidebar(s => ({ ...s, teacher: v }));
                    updateCell(sidebar.dayShort, sidebar.period, "teacher", v);
                  }} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => setPicker("teacher")} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm" title="Browse teachers">☰</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
