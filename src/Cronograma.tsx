import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Edit3,
  Filter,
  Flag,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = {
  id: string;
  code: string;
  name: string;
  current_phase?: string;
  progress?: number;
  spi?: number;
  days_to_go_live?: number;
};

type ScheduleItem = {
  id: string;
  project_id: string;
  activity_name: string;
  activity_code?: string | null;
  phase?: string | null;
  responsible?: string | null;
  status: "planned" | "in_progress" | "completed" | "delayed" | "cancelled";
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  planned_progress: number;
  actual_progress: number;
  spi?: number | null;
  is_milestone: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  project_id: string;
  activity_name: string;
  activity_code: string;
  phase: string;
  responsible: string;
  status: ScheduleItem["status"];
  planned_start: string;
  planned_end: string;
  actual_start: string;
  actual_end: string;
  planned_progress: string;
  actual_progress: string;
  spi: string;
  is_milestone: boolean;
  notes: string;
};

const emptyForm: FormState = {
  project_id: "",
  activity_name: "",
  activity_code: "",
  phase: "",
  responsible: "",
  status: "planned",
  planned_start: "",
  planned_end: "",
  actual_start: "",
  actual_end: "",
  planned_progress: "0",
  actual_progress: "0",
  spi: "",
  is_milestone: false,
  notes: "",
};

const statusLabels: Record<ScheduleItem["status"], string> = {
  planned: "Planejado",
  in_progress: "Em andamento",
  completed: "Concluído",
  delayed: "Atrasado",
  cancelled: "Cancelado",
};

