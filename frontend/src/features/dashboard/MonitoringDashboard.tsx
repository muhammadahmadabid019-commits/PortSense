import { useEffect, useMemo, useState } from 'react';
import { useDeviceStore } from '../../store/deviceStore';
import { useMetricsStore } from '../../store/metricsStore';
import type { MetricPoint } from '../../store/metricsStore';
import { useAllMetrics } from '../../hooks/useAllMetrics';
import { RealTimeLineChart } from '../../components/RealTimeLineChart';
import type { LineConfig, DataPoint } from '../../components/RealTimeLineChart';
import { Activity, Monitor, Cpu, Globe, ChevronDown } from 'lucide-react';

/* ── Colour palette rotated for multiple interfaces ── */
const PALETTE = [
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#84cc16', // lime
];
const inColor  = (idx: number) => PALETTE[(idx * 2)     % PALETTE.length];
const outColor = (idx: number) => PALETTE[(idx * 2 + 1) % PALETTE.length];

type ViewMode = 'all' | 'device' | 'interface';

/* ── Helper: merge multiple interface series onto a shared time axis ── */
const buildCombinedData = (
  series: { key: string; points: MetricPoint[] }[]
): DataPoint[] => {
  // collect all unique timestamps
  const tsSet = new Set<string>();
  series.forEach(({ points }) => points.forEach((p) => tsSet.add(p.time)));
  const times = Array.from(tsSet).sort();

  return times.map((t) => {
    const row: DataPoint = { time: t };
    series.forEach(({ key, points }) => {
      const pt = points.find((p) => p.time === t);
      if (pt) {
        row[`${key}_in`]  = pt.in_bps;
        row[`${key}_out`] = pt.out_bps;
      }
    });
    return row;
  });
};

/* ── Helper: build aggregate (sum) series over all provided interfaces ── */
const buildAggregateData = (
  allSeries: MetricPoint[][]
): MetricPoint[] => {
  const tsSet = new Set<string>();
  allSeries.forEach((pts) => pts.forEach((p) => tsSet.add(p.time)));
  const times = Array.from(tsSet).sort();

  return times.map((t) => {
    let sumIn = 0; let sumOut = 0;
    allSeries.forEach((pts) => {
      const pt = pts.find((p) => p.time === t);
      if (pt) { sumIn += pt.in_bps; sumOut += pt.out_bps; }
    });
    return { time: t, in_bps: sumIn, out_bps: sumOut };
  });
};

/* ── Styled Select ── */
const Select = ({
  value, onChange, options, label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
    <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 8,
          color: '#e2e8f0',
          fontSize: 13,
          padding: '6px 32px 6px 12px',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          minWidth: 160,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: 'absolute', right: 10, top: '50%',
          transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none',
        }}
      />
    </div>
  </div>
);

/* ── Stat Card ── */
const StatCard = ({
  icon: Icon, label, value, color,
}: {
  icon: any; label: string; value: string | number; color: string;
}) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #0f1929, #0a1220)',
      border: `1px solid ${color}22`,
      borderRadius: 14,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}
  >
    <div
      style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={22} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>{value}</div>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════ */
