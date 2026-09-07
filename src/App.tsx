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
  LockKeyhole,
  UserCircle,
} from "lucide-react";

import {
  supabase,
  supabaseConfigured,
} from "./lib/supabase";

import type { Session } from "@supabase/supabase-js";

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

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  organization_id: string | null;
  active: boolean;
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
  const s = (status || "").toLowerCase();

  if (
    s.includes("critical") ||
    s.includes("red") ||
    s.includes("critical")
  ) {
    return "critical";
  }

  if (
    s.includes("attention") ||
    s.includes("warning") ||
    s.includes("yellow")
  ) {
    return "attention";
  }

  return "healthy";
}

function roleLabel(role?: string) {
  switch ((role || "").toLowerCase()) {
    case "head":
      return "HEAD";

    case "project_manager":
      return "PROJECT MANAGER";

    case "pmo_admin":
      return "PMO ADMIN";

    default:
      return role || "USUÁRIO";
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [connected, setConnected] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  /*
   * ---------------------------------------------------------
   * AUTH
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    async function initializeAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setAuthLoading(false);

      if (session?.user) {
        await loadProfile(session.user.id);
      }
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setProjects([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * PROFILE
   * ---------------------------------------------------------
   */

  async function loadProfile(userId: string) {
    setProfileLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, organization_id, active"
      )
      .eq("id", userId)
      .single();

  if (error) {
  console.error("Erro ao carregar profile:", error);

  setProfile(null);
  setProfileError(
    error.message || "Não foi possível carregar seu perfil."
  );

  setProfileLoading(false);
  return;
  }

setProfileError("");

    setProfile(data as Profile);
    setProfileLoading(false);

    if (data?.active) {
      await loadProjects();
    }
  }

  /*
   * ---------------------------------------------------------
   * LOGIN
   * ---------------------------------------------------------
   */

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoginError("");
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error(error);

      setLoginError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha inválidos."
          : error.message
      );
    }

    setLoginLoading(false);
  }

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */

  async function handleLogout() {
    await supabase.auth.signOut();

    setSession(null);
    setProfile(null);
    setProjects([]);
    setSelected(null);
  }

  /*
   * ---------------------------------------------------------
   * PROJECTS
   * ---------------------------------------------------------
   */

  async function loadProjects() {
    setLoading(true);

    if (!supabaseConfigured) {
      setConnected(false);
      setProjects(demoProjects);
      setLoading(false);
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("v_project_dashboard")
      .select("*")
      .order("health_score", {
        ascending: true,
      });

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

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (authLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="brand-mark large">SAP</div>

          <h1>SAP PMO Control Tower</h1>

          <p>Inicializando ambiente...</p>

          <div className="auth-spinner" />
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * SUPABASE CONFIGURATION
   * ---------------------------------------------------------
   */

  if (!supabaseConfigured) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="brand-mark large">SAP</div>

          <h1>SAP PMO Control Tower</h1>

          <div className="setup-banner">
            <AlertTriangle size={18} />

            <div>
              <strong>Supabase não configurado.</strong>

              <span>
                Verifique as variáveis VITE_SUPABASE_URL e
                VITE_SUPABASE_ANON_KEY no Vercel.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * LOGIN SCREEN
   * ---------------------------------------------------------
   */

  if (!session) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark large">SAP</div>

            <div>
              <strong>SAP PMO</strong>
              <span>Control Tower</span>
            </div>
          </div>

          <div className="auth-title">
            <div className="auth-icon">
              <LockKeyhole size={22} />
            </div>

            <div>
              <h1>Acesso ao Portal</h1>

              <p>
                Entre para acessar o portfolio de projetos SAP.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <label>
              E-mail

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Senha

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
              />
            </label>

            {loginError && (
              <div className="login-error">
                <AlertTriangle size={17} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading
                ? "Entrando..."
                : "Entrar no sistema"}
            </button>
          </form>

          <div className="auth-footer">
            <span>PMO Control Tower</span>
            <span>•</span>
            <span>Governança SAP</span>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * PROFILE LOADING
   * ---------------------------------------------------------
   */

  if (profileLoading || !profile) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="brand-mark large">SAP</div>

          <h1>Carregando perfil...</h1>

          <p>
            Validando suas permissões de acesso.
          </p>

          <div className="auth-spinner" />
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ACCESS CONTROL
   * ---------------------------------------------------------
   */

  if (!profile.active) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="brand-mark large">SAP</div>

          <h1>Acesso bloqueado</h1>

          <p>
            Seu usuário está inativo. Entre em contato com o
            administrador do PMO.
          </p>

          <button
            className="login-button"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * HEAD DASHBOARD
   * ---------------------------------------------------------
   */

  const healthy = projects.filter(
    (p) => statusLabel(p.health_status) === "healthy"
  ).length;

  const attention = projects.filter(
    (p) => statusLabel(p.health_status) === "attention"
  ).length;

  const critical = projects.filter(
    (p) => statusLabel(p.health_status) === "critical"
  ).length;

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            SAP
          </div>

          <div>
            <strong>PMO Control Tower</strong>

            <span>
              Portfolio Governance
            </span>
          </div>

          <button
            className="icon-btn mobile-close"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            <X size={18} />
          </button>
        </div>

        <nav>

          <button className="nav-item active">
            <LayoutDashboard size={18} />
            Portfolio
          </button>

          <button className="nav-item">
            <CalendarDays size={18} />
            Cronograma
          </button>

          <button className="nav-item">
            <ShieldAlert size={18} />
            RAID
          </button>

          <button className="nav-item">
            <CircleDollarSign size={18} />
            Financeiro
          </button>

          <button className="nav-item">
            <Users size={18} />
            Recursos
          </button>

        </nav>

        <div className="sidebar-footer">

          <div className="user-profile">
            <UserCircle size={19} />

            <div>
              <strong>
                {profile.full_name ||
                  profile.email}
              </strong>

              <span>
                {roleLabel(profile.role)}
              </span>
            </div>
          </div>

          <div className="connection">
            <span
              className={
                connected
                  ? "dot on"
                  : "dot"
              }
            />

            {connected
              ? "Supabase conectado"
              : "Sem conexão com dados"}
          </div>

          <button
            className="nav-item logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Sair
          </button>

        </div>
      </aside>

      {/* MAIN */}

      <main>

        <header className="topbar">

          <button
            className="icon-btn mobile-menu"
            onClick={() =>
              setMenuOpen(true)
            }
          >
            <Menu size={20} />
          </button>

          <div>
            <div className="eyebrow">
              EXECUTIVE PORTFOLIO
            </div>

            <h1>
              Visão geral
            </h1>
          </div>

          <div className="topbar-actions">

            <div className="role-badge">
              {roleLabel(profile.role)}
            </div>

            <button
              className="refresh"
              onClick={loadProjects}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "spin"
                    : ""
                }
              />

              Atualizar
            </button>

          </div>

        </header>

        <section className="content">

          <div className="welcome">

            <div>
              <h2>
                Portfolio SAP
              </h2>

              <p>
                Acompanhe a saúde dos projetos
                em um único lugar.
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
                <h3>
                  Projetos
                </h3>

                <p>
                  Selecione um projeto para abrir
                  a visão executiva detalhada.
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
                  Nenhum projeto encontrado
                  no dashboard.
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
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>

                    {projects.map((p) => {

                      const st =
                        statusLabel(
                          p.health_status
                        );

                      const progress =
                        Math.min(
                          100,
                          Math.max(
                            0,
                            Number(
                              p.progress ?? 0
                            )
                          )
                        );

                      return (
                        <tr
                          key={p.id}
                          onClick={() =>
                            setSelected(p)
                          }
                        >

                          <td>

                            <div className="project">

                              <strong>
                                {p.code}
                              </strong>

                              <span>
                                {p.name}
                              </span>

                            </div>

                          </td>

                          <td>

                            <span
                              className={`health ${st}`}
                            >
                              <i />
                              {Math.round(
                                Number(
                                  p.health_score ??
                                    0
                                )
                              )}
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
                            {p.spi == null
                              ? "—"
                              : Number(
                                  p.spi
                                ).toFixed(2)}
                          </td>

                          <td>
                            {p.days_to_go_live ==
                            null
                              ? "—"
                              : `${Math.round(
                                  Number(
                                    p.days_to_go_live
                                  )
                                )}d`}
                          </td>

                          <td>

                            <span className="raid">
                              {(p.critical_risks ??
                                0) +
                                (p.open_issues ??
                                  0) +
                                (p.overdue_actions ??
                                  0)}
                            </span>

                          </td>

                          <td>
                            <ChevronRight
                              size={18}
                            />
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
          onClose={() =>
            setSelected(null)
          }
        />
      )}

    </div>
  );
}

/*
 * ---------------------------------------------------------
 * KPI
 * ---------------------------------------------------------
 */

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

      <span>
        {title}
      </span>

      <strong className={tone || ""}>
        {value}
      </strong>

      <small>
        {subtitle}
      </small>

    </div>
  );
}

/*
 * ---------------------------------------------------------
 * PROJECT DETAIL
 * ---------------------------------------------------------
 */

function ProjectDetail({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {

  const st =
    statusLabel(
      project.health_status
    );

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
    >

      <aside
        className="drawer"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="drawer-head">

          <div>

            <div className="eyebrow">
              PROJECT DETAIL
            </div>

            <h2>
              {project.code}
            </h2>

            <p>
              {project.name}
            </p>

          </div>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            <X />
          </button>

        </div>

        <div
          className={`hero-status ${st}`}
        >

          <div>

            <span>
              Health Score
            </span>

            <strong>
              {Math.round(
                Number(
                  project.health_score ??
                    0
                )
              )}
            </strong>

          </div>

          <span className="pill">
            {st === "critical"
              ? "Crítico"
              : st === "attention"
              ? "Atenção"
              : "Healthy"}
          </span>

        </div>

        <div className="detail-grid">

          <Metric
            label="Progresso"
            value={`${Math.round(
              Number(
                project.progress ?? 0
              )
            )}%`}
          />

          <Metric
            label="SPI"
            value={
              project.spi == null
                ? "—"
                : Number(
                    project.spi
                  ).toFixed(2)
            }
          />

          <Metric
            label="Go-Live"
            value={
              project.days_to_go_live ==
              null
                ? "—"
                : `${Math.round(
                    Number(
                      project.days_to_go_live
                    )
                  )} dias`
            }
          />

          <Metric
            label="Riscos críticos"
            value={
              project.critical_risks ??
              0
            }
          />

          <Metric
            label="Issues abertas"
            value={
              project.open_issues ??
              0
            }
          />

          <Metric
            label="Ações atrasadas"
            value={
              project.overdue_actions ??
              0
            }
          />

        </div>

        <div className="next">

          <h3>
            Próxima evolução
          </h3>

          <p>
            Esta área será expandida com
            Cronograma, RAID, Financeiro,
            Recursos, Testes, Cutover e
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

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

export default App;
