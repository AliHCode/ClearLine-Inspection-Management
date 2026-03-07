import { STATUS_COLORS } from '../utils/constants';

export default function StatusBadge({ status }) {
    return (
        <span
            className="status-badge"
            data-status={status}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
