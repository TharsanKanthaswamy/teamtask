import { AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ProjectPriorityBadgeProps {
  priority: string;
}

export function ProjectPriorityBadge({ priority }: ProjectPriorityBadgeProps) {
  const config = {
    CRITICAL: {
      icon: AlertCircle,
      className: 'text-red-600 dark:text-red-400',
      label: 'Critical',
    },
    HIGH: {
      icon: ArrowUp,
      className: 'text-orange-600 dark:text-orange-400',
      label: 'High',
    },
    MEDIUM: {
      icon: Minus,
      className: 'text-blue-600 dark:text-blue-400',
      label: 'Medium',
    },
    LOW: {
      icon: ArrowDown,
      className: 'text-muted-foreground',
      label: 'Low',
    },
  };

  const { icon: Icon, className, label } = config[priority as keyof typeof config] || config.MEDIUM;

  return (
    <div className={`flex items-center gap-1 ${className}`} title={`${label} Priority`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}