const statusClass: Record<ScheduleItem["status"], string> = {
  planned: "planned",
  in_progress: "progressing",
  completed: "completed",
  delayed: "delayed",
  cancelled: "cancelled",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function projectName(projects: Project[], id: string) {
  return projects.find((project) => project.id === id);
}

function daysBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${end}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function dateDiffFromToday(value?: string | null) {
  if (!value) return null;
  const target = new Date(`${value}T00:00:00`).getTime();
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.round((target - base) / 86400000);
}

export default function Cronograma({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"timeline" | "table">("timeline");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function loadSchedule() {
    setLoading(true);
    setError("");

    if (!supabaseConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error: requestError } = await supabase
      .from("project_schedule_items")
      .select("*")
      .order("planned_start", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (requestError) {
      console.error("Erro ao carregar cronograma:", requestError);
      setItems([]);
      setError("Não foi possível carregar as atividades. Verifique as permissões da tabela no Supabase.");
    } else {
      setItems((data || []) as ScheduleItem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSchedule();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();

    return items.filter((item) => {
      const project = projectName(projects, item.project_id);
      const haystack = [
        item.activity_name,
        item.activity_code,
        item.phase,
        item.responsible,
        project?.code,
        project?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!normalized || haystack.includes(normalized)) &&
        (projectFilter === "all" || item.project_id === projectFilter) &&
        (statusFilter === "all" || item.status === statusFilter)
      );
    });
  }, [items, projects, projectFilter, query, statusFilter]);

  const metrics = useMemo(() => {
    const total = items.length;
    const completed = items.filter((item) => item.status === "completed").length;
    const delayed = items.filter((item) => item.status === "delayed").length;
    const milestones = items.filter((item) => item.is_milestone).length;
    const planned = total
      ? Math.round(items.reduce((sum, item) => sum + Number(item.planned_progress || 0), 0) / total)
      : 0;
    const actual = total
      ? Math.round(items.reduce((sum, item) => sum + Number(item.actual_progress || 0), 0) / total)
      : 0;
    const spiValues = items.map((item) => Number(item.spi)).filter(Number.isFinite);
    const spi = spiValues.length
      ? spiValues.reduce((sum, value) => sum + value, 0) / spiValues.length
      : 0;

    return { total, completed, delayed, milestones, planned, actual, spi };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, project_id: projects[0]?.id || "" });
    setModalOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditing(item);
    setForm({
      project_id: item.project_id,
      activity_name: item.activity_name,
      activity_code: item.activity_code || "",
      phase: item.phase || "",
      responsible: item.responsible || "",
      status: item.status,
      planned_start: toDateInput(item.planned_start),
      planned_end: toDateInput(item.planned_end),
      actual_start: toDateInput(item.actual_start),
      actual_end: toDateInput(item.actual_end),
      planned_progress: String(item.planned_progress ?? 0),
      actual_progress: String(item.actual_progress ?? 0),
      spi: item.spi == null ? "" : String(item.spi),
      is_milestone: Boolean(item.is_milestone),
      notes: item.notes || "",
    });
    setModalOpen(true);
  };

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveItem() {
    if (!form.project_id || !form.activity_name.trim()) {
      setError("Informe o projeto e o nome da atividade.");
      return;
    }

    if (!supabaseConfigured) {
      setError("Configure o Supabase antes de cadastrar atividades.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      project_id: form.project_id,
      activity_name: form.activity_name.trim(),
      activity_code: form.activity_code.trim() || null,
      phase: form.phase.trim() || null,
      responsible: form.responsible.trim() || null,
      status: form.status,
      planned_start: form.planned_start || null,
      planned_end: form.planned_end || null,
      actual_start: form.actual_start || null,
      actual_end: form.actual_end || null,
      planned_progress: Math.min(100, Math.max(0, Number(form.planned_progress) || 0)),
      actual_progress: Math.min(100, Math.max(0, Number(form.actual_progress) || 0)),
      spi: form.spi.trim() === "" ? null : Number(form.spi),
      is_milestone: form.is_milestone,
      notes: form.notes.trim() || null,
    };

    const result = editing
      ? await supabase.from("project_schedule_items").update(payload).eq("id", editing.id)
      : await supabase.from("project_schedule_items").insert(payload);

    if (result.error) {
      console.error("Erro ao salvar atividade:", result.error);
      setError(`Não foi possível salvar a atividade: ${result.error.message}`);
    } else {
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await loadSchedule();
    }

    setSaving(false);
  }

  async function deleteItem(item: ScheduleItem) {
    if (!window.confirm(`Excluir a atividade "${item.activity_name}"?`)) return;
    if (!supabaseConfigured) return;

    const { error: deleteError } = await supabase
      .from("project_schedule_items")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setError(`Não foi possível excluir: ${deleteError.message}`);
      return;
    }

    await loadSchedule();
  }

  return (
    <section className="content schedule-page">
      <div className="schedule-breadcrumb">
        <span>Início</span>
        <ChevronRight size={13} />
        <strong>Cronograma</strong>
      </div>

      <div className="schedule-hero">
        <div className="schedule-hero-copy">
          <div className="schedule-icon"><CalendarDays size={24} /></div>
          <div>
            <div className="eyebrow">DELIVERY MANAGEMENT</div>
            <h2>Cronograma</h2>
            <p>Planeje atividades, acompanhe o realizado e antecipe desvios antes do Go-Live.</p>
          </div>
        </div>

        <div className="schedule-actions">
          <button className="secondary-btn schedule-refresh" type="button" onClick={loadSchedule} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            Atualizar
          </button>
          <button className="primary-btn" type="button" onClick={openCreate}>
            <Plus size={17} />
            Nova atividade
          </button>
        </div>
      </div>

      {error && (
        <div className="schedule-alert">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Fechar alerta"><X size={15} /></button>
        </div>
      )}

      <div className="schedule-kpis">
        <ScheduleKpi icon={<ListChecks size={19} />} label="Atividades" value={metrics.total} detail="Linhas cadastradas" tone="blue" />
        <ScheduleKpi icon={<CheckCircle2 size={19} />} label="Concluídas" value={metrics.completed} detail={metrics.total ? `${Math.round((metrics.completed / metrics.total) * 100)}% do cronograma` : "Sem atividades"} tone="green" />
        <ScheduleKpi icon={<AlertCircle size={19} />} label="Atrasadas" value={metrics.delayed} detail={metrics.delayed ? "Exigem ação" : "Nenhum atraso"} tone="red" />
        <ScheduleKpi icon={<Zap size={19} />} label="SPI médio" value={metrics.spi ? metrics.spi.toFixed(2) : "—"} detail="Performance do prazo" tone="purple" />
        <ScheduleKpi icon={<Flag size={19} />} label="Marcos" value={metrics.milestones} detail="Milestones" tone="orange" />
      </div>

      <section className="schedule-control-panel">
        <div className="schedule-filters">
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atividade, projeto ou responsável" />
          </div>

          <label className="filter-select">
            <Filter size={15} />
            <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
              <option value="all">Todos os projetos</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.code}</option>)}
            </select>
            <ChevronDown size={14} />
          </label>

          <label className="filter-select">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Todos os status</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <ChevronDown size={14} />
          </label>
        </div>

        <div className="schedule-view-toggle">
          <button type="button" className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}>Timeline</button>
          <button type="button" className={view === "table" ? "active" : ""} onClick={() => setView("table")}>Tabela</button>
        </div>
      </section>

      <section className="schedule-overview">
        <div className="schedule-progress-card">
          <div className="schedule-card-heading">
            <div>
              <span className="section-kicker">DELIVERY PERFORMANCE</span>
              <h3>Planejado x realizado</h3>
            </div>
            <strong>{metrics.actual}%</strong>
          </div>
          <div className="dual-progress">
            <div className="dual-progress-row">
              <span>Planejado</span>
              <div><b style={{ width: `${metrics.planned}%` }} /></div>
              <strong>{metrics.planned}%</strong>
            </div>
            <div className="dual-progress-row actual-row">
              <span>Realizado</span>
              <div><b style={{ width: `${metrics.actual}%` }} /></div>
              <strong>{metrics.actual}%</strong>
            </div>
          </div>
        </div>

        <div className="schedule-go-live-card">
          <div className="schedule-card-heading">
            <div>
              <span className="section-kicker">GO-LIVE CONTROL</span>
              <h3>Próximo marco</h3>
            </div>
            <Target size={19} />
          </div>
          {(() => {
            const milestone = [...items]
              .filter((item) => item.is_milestone && item.planned_end)
              .sort((a, b) => String(a.planned_end).localeCompare(String(b.planned_end)))[0];
            const diff = dateDiffFromToday(milestone?.planned_end);
            return milestone ? (
              <div className="go-live-main">
                <strong>{formatDate(milestone.planned_end)}</strong>
                <span>{milestone.activity_name}</span>
                <small>{diff == null ? "" : diff < 0 ? `${Math.abs(diff)} dias em atraso` : diff === 0 ? "Hoje" : `Em ${diff} dias`}</small>
              </div>
            ) : (
              <div className="schedule-no-data"><Flag size={17} /><span>Nenhum marco cadastrado.</span></div>
            );
          })()}
        </div>
      </section>

      <section className="schedule-panel">
        <div className="schedule-panel-head">
          <div>
            <span className="section-kicker">PROJECT DELIVERY PLAN</span>
            <h3>Plano de execução</h3>
            <p>{filtered.length} {filtered.length === 1 ? "atividade encontrada" : "atividades encontradas"}</p>
          </div>
          <span className="count">{items.length} total</span>
        </div>

        {loading ? (
          <div className="schedule-empty"><RefreshCw size={22} className="spin" /><strong>Carregando cronograma</strong><span>Consultando as atividades no Supabase.</span></div>
        ) : filtered.length === 0 ? (
          <div className="schedule-empty">
            <CalendarDays size={28} />
            <strong>{items.length ? "Nenhuma atividade corresponde aos filtros" : "Cronograma ainda vazio"}</strong>
            <span>{items.length ? "Ajuste os filtros ou a busca para visualizar outras atividades." : "Cadastre a primeira atividade para começar o acompanhamento operacional."}</span>
            {!items.length && <button className="primary-btn" type="button" onClick={openCreate}><Plus size={16} /> Cadastrar atividade</button>}
          </div>
        ) : view === "timeline" ? (
          <Timeline items={filtered} projects={projects} onEdit={openEdit} onDelete={deleteItem} />
        ) : (
          <ScheduleTable items={filtered} projects={projects} onEdit={openEdit} onDelete={deleteItem} />
        )}
      </section>

      {modalOpen && (
        <div className="schedule-modal-backdrop" onClick={() => !saving && setModalOpen(false)}>
          <div className="schedule-modal" onClick={(event) => event.stopPropagation()}>
            <div className="schedule-modal-head">
              <div>
                <span className="section-kicker">SCHEDULE ITEM</span>
                <h3>{editing ? "Editar atividade" : "Nova atividade"}</h3>
                <p>Registre o planejamento e o realizado da entrega.</p>
              </div>
              <button className="icon-btn" type="button" onClick={() => !saving && setModalOpen(false)} aria-label="Fechar"><X size={18} /></button>
            </div>

            <div className="schedule-form">
              <Field label="Projeto" required>
                <select value={form.project_id} onChange={(event) => updateField("project_id", event.target.value)}>
                  <option value="">Selecione o projeto</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.code} — {project.name}</option>)}
                </select>
              </Field>
              <Field label="Atividade" required>
                <input value={form.activity_name} onChange={(event) => updateField("activity_name", event.target.value)} placeholder="Ex.: Configuração do módulo FI" />
              </Field>
              <Field label="Código"><input value={form.activity_code} onChange={(event) => updateField("activity_code", event.target.value)} placeholder="Ex.: FI-020" /></Field>
              <Field label="Fase"><input value={form.phase} onChange={(event) => updateField("phase", event.target.value)} placeholder="Ex.: Realização" /></Field>
              <Field label="Responsável"><input value={form.responsible} onChange={(event) => updateField("responsible", event.target.value)} placeholder="Nome / squad" /></Field>
              <Field label="Status">
                <select value={form.status} onChange={(event) => updateField("status", event.target.value as ScheduleItem["status"])}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Início planejado"><input type="date" value={form.planned_start} onChange={(event) => updateField("planned_start", event.target.value)} /></Field>
              <Field label="Fim planejado"><input type="date" value={form.planned_end} onChange={(event) => updateField("planned_end", event.target.value)} /></Field>
              <Field label="Início realizado"><input type="date" value={form.actual_start} onChange={(event) => updateField("actual_start", event.target.value)} /></Field>
              <Field label="Fim realizado"><input type="date" value={form.actual_end} onChange={(event) => updateField("actual_end", event.target.value)} /></Field>
              <Field label="Progresso planejado (%)"><input type="number" min="0" max="100" value={form.planned_progress} onChange={(event) => updateField("planned_progress", event.target.value)} /></Field>
              <Field label="Progresso realizado (%)"><input type="number" min="0" max="100" value={form.actual_progress} onChange={(event) => updateField("actual_progress", event.target.value)} /></Field>
              <Field label="SPI"><input type="number" min="0" step="0.01" value={form.spi} onChange={(event) => updateField("spi", event.target.value)} placeholder="Ex.: 0.95" /></Field>
              <label className="milestone-check"><input type="checkbox" checked={form.is_milestone} onChange={(event) => updateField("is_milestone", event.target.checked)} /><span><Flag size={15} /><strong>Marcar como milestone</strong><small>Usar para marcos executivos e Go-Live.</small></span></label>
              <Field label="Observações" full>
                <textarea rows={3} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Dependências, observações ou critérios de conclusão" />
              </Field>
            </div>

            <div className="schedule-modal-footer">
              <button className="secondary-btn" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
              <button className="primary-btn" type="button" onClick={saveItem} disabled={saving}>{saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar atividade"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Timeline({ items, projects, onEdit, onDelete }: { items: ScheduleItem[]; projects: Project[]; onEdit: (item: ScheduleItem) => void; onDelete: (item: ScheduleItem) => void }) {
  return (
    <div className="timeline-wrap">
      <div className="timeline-head">
        <div className="timeline-title">Atividade</div>
        <div>Planejamento</div>
        <div>Realizado</div>
        <div>Status</div>
        <div />
      </div>
      {items.map((item) => {
        const project = projectName(projects, item.project_id);
        const duration = daysBetween(item.planned_start, item.planned_end);
        const diff = dateDiffFromToday(item.planned_end);
        return (
          <div className="timeline-row" key={item.id}>
            <div className="timeline-activity">
              <div className={`timeline-marker ${statusClass[item.status]}`}>{item.is_milestone ? <Flag size={13} /> : <Clock3 size={13} />}</div>
              <div>
                <strong>{item.activity_name}</strong>
                <span>{project?.code || "Projeto"}{item.phase ? ` · ${item.phase}` : ""}{item.responsible ? ` · ${item.responsible}` : ""}</span>
              </div>
            </div>
            <div className="timeline-plan">
              <div className="date-line"><span>{formatDate(item.planned_start)}</span><ChevronRight size={12} /><span>{formatDate(item.planned_end)}</span></div>
              <div className="mini-bar"><b style={{ width: `${Math.min(100, Math.max(0, Number(item.planned_progress || 0)))}%` }} /></div>
              <small>{duration ? `${duration} dias` : "Sem duração"}</small>
            </div>
            <div className="timeline-actual">
              <strong>{Math.round(Number(item.actual_progress || 0))}%</strong>
              <div className="mini-bar actual"><b style={{ width: `${Math.min(100, Math.max(0, Number(item.actual_progress || 0)))}%` }} /></div>
              <small>{diff == null ? "" : diff < 0 && item.status !== "completed" ? `${Math.abs(diff)}d após prazo` : item.status === "completed" ? "Entregue" : diff === 0 ? "Vence hoje" : `${diff}d restantes`}</small>
            </div>
            <div><span className={`status-pill ${statusClass[item.status]}`}>{statusLabels[item.status]}</span>{item.spi != null && <small className="spi-mini">SPI {Number(item.spi).toFixed(2)}</small>}</div>
            <div className="row-actions"><button className="row-action" type="button" onClick={() => onEdit(item)} aria-label="Editar"><Edit3 size={15} /></button><button className="row-action danger" type="button" onClick={() => onDelete(item)} aria-label="Excluir"><Trash2 size={15} /></button></div>
          </div>
        );
      })}
    </div>
  );
}

