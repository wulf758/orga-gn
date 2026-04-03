"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { useAppData } from "@/components/app-data-provider";
import { CreatePanel } from "@/components/create-panel";
import { PageHero } from "@/components/page-hero";
import { StatusPill } from "@/components/status-pill";
import { TagBadge } from "@/components/tag-badge";
import { formatDateLabel, formatReminder } from "@/lib/date-utils";

export default function OrganizationCategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data, createDeadline, createTask, deleteCategory, updateCategory } = useAppData();
  const category = data.organizationCategories.find((entry) => entry.slug === params.slug);
  const [title, setTitle] = useState(category?.title ?? "");
  const [summary, setSummary] = useState(category?.summary ?? "");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskOwner, setTaskOwner] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskStatus, setTaskStatus] = useState<"En cours" | "Bloque" | "Planifie">("En cours");
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineStatus, setDeadlineStatus] = useState<"A venir" | "Cette semaine" | "Urgent">("A venir");

  if (!category) {
    return <div className="empty-state">Categorie organisation introuvable.</div>;
  }

  const currentCategory = category;
  const tasks = data.tasks
    .filter((task) => task.categorySlug === currentCategory.slug)
    .slice()
    .sort((left, right) => {
      if (!left.dueDate && !right.dueDate) return 0;
      if (!left.dueDate) return 1;
      if (!right.dueDate) return -1;
      return left.dueDate.localeCompare(right.dueDate);
    });
  const deadlines = data.deadlines
    .filter((deadline) => deadline.lane.toLowerCase() === currentCategory.title.toLowerCase())
    .slice()
    .sort((left, right) => {
      if (!left.dateISO && !right.dateISO) return 0;
      if (!left.dateISO) return 1;
      if (!right.dateISO) return -1;
      return left.dateISO.localeCompare(right.dateISO);
    });

  function handleCategorySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    updateCategory({ section: "organization", slug: currentCategory.slug, title: title.trim(), summary });
  }

  function handleCategoryDelete() {
    if (!window.confirm(`Supprimer la categorie "${currentCategory.title}" et ses taches ?`)) return;
    deleteCategory("organization", currentCategory.slug);
    router.push("/organization");
  }

  function handleTaskCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    createTask({
      title: taskTitle.trim(),
      categorySlug: currentCategory.slug,
      summary: taskTitle.trim(),
      owner: taskOwner.trim() || "A attribuer",
      dueDate: taskDue || undefined,
      status: taskStatus
    });
    setTaskTitle("");
    setTaskOwner("");
    setTaskDue("");
    setTaskStatus("En cours");
  }

  function handleDeadlineCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deadlineTitle.trim()) return;
    createDeadline({
      title: deadlineTitle.trim(),
      dateISO: deadlineDate || undefined,
      lane: currentCategory.title,
      status: deadlineStatus
    });
    setDeadlineTitle("");
    setDeadlineDate("");
    setDeadlineStatus("A venir");
  }

  return (
    <>
      <PageHero
        kicker="Categorie organisation"
        title={currentCategory.title}
        copy={currentCategory.summary}
        actions={
          <>
            <Link href="/organization" className="button-primary">Retour aux categories</Link>
            <button type="button" className="button-secondary" onClick={handleCategoryDelete}>
              Supprimer la categorie
            </button>
          </>
        }
        aside={
          <CreatePanel title="Modifier la categorie" description="Nom et description de l'espace de pilotage.">
            <form className="form-stack" onSubmit={handleCategorySave}>
              <div className="field">
                <label htmlFor="org-category-edit-title">Nom</label>
                <input id="org-category-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="org-category-edit-summary">Description</label>
                <textarea id="org-category-edit-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">Modifier la categorie</button>
              </div>
            </form>
          </CreatePanel>
        }
      />

      <section className="surface-grid">
        <div className="surface span-7">
          <div className="section-header">
            <div>
              <p className="section-kicker">Taches</p>
              <h2 className="section-title">Actions de la categorie</h2>
            </div>
          </div>
          <div className="list-stack">
            {tasks.map((task) => (
              <Link href={`/organization/task/${task.id}`} className="list-item" key={task.id}>
                <h3>{task.title}</h3>
                <p>{task.summary}</p>
                <div className="meta-line">
                  <span>{task.owner}</span>
                  <span>{formatDateLabel(task.dueDate, task.dueLabel)}</span>
                  <span>{formatReminder(task.dueDate)}</span>
                  <StatusPill tone={task.status === "Bloque" ? "warning" : undefined}>{task.status}</StatusPill>
                </div>
                <div className="badge-row" style={{ marginTop: 12 }}>
                  {task.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} definitions={data.tagsRegistry} />
                  ))}
                </div>
              </Link>
            ))}
            {!tasks.length ? <div className="empty-state">Aucune tache dans cette categorie.</div> : null}
          </div>
        </div>

        <div className="surface span-5">
          <div className="section-header">
            <div>
              <p className="section-kicker">Deadlines</p>
              <h2 className="section-title">Planning de la categorie</h2>
            </div>
          </div>
          <div className="list-stack">
            {deadlines.map((deadline) => (
              <article className="list-item" key={deadline.id}>
                <h3>{deadline.title}</h3>
                <div className="meta-line">
                  <span>{formatDateLabel(deadline.dateISO, deadline.dateLabel)}</span>
                  <span>{formatReminder(deadline.dateISO)}</span>
                  <StatusPill tone={deadline.status === "Urgent" ? "warning" : undefined}>{deadline.status}</StatusPill>
                </div>
              </article>
            ))}
            {!deadlines.length ? <div className="empty-state">Aucune deadline liee a cette categorie.</div> : null}
          </div>
        </div>

        <div className="surface span-6">
          <CreatePanel title="Creer une tache" description="Creation d'une action dans cette categorie.">
            <form className="form-stack" onSubmit={handleTaskCreate}>
              <div className="field">
                <label htmlFor="org-task-title">Titre</label>
                <input id="org-task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="org-task-owner">Responsable</label>
                <input id="org-task-owner" value={taskOwner} onChange={(e) => setTaskOwner(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="org-task-due">Echeance</label>
                <input id="org-task-due" type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="org-task-status">Statut</label>
                <select id="org-task-status" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as "En cours" | "Bloque" | "Planifie")}>
                  <option value="En cours">En cours</option>
                  <option value="Bloque">Bloque</option>
                  <option value="Planifie">Planifie</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">Ajouter la tache</button>
              </div>
            </form>
          </CreatePanel>
        </div>

        <div className="surface span-6">
          <CreatePanel title="Creer une deadline" description="Creation d'une echeance pour cette categorie.">
            <form className="form-stack" onSubmit={handleDeadlineCreate}>
              <div className="field">
                <label htmlFor="org-deadline-title">Titre</label>
                <input id="org-deadline-title" value={deadlineTitle} onChange={(e) => setDeadlineTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="org-deadline-date">Date</label>
                <input id="org-deadline-date" type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="org-deadline-status">Priorite</label>
                <select id="org-deadline-status" value={deadlineStatus} onChange={(e) => setDeadlineStatus(e.target.value as "A venir" | "Cette semaine" | "Urgent")}>
                  <option value="A venir">A venir</option>
                  <option value="Cette semaine">Cette semaine</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary">Ajouter la deadline</button>
              </div>
            </form>
          </CreatePanel>
        </div>
      </section>
    </>
  );
}
