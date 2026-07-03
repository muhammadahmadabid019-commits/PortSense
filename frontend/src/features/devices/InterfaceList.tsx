import { useState, useCallback } from 'react';
import { useDeviceStore } from '../../store/deviceStore';
import { useMetricsStore } from '../../store/metricsStore';
import type { MetricPoint } from '../../store/metricsStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { RealTimeLineChart } from '../../components/RealTimeLineChart';
import { Search, Activity, Zap } from 'lucide-react';

/** Per-interface card with embedded real-time chart */
const InterfaceCard = ({
  iface,
  deviceId,
  idx,
}: {
  iface: { id: string; if_index: number; if_name: string; if_alias: string; if_speed: number; is_monitored: boolean };
  deviceId: string;
  idx: number;
}) => {
  const pushMetric   = useMetricsStore((s) => s.pushMetric);
  const _metrics     = useMetricsStore((s) => s.metrics[iface.id]);
  const ifaceMetrics = _metrics ?? [];
  const { toggleMonitor } = useDeviceStore();

  const handleMsg = useCallback(
    (data: MetricPoint) => {
      pushMetric(iface.id, data);
    },
    [iface.id, pushMetric]
  );

  // Only open WS if monitored
  useWebSocket(iface.is_monitored ? iface.id : '', handleMsg);

  const PALETTE_IN  = ['#06b6d4', '#10b981', '#8b5cf6', '#3b82f6'];
  const PALETTE_OUT = ['#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

  return (
    <div
      style={{
        borderRadius: 14,
        border: iface.is_monitored ? '1px solid #06b6d430' : '1px solid #1e293b',
        background: iface.is_monitored ? 'linear-gradient(135deg,#0a1a2a,#071220)' : '#0a1220',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.2s',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace', marginBottom: 4 }}>
            Port {iface.if_index}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
            {iface.if_name || 'Unknown'}
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{iface.if_alias}</div>
        </div>
        <button
          onClick={() => toggleMonitor(iface.id, !iface.is_monitored, deviceId)}
          title={iface.is_monitored ? 'Stop Monitoring' : 'Start Monitoring'}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: iface.is_monitored ? '#06b6d420' : '#1e293b',
            color: iface.is_monitored ? '#06b6d4' : '#475569',
            transition: 'all 0.2s',
          }}
        >
          <Zap size={16} fill={iface.is_monitored ? '#06b6d4' : 'none'} />
        </button>
      </div>

      {/* Speed badge */}
      {iface.if_speed > 0 && (
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#0f1929', border: '1px solid #1e293b',
            borderRadius: 6, padding: '3px 10px', width: 'fit-content',
          }}
        >
          <span style={{ fontSize: 11, color: '#475569' }}>Speed:</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4' }}>
            {(iface.if_speed / 1_000_000).toFixed(0)} Mbps
          </span>
        </div>
      )}

      {/* Chart */}
      {iface.is_monitored && (
        <RealTimeLineChart
          title={iface.if_name || `Interface ${iface.if_index}`}
          lines={[
            { key: 'in_bps',  label: 'Inbound ↓',  color: PALETTE_IN[idx % 4]  },
            { key: 'out_bps', label: 'Outbound ↑', color: PALETTE_OUT[idx % 4] },
          ]}
          data={ifaceMetrics}
          height={180}
          showLegend={true}
        />
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────── */
export const InterfaceList = ({ deviceId }: { deviceId: string }) => {
  const { interfaces, discoverInterfaces } = useDeviceStore();
  const [loading, setLoading] = useState(false);

  const deviceInterfaces = interfaces[deviceId] ?? [];

  const handleDiscover = async () => {
    setLoading(true);
    try {
      await discoverInterfaces(deviceId);
    } catch (err) {
      console.error('Discovery failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#060d1a',
        border: '1px solid #1e293b',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(6,13,26,0.9)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' }}>
          <Activity color="#06b6d4" size={20} />
          Interfaces
        </h3>
        <button
          onClick={handleDiscover}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600,
            background: '#0f1929', border: '1px solid #1e293b',
            color: loading ? '#334155' : '#06b6d4',
            padding: '7px 14px', borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Search size={15} />
          {loading ? 'Scanning…' : 'SNMP Walk'}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
        {deviceInterfaces.length === 0 ? (
          <div
            style={{
              textAlign: 'center', padding: '48px 0',
              color: '#334155', fontSize: 14,
            }}
          >
            No interfaces discovered. Click <strong style={{ color: '#06b6d4' }}>SNMP Walk</strong> to scan.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {deviceInterfaces.map((iface, idx) => (
              <InterfaceCard
                key={iface.id}
                iface={iface}
                deviceId={deviceId}
                idx={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
