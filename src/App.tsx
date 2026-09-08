import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Target,
  Users,
  X,
} from "lucide-react";

import { supabase, supabaseConfigured } from "./lib/supabase";
import Cronograma from "./Cronograma";
import Financeiro from "./Financeiro";
import RAID from "./RAID";
import Recursos from "./Recursos";
import RACI from "./RACI";
import Governanca from "./Governanca";
import GovernancaOperacional from "./GovernancaOperacional";
import LicoesAprendidas from "./LicoesAprendidas";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import ProjectDrilldown from "./components/ProjectDrilldown";
import ExecutiveStatus from "./ExecutiveStatus";

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

type Module =
  | "portfolio"
  | "schedule"
  | "raid"
  | "financial"
  | "resources"
  | "raci"
  | "governance"
  | "governance-operational"
  | "lessons"
  | "status";

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

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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

  const moduleTitles: Record<Module, string> = {
    portfolio: "Visão geral",
    schedule: "Cronograma",
    raid: "RAID",
    financial: "Financeiro",
    resources: "Recursos",
    raci: "RACI",
    governance: "Governança",
    "governance-operational": "Governança Operacional",
    lessons: "Lições Aprendidas",
    status: "Status Executivo",
  };

  function navigate(next: Module) {
    setModule(next);
    setSelectedProject(null);
    setMenuOpen(false);
  }

  function openProject(project: Project) {
    setSelectedProject(project);
  }

  function closeProject() {
    setSelectedProject(null);
  }

  const projectRefs = projects.map((project) => ({
    id: project.id,
    code: project.code,
    name: project.name,
  }));

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

          <NavButton
            active={module === "raci"}
            onClick={() => navigate("raci")}
            icon={<ShieldCheck size={18} />}
            label="RACI"
          />

          <NavButton
            active={module === "governance"}
            onClick={() => navigate("governance")}
            icon={<Activity size={18} />}
            label="Governança"
          />

          <NavButton
            active={module === "governance-operational"}
            onClick={() => navigate("governance-operational")}
            icon={<Target size={18} />}
            label="Follow-up"
          />

          <NavButton
            active={module === "lessons"}
            onClick={() => navigate("lessons")}
            icon={<BookOpen size={18} />}
            label="Lições Aprendidas"
          />

          <NavButton
            active={module === "status"}
            onClick={() => navigate("status")}
            icon={<Link2 size={18} />}
            label="Status Executivo"
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
              <div className="eyebrow">EXECUTIVE PORTFOLIO</div>
              <h1>{moduleTitles[module]}</h1>
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
                Configure as variáveis do projeto Supabase
                na Vercel.
              </span>
            </div>
          </div>
        )}

        {module === "portfolio" && (
          <ExecutiveDashboard
            projects={projects}
            loading={loading}
            onProjectSelect={openProject}
          />
        )}

        {module === "schedule" && (
          <Cronograma projects={projects} />
        )}

        {module === "raid" && (
          <RAID projects={projectRefs} />
        )}

        {module === "financial" && (
          <Financeiro projects={projects} />
        )}

        {module === "resources" && (
          <Recursos projects={projects} />
        )}

        {module === "raci" && (
          <RACI projects={projectRefs} />
        )}

        {module === "governance" && (
          <Governanca projects={projects} />
        )}

        {module === "governance-operational" && (
          <GovernancaOperacional projects={projectRefs} />
        )}

        {module === "lessons" && (
          <LicoesAprendidas projects={projectRefs} />
        )}

        {module === "status" && (
          <ExecutiveStatus projects={projects} />
        )}
      </main>

      <ProjectDrilldown
        project={selectedProject}
        onClose={closeProject}
      />
    </div>
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

export default App;
