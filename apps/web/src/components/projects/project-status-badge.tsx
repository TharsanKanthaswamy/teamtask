interface ProjectStatusBadgeProps {
  status: string;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const styles = {
    PLANNING: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    ACTIVE: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    ON_HOLD: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    COMPLETED: 'bg-primary/10 text-primary border-primary/20',
    CANCELLED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    ARCHIVED: 'bg-muted text-muted-foreground border-border',
  };

  const labels = {
    PLANNING: 'Planning',
    ACTIVE: 'Active',
    ON_HOLD: 'On Hold',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ARCHIVED: 'Archived',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
        styles[status as keyof typeof styles] || styles.PLANNING
      }`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
