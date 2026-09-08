import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = {
  id: string;
  code: string;
  name: string;
  progress?: number;
  spi?: number;
  health_score?: number;
  health_status?: string;
  current_phase?: string;
  days_to_go_live?: number;
};

type Raid = { project_id: string; type: string; status: string; priority: string; due_date?: string | null };
type Schedule = { project_id: string; status: string; planned_progress?: number; actual_progress?: number; planned_end?: string | null };
type Financial = { project_id: string; budget: number; actual: number; forecast: number };
type Resource = { project_id: string; planned_hours: number; actual_hours: number; capacity_hours: number; allocation_percent: number; status: string };
type Raci = { project_id: string; status: string; due_date?: string | null };

type ProjectView = Project & {
  risks: number;
  issues: number;
  actions: number;
  dependencies: number;
  overdueRaid: number;
  delayedActivities: number;
  budget: number;
  actual: number;
  forecast: number;
  utilization: number;
  resources: number;
  raciOpen: number;
};

function healthLabel(score: number) {
  if (score < 60) return "critical";
  if (score < 80) return "attention";
  return "healthy";
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
}

function pct(value: number) {
  return `${Math.round(value || 0)}%`;
}

function daysToDue(value?: string | null) {
  if (!value) return null;
  const target = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.round((target - today) / 86400000);
}

