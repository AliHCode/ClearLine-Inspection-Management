import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDateDisplay, getToday } from '../utils/rfiLogic';

export default function DateNavigator({ currentDate, onDateChange }) {
    const today = getToday();
    const isToday = currentDate === today;

    function goBack() {
        const d = new Date(currentDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        onDateChange(d.toISOString().split('T')[0]);
    }

    function goForward() {
        const d = new Date(currentDate + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        onDateChange(d.toISOString().split('T')[0]);
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
