export default function StatsCard({ icon, label, value, subtitle }) {
    return (
        <div className="data-metric">
            <div className="data-metric-header">
                {icon && <span className="data-metric-icon">{icon}</span>}
                <span className="data-metric-label">{label}</span>
            </div>
            <div className="data-metric-value">{value}</div>
            {subtitle && <div className="data-metric-subtitle">{subtitle}</div>}
        </div>
    );
}
