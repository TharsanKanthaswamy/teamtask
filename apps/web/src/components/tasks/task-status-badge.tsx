interface TaskStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function TaskStatusBadge({ status, size = 'sm' }: TaskStatusBadgeProps) {
  const styles = {
    BACKLOG: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    TODO: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    IN_PROGRESS: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    IN_REVIEW: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    CHANGES_REQUESTED: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    BLOCKED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    COMPLETED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    CANCELLED: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  };

  const labels = {
    BACKLOG: 'Backlog',
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    CHANGES_REQUESTED: 'Changes Requested',
    BLOCKED: 'Blocked',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium border ${
        styles[status as keyof typeof styles] || styles.BACKLOG
      } ${sizeClasses[size]}`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