export default function Governanca({ projects }: { projects: Project[] }) {
  const [raid, setRaid] = useState<Raid[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [financial, setFinancial] = useState<Financial[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [raci, setRaci] = useState<Raci[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    if (!supabaseConfigured) {
      setRaid([]); setSchedule([]); setFinancial([]); setResources([]); setRaci([]);
      setLoading(false);
      return;
    }

    const [raidResult, scheduleResult, financialResult, resourceResult, raciResult] = await Promise.all([
      supabase.from("project_raid_items").select("project_id,type,status,priority,due_date"),
      supabase.from("project_schedule_items").select("project_id,status,planned_progress,actual_progress,planned_end"),
      supabase.from("project_financials").select("project_id,budget,actual,forecast"),
      supabase.from("project_resources").select("project_id,planned_hours,actual_hours,capacity_hours,allocation_percent,status"),
      supabase.from("project_raci").select("project_id,status,due_date"),
    ]);

    const failures = [raidResult, scheduleResult, financialResult, resourceResult, raciResult].filter((r) => r.error);
    if (failures.length) setError("Alguns indicadores operacionais ainda não puderam ser carregados. Verifique as tabelas e políticas do Supabase.");

    setRaid((raidResult.data || []) as Raid[]);
    setSchedule((scheduleResult.data || []) as Schedule[]);
    setFinancial((financialResult.data || []) as Financial[]);
    setResources((resourceResult.data || []) as Resource[]);
    setRaci((raciResult.data || []) as Raci[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const portfolio = useMemo<ProjectView[]>(() => projects.map((project) => {
    const r = raid.filter((x) => x.project_id === project.id);
    const s = schedule.filter((x) => x.project_id === project.id);
    const f = financial.filter((x) => x.project_id === project.id);
    const res = resources.filter((x) => x.project_id === project.id);
    const rc = raci.filter((x) => x.project_id === project.id);
    const open = r.filter((x) => !["resolved", "cancelled"].includes(x.status));
    const overdueRaid = open.filter((x) => (daysToDue(x.due_date) ?? 1) < 0).length;
    const utilization = res.length ? res.reduce((sum, x) => sum + Number(x.allocation_percent || 0), 0) / res.length : 0;
    const score = Number(project.health_score ?? 0);
    return {
      ...project,
      risks: r.filter((x) => x.type === "risk" && !["resolved", "cancelled"].includes(x.status)).length,
      issues: r.filter((x) => x.type === "issue" && !["resolved", "cancelled"].includes(x.status)).length,
      actions: r.filter((x) => x.type === "action" && !["resolved", "cancelled"].includes(x.status)).length,
      dependencies: r.filter((x) => x.type === "dependency" && !["resolved", "cancelled"].includes(x.status)).length,
      overdueRaid,
      delayedActivities: s.filter((x) => x.status === "delayed").length,
      budget: f.reduce((sum, x) => sum + Number(x.budget || 0), 0),
      actual: f.reduce((sum, x) => sum + Number(x.actual || 0), 0),
      forecast: f.reduce((sum, x) => sum + Number(x.forecast || 0), 0),
      utilization,
      resources: res.length,
      raciOpen: rc.filter((x) => x.status !== "completed").length,
      health_score: score,
      health_status: project.health_status || healthLabel(score),
    };
  }), [projects, raid, schedule, financial, resources, raci]);

  const filtered = selected === "all" ? portfolio : portfolio.filter((p) => p.id === selected);
  const totals = useMemo(() => ({
    critical: portfolio.filter((p) => healthLabel(Number(p.health_score || 0)) === "critical").length,
    attention: portfolio.filter((p) => healthLabel(Number(p.health_score || 0)) === "attention").length,
    openRaid: portfolio.reduce((sum, p) => sum + p.risks + p.issues + p.actions + p.dependencies, 0),
    delayed: portfolio.reduce((sum, p) => sum + p.delayedActivities, 0),
    budget: portfolio.reduce((sum, p) => sum + p.budget, 0),
    forecast: portfolio.reduce((sum, p) => sum + p.forecast, 0),
  }), [portfolio]);

  return (
    <section className="content">
      <div className="module-hero governance-hero">
        <div className="module-icon"><Activity size={26} /></div>
        <div>
          <div className="eyebrow">EXECUTIVE GOVERNANCE</div>
          <h2>Governança Executiva</h2>
          <p>Uma visão integrada de prazo, risco, financeiro, recursos e responsabilidades.</p>
        </div>
        <button className="primary-btn" type="button" onClick={load}><RefreshCw size={16} /> Atualizar visão</button>
      </div>

      {error && <div className="error-banner"><AlertTriangle size={17} />{error}</div>}

      <div className="kpis module-kpis governance-kpis">
        <Metric title="Projetos críticos" value={totals.critical} icon={<XCircle size={18} />} tone="critical" />
        <Metric title="Projetos em atenção" value={totals.attention} icon={<AlertTriangle size={18} />} tone="attention" />
        <Metric title="Itens RAID abertos" value={totals.openRaid} icon={<ShieldAlert size={18} />} />
        <Metric title="Atividades atrasadas" value={totals.delayed} icon={<Clock3 size={18} />} tone={totals.delayed ? "critical" : "healthy"} />
      </div>

      <section className="panel executive-command-panel">
        <div className="panel-head">
          <div><h3>Command Center</h3><p>Priorize rapidamente onde a gestão deve atuar.</p></div>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="all">Todos os projetos</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </select>
        </div>

        {loading ? <div className="empty-state">Consolidando indicadores...</div> : filtered.length === 0 ? <div className="empty-state">Nenhum projeto disponível para consolidação.</div> : (
          <div className="governance-project-grid">
            {filtered.map((p) => {
              const status = healthLabel(Number(p.health_score || 0));
              const variance = p.forecast - p.budget;
              return (
                <article className="governance-project" key={p.id}>
                  <div className="governance-project-head">
                    <div><span className="eyebrow">{p.current_phase || "PROJETO SAP"}</span><h3>{p.code}</h3><p>{p.name}</p></div>
                    <span className={`health ${status}`}><i />{Math.round(Number(p.health_score || 0))}</span>
                  </div>

                  <div className="governance-progress"><div><span>Progresso</span><strong>{pct(Number(p.progress || 0))}</strong></div><div className="progress-track"><b style={{ width: `${Math.min(100, Math.max(0, Number(p.progress || 0)))}%` }} /></div></div>

                  <div className="governance-mini-grid">
                    <Mini icon={<ShieldAlert size={15} />} label="RAID aberto" value={p.risks + p.issues + p.actions + p.dependencies} />
                    <Mini icon={<CalendarDays size={15} />} label="Atrasos" value={p.delayedActivities} />
                    <Mini icon={<Users size={15} />} label="Recursos" value={p.resources} />
                    <Mini icon={<CheckCircle2 size={15} />} label="RACI aberto" value={p.raciOpen} />
                  </div>

                  <div className="governance-financial">
                    <div><span>Orçamento</span><strong>{money(p.budget)}</strong></div>
                    <div><span>Forecast</span><strong>{money(p.forecast)}</strong></div>
                    <div className={variance > 0 ? "negative" : "positive"}><span>Variação</span><strong>{variance > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{money(Math.abs(variance))}</strong></div>
                  </div>

                  <div className="governance-footer"><span>Utilização {pct(p.utilization)}</span><span>Go-Live {p.days_to_go_live == null ? "—" : `${Math.round(Number(p.days_to_go_live))}d`}</span></div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="governance-summary-grid">
        <SummaryCard icon={<CircleDollarSign size={19} />} title="Visão financeira" value={money(totals.forecast)} label="Forecast consolidado" detail={totals.budget ? `Orçamento ${money(totals.budget)}` : "Sem orçamento cadastrado"} />
        <SummaryCard icon={<ShieldAlert size={19} />} title="Exposição RAID" value={totals.openRaid} label="Itens abertos" detail={`${portfolio.reduce((s, p) => s + p.overdueRaid, 0)} vencidos`} />
        <SummaryCard icon={<Users size={19} />} title="Capacidade" value={pct(portfolio.length ? portfolio.reduce((s, p) => s + p.utilization, 0) / portfolio.length : 0)} label="Utilização média" detail={`${resources.length} recursos cadastrados`} />
      </div>
    </section>
  );
}

function Metric({ title, value, icon, tone }: { title: string; value: number; icon: React.ReactNode; tone?: string }) {
  return <div className={`kpi ${tone || ""}`}><div className="kpi-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong></div></div>;
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="governance-mini"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function SummaryCard({ icon, title, value, label, detail }: { icon: React.ReactNode; title: string; value: string | number; label: string; detail: string }) {
  return <article className="governance-summary"><div className="summary-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{label}</small><em>{detail}</em></div></article>;
}
