'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Plus, Search, Filter, ArrowUpDown, Trash2, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import { CreateTaskDialog } from './create-task-dialog';
import { TaskDetailDialog } from './task-detail-dialog';

interface TaskListProps {
  teamId: string;
  projectId: string;
}

export function TaskList({ teamId, projectId }: TaskListProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'title' | 'priority' | 'status' | 'dueDate'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasksData, isLoading } = useQuery<any>({
    queryKey: ['tasks', teamId, projectId, statusFilter, priorityFilter, searchQuery],
    queryFn: () => api.tasks.list(teamId, projectId, {
      status: statusFilter,
      priority: priorityFilter,
      search: searchQuery,
    }),
  });

  const { data: milestonesData } = useQuery<any>({
    queryKey: ['milestones', teamId, projectId],
    queryFn: () => api.milestones.list(teamId, projectId),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.tasks.delete(teamId, projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', teamId, projectId] });
    },
  });

  const tasks = tasksData?.data || [];

  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority': {
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) -
                     (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
        break;
      }
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'dueDate': {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comparison = dateA - dateB;
        break;
      }
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
      <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
        {formatted}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="BACKLOG">Backlog</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)} className="button-press gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Task Table */}
      <GlassCard variant="elevated">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No tasks found</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="ghost" className="button-press gap-2">
              <Plus className="h-4 w-4" />
              Create your first task
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      Task
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="p-4 font-medium">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      Status
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="p-4 font-medium">
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      Priority
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="p-4 font-medium">Assignees</th>
                  <th className="p-4 font-medium">
                    <button
                      onClick={() => handleSort('dueDate')}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      Due Date
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="p-4 font-medium">Progress</th>
                  <th className="p-4 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedTasks.map((task: any) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="hover:bg-muted/50 transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-foreground mb-1">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="p-4">
                      <TaskPriorityBadge priority={task.priority} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center -space-x-2">
                        {task.assignees?.slice(0, 3).map((assignee: any, idx: number) => (
                          <div
                            key={idx}
                            className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium"
                            title={assignee.name}
                          >
                            {assignee.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        ))}
                        {(task.assignees?.length || 0) > 3 && (
                          <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                            +{task.assignees.length - 3}
                          </div>
                        )}
                        {(!task.assignees || task.assignees.length === 0) && (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${task.approvedProgress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                          {task.approvedProgress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Summary Stats */}
      {sortedTasks.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <div>
            Showing {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
          </div>
          <div className="flex items-center gap-4">
            <span>
              {sortedTasks.filter((t: any) => t.status === 'COMPLETED').length} completed
            </span>
            <span>
              {sortedTasks.filter((t: any) => t.status === 'IN_PROGRESS').length} in progress
            </span>
            <span>
              {sortedTasks.filter((t: any) =>
                t.dueDate && new Date(t.dueDate) < new Date() &&
                !['COMPLETED', 'CANCELLED'].includes(t.status)
              ).length} overdue
            </span>
          </div>
        </div>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks', teamId, projectId] });
          setIsCreateDialogOpen(false);
        }}
        teamId={teamId}
        projectId={projectId}
        milestones={milestonesData?.data || []}
      />

      {/* Task Detail Dialog */}
      {selectedTaskId && (
        <TaskDetailDialog
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          teamId={teamId}
          projectId={projectId}
          taskId={selectedTaskId}
        />
      )}
    </div>
  );
}
