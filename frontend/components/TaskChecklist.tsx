'use client';

import { useState } from 'react';
import { useToast } from './ToastNotification';
import { updateTaskStatus } from '@/lib/api';
import type { Task } from '@/types/task';

interface Props {
  tasks: Task[];
  projectId: string;
  onTaskToggled: () => void;
  userRole: 'manager' | 'vendor';
}

export default function TaskChecklist({ tasks, projectId, onTaskToggled, userRole }: Props) {
  const { showToast } = useToast();
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (task: Task) => {
    setToggling(task.id);
    try {
      await updateTaskStatus(task.id, !task.is_completed);
      onTaskToggled();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update task', 'error');
    } finally {
      setToggling(null);
    }
  };

  if (tasks.length === 0) {
    return <div style={{ opacity: 0.5, fontStyle: 'italic', padding: '1rem' }}>Generating milestones...</div>;
  }

  return (
    <div className="task-list">
      {tasks.map((task, i) => {
        const isPreviousCompleted = i === 0 || tasks[i - 1].is_completed;
        const isDisabledForVendor = !isPreviousCompleted && !task.is_completed;

        return (
        <div
          key={task.id}
          className={`task-item ${task.is_completed ? 'task-done' : ''}`}
          onClick={() => {
            if (userRole === 'manager') {
              showToast('Only the Vendor can check off milestones.', 'error');
              return;
            }
            if (isDisabledForVendor) {
              showToast('Please complete previous milestones first!', 'error');
              return;
            }
            if (!toggling) handleToggle(task);
          }}
          style={{ 
            opacity: toggling === task.id || (userRole === 'vendor' && isDisabledForVendor) ? 0.6 : 1, 
            cursor: userRole === 'manager' || (userRole === 'vendor' && isDisabledForVendor) ? 'not-allowed' : 'pointer',
            pointerEvents: userRole === 'manager' ? 'auto' : 'auto' 
          }}
        >
          <div className="task-num">{i + 1}</div>
          <div className="task-check-icon">
            {task.is_completed ? '✅' : <div className="task-empty-check" />}
          </div>
          <div className="task-text">{task.task_name}</div>
        </div>
        );
      })}
    </div>
  );
}
