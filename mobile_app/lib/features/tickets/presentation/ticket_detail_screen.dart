import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/section_header.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/ticket_provider.dart';
import '../widgets/ai_response_panel.dart';
import '../widgets/ticket_badges.dart';
import '../widgets/ticket_timeline.dart';

class TicketDetailScreen extends ConsumerStatefulWidget {
  final String ticketId;

  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  ConsumerState<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends ConsumerState<TicketDetailScreen> {
  bool _isActioning = false;

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    final tickets = ref.watch(ticketListProvider);
    final authState = ref.watch(authStateProvider);
    final currentUser = authState.user;
    final userRole = currentUser?.role ?? UserRole.employee;

    final ticketIndex = tickets.indexWhere((e) => e.id == widget.ticketId);
    if (ticketIndex == -1) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: AppColors.primaryRed),
            const SizedBox(height: 16),
            Text('Loading ticket...',
                style:
                    AppTypography.bodySmall.copyWith(color: colors.textMuted)),
          ],
        ),
      );
    }

    final ticket = tickets[ticketIndex];

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.md),
      children: [
        // ─── Header ─────────────────────────────────────────
        Text(
          ticket.title.toUpperCase(),
          style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          '#${ticket.id.length > 8 ? ticket.id.substring(0, 8).toUpperCase() : ticket.id.toUpperCase()}',
          style: AppTypography.ticketId.copyWith(color: colors.textMuted),
        ),
        const SizedBox(height: AppSpacing.md),

        // ─── Badges ─────────────────────────────────────────
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

        // ─── Description ────────────────────────────────────
        const SectionHeader(title: 'DESCRIPTION'),
        const SizedBox(height: AppSpacing.sm),
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: colors.cardBackground,
            border: Border.all(color: colors.borderColor, width: 1),
          ),
          child: Text(
            ticket.description,
            style: AppTypography.bodySmall
                .copyWith(color: colors.textPrimary, height: 1.7),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // ─── People Involved ────────────────────────────────
        const SectionHeader(title: 'PEOPLE INVOLVED'),
        const SizedBox(height: AppSpacing.sm),
        _buildPeopleSection(ticket, colors),
        const SizedBox(height: AppSpacing.xl),

        // ─── Status Timeline ────────────────────────────────
        const SectionHeader(title: 'STATUS TIMELINE'),
        TicketTimeline(
          events: [
            TicketTimelineEvent(
                status: TicketStatus.open, timestamp: ticket.createdAt),
            if (ticket.status != TicketStatus.open)
              TicketTimelineEvent(
                  status: ticket.status, timestamp: ticket.updatedAt),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),

        // ─── AI Response (information subtype) ──────────────
        if (ticket.subType == TicketSubtype.information) ...[
          const SectionHeader(title: 'AI ASSISTANCE'),
          const SizedBox(height: AppSpacing.sm),
          const AIResponsePanel(
            aiResponse:
                'Based on our knowledge base, this request relates to standard IT provisioning. '
                'Please follow the onboarding checklist for device setup and network access.',
          ),
          const SizedBox(height: AppSpacing.sm),
          // Request Human Help button for employees on information tickets
          if (userRole == UserRole.employee &&
              ticket.status != TicketStatus.closed &&
              ticket.status != TicketStatus.resolved) ...[
            AppButton.secondary(
              label: 'Request Human Assistance',
              onPressed: _isActioning ? null : () => _requestHumanHelp(ticket),
            ),
          ],
          const SizedBox(height: AppSpacing.xl),
        ],

        // ─── Communication Thread ───────────────────────────
        const SectionHeader(title: 'COMMUNICATION'),
        const SizedBox(height: AppSpacing.sm),
        _buildCommunicationPlaceholder(colors),
        const SizedBox(height: AppSpacing.xl),

        // ─── Actions (role-based) ───────────────────────────
        ..._buildActions(ticket, userRole, colors),

        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }

  Widget _buildPeopleSection(Ticket ticket, DesklineColors colors) {
    final employeeName = ticket.employee?.name ?? 'Employee';
    final employeeDept = ticket.employee?.department.name.toUpperCase() ?? '';
    final agentName = ticket.agent?.name;
    final agentDept = ticket.agent?.department.name.toUpperCase() ?? '';

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
      ),
      child: Column(
        children: [
          _personRow(
            icon: Icons.person_outline,
            label: 'REQUESTER',
            value: employeeName,
            subtitle: employeeDept,
            colors: colors,
          ),
          const SizedBox(height: AppSpacing.sm),
          Divider(height: 1, color: colors.borderColor),
          const SizedBox(height: AppSpacing.sm),
          _personRow(
            icon: Icons.support_agent,
            label: 'ASSIGNED AGENT',
            value: agentName ?? 'Unassigned',
            subtitle: agentName != null ? agentDept : '',
            colors: colors,
          ),
        ],
      ),
    );
  }

  Widget _personRow({
    required IconData icon,
    required String label,
    required String value,
    required DesklineColors colors,
    String subtitle = '',
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: colors.textMuted),
        const SizedBox(width: AppSpacing.sm),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: AppTypography.badge.copyWith(color: colors.textMuted)),
            Text(value,
                style: AppTypography.bodySmall
                    .copyWith(color: colors.textPrimary)),
            if (subtitle.isNotEmpty)
              Text(subtitle,
                  style:
                      AppTypography.caption.copyWith(color: colors.textMuted)),
          ],
        ),
      ],
    );
  }

  Widget _buildCommunicationPlaceholder(DesklineColors colors) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
      ),
      child: Column(
        children: [
          Icon(Icons.chat_bubble_outline, size: 32, color: colors.textMuted),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Communication thread',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Comments and updates will appear here.',
            style: AppTypography.caption.copyWith(color: colors.textMuted),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  /// Build action buttons based on user role and ticket status.
  List<Widget> _buildActions(
      Ticket ticket, UserRole role, DesklineColors colors) {
    final actions = <Widget>[];

    // Don't show actions for closed tickets
    if (ticket.status == TicketStatus.closed) return actions;

    actions.add(const SectionHeader(title: 'ACTIONS'));
    actions.add(const SizedBox(height: AppSpacing.sm));

    // Status update — only valid transitions
    final validStatuses = _getValidTransitions(ticket.status, role);
    if (validStatuses.isNotEmpty) {
      actions.add(
        AppButton.primary(
          label: 'Update Status',
          onPressed:
              _isActioning ? null : () => _showStatusUpdateSheet(ticket, validStatuses),
        ),
      );
      actions.add(const SizedBox(height: AppSpacing.sm));
    }

    // Escalate — agents and supervisors only, not on already escalated/resolved/closed
    if ((role == UserRole.agent ||
            role == UserRole.supervisor ||
            role == UserRole.admin) &&
        ticket.status != TicketStatus.escalated &&
        ticket.status != TicketStatus.resolved &&
        ticket.status != TicketStatus.closed) {
      actions.add(
        AppButton.secondary(
          label: 'Escalate',
          onPressed: _isActioning ? null : () => _escalateTicket(ticket),
        ),
      );
      actions.add(const SizedBox(height: AppSpacing.sm));
    }

    // Confirm/Reject resolution — employee only when resolved
    if (role == UserRole.employee && ticket.status == TicketStatus.resolved) {
      actions.add(
        Row(
          children: [
            Expanded(
              child: AppButton.primary(
                label: 'Confirm Resolution',
                onPressed:
                    _isActioning ? null : () => _confirmResolution(ticket),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: AppButton.secondary(
                label: 'Reject',
                onPressed:
                    _isActioning ? null : () => _rejectResolution(ticket),
              ),
            ),
          ],
        ),
      );
      actions.add(const SizedBox(height: AppSpacing.sm));
    }

    return actions;
  }

  /// Valid status transitions based on role and current status
  List<TicketStatus> _getValidTransitions(TicketStatus current, UserRole role) {
    switch (current) {
      case TicketStatus.open:
        if (role == UserRole.agent ||
            role == UserRole.supervisor ||
            role == UserRole.admin) {
          return [TicketStatus.inProgress];
        }
        return [];
      case TicketStatus.inProgress:
        if (role == UserRole.agent ||
            role == UserRole.supervisor ||
            role == UserRole.admin) {
          return [TicketStatus.resolved, TicketStatus.escalated];
        }
        return [];
      case TicketStatus.escalated:
        if (role == UserRole.supervisor || role == UserRole.admin) {
          return [TicketStatus.resolved];
        }
        return [];
      case TicketStatus.resolved:
        // Employee can confirm (moves to closed) — handled separately
        if (role == UserRole.admin) {
          return [TicketStatus.closed];
        }
        return [];
      case TicketStatus.closed:
        return [];
    }
  }

  void _showStatusUpdateSheet(Ticket ticket, List<TicketStatus> validStatuses) {
    final colors = DesklineColors.of(context);
    TicketStatus? selected;

    showModalBottomSheet(
      context: context,
      backgroundColor: colors.cardBackground,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Text(
                      'UPDATE STATUS',
                      style: AppTypography.sectionLabel
                          .copyWith(color: colors.textPrimary),
                    ),
                  ),
                  Divider(height: 1, color: colors.borderColor),
                  ...validStatuses.map((s) => GestureDetector(
                        onTap: () => setSheetState(() => selected = s),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.md, vertical: 14),
                          decoration: BoxDecoration(
                            color: selected == s
                                ? AppColors.primaryRed.withValues(alpha: 0.1)
                                : null,
                            border: Border(
                                bottom: BorderSide(
                                    color: colors.borderColor, width: 1)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _statusLabel(s),
                                  style:
                                      AppTypography.navigationLabel.copyWith(
                                    color: selected == s
                                        ? AppColors.primaryRed
                                        : colors.textPrimary,
                                  ),
                                ),
                              ),
                              if (selected == s)
                                const Icon(Icons.check,
                                    color: AppColors.primaryRed, size: 18),
                            ],
                          ),
                        ),
                      )),
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: AppButton.primary(
                      label: 'CONFIRM',
                      onPressed: selected == null
                          ? null
                          : () {
                              Navigator.pop(ctx);
                              _updateStatus(ticket, selected!);
                            },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _updateStatus(Ticket ticket, TicketStatus newStatus) async {
    setState(() => _isActioning = true);
    try {
      await ref.read(ticketRepositoryProvider).updateTicketStatus(
            id: widget.ticketId,
            status: newStatus,
          );
      ref.invalidate(defaultTicketsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status updated to ${_statusLabel(newStatus)}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  Future<void> _escalateTicket(Ticket ticket) async {
    setState(() => _isActioning = true);
    try {
      await ref.read(ticketRepositoryProvider).escalateTicket(widget.ticketId);
      ref.invalidate(defaultTicketsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('Ticket escalated to supervisor successfully.')),
        );
        // Navigate back since ticket is no longer in agent's queue
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to escalate: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  Future<void> _requestHumanHelp(Ticket ticket) async {
    setState(() => _isActioning = true);
    try {
      await ref
          .read(ticketRepositoryProvider)
          .requestHumanHelp(widget.ticketId);
      ref.invalidate(defaultTicketsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text(
                  'Human assistance requested. An agent will be assigned shortly.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  Future<void> _confirmResolution(Ticket ticket) async {
    setState(() => _isActioning = true);
    try {
      await ref
          .read(ticketRepositoryProvider)
          .confirmResolution(widget.ticketId);
      ref.invalidate(defaultTicketsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Resolution confirmed. Ticket closed.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  Future<void> _rejectResolution(Ticket ticket) async {
    setState(() => _isActioning = true);
    try {
      await ref
          .read(ticketRepositoryProvider)
          .rejectResolution(widget.ticketId);
      ref.invalidate(defaultTicketsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Resolution rejected. Ticket reopened.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isActioning = false);
    }
  }

  String _statusLabel(TicketStatus status) {
    switch (status) {
      case TicketStatus.open:
        return 'OPEN';
      case TicketStatus.inProgress:
        return 'IN PROGRESS';
      case TicketStatus.escalated:
        return 'ESCALATED';
      case TicketStatus.resolved:
        return 'RESOLVED';
      case TicketStatus.closed:
        return 'CLOSED';
    }
  }
}
