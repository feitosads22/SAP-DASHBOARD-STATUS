import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Edit3,
  Filter,
  Flag,
  Link2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = { id: string; code: string; name: string };
type RaidType = "risk" | "issue" | "action" | "decision" | "dependency";
type RaidStatus = "open" | "in_progress" | "resolved" | "accepted" | "cancelled";
type RaidPriority = "low" | "medium" | "high" | "critical";

type RaidItem = {
  id: string;
  project_id: string;
  type: RaidType;
  title: string;
  description?: string | null;
  status: RaidStatus;
  priority: RaidPriority;
  owner?: string | null;
  due_date?: string | null;
  impact?: string | null;
  mitigation?: string | null;
  action_plan?: string | null;
  decision?: string | null;
  dependency?: string | null;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  project_id: string;
  type: RaidType;
  title: string;
  description: string;
  status: RaidStatus;
  priority: RaidPriority;
  owner: string;
  due_date: string;
  impact: string;
  mitigation: string;
  action_plan: string;
  decision: string;
  dependency: string;
};

const emptyForm: FormState = {
  project_id: "",
  type: "risk",
  title: "",
  description: "",
  status: "open",
  priority: "medium",
  owner: "",
  due_date: "",
  impact: "",
  mitigation: "",
  action_plan: "",
  decision: "",
  dependency: "",
};

const typeLabels: Record<RaidType, string> = {
  risk: "Risco",
  issue: "Issue",
  action: "Ação",
  decision: "Decisão",
  dependency: "Dependência",
};

const statusLabels: Record<RaidStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
  accepted: "Aceito",
  cancelled: "Cancelado",
};

const priorityLabels: Record<RaidPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

