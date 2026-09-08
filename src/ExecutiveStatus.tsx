import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = {
  id: string;
  code: string;
  name: string;
  status?: string;
  current_phase?: string;
  progress?: number;
  spi?: number;
  health_score?: number;
  health_status?: string;
  critical_risks?: number;
  open_issues?: number;
  overdue_actions?: number;
  days_to_go_live?: number;
};

type StatusUpdate = {
  id: string;
  project_id: string;
  reference_date: string;
  overall_status?: string | null;
  progress?: number | null;
  achievements?: string | null;
  problems?: string | null;
  decisions_needed?: string | null;
  executive_comment?: string | null;
  published: boolean;
  created_at?: string;
};

type Snapshot = {
  id: string;
  project_id: string;
  snapshot_date: string;
  health_score?: number | null;
  schedule_score?: number | null;
  delivery_score?: number | null;
  raid_score?: number | null;
  finance_score?: number | null;
  scope_score?: number | null;
  resource_score?: number | null;
  progress?: number | null;
  spi?: number | null;
  budget?: number | null;
  actual?: number | null;
  forecast?: number | null;
  critical_risks?: number | null;
  open_issues?: number | null;
  overdue_actions?: number | null;
  open_crs?: number | null;
  days_to_go_live?: number | null;
};

type AlertItem = {
  id: string;
  project_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description?: string | null;
  source_table?: string | null;
  source_id?: string | null;
  acknowledged: boolean;
  acknowledged_at?: string | null;
  created_at: string;
};

function health(score?: number | null) {
  const value = Number(score || 0);

  if (value < 60) return "critical";
  if (value < 80) return "attention";
  return "healthy";
}

function healthLabel(value: string) {
  if (value === "critical") return "Crítico";
  if (value === "attention") return "Atenção";
  return "Saudável";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR");
}