export const MonitoringDashboard = () => {
  const { devices, interfaces, fetchDevices, fetchAllInterfaces } = useDeviceStore();
  const metrics = useMetricsStore((s) => s.metrics);

  useEffect(() => {
    fetchDevices().then(() => fetchAllInterfaces());
  }, [fetchDevices, fetchAllInterfaces]);

  /* Gather all monitored interface IDs across all devices */
  const allMonitoredIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(interfaces).forEach((ifaces) => {
      ifaces.filter((i) => i.is_monitored).forEach((i) => ids.push(i.id));
    });
    return ids;
  }, [interfaces]);

  /* Subscribe to WebSocket streams for ALL monitored interfaces */
  useAllMetrics(allMonitoredIds);

  /* Filter state */
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedIfaceId, setSelectedIfaceId] = useState<string>('');

  /* Auto-select first device when available */
  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  /* Auto-select first monitored interface on device change */
  useEffect(() => {
    if (selectedDeviceId) {
      const ifaces = (interfaces[selectedDeviceId] ?? []).filter((i) => i.is_monitored);
      if (ifaces.length > 0 && !ifaces.find((i) => i.id === selectedIfaceId)) {
        setSelectedIfaceId(ifaces[0].id);
      }
    }
  }, [selectedDeviceId, interfaces, selectedIfaceId]);

  /* Devices with at least one monitored interface */
  const activeDevices = useMemo(
    () => devices.filter((d) => (interfaces[d.id] ?? []).some((i) => i.is_monitored)),
    [devices, interfaces]
  );

  /* Summary stats */
  const totalMonitored = allMonitoredIds.length;
  const latestAggIn = useMemo(() => {
    let sum = 0;
    allMonitoredIds.forEach((id) => {
      const pts = metrics[id] ?? [];
      if (pts.length) sum += pts[pts.length - 1].in_bps;
    });
    return sum;
  }, [allMonitoredIds, metrics]);
  const latestAggOut = useMemo(() => {
    let sum = 0;
    allMonitoredIds.forEach((id) => {
      const pts = metrics[id] ?? [];
      if (pts.length) sum += pts[pts.length - 1].out_bps;
    });
    return sum;
  }, [allMonitoredIds, metrics]);

  const formatBps = (bps: number) => {
    if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
    if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`;
    if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} Kbps`;
    return `${bps.toFixed(0)} bps`;
  };

  /* ── Render: All Devices combined chart ── */
  const renderAllDevicesView = () => {
    const lines: LineConfig[] = [];

    allMonitoredIds.forEach((id, idx) => {
      // find interface name
      let name = id.slice(0, 8);
      devices.forEach((d) => {
        const iface = (interfaces[d.id] ?? []).find((i) => i.id === id);
        if (iface) name = `${d.name}/${iface.if_name}`;
      });
      lines.push({ key: `${id}_in`, label: `${name} ↓`, color: inColor(idx) });
      lines.push({ key: `${id}_out`, label: `${name} ↑`, color: outColor(idx) });
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Aggregate combined */}
        <RealTimeLineChart
          title="All Network Traffic — Aggregate"
          subtitle={`Sum of ${totalMonitored} monitored interface${totalMonitored !== 1 ? 's' : ''}`}
          lines={[
            { key: 'in_bps', label: 'Total Inbound ↓', color: '#06b6d4' },
            { key: 'out_bps', label: 'Total Outbound ↑', color: '#f59e0b' },
          ]}
          data={buildAggregateData(allMonitoredIds.map((id) => metrics[id] ?? []))}
          height={260}
        />
        {/* Per-interface breakdown side by side */}
        {activeDevices.map((device, devIdx) => {
          const ifaces = (interfaces[device.id] ?? []).filter((i) => i.is_monitored);
          const devSeries = ifaces.map((i) => ({ key: i.id, points: metrics[i.id] ?? [] }));
          const devData = buildCombinedData(devSeries);
          const devLines: LineConfig[] = ifaces.flatMap((iface, idx) => [
            { key: `${iface.id}_in`,  label: `${iface.if_name} ↓`, color: inColor(devIdx + idx) },
            { key: `${iface.id}_out`, label: `${iface.if_name} ↑`, color: outColor(devIdx + idx) },
          ]);

          return (
            <div key={device.id}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#10b981', boxShadow: '0 0 6px #10b981',
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {device.name} — {device.ip_address}
                </span>
                <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
              </div>
              <RealTimeLineChart
                title={`${device.name} — All Interfaces`}
                subtitle={`${ifaces.length} interface${ifaces.length !== 1 ? 's' : ''} monitored`}
                lines={devLines}
                data={devData}
                height={240}
              />
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Render: Per Device – one chart per device showing all its interfaces ── */
  const renderPerDeviceView = () => {
    const device = devices.find((d) => d.id === selectedDeviceId);
    if (!device) return <Empty message="Select a device above." />;
    const ifaces = (interfaces[device.id] ?? []).filter((i) => i.is_monitored);
    if (ifaces.length === 0) return <Empty message="No monitored interfaces on this device. Enable monitoring in the Devices tab." />;

    const devSeries = ifaces.map((i) => ({ key: i.id, points: metrics[i.id] ?? [] }));
    const devData   = buildCombinedData(devSeries);
    const devLines: LineConfig[] = ifaces.flatMap((iface, idx) => [
      { key: `${iface.id}_in`,  label: `${iface.if_name} ↓`, color: inColor(idx) },
      { key: `${iface.id}_out`, label: `${iface.if_name} ↑`, color: outColor(idx) },
    ]);

    // Also render individual interface charts below
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Aggregate for this device */}
        <RealTimeLineChart
          title={`${device.name} — All Interfaces Combined`}
          subtitle={`${ifaces.length} interfaces`}
          lines={devLines}
          data={devData}
          height={280}
        />
        {/* Per-interface grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
          {ifaces.map((iface, idx) => {
            const pts = metrics[iface.id] ?? [];
            return (
              <RealTimeLineChart
                key={iface.id}
                title={iface.if_name || `Interface ${iface.if_index}`}
                subtitle={iface.if_alias || `Port ${iface.if_index} · ${(iface.if_speed / 1e6).toFixed(0)} Mbps`}
                lines={[
                  { key: 'in_bps',  label: 'Inbound ↓',  color: inColor(idx)  },
                  { key: 'out_bps', label: 'Outbound ↑', color: outColor(idx) },
                ]}
                data={pts}
                height={200}
              />
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Render: Per Interface ── */
  const renderPerInterfaceView = () => {
    const device = devices.find((d) => d.id === selectedDeviceId);
    if (!device) return <Empty message="Select a device." />;
    const ifaces = (interfaces[device.id] ?? []).filter((i) => i.is_monitored);
    if (ifaces.length === 0) return <Empty message="No monitored interfaces. Enable monitoring in the Devices tab." />;

    const iface = ifaces.find((i) => i.id === selectedIfaceId) ?? ifaces[0];
    const pts   = metrics[iface.id] ?? [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <RealTimeLineChart
          title={`${iface.if_name || 'Interface'} — ${device.name}`}
          subtitle={iface.if_alias || `Port ${iface.if_index} · ${(iface.if_speed / 1e6).toFixed(0)} Mbps max speed`}
          lines={[
            { key: 'in_bps',  label: 'Inbound ↓',  color: '#06b6d4' },
            { key: 'out_bps', label: 'Outbound ↑', color: '#f59e0b' },
          ]}
          data={pts}
          height={340}
        />

        {/* Mini stats row */}
        {pts.length > 0 && (() => {
          const last = pts[pts.length - 1];
          const avgIn  = pts.reduce((a, p) => a + p.in_bps, 0) / pts.length;
          const avgOut = pts.reduce((a, p) => a + p.out_bps, 0) / pts.length;
          const maxIn  = Math.max(...pts.map((p) => p.in_bps));
          const maxOut = Math.max(...pts.map((p) => p.out_bps));
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Current ↓', value: formatBps(last.in_bps), color: '#06b6d4' },
                { label: 'Current ↑', value: formatBps(last.out_bps), color: '#f59e0b' },
                { label: 'Avg ↓', value: formatBps(avgIn), color: '#10b981' },
                { label: 'Avg ↑', value: formatBps(avgOut), color: '#8b5cf6' },
                { label: 'Peak ↓', value: formatBps(maxIn), color: '#06b6d4' },
                { label: 'Peak ↑', value: formatBps(maxOut), color: '#f59e0b' },
                { label: 'Samples', value: pts.length, color: '#475569' },
                { label: 'Utilisation', value: `${((last.in_bps + last.out_bps) / (iface.if_speed * 2 || 1) * 100).toFixed(1)}%`, color: '#ec4899' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: '#0a1220',
                    border: '1px solid #1e293b',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    );
  };

  /* ── Empty state ── */
  const Empty = ({ message }: { message: string }) => (
    <div
      style={{
        height: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        color: '#334155',
        border: '1px dashed #1e293b',
        borderRadius: 16,
        fontSize: 14,
      }}
    >
      <Activity size={36} strokeWidth={1} />
      <span>{message}</span>
    </div>
  );

  /* ────────────────────── Render ────────────────────── */
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '28px 32px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: 'linear-gradient(160deg, #060d1a 0%, #030a12 100%)',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#06b6d410',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #06b6d420',
            }}
          >
            <Monitor size={22} color="#06b6d4" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
              Live Monitoring
            </h1>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, marginTop: 2 }}>
              Real-time bandwidth graphs — updates every ~5 seconds
            </p>
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Cpu} label="Monitored Interfaces" value={totalMonitored} color="#06b6d4" />
        <StatCard icon={Globe} label="Active Devices" value={activeDevices.length} color="#10b981" />
        <StatCard icon={Activity} label="Total Inbound" value={formatBps(latestAggIn)} color="#8b5cf6" />
        <StatCard icon={Activity} label="Total Outbound" value={formatBps(latestAggOut)} color="#f59e0b" />
      </div>

      {/* Filter toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
          background: '#0a1525',
          border: '1px solid #1e293b',
          borderRadius: 14,
          padding: '14px 20px',
          marginBottom: 28,
        }}
      >
        {/* View mode buttons */}
        <div style={{ display: 'flex', background: '#060d1a', borderRadius: 10, padding: 4, gap: 4 }}>
          {([
            { key: 'all',       label: 'All Devices' },
            { key: 'device',    label: 'Per Device'  },
            { key: 'interface', label: 'Per Interface' },
          ] as { key: ViewMode; label: string }[]).map((m) => (
            <button
              key={m.key}
              onClick={() => setViewMode(m.key)}
              style={{
                padding: '7px 16px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.15s',
                background: viewMode === m.key ? '#06b6d4' : 'transparent',
                color: viewMode === m.key ? '#030a12' : '#64748b',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Device selector */}
        {(viewMode === 'device' || viewMode === 'interface') && (
          <Select
            label="Device"
            value={selectedDeviceId}
            onChange={(v) => { setSelectedDeviceId(v); setSelectedIfaceId(''); }}
            options={
              activeDevices.length > 0
                ? activeDevices.map((d) => ({ value: d.id, label: `${d.name} (${d.ip_address})` }))
                : [{ value: '', label: 'No active devices' }]
            }
          />
        )}

        {/* Interface selector */}
        {viewMode === 'interface' && selectedDeviceId && (
          <Select
            label="Interface"
            value={selectedIfaceId}
            onChange={setSelectedIfaceId}
            options={
              (interfaces[selectedDeviceId] ?? [])
                .filter((i) => i.is_monitored)
                .map((i) => ({
                  value: i.id,
                  label: `${i.if_name} — ${i.if_alias || `Port ${i.if_index}`}`,
                }))
            }
          />
        )}

        <div style={{ flex: 1 }} />
        {/* No monitored interfaces hint */}
        {totalMonitored === 0 && (
          <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
            ⚠ No interfaces monitored. Go to Devices → click SNMP Walk → enable monitoring (⚡).
          </span>
        )}
      </div>

      {/* Chart content */}
      <div>
        {viewMode === 'all' && renderAllDevicesView()}
        {viewMode === 'device' && renderPerDeviceView()}
        {viewMode === 'interface' && renderPerInterfaceView()}
      </div>

      {/* pulse animation keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
