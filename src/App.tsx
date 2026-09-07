import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldAlert,
  Users,
  X,
  Activity,
  Target,
  Clock3,
  BarChart3,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Gauge,
  UserRound,
  BriefcaseBusiness,
  Timer,
  CheckCircle2,
} from "lucide-react";

import { supabase, supabaseConfigured } from "./lib/supabase";
import Cronograma from "./Cronograma";
import RAID from "./RAID";

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

type Module = "portfolio" | "schedule" | "raid" | "financial" | "resources";

const demoProjects: Project[] = [
  {
    id: "demo-1",
    code: "DEMO-001",
    name: "Projeto SAP — conexão pendente",
    status: "in_progress",
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

function statusLabel(status?: string) {
  const value = (status || "").toLowerCase().trim();

  if (
    value.includes("critical") ||
    value.includes("red") ||
    value.includes("crítico") ||
    value.includes("critico")
  ) return "critical";

  if (
    value.includes("attention") ||
    value.includes("warning") ||
    value.includes("yellow") ||
    value.includes("atenção") ||
    value.includes("atencao")
  ) return "attention";

  return "healthy";
}

function statusText(status?: string) {
  const normalized = statusLabel(status);
  if (normalized === "critical") return "Crítico";
  if (normalized === "attention") return "Atenção";
  return "Healthy";
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [module, setModule] = useState<Module>("portfolio");

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
    (project) => statusLabel(project.health_status) === "healthy"
  ).length;

  const attention = projects.filter(
    (project) => statusLabel(project.health_status) === "attention"
  ).length;

  const critical = projects.filter(
    (project) => statusLabel(project.health_status) === "critical"
  ).length;

  const moduleTitles: Record<Module, string> = {
    portfolio: "Visão geral",
    schedule: "Cronograma",
    raid: "RAID",
    financial: "Financeiro",
    resources: "Recursos",
  };

  function navigate(next: Module) {
    setModule(next);
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
          <NavButton
            active={module === "portfolio"}
            onClick={() => navigate("portfolio")}
            icon={<LayoutDashboard size={18} />}
            label="Portfolio"
          />
          <NavButton
            active={module === "schedule"}
            onClick={() => navigate("schedule")}
            icon={<CalendarDays size={18} />}
            label="Cronograma"
          />
          <NavButton
            active={module === "raid"}
            onClick={() => navigate("raid")}
            icon={<ShieldAlert size={18} />}
            label="RAID"
          />
          <NavButton
            active={module === "financial"}
            onClick={() => navigate("financial")}
            icon={<CircleDollarSign size={18} />}
            label="Financeiro"
          />
          <NavButton
            active={module === "resources"}
            onClick={() => navigate("resources")}
            icon={<Users size={18} />}
            label="Recursos"
          />
        </nav>

        <div className="sidebar-footer">
          <div className="connection">
            <span className={connected ? "dot on" : "dot"} />
            {connected ? "Supabase conectado" : "Configure o Supabase"}
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
              <div className="eyebrow">EXECUTIVE PORTFOLIO</div>
              <h1>{moduleTitles[module]}</h1>
            </div>
          </div>

          <button className="refresh" onClick={loadProjects} type="button">
            <RefreshCw size={16} />
            Atualizar
          </button>
        </header>

        {!supabaseConfigured && (
          <div className="setup-banner">
            <AlertTriangle size={18} />
            <div>
              <strong>Conexão ainda não configurada.</strong>
              <span>Configure as variáveis do projeto Supabase na Vercel.</span>
            </div>
          </div>
        )}

        {module === "portfolio" && (
          <Portfolio
            projects={projects}
            loading={loading}
            healthy={healthy}
            attention={attention}
            critical={critical}
            onSelect={setSelected}
          />
        )}

        {module === "schedule" && (
          <Cronograma projects={projects} />
        )}

        {module === "raid" && (
          <RAID projects={projects.map((project) => ({ id: project.id, code: project.code, name: project.name }))} />
        )}

        {module === "financial" && (
          <ModulePage
            title="Financeiro"
            kicker="FINANCIAL GOVERNANCE"
            description="Budget, realizado, forecast e desvios do portfólio SAP."
            icon={<CircleDollarSign size={22} />}
            cards={[
              ["Projetos", projects.length],
              ["Budget", "—"],
              ["Forecast", "—"],
              ["Desvio", "—"],
            ]}
            note="A estrutura financeira já está criada no Supabase. Os valores passam a aparecer após o cadastro dos dados financeiros."
          />
        )}

        {module === "resources" && (
          <ResourcesPage projects={projects} />
        )}
      </main>

      {selected && (
        <ProjectDetail project={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Portfolio({
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
          <p>Acompanhe a saúde dos projetos em um único lugar.</p>
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
        <Kpi title="Projetos" value={projects.length} subtitle="No portfolio" />
        <Kpi title="Healthy" value={healthy} subtitle="Dentro do esperado" tone="healthy" />
        <Kpi title="Atenção" value={attention} subtitle="Requer acompanhamento" tone="attention" />
        <Kpi title="Crítico" value={critical} subtitle="Requer ação" tone="critical" />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Projetos</h3>
            <p>Selecione um projeto para abrir a visão executiva detalhada.</p>
          </div>
          <span className="count">{projects.length} projetos</span>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty">Carregando portfolio...</div>
          ) : projects.length === 0 ? (
            <div className="empty">Nenhum projeto encontrado no dashboard.</div>
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
                  const status = statusLabel(project.health_status);
                  const progress = Math.min(100, Math.max(0, Number(project.progress ?? 0)));
                  const raid =
                    Number(project.critical_risks ?? 0) +
                    Number(project.open_issues ?? 0) +
                    Number(project.overdue_actions ?? 0);

                  return (
                    <tr key={project.id} onClick={() => onSelect(project)}>
                      <td>
                        <div className="project">
                          <strong>{project.code}</strong>
                          <span>{project.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`health ${status}`}>
                          <i />
                          {Math.round(Number(project.health_score ?? 0))}
                        </span>
                      </td>
                      <td>
                        <div className="progress">
                          <span>{Math.round(progress)}%</span>
                          <div><b style={{ width: `${progress}%` }} /></div>
                        </div>
                      </td>
                      <td>{project.spi == null ? "—" : Number(project.spi).toFixed(2)}</td>
                      <td>{project.days_to_go_live == null ? "—" : `${Math.round(Number(project.days_to_go_live))}d`}</td>
                      <td><span className="raid">{raid}</span></td>
                      <td><ChevronRight size={18} /></td>
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


function ResourcesPage({ projects }: { projects: Project[] }) {
  const activeProjects = projects.filter((project) => {
    const status = (project.status || "").toLowerCase();
    return !status.includes("cancel") && !status.includes("closed") && !status.includes("encerr");
  });

  const progressAverage = activeProjects.length
    ? Math.round(
        activeProjects.reduce(
          (total, project) => total + Number(project.progress ?? 0),
          0
        ) / activeProjects.length
      )
    : 0;

  const projectRows = activeProjects.slice(0, 8);

  return (
    <section className="content resources-page">
      <div className="resources-breadcrumb">
        <span>Início</span>
        <ChevronRight size={13} />
        <strong>Recursos</strong>
      </div>

      <div className="resources-hero">
        <div className="resources-hero-left">
          <div className="resources-icon">
            <Users size={24} />
          </div>

          <div>
            <div className="eyebrow">CAPACITY MANAGEMENT</div>
            <h2>Recursos</h2>
            <p>Planejamento de horas, capacidade, alocação e utilização.</p>
          </div>
        </div>

        <div className="resources-actions">
          <button className="period-select" type="button">
            <CalendarDays size={16} />
            Setembro 2026
            <ChevronDown size={15} />
          </button>

          <button className="primary-btn" type="button">
            <Plus size={17} />
            Novo Recurso
          </button>
        </div>
      </div>

      <div className="resource-kpis">
        <ResourceKpi
          icon={<Users size={21} />}
          label="Total de Recursos"
          value="—"
          helper="Conecte as alocações"
          tone="blue"
        />
        <ResourceKpi
          icon={<Timer size={21} />}
          label="Horas Planejadas"
          value="—"
          helper="Aguardando apontamentos"
          tone="purple"
        />
        <ResourceKpi
          icon={<CheckCircle2 size={21} />}
          label="Horas Realizadas"
          value="—"
          helper="Aguardando apontamentos"
          tone="green"
        />
        <ResourceKpi
          icon={<Gauge size={21} />}
          label="Utilização da Capacidade"
          value="—"
          helper="Sem dados de capacidade"
          tone="orange"
        />
        <ResourceKpi
          icon={<BriefcaseBusiness size={21} />}
          label="Projetos Ativos"
          value={activeProjects.length}
          helper="No portfólio atual"
          tone="teal"
        />
      </div>

      <div className="resource-main-grid">
        <section className="resource-panel resource-chart-panel">
          <div className="resource-panel-head">
            <div>
              <span className="section-kicker">CAPACITY TREND</span>
              <h3>Horas planejadas x realizadas</h3>
            </div>

            <div className="legend">
              <span><i className="legend-dot planned" /> Planejadas</span>
              <span><i className="legend-dot actual" /> Realizadas</span>
            </div>
          </div>

          <div className="resource-chart">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div className="chart-column" key={index}>
                <div className="chart-bars">
                  <div className="bar planned" style={{ height: `${38 + index * 6}%` }} />
                  <div className="bar actual" style={{ height: `${30 + index * 5}%` }} />
                </div>
                <span>{["Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26", "Set/26"][index]}</span>
              </div>
            ))}

            <div className="chart-empty-note">
              <BarChart3 size={18} />
              <span>Valores reais aparecerão após o cadastro de horas.</span>
            </div>
          </div>
        </section>

        <section className="resource-panel allocation-panel">
          <div className="resource-panel-head">
            <div>
              <span className="section-kicker">PORTFOLIO</span>
              <h3>Alocação por projeto</h3>
            </div>
            <BriefcaseBusiness size={18} />
          </div>

          <div className="allocation-visual">
            <div className="allocation-ring">
              <div>
                <strong>{projects.length}</strong>
                <span>Projetos</span>
              </div>
            </div>

            <div className="allocation-list">
              {projectRows.slice(0, 5).map((project, index) => (
                <div className="allocation-item" key={project.id}>
                  <span className={`allocation-dot dot-${index + 1}`} />
                  <span className="allocation-name">{project.code}</span>
                  <strong>{project.progress == null ? "—" : `${Math.round(Number(project.progress))}%`}</strong>
                </div>
              ))}

              {projectRows.length === 0 && (
                <div className="resource-muted">Nenhum projeto ativo.</div>
              )}
            </div>
          </div>
        </section>

        <section className="resource-panel capacity-panel">
          <div className="resource-panel-head">
            <div>
              <span className="section-kicker">CAPACITY</span>
              <h3>Status da capacidade</h3>
            </div>
            <Gauge size={18} />
          </div>

          <div className="capacity-gauge">
            <div className="gauge-track">
              <div className="gauge-value" style={{ width: `${Math.min(progressAverage, 100)}%` }} />
            </div>
            <strong>{progressAverage}%</strong>
            <span>Referência de progresso do portfólio</span>
          </div>

          <div className="capacity-message">
            <CheckCircle2 size={17} />
            <div>
              <strong>Base pronta para capacidade</strong>
              <span>As horas e alocações serão exibidas quando os dados operacionais forem conectados.</span>
            </div>
          </div>
        </section>
      </div>

      <section className="resource-panel resource-table-panel">
        <div className="resource-table-head">
          <div>
            <span className="section-kicker">RESOURCE ALLOCATION</span>
            <h3>Alocação de recursos</h3>
            <p>Visão consolidada por projeto, recurso, função e utilização.</p>
          </div>

          <div className="resource-table-actions">
            <div className="resource-search">
              <Search size={16} />
              <input placeholder="Buscar por projeto, recurso ou função..." />
            </div>
            <button className="filter-btn" type="button">
              <Filter size={15} />
              Filtros
            </button>
          </div>
        </div>

        <div className="table-wrap resource-table-wrap">
          {projectRows.length === 0 ? (
            <div className="empty resource-empty">
              <Users size={26} />
              <strong>Nenhuma alocação encontrada</strong>
              <span>Cadastre recursos e alocações para começar a acompanhar a capacidade.</span>
            </div>
          ) : (
            <table className="resource-table">
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Recurso</th>
                  <th>Função</th>
                  <th>Horas planejadas</th>
                  <th>Horas realizadas</th>
                  <th>Capacidade</th>
                  <th>Utilização</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {projectRows.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="resource-project">
                        <span className="status-mini" />
                        <div>
                          <strong>{project.code}</strong>
                          <span>{project.name}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="resource-placeholder">A definir</span></td>
                    <td><span className="resource-placeholder">A definir</span></td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td><span className="status-pill neutral">Sem dados</span></td>
                    <td><button className="row-action" type="button" aria-label="Mais opções"><MoreHorizontal size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </section>
  );
}

function ResourceKpi({
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
    <div className="resource-kpi">
      <div className={`resource-kpi-icon ${tone}`}>{icon}</div>
      <div className="resource-kpi-body">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
      <div className={`resource-kpi-line ${tone}`} />
    </div>
  );
}

function ModulePage({
  title,
  kicker,
  description,
  icon,
  cards,
  note,
}: {
  title: string;
  kicker: string;
  description: string;
  icon: ReactNode;
  cards: [string, string | number][];
  note: string;
}) {
  return (
    <section className="content">
      <div className="module-hero">
        <div className="module-icon">{icon}</div>
        <div>
          <div className="eyebrow">{kicker}</div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="module-grid">
        {cards.map(([label, value]) => (
          <div className="module-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>{title}</h3>
            <p>Estrutura pronta para receber os dados operacionais.</p>
          </div>
          <span className="count">Módulo</span>
        </div>
        <div className="module-empty">
          <Activity size={24} />
          <strong>Base preparada</strong>
          <span>{note}</span>
        </div>
      </section>
    </section>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick} type="button">
      {icon}
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
  value: number;
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
  const health = Math.round(Number(project.health_score ?? 0));
  const progress = Math.min(100, Math.max(0, Number(project.progress ?? 0)));
  const criticalRisks = Number(project.critical_risks ?? 0);
  const openIssues = Number(project.open_issues ?? 0);
  const overdueActions = Number(project.overdue_actions ?? 0);
  const raidTotal = criticalRisks + openIssues + overdueActions;
  const currentStatus = statusText(project.health_status);

  const healthDescription =
    status === "critical"
      ? "O projeto apresenta indicadores que exigem atuação executiva."
      : status === "attention"
        ? "O projeto apresenta pontos de atenção que devem ser acompanhados."
        : "O projeto está dentro dos indicadores esperados.";

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer executive-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">EXECUTIVE PROJECT VIEW</div>
            <h2>{project.code}</h2>
            <p>{project.name}</p>
          </div>
          <button className="icon-btn" onClick={onClose} type="button" aria-label="Fechar">
            <X />
          </button>
        </div>

        <section className={`executive-health ${status}`}>
          <div className="health-main">
            <div className="health-label">HEALTH SCORE</div>
            <div className="health-number">{health}</div>
            <div className="health-description">{healthDescription}</div>
          </div>
          <div className="health-status">
            <span className="health-status-dot" />
            <strong>{currentStatus}</strong>
          </div>
        </section>

        <section className="executive-kpis">
          <ExecutiveMetric label="Progresso" value={`${Math.round(progress)}%`} highlight />
          <ExecutiveMetric label="SPI" value={project.spi == null ? "—" : Number(project.spi).toFixed(2)} />
          <ExecutiveMetric label="Go-Live" value={project.days_to_go_live == null ? "—" : `${Math.round(Number(project.days_to_go_live))}d`} />
          <ExecutiveMetric label="Fase atual" value={project.current_phase || "—"} />
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div><span className="section-kicker">EXECUTIVE SUMMARY</span><h3>Leitura executiva</h3></div>
          </div>
          <div className={`executive-reading ${status}`}>
            <div className="reading-icon">{status === "healthy" ? "✓" : "!"}</div>
            <div>
              <strong>{status === "critical" ? "Ação executiva requerida" : status === "attention" ? "Acompanhamento necessário" : "Projeto sob controle"}</strong>
              <p>{healthDescription}</p>
            </div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div><span className="section-kicker">HEALTH DRIVERS</span><h3>Por que este Health?</h3></div>
          </div>
          <div className="health-drivers">
            <Driver label="Riscos críticos" value={criticalRisks} tone={criticalRisks > 0 ? "critical" : "healthy"} />
            <Driver label="Issues abertas" value={openIssues} tone={openIssues > 0 ? "attention" : "healthy"} />
            <Driver label="Ações atrasadas" value={overdueActions} tone={overdueActions > 0 ? "attention" : "healthy"} />
            <Driver label="Itens RAID" value={raidTotal} tone={raidTotal > 0 ? "attention" : "healthy"} />
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div><span className="section-kicker">DELIVERY</span><h3>Progresso do projeto</h3></div>
            <strong className="section-value">{Math.round(progress)}%</strong>
          </div>
          <div className="executive-progress">
            <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>
            <div className="progress-caption"><span>Realizado</span><span>{Math.round(progress)}%</span></div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div><span className="section-kicker">SCHEDULE</span><h3>Cronograma</h3></div>
          </div>
          <div className="placeholder-card">
            <CalendarDays size={20} />
            <div><strong>Indicadores de cronograma</strong><span>Dados detalhados conectados ao módulo de cronograma.</span></div>
            <b>—</b>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div><span className="section-kicker">GOVERNANCE</span><h3>RAID</h3></div>
            <span className="count">{raidTotal} itens</span>
          </div>
          <div className="raid-grid">
            <RaidCard label="Riscos" value={criticalRisks} icon={<ShieldAlert size={18} />} tone="critical" />
            <RaidCard label="Issues" value={openIssues} icon={<AlertTriangle size={18} />} tone="attention" />
            <RaidCard label="Ações" value={overdueActions} icon={<Clock3 size={18} />} tone="attention" />
            <RaidCard label="Decisões" value="—" icon={<Target size={18} />} />
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title"><div><span className="section-kicker">FINANCIAL</span><h3>Financeiro</h3></div></div>
          <div className="financial-grid">
            <ExecutiveMetric label="Budget" value="—" />
            <ExecutiveMetric label="Realizado" value="—" />
            <ExecutiveMetric label="Forecast" value="—" />
            <ExecutiveMetric label="Desvio" value="—" />
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title"><div><span className="section-kicker">PEOPLE</span><h3>Recursos</h3></div></div>
          <div className="financial-grid">
            <ExecutiveMetric label="Planejado" value="—" />
            <ExecutiveMetric label="Realizado" value="—" />
            <ExecutiveMetric label="Capacidade" value="—" />
            <ExecutiveMetric label="Utilização" value="—" />
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title"><div><span className="section-kicker">MILESTONES</span><h3>Próximos marcos</h3></div></div>
          <div className="milestone-empty">
            <CalendarDays size={22} />
            <strong>Marcos disponíveis no módulo Cronograma</strong>
            <span>Cadastre os marcos para acompanhar datas planejadas e realizadas.</span>
          </div>
        </section>

        <div className="drawer-footer">
          <span><Activity size={14} /> Executive Project View</span>
          <button className="secondary-btn" type="button" onClick={onClose}>Fechar</button>
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
  return <div className={`executive-metric ${highlight ? "highlight" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Driver({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`driver ${tone}`}><div className="driver-value">{value}</div><span>{label}</span></div>;
}

function RaidCard({ label, value, icon, tone = "" }: { label: string; value: string | number; icon: ReactNode; tone?: string }) {
  return <div className={`raid-card ${tone}`}><div className="raid-card-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function sum(projects: Project[], key: keyof Project) {
  return projects.reduce((total, project) => total + Number(project[key] ?? 0), 0);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default App;
