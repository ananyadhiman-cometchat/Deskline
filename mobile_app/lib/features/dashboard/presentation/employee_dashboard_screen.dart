import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/empty_state.dart';
import '../../tickets/providers/ticket_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../tickets/widgets/ticket_card.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/services/refresh_service.dart';

/// Employee Dashboard Screen - Main interface for employees to manage tickets
class EmployeeDashboardScreen extends ConsumerStatefulWidget {
  const EmployeeDashboardScreen({super.key});

  @override
  ConsumerState<EmployeeDashboardScreen> createState() =>
      _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState
    extends ConsumerState<EmployeeDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    final tickets = ref.watch(ticketListProvider);
    ref.watch(notificationListProvider);
    final colors = DesklineColors.of(context);
    
    final openTickets = tickets
        .where((t) => t.status == TicketStatus.open)
        .take(3)
        .toList();
    final recentTickets = tickets
        .where((t) => t.status != TicketStatus.closed)
        .take(5)
        .toList();

    return RefreshIndicator(
      onRefresh: () => RefreshService.refreshAll(ref),
      child: ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'MY TICKETS',
            style: AppTypography.pageHeader.copyWith(
              color: colors.textPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Track and manage your support requests.',
            style: AppTypography.bodySmall.copyWith(
              color: colors.textMuted,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),

          // Raise Ticket CTA
          AppButton.primary(
            label: 'RAISE NEW TICKET',
            icon: Icons.add,
            onPressed: () {
              context.go('/employee/raise-ticket');
            },
          ),
          const SizedBox(height: AppSpacing.xl),

          // Active Tickets Section
          const SectionHeader(
            title: 'ACTIVE TICKETS',
          ),
          const SizedBox(height: AppSpacing.md),
          if (openTickets.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(
                vertical: AppSpacing.lg,
              ),
              child: EmptyState(
                message: 'No active tickets',
                icon: Icons.check_circle,
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: openTickets.length,
              separatorBuilder: (context, index) =>
                  const SizedBox(height: AppSpacing.md),
              itemBuilder: (context, index) {
                final ticket = openTickets[index];
                return TicketCard(
                  ticket: ticket,
                  onTap: () {
                    context.go('/tickets/${ticket.id}');
                  },
                );
              },
            ),
          const SizedBox(height: AppSpacing.xl),

          // Recent Activity Section
          const SectionHeader(
            title: 'RECENT ACTIVITY',
          ),
          const SizedBox(height: AppSpacing.md),
          if (recentTickets.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(
                vertical: AppSpacing.lg,
              ),
              child: EmptyState(
                message: 'No recent activity',
                icon: Icons.history,
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: recentTickets.length,
              separatorBuilder: (context, index) =>
                  const Divider(height: 1),
              itemBuilder: (context, index) {
                final ticket = recentTickets[index];
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: AppSpacing.sm,
                  ),
                  leading: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: colors.surface,
                      border: Border.all(
                        color: colors.borderColor,
                        width: 1,
                      ),
                    ),
                    child: Icon(
                      _getStatusIcon(ticket.status),
                      color: colors.textMuted,
                      size: 16,
                    ),
                  ),
                  title: Text(
                    ticket.title,
                    style: AppTypography.body.copyWith(
                      color: colors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    'Updated ${_formatDate(ticket.updatedAt)}',
                    style: AppTypography.body.copyWith(
                      color: colors.textMuted,
                      fontSize: 12,
                    ),
                  ),
                  onTap: () {
                    context.go('/tickets/${ticket.id}');
                  },
                );
              },
            ),
          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }

  IconData _getStatusIcon(TicketStatus status) {
    switch (status) {
      case TicketStatus.open:
        return Icons.circle_outlined;
      case TicketStatus.inProgress:
        return Icons.autorenew;
      case TicketStatus.escalated:
        return Icons.warning;
      case TicketStatus.resolved:
        return Icons.check_circle_outline;
      case TicketStatus.closed:
        return Icons.check_circle;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minutes ago';
    }
    return 'Just now';
  }
}