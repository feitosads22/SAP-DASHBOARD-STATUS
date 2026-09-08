import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  RefreshCw,
  ShieldAlert,
  Target,
  Users,
  XCircle,
} from "lucide-react";

const projects = [
  {
    name: "SAP S/4HANA",
    phase: "Implementação",
    progress: 72,
    deadline: "15/10/2026",
    budget: "R$ 1,8M",
    owner: "Carlos Silva",
    status: "healthy",
  },
  {
    name: "Integração FI",
    phase: "UAT",
    progress: 54,
    deadline: "28/09/2026",
    budget: "R$ 820K",
    owner: "Mariana Costa",
    status: "attention",
  },
  {
    name: "Renda Fixa",
    phase: "Go-live",
    progress: 31,
    deadline: "12/09/2026",
    budget: "R$ 640K",
    owner: "Felipe Santos",
    status: "critical",
  },
  {
    name: "SAP Ariba",
    phase: "Desenvolvimento",
    progress: 46,
    deadline: "05/11/2026",
    budget: "R$ 520K",
    owner: "Ana Oliveira",
    status: "healthy",
  },
];

const statusConfig = {
  healthy: {
    label: "Saudável",
    className: "status-healthy",
    icon: CheckCircle2,
  },
  attention: {
    label: "Atenção",
    className: "status-attention",
    icon: AlertTriangle,
  },
  critical: {
    label: "Crítico",
    className: "status-critical",
    icon: XCircle,
  },
};

const milestones = [
  {
    date: "12/09",
    title: "Go-live",
    project: "Renda Fixa",
    owner: "Felipe Santos",
    status: "critical",
  },
  {
    date: "18/09",
    title: "UAT",
    project: "Integração FI",
    owner: "Mariana Costa",
    status: "attention",
  },
  {
    date: "25/09",
    title: "Steering Committee",
    project: "SAP S/4HANA",
    owner: "Carlos Silva",
    status: "healthy",
  },
  {
    date: "05/10",
    title: "Cutover",
    project: "SAP Ariba",
    owner: "Ana Oliveira",
    status: "healthy",
  },
];

const alerts = [
  {
    type: "critical",
    title: "Prazo em risco",
    description: "Renda Fixa possui apenas 5 dias até o Go-live.",
  },
  {
    type: "warning",
    title: "Orçamento acima do previsto",
    description: "Integração FI está 8% acima do baseline.",
  },
  {
    type: "warning",
    title: "Recurso sobrecarregado",
    description: "2 recursos estão acima de 100% de capacidade.",
  },
  {
    type: "critical",
    title: "RAID crítico",
    description: "3 riscos críticos aguardam plano de mitigação.",
  },
];

