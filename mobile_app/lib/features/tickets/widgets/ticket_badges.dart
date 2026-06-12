import 'package:flutter/material.dart';

import '../../../core/animations/pulse_animation.dart';
import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/typography.dart';
import '../../../shared/enums/enums.dart';

/// TicketStatusBadge displays the ticket status with solid vivid colors.
/// Colors match the web's .badge-{status} classes — white text on solid bg.
/// These are theme-invariant (same vivid colors on light and dark).
/// The escalated badge pulses (matching web's `badge-pulse` animation).
class TicketStatusBadge extends StatelessWidget {
  final TicketStatus status;

  const TicketStatusBadge({
    super.key,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final badge = StatusBadge(
      label: _statusLabel(status),
      backgroundColor: _statusColor(status),
      textColor: AppColors.white,
    );

    // Escalated badge gets a pulsing glow
    if (status == TicketStatus.escalated) {
      return PulseAnimation(
        pulseColor: AppColors.statusEscalated,
        child: badge,
      );
    }

    return badge;
  }

  static Color _statusColor(TicketStatus status) {
    switch (status) {
      case TicketStatus.open:
        return AppColors.statusOpen;
      case TicketStatus.inProgress:
        return AppColors.statusInProgress;
      case TicketStatus.escalated:
        return AppColors.statusEscalated;
      case TicketStatus.resolved:
        return AppColors.statusResolved;
      case TicketStatus.closed:
        return AppColors.statusClosed;
    }
  }

  static String _statusLabel(TicketStatus status) {
    switch (status) {
      case TicketStatus.open:
        return 'Open';
      case TicketStatus.inProgress:
        return 'In Progress';
      case TicketStatus.escalated:
        return 'Escalated';
      case TicketStatus.resolved:
        return 'Resolved';
      case TicketStatus.closed:
        return 'Closed';
    }
  }
}

/// TicketPriorityBadge displays the ticket priority with solid vivid colors.
class TicketPriorityBadge extends StatelessWidget {
  final TicketPriority priority;

  const TicketPriorityBadge({
    super.key,
    required this.priority,
  });

  @override
  Widget build(BuildContext context) {
    return StatusBadge(
      label: priority.name,
      backgroundColor: _priorityColor(priority),
      textColor: AppColors.white,
    );
  }

  static Color _priorityColor(TicketPriority priority) {
    switch (priority) {
      case TicketPriority.low:
        return AppColors.priorityLow;
      case TicketPriority.medium:
        return AppColors.priorityMedium;
      case TicketPriority.high:
        return AppColors.priorityHigh;
    }
  }
}

/// CategoryBadge displays the ticket category.
/// Theme-aware — uses surface background that adapts to dark mode.
class TicketCategoryBadge extends StatelessWidget {
  final TicketCategory category;

  const TicketCategoryBadge({
    super.key,
    required this.category,
  });

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    return StatusBadge(
      label: category.name,
      backgroundColor: colors.surface,
      textColor: colors.textPrimary,
      hasBorder: true,
      borderColor: colors.borderColor,
    );
  }
}

/// SubtypeBadge displays the ticket subtype with solid vivid colors.
class TicketSubtypeBadge extends StatelessWidget {
  final TicketSubtype subtype;

  const TicketSubtypeBadge({
    super.key,
    required this.subtype,
  });

  @override
  Widget build(BuildContext context) {
    return StatusBadge(
      label: _subtypeLabel(subtype),
      backgroundColor: _subtypeColor(subtype),
      textColor: AppColors.white,
    );
  }

  static Color _subtypeColor(TicketSubtype subtype) {
    switch (subtype) {
      case TicketSubtype.information:
        return AppColors.subtypeInformation;
      case TicketSubtype.action:
        return AppColors.subtypeAction;
      case TicketSubtype.conversation:
        return AppColors.subtypeConversation;
      case TicketSubtype.escalation:
        return AppColors.subtypeEscalation;
    }
  }

  static String _subtypeLabel(TicketSubtype subtype) {
    switch (subtype) {
      case TicketSubtype.information:
        return 'Information';
      case TicketSubtype.action:
        return 'Action';
      case TicketSubtype.conversation:
        return 'Conversation';
      case TicketSubtype.escalation:
        return 'Escalation';
    }
  }
}

/// Core badge component with solid background.
/// Matches web's .badge styling: 11px, 700 weight, 0.1em tracking,
/// uppercase, 2px border-radius, 1.5px border.
class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final bool hasBorder;
  final Color? borderColor;

  const StatusBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    this.hasBorder = false,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(2),
        border: hasBorder
            ? Border.all(color: borderColor ?? backgroundColor, width: 1.5)
            : Border.all(color: Colors.transparent, width: 1.5),
      ),
      child: Text(
        label.toUpperCase(),
        style: AppTypography.badge.copyWith(color: textColor),
      ),
    );
  }
}
