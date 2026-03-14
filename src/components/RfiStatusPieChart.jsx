import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

export default function RfiStatusPieChart({ data }) {
    const pieRenderKey = (data || []).map((d) => `${d.name}:${d.value}`).join('|');

    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div className="premium-card empty-chart">
                <p>No status data available.</p>
            </div>
        );
    }

    return (
        <div className="premium-card chart-container" style={{ width: '100%', height: '100%', minHeight: 320 }}>
            <h3 className="chart-title" style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inspection Status</h3>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart key={pieRenderKey}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={true}
                        animationDuration={1200}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '14px'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#475569' }}>{item.name}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
