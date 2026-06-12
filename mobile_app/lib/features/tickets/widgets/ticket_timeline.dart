import 'package:flutter/material.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../shared/enums/enums.dart';

/// Horizontal ticket status timeline matching the web's `.timeline` component.
///
/// Square dots (0px radius), 2px connectors, color-coded states:
/// - Done: green fill + green border
/// - Active: red fill + red border
/// - Pending: border only (no fill)
class TicketTimeline extends StatelessWidget {
  final List<TicketTimelineEvent> events;

  const TicketTimeline({
    super.key,
    required this.events,
  });

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    final currentStatus = events.isNotEmpty ? events.last.status : TicketStatus.open;

    final steps = _buildSteps(currentStatus);
    final activeIndex = steps.indexWhere((s) => s.status == currentStatus);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Connector line
            final stepIndex = index ~/ 2;
            final isDone = stepIndex < activeIndex;
            return Expanded(
              child: Container(
                height: 2,
                margin: const EdgeInsets.only(bottom: 20),
                color: isDone
                    ? AppColors.successGreen
                    : colors.borderColor,
              ),
            );
          }

          // Step node
          final stepIndex = index ~/ 2;
          final step = steps[stepIndex];
          final isDone = stepIndex < activeIndex;
          final isActive = stepIndex == activeIndex;

          return _TimelineNode(
            label: step.label,
            isDone: isDone,
            isActive: isActive,
            isEscalated: step.status == TicketStatus.escalated && isActive,
            colors: colors,
          );
        }),
      ),
    );
  }

  List<_TimelineStep> _buildSteps(TicketStatus currentStatus) {
    final steps = <_TimelineStep>[
      const _TimelineStep(status: TicketStatus.open, label: 'Open'),
      const _TimelineStep(status: TicketStatus.inProgress, label: 'In Progress'),
      const _TimelineStep(status: TicketStatus.resolved, label: 'Resolved'),
      const _TimelineStep(status: TicketStatus.closed, label: 'Closed'),
    ];

    // If escalated, replace in_progress with escalated
    if (currentStatus == TicketStatus.escalated) {
      steps[1] = const _TimelineStep(status: TicketStatus.escalated, label: 'Escalated');
    }

    return steps;
  }
}

class _TimelineNode extends StatelessWidget {
  final String label;
  final bool isDone;
  final bool isActive;
  final bool isEscalated;
  final DesklineColors colors;

  const _TimelineNode({
    required this.label,
    required this.isDone,
    required this.isActive,
    required this.isEscalated,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    Color dotColor;
    Color dotBorderColor;
    Color labelColor;

    if (isDone) {
      dotColor = AppColors.successGreen;
      dotBorderColor = AppColors.successGreen;
      labelColor = AppColors.successGreen;
    } else if (isActive) {
      dotColor = isEscalated ? AppColors.primaryRed : AppColors.primaryRed;
      dotBorderColor = dotColor;
      labelColor = dotColor;
    } else {
      dotColor = Colors.transparent;
      dotBorderColor = colors.borderColor;
      labelColor = colors.textMuted;
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Square dot (matching web's 0px border-radius timeline-dot)
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: dotColor,
            border: Border.all(color: dotBorderColor, width: 2),
            borderRadius: BorderRadius.zero,
          ),
          child: isDone
              ? const Icon(Icons.check, size: 8, color: Colors.white)
              : null,
        ),
        const SizedBox(height: 6),
        // Label
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.0,
            color: labelColor,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _TimelineStep {
  final TicketStatus status;
  final String label;

  const _TimelineStep({required this.status, required this.label});
}

class TicketTimelineEvent {
  final TicketStatus status;
  final DateTime timestamp;
  final String? actionBy;

  const TicketTimelineEvent({
    required this.status,
    required this.timestamp,
    this.actionBy,
  });
}
