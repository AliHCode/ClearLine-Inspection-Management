import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

export default function RfiStatusPieChart({ data }) {
    // Data format expected: [{ name: 'Approved', value: 10, color: '#059669' }, ...]

    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div className="empty-chart">
                <p>No status data available.</p>
            </div>
        );
    }

    return (
        <div className="chart-container" style={{ width: '100%', height: 320 }}>
            <h3 className="chart-title">Inspection Status</h3>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid var(--clr-border)',
                            boxShadow: 'var(--shadow-md)',
                            fontWeight: 600,
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