export default function ExecutiveDashboard() {
  const budgetTotal = 4200000;
  const budgetConsumed = 2700000;
  const budgetPercentage = Math.round(
    (budgetConsumed / budgetTotal) * 100
  );

  return (
    <div className="executive-dashboard">
      <header className="executive-header">
        <div>
          <div className="executive-breadcrumb">
            <span>Governança</span>
            <ArrowUpRight size={14} />
            <span>Portfólio SAP</span>
          </div>

          <h1>Visão Geral</h1>

          <p>
            Governança executiva e acompanhamento estratégico do portfólio SAP
          </p>
        </div>

        <div className="executive-header-actions">
          <button className="executive-period">
            <CalendarDays size={17} />
            <span>Setembro 2026</span>
          </button>

          <button className="executive-action">
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>
      </header>

      <section className="executive-kpis">
        <div className="executive-kpi">
          <div className="kpi-icon">
            <Target size={21} />
          </div>

          <div className="kpi-content">
            <span>Projetos ativos</span>
            <strong>12</strong>
            <small className="kpi-positive">
              +2 este mês
            </small>
          </div>
        </div>

        <div className="executive-kpi">
          <div className="kpi-icon kpi-warning">
            <ShieldAlert size={21} />
          </div>

          <div className="kpi-content">
            <span>Projetos em risco</span>
            <strong>3</strong>
            <small className="kpi-negative">
              25% do portfólio
            </small>
          </div>
        </div>

        <div className="executive-kpi">
          <div className="kpi-icon kpi-danger">
            <Clock3 size={21} />
          </div>

          <div className="kpi-content">
            <span>Projetos atrasados</span>
            <strong>2</strong>
            <small className="kpi-negative">
              Requer atenção
            </small>
          </div>
        </div>

        <div className="executive-kpi">
          <div className="kpi-icon">
            <DollarSign size={21} />
          </div>

          <div className="kpi-content">
            <span>Budget total</span>
            <strong>R$ 4,2M</strong>
            <small>Portfólio atual</small>
          </div>
        </div>

        <div className="executive-kpi">
          <div className="kpi-icon">
            <Activity size={21} />
          </div>

          <div className="kpi-content">
            <span>Budget consumido</span>
            <strong>R$ 2,7M</strong>
            <small>{budgetPercentage}% executado</small>
          </div>
        </div>

        <div className="executive-kpi">
          <div className="kpi-icon">
            <Users size={21} />
          </div>

          <div className="kpi-content">
            <span>Capacidade recursos</span>
            <strong>87%</strong>
            <small className="kpi-warning-text">
              2 sobrecarregados
            </small>
          </div>
        </div>
      </section>

      <section className="executive-grid executive-grid-top">
        <div className="executive-card health-card">
          <div className="executive-card-header">
            <div>
              <span className="card-eyebrow">PORTFÓLIO</span>
              <h2>Saúde do portfólio</h2>
            </div>

            <Activity size={20} />
          </div>

          <div className="health-content">
            <div className="health-ring">
              <div className="health-ring-inner">
                <strong>75%</strong>
                <span>Saudável</span>
              </div>
            </div>

            <div className="health-legend">
              <div>
                <span className="legend-dot legend-green" />
                <span>Saudável</span>
                <strong>75%</strong>
              </div>

              <div>
                <span className="legend-dot legend-yellow" />
                <span>Atenção</span>
                <strong>17%</strong>
              </div>

              <div>
                <span className="legend-dot legend-red" />
                <span>Crítico</span>
                <strong>8%</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="executive-card financial-card">
          <div className="executive-card-header">
            <div>
              <span className="card-eyebrow">FINANCEIRO</span>
              <h2>Execução financeira</h2>
            </div>

            <DollarSign size={20} />
          </div>

          <div className="financial-values">
            <div>
              <span>Budget</span>
              <strong>R$ 4,2M</strong>
            </div>

            <div>
              <span>Executado</span>
              <strong>R$ 2,7M</strong>
            </div>

            <div>
              <span>Saldo</span>
              <strong>R$ 1,5M</strong>
            </div>
          </div>

          <div className="financial-progress">
            <div className="financial-progress-header">
              <span>Consumo do budget</span>
              <strong>{budgetPercentage}%</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="executive-card portfolio-card">
        <div className="executive-card-header">
          <div>
            <span className="card-eyebrow">PORTFÓLIO</span>
            <h2>Projetos em andamento</h2>
          </div>

          <button className="card-link">
            Ver todos
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="portfolio-table-wrapper">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Fase</th>
                <th>Execução</th>
                <th>Prazo</th>
                <th>Orçamento</th>
                <th>Responsável</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((project) => {
                const config =
                  statusConfig[
                    project.status as keyof typeof statusConfig
                  ];

                const StatusIcon = config.icon;

                return (
                  <tr key={project.name}>
                    <td>
                      <div className="project-name">
                        <span className="project-avatar">
                          {project.name.charAt(0)}
                        </span>
                        <strong>{project.name}</strong>
                      </div>
                    </td>

                    <td>{project.phase}</td>

                    <td>
                      <div className="project-progress">
                        <div className="project-progress-top">
                          <span>{project.progress}%</span>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${project.progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>{project.deadline}</td>

                    <td>{project.budget}</td>

                    <td>{project.owner}</td>

                    <td>
                      <span
                        className={`status-badge ${config.className}`}
                      >
                        <StatusIcon size={14} />
                        {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="executive-grid executive-grid-bottom">
        <div className="executive-card raid-card">
          <div className="executive-card-header">
            <div>
              <span className="card-eyebrow">GOVERNANÇA</span>
              <h2>RAID executivo</h2>
            </div>

            <button className="card-link">
              Ver RAID
              <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="raid-list">
            <div className="raid-item">
              <div className="raid-icon raid-danger">
                <ShieldAlert size={18} />
              </div>

              <div>
                <strong>3 riscos críticos</strong>
                <span>Aguardando mitigação</span>
              </div>

              <b>3</b>
            </div>

            <div className="raid-item">
              <div className="raid-icon raid-warning">
                <AlertTriangle size={18} />
              </div>

              <div>
                <strong>5 issues abertas</strong>
                <span>2 com vencimento próximo</span>
              </div>

              <b>5</b>
            </div>

            <div className="raid-item">
              <div className="raid-icon raid-info">
                <Target size={18} />
              </div>

              <div>
                <strong>2 decisões pendentes</strong>
                <span>Steering Committee</span>
              </div>

              <b>2</b>
            </div>

            <div className="raid-item">
              <div className="raid-icon raid-warning">
                <ArrowUpRight size={18} />
              </div>

              <div>
                <strong>4 dependências</strong>
                <span>Impacto em projetos</span>
              </div>

              <b>4</b>
            </div>
          </div>
        </div>

        <div className="executive-card milestones-card">
          <div className="executive-card-header">
            <div>
              <span className="card-eyebrow">PLANEJAMENTO</span>
              <h2>Próximos marcos</h2>
            </div>

            <CalendarDays size={20} />
          </div>

          <div className="milestone-list">
            {milestones.map((milestone) => {
              const config =
                statusConfig[
                  milestone.status as keyof typeof statusConfig
                ];

              return (
                <div className="milestone-item" key={`${milestone.date}-${milestone.title}`}>
                  <div className="milestone-date">
                    <strong>{milestone.date}</strong>
                    <span>SET</span>
                  </div>

                  <div className="milestone-info">
                    <strong>{milestone.title}</strong>
                    <span>{milestone.project}</span>
                    <small>{milestone.owner}</small>
                  </div>

                  <span
                    className={`milestone-status ${config.className}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="executive-card alerts-card">
        <div className="executive-card-header">
          <div>
            <span className="card-eyebrow">ATENÇÃO EXECUTIVA</span>
            <h2>Alertas</h2>
          </div>

          <span className="alert-count">{alerts.length}</span>
        </div>

        <div className="alerts-list">
          {alerts.map((alert) => (
            <div
              className={`alert-item alert-${alert.type}`}
              key={alert.title}
            >
              <div className="alert-item-icon">
                {alert.type === "critical" ? (
                  <ShieldAlert size={19} />
                ) : (
                  <AlertTriangle size={19} />
                )}
              </div>

              <div>
                <strong>{alert.title}</strong>
                <span>{alert.description}</span>
              </div>

              <ArrowUpRight size={17} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
