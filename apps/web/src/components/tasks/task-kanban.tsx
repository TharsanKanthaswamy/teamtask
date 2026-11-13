'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreVertical, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { TaskPriorityBadge } from './task-priority-badge';
import { CreateTaskDialog } from './create-task-dialog';
import { TaskDetailDialog } from './task-detail-dialog';

interface TaskKanbanProps {
  teamId: string;
  projectId: string;
}

const COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog', color: 'bg-slate-500' },
  { id: 'TODO', label: 'To Do', color: 'bg-blue-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-purple-500' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-500' },
  { id: 'COMPLETED', label: 'Completed', color: 'bg-green-500' },
];

export function TaskKanban({ teamId, projectId }: TaskKanbanProps) {
  const queryClient = useQueryClient();
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: tasksData, isLoading } = useQuery<any>({
    queryKey: ['tasks', teamId, projectId],
    queryFn: () => api.tasks.list(teamId, projectId),
  });

  const { data: milestonesData } = useQuery<any>({
    queryKey: ['milestones', teamId, projectId],
    queryFn: () => api.milestones.list(teamId, projectId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.tasks.updateStatus(teamId, projectId, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', teamId, projectId] });
    },
  });

  const tasks = tasksData?.data || [];

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task: any) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (draggedTask && draggedTask.status !== newStatus) {
      updateStatusMutation.mutate({
        taskId: draggedTask.id,
        status: newStatus,
      });
    }

    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return { formatted, isOverdue };
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Task Board</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop tasks between columns to update their status
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="button-press gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isDraggedOver = draggedOverColumn === column.id;

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <GlassCard
                variant="elevated"
                className={`h-full transition-all duration-200 ${
                  isDraggedOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${column.color}`} />
                      <h4 className="font-semibold text-foreground">{column.label}</h4>
                    </div>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-3 space-y-2 min-h-[200px]">
                  {columnTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task: any) => {
                      const dueDate = formatDueDate(task.dueDate);
                      const isDragging = draggedTask?.id === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`group cursor-pointer transition-all duration-200 ${
                            isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
                          }`}
                        >
                          <GlassCard className="p-3 hover:shadow-lg transition-shadow">
                            {/* Task Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h5 className="font-medium text-sm line-clamp-2 flex-1">
                                {task.title}
                              </h5>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </div>

                            {/* Task Description */}
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                {task.description}
                              </p>
                            )}

                            {/* Task Meta */}
                            <div className="flex items-center justify-between gap-2">
                              <TaskPriorityBadge priority={task.priority} size="sm" showIcon={false} />

                              {dueDate && (
                                <div
                                  className={`flex items-center gap-1 text-xs ${
                                    dueDate.isOverdue
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {dueDate.isOverdue && <AlertCircle className="h-3 w-3" />}
                                  <Clock className="h-3 w-3" />
                                  <span>{dueDate.formatted}</span>
                                </div>
                              )}
                            </div>

                            {/* Assignees */}
                            {task.assignees && task.assignees.length > 0 && (
                              <div className="flex items-center -space-x-2 mt-3">
                                {task.assignees.slice(0, 3).map((assignee: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium"
                                    title={assignee.name}
                                  >
                                    {assignee.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                ))}
                                {task.assignees.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Progress Bar */}
                            {task.approvedProgress > 0 && (
                              <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{task.approvedProgress}%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${task.approvedProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </GlassCard>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlassCard>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {tasks.length > 0 && (
        <GlassCard variant="elevated" className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-semibold">{tasks.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-2xl font-semibold">
                {tasks.filter((t: any) => t.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {tasks.filter((t: any) => t.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {
                  tasks.filter(
                    (t: any) =>
                      t.dueDate &&
                      new Date(t.dueDate) < new Date() &&
                      !['COMPLETED', 'CANCELLED'].includes(t.status)
                  ).length
                }
              </p>
            </div>
          </div>
        </GlassCard>
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