function formatNumber(value?: number | null, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function money(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function severityLabel(value: string) {
  if (value === "critical") return "Crítica";
  if (value === "high") return "Alta";
  if (value === "medium") return "Média";
  return "Baixa";
}

function severityClass(value: string) {
  if (value === "critical") return "critical";
  if (value === "high") return "high";
  if (value === "medium") return "medium";
  return "low";
}

export default function ExecutiveStatus({
  projects,
}: {
  projects: Project[];
}) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [view, setView] = useState<"overview" | "history" | "alerts">("overview");
  const [selectedUpdate, setSelectedUpdate] = useState<StatusUpdate | null>(null);

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  );

  async function load() {
    setLoading(true);
    setError("");

    if (!supabaseConfigured) {
      setUpdates([]);
      setSnapshots([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    const [updatesResult, snapshotsResult, alertsResult] = await Promise.all([
      supabase
        .from("project_status_updates")
        .select("*")
        .order("reference_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("project_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("alerts")
        .select("*")
        .order("acknowledged", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

    if (updatesResult.error || snapshotsResult.error || alertsResult.error) {
      setError(
        "Não foi possível carregar todo o histórico executivo. Verifique as permissões das tabelas no Supabase."
      );
    }

    setUpdates((updatesResult.data || []) as StatusUpdate[]);
    setSnapshots((snapshotsResult.data || []) as Snapshot[]);
    setAlerts((alertsResult.data || []) as AlertItem[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredUpdates = useMemo(
    () =>
      projectFilter === "all"
        ? updates
        : updates.filter((item) => item.project_id === projectFilter),
    [updates, projectFilter]
  );

  const filteredSnapshots = useMemo(
    () =>
      projectFilter === "all"
        ? snapshots
        : snapshots.filter((item) => item.project_id === projectFilter),
    [snapshots, projectFilter]
  );

  const filteredAlerts = useMemo(
    () =>
      projectFilter === "all"
        ? alerts
        : alerts.filter((item) => item.project_id === projectFilter),
    [alerts, projectFilter]
  );

  const openAlerts = filteredAlerts.filter((alert) => !alert.acknowledged);

  const criticalAlerts = openAlerts.filter(
    (alert) => alert.severity === "critical"
  );

  const latestSnapshots = useMemo(() => {
    const map = new Map<string, Snapshot>();

    filteredSnapshots.forEach((snapshot) => {
      if (!map.has(snapshot.project_id)) {
        map.set(snapshot.project_id, snapshot);
      }
    });

    return Array.from(map.values());
  }, [filteredSnapshots]);

  async function acknowledge(alert: AlertItem) {
    if (!supabaseConfigured) return;

    const { error: requestError } = await supabase
      .from("alerts")
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", alert.id);

    if (requestError) {
      setError("Não foi possível reconhecer o alerta.");
      return;
    }

    setAlerts((current) =>
      current.map((item) =>
        item.id === alert.id
          ? {
              ...item,
              acknowledged: true,
              acknowledged_at: new Date().toISOString(),
            }
          : item
      )
    );
  }

  return (
    <section className="content">
      <div className="module-hero">
        <div className="module-icon">
          <History size={26} />
        </div>

        <div>
          <div className="eyebrow">EXECUTIVE STATUS</div>
          <h2>Status Executivo</h2>
          <p>
            Histórico de evolução, alertas e posicionamento executivo dos
            projetos SAP.
          </p>
        </div>

        <button className="primary-btn" type="button" onClick={load}>
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      <div className="kpis module-kpis">
        <Metric
          title="Atualizações"
          value={filteredUpdates.length}
          icon={<History size={18} />}
        />

        <Metric
          title="Snapshots"
          value={filteredSnapshots.length}
          icon={<CalendarDays size={18} />}
        />

        <Metric
          title="Alertas abertos"
          value={openAlerts.length}
          icon={<Bell size={18} />}
          tone={openAlerts.length ? "attention" : "healthy"}
        />

        <Metric
          title="Alertas críticos"
          value={criticalAlerts.length}
          icon={<ShieldAlert size={18} />}
          tone={criticalAlerts.length ? "critical" : "healthy"}
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Centro Executivo</h3>
            <p>
              Acompanhe a evolução dos projetos e priorize os pontos de atenção.
            </p>
          </div>

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
          >
            <option value="all">Todos os projetos</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} — {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="module-tabs">
          <button
            type="button"
            className={view === "overview" ? "active" : ""}
            onClick={() => setView("overview")}
          >
            <TrendingUp size={15} />
            Visão geral
          </button>

          <button
            type="button"
            className={view === "history" ? "active" : ""}
            onClick={() => setView("history")}
          >
            <History size={15} />
            Histórico
          </button>

          <button
            type="button"
            className={view === "alerts" ? "active" : ""}
            onClick={() => setView("alerts")}
          >
            <Bell size={15} />
            Alertas
            {openAlerts.length > 0 && <b>{openAlerts.length}</b>}
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={22} className="spin" />
            Carregando informações executivas...
          </div>
        ) : view === "overview" ? (
          <div className="status-executive-grid">
            {projects.length === 0 ? (
              <div className="empty-state">
                Nenhum projeto disponível.
              </div>
            ) : (
              projects
                .filter(
                  (project) =>
                    projectFilter === "all" || project.id === projectFilter
                )
                .map((project) => {
                  const projectSnapshot = latestSnapshots.find(
                    (snapshot) => snapshot.project_id === project.id
                  );

                  const projectAlerts = filteredAlerts.filter(
                    (alert) => alert.project_id === project.id && !alert.acknowledged
                  );

                  const score =
                    projectSnapshot?.health_score ??
                    project.health_score ??
                    0;

                  const status = health(Number(score));

                  return (
                    <article className="status-project-card" key={project.id}>
                      <div className="status-project-head">
                        <div>
                          <span className="eyebrow">
                            {project.current_phase || "PROJETO SAP"}
                          </span>

                          <h3>{project.code}</h3>
                          <p>{project.name}</p>
                        </div>

                        <span className={`health ${status}`}>
                          <i />
                          {Math.round(Number(score))}
                        </span>
                      </div>

                      <div className="status-main-score">
                        <div>
                          <span>Health Score</span>
                          <strong>{Math.round(Number(score))}</strong>
                        </div>

                        <div>
                          <span>Status</span>
                          <b>{healthLabel(status)}</b>
                        </div>
                      </div>

                      <div className="status-metrics">
                        <MetricSmall
                          label="Progresso"
                          value={`${formatNumber(
                            projectSnapshot?.progress ?? project.progress
                          )}%`}
                        />

                        <MetricSmall
                          label="SPI"
                          value={formatNumber(
                            projectSnapshot?.spi ?? project.spi,
                            2
                          )}
                        />

                        <MetricSmall
                          label="Riscos"
                          value={formatNumber(
                            projectSnapshot?.critical_risks ??
                              project.critical_risks
                          )}
                        />

                        <MetricSmall
                          label="Atrasos"
                          value={formatNumber(
                            projectSnapshot?.overdue_actions ??
                              project.overdue_actions
                          )}
                        />
                      </div>

                      <div className="status-alert-summary">
                        {projectAlerts.length > 0 ? (
                          <>
                            <AlertTriangle size={15} />
                            <span>
                              {projectAlerts.length} alerta
                              {projectAlerts.length !== 1 ? "s" : ""} aberto
                              {projectAlerts.length !== 1 ? "s" : ""}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} />
                            <span>Sem alertas pendentes</span>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })
            )}
          </div>
        ) : view === "history" ? (
          <div className="status-history">
            {filteredUpdates.length === 0 ? (
              <div className="empty-state">
                <History size={28} />
                <strong>Nenhuma atualização registrada</strong>
                <span>
                  O histórico executivo aparecerá aqui quando os status forem
                  publicados.
                </span>
              </div>
            ) : (
              filteredUpdates.map((update) => {
                const project = projectMap.get(update.project_id);

                return (
                  <button
                    className="status-history-row"
                    type="button"
                    key={update.id}
                    onClick={() => setSelectedUpdate(update)}
                  >
                    <div className="status-history-date">
                      <CalendarDays size={15} />
                      {formatDate(update.reference_date)}
                    </div>

                    <div className="status-history-project">
                      <strong>{project?.code || "Projeto"}</strong>
                      <span>{project?.name || "—"}</span>
                    </div>

                    <div className="status-history-progress">
                      <span>Progresso</span>
                      <strong>
                        {formatNumber(update.progress)}%
                      </strong>
                    </div>

                    <div
                      className={`status-history-status ${health(
                        update.progress
                      )}`}
                    >
                      {update.overall_status || "Atualização"}
                    </div>

                    <TrendingUp size={16} />
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="status-alerts">
            {filteredAlerts.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={28} />
                <strong>Nenhum alerta registrado</strong>
                <span>
                  O centro de alertas está sem ocorrências.
                </span>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const project = projectMap.get(alert.project_id);

                return (
                  <article
                    className={`status-alert ${severityClass(alert.severity)} ${
                      alert.acknowledged ? "acknowledged" : ""
                    }`}
                    key={alert.id}
                  >
                    <div className="status-alert-icon">
                      {alert.severity === "critical" ? (
                        <XCircle size={18} />
                      ) : alert.severity === "high" ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <Bell size={18} />
                      )}
                    </div>

                    <div className="status-alert-content">
                      <div className="status-alert-top">
                        <span>
                          {project?.code || "Projeto"} ·{" "}
                          {severityLabel(alert.severity)}
                        </span>

                        <small>{formatDate(alert.created_at)}</small>
                      </div>

                      <strong>{alert.title}</strong>

                      <p>{alert.description || "Sem descrição."}</p>

                      {alert.source_table && (
                        <small>Origem: {alert.source_table}</small>
                      )}
                    </div>

                    <div className="status-alert-action">
                      {alert.acknowledged ? (
                        <span className="status-pill ok">
                          Reconhecido
                        </span>
                      ) : (
                        <button
                          className="secondary-btn"
                          type="button"
                          onClick={() => acknowledge(alert)}
                        >
                          <CheckCircle2 size={14} />
                          Reconhecer
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </section>

      {selectedUpdate && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedUpdate(null)}
        >
          <div
            className="raid-modal status-update-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="schedule-modal-head">
              <div>
                <span className="section-kicker">
                  EXECUTIVE STATUS UPDATE
                </span>

                <h3>Atualização executiva</h3>

                <p>
                  {projectMap.get(selectedUpdate.project_id)?.code || "Projeto"}{" "}
                  · {formatDate(selectedUpdate.reference_date)}
                </p>
              </div>

              <button
                className="icon-btn"
                type="button"
                onClick={() => setSelectedUpdate(null)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="status-update-content">
              <div className="status-update-kpis">
                <MetricSmall
                  label="Progresso"
                  value={`${formatNumber(selectedUpdate.progress)}%`}
                />

                <MetricSmall
                  label="Status"
                  value={selectedUpdate.overall_status || "—"}
                />

                <MetricSmall
                  label="Publicado"
                  value={selectedUpdate.published ? "Sim" : "Não"}
                />
              </div>

              <StatusText
                title="Conquistas"
                icon={<CheckCircle2 size={15} />}
                value={selectedUpdate.achievements}
              />

              <StatusText
                title="Problemas"
                icon={<AlertTriangle size={15} />}
                value={selectedUpdate.problems}
              />

              <StatusText
                title="Decisões necessárias"
                icon={<Clock3 size={15} />}
                value={selectedUpdate.decisions_needed}
              />

              <StatusText
                title="Comentário executivo"
                icon={<TrendingUp size={15} />}
                value={selectedUpdate.executive_comment}
              />
            </div>

            <div className="schedule-modal-footer">
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setSelectedUpdate(null)}
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
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className={`kpi ${tone || ""}`}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function MetricSmall({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="status-metric-small">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusText({
  title,
  icon,
  value,
}: {
  title: string;
  icon: React.ReactNode;
  value?: string | null;
}) {
  return (
    <div className="status-text-block">
      <div>
        {icon}
        <strong>{title}</strong>
      </div>

      <p>{value || "Nenhuma informação registrada."}</p>
    </div>
  );
}
