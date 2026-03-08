'use client';

interface Props {
  percent: number;
  completedCount: number;
  totalCount: number;
  deadline?: string;
}

const STATUS_COLORS = {
  completed: '#0ba360',
  inProgress: '#f0a500',
  starting: '#00f2fe',
};

export default function ProgressBar({ percent, completedCount, totalCount, deadline }: Props) {
  const color =
    percent === 100
      ? STATUS_COLORS.completed
      : percent > 50
      ? STATUS_COLORS.inProgress
      : STATUS_COLORS.starting;

  const gradientFrom = percent === 100 ? '#0ba360' : '#00f2fe';
  const gradientTo = percent === 100 ? '#3cba92' : '#4facfe';

  return (
    <div className="war-room-progress-strip">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Mission Progress
        </span>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{percent}%</span>
      </div>

      <div className="war-room-progress-bar-bg">
        <div
          className="war-room-progress-bar-fill"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.75rem', opacity: 0.5 }}>
        <span>{completedCount} of {totalCount} milestones cleared</span>
        <span>Deadline: {deadline || 'N/A'}</span>
      </div>
    </div>
  );
}
