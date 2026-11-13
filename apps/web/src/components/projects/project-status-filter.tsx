'use client';

interface ProjectStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProjectStatusFilter({ value, onChange }: ProjectStatusFilterProps) {
  const statuses = [
    { value: '', label: 'All Projects' },
    { value: 'PLANNING', label: 'Planning' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg border border-border bg-background-elevated text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
    >
      {statuses.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
}
