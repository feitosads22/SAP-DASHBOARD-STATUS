import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Link2,
  ListChecks,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = {
  id: string;
  code: string;
  name: string;
};

type RaidItem = {
  id: string;
  project_id: string;
  type: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  owner?: string | null;
  due_date?: string | null;
  decision?: string | null;
  dependency?: string | null;
  action_plan?: string | null;
};

type FilterType = "all" | "action" | "decision" | "dependency";

type FormState = {
  status: string;
  owner: string;
  due_date: string;
};

function projectName(projects: Project[], id: string) {
  const project = projects.find((item) => item.id === id);
  return project ? `${project.code} · ${project.name}` : "Projeto";
}

function dateLabel(value?: string | null) {
  if (!value) return "Sem prazo";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function daysToDue(value?: string | null) {
  if (!value) return null;

  const target = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (!Number.isFinite(target)) return null;

  return Math.round((target - today) / 86400000);
}

function typeLabel(type: string) {
  if (type === "action") return "Ação";
  if (type === "decision") return "Decisão";
  if (type === "dependency") return "Dependência";
  return type;
}

function typeIcon(type: string) {
  if (type === "action") return <ListChecks size={16} />;
  if (type === "decision") return <CheckCircle2 size={16} />;
  return <Link2 size={16} />;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    planned: "Planejado",
    in_progress: "Em andamento",
    delayed: "Atrasado",
    completed: "Concluído",
    approved: "Aprovado",
    cancelled: "Cancelado",
    blocked: "Bloqueado",
  };

  return labels[status] || status;
}

function isOpen(status: string) {
  return !["completed", "approved", "cancelled"].includes(status);
}

