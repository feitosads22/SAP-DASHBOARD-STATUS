import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Plus, Search, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = { id: string; code: string; name: string };
type RaciRow = {
  id: string;
  project_id: string;
  activity: string;
  responsible: string;
  accountable: string;
  consulted: string | null;
  informed: string | null;
  status: string;
  due_date: string | null;
  notes: string | null;
};

const emptyForm = {
  project_id: "",
  activity: "",
  responsible: "",
  accountable: "",
  consulted: "",
  informed: "",
  status: "active",
  due_date: "",
  notes: "",
};

export default function RACI({ projects }: { projects: Project[] }) {
  const [rows, setRows] = useState<RaciRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    setError("");
    if (!supabaseConfigured) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data, error: requestError } = await supabase
      .from("project_raci")
      .select("*")
      .order("created_at", { ascending: false });
    if (requestError) {
      setRows([]);
      setError("Não foi possível carregar a matriz RACI. Execute o SQL da fase no Supabase.");
    } else {
      setRows((data || []) as RaciRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const filtered = useMemo(() => rows.filter(row => {
    const project = projectMap.get(row.project_id);
    const haystack = `${row.activity} ${row.responsible} ${row.accountable} ${row.consulted || ""} ${row.informed || ""} ${project?.code || ""} ${project?.name || ""}`.toLowerCase();
    return (projectFilter === "all" || row.project_id === projectFilter)
      && (statusFilter === "all" || row.status === statusFilter)
      && haystack.includes(search.toLowerCase());
  }), [rows, projectMap, projectFilter, statusFilter, search]);

  const active = rows.filter(r => r.status === "active").length;
  const overdue = rows.filter(r => r.due_date && new Date(`${r.due_date}T23:59:59`) < new Date() && r.status !== "completed").length;
  const projectsCovered = new Set(rows.map(r => r.project_id)).size;

  function openCreate() {
    setForm({ ...emptyForm, project_id: projects[0]?.id || "" });
    setError("");
    setModalOpen(true);
  }

  async function save() {
    if (!form.project_id || !form.activity.trim() || !form.responsible.trim() || !form.accountable.trim()) {
      setError("Informe projeto, atividade, responsável e accountable.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: requestError } = await supabase.from("project_raci").insert({
      project_id: form.project_id,
      activity: form.activity.trim(),
      responsible: form.responsible.trim(),
      accountable: form.accountable.trim(),
      consulted: form.consulted.trim() || null,
      informed: form.informed.trim() || null,
      status: form.status,
      due_date: form.due_date || null,
      notes: form.notes.trim() || null,
    });
    if (requestError) setError(requestError.message);
    else { setModalOpen(false); await load(); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta responsabilidade da matriz RACI?")) return;
    const { error: requestError } = await supabase.from("project_raci").delete().eq("id", id);
    if (requestError) setError(requestError.message); else await load();
  }

  return (
    <section className="content">
      <div className="module-hero raci-hero">
        <div className="module-icon"><ShieldCheck size={26} /></div>
        <div>
          <div className="eyebrow">GOVERNANCE CONTROL</div>
          <h2>RACI</h2>
          <p>Responsabilidades claras para cada atividade crítica do projeto.</p>
        </div>
        <button className="primary-btn" onClick={openCreate} type="button"><Plus size={17} /> Nova responsabilidade</button>
      </div>

      <div className="kpis module-kpis">
        <Kpi title="Responsabilidades" value={rows.length} icon={<ClipboardList size={18} />} />
        <Kpi title="Ativas" value={active} icon={<CheckCircle2 size={18} />} />
        <Kpi title="Projetos cobertos" value={projectsCovered} icon={<Users size={18} />} />
        <Kpi title="Em atraso" value={overdue} icon={<ShieldCheck size={18} />} tone={overdue ? "critical" : "healthy"} />
      </div>

      <section className="panel operational-panel">
        <div className="panel-head">
          <div><h3>Matriz de responsabilidades</h3><p>Quem executa, responde, é consultado e deve ser informado.</p></div>
          <button className="secondary-btn" onClick={load} type="button">Atualizar</button>
        </div>

        <div className="toolbar">
          <label className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar atividade ou responsável" /></label>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}><option value="all">Todos os projetos</option>{projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">Todos os status</option><option value="active">Ativo</option><option value="completed">Concluído</option><option value="blocked">Bloqueado</option></select>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? <div className="empty-state">Carregando matriz...</div> : filtered.length === 0 ? (
          <div className="empty-state"><ShieldCheck size={30} /><strong>Nenhuma responsabilidade cadastrada</strong><span>Comece criando a matriz RACI das atividades críticas.</span><button className="primary-btn" onClick={openCreate} type="button"><Plus size={17} /> Cadastrar responsabilidade</button></div>
        ) : (
          <div className="table-wrap"><table><thead><tr><th>Projeto</th><th>Atividade</th><th>R — Responsável</th><th>A — Accountable</th><th>C — Consultado</th><th>I — Informado</th><th>Prazo</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(row => { const project = projectMap.get(row.project_id); return <tr key={row.id}><td><strong>{project?.code || "—"}</strong></td><td><strong>{row.activity}</strong><small>{row.notes || ""}</small></td><td>{row.responsible}</td><td>{row.accountable}</td><td>{row.consulted || "—"}</td><td>{row.informed || "—"}</td><td>{row.due_date ? new Date(`${row.due_date}T00:00:00`).toLocaleDateString("pt-BR") : "—"}</td><td><span className={`status-pill ${row.status}`}>{row.status === "completed" ? "Concluído" : row.status === "blocked" ? "Bloqueado" : "Ativo"}</span></td><td><button className="table-action danger" onClick={() => remove(row.id)} title="Excluir" type="button"><Trash2 size={16} /></button></td></tr>; })}</tbody></table></div>
        )}
      </section>

      {modalOpen && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModalOpen(false)}><div className="modal-card"><div className="modal-head"><div><span className="eyebrow">GOVERNANCE</span><h3>Nova responsabilidade</h3></div><button className="icon-btn" onClick={() => setModalOpen(false)} type="button"><X size={18} /></button></div><div className="form-grid"><label>Projeto<select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}><option value="">Selecione</option>{projects.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></label><label>Atividade<input value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} placeholder="Ex.: Aprovação do desenho funcional" /></label><label>R — Responsável<input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} placeholder="Nome / área" /></label><label>A — Accountable<input value={form.accountable} onChange={e => setForm({ ...form, accountable: e.target.value })} placeholder="Nome / área" /></label><label>C — Consultado<input value={form.consulted} onChange={e => setForm({ ...form, consulted: e.target.value })} placeholder="Nome / área" /></label><label>I — Informado<input value={form.informed} onChange={e => setForm({ ...form, informed: e.target.value })} placeholder="Nome / área" /></label><label>Prazo<input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></label><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Ativo</option><option value="completed">Concluído</option><option value="blocked">Bloqueado</option></select></label><label className="full">Observações<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></label></div>{error && <div className="error-banner">{error}</div>}<div className="modal-actions"><button className="secondary-btn" onClick={() => setModalOpen(false)} type="button">Cancelar</button><button className="primary-btn" disabled={saving} onClick={save} type="button">{saving ? "Salvando..." : "Salvar responsabilidade"}</button></div></div></div>}
    </section>
  );
}

function Kpi({ title, value, icon, tone }: { title: string; value: number; icon: React.ReactNode; tone?: string }) {
  return <div className={`kpi ${tone || ""}`}><div className="kpi-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong></div></div>;
}
