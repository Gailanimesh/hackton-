'use client';

import { useState } from 'react';
import type { Project } from '@/types/project';
import ConfigModal from './ConfigModal';

interface Props {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const techList = project.required_technologies
    ? project.required_technologies.split(',').map((t) => t.trim())
    : [];

  const handleCardClick = async () => {
    if (subtasks.length > 0) {
      setSubtasks([]);
      return;
    }
    setLoadingTasks(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/generate-subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, project_name: project.project_name }),
      });
      const data = await res.json();
      setSubtasks(data.tasks?.map((t: { task_name: string }) => t.task_name) || []);
    } catch {
      setSubtasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  return (
    <>
      <div
        className="project-card"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="card-body" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
          <h3>{project.project_name}</h3>
          <p>{project.description || 'No description provided.'}</p>
          <div className="tech-badges">
            {techList.map((tech) => (
              <span key={tech} className="badge">{tech}</span>
            ))}
          </div>

          {loadingTasks && (
            <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.75rem' }}>
              Loading subtasks...
            </div>
          )}

          {subtasks.length > 0 && (
            <div id="subtasks-container" style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 600 }}>SUBTASKS</div>
              {subtasks.map((task, i) => (
                <div key={i} className="subtask-item">
                  <div className="subtask-dot" />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-footer">
          <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
            Status: {project.status || 'Planning'}
          </span>
          <button
            className="configure-btn"
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          >
            CONFIGURE &amp; MATCH ✨
          </button>
        </div>
      </div>

      {showModal && (
        <ConfigModal
          projectId={project.id}
          projectName={project.project_name}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