export default function GovernancaOperacional({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState<RaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RaidItem | null>(null);
  const [form, setForm] = useState<FormState>({
    status: "in_progress",
    owner: "",
    due_date: "",
  });

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
      .select(
        "id,project_id,type,title,description,status,priority,owner,due_date,decision,dependency,action_plan"
      )
      .in("type", ["action", "decision", "dependency"])
      .order("due_date", { ascending: true, nullsFirst: false });

    if (requestError) {
      console.error("Erro ao carregar follow-up:", requestError);
      setItems([]);
      setError(
        "Não foi possível carregar o follow-up operacional. Verifique as permissões e a tabela project_raid_items."
      );
    } else {
      setItems((data || []) as RaidItem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items.filter((item) => {
      const project = projects.find((p) => p.id === item.project_id);

      const haystack = [
        item.title,
        item.description,
        item.owner,
        item.decision,
        item.dependency,
        item.action_plan,
        project?.code,
        project?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!normalized || haystack.includes(normalized)) &&
        (projectFilter === "all" || item.project_id === projectFilter) &&
        (typeFilter === "all" || item.type === typeFilter)
      );
    });
  }, [items, projects, projectFilter, query, typeFilter]);

  const metrics = useMemo(() => {
    const actions = items.filter((item) => item.type === "action");
    const decisions = items.filter((item) => item.type === "decision");
    const dependencies = items.filter((item) => item.type === "dependency");
    const open = items.filter((item) => isOpen(item.status));

    const overdue = items.filter((item) => {
      const days = daysToDue(item.due_date);
      return isOpen(item.status) && days !== null && days < 0;
    });

    const withoutOwner = items.filter(
      (item) => isOpen(item.status) && !item.owner?.trim()
    );

    return {
      actions: actions.length,
      decisions: decisions.length,
      dependencies: dependencies.length,
      open: open.length,
      overdue: overdue.length,
      withoutOwner: withoutOwner.length,
    };
  }, [items]);

  const highlights = useMemo(() => {
    return items
      .filter((item) => isOpen(item.status))
      .map((item) => ({
        item,
        days: daysToDue(item.due_date),
      }))
      .filter(({ days }) => days !== null && days <= 7)
      .sort((a, b) => Number(a.days) - Number(b.days))
      .slice(0, 8);
  }, [items]);

  function openEdit(item: RaidItem) {
    setSelectedItem(item);
    setForm({
      status: item.status || "in_progress",
      owner: item.owner || "",
      due_date: item.due_date?.slice(0, 10) || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setSelectedItem(null);
  }

  async function save() {
    if (!selectedItem || saving) return;

    setSaving(true);
    setError("");

    const { error: requestError } = await supabase
      .from("project_raid_items")
      .update({
        status: form.status,
        owner: form.owner.trim() || null,
        due_date: form.due_date || null,
      })
      .eq("id", selectedItem.id);

    if (requestError) {
      console.error("Erro ao atualizar follow-up:", requestError);
      setError("Não foi possível atualizar o item.");
      setSaving(false);
      return;
    }

    await loadItems();
    setSaving(false);
    closeModal();
  }

  return (
    <section className="content">
      <div className="module-hero">
        <div className="module-icon">
          <ListChecks size={24} />
        </div>

        <div>
          <div className="eyebrow">OPERATIONAL GOVERNANCE</div>
          <h2>Follow-up</h2>
          <p>
            Controle executivo de ações, decisões e dependências que exigem
            acompanhamento contínuo.
          </p>
        </div>
      </div>

      {error && <div className="module-error">{error}</div>}

      <div className="module-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ação, decisão, dependência ou responsável..."
          />
        </div>

        <div className="toolbar-select">
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            aria-label="Filtrar projeto"
          >
            <option value="all">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} · {project.name}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </div>

        <div className="toolbar-select">
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as FilterType)
            }
            aria-label="Filtrar tipo"
          >
            <option value="all">Todos os tipos</option>
            <option value="action">Ações</option>
            <option value="decision">Decisões</option>
            <option value="dependency">Dependências</option>
          </select>
          <ChevronDown size={15} />
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={loadItems}
          disabled={loading}
        >
          Atualizar
        </button>
      </div>

      <div className="module-grid">
        <Metric
          icon={<ListChecks size={19} />}
          label="Ações"
          value={metrics.actions}
        />
        <Metric
          icon={<CheckCircle2 size={19} />}
          label="Decisões"
          value={metrics.decisions}
        />
        <Metric
          icon={<Link2 size={19} />}
          label="Dependências"
          value={metrics.dependencies}
        />
        <Metric
          icon={<ShieldAlert size={19} />}
          label="Em aberto"
          value={metrics.open}
          tone={metrics.open > 0 ? "attention" : "healthy"}
        />
        <Metric
          icon={<AlertTriangle size={19} />}
          label="Atrasados"
          value={metrics.overdue}
          tone={metrics.overdue > 0 ? "critical" : "healthy"}
        />
      </div>

      <div className="governance-operational-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">FOLLOW-UP</span>
              <h3>Itens prioritários</h3>
              <p>Compromissos próximos do vencimento ou já atrasados.</p>
            </div>

            <span className="count">{highlights.length}</span>
          </div>

          <div className="followup-highlights">
            {highlights.length === 0 ? (
              <div className="module-empty">
                <CheckCircle2 size={25} />
                <strong>Nenhum item crítico no horizonte imediato</strong>
                <span>
                  Não existem ações, decisões ou dependências abertas com prazo
                  até os próximos 7 dias.
                </span>
              </div>
            ) : (
              highlights.map(({ item, days }) => (
                <button
                  key={item.id}
                  className={`followup-highlight ${
                    Number(days) < 0 ? "critical" : ""
                  }`}
                  type="button"
                  onClick={() => openEdit(item)}
                >
                  <div className="followup-highlight-icon">
                    {typeIcon(item.type)}
                  </div>

                  <div className="followup-highlight-main">
                    <strong>{item.title}</strong>
                    <span>{projectName(projects, item.project_id)}</span>
                  </div>

                  <div className="followup-highlight-date">
                    <small>
                      {Number(days) < 0
                        ? "Atrasado"
                        : Number(days) === 0
                          ? "Hoje"
                          : `${days}d`}
                    </small>
                    <span>{dateLabel(item.due_date)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">CONTROL</span>
              <h3>Qualidade do follow-up</h3>
              <p>Pontos que podem comprometer o acompanhamento executivo.</p>
            </div>
          </div>

          <div className="followup-control-list">
            <ControlRow
              icon={<AlertTriangle size={17} />}
              label="Itens atrasados"
              value={metrics.overdue}
              tone={metrics.overdue > 0 ? "critical" : "healthy"}
            />

            <ControlRow
              icon={<Users size={17} />}
              label="Sem responsável"
              value={metrics.withoutOwner}
              tone={metrics.withoutOwner > 0 ? "attention" : "healthy"}
            />

            <ControlRow
              icon={<Clock3 size={17} />}
              label="Itens em aberto"
              value={metrics.open}
              tone={metrics.open > 0 ? "attention" : "healthy"}
            />
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="section-kicker">OPERATIONAL COMMITMENTS</span>
            <h3>Controle de ações, decisões e dependências</h3>
            <p>
              {filtered.length}{" "}
              {filtered.length === 1 ? "item exibido" : "itens exibidos"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="module-empty">
            <Clock3 size={25} />
            <strong>Carregando follow-up</strong>
            <span>Consultando os dados operacionais.</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="module-empty">
            <ListChecks size={27} />
            <strong>Nenhum item encontrado</strong>
            <span>
              Ajuste os filtros ou cadastre ações, decisões e dependências no
              módulo RAID.
            </span>
          </div>
        ) : (
          <div className="followup-table-wrap">
            <table className="followup-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Item</th>
                  <th>Projeto</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => {
                  const days = daysToDue(item.due_date);
                  const overdue =
                    isOpen(item.status) && days !== null && days < 0;

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={`followup-type ${item.type}`}>
                          {typeIcon(item.type)}
                          {typeLabel(item.type)}
                        </span>
                      </td>

                      <td>
                        <div className="followup-title-cell">
                          <strong>{item.title}</strong>
                          {item.description && (
                            <span>{item.description}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        {projectName(projects, item.project_id)}
                      </td>

                      <td>
                        <span className={!item.owner ? "muted" : ""}>
                          {item.owner || "Não definido"}
                        </span>
                      </td>

                      <td>
                        <div className={`followup-due ${overdue ? "critical" : ""}`}>
                          <strong>{dateLabel(item.due_date)}</strong>
                          {days !== null && isOpen(item.status) && (
                            <small>
                              {days < 0
                                ? `${Math.abs(days)}d atrasado`
                                : days === 0
                                  ? "Hoje"
                                  : `${days}d restantes`}
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="icon-btn"
                          type="button"
                          onClick={() => openEdit(item)}
                          aria-label={`Editar ${item.title}`}
                        >
                          <CalendarClock size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && selectedItem && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <div
            className="modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span className="section-kicker">
                  {typeLabel(selectedItem.type)}
                </span>
                <h3>Atualizar follow-up</h3>
                <p>{selectedItem.title}</p>
              </div>

              <button
                className="icon-btn"
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="planned">Planejado</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="delayed">Atrasado</option>
                  <option value="completed">Concluído</option>
                  <option value="approved">Aprovado</option>
                  <option value="blocked">Bloqueado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </Field>

              <Field label="Responsável">
                <input
                  value={form.owner}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      owner: event.target.value,
                    }))
                  }
                  placeholder="Nome do responsável"
                />
              </Field>

              <Field label="Prazo">
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      due_date: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                className="primary-btn"
                type="button"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className={`module-card ${tone}`}>
      <div className="module-card-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ControlRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`control-row ${tone}`}>
      <div className="control-row-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
