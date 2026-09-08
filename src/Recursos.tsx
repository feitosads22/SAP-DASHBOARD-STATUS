import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, CalendarDays, CheckCircle2, Gauge, Plus, Search, Timer, Trash2, Users, X } from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = { id: string; code: string; name: string };
type ResourceRow = {
  id: string;
  project_id: string;
  resource_name: string;
  role?: string | null;
  planned_hours: number;
  actual_hours: number;
  capacity_hours: number;
  allocation_percent: number;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
};

export default function Recursos({ projects }: { projects: Project[] }) {
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ project_id: "", resource_name: "", role: "", planned_hours: "0", actual_hours: "0", capacity_hours: "0", allocation_percent: "0", start_date: "", end_date: "" });

  async function load() {
    setLoading(true); setError("");
    if (!supabaseConfigured) { setRows([]); setLoading(false); return; }
    const { data, error: requestError } = await supabase.from("project_resources").select("*").order("created_at", { ascending: false });
    if (requestError) { setError("Não foi possível carregar os recursos. Verifique as permissões do Supabase."); setRows([]); }
    else setRows((data || []) as ResourceRow[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const filtered = useMemo(() => rows.filter(r => {
    const p = projectMap.get(r.project_id);
    const hay = `${r.resource_name} ${r.role || ""} ${p?.code || ""} ${p?.name || ""}`.toLowerCase();
    return (projectFilter === "all" || r.project_id === projectFilter) && hay.includes(search.toLowerCase());
  }), [rows, projectMap, projectFilter, search]);

  const planned = rows.reduce((s,r) => s + Number(r.planned_hours || 0), 0);
  const actual = rows.reduce((s,r) => s + Number(r.actual_hours || 0), 0);
  const capacity = rows.reduce((s,r) => s + Number(r.capacity_hours || 0), 0);
  const utilization = capacity ? Math.round((actual / capacity) * 100) : 0;

  function openCreate() {
    setForm({ project_id: projects[0]?.id || "", resource_name: "", role: "", planned_hours: "0", actual_hours: "0", capacity_hours: "0", allocation_percent: "0", start_date: "", end_date: "" });
    setModalOpen(true); setError("");
  }

  async function save() {
    if (!form.project_id || !form.resource_name.trim()) { setError("Informe o projeto e o nome do recurso."); return; }
    setSaving(true); setError("");
    const { error: requestError } = await supabase.from("project_resources").insert({
      project_id: form.project_id,
      resource_name: form.resource_name.trim(),
      role: form.role.trim() || null,
      planned_hours: Number(form.planned_hours) || 0,
      actual_hours: Number(form.actual_hours) || 0,
      capacity_hours: Number(form.capacity_hours) || 0,
      allocation_percent: Math.min(100, Math.max(0, Number(form.allocation_percent) || 0)),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: "active",
    });
    if (requestError) setError(requestError.message); else { setModalOpen(false); await load(); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta alocação de recurso?")) return;
    const { error: requestError } = await supabase.from("project_resources").delete().eq("id", id);
    if (requestError) setError(requestError.message); else await load();
  }

  return <section className="content resources-page">
    <div className="resources-hero">
      <div className="resources-hero-left"><div className="resources-icon"><Users size={24}/></div><div><div className="eyebrow">CAPACITY MANAGEMENT</div><h2>Recursos</h2><p>Planejamento de horas, capacidade, alocação e utilização por projeto.</p></div></div>
      <div className="resources-actions"><button className="period-select" type="button"><CalendarDays size={16}/> Setembro 2026</button><button className="primary-btn" type="button" onClick={openCreate}><Plus size={17}/> Novo recurso</button></div>
    </div>

    <div className="resource-kpis">
      <ResourceKpi icon={<Users/>} label="Recursos alocados" value={rows.length} helper="Registros ativos" tone="blue" />
      <ResourceKpi icon={<Timer/>} label="Horas planejadas" value={`${planned.toLocaleString("pt-BR")}h`} helper="Planejamento" tone="purple" />
      <ResourceKpi icon={<CheckCircle2/>} label="Horas realizadas" value={`${actual.toLocaleString("pt-BR")}h`} helper="Apontamentos" tone="green" />
      <ResourceKpi icon={<Gauge/>} label="Utilização" value={`${utilization}%`} helper="Realizado / capacidade" tone="orange" />
      <ResourceKpi icon={<BriefcaseBusiness/>} label="Projetos ativos" value={projects.length} helper="Portfólio" tone="teal" />
    </div>

    {error && <div className="module-alert"><X size={16}/><span>{error}</span><button className="icon-btn" type="button" onClick={() => setError("")}><X size={15}/></button></div>}

    <section className="resource-panel resource-table-panel">
      <div className="resource-table-head"><div><span className="section-kicker">RESOURCE ALLOCATION</span><h3>Alocação de recursos</h3><p>Visão operacional por projeto, recurso, função, horas e utilização.</p></div><div className="resource-table-actions"><div className="resource-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar projeto, recurso ou função..."/></div><select className="filter-box" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}><option value="all">Todos os projetos</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code}</option>)}</select></div></div>
      <div className="table-wrap resource-table-wrap"><table className="resource-table"><thead><tr><th>Projeto</th><th>Recurso</th><th>Função</th><th>Planejado</th><th>Realizado</th><th>Capacidade</th><th>Utilização</th><th>Status</th><th/></tr></thead><tbody>
        {loading ? <tr><td colSpan={9}><div className="empty">Carregando recursos...</div></td></tr> : filtered.length === 0 ? <tr><td colSpan={9}><div className="resource-empty"><Users size={27}/><strong>Nenhuma alocação encontrada</strong><span>Cadastre o primeiro recurso para começar o acompanhamento de capacidade.</span><button className="primary-btn" type="button" onClick={openCreate}><Plus size={16}/> Novo recurso</button></div></td></tr> : filtered.map(row => { const p=projectMap.get(row.project_id); const u=Number(row.capacity_hours)>0?Math.round(Number(row.actual_hours)/Number(row.capacity_hours)*100):0; return <tr key={row.id}><td><div className="resource-project"><span className="status-mini"/><div><strong>{p?.code || "—"}</strong><span>{p?.name || "Projeto"}</span></div></div></td><td><strong>{row.resource_name}</strong></td><td>{row.role || "—"}</td><td>{Number(row.planned_hours).toLocaleString("pt-BR")}h</td><td>{Number(row.actual_hours).toLocaleString("pt-BR")}h</td><td>{Number(row.capacity_hours).toLocaleString("pt-BR")}h</td><td><div className="execution-cell"><span>{u}%</span><div><b style={{width:`${Math.min(u,100)}%`}}/></div></div></td><td><span className={`status-pill ${u>100?"over":"ok"}`}>{u>100?"Sobrecarga":"Normal"}</span></td><td><button className="row-action danger" type="button" onClick={()=>remove(row.id)} aria-label="Excluir"><Trash2 size={15}/></button></td></tr> })}
      </tbody></table></div>
    </section>

    <div className="resource-main-grid"><section className="resource-panel capacity-panel"><div className="resource-panel-head"><div><span className="section-kicker">CAPACITY</span><h3>Capacidade consolidada</h3></div><Gauge size={18}/></div><div className="capacity-gauge"><div className="gauge-track"><div className="gauge-value" style={{width:`${Math.min(utilization,100)}%`}}/></div><strong>{utilization}%</strong><span>{actual.toLocaleString("pt-BR")}h realizadas de {capacity.toLocaleString("pt-BR")}h de capacidade.</span></div></section><section className="resource-panel allocation-panel"><div className="resource-panel-head"><div><span className="section-kicker">RESOURCE POOL</span><h3>Distribuição do pool</h3></div><Users size={18}/></div><div className="resource-pool">{rows.slice(0,6).map(r=><div className="resource-pool-item" key={r.id}><div className="avatar">{r.resource_name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div><div><strong>{r.resource_name}</strong><span>{r.role || "Recurso"}</span></div></div>)}{rows.length===0&&<span className="resource-muted">Nenhum recurso cadastrado.</span>}</div></section></div>

    {modalOpen && <div className="modal-backdrop" onClick={()=>setModalOpen(false)}><div className="raid-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="section-kicker">RESOURCE ALLOCATION</span><h2>Novo recurso</h2><p>Cadastre a alocação do recurso em um projeto.</p></div><button className="icon-btn" type="button" onClick={()=>setModalOpen(false)}><X size={18}/></button></div><div className="form-grid"><Field label="Projeto"><select value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}><option value="">Selecione...</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></Field><Field label="Recurso"><input value={form.resource_name} onChange={e=>setForm({...form,resource_name:e.target.value})} placeholder="Nome do recurso"/></Field><Field label="Função"><input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} placeholder="Ex.: Consultor FI"/></Field><Field label="Horas planejadas"><input type="number" min="0" value={form.planned_hours} onChange={e=>setForm({...form,planned_hours:e.target.value})}/></Field><Field label="Horas realizadas"><input type="number" min="0" value={form.actual_hours} onChange={e=>setForm({...form,actual_hours:e.target.value})}/></Field><Field label="Capacidade"><input type="number" min="0" value={form.capacity_hours} onChange={e=>setForm({...form,capacity_hours:e.target.value})}/></Field><Field label="Alocação %"><input type="number" min="0" max="100" value={form.allocation_percent} onChange={e=>setForm({...form,allocation_percent:e.target.value})}/></Field><Field label="Início"><input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/></Field><Field label="Fim"><input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/></Field></div><div className="modal-footer"><button className="secondary-btn" type="button" onClick={()=>setModalOpen(false)}>Cancelar</button><button className="primary-btn" type="button" disabled={saving} onClick={save}>{saving?"Salvando...":"Cadastrar recurso"}</button></div></div></div>}
  </section>;
}
function ResourceKpi({icon,label,value,helper,tone}:{icon:React.ReactNode;label:string;value:string|number;helper:string;tone:string}){return <div className="resource-kpi"><div className={`resource-kpi-icon ${tone}`}>{icon}</div><div className="resource-kpi-body"><span>{label}</span><strong>{value}</strong><small>{helper}</small></div><div className={`resource-kpi-line ${tone}`}/></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="form-field"><span>{label}</span>{children}</label>}
