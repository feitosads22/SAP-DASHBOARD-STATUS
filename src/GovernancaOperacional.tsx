import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Link2,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = {
  id: string;
  code: string;
  name: string;
};

type GovernanceType = "action" | "decision" | "dependency";

type GovernanceStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "accepted"
  | "cancelled";

type GovernanceItem = {
  id: string;
  project_id: string;
  type: GovernanceType;
  title: string;
  description?: string | null;
  status: GovernanceStatus;
  priority: string;
  owner?: string | null;
  due_date?: string | null;
  action_plan?: string | null;
  decision?: string | null;
  dependency?: string | null;
  updated_at?: string | null;
};

const typeLabels: Record<GovernanceType, string> = {
  action: "Ação",
  decision: "Decisão",
  dependency: "Dependência",
};

const statusLabels: Record<GovernanceStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Concluído",
  accepted: "Aceito",
  cancelled: "Cancelado",
};

function dateText(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("pt-BR");
}

function daysToDue(value?: string | null) {
  if (!value) return null;

  const target = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  if (!Number.isFinite(target)) return null;

  return Math.round((target - today) / 86400000);
}

function isOpen(status: GovernanceStatus) {
  return !["resolved", "cancelled"].includes(status);
}

function typeIcon(type: GovernanceType) {
  if (type === "decision") return <Target size={18} />;
  if (type === "dependency") return <Link2 size={18} />;
  return <CheckCircle2 size={18} />;
}

