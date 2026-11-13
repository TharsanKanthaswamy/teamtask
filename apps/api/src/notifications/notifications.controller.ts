import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @CurrentUser() user: any,
  ) {
    const result = await this.notificationsService.getUserNotifications(
      user.userId,
      unreadOnly,
      Math.min(limit, 100), // Cap at 100
      offset,
    );

    return {
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.userId);

    return {
      success: true,
      data: { count },
    };
  }

  @Patch(':notificationId/read')
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: any,
  ) {
    const notification = await this.notificationsService.markAsRead(
      user.userId,
      notificationId,
    );

    return {
      success: true,
      data: notification,
    };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    const result = await this.notificationsService.markAllAsRead(user.userId);

    return result;
  }

  @Delete(':notificationId')
  async deleteNotification(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.notificationsService.deleteNotification(
      user.userId,
      notificationId,
    );

    return result;
  }
}
