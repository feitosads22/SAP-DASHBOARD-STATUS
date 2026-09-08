import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CircleDollarSign,
  Edit3,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = {
  id: string;
  code: string;
  name: string;
  status?: string;
};

type FinancialItem = {
  id?: string;
  project_id: string;
  budget: number;
  actual: number;
  forecast: number;
  currency: string;
  variance?: number;
};

type FormState = {
  project_id: string;
  budget: string;
  actual: string;
  forecast: string;
  currency: string;
};

const emptyForm: FormState = {
  project_id: "",
  budget: "0",
  actual: "0",
  forecast: "0",
  currency: "BRL",
};

function money(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function percent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export default function Financeiro({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "over" | "under" | "zero">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  async function loadFinancials() {
    setLoading(true);
    setError("");

    if (!supabaseConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error: requestError } = await supabase
      .from("v_project_financial_dashboard")
      .select("*")
      .order("forecast", { ascending: false });

    if (requestError) {
      console.error("Erro ao carregar financeiro:", requestError);
      setItems([]);
      setError("Não foi possível carregar os dados financeiros. Verifique as permissões e a view no Supabase.");
    } else {
      setItems((data || []) as FinancialItem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadFinancials();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const project = projectMap.get(item.project_id);
      const variance = Number(item.variance ?? Number(item.forecast || 0) - Number(item.budget || 0));
      const haystack = `${project?.code || ""} ${project?.name || ""}`.toLowerCase();
      return (
        (!q || haystack.includes(q)) &&
        (filter === "all" ||
          (filter === "over" && variance > 0) ||
          (filter === "under" && variance < 0) ||
          (filter === "zero" && variance === 0))
      );
    });
  }, [filter, items, projectMap, query]);

  const metrics = useMemo(() => {
    const budget = items.reduce((sum, item) => sum + Number(item.budget || 0), 0);
    const actual = items.reduce((sum, item) => sum + Number(item.actual || 0), 0);
    const forecast = items.reduce((sum, item) => sum + Number(item.forecast || 0), 0);
    const variance = forecast - budget;
    const utilization = budget > 0 ? (actual / budget) * 100 : 0;
    const projectsWithData = items.filter((item) => Number(item.budget || 0) > 0 || Number(item.forecast || 0) > 0).length;
    return { budget, actual, forecast, variance, utilization, projectsWithData };
  }, [items]);

  function openEdit(item: FinancialItem) {
    setEditing(item);
    setForm({
      project_id: item.project_id,
      budget: String(item.budget ?? 0),
      actual: String(item.actual ?? 0),
      forecast: String(item.forecast ?? 0),
      currency: item.currency || "BRL",
    });
    setModalOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, project_id: projects[0]?.id || "" });
    setModalOpen(true);
  }

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!form.project_id) {
      setError("Selecione um projeto.");
      return;
    }
    if (!supabaseConfigured) {
      setError("Configure o Supabase antes de salvar dados financeiros.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      project_id: form.project_id,
      budget: Number(form.budget || 0),
      actual: Number(form.actual || 0),
      forecast: Number(form.forecast || 0),
      currency: form.currency || "BRL",
      updated_at: new Date().toISOString(),
    };

    const { error: requestError } = await supabase
      .from("project_financials")
      .upsert(payload, { onConflict: "project_id" });

    if (requestError) {
      console.error("Erro ao salvar financeiro:", requestError);
      setError("Não foi possível salvar. Verifique a tabela project_financials e as políticas do Supabase.");
    } else {
      setModalOpen(false);
      setEditing(null);
      await loadFinancials();
    }

    setSaving(false);
  }

  return (
    <section className="content financial-page">
      <div className="module-hero financial-hero">
        <div className="module-icon"><CircleDollarSign size={22} /></div>
        <div>
          <div className="eyebrow">FINANCIAL GOVERNANCE</div>
          <h2>Financeiro</h2>
          <p>Controle de budget, realizado, forecast e desvios do portfólio SAP.</p>
        </div>
        <div className="financial-hero-actions">
          <button className="refresh" type="button" onClick={loadFinancials} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            Atualizar
          </button>
          <button className="primary-btn" type="button" onClick={openCreate}>
            <CircleDollarSign size={16} />
            Lançar orçamento
          </button>
        </div>
      </div>

      {error && (
        <div className="financial-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="financial-kpis">
        <FinancialKpi label="Budget total" value={money(metrics.budget)} helper={`${metrics.projectsWithData} projetos com dados`} />
        <FinancialKpi label="Realizado" value={money(metrics.actual)} helper={`${percent(metrics.utilization)} do budget`} />
        <FinancialKpi label="Forecast" value={money(metrics.forecast)} helper="Projeção atual" />
        <FinancialKpi
          label="Desvio forecast"
          value={money(metrics.variance)}
          helper={metrics.variance > 0 ? "Acima do budget" : metrics.variance < 0 ? "Abaixo do budget" : "Dentro do budget"}
          tone={metrics.variance > 0 ? "critical" : metrics.variance < 0 ? "healthy" : "neutral"}
        />
      </div>

      <section className="financial-dashboard-grid">
        <div className="financial-overview-card">
          <div className="financial-card-head">
            <div>
              <span className="section-kicker">PORTFOLIO FINANCE</span>
              <h3>Budget x Forecast</h3>
            </div>
            <BarChart3 size={19} />
          </div>
          <div className="financial-comparison">
            <div className="financial-bar-row">
              <div><span>Budget</span><strong>{money(metrics.budget)}</strong></div>
              <div className="financial-bar-track"><b style={{ width: `${metrics.budget > 0 ? 100 : 0}%` }} /></div>
            </div>
            <div className="financial-bar-row">
              <div><span>Forecast</span><strong>{money(metrics.forecast)}</strong></div>
              <div className="financial-bar-track forecast"><b style={{ width: `${metrics.budget > 0 ? Math.min(120, (metrics.forecast / metrics.budget) * 100) : 0}%` }} /></div>
            </div>
          </div>
          <div className="financial-insight">
            {metrics.variance > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{metrics.variance > 0 ? `Forecast ${percent((metrics.variance / Math.max(metrics.budget, 1)) * 100)} acima do budget.` : metrics.variance < 0 ? `Forecast ${percent(Math.abs((metrics.variance / Math.max(metrics.budget, 1)) * 100))} abaixo do budget.` : "Forecast alinhado ao budget."}</span>
          </div>
        </div>

        <div className="financial-overview-card">
          <div className="financial-card-head">
            <div>
              <span className="section-kicker">COST CONTROL</span>
              <h3>Execução financeira</h3>
            </div>
            <CircleDollarSign size={19} />
          </div>
          <div className="financial-execution-value">{percent(metrics.utilization)}</div>
          <div className="financial-bar-track large"><b style={{ width: `${Math.min(metrics.utilization, 100)}%` }} /></div>
          <div className="financial-execution-meta"><span>Realizado</span><strong>{money(metrics.actual)}</strong></div>
          <div className="financial-execution-meta"><span>Saldo vs budget</span><strong>{money(metrics.budget - metrics.actual)}</strong></div>
        </div>
      </section>

      <section className="financial-panel">
        <div className="financial-panel-head">
          <div>
            <span className="section-kicker">PROJECT FINANCIAL CONTROL</span>
            <h3>Controle financeiro por projeto</h3>
            <p>{rows.length} {rows.length === 1 ? "projeto exibido" : "projetos exibidos"}</p>
          </div>
          <div className="financial-tools">
            <div className="financial-search">
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar projeto..." />
            </div>
            <div className="financial-filter">
              <Filter size={15} />
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filtrar desvio">
                <option value="all">Todos</option>
                <option value="over">Acima do budget</option>
                <option value="under">Abaixo do budget</option>
                <option value="zero">Sem desvio</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="financial-empty"><RefreshCw size={24} className="spin" /><strong>Carregando financeiro</strong><span>Consultando os dados no Supabase.</span></div>
        ) : rows.length === 0 ? (
          <div className="financial-empty">
            <CircleDollarSign size={28} />
            <strong>{items.length ? "Nenhum projeto corresponde ao filtro" : "Financeiro ainda sem lançamentos"}</strong>
            <span>{items.length ? "Ajuste a busca ou o filtro para visualizar os projetos." : "Cadastre budget, realizado e forecast para iniciar o controle financeiro."}</span>
            {!items.length && <button className="primary-btn" type="button" onClick={openCreate}>Lançar primeiro orçamento</button>}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="financial-table">
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Budget</th>
                  <th>Realizado</th>
                  <th>Forecast</th>
                  <th>Desvio</th>
                  <th>Execução</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const project = projectMap.get(item.project_id);
                  const budget = Number(item.budget || 0);
                  const actual = Number(item.actual || 0);
                  const forecast = Number(item.forecast || 0);
                  const variance = Number(item.variance ?? forecast - budget);
                  const execution = budget > 0 ? (actual / budget) * 100 : 0;
                  const over = variance > 0;
                  return (
                    <tr key={item.project_id}>
                      <td>
                        <div className="financial-project">
                          <div className="financial-project-mark"><CircleDollarSign size={15} /></div>
                          <div><strong>{project?.code || "Projeto"}</strong><span>{project?.name || "Projeto não encontrado"}</span></div>
                        </div>
                      </td>
                      <td><strong>{money(budget, item.currency)}</strong></td>
                      <td>{money(actual, item.currency)}</td>
                      <td>{money(forecast, item.currency)}</td>
                      <td><span className={`variance ${over ? "over" : variance < 0 ? "under" : "zero"}`}>{variance > 0 ? "+" : ""}{money(variance, item.currency)}</span></td>
                      <td>
                        <div className="execution-cell"><span>{percent(execution)}</span><div><b style={{ width: `${Math.min(execution, 100)}%` }} /></div></div>
                      </td>
                      <td><span className={`financial-status ${over ? "over" : "ok"}`}>{over ? "Atenção" : "Controlado"}</span></td>
                      <td><button className="row-action" type="button" onClick={() => openEdit(item)} aria-label={`Editar financeiro de ${project?.code || "projeto"}`}><Edit3 size={16} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => !saving && setModalOpen(false)}>
          <div className="modal financial-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div><span className="section-kicker">FINANCIAL ENTRY</span><h3>{editing ? "Editar financeiro" : "Novo lançamento financeiro"}</h3><p>Informe os valores de controle do projeto.</p></div>
              <button className="icon-btn" type="button" onClick={() => !saving && setModalOpen(false)} aria-label="Fechar"><X size={18} /></button>
            </div>
            <div className="financial-form">
              <label><span>Projeto</span><select value={form.project_id} onChange={(e) => updateField("project_id", e.target.value)} disabled={Boolean(editing)}><option value="">Selecione o projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.code} — {project.name}</option>)}</select></label>
              <label><span>Moeda</span><select value={form.currency} onChange={(e) => updateField("currency", e.target.value)}><option value="BRL">BRL — Real brasileiro</option><option value="USD">USD — Dólar</option><option value="EUR">EUR — Euro</option></select></label>
              <label><span>Budget</span><input type="number" min="0" step="0.01" value={form.budget} onChange={(e) => updateField("budget", e.target.value)} /></label>
              <label><span>Realizado</span><input type="number" min="0" step="0.01" value={form.actual} onChange={(e) => updateField("actual", e.target.value)} /></label>
              <label><span>Forecast</span><input type="number" min="0" step="0.01" value={form.forecast} onChange={(e) => updateField("forecast", e.target.value)} /></label>
            </div>
            <div className="financial-modal-footer"><button className="secondary-btn" type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button className="primary-btn" type="button" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar lançamento"}</button></div>
          </div>
        </div>
      )}
    </section>
  );
}

function FinancialKpi({ label, value, helper, tone = "neutral" }: { label: string; value: string; helper: string; tone?: string }) {
  return <div className="financial-kpi"><div className={`financial-kpi-icon ${tone}`}><CircleDollarSign size={18} /></div><div><span>{label}</span><strong className={tone}>{value}</strong><small>{helper}</small></div></div>;
}
