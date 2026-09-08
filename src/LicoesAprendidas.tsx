import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase, supabaseConfigured } from "./lib/supabase";

type Project = {
  id: string;
  code: string;
  name: string;
};

type Lesson = {
  id: string;
  project_id: string;
  lesson_date?: string | null;
  phase?: string | null;
  workstream_id?: string | null;
  category?: string | null;
  situation?: string | null;
  lesson?: string | null;
  improvement_action?: string | null;
  responsible_id?: string | null;
  applicable_to_future_projects?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Props = {
  projects?: Project[];
};

type FormData = {
  project_id: string;
  lesson_date: string;
  phase: string;
  category: string;
  situation: string;
  lesson: string;
  improvement_action: string;
  applicable_to_future_projects: boolean;
};

const emptyForm: FormData = {
  project_id: "",
  lesson_date: new Date().toISOString().slice(0, 10),
  phase: "",
  category: "",
  situation: "",
  lesson: "",
  improvement_action: "",
  applicable_to_future_projects: true,
};

const phases = [
  "Preparação",
  "Explore",
  "Realização",
  "Testes",
  "Cutover",
  "Go-Live",
  "Hypercare",
  "Operação",
];

const categories = [
  "Processo",
  "Tecnologia",
  "Pessoas",
  "Comunicação",
  "Fornecedor",
  "Governança",
  "Dados",
  "Integração",
  "Testes",
  "Planejamento",
];

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR");
}