function dateText(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

function daysToDue(value?: string | null) {
  if (!value) return null;
  const target = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.round((target - today) / 86400000);
}

export default function RAID({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState<RaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RaidItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function loadItems() {
    setLoading(true);
    setError("");
    if (!supabaseConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error: requestError } = await supabase
      .from("project_raid_items")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (requestError) {
      console.error(requestError);
      setError("Não foi possível carregar o RAID. Execute o SQL da Fase 4 e verifique as permissões.");
      setItems([]);
    } else {
      setItems((data || []) as RaidItem[]);
    }
    setLoading(false);
  }

  useEffect(() => { loadItems(); }, []);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const project = projectMap.get(item.project_id);
      const haystack = [item.title, item.description, item.owner, item.impact, item.mitigation, project?.code, project?.name]
        .filter(Boolean).join(" ").toLowerCase();
      return (!q || haystack.includes(q)) &&
        (typeFilter === "all" || item.type === typeFilter) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (priorityFilter === "all" || item.priority === priorityFilter) &&
        (projectFilter === "all" || item.project_id === projectFilter);
    });
  }, [items, projectMap, query, typeFilter, statusFilter, priorityFilter, projectFilter]);

  const metrics = useMemo(() => ({
    total: items.length,
    open: items.filter((i) => i.status === "open" || i.status === "in_progress").length,
    critical: items.filter((i) => i.priority === "critical").length,
    overdue: items.filter((i) => { const d = daysToDue(i.due_date); return d !== null && d < 0 && i.status !== "resolved" && i.status !== "cancelled"; }).length,
    risks: items.filter((i) => i.type === "risk").length,
    issues: items.filter((i) => i.type === "issue").length,
    actions: items.filter((i) => i.type === "action").length,
    decisions: items.filter((i) => i.type === "decision").length,
    dependencies: items.filter((i) => i.type === "dependency").length,
  }), [items]);

  function openCreate(type: RaidType = "risk") {
    setEditing(null);
    setForm({ ...emptyForm, type, project_id: projects[0]?.id || "" });
    setModalOpen(true);
  }

  function openEdit(item: RaidItem) {
    setEditing(item);
    setForm({
      project_id: item.project_id,
      type: item.type,
      title: item.title,
      description: item.description || "",
      status: item.status,
      priority: item.priority,
      owner: item.owner || "",
      due_date: item.due_date?.slice(0, 10) || "",
      impact: item.impact || "",
      mitigation: item.mitigation || "",
      action_plan: item.action_plan || "",
      decision: item.decision || "",
      dependency: item.dependency || "",
    });
    setModalOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!form.project_id || !form.title.trim()) {
      setError("Informe o projeto e o título do item.");
      return;
    }
    if (!supabaseConfigured) {
      setError("Configure o Supabase antes de cadastrar itens.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      project_id: form.project_id,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      owner: form.owner.trim() || null,
      due_date: form.due_date || null,
      impact: form.impact.trim() || null,
      mitigation: form.mitigation.trim() || null,
      action_plan: form.action_plan.trim() || null,
      decision: form.decision.trim() || null,
      dependency: form.dependency.trim() || null,
    };
    const result = editing
      ? await supabase.from("project_raid_items").update(payload).eq("id", editing.id)
      : await supabase.from("project_raid_items").insert(payload);
    if (result.error) {
      console.error(result.error);
      setError(result.error.message || "Não foi possível salvar o item.");
    } else {
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await loadItems();
    }
    setSaving(false);
  }

  async function remove(item: RaidItem) {
    if (!supabaseConfigured || !window.confirm(`Excluir "${item.title}"?`)) return;
    const { error: requestError } = await supabase.from("project_raid_items").delete().eq("id", item.id);
    if (requestError) setError(requestError.message || "Não foi possível excluir o item.");
    else await loadItems();
  }

  return (
    <section className="content raid-module">
      <div className="module-hero">
        <div>
          <div className="eyebrow">RAID GOVERNANCE</div>
          <h2>Controle de riscos e pendências</h2>
          <p>Centralize Riscos, Issues, Ações, Decisões e Dependências com responsável, prioridade e prazo.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => openCreate()}><Plus size={17} /> Novo item</button>
      </div>

      {error && <div className="module-alert"><AlertTriangle size={17} /><span>{error}</span><button className="icon-btn" type="button" onClick={() => setError("")}><X size={16} /></button></div>}

      <div className="raid-kpis">
        <Metric icon={<ShieldAlert size={18} />} label="Total RAID" value={metrics.total} />
        <Metric icon={<Clock3 size={18} />} label="Em aberto" value={metrics.open} tone="attention" />
        <Metric icon={<Flag size={18} />} label="Prioridade crítica" value={metrics.critical} tone="critical" />
        <Metric icon={<AlertTriangle size={18} />} label="Atrasados" value={metrics.overdue} tone="critical" />
      </div>

      <div className="raid-breakdown">
        <Breakdown label="Riscos" value={metrics.risks} tone="critical" icon={<ShieldAlert size={17} />} />
        <Breakdown label="Issues" value={metrics.issues} tone="attention" icon={<AlertTriangle size={17} />} />
        <Breakdown label="Ações" value={metrics.actions} icon={<CheckCircle2 size={17} />} />
        <Breakdown label="Decisões" value={metrics.decisions} icon={<Target size={17} />} />
        <Breakdown label="Dependências" value={metrics.dependencies} icon={<Link2 size={17} />} />
      </div>

      <section className="panel raid-panel">
        <div className="panel-head raid-panel-head">
          <div><h3>Itens RAID</h3><p>Lista operacional para acompanhamento e cobrança.</p></div>
          <button className="refresh" type="button" onClick={loadItems}><RefreshCw size={15} /> Atualizar</button>
        </div>
        <div className="raid-toolbar">
          <label className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar item, projeto ou responsável" /></label>
          <label className="filter-box"><Filter size={15} /><select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}><option value="all">Todos os projetos</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</select></label>
          <select className="select-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">Todos os tipos</option>{Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select className="select-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Todos os status</option>{Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select className="select-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}><option value="all">Prioridades</option>{Object.entries(priorityLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>

        <div className="table-wrap">
          {loading ? <div className="empty">Carregando RAID...</div> : filtered.length === 0 ? <div className="raid-empty"><ShieldAlert size={25} /><strong>Nenhum item encontrado</strong><span>Cadastre o primeiro risco, issue, ação, decisão ou dependência.</span><button className="primary-btn" type="button" onClick={() => openCreate()}><Plus size={16} /> Cadastrar item</button></div> : (
            <table className="raid-table"><thead><tr><th>Tipo</th><th>Item</th><th>Projeto</th><th>Prioridade</th><th>Responsável</th><th>Prazo</th><th>Status</th><th /></tr></thead><tbody>
              {filtered.map((item) => {
                const project = projectMap.get(item.project_id);
                const days = daysToDue(item.due_date);
                const overdue = days !== null && days < 0 && item.status !== "resolved" && item.status !== "cancelled";
                return <tr key={item.id}>
                  <td><span className={`raid-type ${item.type}`}>{typeLabels[item.type]}</span></td>
                  <td><div className="raid-item-title"><strong>{item.title}</strong><span>{item.description || "Sem descrição"}</span></div></td>
                  <td><div className="project"><strong>{project?.code || "—"}</strong><span>{project?.name || "Projeto não encontrado"}</span></div></td>
                  <td><span className={`priority-badge ${item.priority}`}>{priorityLabels[item.priority]}</span></td>
                  <td><span className="owner-cell"><UserRound size={14} />{item.owner || "Não definido"}</span></td>
                  <td><span className={overdue ? "due overdue" : "due"}>{dateText(item.due_date)}{overdue ? " · atrasado" : ""}</span></td>
                  <td><span className={`raid-status ${item.status}`}>{statusLabels[item.status]}</span></td>
                  <td><div className="row-actions"><button className="table-action" type="button" onClick={() => openEdit(item)} title="Editar"><Edit3 size={15} /></button><button className="table-action danger" type="button" onClick={() => remove(item)} title="Excluir"><Trash2 size={15} /></button></div></td>
                </tr>;
              })}
            </tbody></table>
          )}
        </div>
      </section>

      <div className="raid-footnote"><span><ShieldAlert size={14} /> Governança operacional</span><span>{filtered.length} de {items.length} itens exibidos</span></div>

      {modalOpen && <div className="modal-backdrop" onClick={() => setModalOpen(false)}><div className="raid-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><div><span className="section-kicker">RAID ITEM</span><h2>{editing ? "Editar item" : "Novo item RAID"}</h2><p>Registre o item com informações suficientes para acompanhamento executivo.</p></div><button className="icon-btn" type="button" onClick={() => setModalOpen(false)}><X size={18} /></button></div>
        <div className="form-grid">
          <Field label="Projeto"><select value={form.project_id} onChange={(e) => setField("project_id", e.target.value)}><option value="">Selecione...</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></Field>
          <Field label="Tipo"><select value={form.type} onChange={(e) => setField("type", e.target.value as RaidType)}>{Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Título" full><input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Ex.: Integração FI ainda sem homologação" /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => setField("status", e.target.value as RaidStatus)}>{Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Prioridade"><select value={form.priority} onChange={(e) => setField("priority", e.target.value as RaidPriority)}>{Object.entries(priorityLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Responsável"><input value={form.owner} onChange={(e) => setField("owner", e.target.value)} placeholder="Nome / área" /></Field>
          <Field label="Prazo"><input type="date" value={form.due_date} onChange={(e) => setField("due_date", e.target.value)} /></Field>
          <Field label="Impacto"><input value={form.impact} onChange={(e) => setField("impact", e.target.value)} placeholder="Impacto no projeto" /></Field>
          <Field label="Descrição" full><textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Contexto do item" /></Field>
          <Field label="Mitigação"><textarea value={form.mitigation} onChange={(e) => setField("mitigation", e.target.value)} rows={3} placeholder="Como reduzir o risco/impacto" /></Field>
          <Field label="Plano de ação"><textarea value={form.action_plan} onChange={(e) => setField("action_plan", e.target.value)} rows={3} placeholder="Próximos passos" /></Field>
          <Field label="Decisão"><textarea value={form.decision} onChange={(e) => setField("decision", e.target.value)} rows={3} placeholder="Decisão tomada ou requerida" /></Field>
          <Field label="Dependência"><textarea value={form.dependency} onChange={(e) => setField("dependency", e.target.value)} rows={3} placeholder="Dependência externa ou interna" /></Field>
        </div>
        <div className="modal-footer"><button className="secondary-btn" type="button" onClick={() => setModalOpen(false)}>Cancelar</button><button className="primary-btn" type="button" disabled={saving} onClick={save}>{saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar item"}</button></div>
      </div></div>}
    </section>
  );
}

function Metric({ icon, label, value, tone = "" }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return <div className={`raid-metric ${tone}`}><div className="raid-metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}
function Breakdown({ icon, label, value, tone = "" }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return <div className={`raid-breakdown-item ${tone}`}><div>{icon}</div><span>{label}</span><strong>{value}</strong></div>;
}
function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`form-field ${full ? "full" : ""}`}><span>{label}</span>{children}</label>;
}
