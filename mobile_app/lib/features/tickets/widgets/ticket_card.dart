import 'package:flutter/material.dart';

import '../../../core/animations/pressable.dart';
import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../shared/models/models.dart';
import 'ticket_badges.dart';

/// TicketCard displays a summary of a ticket in a list.
/// Theme-aware — adapts background, border, and text colors.
/// Includes press animation for tap feedback.
class TicketCard extends StatelessWidget {
  final Ticket ticket;
  final VoidCallback? onTap;

  const TicketCard({
    super.key,
    required this.ticket,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    return Pressable(
      onTap: onTap,
      child: Semantics(
        label: 'Ticket ${ticket.title}',
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: colors.cardBackground,
            border: Border.all(color: colors.borderColor, width: 1),
            borderRadius: BorderRadius.zero,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      ticket.title.toUpperCase(),
                      style: AppTypography.cardTitle.copyWith(
                        color: colors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  TicketStatusBadge(status: ticket.status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                ticket.description,
                style: AppTypography.bodySmall.copyWith(
                  color: colors.textMuted,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  if (ticket.agentId != null) ...[
                    Icon(
                      Icons.person,
                      size: 16,
                      color: colors.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Assigned',
                      style: AppTypography.badge.copyWith(
                        color: colors.textMuted,
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  TicketPriorityBadge(priority: ticket.priority),
                  const Spacer(),
                  Text(
                    _formatDate(ticket.createdAt),
                    style: AppTypography.badge.copyWith(
                      color: colors.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    }
    if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    }
    return '${date.month}/${date.day}/${date.year}';
  }
}
