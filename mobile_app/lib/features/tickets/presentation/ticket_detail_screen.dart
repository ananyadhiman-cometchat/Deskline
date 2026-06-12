import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/section_header.dart';
import '../../../shared/enums/enums.dart';
import '../providers/ticket_provider.dart';
import '../widgets/ai_response_panel.dart';
import '../widgets/assignment_card.dart';
import '../widgets/ticket_badges.dart';
import '../widgets/ticket_timeline.dart';
import '../../agent/providers/activity_log_provider.dart';

/// Ticket detail screen with structured sections matching web's layout:
/// - Ticket metadata (title, ID, badges)
/// - Status timeline
/// - Assignment card
/// - AI response panel (for information subtype)
/// - Action buttons
class TicketDetailScreen extends ConsumerWidget {
  final String ticketId;

  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final tickets = ref.watch(ticketListProvider);
    
    // Handle case where tickets haven't loaded yet or ID is invalid
    final ticketIndex = tickets.indexWhere((e) => e.id == ticketId);
    if (ticketIndex == -1) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: AppColors.primaryRed),
            const SizedBox(height: 16),
            Text('Loading ticket...', style: AppTypography.bodySmall.copyWith(color: colors.textMuted)),
          ],
        ),
      );
    }
    
    final ticket = tickets[ticketIndex];
    final logger = ref.read(activityLoggerProvider);

    return ListView(
      children: [
        const SizedBox(height: AppSpacing.lg),

        // ─── Header: Title + ID ───────────────────────────────
        Text(
          ticket.title.toUpperCase(),
          style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          '#${ticket.id.substring(0, 8).toUpperCase()}',
          style: AppTypography.ticketId.copyWith(color: colors.textMuted),
        ),
        const SizedBox(height: AppSpacing.md),

        // ─── Badges Row ───────────────────────────────────────
        Wrap(
          spacing: AppSpacing.xs,
          runSpacing: AppSpacing.xs,
          children: [
            TicketStatusBadge(status: ticket.status),
            TicketPriorityBadge(priority: ticket.priority),
            TicketSubtypeBadge(subtype: ticket.subType),
            TicketCategoryBadge(category: ticket.category),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),

        // ─── Description ──────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: colors.cardBackground,
            border: Border.all(color: colors.borderColor, width: 1),
          ),
          child: Text(
            ticket.description,
            style: AppTypography.bodySmall.copyWith(
              color: colors.textPrimary,
              height: 1.7,
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // ─── Status Timeline ──────────────────────────────────
        const SectionHeader(title: 'STATUS TIMELINE'),
        TicketTimeline(
          events: [
            TicketTimelineEvent(status: ticket.status, timestamp: ticket.updatedAt),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),

        // ─── Assignment ───────────────────────────────────────
        const SectionHeader(title: 'ASSIGNMENT'),
        const SizedBox(height: AppSpacing.sm),
        AssignmentCard(
          agentName: ticket.agentId ?? 'Unassigned',
          department: ticket.category.name,
        ),
        const SizedBox(height: AppSpacing.xl),

        // ─── AI Response (information subtype only) ───────────
        if (ticket.subType == TicketSubtype.information) ...[
          const SectionHeader(title: 'AI ASSISTANCE'),
          const SizedBox(height: AppSpacing.sm),
          const AIResponsePanel(
            aiResponse:
                'Based on our knowledge base, this request relates to standard IT provisioning. '
                'Please follow the onboarding checklist for device setup and network access.',
          ),
          const SizedBox(height: AppSpacing.xl),
        ],

        // ─── Actions ──────────────────────────────────────────
        const SectionHeader(title: 'ACTIONS'),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            Expanded(
              child: AppButton.primary(
                label: 'Update Status',
                onPressed: () {
                  logger.log('status_updated', ticketId);
                },
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: AppButton.secondary(
                label: 'Escalate',
                onPressed: () {
                  logger.log('escalated', ticketId);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }
}
