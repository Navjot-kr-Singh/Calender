// Indian Public Holidays 2026
// Format: 'YYYY-MM-DD'
export const PUBLIC_HOLIDAYS = [
  { date: '2026-01-01', name: "New Year's Day", type: 'holiday' },
  { date: '2026-01-14', name: 'Makar Sankranti / Pongal', type: 'holiday' },
  { date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { date: '2026-03-04', name: 'Maha Shivratri', type: 'holiday' },
  { date: '2026-03-20', name: 'Holi', type: 'holiday' },
  { date: '2026-03-30', name: 'Ram Navami', type: 'holiday' },
  { date: '2026-04-03', name: 'Good Friday', type: 'holiday' },
  { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', type: 'national' },
  { date: '2026-04-21', name: 'Eid ul-Fitr', type: 'holiday' },
  { date: '2026-05-01', name: 'Labour Day', type: 'holiday' },
  { date: '2026-06-28', name: 'Eid ul-Adha', type: 'holiday' },
  { date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { date: '2026-09-05', name: 'Janmashtami', type: 'holiday' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-10-13', name: 'Dussehra (Vijayadashami)', type: 'holiday' },
  { date: '2026-11-01', name: 'Diwali', type: 'holiday' },
  { date: '2026-11-02', name: 'Govardhan Puja', type: 'holiday' },
  { date: '2026-11-15', name: 'Guru Nanak Jayanti', type: 'holiday' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'holiday' },
];

/** Returns holiday info for a given Date object, or null */
export function getHoliday(date) {
  const key = format2(date);
  return PUBLIC_HOLIDAYS.find(h => h.date === key) || null;
}

function format2(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
