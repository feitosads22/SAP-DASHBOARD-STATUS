import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldAlert,
  Target,
  Users,
  X,
  Activity,
  CheckCircle2,
  AlertCircle,
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
  planned_start_date?: string;
  planned_end_date?: string;
  forecast_end_date?: string;
  actual_start_date?: string;
};

type Section =
  | "portfolio"
  | "schedule"
  | "raid"
  | "financial"
  | "resources";

const demoProjects: Project[] = [
  {
    id: "demo-1",
    code: "DEMO-001",
    name: "Projeto SAP — conexão pendente",
    status: "in_progress",
    current_phase: "Realização",
    progress: 0,
    spi: 1,
    health_score: 80,
    health_status: "healthy",
    critical_risks: 0,
    open_issues: 0,
    overdue_actions: 0,
    days_to_go_live: 120,
    planned_start_date: "2026-06-01",
    planned_end_date: "2026-12-20",
    forecast_end_date: "2026-12-20",
  },
];

function statusLabel(status?: string) {
  const value = (status || "").toLowerCase().trim();

  if (
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

function statusText(status?: string) {
  const normalized = statusLabel(status);

  if (normalized === "critical") return "Crítico";
  if (normalized === "attention") return "Atenção";

  return "Healthy";
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("pt-BR");
}

function scheduleStatus(project: Project) {
  if (
    project.forecast_end_date &&
    project.planned_end_date &&
    project.forecast_end_date > project.planned_end_date
  ) {
    return "critical";
  }

  if (Number(project.spi ?? 1) < 0.9) return "critical";
  if (Number(project.spi ?? 1) < 1) return "attention";

  return "healthy";
}

function scheduleStatusText(project: Project) {
  const status = scheduleStatus(project);

  if (status === "critical") return "Atrasado";
  if (status === "attention") return "Atenção";

  return "No prazo";
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [activeSection, setActiveSection] =
    useState<Section>("portfolio");

  async function loadProjects() {
    setLoading(true);

    if (!supabaseConfigured) {
      setConnected(false);
      setProjects(demoProjects);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("v_project_dashboard")
      .select("*")
      .order("health_score", { ascending: true });

    if (error) {
      console.error("Erro ao carregar projetos:", error);
      setConnected(false);
      setProjects([]);
    } else {
      setConnected(true);
      setProjects((data || []) as Project[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const healthy = projects.filter(
    (project) =>
      statusLabel(project.health_status) === "healthy"
  ).length;

  const attention = projects.filter(
    (project) =>
      statusLabel(project.health_status) === "attention"
  ).length;

  const critical = projects.filter(
    (project) =>
      statusLabel(project.health_status) === "critical"
  ).length;

  const scheduleHealthy = projects.filter(
    (project) => scheduleStatus(project) === "healthy"
  ).length;

  const scheduleAttention = projects.filter(
    (project) => scheduleStatus(project) === "attention"
  ).length;

  const scheduleCritical = projects.filter(
    (project) => scheduleStatus(project) === "critical"
  ).length;

  const averageSpi = useMemo(() => {
    const values = projects
      .map((project) => Number(project.spi))
      .filter((value) => Number.isFinite(value));

    if (!values.length) return 0;

    return (
      values.reduce((total, value) => total + value, 0) /
      values.length
    );
  }, [projects]);

  const nextGoLive = useMemo(() => {
    const values = projects
      .map((project) => Number(project.days_to_go_live))
      .filter((value) => Number.isFinite(value) && value >= 0);

    return values.length ? Math.min(...values) : null;
  }, [projects]);

  function navigate(section: Section) {
    setActiveSection(section);
    setMenuOpen(false);
  }

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">SAP</div>

          <div>
            <strong>PMO Control Tower</strong>
            <span>Portfolio Governance</span>
          </div>

          <button
            className="icon-btn mobile-close"
            onClick={() => setMenuOpen(false)}
            type="button"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav>
          <NavItem
            active={activeSection === "portfolio"}
            icon={<LayoutDashboard size={18} />}
            label="Portfolio"
            onClick={() => navigate("portfolio")}
          />

          <NavItem
            active={activeSection === "schedule"}
            icon={<CalendarDays size={18} />}
            label="Cronograma"
            onClick={() => navigate("schedule")}
          />

          <NavItem
            active={activeSection === "raid"}
            icon={<ShieldAlert size={18} />}
            label="RAID"
            onClick={() => navigate("raid")}
          />

          <NavItem
            active={activeSection === "financial"}
            icon={<CircleDollarSign size={18} />}
            label="Financeiro"
            onClick={() => navigate("financial")}
          />

          <NavItem
            active={activeSection === "resources"}
            icon={<Users size={18} />}
            label="Recursos"
            onClick={() => navigate("resources")}
          />
        </nav>

        <div className="sidebar-footer">
          <div className="connection">
            <span className={connected ? "dot on" : "dot"} />

            {connected
              ? "Supabase conectado"
              : "Configure o Supabase"}
          </div>

          <button className="nav-item" type="button">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn mobile-menu"
              onClick={() => setMenuOpen(true)}
              type="button"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="eyebrow">
                EXECUTIVE PORTFOLIO
              </div>

              <h1>
                {activeSection === "portfolio"
                  ? "Visão geral"
                  : activeSection === "schedule"
                    ? "Cronograma"
                    : activeSection === "raid"
                      ? "RAID"
                      : activeSection === "financial"
                        ? "Financeiro"
                        : "Recursos"}
              </h1>
            </div>
          </div>

          <button
            className="refresh"
            onClick={loadProjects}
            type="button"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </header>

        {!supabaseConfigured && (
          <div className="setup-banner">
            <AlertTriangle size={18} />

            <div>
              <strong>
                Conexão ainda não configurada.
              </strong>

              <span>
                Configure as variáveis do projeto Supabase na
                Vercel.
              </span>
            </div>
          </div>
        )}

        {activeSection === "portfolio" && (
          <PortfolioView
            projects={projects}
            loading={loading}
            healthy={healthy}
            attention={attention}
            critical={critical}
            onSelect={setSelected}
          />
        )}

        {activeSection === "schedule" && (
          <ScheduleView
            projects={projects}
            loading={loading}
            scheduleHealthy={scheduleHealthy}
            scheduleAttention={scheduleAttention}
            scheduleCritical={scheduleCritical}
            averageSpi={averageSpi}
            nextGoLive={nextGoLive}
            onSelect={setSelected}
          />
        )}

        {activeSection === "raid" && (
          <RaidView
            projects={projects}
            loading={loading}
            onSelect={setSelected}
          />
        )}

        {activeSection === "financial" && (
          <ModulePlaceholder
            icon={<CircleDollarSign size={28} />}
            eyebrow="FINANCIAL GOVERNANCE"
            title="Gestão financeira"
            description="Budget, realizado, forecast, desvios e controle financeiro dos projetos SAP."
          />
        )}

        {activeSection === "resources" && (
          <ModulePlaceholder
            icon={<Users size={28} />}
            eyebrow="RESOURCE GOVERNANCE"
            title="Gestão de recursos"
            description="Planejamento de capacidade, alocação, utilização e esforço dos recursos."
          />
        )}
      </main>

      {selected && (
        <ProjectDetail
          project={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function PortfolioView({
  projects,
  loading,
  healthy,
  attention,
  critical,
  onSelect,
}: {
  projects: Project[];
  loading: boolean;
  healthy: number;
  attention: number;
  critical: number;
  onSelect: (project: Project) => void;
}) {
  return (
    <section className="content">
      <div className="welcome">
        <div>
          <h2>Portfolio SAP</h2>

          <p>
            Acompanhe a saúde dos projetos em um único lugar.
          </p>
        </div>

        <div className="date">
          {new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="kpis">
        <Kpi
          title="Projetos"
          value={projects.length}
          subtitle="No portfolio"
        />

        <Kpi
          title="Healthy"
          value={healthy}
          subtitle="Dentro do esperado"
          tone="healthy"
        />

        <Kpi
          title="Atenção"
          value={attention}
          subtitle="Requer acompanhamento"
          tone="attention"
        />

        <Kpi
          title="Crítico"
          value={critical}
          subtitle="Requer ação"
          tone="critical"
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Projetos</h3>

            <p>
              Selecione um projeto para abrir a visão executiva
              detalhada.
            </p>
          </div>

          <span className="count">
            {projects.length} projetos
          </span>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty">
              Carregando portfolio...
            </div>
          ) : projects.length === 0 ? (
            <div className="empty">
              Nenhum projeto encontrado no dashboard.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Health</th>
                  <th>Progresso</th>
                  <th>SPI</th>
                  <th>Go-Live</th>
                  <th>RAID</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {projects.map((project) => {
                  const status = statusLabel(
                    project.health_status
                  );

                  const progress = Math.min(
                    100,
                    Math.max(
                      0,
                      Number(project.progress ?? 0)
                    )
                  );

                  const raid =
                    Number(project.critical_risks ?? 0) +
                    Number(project.open_issues ?? 0) +
                    Number(project.overdue_actions ?? 0);

                  return (
                    <tr
                      key={project.id}
                      onClick={() => onSelect(project)}
                    >
                      <td>
                        <div className="project">
                          <strong>{project.code}</strong>
                          <span>{project.name}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`health ${status}`}
                        >
                          <i />
                          {Math.round(
                            Number(
                              project.health_score ?? 0
                            )
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="progress">
                          <span>
                            {Math.round(progress)}%
                          </span>

                          <div>
                            <b
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        {project.spi == null
                          ? "—"
                          : Number(project.spi).toFixed(2)}
                      </td>

                      <td>
                        {project.days_to_go_live == null
                          ? "—"
                          : `${Math.round(
                              Number(
                                project.days_to_go_live
                              )
                            )}d`}
                      </td>

                      <td>
                        <span className="raid">
                          {raid}
                        </span>
                      </td>

                      <td>
                        <ChevronRight size={18} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </section>
  );
}

function ScheduleView({
  projects,
  loading,
  scheduleHealthy,
  scheduleAttention,
  scheduleCritical,
  averageSpi,
  nextGoLive,
  onSelect,
}: {
  projects: Project[];
  loading: boolean;
  scheduleHealthy: number;
  scheduleAttention: number;
  scheduleCritical: number;
  averageSpi: number;
  nextGoLive: number | null;
  onSelect: (project: Project) => void;
}) {
  const scheduleScore =
    projects.length === 0
      ? 0
      : Math.round(
          (scheduleHealthy / projects.length) * 100
        );

  return (
    <section className="content">
      <div className="welcome">
        <div>
          <h2>Governança de Cronograma</h2>

          <p>
            Controle de prazo, SPI, Go-Live e desvios do
            portfólio SAP.
          </p>
        </div>

        <div className="date">
          {new Date().toLocaleDateString("pt-BR")}
        </div>
      </div>

      <div className="schedule-hero">
        <div>
          <span className="section-kicker">
            SCHEDULE HEALTH
          </span>

          <strong>{scheduleScore}%</strong>

          <p>
            dos projetos estão atualmente dentro do prazo
            esperado.
          </p>
        </div>

        <div className="schedule-hero-status">
          <CalendarDays size={22} />
          <span>
            {scheduleCritical > 0
              ? "Atenção executiva necessária"
              : scheduleAttention > 0
                ? "Monitoramento necessário"
                : "Cronograma sob controle"}
          </span>
        </div>
      </div>

      <div className="kpis schedule-kpis">
        <Kpi
          title="No prazo"
          value={scheduleHealthy}
          subtitle="Projetos controlados"
          tone="healthy"
        />

        <Kpi
          title="Atenção"
          value={scheduleAttention}
          subtitle="SPI abaixo de 1.00"
          tone="attention"
        />

        <Kpi
          title="Atrasados"
          value={scheduleCritical}
          subtitle="Ação requerida"
          tone="critical"
        />

        <Kpi
          title="SPI médio"
          value={averageSpi ? averageSpi.toFixed(2) : "—"}
          subtitle="Índice de desempenho"
        />
      </div>

      <div className="schedule-summary">
        <div>
          <span>Próximo Go-Live</span>
          <strong>
            {nextGoLive == null
              ? "—"
              : `${nextGoLive} dias`}
          </strong>
        </div>

        <div>
          <span>Projetos monitorados</span>
          <strong>{projects.length}</strong>
        </div>

        <div>
          <span>Criticidade</span>
          <strong>
            {scheduleCritical > 0
              ? "Alta"
              : scheduleAttention > 0
                ? "Média"
                : "Baixa"}
          </strong>
        </div>
      </div>

      <section className="panel schedule-panel">
        <div className="panel-head">
          <div>
            <h3>Controle de cronograma</h3>

            <p>
              Visão consolidada do planejamento e previsão
              dos projetos.
            </p>
          </div>

          <span className="count">
            {projects.length} projetos
          </span>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty">
              Carregando cronograma...
            </div>
          ) : projects.length === 0 ? (
            <div className="empty">
              Nenhum projeto disponível.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Fase</th>
                  <th>Início</th>
                  <th>Fim planejado</th>
                  <th>Forecast</th>
                  <th>Progresso</th>
                  <th>SPI</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {projects.map((project) => {
                  const progress = Math.min(
                    100,
                    Math.max(
                      0,
                      Number(project.progress ?? 0)
                    )
                  );

                  const status = scheduleStatus(project);

                  return (
                    <tr
                      key={project.id}
                      onClick={() => onSelect(project)}
                    >
                      <td>
                        <div className="project">
                          <strong>{project.code}</strong>
                          <span>{project.name}</span>
                        </div>
                      </td>

                      <td>
                        {project.current_phase || "—"}
                      </td>

                      <td>
                        {formatDate(
                          project.planned_start_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          project.planned_end_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          project.forecast_end_date
                        )}
                      </td>

                      <td>
                        <div className="progress">
                          <span>
                            {Math.round(progress)}%
                          </span>

                          <div>
                            <b
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        {project.spi == null
                          ? "—"
                          : Number(project.spi).toFixed(2)}
                      </td>

                      <td>
                        <span
                          className={`health ${status}`}
                        >
                          <i />
                          {scheduleStatusText(project)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="executive-section">
        <div className="section-title">
          <div>
            <span className="section-kicker">
              SAP DELIVERY
            </span>

            <h3>Fases de implementação</h3>
          </div>
        </div>

        <div className="phase-flow">
          <Phase
            number="01"
            title="Prepare"
            description="Preparação e planejamento"
          />

          <Phase
            number="02"
            title="Explore"
            description="Fit-to-Standard"
          />

          <Phase
            number="03"
            title="Realize"
            description="Construção e testes"
          />

          <Phase
            number="04"
            title="Deploy"
            description="Cutover e Go-Live"
          />

          <Phase
            number="05"
            title="Run"
            description="Operação assistida"
          />
        </div>
      </section>
    </section>
  );
}

function RaidView({
  projects,
  loading,
  onSelect,
}: {
  projects: Project[];
  loading: boolean;
  onSelect: (project: Project) => void;
}) {
  const risks = projects.reduce(
    (sum, project) =>
      sum + Number(project.critical_risks ?? 0),
    0
  );

  const issues = projects.reduce(
    (sum, project) =>
      sum + Number(project.open_issues ?? 0),
    0
  );

  const actions = projects.reduce(
    (sum, project) =>
      sum + Number(project.overdue_actions ?? 0),
    0
  );

  const total = risks + issues + actions;

  return (
    <section className="content">
      <div className="welcome">
        <div>
          <h2>RAID Management</h2>

          <p>
            Riscos, issues e ações que exigem governança
            executiva.
          </p>
        </div>
      </div>

      <div className="raid-grid raid-grid-large">
        <RaidCard
          label="Riscos críticos"
          value={risks}
          icon={<ShieldAlert size={20} />}
          tone={risks > 0 ? "critical" : ""}
        />

        <RaidCard
          label="Issues abertas"
          value={issues}
          icon={<AlertTriangle size={20} />}
          tone={issues > 0 ? "attention" : ""}
        />

        <RaidCard
          label="Ações atrasadas"
          value={actions}
          icon={<Clock3 size={20} />}
          tone={actions > 0 ? "attention" : ""}
        />

        <RaidCard
          label="Total RAID"
          value={total}
          icon={<Target size={20} />}
          tone={total > 0 ? "attention" : ""}
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>RAID por projeto</h3>

            <p>
              Selecione um projeto para visualizar os detalhes.
            </p>
          </div>

          <span className="count">
            {total} itens
          </span>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty">
              Carregando RAID...
            </div>
          ) : projects.length === 0 ? (
            <div className="empty">
              Nenhum projeto encontrado.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Riscos</th>
                  <th>Issues</th>
                  <th>Ações atrasadas</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {projects.map((project) => {
                  const projectRisks = Number(
                    project.critical_risks ?? 0
                  );

                  const projectIssues = Number(
                    project.open_issues ?? 0
                  );

                  const projectActions = Number(
                    project.overdue_actions ?? 0
                  );

                  const projectTotal =
                    projectRisks +
                    projectIssues +
                    projectActions;

                  return (
                    <tr
                      key={project.id}
                      onClick={() => onSelect(project)}
                    >
                      <td>
                        <div className="project">
                          <strong>{project.code}</strong>
                          <span>{project.name}</span>
                        </div>
                      </td>

                      <td>
                        <span className="raid critical">
                          {projectRisks}
                        </span>
                      </td>

                      <td>
                        <span className="raid attention">
                          {projectIssues}
                        </span>
                      </td>

                      <td>
                        <span className="raid attention">
                          {projectActions}
                        </span>
                      </td>

                      <td>
                        <strong>{projectTotal}</strong>
                      </td>

                      <td>
                        <ChevronRight size={18} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </section>
  );
}

function Phase({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="phase">
      <div className="phase-number">{number}</div>

      <strong>{title}</strong>

      <span>{description}</span>
    </div>
  );
}

function ModulePlaceholder({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="content">
      <div className="module-placeholder">
        <div className="module-placeholder-icon">
          {icon}
        </div>

        <div>
          <span className="section-kicker">
            {eyebrow}
          </span>

          <h2>{title}</h2>

          <p>{description}</p>

          <div className="module-status">
            <Activity size={15} />
            Módulo preparado para integração com Supabase
          </div>
        </div>
      </div>
    </section>
  );
}

function Kpi({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  tone?: string;
}) {
  return (
    <div className="kpi">
      <span>{title}</span>

      <strong className={tone || ""}>{value}</strong>

      <small>{subtitle}</small>
    </div>
  );
}

function ProjectDetail({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const status = statusLabel(project.health_status);

  const health = Math.round(
    Number(project.health_score ?? 0)
  );

  const progress = Math.min(
    100,
    Math.max(0, Number(project.progress ?? 0))
  );

  const criticalRisks = Number(
    project.critical_risks ?? 0
  );

  const openIssues = Number(
    project.open_issues ?? 0
  );

  const overdueActions = Number(
    project.overdue_actions ?? 0
  );

  const raidTotal =
    criticalRisks +
    openIssues +
    overdueActions;

  const currentStatus = statusText(
    project.health_status
  );

  const projectScheduleStatus = scheduleStatus(project);

  const healthDescription =
    status === "critical"
      ? "O projeto apresenta indicadores que exigem atuação executiva."
      : status === "attention"
        ? "O projeto apresenta pontos de atenção que devem ser acompanhados."
        : "O projeto está dentro dos indicadores esperados.";

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
    >
      <aside
        className="drawer executive-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <div className="eyebrow">
              EXECUTIVE PROJECT VIEW
            </div>

            <h2>{project.code}</h2>

            <p>{project.name}</p>
          </div>

          <button
            className="icon-btn"
            onClick={onClose}
            type="button"
            aria-label="Fechar"
          >
            <X />
          </button>
        </div>

        <section
          className={`executive-health ${status}`}
        >
          <div className="health-main">
            <div className="health-label">
              HEALTH SCORE
            </div>

            <div className="health-number">
              {health}
            </div>

            <div className="health-description">
              {healthDescription}
            </div>
          </div>

          <div className="health-status">
            <span className="health-status-dot" />
            <strong>{currentStatus}</strong>
          </div>
        </section>

        <section className="executive-kpis">
          <ExecutiveMetric
            label="Progresso"
            value={`${Math.round(progress)}%`}
            highlight
          />

          <ExecutiveMetric
            label="SPI"
            value={
              project.spi == null
                ? "—"
                : Number(project.spi).toFixed(2)
            }
          />

          <ExecutiveMetric
            label="Go-Live"
            value={
              project.days_to_go_live == null
                ? "—"
                : `${Math.round(
                    Number(project.days_to_go_live)
                  )}d`
            }
          />

          <ExecutiveMetric
            label="Fase atual"
            value={project.current_phase || "—"}
          />
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                EXECUTIVE SUMMARY
              </span>

              <h3>Leitura executiva</h3>
            </div>
          </div>

          <div
            className={`executive-reading ${status}`}
          >
            <div className="reading-icon">
              {status === "healthy" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
            </div>

            <div>
              <strong>
                {status === "critical"
                  ? "Ação executiva requerida"
                  : status === "attention"
                    ? "Acompanhamento necessário"
                    : "Projeto sob controle"}
              </strong>

              <p>{healthDescription}</p>
            </div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                HEALTH DRIVERS
              </span>

              <h3>Por que este Health?</h3>
            </div>
          </div>

          <div className="health-drivers">
            <Driver
              label="Riscos críticos"
              value={criticalRisks}
              tone={
                criticalRisks > 0
                  ? "critical"
                  : "healthy"
              }
            />

            <Driver
              label="Issues abertas"
              value={openIssues}
              tone={
                openIssues > 0
                  ? "attention"
                  : "healthy"
              }
            />

            <Driver
              label="Ações atrasadas"
              value={overdueActions}
              tone={
                overdueActions > 0
                  ? "attention"
                  : "healthy"
              }
            />

            <Driver
              label="Itens RAID"
              value={raidTotal}
              tone={
                raidTotal > 0
                  ? "attention"
                  : "healthy"
              }
            />
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                DELIVERY
              </span>

              <h3>Progresso do projeto</h3>
            </div>

            <strong className="section-value">
              {Math.round(progress)}%
            </strong>
          </div>

          <div className="executive-progress">
            <div className="progress-track">
              <div
                className="progress-value"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="progress-caption">
              <span>Realizado</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                SCHEDULE
              </span>

              <h3>Cronograma</h3>
            </div>

            <span
              className={`schedule-badge ${projectScheduleStatus}`}
            >
              <span />
              {scheduleStatusText(project)}
            </span>
          </div>

          <div className="schedule-detail-grid">
            <ExecutiveMetric
              label="Início planejado"
              value={formatDate(
                project.planned_start_date
              )}
            />

            <ExecutiveMetric
              label="Fim planejado"
              value={formatDate(
                project.planned_end_date
              )}
            />

            <ExecutiveMetric
              label="Forecast"
              value={formatDate(
                project.forecast_end_date
              )}
            />

            <ExecutiveMetric
              label="SPI"
              value={
                project.spi == null
                  ? "—"
                  : Number(project.spi).toFixed(2)
              }
            />
          </div>

          <div className="schedule-timeline">
            <div className="timeline-line" />

            <TimelineItem
              title="Início"
              value={formatDate(
                project.planned_start_date
              )}
              completed
            />

            <TimelineItem
              title="Fase atual"
              value={project.current_phase || "—"}
              completed={progress > 0}
            />

            <TimelineItem
              title="Go-Live"
              value={
                project.days_to_go_live == null
                  ? "—"
                  : `${Math.round(
                      Number(
                        project.days_to_go_live
                      )
                    )} dias`
              }
              completed={false}
            />
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                GOVERNANCE
              </span>

              <h3>RAID</h3>
            </div>

            <span className="count">
              {raidTotal} itens
            </span>
          </div>

          <div className="raid-grid">
            <RaidCard
              label="Riscos"
              value={criticalRisks}
              icon={<ShieldAlert size={18} />}
              tone="critical"
            />

            <RaidCard
              label="Issues"
              value={openIssues}
              icon={<AlertTriangle size={18} />}
              tone="attention"
            />

            <RaidCard
              label="Ações"
              value={overdueActions}
              icon={<Clock3 size={18} />}
              tone="attention"
            />

            <RaidCard
              label="Decisões"
              value="—"
              icon={<Target size={18} />}
            />
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                FINANCIAL
              </span>

              <h3>Financeiro</h3>
            </div>
          </div>

          <div className="financial-grid">
            <ExecutiveMetric label="Budget" value="—" />
            <ExecutiveMetric
              label="Realizado"
              value="—"
            />
            <ExecutiveMetric
              label="Forecast"
              value="—"
            />
            <ExecutiveMetric label="Desvio" value="—" />
          </div>

          <div className="placeholder-note">
            <CircleDollarSign size={18} />

            <span>
              Indicadores financeiros serão conectados ao
              módulo Financeiro.
            </span>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                PEOPLE
              </span>

              <h3>Recursos</h3>
            </div>
          </div>

          <div className="financial-grid">
            <ExecutiveMetric
              label="Planejado"
              value="—"
            />

            <ExecutiveMetric
              label="Realizado"
              value="—"
            />

            <ExecutiveMetric
              label="Capacidade"
              value="—"
            />

            <ExecutiveMetric
              label="Utilização"
              value="—"
            />
          </div>

          <div className="placeholder-note">
            <Users size={18} />

            <span>
              Dados de recursos serão conectados ao módulo
              de Recursos.
            </span>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                MILESTONES
              </span>

              <h3>Próximos marcos</h3>
            </div>
          </div>

          <div className="milestone-empty">
            <CalendarDays size={22} />

            <strong>
              Nenhum marco disponível
            </strong>

            <span>
              Os próximos marcos serão apresentados quando
              o módulo de cronograma estiver conectado.
            </span>
          </div>
        </section>

        <section className="executive-section project-info">
          <div>
            <span>Projeto</span>
            <strong>{project.code}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{currentStatus}</strong>
          </div>

          <div>
            <span>Fase</span>
            <strong>
              {project.current_phase || "—"}
            </strong>
          </div>

          <div>
            <span>Go-Live</span>

            <strong>
              {project.days_to_go_live == null
                ? "—"
                : `${Math.round(
                    Number(
                      project.days_to_go_live
                    )
                  )} dias`}
            </strong>
          </div>
        </section>

        <div className="drawer-footer">
          <span>
            <Activity size={14} />
            Executive Project View
          </span>

          <button
            className="secondary-btn"
            type="button"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </aside>
    </div>
  );
}

function TimelineItem({
  title,
  value,
  completed,
}: {
  title: string;
  value: string;
  completed: boolean;
}) {
  return (
    <div className="timeline-item">
      <div
        className={`timeline-dot ${
          completed ? "completed" : ""
        }`}
      />

      <div>
        <strong>{title}</strong>
        <span>{value}</span>
      </div>
    </div>
  );
}

function ExecutiveMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`executive-metric ${
        highlight ? "highlight" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Driver({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`driver ${tone}`}>
      <div className="driver-value">{value}</div>
      <span>{label}</span>
    </div>
  );
}

function RaidCard({
  label,
  value,
  icon,
  tone = "",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <div className={`raid-card ${tone}`}>
      <div className="raid-card-icon">{icon}</div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default App;
