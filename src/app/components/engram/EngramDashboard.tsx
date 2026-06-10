import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Brain, Link2, Loader2, AlertCircle } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import type { EngramStats } from '../../types/engramTypes';

const TYPE_COLORS: Record<string, string> = {
  episodic: '#818cf8',
  entity:   '#22d3ee',
  summary:  '#34d399',
  semantic: '#f59e0b',
};

const MECH_COLORS: Record<string, string> = {
  entity_mention:      '#22d3ee',
  semantic_similarity: '#f97316',
  narrative_thread:    '#94a3b8',
  temporal_proximity:  '#eab308',
  provenance_analysis: '#a78bfa',
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}25` }}
    >
      <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: `${color}99` }}>{label}</span>
      <span className="text-2xl tabular-nums" style={{ color }}>{value.toLocaleString()}</span>
    </div>
  );
}

export function EngramDashboard({ sapienId }: { sapienId: number }) {
  const [stats, setStats] = useState<EngramStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    engramService.getStats(sapienId)
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sapienId]);

  if (loading) return <CenteredLoader />;
  if (error)   return <ErrorBox msg={error} />;
  if (!stats)  return null;

  const typeData = Object.entries(stats.by_memory_type).map(([k, v]) => ({ name: k, count: v }));
  const mechData = Object.entries(stats.link_mechanisms).map(([k, v]) => ({ name: k, count: v }));
  const linksPerUnit = stats.total_units > 0
    ? (stats.total_links / stats.total_units).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      {/* Hero numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total units"  value={stats.total_units}  color="#818cf8" />
        <StatCard label="Total links"  value={stats.total_links ?? 0}  color="#22d3ee" />
        {/* Links/unit ratio */}
        <div
          className="flex flex-col gap-1 px-4 py-3 rounded-xl col-span-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(249,115,22,0.2)' }}
        >
          <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'rgba(249,115,22,0.6)' }}>Links / unit</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl tabular-nums" style={{ color: '#f97316' }}>{linksPerUnit}</span>
            <span className="text-[10px] text-white/25 mb-0.5">avg connections per memory</span>
          </div>
        </div>
      </div>
      {/* Type breakdown cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {typeData.map(({ name, count }) => (
          <StatCard key={name} label={name} value={count} color={TYPE_COLORS[name] ?? '#94a3b8'} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Memory type breakdown */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4" style={{ color: '#818cf8' }} />
            <span className="text-sm text-white/70">Memory type breakdown</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData} layout="vertical">
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Bar dataKey="count" radius={4} maxBarSize={20}>
                {typeData.map(({ name }) => (
                  <Cell key={name} fill={TYPE_COLORS[name] ?? '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Link mechanisms */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4" style={{ color: '#22d3ee' }} />
            <span className="text-sm text-white/70">Link mechanisms</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mechData} layout="vertical">
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                itemStyle={{ color: '#22d3ee' }}
              />
              <Bar dataKey="count" radius={4} maxBarSize={16}>
                {mechData.map(({ name }) => (
                  <Cell key={name} fill={MECH_COLORS[name] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function CenteredLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 animate-spin text-white/30" />
    </div>
  );
}

export function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-300 text-sm"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {msg}
    </div>
  );
}