export default function LicoesAprendidas({
  projects = [],
}: Props) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  async function loadLessons() {
    setLoading(true);

    if (!supabaseConfigured) {
      setLessons([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("lessons_learned")
      .select("*")
      .order("lesson_date", { ascending: false });

    if (error) {
      console.error("Erro ao carregar lições aprendidas:", error);
      setLessons([]);
    } else {
      setLessons((data || []) as Lesson[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLessons();
  }, []);

  const filteredLessons = useMemo(() => {
    const term = search.trim().toLowerCase();

    return lessons.filter((item) => {
      if (
        projectFilter !== "all" &&
        item.project_id !== projectFilter
      ) {
        return false;
      }

      if (
        phaseFilter !== "all" &&
        item.phase !== phaseFilter
      ) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        item.category !== categoryFilter
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      const content = [
        item.situation,
        item.lesson,
        item.improvement_action,
        item.phase,
        item.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return content.includes(term);
    });
  }, [
    lessons,
    search,
    projectFilter,
    phaseFilter,
    categoryFilter,
  ]);

  const applicableCount = lessons.filter(
    (item) => item.applicable_to_future_projects
  ).length;

  const projectName = (projectId: string) => {
    return (
      projects.find((project) => project.id === projectId)?.name ||
      "Projeto não identificado"
    );
  };

  const projectCode = (projectId: string) => {
    return (
      projects.find((project) => project.id === projectId)?.code ||
      "—"
    );
  };

  function openCreate() {
    setEditingLesson(null);

    setForm({
      ...emptyForm,
      project_id:
        projectFilter !== "all" ? projectFilter : projects[0]?.id || "",
    });

    setModalOpen(true);
  }

  function openEdit(item: Lesson) {
    setEditingLesson(item);

    setForm({
      project_id: item.project_id || "",
      lesson_date:
        item.lesson_date?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10),
      phase: item.phase || "",
      category: item.category || "",
      situation: item.situation || "",
      lesson: item.lesson || "",
      improvement_action: item.improvement_action || "",
      applicable_to_future_projects:
        item.applicable_to_future_projects ?? true,
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingLesson(null);
    setForm(emptyForm);
  }

  async function saveLesson() {
    if (!supabaseConfigured) {
      return;
    }

    if (!form.project_id) {
      window.alert("Selecione um projeto.");
      return;
    }

    if (!form.lesson.trim()) {
      window.alert("Informe a lição aprendida.");
      return;
    }

    setSaving(true);

    const payload = {
      project_id: form.project_id,
      lesson_date: form.lesson_date || null,
      phase: form.phase || null,
      category: form.category || null,
      situation: form.situation || null,
      lesson: form.lesson.trim(),
      improvement_action: form.improvement_action || null,
      applicable_to_future_projects:
        form.applicable_to_future_projects,
    };

    if (editingLesson) {
      const { error } = await supabase
        .from("lessons_learned")
        .update(payload)
        .eq("id", editingLesson.id);

      if (error) {
        console.error("Erro ao atualizar lição:", error);
        window.alert("Não foi possível atualizar a lição.");
      } else {
        await loadLessons();
        closeModal();
      }
    } else {
      const { error } = await supabase
        .from("lessons_learned")
        .insert(payload);

      if (error) {
        console.error("Erro ao criar lição:", error);
        window.alert("Não foi possível cadastrar a lição.");
      } else {
        await loadLessons();
        closeModal();
      }
    }

    setSaving(false);
  }

  async function deleteLesson(item: Lesson) {
    if (!supabaseConfigured) {
      return;
    }

    const confirmed = window.confirm(
      "Deseja realmente excluir esta lição aprendida?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("lessons_learned")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Erro ao excluir lição:", error);
      window.alert(
        "Não foi possível excluir a lição. Verifique as permissões do usuário."
      );
      return;
    }

    setLessons((current) =>
      current.filter((lesson) => lesson.id !== item.id)
    );
  }

  return (
    <section className="content lessons-page">
      <div className="module-hero">
        <div className="module-icon">
          <BookOpen size={22} />
        </div>

        <div>
          <div className="eyebrow">KNOWLEDGE MANAGEMENT</div>
          <h2>Lições Aprendidas</h2>
          <p>
            Registro estruturado de experiências, aprendizados e ações
            de melhoria dos projetos SAP.
          </p>
        </div>
      </div>

      <div className="module-toolbar">
        <div className="search-field">
          <Search size={16} />

          <input
            type="text"
            placeholder="Pesquisar lições..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
        >
          <option value="all">Todos os projetos</option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} — {project.name}
            </option>
          ))}
        </select>

        <select
          value={phaseFilter}
          onChange={(event) => setPhaseFilter(event.target.value)}
        >
          <option value="all">Todas as fases</option>

          {phases.map((phase) => (
            <option key={phase} value={phase}>
              {phase}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="all">Todas as categorias</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <button
          className="primary-btn"
          type="button"
          onClick={openCreate}
        >
          <Plus size={16} />
          Nova lição
        </button>
      </div>

      <div className="lessons-summary">
        <div className="summary-card">
          <span>Total de lições</span>
          <strong>{lessons.length}</strong>
        </div>

        <div className="summary-card">
          <span>Aplicáveis a futuros projetos</span>
          <strong>{applicableCount}</strong>
        </div>

        <div className="summary-card">
          <span>Exibidas</span>
          <strong>{filteredLessons.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="module-empty">
          <BookOpen size={22} />
          <strong>Carregando lições aprendidas...</strong>
          <span>
            Consultando a base de conhecimento dos projetos.
          </span>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="module-empty">
          <BookOpen size={22} />
          <strong>Nenhuma lição encontrada</strong>
          <span>
            Cadastre uma nova lição ou ajuste os filtros utilizados.
          </span>

          <button
            className="primary-btn"
            type="button"
            onClick={openCreate}
          >
            <Plus size={16} />
            Cadastrar primeira lição
          </button>
        </div>
      ) : (
        <div className="lessons-list">
          {filteredLessons.map((item) => (
            <article className="lesson-card" key={item.id}>
              <div className="lesson-card-head">
                <div className="lesson-project">
                  <strong>{projectCode(item.project_id)}</strong>
                  <span>{projectName(item.project_id)}</span>
                </div>

                <div className="lesson-meta">
                  {item.lesson_date && (
                    <span>
                      <CalendarDays size={14} />
                      {formatDate(item.lesson_date)}
                    </span>
                  )}

                  {item.phase && (
                    <span className="lesson-tag">
                      {item.phase}
                    </span>
                  )}

                  {item.category && (
                    <span className="lesson-tag">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="lesson-content">
                {item.situation && (
                  <div className="lesson-section">
                    <span>Situação</span>
                    <p>{item.situation}</p>
                  </div>
                )}

                <div className="lesson-section highlight">
                  <span>Lição aprendida</span>
                  <p>{item.lesson || "Não informada."}</p>
                </div>

                {item.improvement_action && (
                  <div className="lesson-section">
                    <span>Ação de melhoria</span>
                    <p>{item.improvement_action}</p>
                  </div>
                )}
              </div>

              <div className="lesson-card-footer">
                {item.applicable_to_future_projects ? (
                  <span className="lesson-applicable">
                    <CheckCircle2 size={14} />
                    Aplicável a futuros projetos
                  </span>
                ) : (
                  <span className="lesson-not-applicable">
                    Uso específico deste projeto
                  </span>
                )}

                <div className="lesson-actions">
                  <button
                    className="icon-btn"
                    type="button"
                    title="Editar"
                    onClick={() => openEdit(item)}
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    className="icon-btn danger"
                    type="button"
                    title="Excluir"
                    onClick={() => deleteLesson(item)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="modal lesson-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="eyebrow">KNOWLEDGE MANAGEMENT</div>
                <h3>
                  {editingLesson
                    ? "Editar lição aprendida"
                    : "Nova lição aprendida"}
                </h3>
              </div>

              <button
                className="icon-btn"
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <label>
                  <span>Projeto</span>

                  <select
                    value={form.project_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        project_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione o projeto</option>

                    {projects.map((project) => (
                      <option
                        key={project.id}
                        value={project.id}
                      >
                        {project.code} — {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Data</span>

                  <input
                    type="date"
                    value={form.lesson_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lesson_date: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Fase</span>

                  <select
                    value={form.phase}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phase: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione a fase</option>

                    {phases.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Categoria</span>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Selecione a categoria
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="form-full">
                <span>Situação</span>

                <textarea
                  rows={4}
                  placeholder="Descreva o contexto ou situação observada."
                  value={form.situation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      situation: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="form-full">
                <span>Lição aprendida *</span>

                <textarea
                  rows={5}
                  placeholder="O que foi aprendido com esta situação?"
                  value={form.lesson}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lesson: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="form-full">
                <span>Ação de melhoria</span>

                <textarea
                  rows={4}
                  placeholder="Que ação deve ser tomada para evitar ou repetir o resultado?"
                  value={form.improvement_action}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      improvement_action: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.applicable_to_future_projects}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      applicable_to_future_projects:
                        event.target.checked,
                    }))
                  }
                />

                <span>
                  Esta lição deve ser considerada em futuros
                  projetos SAP
                </span>
              </label>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                className="primary-btn"
                type="button"
                onClick={saveLesson}
                disabled={saving}
              >
                {saving
                  ? "Salvando..."
                  : editingLesson
                    ? "Salvar alterações"
                    : "Cadastrar lição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
