import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/app_alert.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../shared/enums/enums.dart';
import '../providers/ticket_provider.dart';

/// RaiseTicketScreen — form for creating a new support ticket.
/// Styled to match web's form patterns with uppercase labels, dark selects.
class RaiseTicketScreen extends ConsumerStatefulWidget {
  const RaiseTicketScreen({super.key});

  @override
  ConsumerState<RaiseTicketScreen> createState() => _RaiseTicketScreenState();
}

class _RaiseTicketScreenState extends ConsumerState<RaiseTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  TicketCategory _category = TicketCategory.it;
  TicketSubtype _subtype = TicketSubtype.action;
  TicketPriority _priority = TicketPriority.medium;
  bool _isLoading = false;
  bool _success = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(ticketRepositoryProvider).createTicket(
            title: _titleController.text.trim(),
            description: _descController.text.trim(),
            category: _category,
            subType: _subtype,
            priority: _priority,
          );
      if (mounted) {
        setState(() {
          _isLoading = false;
          _success = true;
        });
        // Navigate back after short delay
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) context.go('/employee/tickets');
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    return Form(
      key: _formKey,
      child: ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'RAISE TICKET',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Submit a new support request.',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.xl),

          if (_success) ...[
            const AppAlert.success(
              message: 'Ticket created successfully. Redirecting...',
              icon: Icons.check_circle_outline,
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // ─── Title ────────────────────────────────────────────
          AppTextField(
            label: 'Title',
            controller: _titleController,
            hintText: 'Brief summary of the issue',
            validator: (value) {
              if (value == null || value.isEmpty) return 'Title is required';
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.lg),

          // ─── Description ──────────────────────────────────────
          AppTextField(
            label: 'Description',
            controller: _descController,
            hintText: 'Provide details about your request...',
            maxLines: 4,
            validator: (value) {
              if (value == null || value.isEmpty) return 'Description is required';
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.lg),

          // ─── Category ─────────────────────────────────────────
          _StyledDropdown<TicketCategory>(
            label: 'Category',
            value: _category,
            items: TicketCategory.values,
            itemLabel: (e) => e.name.toUpperCase(),
            onChanged: (v) => setState(() => _category = v!),
            colors: colors,
          ),
          const SizedBox(height: AppSpacing.lg),

          // ─── Sub-Type ─────────────────────────────────────────
          _StyledDropdown<TicketSubtype>(
            label: 'Sub-Type',
            value: _subtype,
            items: TicketSubtype.values,
            itemLabel: (e) => e.name.toUpperCase(),
            onChanged: (v) => setState(() => _subtype = v!),
            colors: colors,
          ),
          const SizedBox(height: AppSpacing.lg),

          // ─── Priority ─────────────────────────────────────────
          _StyledDropdown<TicketPriority>(
            label: 'Priority',
            value: _priority,
            items: TicketPriority.values,
            itemLabel: (e) => e.name.toUpperCase(),
            onChanged: (v) => setState(() => _priority = v!),
            colors: colors,
          ),
          const SizedBox(height: AppSpacing.xl),

          // ─── Submit ───────────────────────────────────────────
          AppButton.primary(
            label: 'SUBMIT TICKET',
            isLoading: _isLoading,
            onPressed: _success ? null : _handleSubmit,
          ),
          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }
}

/// Styled dropdown matching the design system (uppercase label, bordered select).
class _StyledDropdown<T> extends StatelessWidget {
  final String label;
  final T value;
  final List<T> items;
  final String Function(T) itemLabel;
  final ValueChanged<T?> onChanged;
  final DesklineColors colors;

  const _StyledDropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.itemLabel,
    required this.onChanged,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: AppTypography.formLabel.copyWith(color: colors.textMuted),
        ),
        const SizedBox(height: 8),
        Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: colors.inputBackground,
            border: Border.all(color: colors.inputBorder, width: 1),
            borderRadius: BorderRadius.zero,
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: value,
              isExpanded: true,
              dropdownColor: colors.cardBackground,
              style: AppTypography.bodySmall.copyWith(color: colors.textPrimary),
              icon: Icon(Icons.keyboard_arrow_down, color: colors.textMuted),
              items: items.map((e) {
                return DropdownMenuItem<T>(
                  value: e,
                  child: Text(itemLabel(e)),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}
