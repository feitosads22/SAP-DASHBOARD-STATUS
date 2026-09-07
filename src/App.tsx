```tsx
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
  Users,
  X,
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

type FilterStatus = "all" | "healthy" | "attention" | "critical";

const demoProjects: Project[] = [
  {
    id: "demo-1",
    code: "DEMO-001",
    name: "Projeto SAP — conexão pendente",
    status: "in_progress",
    current_phase: "Preparação",
    progress: 0,
    spi: 1,
    health_score: 80,
    health_status: "healthy",
    critical_risks: 0,
    open_issues: 0,
    overdue_actions: 0,
    days_to_go_live: 120,
  },
];

function statusLabel(status?: string): FilterStatus {
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

  if (
    value.includes("healthy") ||
    value.includes("green") ||
    value.includes("saudável") ||
    value.includes("saudavel")
  ) {
    return "healthy";
  }

  return "healthy";
}

function statusText(status?: string) {
  const normalized = statusLabel(status);

  if (normalized === "critical") return "Crítico";
  if (normalized === "attention") return "Atenção";

  return "Healthy";
}

function average(values: number[]) {
  if (!values.length) return 0;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  async function loadProjects() {
    setLoading(true);
    setErrorMessage("");

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

      setErrorMessage(
        `Não foi possível carregar o portfolio. ${error.message}`
      );
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

  const healthAverage = average(
    projects.map((project) =>
      Number(project.health_score ?? 0)
    )
  );

  const spiAverage = average(
    projects
      .filter((project) => project.spi != null)
      .map((project) => Number(project.spi))
  );

  const progressAverage = average(
    projects.map((project) =>
      Number(project.progress ?? 0)
    )
  );

  const raidTotal = projects.reduce(
    (total, project) =>
      total +
      Number(project.critical_risks ?? 0) +
      Number(project.open_issues ?? 0) +
      Number(project.overdue_actions ?? 0),
    0
  );

  const portfolioStatus: FilterStatus =
    critical > 0
      ? "critical"
      : attention > 0
        ? "attention"
        : "healthy";

  const filteredProjects = useMemo(() => {
    const term = search.toLowerCase().trim();

    return [...projects]
      .filter((project) => {
        if (filter === "all") return true;

        return (
          statusLabel(project.health_status) === filter
        );
      })
      .filter((project) => {
        if (!term) return true;

        return (
          project.code.toLowerCase().includes(term) ||
          project.name.toLowerCase().includes(term) ||
          (project.current_phase || "")
            .toLowerCase()
            .includes(term)
        );
      })
      .sort(
        (a, b) =>
          Number(a.health_score ?? 0) -
          Number(b.health_score ?? 0)
      );
  }, [projects, filter, search]);

  return (
    <div className="app">
      <aside
        className={`sidebar ${
          menuOpen ? "open" : ""
        }`}
      >
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
          <button
            className="nav-item active"
            type="button"
          >
            <LayoutDashboard size={18} />
            Portfolio
          </button>

          <button className="nav-item" type="button">
            <CalendarDays size={18} />
            Cronograma
          </button>

          <button className="nav-item" type="button">
            <ShieldAlert size={18} />
            RAID
          </button>

          <button className="nav-item" type="button">
            <CircleDollarSign size={18} />
            Financeiro
          </button>

          <button className="nav-item" type="button">
            <Users size={18} />
            Recursos
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="connection">
            <span
              className={
                connected ? "dot on" : "dot"
              }
            />

            {connected
              ? "Supabase conectado"
              : supabaseConfigured
                ? "Erro de conexão"
                : "Modo demonstração"}
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

              <h1>Visão geral</h1>
            </div>
          </div>

          <button
            className={`refresh ${
              loading ? "loading" : ""
            }`}
            onClick={loadProjects}
            disabled={loading}
            type="button"
          >
            <RefreshCw
              size={16}
              className={
                loading ? "spin" : ""
              }
            />

            {loading
              ? "Atualizando..."
              : "Atualizar"}
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
                O dashboard está usando dados de demonstração.
                Configure VITE_SUPABASE_URL e
                VITE_SUPABASE_ANON_KEY na Vercel.
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="error-banner">
            <AlertTriangle size={18} />

            <div>
              <strong>
                Falha ao carregar o portfolio
              </strong>

              <span>{errorMessage}</span>
            </div>

            <button
              type="button"
              onClick={loadProjects}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <section className="content">
          <div className="welcome">
            <div>
              <div className="eyebrow">
                SAP PROGRAM GOVERNANCE
              </div>

              <h2>Portfolio SAP</h2>

              <p>
                Acompanhe a saúde, execução e principais
                indicadores dos projetos em um único lugar.
              </p>
            </div>

            <div className="date">
              {new Date().toLocaleDateString(
                "pt-BR",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }
              )}
            </div>
          </div>

          <section
            className={`portfolio-health ${portfolioStatus}`}
          >
            <div className="portfolio-health-main">
              <div>
                <span className="portfolio-kicker">
                  PORTFOLIO HEALTH
                </span>

                <h3>
                  {portfolioStatus === "critical"
                    ? "Atenção executiva requerida"
                    : portfolioStatus === "attention"
                      ? "Portfolio requer acompanhamento"
                      : "Portfolio sob controle"}
                </h3>

                <p>
                  {projects.length} projeto
                  {projects.length === 1
                    ? ""
                    : "s"} monitorado
                  {projects.length === 1
                    ? ""
                    : "s"} no Control Tower.
                </p>
              </div>

              <div className="portfolio-health-score">
                <span>Health médio</span>

                <strong>
                  {Math.round(healthAverage)}
                </strong>
              </div>
            </div>

            <div className="portfolio-health-bar">
              <div>
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        healthAverage
                      )
                    )}%`,
                  }}
                />
              </div>

              <small>
                {healthy} Healthy · {attention} Atenção ·{" "}
                {critical} Crítico
              </small>
            </div>
          </section>

          <div className="kpis">
            <Kpi
              title="Projetos"
              value={projects.length}
              subtitle="No portfolio"
            />

            <Kpi
              title="Health médio"
              value={Math.round(
                healthAverage
              )}
              subtitle="Saúde do portfolio"
              tone={
                portfolioStatus
              }
            />

            <Kpi
              title="SPI médio"
              value={
                projects.some(
                  (project) =>
                    project.spi != null
                )
                  ? spiAverage.toFixed(2)
                  : "—"
              }
              subtitle="Performance de prazo"
              tone={
                spiAverage >= 1
                  ? "healthy"
                  : spiAverage > 0
                    ? "attention"
                    : ""
              }
            />

            <Kpi
              title="Progresso médio"
              value={`${Math.round(
                progressAverage
              )}%`}
              subtitle="Execução do portfolio"
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

            <Kpi
              title="RAID"
              value={raidTotal}
              subtitle="Itens registrados"
              tone={
                raidTotal > 0
                  ? "attention"
                  : "healthy"
              }
            />
          </div>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Projetos</h3>

                <p>
                  Selecione um projeto para abrir a visão
                  executiva detalhada.
                </p>
              </div>

              <span className="count">
                {filteredProjects.length} de{" "}
                {projects.length}
              </span>
            </div>

            <div className="project-toolbar">
              <div className="search-box">
                <Search size={16} />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Buscar projeto, código ou fase..."
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="filter-group">
                <FilterButton
                  label="Todos"
                  value="all"
                  active={filter === "all"}
                  onClick={() =>
                    setFilter("all")
                  }
                />

                <FilterButton
                  label={`Healthy ${healthy}`}
                  value="healthy"
                  active={
                    filter === "healthy"
                  }
                  onClick={() =>
                    setFilter("healthy")
                  }
                />

                <FilterButton
                  label={`Atenção ${attention}`}
                  value="attention"
                  active={
                    filter === "attention"
                  }
                  onClick={() =>
                    setFilter("attention")
                  }
                />

                <FilterButton
                  label={`Crítico ${critical}`}
                  value="critical"
                  active={
                    filter === "critical"
                  }
                  onClick={() =>
                    setFilter("critical")
                  }
                />
              </div>
            </div>

            <div className="table-wrap">
              {loading ? (
                <div className="empty">
                  <RefreshCw
                    size={20}
                    className="spin"
                  />

                  <span>
                    Carregando portfolio...
                  </span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="empty">
                  <Search size={22} />

                  <strong>
                    Nenhum projeto encontrado
                  </strong>

                  <span>
                    Ajuste os filtros ou o termo da
                    pesquisa.
                  </span>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Projeto</th>
                      <th>Health</th>
                      <th>Fase</th>
                      <th>Progresso</th>
                      <th>SPI</th>
                      <th>Go-Live</th>
                      <th>RAID</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProjects.map(
                      (project) => {
                        const status =
                          statusLabel(
                            project.health_status
                          );

                        const progress =
                          Math.min(
                            100,
                            Math.max(
                              0,
                              Number(
                                project.progress ??
                                  0
                              )
                            )
                          );

                        const health =
                          Math.round(
                            Number(
                              project.health_score ??
                                0
                            )
                          );

                        const raid =
                          Number(
                            project.critical_risks ??
                              0
                          ) +
                          Number(
                            project.open_issues ??
                              0
                          ) +
                          Number(
                            project.overdue_actions ??
                              0
                          );

                        return (
                          <tr
                            key={project.id}
                            onClick={() =>
                              setSelected(
                                project
                              )
                            }
                          >
                            <td>
                              <div className="project">
                                <strong>
                                  {project.code}
                                </strong>

                                <span>
                                  {project.name}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`health ${status}`}
                              >
                                <i />

                                <strong>
                                  {health}
                                </strong>

                                <small>
                                  {statusText(
                                    project.health_status
                                  )}
                                </small>
                              </span>
                            </td>

                            <td>
                              <span className="phase">
                                {project.current_phase ||
                                  "—"}
                              </span>
                            </td>

                            <td>
                              <div className="progress">
                                <span>
                                  {Math.round(
                                    progress
                                  )}
                                  %
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
                              <span
                                className={`spi ${
                                  project.spi != null &&
                                  Number(
                                    project.spi
                                  ) < 1
                                    ? "below"
                                    : ""
                                }`}
                              >
                                {project.spi ==
                                null
                                  ? "—"
                                  : Number(
                                      project.spi
                                    ).toFixed(
                                      2
                                    )}
                              </span>
                            </td>

                            <td>
                              <span className="golive">
                                {project.days_to_go_live ==
                                null
                                  ? "—"
                                  : `${Math.round(
                                      Number(
                                        project.days_to_go_live
                                      )
                                    )}d`}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`raid ${
                                  raid === 0
                                    ? "empty-raid"
                                    : ""
                                }`}
                              >
                                {raid}
                              </span>
                            </td>

                            <td>
                              <ChevronRight
                                size={18}
                              />
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </section>
      </main>

      {selected && (
        <ProjectDetail
          project={selected}
          onClose={() =>
            setSelected(null)
          }
        />
      )}
    </div>
  );
}

function FilterButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`filter-btn ${
        active ? "active" : ""
      } ${value}`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Kpi({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  tone?: string;
}) {
  return (
    <div className="kpi">
      <span>{title}</span>

      <strong className={tone || ""}>
        {value}
      </strong>

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
  const status = statusLabel(
    project.health_status
  );

  const health = Math.round(
    Number(project.health_score ?? 0)
  );

  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(project.progress ?? 0)
    )
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
        onClick={(event) =>
          event.stopPropagation()
        }
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
            value={`${Math.round(
              progress
            )}%`}
            highlight
          />

          <ExecutiveMetric
            label="SPI"
            value={
              project.spi == null
                ? "—"
                : Number(
                    project.spi
                  ).toFixed(2)
            }
          />

          <ExecutiveMetric
            label="Go-Live"
            value={
              project.days_to_go_live ==
              null
                ? "—"
                : `${Math.round(
                    Number(
                      project.days_to_go_live
                    )
                  )}d`
            }
          />

          <ExecutiveMetric
            label="Fase atual"
            value={
              project.current_phase ||
              "—"
            }
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
                <CheckCircle2
                  size={16}
                />
              ) : (
                "!"
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

              <p>
                {healthDescription}
              </p>
            </div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <span className="section-kicker">
                HEALTH DRIVERS
              </span>

              <h3>
                Por que este Health?
              </h3>
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
              value={
                overdueActions
              }
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

              <h3>
                Progresso do projeto
              </h3>
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

              <span>
                {Math.round(progress)}%
              </span>
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
          </div>

          <div className="placeholder-card">
            <CalendarDays size={20} />

            <div>
              <strong>
                Indicadores de cronograma
              </strong>

              <span>
                Dados detalhados serão
                conectados ao módulo de
                cronograma.
              </span>
            </div>

            <b>—</b>
          </div>

          <div className="schedule-summary">
            <div>
              <span>Planejado</span>
              <strong>—</strong>
            </div>

            <div>
              <span>Realizado</span>

              <strong>
                {Math.round(
                  progress
                )}
                %
              </strong>
            </div>

            <div>
              <span>SPI</span>

              <strong>
                {project.spi == null
                  ? "—"
                  : Number(
                      project.spi
                    ).toFixed(2)}
              </strong>
            </div>
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
              icon={
                <ShieldAlert size={18} />
              }
              tone="critical"
            />

            <RaidCard
              label="Issues"
              value={openIssues}
              icon={
                <AlertTriangle size={18} />
              }
              tone="attention"
            />

            <RaidCard
              label="Ações"
              value={
                overdueActions
              }
              icon={
                <Clock3 size={18} />
              }
              tone="attention"
            />

            <RaidCard
              label="Decisões"
              value="—"
              icon={
                <Target size={18} />
              }
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
            <ExecutiveMetric
              label="Budget"
              value="—"
            />

            <ExecutiveMetric
              label="Realizado"
              value="—"
            />

            <ExecutiveMetric
              label="Forecast"
              value="—"
            />

            <ExecutiveMetric
              label="Desvio"
              value="—"
            />
          </div>

          <div className="placeholder-note">
            <CircleDollarSign
              size={18}
            />

            <span>
              Indicadores financeiros serão
              conectados ao módulo Financeiro.
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
              Dados de recursos serão conectados
              ao módulo de Recursos.
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
              Os próximos marcos serão apresentados
              quando o módulo de cronograma estiver
              conectado.
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
              {project.current_phase ||
                "—"}
            </strong>
          </div>

          <div>
            <span>Go-Live</span>

            <strong>
              {project.days_to_go_live ==
              null
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
      <div className="driver-value">
        {value}
      </div>

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
      <div className="raid-card-icon">
        {icon}
      </div>

      <div>
        <strong>{value}</strong>

        <span>{label}</span>
      </div>
    </div>
  );
}

export default App;
```
