import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        entityType: dto.entityType,
        entityId: dto.entityId,
        isRead: false,
      },
    });

    return notification;
  }

  /**
   * Get user's notifications with filtering
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + notifications.length < total,
      },
    };
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      success: true,
      count: result.count,
    };
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  /**
   * Helper: Send task assigned notification
   */
  async notifyTaskAssigned(
    userId: string,
    taskTitle: string,
    taskId: string,
  ) {
    await this.createNotification({
      userId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned to: ${taskTitle}`,
      entityType: 'Task',
      entityId: taskId,
    });
  }

  /**
   * Helper: Send contribution submitted notification
   */
  async notifyContributionSubmitted(
    projectLeadUserId: string,
    memberName: string,
    taskTitle: string,
    taskId: string,
  ) {
    await this.createNotification({
      userId: projectLeadUserId,
      type: 'CONTRIBUTION_SUBMITTED',
      title: 'New Progress Update',
      message: `${memberName} submitted progress on: ${taskTitle}`,
      entityType: 'Task',
      entityId: taskId,
    });
  }

  /**
   * Helper: Send work approved notification
   */
  async notifyWorkApproved(
    userId: string,
    taskTitle: string,
    taskId: string,
  ) {
    await this.createNotification({
      userId,
      type: 'WORK_APPROVED',
      title: 'Work Approved',
      message: `Your progress on "${taskTitle}" has been approved`,
      entityType: 'Task',
      entityId: taskId,
    });
  }

  /**
   * Helper: Send changes requested notification
   */
  async notifyChangesRequested(
    userId: string,
    taskTitle: string,
    taskId: string,
    feedback: string,
  ) {
    await this.createNotification({
      userId,
      type: 'CHANGES_REQUESTED',
      title: 'Changes Requested',
      message: `Changes requested on "${taskTitle}": ${feedback}`,
      entityType: 'Task',
      entityId: taskId,
    });
  }

  /**
   * Helper: Send deadline approaching notification
   */
  async notifyDeadlineApproaching(
    userId: string,
    taskTitle: string,
    taskId: string,
    daysRemaining: number,
  ) {
    await this.createNotification({
      userId,
      type: 'DEADLINE_APPROACHING',
      title: 'Deadline Approaching',
      message: `Task "${taskTitle}" is due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
      entityType: 'Task',
      entityId: taskId,
    });
  }

  /**
   * Helper: Send task overdue notification
   */
  async notifyTaskOverdue(
    userId: string,
    taskTitle: string,
    taskId: string,
  ) {
    await this.createNotification({
      userId,
      type: 'TASK_OVERDUE',
      title: 'Task Overdue',
      message: `Task "${taskTitle}" is overdue`,
      entityType: 'Task',
      entityId: taskId,
    });
  }
}
