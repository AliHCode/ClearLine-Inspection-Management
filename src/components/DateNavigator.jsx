import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateDisplay, getToday } from '../utils/rfiLogic';

export default function DateNavigator({ currentDate, onDateChange }) {
    const today = getToday();
    const isToday = currentDate === today;

    function adjustDate(days) {
        const [year, month, day] = currentDate.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        d.setDate(d.getDate() + days);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = String(d.getDate()).padStart(2, '0');
        onDateChange(`${yStr}-${mStr}-${dStr}`);
    }

    function goBack() {
        adjustDate(-1);
    }

    function goForward() {
        adjustDate(1);
    }

    function goToday() {
        onDateChange(today);
    }

    return (
        <div className="date-navigator">
            <button className="date-nav-btn" onClick={goBack}>
                <ChevronLeft size={20} />
            </button>
            <div className="date-nav-center">
                <Calendar size={16} />
                <span className="date-nav-label">{formatDateDisplay(currentDate)}</span>
                {isToday && <span className="today-badge">Today</span>}
            </div>
            <button className="date-nav-btn" onClick={goForward}>
                <ChevronRight size={20} />
            </button>
            {!isToday && (
                <button className="date-nav-today-btn" onClick={goToday}>
                    Go to Today
                </button>
            )}
        </div>
    );
}
