import { useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWebSocket } from '../hooks/useWebSocket';

interface MetricPoint {
  time: string;
  in_bps: number;
  out_bps: number;
}

export const BandwidthChart = ({ interfaceId }: { interfaceId: string }) => {
  const [data, setData] = useState<MetricPoint[]>([]);

  const handleNewMetric = useCallback((metric: MetricPoint) => {
    setData(prev => {
      const newData = [...prev, metric];
      if (newData.length > 30) {
        newData.shift();
      }
      return newData;
    });
  }, []);

  useWebSocket(interfaceId, handleNewMetric);

  const formatBps = (bps: number) => {
    if (bps > 1000000000) return `${(bps / 1000000000).toFixed(2)} Gbps`;
    if (bps > 1000000) return `${(bps / 1000000).toFixed(2)} Mbps`;
    if (bps > 1000) return `${(bps / 1000).toFixed(2)} Kbps`;
    return `${bps.toFixed(0)} bps`;
  };

  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            tickFormatter={formatTime} 
            stroke="#475569" 
            fontSize={10} 
            tickMargin={8}
            minTickGap={20}
          />
          <YAxis 
            tickFormatter={formatBps} 
            stroke="#475569" 
            fontSize={10} 
            width={70}
            orientation="right"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1' }}
            formatter={(value: any, name: any) => [formatBps(Number(value)), name === 'in_bps' ? 'Inbound' : 'Outbound']}
            labelFormatter={(label: any) => formatTime(String(label))}
          />
          <Area 
            type="monotone" 
            dataKey="in_bps" 
            stroke="#06b6d4" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorIn)" 
            isAnimationActive={false}
          />
          <Area 
            type="monotone" 
            dataKey="out_bps" 
            stroke="#f59e0b" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorOut)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
