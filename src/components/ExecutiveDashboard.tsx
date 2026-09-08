import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

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

type ExecutiveDashboardProps = {
  projects?: Project[];
  loading?: boolean;
  onProjectSelect?: (project: Project) => void;
};

type HealthStatus = "healthy" | "attention" | "critical";

function normalizeHealth(
  status?: string,
  score?: number
): HealthStatus {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("critical") ||
    value.includes("critico") ||
    value.includes("crítico") ||
    (typeof score === "number" && score < 60)
  ) {
    return "critical";
  }

  if (
    value.includes("attention") ||
    value.includes("aten") ||
    (typeof score === "number" && score < 80)
  ) {
    return "attention";
  }

  return "healthy";
}

function healthText(status: HealthStatus) {
  if (status === "critical") {
    return "Crítico";
  }

  if (status === "attention") {
    return "Atenção";
  }

  return "Saudável";
}

function healthDescription(status: HealthStatus) {
  if (status === "critical") {
    return "Necessita atuação executiva";
  }

  if (status === "attention") {
    return "Requer acompanhamento";
  }

  return "Dentro do esperado";
}

function formatNumber(value?: number, decimals = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function ExecutiveDashboard({
  projects = [],
  loading = false,
  onProjectSelect,
}: ExecutiveDashboardProps) {
  const [filter, setFilter] = useState<"all" | HealthStatus>("all");

  const metrics = useMemo(() => {
    const healthy = projects.filter(
      (project) =>
        normalizeHealth(
          project.health_status,
          project.health_score
        ) === "healthy"
    ).length;

    const attention = projects.filter(
      (project) =>
        normalizeHealth(
          project.health_status,
          project.health_score
        ) === "attention"
    ).length;

    const critical = projects.filter(
      (project) =>
        normalizeHealth(
          project.health_status,
          project.health_score
        ) === "critical"
    ).length;

    const healthValues = projects
      .map((project) => project.health_score)
      .filter(
        (value): value is number =>
          typeof value === "number" && !Number.isNaN(value)
      );

    const progressValues = projects
      .map((project) => project.progress)
      .filter(
        (value): value is number =>
          typeof value === "number" && !Number.isNaN(value)
      );

    const spiValues = projects
      .map((project) => project.spi)
      .filter(
        (value): value is number =>
          typeof value === "number" && !Number.isNaN(value)
      );

    const averageHealth =
      healthValues.length > 0
        ? healthValues.reduce((sum, value) => sum + value, 0) /
          healthValues.length
        : 0;

    const averageProgress =
      progressValues.length > 0
        ? progressValues.reduce((sum, value) => sum + value, 0) /
          progressValues.length
        : 0;

    const averageSpi =
      spiValues.length > 0
        ? spiValues.reduce((sum, value) => sum + value, 0) /
          spiValues.length
        : 0;

    const criticalRisks = projects.reduce(
      (sum, project) => sum + (project.critical_risks || 0),
      0
    );

    const openIssues = projects.reduce(
      (sum, project) => sum + (project.open_issues || 0),
      0
    );

    const overdueActions = projects.reduce(
      (sum, project) => sum + (project.overdue_actions || 0),
      0
    );

    return {
      total: projects.length,
      healthy,
      attention,
      critical,
      averageHealth,
      averageProgress,
      averageSpi,
      criticalRisks,
      openIssues,
      overdueActions,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (filter === "all") {
      return projects;
    }

    return projects.filter(
      (project) =>
        normalizeHealth(
          project.health_status,
          project.health_score
        ) === filter
    );
  }, [projects, filter]);

  const attentionProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const health = normalizeHealth(
          project.health_status,
          project.health_score
        );

        return health !== "healthy";
      })
      .sort(
        (a, b) =>
          (a.health_score || 0) - (b.health_score || 0)
      )
      .slice(0, 5);
  }, [projects]);

  const nextGoLives = useMemo(() => {
    return projects
      .filter(
        (project) =>
          typeof project.days_to_go_live === "number" &&
          project.days_to_go_live >= 0
      )
      .sort(
        (a, b) =>
          (a.days_to_go_live || 0) -
          (b.days_to_go_live || 0)
      )
      .slice(0, 5);
  }, [projects]);

  if (loading) {
    return (
      <div className="executive-dashboard">
        <div className="executive-loading">
          <Activity size={20} />
          <span>Carregando visão executiva...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="executive-dashboard">
      <div className="executive-header">
        <div>
          <div className="executive-kicker">
            EXECUTIVE PORTFOLIO
          </div>

          <h2>Controle Executivo SAP</h2>

          <p>
            Visão consolidada de saúde, entrega, riscos e próximos marcos.
          </p>
        </div>

        <div className="executive-header-status">
          <span className="status-dot" />
          {projects.length > 0
            ? "Dados atualizados"
            : "Nenhum projeto"}
        </div>
      </div>

      <div className="executive-kpi-grid">
        <button
          type="button"
          className="executive-kpi"
          onClick={() => setFilter("all")}
        >
          <div className="executive-kpi-icon">
            <Target size={19} />
          </div>

          <div className="executive-kpi-content">
            <span>Projetos no portfólio</span>
            <strong>{metrics.total}</strong>
            <small>Projetos monitorados</small>
          </div>
        </button>

        <button
          type="button"
          className="executive-kpi healthy"
          onClick={() => setFilter("healthy")}
        >
          <div className="executive-kpi-icon">
            <CheckCircle2 size={19} />
          </div>

          <div className="executive-kpi-content">
            <span>Projetos saudáveis</span>
            <strong>{metrics.healthy}</strong>
            <small>
              {metrics.total > 0
                ? `${formatNumber(
                    (metrics.healthy / metrics.total) * 100
                  )}% do portfólio`
                : "Sem dados"}
            </small>
          </div>
        </button>

        <button
          type="button"
          className="executive-kpi attention"
          onClick={() => setFilter("attention")}
        >
          <div className="executive-kpi-icon">
            <AlertTriangle size={19} />
          </div>

          <div className="executive-kpi-content">
            <span>Projetos em atenção</span>
            <strong>{metrics.attention}</strong>
            <small>Requerem acompanhamento</small>
          </div>
        </button>

        <button
          type="button"
          className="executive-kpi critical"
          onClick={() => setFilter("critical")}
        >
          <div className="executive-kpi-icon">
            <XCircle size={19} />
          </div>

          <div className="executive-kpi-content">
            <span>Projetos críticos</span>
            <strong>{metrics.critical}</strong>
            <small>Necessitam ação executiva</small>
          </div>
        </button>
      </div>

      <div className="executive-main-grid">
        <section className="executive-panel">
          <div className="executive-panel-header">
            <div>
              <div className="panel-kicker">
                PORTFOLIO HEALTH
              </div>

              <h3>Saúde do portfólio</h3>
            </div>

            <Activity size={17} />
          </div>

          <div className="health-overview">
            <div className="health-score-large">
              <strong>
                {formatNumber(metrics.averageHealth)}
              </strong>

              <span>Health Score médio</span>
            </div>

            <div className="health-distribution">
              <HealthDistribution
                label="Saudável"
                value={metrics.healthy}
                total={metrics.total}
                status="healthy"
              />

              <HealthDistribution
                label="Atenção"
                value={metrics.attention}
                total={metrics.total}
                status="attention"
              />

              <HealthDistribution
                label="Crítico"
                value={metrics.critical}
                total={metrics.total}
                status="critical"
              />
            </div>
          </div>
        </section>

        <section className="executive-panel">
          <div className="executive-panel-header">
            <div>
              <div className="panel-kicker">
                DELIVERY PERFORMANCE
              </div>

              <h3>Performance de entrega</h3>
            </div>

            <TrendingUp size={17} />
          </div>

          <div className="delivery-metrics">
            <div className="delivery-metric">
              <span>Progresso médio</span>
              <strong>
                {formatNumber(metrics.averageProgress)}%
              </strong>
            </div>

            <div className="delivery-metric">
              <span>SPI médio</span>
              <strong>
                {formatNumber(metrics.averageSpi, 2)}
              </strong>
            </div>

            <div className="delivery-metric">
              <span>Projetos</span>
              <strong>{metrics.total}</strong>
            </div>
          </div>

          <div className="delivery-progress">
            <div className="delivery-progress-head">
              <span>Execução média do portfólio</span>

              <strong>
                {formatNumber(metrics.averageProgress)}%
              </strong>
            </div>

            <div className="delivery-track">
              <div
                className="delivery-value"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, metrics.averageProgress)
                  )}%`,
                }}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="executive-panel executive-raid-panel">
        <div className="executive-panel-header">
          <div>
            <div className="panel-kicker">
              RAID EXECUTIVE
            </div>

            <h3>Principais pontos de atenção</h3>
          </div>

          <div className="raid-total">
            {metrics.criticalRisks +
              metrics.openIssues +
              metrics.overdueActions}{" "}
            itens
          </div>
        </div>

        <div className="raid-executive-grid">
          <RaidExecutiveCard
            icon={<ShieldAlert size={17} />}
            value={metrics.criticalRisks}
            label="Riscos críticos"
            description="Riscos que exigem atuação"
            status="critical"
          />

          <RaidExecutiveCard
            icon={<AlertTriangle size={17} />}
            value={metrics.openIssues}
            label="Issues abertas"
            description="Pendências em acompanhamento"
            status="attention"
          />

          <RaidExecutiveCard
            icon={<Clock3 size={17} />}
            value={metrics.overdueActions}
            label="Ações atrasadas"
            description="Ações fora do prazo"
            status="critical"
          />

          <RaidExecutiveCard
            icon={<Activity size={17} />}
            value={formatNumber(metrics.averageSpi, 2)}
            label="SPI médio"
            description="Performance do cronograma"
            status={
              metrics.averageSpi < 1
                ? "attention"
                : "healthy"
            }
          />
        </div>
      </section>

      <div className="executive-main-grid">
        <section className="executive-panel">
          <div className="executive-panel-header">
            <div>
              <div className="panel-kicker">
                EXECUTIVE ATTENTION
              </div>

              <h3>Projetos que exigem atenção</h3>
            </div>

            <AlertTriangle size={17} />
          </div>

          {attentionProjects.length === 0 ? (
            <div className="executive-empty">
              <CheckCircle2 size={22} />

              <strong>Nenhum projeto crítico</strong>

              <span>
                Todos os projetos estão dentro dos parâmetros esperados.
              </span>
            </div>
          ) : (
            <div className="attention-list">
              {attentionProjects.map((project) => {
                const health = normalizeHealth(
                  project.health_status,
                  project.health_score
                );

                return (
                  <button
                    key={project.id}
                    type="button"
                    className={`attention-project ${health}`}
                    onClick={() => onProjectSelect?.(project)}
                  >
                    <div className="attention-project-main">
                      <span className="attention-project-code">
                        {project.code}
                      </span>

                      <strong>{project.name}</strong>

                      <span>
                        {healthDescription(health)}
                      </span>
                    </div>

                    <div className="attention-project-health">
                      <strong>
                        {formatNumber(project.health_score)}
                      </strong>

                      <span>{healthText(health)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="executive-panel">
          <div className="executive-panel-header">
            <div>
              <div className="panel-kicker">
                DELIVERY MILESTONES
              </div>

              <h3>Próximos Go-Lives</h3>
            </div>

            <CalendarDays size={17} />
          </div>

          {nextGoLives.length === 0 ? (
            <div className="executive-empty">
              <CalendarDays size={22} />

              <strong>Nenhum Go-Live informado</strong>

              <span>
                Não existem datas de Go-Live disponíveis.
              </span>
            </div>
          ) : (
            <div className="golive-list">
              {nextGoLives.map((project) => {
                const days = project.days_to_go_live || 0;

                const status =
                  days <= 30
                    ? "critical"
                    : days <= 60
                      ? "attention"
                      : "healthy";

                return (
                  <button
                    key={project.id}
                    type="button"
                    className="golive-item"
                    onClick={() => onProjectSelect?.(project)}
                  >
                    <div className="golive-icon">
                      <CalendarDays size={16} />
                    </div>

                    <div className="golive-main">
                      <strong>{project.name}</strong>
                      <span>{project.code}</span>
                    </div>

                    <div className={`golive-days ${status}`}>
                      <strong>{days}</strong>
                      <span>dias</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="executive-panel">
        <div className="executive-panel-header">
          <div>
            <div className="panel-kicker">
              PROJECT PORTFOLIO
            </div>

            <h3>Projetos do portfólio</h3>
          </div>

          <div className="project-count">
            {filteredProjects.length} projetos
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="executive-empty">
            <Users size={22} />

            <strong>Nenhum projeto encontrado</strong>

            <span>
              Não existem projetos para o filtro selecionado.
            </span>
          </div>
        ) : (
          <div className="executive-project-table">
            <div className="executive-table-head">
              <span>Projeto</span>
              <span>Saúde</span>
              <span>Progresso</span>
              <span>SPI</span>
              <span>RAID</span>
              <span>Go-Live</span>
            </div>

            {filteredProjects.map((project) => {
              const health = normalizeHealth(
                project.health_status,
                project.health_score
              );

              return (
                <button
                  key={project.id}
                  type="button"
                  className="executive-table-row"
                  onClick={() => onProjectSelect?.(project)}
                >
                  <span className="project-info">
                    <strong>{project.code}</strong>
                    <span>{project.name}</span>
                  </span>

                  <span className={`project-health ${health}`}>
                    <i className="health-indicator" />

                    <strong>
                      {formatNumber(project.health_score)}
                    </strong>

                    <small>{healthText(health)}</small>
                  </span>

                  <span className="project-progress">
                    <span>
                      {formatNumber(project.progress)}%
                    </span>

                    <span className="mini-progress-track">
                      <span
                        className="mini-progress-value"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              project.progress || 0
                            )
                          )}%`,
                        }}
                      />
                    </span>
                  </span>

                  <span className="project-value">
                    {formatNumber(project.spi, 2)}
                  </span>

                  <span className="project-raid">
                    {(project.critical_risks || 0) +
                      (project.open_issues || 0) +
                      (project.overdue_actions || 0)}
                  </span>

                  <span className="project-value">
                    {typeof project.days_to_go_live ===
                    "number"
                      ? `${project.days_to_go_live}d`
                      : "-"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="executive-footer">
        <span>
          <Activity size={11} />
          SAP PMO Control Tower
        </span>

        <span>
          Indicadores consolidados do portfólio
        </span>
      </div>
    </div>
  );
}

function HealthDistribution({
  label,
  value,
  total,
  status,
}: {
  label: string;
  value: number;
  total: number;
  status: HealthStatus;
}) {
  const percentage =
    total > 0 ? (value / total) * 100 : 0;

  return (
    <div className={`health-distribution-item ${status}`}>
      <div className="health-distribution-head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="health-distribution-track">
        <div
          className="health-distribution-value"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, percentage)
            )}%`,
          }}
        />
      </div>

      <small>
        {formatNumber(percentage)}% do portfólio
      </small>
    </div>
  );
}

function RaidExecutiveCard({
  icon,
  value,
  label,
  description,
  status,
}: {
  icon: ReactNode;
  value: number | string;
  label: string;
  description: string;
  status: HealthStatus;
}) {
  return (
    <div className={`raid-executive-card ${status}`}>
      <div className="raid-executive-icon">
        {icon}
      </div>

      <div className="raid-executive-content">
        <div className="raid-executive-top">
          <strong>{value}</strong>
          <span>{label}</span>
        </div>

        <p>{description}</p>
      </div>
    </div>
  );
}