function ScheduleTable({ items, projects, onEdit, onDelete }: { items: ScheduleItem[]; projects: Project[]; onEdit: (item: ScheduleItem) => void; onDelete: (item: ScheduleItem) => void }) {
  return (
    <div className="table-wrap schedule-table-wrap">
      <table className="schedule-table">
        <thead><tr><th>Atividade</th><th>Projeto</th><th>Fase</th><th>Planejado</th><th>Realizado</th><th>SPI</th><th>Status</th><th /></tr></thead>
        <tbody>{items.map((item) => { const project = projectName(projects, item.project_id); return <tr key={item.id}>
          <td><div className="schedule-table-name"><span className={`timeline-marker compact ${statusClass[item.status]}`}>{item.is_milestone ? <Flag size={12} /> : <ListChecks size={12} />}</span><div><strong>{item.activity_name}</strong><span>{item.activity_code || "Sem código"}</span></div></div></td>
          <td>{project?.code || "—"}</td><td>{item.phase || "—"}</td>
          <td>{formatDate(item.planned_start)} → {formatDate(item.planned_end)}<small>{Math.round(Number(item.planned_progress || 0))}%</small></td>
          <td>{formatDate(item.actual_start)} → {formatDate(item.actual_end)}<small>{Math.round(Number(item.actual_progress || 0))}%</small></td>
          <td>{item.spi == null ? "—" : Number(item.spi).toFixed(2)}</td>
          <td><span className={`status-pill ${statusClass[item.status]}`}>{statusLabels[item.status]}</span></td>
          <td><div className="row-actions"><button className="row-action" type="button" onClick={() => onEdit(item)} aria-label="Editar"><Edit3 size={15} /></button><button className="row-action danger" type="button" onClick={() => onDelete(item)} aria-label="Excluir"><Trash2 size={15} /></button></div></td>
        </tr>; })}</tbody>
      </table>
    </div>
  );
}

function ScheduleKpi({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string | number; detail: string; tone: string }) {
  return <div className="schedule-kpi"><div className={`schedule-kpi-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: ReactNode }) {
  return <label className={`schedule-field ${full ? "full" : ""}`}><span>{label}{required ? " *" : ""}</span>{children}</label>;
}
