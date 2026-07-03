import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface LineConfig {
  key: string;
  label: string;
  color: string;
}

export interface DataPoint {
  time: string;
  [key: string]: number | string;
}

interface RealTimeLineChartProps {
  title: string;
  subtitle?: string;
  lines: LineConfig[];
  data: DataPoint[];
  height?: number;
  showLegend?: boolean;
}

const formatBps = (bps: number): string => {
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(2)} Kbps`;
  return `${bps.toFixed(0)} bps`;
};

const formatTime = (timeStr: string): string => {
  try {
    const d = new Date(timeStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.97)',
        border: '1px solid #1e293b',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        color: '#cbd5e1',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ color: '#94a3b8', marginBottom: 6, fontFamily: 'monospace' }}>
        {formatTime(String(label))}
      </div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ color: entry.color, marginBottom: 2 }}>
          <span style={{ fontWeight: 600 }}>{entry.name}:</span>{' '}
          {formatBps(Number(entry.value))}
        </div>
      ))}
    </div>
  );
};

export const RealTimeLineChart = ({
  title,
  subtitle,
  lines,
  data,
  height = 220,
  showLegend = true,
}: RealTimeLineChartProps) => {
  const hasData = data.length > 0;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f1929 0%, #0a1220 100%)',
        border: '1px solid #1e293b',
        borderRadius: 16,
        padding: '20px 20px 12px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle glow accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${lines[0]?.color ?? '#06b6d4'}, transparent)`,
          opacity: 0.7,
        }}
      />

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#e2e8f0',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: hasData ? '#10b981' : '#475569',
                boxShadow: hasData ? '0 0 6px #10b981' : 'none',
                display: 'inline-block',
                animation: hasData ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span style={{ fontSize: 11, color: hasData ? '#10b981' : '#475569', fontWeight: 600 }}>
              {hasData ? 'LIVE' : 'WAITING'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {!hasData ? (
        <div
          style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#334155',
            fontSize: 13,
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Waiting for data…</span>
          <span style={{ fontSize: 11, color: '#1e293b' }}>Enable monitoring on an interface first</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {lines.map((l) => (
                <filter key={l.key} id={`glow-${l.key}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1a2538"
              vertical={true}
              horizontal={true}
            />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="#334155"
              fontSize={10}
              tickMargin={8}
              minTickGap={40}
              tick={{ fill: '#475569' }}
            />
            <YAxis
              tickFormatter={formatBps}
              stroke="#334155"
              fontSize={10}
              width={72}
              tick={{ fill: '#475569' }}
              orientation="left"
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
                formatter={(value) => (
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
                )}
              />
            )}
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.label}
                stroke={l.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: l.color }}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
