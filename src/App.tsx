import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
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

const moduleInfo: Record<Module, { title: string; eyebrow: string; description: string }> = {
  portfolio: {
    title: "Visão geral",
    eyebrow: "EXECUTIVE PORTFOLIO",
    description: "Acompanhe a saúde dos projetos em um único lugar.",
  },
  schedule: {
    title: "Cronograma",
    eyebrow: "PROJECT SCHEDULE",
    description: "Controle fases, marcos, prazo planejado e realizado.",
  },
  raid: {
    title: "RAID",
    eyebrow: "GOVERNANCE CONTROL",
    description: "Monitore riscos, issues, ações e decisões críticas.",
  },
  financial: {
    title: "Financeiro",
    eyebrow: "FINANCIAL CONTROL",
    description: "Acompanhe budget, realizado, forecast e desvios.",
  },
  resources: {
    title: "Recursos",
    eyebrow: "RESOURCE MANAGEMENT",
    description: "Controle capacidade, alocação e utilização dos recursos.",
  },
};

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

  const healthy = projects.filter((p) => statusLabel(p.health_status) === "healthy").length;
  const attention = projects.filter((p) => statusLabel(p.health_status) === "attention").length;
  const critical = projects.filter((p) => statusLabel(p.health_status) === "critical").length;

  const totalRaid = useMemo(
    () =>
      projects.reduce(
        (sum, p) =>
          sum +
          Number(p.critical_risks ?? 0) +
          Number(p.open_issues ?? 0) +
          Number(p.overdue_actions ?? 0),
        0,
      ),
    [projects],
  );

  function selectModule(next: Module) {
    setModule(next);
    setMenuOpen(false);
    setSelected(null);
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
          <NavItem active={module === "portfolio"} icon={<LayoutDashboard size={18} />} onClick={() => selectModule("portfolio")}>
            Portfolio
          </NavItem>
          <NavItem active={module === "schedule"} icon={<CalendarDays size={18} />} onClick={() => selectModule("schedule")}>
            Cronograma
          </NavItem>
          <NavItem active={module === "raid"} icon={<ShieldAlert size={18} />} onClick={() => selectModule("raid")}>
            RAID
          </NavItem>
          <NavItem active={module === "financial"} icon={<CircleDollarSign size={18} />} onClick={() => selectModule("financial")}>
            Financeiro
          </NavItem>
          <NavItem active={module === "resources"} icon={<Users size={18} />} onClick={() => selectModule("resources")}>
            Recursos
          </NavItem>
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
              <div className="eyebrow">{moduleInfo[module].eyebrow}</div>
              <h1>{moduleInfo[module].title}</h1>
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

        <section className="content">
          <div className="welcome">
            <div>
              <h2>{module === "portfolio" ? "Portfolio SAP" : moduleInfo[module].title}</h2>
              <p>{moduleInfo[module].description}</p>
            </div>
            <div className="date">
              {new Date().toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {module === "portfolio" ? (
            <Portfolio
              projects={projects}
              loading={loading}
              healthy={healthy}
              attention={attention}
              critical={critical}
              onSelect={setSelected}
            />
          ) : (
            <ModuleView
              module={module}
              projects={projects}
              totalRaid={totalRaid}
              onSelect={setSelected}
            />
          )}
        </section>
      </main>

      {selected && <ProjectDetail project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function NavItem({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick} type="button">
      {icon}
      {children}
    </button>
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
    <>
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
    </>
  );
}

function ModuleView({
  module,
  projects,
  totalRaid,
  onSelect,
}: {
  module: Module;
  projects: Project[];
  totalRaid: number;
  onSelect: (project: Project) => void;
}) {
  const cards =
    module === "schedule"
      ? [
          ["Projetos monitorados", projects.length],
          ["Em andamento", projects.filter((p) => p.status === "in_progress").length],
          ["SPI médio", average(projects.map((p) => p.spi))],
          ["Go-Lives próximos", projects.filter((p) => Number(p.days_to_go_live ?? 9999) <= 90).length],
        ]
      : module === "raid"
        ? [
            ["Itens RAID", totalRaid],
            ["Riscos críticos", projects.reduce((s, p) => s + Number(p.critical_risks ?? 0), 0)],
            ["Issues abertas", projects.reduce((s, p) => s + Number(p.open_issues ?? 0), 0)],
            ["Ações atrasadas", projects.reduce((s, p) => s + Number(p.overdue_actions ?? 0), 0)],
          ]
        : module === "financial"
          ? [["Budget", "—"], ["Realizado", "—"], ["Forecast", "—"], ["Desvio", "—"]]
          : [["Capacidade", "—"], ["Alocados", "—"], ["Utilização", "—"], ["Disponíveis", "—"]];

  return (
    <>
      <div className="module-kpis">
        {cards.map(([label, value]) => (
          <div className="module-card" key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <section className="panel module-panel">
        <div className="panel-head">
          <div>
            <h3>{moduleInfo[module].title}</h3>
            <p>Estrutura preparada para receber os dados do módulo no Supabase.</p>
          </div>
          <span className="count">Módulo ativo</span>
        </div>

        {projects.length ? (
          <div className="module-project-list">
            {projects.map((project) => (
              <button className="module-project" key={project.id} onClick={() => onSelect(project)} type="button">
                <div>
                  <strong>{project.code}</strong>
                  <span>{project.name}</span>
                </div>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty">Nenhum projeto disponível.</div>
        )}
      </section>
    </>
  );
}

function average(values: (number | undefined)[]) {
  const valid = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!valid.length) return "—";
  return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2);
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

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
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
          <button className="icon-btn" onClick={onClose} type="button" aria-label="Fechar"><X /></button>
        </div>

        <section className={`executive-health ${status}`}>
          <div className="health-main">
            <div className="health-label">HEALTH SCORE</div>
            <div className="health-number">{health}</div>
            <div className="health-description">{healthDescription}</div>
          </div>
          <div className="health-status"><span className="health-status-dot" /><strong>{currentStatus}</strong></div>
        </section>

        <section className="executive-kpis">
          <ExecutiveMetric label="Progresso" value={`${Math.round(progress)}%`} highlight />
          <ExecutiveMetric label="SPI" value={project.spi == null ? "—" : Number(project.spi).toFixed(2)} />
          <ExecutiveMetric label="Go-Live" value={project.days_to_go_live == null ? "—" : `${Math.round(Number(project.days_to_go_live))}d`} />
          <ExecutiveMetric label="Fase atual" value={project.current_phase || "—"} />
        </section>

        <ExecutiveSection kicker="EXECUTIVE SUMMARY" title="Leitura executiva">
          <div className={`executive-reading ${status}`}>
            <div className="reading-icon">{status === "healthy" ? "✓" : "!"}</div>
            <div>
              <strong>{status === "critical" ? "Ação executiva requerida" : status === "attention" ? "Acompanhamento necessário" : "Projeto sob controle"}</strong>
              <p>{healthDescription}</p>
            </div>
          </div>
        </ExecutiveSection>

        <ExecutiveSection kicker="HEALTH DRIVERS" title="Por que este Health?">
          <div className="health-drivers">
            <Driver label="Riscos críticos" value={criticalRisks} tone={criticalRisks > 0 ? "critical" : "healthy"} />
            <Driver label="Issues abertas" value={openIssues} tone={openIssues > 0 ? "attention" : "healthy"} />
            <Driver label="Ações atrasadas" value={overdueActions} tone={overdueActions > 0 ? "attention" : "healthy"} />
            <Driver label="Itens RAID" value={raidTotal} tone={raidTotal > 0 ? "attention" : "healthy"} />
          </div>
        </ExecutiveSection>

        <ExecutiveSection kicker="DELIVERY" title="Progresso do projeto" value={`${Math.round(progress)}%`}>
          <div className="executive-progress">
            <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>
            <div className="progress-caption"><span>Realizado</span><span>{Math.round(progress)}%</span></div>
          </div>
        </ExecutiveSection>

        <ExecutiveSection kicker="SCHEDULE" title="Cronograma">
          <Placeholder icon={<CalendarDays size={20} />} title="Indicadores de cronograma" text="Dados detalhados serão conectados ao módulo de cronograma." />
          <div className="schedule-summary">
            <div><span>Planejado</span><strong>—</strong></div>
            <div><span>Realizado</span><strong>{Math.round(progress)}%</strong></div>
            <div><span>SPI</span><strong>{project.spi == null ? "—" : Number(project.spi).toFixed(2)}</strong></div>
          </div>
        </ExecutiveSection>

        <ExecutiveSection kicker="GOVERNANCE" title="RAID" value={`${raidTotal} itens`}>
          <div className="raid-grid">
            <RaidCard label="Riscos" value={criticalRisks} icon={<ShieldAlert size={18} />} tone="critical" />
            <RaidCard label="Issues" value={openIssues} icon={<AlertTriangle size={18} />} tone="attention" />
            <RaidCard label="Ações" value={overdueActions} icon={<Clock3 size={18} />} tone="attention" />
            <RaidCard label="Decisões" value="—" icon={<Target size={18} />} />
          </div>
        </ExecutiveSection>

        <ExecutiveSection kicker="FINANCIAL" title="Financeiro">
          <div className="financial-grid">
            <ExecutiveMetric label="Budget" value="—" />
            <ExecutiveMetric label="Realizado" value="—" />
            <ExecutiveMetric label="Forecast" value="—" />
            <ExecutiveMetric label="Desvio" value="—" />
          </div>
          <PlaceholderNote icon={<CircleDollarSign size={18} />} text="Indicadores financeiros serão conectados ao módulo Financeiro." />
        </ExecutiveSection>

        <ExecutiveSection kicker="PEOPLE" title="Recursos">
          <div className="financial-grid">
            <ExecutiveMetric label="Planejado" value="—" />
            <ExecutiveMetric label="Realizado" value="—" />
            <ExecutiveMetric label="Capacidade" value="—" />
            <ExecutiveMetric label="Utilização" value="—" />
          </div>
          <PlaceholderNote icon={<Users size={18} />} text="Dados de recursos serão conectados ao módulo de Recursos." />
        </ExecutiveSection>

        <ExecutiveSection kicker="MILESTONES" title="Próximos marcos">
          <div className="milestone-empty">
            <CalendarDays size={22} />
            <strong>Nenhum marco disponível</strong>
            <span>Os próximos marcos serão apresentados quando o módulo de cronograma estiver conectado.</span>
          </div>
        </ExecutiveSection>

        <section className="executive-section project-info">
          <div><span>Projeto</span><strong>{project.code}</strong></div>
          <div><span>Status</span><strong>{currentStatus}</strong></div>
          <div><span>Fase</span><strong>{project.current_phase || "—"}</strong></div>
          <div><span>Go-Live</span><strong>{project.days_to_go_live == null ? "—" : `${Math.round(Number(project.days_to_go_live))} dias`}</strong></div>
        </section>

        <div className="drawer-footer">
          <span><Activity size={14} /> Executive Project View</span>
          <button className="secondary-btn" type="button" onClick={onClose}>Fechar</button>
        </div>
      </aside>
    </div>
  );
}

function ExecutiveSection({
  kicker,
  title,
  value,
  children,
}: {
  kicker: string;
  title: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <section className="executive-section">
      <div className="section-title">
        <div><span className="section-kicker">{kicker}</span><h3>{title}</h3></div>
        {value && <strong className="section-value">{value}</strong>}
      </div>
      {children}
    </section>
  );
}

function Placeholder({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="placeholder-card">
      {icon}
      <div><strong>{title}</strong><span>{text}</span></div>
      <b>—</b>
    </div>
  );
}

function PlaceholderNote({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="placeholder-note">{icon}<span>{text}</span></div>;
}

function ExecutiveMetric({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return <div className={`executive-metric ${highlight ? "highlight" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Driver({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`driver ${tone}`}><div className="driver-value">{value}</div><span>{label}</span></div>;
}

function RaidCard({ label, value, icon, tone = "" }: { label: string; value: string | number; icon: ReactNode; tone?: string }) {
  return <div className={`raid-card ${tone}`}><div className="raid-card-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

export default App;
