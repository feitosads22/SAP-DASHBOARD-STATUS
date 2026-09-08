import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
  Users,
  X,
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

type ProjectDrilldownProps = {
  project: Project | null;
  onClose: () => void;
};

function normalizeHealth(status?: string, score?: number) {
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
    value.includes("attention") ||
    value.includes("aten") ||
    (typeof score === "number" && score < 80)
  ) {
    return "attention";
  }

  return "healthy";
}

function healthLabel(status: string) {
  if (status === "critical") {
    return "Crítico";
  }

  if (status === "attention") {
    return "Atenção";
  }

  return "Saudável";
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

function formatStatus(status?: string) {
  if (!status) {
    return "Em andamento";
  }

  const value = status.toLowerCase();

  if (value === "in_progress" || value === "in progress") {
    return "Em andamento";
  }

  if (value === "completed" || value === "complete") {
    return "Concluído";
  }

  if (value === "planned") {
    return "Planejado";
  }

  if (value === "on_hold") {
    return "Em espera";
  }

  return status;
}

export default function ProjectDrilldown({
  project,
  onClose,
}: ProjectDrilldownProps) {
  if (!project) {
    return null;
  }

  const health = normalizeHealth(
    project.health_status,
    project.health_score
  );

  const healthScore =
    typeof project.health_score === "number"
      ? Math.round(project.health_score)
      : 0;

  const progress =
    typeof project.progress === "number"
      ? Math.min(100, Math.max(0, project.progress))
      : 0;

  const spi =
    typeof project.spi === "number"
      ? project.spi
      : 0;

  const criticalRisks = project.critical_risks || 0;
  const openIssues = project.open_issues || 0;
  const overdueActions = project.overdue_actions || 0;
  const daysToGoLive = project.days_to_go_live;

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="drawer project-drilldown"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <div className="section-kicker">PROJECT EXECUTIVE VIEW</div>
            <h2>{project.name}</h2>
            <p>{project.code}</p>
          </div>

          <button
            className="icon-btn"
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`executive-health ${health}`}>
          <div>
            <div className="health-label">PROJECT HEALTH SCORE</div>

            <div className="health-number">
              {formatNumber(healthScore)}
            </div>

            <div className="health-description">
              Indicador executivo consolidado
            </div>
          </div>

          <div className="health-status">
            <span className="health-status-dot" />
            {healthLabel(health)}
          </div>
        </div>

        <div className="executive-kpis">
          <div className="executive-metric highlight">
            <span>Progresso</span>
            <strong>{formatNumber(progress)}%</strong>
          </div>

          <div className="executive-metric">
            <span>SPI</span>
            <strong>{formatNumber(spi, 2)}</strong>
          </div>

          <div className="executive-metric">
            <span>Go-Live</span>
            <strong>
              {typeof daysToGoLive === "number"
                ? `${formatNumber(daysToGoLive)}d`
                : "-"}
            </strong>
          </div>

          <div className="executive-metric">
            <span>Status</span>
            <strong>{formatStatus(project.status)}</strong>
          </div>
        </div>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <div className="section-kicker">EXECUTIVE ASSESSMENT</div>
              <h3>Situação do projeto</h3>
            </div>
          </div>

          <div className={`executive-reading ${health}`}>
            <div className="reading-icon">
              {health === "healthy" && <CheckCircle2 size={16} />}
              {health === "attention" && <AlertTriangle size={16} />}
              {health === "critical" && <XCircle size={16} />}
            </div>

            <div>
              <strong>
                Projeto classificado como {healthLabel(health).toLowerCase()}
              </strong>

              <p>
                {health === "healthy" &&
                  "Os principais indicadores permanecem dentro dos parâmetros esperados."}

                {health === "attention" &&
                  "Existem indicadores que exigem acompanhamento próximo da governança."}

                {health === "critical" &&
                  "Existem desvios relevantes que exigem atuação executiva imediata."}
              </p>
            </div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <div className="section-kicker">DELIVERY</div>
              <h3>Progresso do projeto</h3>
            </div>

            <strong className="section-value">
              {formatNumber(progress)}%
            </strong>
          </div>

          <div className="executive-progress">
            <div className="progress-track">
              <div
                className="progress-value"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="progress-caption">
              <span>Execução atual</span>
              <span>{formatNumber(progress)}%</span>
            </div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <div className="section-kicker">HEALTH DRIVERS</div>
              <h3>Principais indicadores</h3>
            </div>
          </div>

          <div className="health-drivers">
            <div className={`driver ${criticalRisks > 0 ? "critical" : "healthy"}`}>
              <div className="driver-value">{criticalRisks}</div>
              <span>Riscos críticos</span>
            </div>

            <div className={`driver ${openIssues > 0 ? "attention" : "healthy"}`}>
              <div className="driver-value">{openIssues}</div>
              <span>Issues abertas</span>
            </div>

            <div
              className={`driver ${
                overdueActions > 0 ? "critical" : "healthy"
              }`}
            >
              <div className="driver-value">{overdueActions}</div>
              <span>Ações atrasadas</span>
            </div>

            <div
              className={`driver ${
                spi > 0 && spi < 1 ? "attention" : "healthy"
              }`}
            >
              <div className="driver-value">
                {formatNumber(spi, 2)}
              </div>
              <span>Schedule Performance</span>
            </div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <div className="section-kicker">PROJECT CONTEXT</div>
              <h3>Informações executivas</h3>
            </div>
          </div>

          <div className="health-drivers">
            <div className="driver">
              <div className="driver-value">
                <Activity size={17} />
              </div>
              <span>Fase atual: {project.current_phase || "Não informada"}</span>
            </div>

            <div className="driver">
              <div className="driver-value">
                <CalendarDays size={17} />
              </div>
              <span>
                Go-Live:{" "}
                {typeof daysToGoLive === "number"
                  ? `${formatNumber(daysToGoLive)} dias`
                  : "Não informado"}
              </span>
            </div>

            <div className="driver">
              <div className="driver-value">
                <Target size={17} />
              </div>
              <span>Meta de entrega</span>
            </div>

            <div className="driver">
              <div className="driver-value">
                <Users size={17} />
              </div>
              <span>Governança do projeto</span>
            </div>
          </div>
        </section>

        <section className="executive-section">
          <div className="section-title">
            <div>
              <div className="section-kicker">NEXT ACTIONS</div>
              <h3>Prioridades executivas</h3>
            </div>
          </div>

          <div className="placeholder-card">
            <AlertTriangle size={15} />

            <div>
              <strong>Monitorar riscos críticos</strong>
              <span>
                A integração com o módulo RAID será utilizada para detalhar
                responsáveis e prazos.
              </span>
            </div>

            <b>{criticalRisks}</b>
          </div>

          <div className="placeholder-card">
            <Clock3 size={15} />

            <div>
              <strong>Acompanhar ações atrasadas</strong>
              <span>
                Ações vencidas deverão ser priorizadas na próxima governança.
              </span>
            </div>

            <b>{overdueActions}</b>
          </div>

          <div className="placeholder-card">
            <TrendingUp size={15} />

            <div>
              <strong>Monitorar performance do cronograma</strong>
              <span>
                SPI abaixo de 1 indica potencial atraso na execução planejada.
              </span>
            </div>

            <b>{formatNumber(spi, 2)}</b>
          </div>
        </section>

        <div className="drawer-footer">
          <span>
            <Activity size={12} />
            Dados consolidados do projeto
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
