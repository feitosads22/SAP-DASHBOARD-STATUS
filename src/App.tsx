import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldAlert,
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
  const value = (status || "").toLowerCase();

  if (
    value.includes("critical") ||
    value.includes("critical") ||
    value.includes("red")
  ) {
    return "critical";
  }

  if (
    value.includes("attention") ||
    value.includes("warning") ||
    value.includes("yellow")
  ) {
    return "attention";
  }

  return "healthy";
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connected, setConnected] = useState(false);

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
          >
            <X size={18} />
          </button>
        </div>

        <nav>
          <button className="nav-item active" type="button">
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
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="eyebrow">EXECUTIVE PORTFOLIO</div>
              <h1>Visão geral</h1>
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
              <strong>Conexão ainda não configurada.</strong>

              <span>
                Configure as variáveis do projeto Supabase na Vercel.
              </span>
            </div>
          </div>
        )}

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
                          onClick={() => setSelected(project)}
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

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
    >
      <aside
        className="drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <div className="eyebrow">PROJECT DETAIL</div>

            <h2>{project.code}</h2>

            <p>{project.name}</p>
          </div>

          <button
            className="icon-btn"
            onClick={onClose}
            type="button"
          >
            <X />
          </button>
        </div>

        <div className={`hero-status ${status}`}>
          <div>
            <span>Health Score</span>

            <strong>
              {Math.round(
                Number(project.health_score ?? 0)
              )}
            </strong>
          </div>

          <span className="pill">
            {status === "critical"
              ? "Crítico"
              : status === "attention"
              ? "Atenção"
              : "Healthy"}
          </span>
        </div>

        <div className="detail-grid">
          <Metric
            label="Progresso"
            value={`${Math.round(
              Number(project.progress ?? 0)
            )}%`}
          />

          <Metric
            label="SPI"
            value={
              project.spi == null
                ? "—"
                : Number(project.spi).toFixed(2)
            }
          />

          <Metric
            label="Go-Live"
            value={
              project.days_to_go_live == null
                ? "—"
                : `${Math.round(
                    Number(project.days_to_go_live)
                  )} dias`
            }
          />

          <Metric
            label="Riscos críticos"
            value={project.critical_risks ?? 0}
          />

          <Metric
            label="Issues abertas"
            value={project.open_issues ?? 0}
          />

          <Metric
            label="Ações atrasadas"
            value={project.overdue_actions ?? 0}
          />
        </div>

        <div className="next">
          <h3>Próxima evolução</h3>

          <p>
            Esta área será expandida com Cronograma, RAID,
            Financeiro, Recursos, Testes, Cutover e
            atualizações do gerente.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
