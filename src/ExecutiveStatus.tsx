import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  History,
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
};

type StatusUpdate = {
  id: string;
  project_id: string;
  author_id?: string | null;
  reference_date?: string | null;
  overall_status?: string | null;
  progress?: number | null;
  achievements?: string | null;
  problems?: string | null;
  decisions_needed?: string | null;
  executive_comment?: string | null;
  published?: boolean | null;
  created_at?: string | null;
};

type Snapshot = {
  id: string;
  project_id: string;
  snapshot_date?: string | null;
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

type Alert = {
  id: string;
  project_id: string;
  alert_type?: string | null;
  severity?: string | null;
  title?: string | null;
  description?: string | null;
  source_table?: string | null;
  source_id?: string | null;
  acknowledged?: boolean | null;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  created_at?: string | null;
};

type ExecutiveStatusProps = {
  projects?: Project[];
};

type HealthStatus = "healthy" | "attention" | "critical";

function normalizeStatus(status?: string | null): HealthStatus {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("critical") ||
    value.includes("critico") ||
    value.includes("crítico") ||
    value.includes("red")
  ) {
    return "critical";
  }

  if (
    value.includes("attention") ||
    value.includes("warning") ||
    value.includes("aten") ||
    value.includes("yellow")
  ) {
    return "attention";
  }

  return "healthy";
}

function statusLabel(status: HealthStatus) {
  if (status === "critical") return "Crítico";
  if (status === "attention") return "Atenção";
  return "Saudável";
}

