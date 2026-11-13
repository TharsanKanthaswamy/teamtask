import { AlertCircle, ArrowUp, Minus, Zap } from 'lucide-react';

interface TaskPriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function TaskPriorityBadge({ priority, size = 'sm', showIcon = true }: TaskPriorityBadgeProps) {
  const config = {
    CRITICAL: {
      style: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      label: 'Critical',
      icon: Zap,
    },
    HIGH: {
      style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      label: 'High',
      icon: ArrowUp,
    },
    MEDIUM: {
      style: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      label: 'Medium',
      icon: AlertCircle,
    },
    LOW: {
      style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      label: 'Low',
      icon: Minus,
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  };

  const current = config[priority as keyof typeof config] || config.MEDIUM;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium border ${current.style} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {current.label}
    </span>
  );
}