export default function GovernancaOperacional({
  projects,
}: {
  projects: Project[];
}) {
  const [items, setItems] = useState<GovernanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | GovernanceType>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | GovernanceStatus
  >("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const [editing, setEditing] = useState<GovernanceItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

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
        "id,project_id,type,title,description,status,priority,owner,due_date,action_plan,decision,dependency,updated_at"
      )
      .in("type", ["action", "decision", "dependency"])
      .order("due_date", {
        ascending: true,
        nullsFirst: false,
      })
      .order("updated_at", {
        ascending: false,
      });

    if (requestError) {
      console.error(requestError);
      setError(
        "Não foi possível carregar a governança operacional."
      );
      setItems([]);
    } else {
      setItems((data || []) as GovernanceItem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const project = projectMap.get(item.project_id);

      const searchable = [
        item.title,
        item.description,
        item.owner,
        item.action_plan,
        item.decision,
        item.dependency,
        project?.code,
        project?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!q || searchable.includes(q)) &&
        (typeFilter === "all" || item.type === typeFilter) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (projectFilter === "all" || item.project_id === projectFilter)
      );
    });
  }, [
    items,
    projectMap,
    query,
    typeFilter,
    statusFilter,
    projectFilter,
  ]);

  const metrics = useMemo(() => {
    const open = items.filter((item) => isOpen(item.status));

    const overdue = open.filter((item) => {
      const days = daysToDue(item.due_date);
      return days !== null && days < 0;
    });

    const dueSoon = open.filter((item) => {
      const days = daysToDue(item.due_date);
      return days !== null && days >= 0 && days <= 7;
    });

    const withoutOwner = open.filter(
      (item) => !item.owner?.trim()
    );

    return {
      total: items.length,
      open: open.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      withoutOwner: withoutOwner.length,
      actions: items.filter((item) => item.type === "action").length,
      decisions: items.filter((item) => item.type === "decision").length,
      dependencies: items.filter(
        (item) => item.type === "dependency"
      ).length,
    };
  }, [items]);

  function openEdit(item: GovernanceItem) {
    setEditing(item);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  }

  async function updateItem(
    field: "status" | "owner" | "due_date",
    value: string
  ) {
    if (!editing || !supabaseConfigured) return;

    setSaving(true);
    setError("");

    const payload = {
      [field]: value || null,
    };

    const { error: updateError } = await supabase
      .from("project_raid_items")
      .update(payload)
      .eq("id", editing.id);

    if (updateError) {
      console.error(updateError);
      setError(
        updateError.message ||
          "Não foi possível atualizar o item."
      );
    } else {
      setEditing((current) =>
        current
          ? {
              ...current,
              [field]: value || null,
            }
          : current
      );

      await loadItems();
    }

    setSaving(false);
  }

  const selectedProject = editing
    ? projectMap.get(editing.project_id)
    : undefined;

  return (
    <section className="content governance-operational">
      <div className="module-hero">
        <div>
          <div className="eyebrow">OPERATIONAL GOVERNANCE</div>
          <h2>Governança Operacional</h2>
          <p>
            Acompanhe ações, decisões e dependências que exigem
            atuação da gestão dos projetos.
          </p>
        </div>

        <button
          className="refresh"
          type="button"
          onClick={loadItems}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="module-alert">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button
            className="icon-btn"
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="governance-operational-kpis">
        <Metric
          icon={<Target size={18} />}
          label="Decisões"
          value={metrics.decisions}
        />

        <Metric
          icon={<CheckCircle2 size={18} />}
          label="Ações"
          value={metrics.actions}
        />

        <Metric
          icon={<Link2 size={18} />}
          label="Dependências"
          value={metrics.dependencies}
        />

        <Metric
          icon={<Clock3 size={18} />}
          label="Em aberto"
          value={metrics.open}
          tone="attention"
        />

        <Metric
          icon={<AlertTriangle size={18} />}
          label="Atrasados"
          value={metrics.overdue}
          tone={metrics.overdue ? "critical" : "healthy"}
        />
      </div>

      <section className="panel governance-operational-panel">
        <div className="panel-head">
          <div>
            <h3>Follow-up executivo</h3>
            <p>
              Itens que precisam de decisão, cobrança ou
              desbloqueio.
            </p>
          </div>
        </div>

        <div className="governance-operational-highlights">
          <Highlight
            icon={<AlertTriangle size={18} />}
            title="Atrasados"
            value={metrics.overdue}
            description="Itens abertos com prazo vencido"
            tone={metrics.overdue ? "critical" : "healthy"}
          />

          <Highlight
            icon={<CalendarDays size={18} />}
            title="Próximos 7 dias"
            value={metrics.dueSoon}
            description="Itens com vencimento próximo"
            tone={metrics.dueSoon ? "attention" : "healthy"}
          />

          <Highlight
            icon={<UserRound size={18} />}
            title="Sem responsável"
            value={metrics.withoutOwner}
            description="Itens abertos sem owner definido"
            tone={metrics.withoutOwner ? "critical" : "healthy"}
          />
        </div>
      </section>

      <section className="panel governance-operational-panel">
        <div className="panel-head">
          <div>
            <h3>Itens de governança</h3>
            <p>
              Atualize status, responsável e prazo diretamente
              pelo acompanhamento operacional.
            </p>
          </div>
        </div>

        <div className="governance-operational-toolbar">
          <label className="search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar item, projeto ou responsável"
            />
          </label>

          <select
            className="select-control"
            value={projectFilter}
            onChange={(event) =>
              setProjectFilter(event.target.value)
            }
          >
            <option value="all">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code}
              </option>
            ))}
          </select>

          <select
            className="select-control"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as "all" | GovernanceType
              )
            }
          >
            <option value="all">Todos os tipos</option>
            <option value="action">Ações</option>
            <option value="decision">Decisões</option>
            <option value="dependency">Dependências</option>
          </select>

          <select
            className="select-control"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "all"
                  | GovernanceStatus
              )
            }
          >
            <option value="all">Todos os status</option>
            {Object.entries(statusLabels).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="governance-operational-list">
          {loading ? (
            <div className="empty-state">
              Carregando governança operacional...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              Nenhum item encontrado para os filtros selecionados.
            </div>
          ) : (
            filtered.map((item) => {
              const project = projectMap.get(item.project_id);
              const days = daysToDue(item.due_date);
              const overdue =
                days !== null &&
                days < 0 &&
                isOpen(item.status);

              return (
                <article
                  className={`governance-operational-item ${
                    overdue ? "overdue" : ""
                  }`}
                  key={item.id}
                >
                  <div className={`governance-item-icon ${item.type}`}>
                    {typeIcon(item.type)}
                  </div>

                  <div className="governance-item-main">
                    <div className="governance-item-top">
                      <div>
                        <span className="eyebrow">
                          {typeLabels[item.type]}
                        </span>
                        <h4>{item.title}</h4>
                      </div>

                      <span
                        className={`raid-status ${item.status}`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </div>

                    <p className="governance-item-description">
                      {item.description ||
                        item.action_plan ||
                        item.decision ||
                        item.dependency ||
                        "Sem descrição operacional."}
                    </p>

                    <div className="governance-item-meta">
                      <span>
                        <strong>
                          {project?.code || "—"}
                        </strong>
                        {project?.name
                          ? ` · ${project.name}`
                          : ""}
                      </span>

                      <span>
                        <UserRound size={14} />
                        {item.owner || "Sem responsável"}
                      </span>

                      <span
                        className={
                          overdue ? "governance-due overdue" : ""
                        }
                      >
                        <CalendarDays size={14} />
                        {dateText(item.due_date)}
                        {overdue ? " · atrasado" : ""}
                      </span>
                    </div>
                  </div>

                  <button
                    className="table-action"
                    type="button"
                    onClick={() => openEdit(item)}
                    title="Atualizar acompanhamento"
                  >
                    <Edit3 size={16} />
                  </button>
                </article>
              );
            })
          )}
        </div>

        <div className="raid-footnote">
          <span>
            <ShieldAlert size={14} />
            Governança operacional
          </span>

          <span>
            {filtered.length} de {items.length} itens exibidos
          </span>
        </div>
      </section>

      {modalOpen && editing && (
        <div
          className="modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="raid-modal governance-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span className="section-kicker">
                  FOLLOW-UP
                </span>

                <h2>
                  {typeLabels[editing.type]}
                </h2>

                <p>{editing.title}</p>
              </div>

              <button
                className="icon-btn"
                type="button"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            <div className="governance-edit-context">
              <div>
                <span>Projeto</span>
                <strong>
                  {selectedProject?.code || "—"}
                </strong>
              </div>

              <div>
                <span>Prioridade</span>
                <strong>{editing.priority}</strong>
              </div>

              <div>
                <span>Tipo</span>
                <strong>
                  {typeLabels[editing.type]}
                </strong>
              </div>
            </div>

            <div className="governance-edit-description">
              <span>Contexto</span>
              <p>
                {editing.description ||
                  editing.action_plan ||
                  editing.decision ||
                  editing.dependency ||
                  "Sem descrição cadastrada."}
              </p>
            </div>

            <div className="form-grid">
              <Field label="Status">
                <select
                  value={editing.status}
                  onChange={(event) =>
                    updateItem(
                      "status",
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  {Object.entries(statusLabels).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Responsável">
                <input
                  value={editing.owner || ""}
                  onChange={(event) =>
                    setEditing((current) =>
                      current
                        ? {
                            ...current,
                            owner: event.target.value,
                          }
                        : current
                    )
                  }
                  onBlur={() =>
                    updateItem(
                      "owner",
                      editing.owner || ""
                    )
                  }
                  placeholder="Nome / área"
                  disabled={saving}
                />
              </Field>

              <Field label="Prazo">
                <input
                  type="date"
                  value={
                    editing.due_date?.slice(0, 10) || ""
                  }
                  onChange={(event) =>
                    updateItem(
                      "due_date",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </Field>

              <Field label="Situação">
                <input
                  value={
                    daysToDue(editing.due_date) === null
                      ? "Sem prazo definido"
                      : daysToDue(editing.due_date)! < 0
                      ? `Atrasado há ${Math.abs(
                          daysToDue(editing.due_date)!
                        )} dias`
                      : daysToDue(editing.due_date) === 0
                      ? "Vence hoje"
                      : `Vence em ${daysToDue(
                          editing.due_date
                        )} dias`
                  }
                  readOnly
                />
              </Field>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Fechar
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
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Highlight({
  icon,
  title,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
  tone: string;
}) {
  return (
    <article className={`governance-highlight ${tone}`}>
      <div className="governance-highlight-icon">
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
