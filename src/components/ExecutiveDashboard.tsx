import { useEffect, useMemo, useState } from "react";
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
import { supabase, supabaseConfigured } from "../lib/supabase";

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

type HealthStatus = "healthy" | "attention" | "critical";

function normalizeHealth(status?: string): HealthStatus {
  const value = (status || "").toLowerCase().trim();

  if (
    value.includes("critical") ||
    value.includes("critical") ||
    value.includes("red") ||
    value.includes("crítico") ||
    value.includes("critico")
  ) {
    return "critical";
  }

  if (
    value.includes("attention") ||
    value.includes("warning") ||
    value.includes("yellow") ||
    value.includes("atenção") ||
    value.includes("atencao")
  ) {
    return "attention";
  }

  return "healthy";
}

function healthText(status: HealthStatus) {
  if (status === "critical") return "Crítico";
  if (status === "attention") return "Atenção";
  return "Healthy";
}

function healthDescription(status: HealthStatus) {
  if (status === "critical") {
    return "Requer atuação executiva";
  }

  if (status === "attention") {
    return "Requer acompanhamento";
  }

  return "Dentro do esperado";
}

function formatNumber(value: unknown) {
  return Math.round(Number(value || 0));
}

function ExecutiveDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    if (!supabaseConfigured) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("v_project_dashboard")
      .select("*")
      .order("health_score", { ascending: true });

    if (queryError) {
      console.error("Erro ao carregar Executive Dashboard:", queryError);
      setError("Não foi possível carregar os dados do portfolio.");
      setProjects([]);
    } else {
      setProjects((data || []) as Project[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const healthy = projects.filter(
      (project) => normalizeHealth(project.health_status) === "healthy"
    ).length;

    const attention = projects.filter(
      (project) => normalizeHealth(project.health_status) === "attention"
    ).length;

    const critical = projects.filter(
      (project) => normalizeHealth(project.health_status) === "critical"
    ).length;

    const averageHealth = projects.length
      ? projects.reduce(
          (total, project) => total + Number(project.health_score || 0),
          0
        ) / projects.length
      : 0;

    const averageProgress = projects.length
      ? projects.reduce(
          (total, project) => total + Number(project.progress || 0),
          0
        ) / projects.length
      : 0;

    const averageSpi = projects.length
      ? projects.reduce(
          (total, project) => total + Number(project.spi || 0),
          0
        ) / projects.length
      : 0;

    const criticalRisks = projects.reduce(
      (total, project) => total + Number(project.critical_risks || 0),
      0
    );

    const openIssues = projects.reduce(
      (total, project) => total + Number(project.open_issues || 0),
      0
    );

    const overdueActions = projects.reduce(
      (total, project) => total + Number(project.overdue_actions || 0),
      0
    );

    const raidTotal =
      criticalRisks + openIssues + overdueActions;

    return {
      healthy,
      attention,
      critical,
      averageHealth,
      averageProgress,
      averageSpi,
      criticalRisks,
      openIssues,
      overdueActions,
      raidTotal,
    };
  }, [projects]);

  const attentionProjects = useMemo(() => {
    return [...projects]
      .filter(
        (project) =>
          normalizeHealth(project.health_status) !== "healthy"
      )
      .sort(
        (a, b) =>
          Number(a.health_score || 0) -
          Number(b.health_score || 0)
      )
      .slice(0, 6);
  }, [projects]);

  const nextGoLives = useMemo(() => {
    return [...projects]
      .filter((project) => project.days_to_go_live != null)
      .sort(
        (a, b) =>
          Number(a.days_to_go_live) -
          Number(b.days_to_go_live)
      )
      .slice(0, 5);
  }, [projects]);

  if (loading) {
    return (
      <section className="executive-dashboard">
        <div className="executive-loading">
          <Activity size={22} />
          <span>Carregando Executive Dashboard...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="executive-dashboard">
        <div className="executive-error">
          <AlertTriangle size={22} />
          <div>
            <strong>Erro no dashboard</strong>
            <span>{error}</span>
          </div>
          <button type="button" onClick={loadDashboard}>
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="executive-dashboard">
      <div className="executive-header">
        <div>
          <span className="executive-kicker">
            EXECUTIVE PORTFOLIO
          </span>
          <h2>Visão executiva SAP</h2>
          <p>
            Acompanhe a saúde, execução e principais pontos de
            atenção do portfolio.
          </p>
        </div>

        <div className="executive-header-status">
          <span className="status-dot" />
          <span>
            {supabaseConfigured
              ? "Dados atualizados do Supabase"
              : "Modo demonstração"}
          </span>
        </div>
      </div>

      <div className="executive-kpi-grid">
        <ExecutiveKpi
          icon={<Target size={19} />}
          label="Projetos"
          value={projects.length}
          description="No portfolio"
        />

        <ExecutiveKpi
          icon={<CheckCircle2 size={19} />}
          label="Healthy"
          value={metrics.healthy}
          description="Dentro do esperado"
          tone="healthy"
        />

        <ExecutiveKpi
          icon={<AlertTriangle size={19} />}
          label="Atenção"
          value={metrics.attention}
          description="Requer acompanhamento"
          tone="attention"
        />

        <ExecutiveKpi
          icon={<XCircle size={19} />}
          label="Crítico"
          value={metrics.critical}
          description="Requer ação executiva"
          tone="critical"
        />
      </div>

      <div className="executive-main-grid">
        <section className="executive-panel executive-health-panel">
          <div className="executive-panel-header">
            <div>
              <span className="panel-kicker">PORTFOLIO HEALTH</span>
              <h3>Saúde do portfolio</h3>
            </div>

            <Activity size={19} />
          </div>

          <div className="health-overview">
            <div className="health-score-large">
              <strong>
                {Math.round(metrics.averageHealth)}
              </strong>
              <span>Health Score médio</span>
            </div>

            <div className="health-distribution">
              <HealthDistribution
                label="Healthy"
                value={metrics.healthy}
                total={projects.length}
                tone="healthy"
              />

              <HealthDistribution
                label="Atenção"
                value={metrics.attention}
                total={projects.length}
                tone="attention"
              />

              <HealthDistribution
                label="Crítico"
                value={metrics.critical}
                total={projects.length}
                tone="critical"
              />
            </div>
          </div>
        </section>

        <section className="executive-panel">
          <div className="executive-panel-header">
            <div>
              <span className="panel-kicker">DELIVERY</span>
              <h3>Performance de entrega</h3>
            </div>

            <TrendingUp size={19} />
          </div>

          <div className="delivery-metrics">
            <MetricBlock
              label="Progresso médio"
              value={`${Math.round(metrics.averageProgress)}%`}
            />

            <MetricBlock
              label="SPI médio"
              value={
                projects.length
                  ? metrics.averageSpi.toFixed(2)
                  : "—"
              }
            />

            <MetricBlock
              label="Projetos"
              value={projects.length}
            />
          </div>

          <div className="delivery-progress">
            <div className="delivery-progress-head">
              <span>Execução média</span>
              <strong>
                {Math.round(metrics.averageProgress)}%
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
            <span className="panel-kicker">RAID</span>
            <h3>Principais pontos de atenção</h3>
          </div>

          <span className="raid-total">
            {metrics.raidTotal} itens
          </span>
        </div>

        <div className="raid-executive-grid">
          <RaidExecutiveCard
            icon={<ShieldAlert size={20} />}
            value={metrics.criticalRisks}
            label="Riscos críticos"
            description="Riscos que exigem atenção"
            tone="critical"
          />

          <RaidExecutiveCard
            icon={<AlertTriangle size={20} />}
            value={metrics.openIssues}
            label="Issues abertas"
            description="Problemas em tratamento"
            tone="attention"
          />

          <RaidExecutiveCard
            icon={<Clock3 size={20} />}
            value={metrics.overdueActions}
            label="Ações atrasadas"
            description="Ações fora do prazo"
            tone="attention"
          />

          <RaidExecutiveCard
            icon={<Target size={20} />}
            value="—"
            label="Decisões"
            description="Decisões executivas pendentes"
          />
        </div>
      </section>

      <div className="executive-main-grid">
        <section className="executive-panel">
          <div className="executive-panel-header">
            <div>
              <span className="panel-kicker">EXECUTIVE ATTENTION</span>
              <h3>Projetos que exigem atenção</h3>
            </div>

            <ShieldAlert size={19} />
          </div>

          {attentionProjects.length === 0 ? (
            <div className="executive-empty">
              <CheckCircle2 size={22} />
              <strong>Nenhum projeto crítico</strong>
              <span>
                O portfolio não possui projetos classificados
                como Atenção ou Crítico.
              </span>
            </div>
          ) : (
            <div className="attention-list">
              {attentionProjects.map((project) => {
                const status = normalizeHealth(
                  project.health_status
                );

                const health = Math.round(
                  Number(project.health_score || 0)
                );

                return (
                  <div
                    className={`attention-project ${status}`}
                    key={project.id}
                  >
                    <div className="attention-project-main">
                      <div className="attention-project-code">
                        {project.code}
                      </div>

                      <strong>{project.name}</strong>

                      <span>
                        {project.current_phase ||
                          "Fase não informada"}
                      </span>
                    </div>

                    <div className="attention-project-health">
                      <strong>{health}</strong>
                      <span>{healthText(status)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="executive-panel">
          <div className="executive-panel-header">
            <div>
              <span className="panel-kicker">MILESTONES</span>
              <h3>Próximos Go-Lives</h3>
            </div>

            <CalendarDays size={19} />
          </div>

          {nextGoLives.length === 0 ? (
            <div className="executive-empty">
              <CalendarDays size={22} />
              <strong>Sem datas disponíveis</strong>
              <span>
                Cadastre as informações de Go-Live no
                portfolio.
              </span>
            </div>
          ) : (
            <div className="golive-list">
              {nextGoLives.map((project) => {
                const days = Number(
                  project.days_to_go_live || 0
                );

                const urgency =
                  days <= 30
                    ? "critical"
                    : days <= 60
                      ? "attention"
                      : "healthy";

                return (
                  <div className="golive-item" key={project.id}>
                    <div className="golive-icon">
                      <CalendarDays size={17} />
                    </div>

                    <div className="golive-main">
                      <strong>{project.code}</strong>
                      <span>{project.name}</span>
                    </div>

                    <div className={`golive-days ${urgency}`}>
                      <strong>{days}</strong>
                      <span>dias</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="executive-panel">
        <div className="executive-panel-header">
          <div>
            <span className="panel-kicker">
              PORTFOLIO OVERVIEW
            </span>
            <h3>Projetos</h3>
          </div>

          <span className="project-count">
            {projects.length} projetos
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="executive-empty">
            <Users size={22} />
            <strong>Nenhum projeto encontrado</strong>
            <span>
              Não existem registros disponíveis em
              v_project_dashboard.
            </span>
          </div>
        ) : (
          <div className="executive-project-table">
            <div className="executive-table-head">
              <span>Projeto</span>
              <span>Health</span>
              <span>Progresso</span>
              <span>SPI</span>
              <span>Go-Live</span>
              <span>RAID</span>
            </div>

            {projects.map((project) => {
              const status = normalizeHealth(
                project.health_status
              );

              const progress = Math.min(
                100,
                Math.max(0, Number(project.progress || 0))
              );

              const raid =
                Number(project.critical_risks || 0) +
                Number(project.open_issues || 0) +
                Number(project.overdue_actions || 0);

              return (
                <div
                  className="executive-table-row"
                  key={project.id}
                >
                  <div className="project-info">
                    <strong>{project.code}</strong>
                    <span>{project.name}</span>
                  </div>

                  <div className={`project-health ${status}`}>
                    <span className="health-indicator" />
                    <strong>
                      {formatNumber(project.health_score)}
                    </strong>
                    <small>
                      {healthDescription(status)}
                    </small>
                  </div>

                  <div className="project-progress">
                    <div>
                      <span>{Math.round(progress)}%</span>
                    </div>

                    <div className="mini-progress-track">
                      <div
                        className="mini-progress-value"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="project-value">
                    {project.spi == null
                      ? "—"
                      : Number(project.spi).toFixed(2)}
                  </div>

                  <div className="project-value">
                    {project.days_to_go_live == null
                      ? "—"
                      : `${Math.round(
                          Number(project.days_to_go_live)
                        )}d`}
                  </div>

                  <div className="project-raid">
                    {raid}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="executive-footer">
        <span>
          <Activity size={14} />
          SAP PMO Control Tower
        </span>

        <span>
          Atualizado em{" "}
          {new Date().toLocaleDateString("pt-BR")}
        </span>
      </div>
    </section>
  );
}

function ExecutiveKpi({
  icon,
  label,
  value,
  description,
  tone = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  tone?: string;
}) {
  return (
    <div className={`executive-kpi ${tone}`}>
      <div className="executive-kpi-icon">{icon}</div>

      <div className="executive-kpi-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

function HealthDistribution({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const percentage = total
    ? Math.round((value / total) * 100)
    : 0;

  return (
    <div className={`health-distribution-item ${tone}`}>
      <div className="health-distribution-head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="health-distribution-track">
        <div
          className="health-distribution-value"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <small>{percentage}% do portfolio</small>
    </div>
  );
}

function MetricBlock({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="delivery-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RaidExecutiveCard({
  icon,
  value,
  label,
  description,
  tone = "",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  description: string;
  tone?: string;
}) {
  return (
    <div className={`raid-executive-card ${tone}`}>
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

export default ExecutiveDashboard;