function statusIcon(status: HealthStatus) {
  if (status === "critical") return <XCircle size={17} />;
  if (status === "attention") return <AlertTriangle size={17} />;
  return <CheckCircle2 size={17} />;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatNumber(value?: number | null, decimals = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function severityLabel(value?: string | null) {
  const normalized = String(value || "").toLowerCase();

  if (
    normalized.includes("critical") ||
    normalized.includes("critico") ||
    normalized.includes("crítico")
  ) {
    return "Crítico";
  }

  if (
    normalized.includes("high") ||
    normalized.includes("alto") ||
    normalized.includes("alta")
  ) {
    return "Alto";
  }

  if (
    normalized.includes("medium") ||
    normalized.includes("moderate") ||
    normalized.includes("medio") ||
    normalized.includes("médio")
  ) {
    return "Médio";
  }

  return "Baixo";
}

export default function ExecutiveStatus({
  projects = [],
}: ExecutiveStatusProps) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedProject, setSelectedProject] = useState("all");
  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "alerts"
  >("overview");
  const [selectedUpdate, setSelectedUpdate] = useState<StatusUpdate | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    if (!supabaseConfigured) {
      setUpdates([]);
      setSnapshots([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    const [updatesResult, snapshotsResult, alertsResult] =
      await Promise.all([
        supabase
          .from("project_status_updates")
          .select("*")
          .order("reference_date", { ascending: false })
          .limit(100),

        supabase
          .from("project_snapshots")
          .select("*")
          .order("snapshot_date", { ascending: false })
          .limit(200),

        supabase
          .from("alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

    if (updatesResult.error) {
      console.error(
        "Erro ao carregar status executivos:",
        updatesResult.error
      );
    }

    if (snapshotsResult.error) {
      console.error(
        "Erro ao carregar snapshots:",
        snapshotsResult.error
      );
    }

    if (alertsResult.error) {
      console.error("Erro ao carregar alertas:", alertsResult.error);
    }

    setUpdates((updatesResult.data || []) as StatusUpdate[]);
    setSnapshots((snapshotsResult.data || []) as Snapshot[]);
    setAlerts((alertsResult.data || []) as Alert[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredUpdates = useMemo(() => {
    if (selectedProject === "all") {
      return updates;
    }

    return updates.filter(
      (update) => update.project_id === selectedProject
    );
  }, [updates, selectedProject]);

  const filteredSnapshots = useMemo(() => {
    if (selectedProject === "all") {
      return snapshots;
    }

    return snapshots.filter(
      (snapshot) => snapshot.project_id === selectedProject
    );
  }, [snapshots, selectedProject]);

  const filteredAlerts = useMemo(() => {
    if (selectedProject === "all") {
      return alerts;
    }

    return alerts.filter(
      (alert) => alert.project_id === selectedProject
    );
  }, [alerts, selectedProject]);

  const activeAlerts = filteredAlerts.filter(
    (alert) => !alert.acknowledged
  );

  const criticalAlerts = activeAlerts.filter((alert) => {
    const severity = String(alert.severity || "").toLowerCase();

    return (
      severity.includes("critical") ||
      severity.includes("critico") ||
      severity.includes("crítico")
    );
  });

  const latestSnapshot = filteredSnapshots[0];

  const latestUpdate = filteredUpdates[0];

  const healthScore =
    typeof latestSnapshot?.health_score === "number"
      ? latestSnapshot.health_score
      : null;

  const progress =
    typeof latestSnapshot?.progress === "number"
      ? latestSnapshot.progress
      : typeof latestUpdate?.progress === "number"
        ? latestUpdate.progress
        : null;

  const spi =
    typeof latestSnapshot?.spi === "number"
      ? latestSnapshot.spi
      : null;

  const healthStatus = normalizeStatus(
    latestUpdate?.overall_status ||
      (typeof healthScore === "number"
        ? healthScore < 60
          ? "critical"
          : healthScore < 80
            ? "attention"
            : "healthy"
        : "healthy")
  );

  function projectName(projectId: string) {
    return (
      projects.find((project) => project.id === projectId)?.name ||
      "Projeto não identificado"
    );
  }

  function projectCode(projectId: string) {
    return (
      projects.find((project) => project.id === projectId)?.code ||
      "—"
    );
  }

  async function acknowledgeAlert(alert: Alert) {
    if (!supabaseConfigured) {
      return;
    }

    const { error } = await supabase
      .from("alerts")
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", alert.id);

    if (error) {
      console.error("Erro ao reconhecer alerta:", error);
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

  if (loading) {
    return (
      <section className="content">
        <div className="module-empty">
          <ActivityIcon />
          <strong>Carregando status executivo...</strong>
          <span>
            Consolidando histórico, snapshots e alertas do portfólio.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="content executive-status-page">
      <div className="module-hero">
        <div className="module-icon">
          <Bell size={22} />
        </div>

        <div>
          <div className="eyebrow">EXECUTIVE CONTROL</div>
          <h2>Status Executivo</h2>
          <p>
            Acompanhamento de saúde, histórico, alertas e evolução dos
            projetos SAP.
          </p>
        </div>
      </div>

      <div className="status-toolbar">
        <div className="status-project-filter">
          <label htmlFor="status-project">Projeto</label>

          <select
            id="status-project"
            value={selectedProject}
            onChange={(event) => setSelectedProject(event.target.value)}
          >
            <option value="all">Todos os projetos</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} — {project.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="refresh"
          type="button"
          onClick={loadData}
        >
          Atualizar
        </button>
      </div>

      <div className="module-tabs">
        <button
          type="button"
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          <TrendingUp size={16} />
          Visão geral
        </button>

        <button
          type="button"
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          <History size={16} />
          Histórico
        </button>

        <button
          type="button"
          className={activeTab === "alerts" ? "active" : ""}
          onClick={() => setActiveTab("alerts")}
        >
          <Bell size={16} />
          Alertas
          {activeAlerts.length > 0 && (
            <span className="tab-badge">{activeAlerts.length}</span>
          )}
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="status-executive-grid">
            <StatusCard
              icon={statusIcon(healthStatus)}
              label="Health Score"
              value={
                healthScore === null
                  ? "—"
                  : formatNumber(Math.round(healthScore))
              }
              helper={statusLabel(healthStatus)}
              tone={healthStatus}
            />

            <StatusCard
              icon={<TrendingUp size={18} />}
              label="Progresso"
              value={
                progress === null
                  ? "—"
                  : `${formatNumber(Math.round(progress))}%`
              }
              helper="Última posição registrada"
              tone="neutral"
            />

            <StatusCard
              icon={<Clock3 size={18} />}
              label="SPI"
              value={formatNumber(spi, 2)}
              helper={
                spi !== null && spi < 1
                  ? "Abaixo do planejado"
                  : "Dentro do planejado"
              }
              tone={
                spi !== null && spi < 1 ? "attention" : "healthy"
              }
            />

            <StatusCard
              icon={<ShieldAlert size={18} />}
              label="Alertas ativos"
              value={activeAlerts.length}
              helper={`${criticalAlerts.length} críticos`}
              tone={
                criticalAlerts.length > 0
                  ? "critical"
                  : activeAlerts.length > 0
                    ? "attention"
                    : "healthy"
              }
            />
          </div>

          <div className="status-content-grid">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Última atualização executiva</h3>
                  <p>
                    Registro mais recente publicado para o portfólio
                    selecionado.
                  </p>
                </div>

                <span className="count">
                  {formatDate(latestUpdate?.reference_date)}
                </span>
              </div>

              {latestUpdate ? (
                <div className="status-update-card">
                  <div className="status-update-head">
                    <div>
                      <strong>
                        {projectCode(latestUpdate.project_id)}
                      </strong>
                      <span>
                        {projectName(latestUpdate.project_id)}
                      </span>
                    </div>

                    <StatusBadge
                      status={normalizeStatus(
                        latestUpdate.overall_status
                      )}
                    />
                  </div>

                  <div className="status-update-body">
                    <StatusField
                      label="Comentário executivo"
                      value={latestUpdate.executive_comment}
                    />

                    <StatusField
                      label="Conquistas"
                      value={latestUpdate.achievements}
                    />

                    <StatusField
                      label="Problemas"
                      value={latestUpdate.problems}
                    />

                    <StatusField
                      label="Decisões necessárias"
                      value={latestUpdate.decisions_needed}
                    />
                  </div>

                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => setSelectedUpdate(latestUpdate)}
                  >
                    Ver atualização completa
                  </button>
                </div>
              ) : (
                <EmptyState
                  icon={<History size={22} />}
                  title="Nenhuma atualização registrada"
                  description="Os status executivos aparecerão aqui após o primeiro registro."
                />
              )}
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Alertas prioritários</h3>
                  <p>
                    Pontos que exigem acompanhamento da governança.
                  </p>
                </div>

                <span className="count">
                  {activeAlerts.length}
                </span>
              </div>

              {activeAlerts.length > 0 ? (
                <div className="status-alert-list">
                  {activeAlerts.slice(0, 5).map((alert) => (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      projectCode={projectCode(alert.project_id)}
                      onAcknowledge={acknowledgeAlert}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CheckCircle2 size={22} />}
                  title="Nenhum alerta ativo"
                  description="O portfólio não possui alertas pendentes de reconhecimento."
                />
              )}
            </section>
          </div>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Projetos em acompanhamento</h3>
                <p>
                  Último status executivo conhecido por projeto.
                </p>
              </div>

              <span className="count">
                {projects.length} projetos
              </span>
            </div>

            <div className="status-project-list">
              {projects.map((project) => {
                const projectUpdate = updates.find(
                  (update) => update.project_id === project.id
                );

                const projectSnapshot = snapshots.find(
                  (snapshot) => snapshot.project_id === project.id
                );

                const score =
                  typeof projectSnapshot?.health_score === "number"
                    ? Math.round(projectSnapshot.health_score)
                    : null;

                const status = normalizeStatus(
                  projectUpdate?.overall_status ||
                    (score !== null
                      ? score < 60
                        ? "critical"
                        : score < 80
                          ? "attention"
                          : "healthy"
                      : "healthy")
                );

                return (
                  <button
                    className="status-project-card"
                    type="button"
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <div className="status-project-main">
                      <strong>{project.code}</strong>
                      <span>{project.name}</span>
                    </div>

                    <StatusBadge status={status} />

                    <div className="status-project-score">
                      <strong>
                        {score === null ? "—" : score}
                      </strong>
                      <span>Health</span>
                    </div>

                    <div className="status-project-progress">
                      <strong>
                        {typeof projectSnapshot?.progress === "number"
                          ? `${Math.round(projectSnapshot.progress)}%`
                          : "—"}
                      </strong>
                      <span>Progresso</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {activeTab === "history" && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Histórico executivo</h3>
              <p>
                Evolução dos status publicados ao longo do tempo.
              </p>
            </div>

            <span className="count">
              {filteredUpdates.length} registros
            </span>
          </div>

          {filteredUpdates.length > 0 ? (
            <div className="status-history">
              {filteredUpdates.map((update) => (
                <button
                  className="status-history-row"
                  type="button"
                  key={update.id}
                  onClick={() => setSelectedUpdate(update)}
                >
                  <div className="history-date">
                    <strong>
                      {formatDate(update.reference_date)}
                    </strong>
                    <span>
                      {formatDateTime(update.created_at)}
                    </span>
                  </div>

                  <div className="history-project">
                    <strong>
                      {projectCode(update.project_id)}
                    </strong>
                    <span>
                      {projectName(update.project_id)}
                    </span>
                  </div>

                  <StatusBadge
                    status={normalizeStatus(update.overall_status)}
                  />

                  <div className="history-progress">
                    <strong>
                      {typeof update.progress === "number"
                        ? `${Math.round(update.progress)}%`
                        : "—"}
                    </strong>
                    <span>Progresso</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<History size={22} />}
              title="Histórico vazio"
              description="Ainda não existem atualizações executivas registradas."
            />
          )}
        </section>
      )}

      {activeTab === "alerts" && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Central de alertas</h3>
              <p>
                Alertas gerados pelos controles de governança do
                portfólio.
              </p>
            </div>

            <span className="count">
              {filteredAlerts.length} alertas
            </span>
          </div>

          {filteredAlerts.length > 0 ? (
            <div className="status-alert-list">
              {filteredAlerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  projectCode={projectCode(alert.project_id)}
                  onAcknowledge={acknowledgeAlert}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 size={22} />}
              title="Nenhum alerta registrado"
              description="Os alertas de governança aparecerão nesta área."
            />
          )}
        </section>
      )}

      {selectedUpdate && (
        <div
          className="drawer-backdrop"
          onMouseDown={() => setSelectedUpdate(null)}
        >
          <aside
            className="drawer"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-head">
              <div>
                <div className="eyebrow">EXECUTIVE UPDATE</div>
                <h2>Atualização executiva</h2>
                <p>
                  {projectCode(selectedUpdate.project_id)} —{" "}
                  {projectName(selectedUpdate.project_id)}
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

            <div className="drawer-content">
              <div className="drawer-status-row">
                <StatusBadge
                  status={normalizeStatus(
                    selectedUpdate.overall_status
                  )}
                />

                <span>
                  Referência:{" "}
                  {formatDate(selectedUpdate.reference_date)}
                </span>
              </div>

              <DetailBlock
                title="Comentário executivo"
                value={selectedUpdate.executive_comment}
              />

              <DetailBlock
                title="Conquistas"
                value={selectedUpdate.achievements}
              />

              <DetailBlock
                title="Problemas"
                value={selectedUpdate.problems}
              />

              <DetailBlock
                title="Decisões necessárias"
                value={selectedUpdate.decisions_needed}
              />

              <div className="drawer-metric-grid">
                <div>
                  <span>Progresso</span>
                  <strong>
                    {typeof selectedUpdate.progress === "number"
                      ? `${Math.round(selectedUpdate.progress)}%`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Publicado</span>
                  <strong>
                    {selectedUpdate.published ? "Sim" : "Não"}
                  </strong>
                </div>

                <div>
                  <span>Criado em</span>
                  <strong>
                    {formatDateTime(selectedUpdate.created_at)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <span>
                <History size={13} />
                Histórico executivo
              </span>

              <button
                className="secondary-btn"
                type="button"
                onClick={() => setSelectedUpdate(null)}
              >
                Fechar
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function StatusCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
  tone: string;
}) {
  return (
    <div className={`status-card ${tone}`}>
      <div className="status-card-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span className={`status-badge ${status}`}>
      {statusIcon(status)}
      {statusLabel(status)}
    </span>
  );
}

function StatusField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="status-field">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function DetailBlock({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="detail-block">
      <span>{title}</span>
      <p>{value || "Não informado."}</p>
    </div>
  );
}

function AlertRow({
  alert,
  projectCode,
  onAcknowledge,
}: {
  alert: Alert;
  projectCode: string;
  onAcknowledge: (alert: Alert) => void;
}) {
  const severity = String(alert.severity || "").toLowerCase();

  const tone =
    severity.includes("critical") ||
    severity.includes("critico") ||
    severity.includes("crítico")
      ? "critical"
      : severity.includes("high") ||
          severity.includes("alto") ||
          severity.includes("alta")
        ? "attention"
        : "neutral";

  return (
    <div className={`status-alert-row ${tone}`}>
      <div className="status-alert-icon">
        {tone === "critical" ? (
          <XCircle size={18} />
        ) : tone === "attention" ? (
          <AlertTriangle size={18} />
        ) : (
          <Bell size={18} />
        )}
      </div>

      <div className="status-alert-content">
        <div className="status-alert-title">
          <strong>{alert.title || "Alerta de governança"}</strong>

          <span className={`severity ${tone}`}>
            {severityLabel(alert.severity)}
          </span>
        </div>

        <p>{alert.description || "Sem descrição."}</p>

        <div className="status-alert-meta">
          <span>{projectCode}</span>
          <span>{formatDateTime(alert.created_at)}</span>
        </div>
      </div>

      {!alert.acknowledged && (
        <button
          className="alert-acknowledge"
          type="button"
          onClick={() => onAcknowledge(alert)}
        >
          Reconhecer
        </button>
      )}

      {alert.acknowledged && (
        <span className="alert-acknowledged">
          <CheckCircle2 size={15} />
          Reconhecido
        </span>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="module-empty">
      {icon}
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function ActivityIcon() {
  return <TrendingDown size={22} />;
}
