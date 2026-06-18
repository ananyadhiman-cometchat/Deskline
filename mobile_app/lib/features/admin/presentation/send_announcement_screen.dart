import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/app_button.dart';
import '../providers/admin_provider.dart';

class SendAnnouncementScreen extends ConsumerStatefulWidget {
  const SendAnnouncementScreen({super.key});

  @override
  ConsumerState<SendAnnouncementScreen> createState() => _SendAnnouncementScreenState();
}

class _SendAnnouncementScreenState extends ConsumerState<SendAnnouncementScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  String _targetRole = 'all';
  bool _isSending = false;

  static const _roleOptions = [
    {'value': 'all', 'label': 'All Users'},
    {'value': 'employee', 'label': 'Employees Only'},
    {'value': 'agent', 'label': 'Agents Only'},
    {'value': 'supervisor', 'label': 'Supervisors Only'},
    {'value': 'admin', 'label': 'Admins Only'},
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSending = true);

    try {
      final repo = ref.read(adminRepositoryProvider);
      final count = await repo.sendAnnouncement(
        title: _titleController.text.trim(),
        body: _bodyController.text.trim(),
        targetRole: _targetRole == 'all' ? null : _targetRole,
      );

      if (!mounted) return;

      _titleController.clear();
      _bodyController.clear();
      setState(() => _targetRole = 'all');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Announcement sent to $count users.'),
          backgroundColor: AppColors.statusResolved,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to send: $e'),
          backgroundColor: AppColors.errorRed,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      children: [
        const SizedBox(height: AppSpacing.lg),
        Text(
          'SEND ANNOUNCEMENT',
          style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Broadcast a push notification to all users or a specific role.',
          style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
        ),
        const SizedBox(height: AppSpacing.xl),

        Form(
          key: _formKey,
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.cardBackground,
              border: Border.all(color: colors.borderColor, width: 1),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Title field
                Text('TITLE', style: AppTypography.badge.copyWith(color: colors.textMuted)),
                const SizedBox(height: AppSpacing.xs),
                TextFormField(
                  controller: _titleController,
                  maxLength: 120,
                  style: AppTypography.body.copyWith(color: colors.textPrimary),
                  decoration: _inputDecoration(colors, 'e.g. Scheduled Maintenance Tonight'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Title is required' : null,
                ),
                const SizedBox(height: AppSpacing.md),

                // Body field
                Text('MESSAGE', style: AppTypography.badge.copyWith(color: colors.textMuted)),
                const SizedBox(height: AppSpacing.xs),
                TextFormField(
                  controller: _bodyController,
                  maxLines: 4,
                  maxLength: 500,
                  style: AppTypography.body.copyWith(color: colors.textPrimary),
                  decoration: _inputDecoration(colors, 'Describe the announcement...'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Message is required' : null,
                ),
                const SizedBox(height: AppSpacing.md),

                // Target role dropdown
                Text('TARGET AUDIENCE', style: AppTypography.badge.copyWith(color: colors.textMuted)),
                const SizedBox(height: AppSpacing.xs),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: colors.cardBackground,
                    border: Border.all(color: colors.borderColor, width: 1),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _targetRole,
                      isExpanded: true,
                      dropdownColor: colors.cardBackground,
                      style: AppTypography.body.copyWith(color: colors.textPrimary),
                      items: _roleOptions.map((opt) {
                        return DropdownMenuItem(
                          value: opt['value'],
                          child: Text(opt['label']!),
                        );
                      }).toList(),
                      onChanged: (v) => setState(() => _targetRole = v ?? 'all'),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),

                // Send button
                AppButton(
                  label: _isSending ? 'Sending...' : 'Send Announcement',
                  onPressed: _isSending ? null : _send,
                  isLoading: _isSending,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }

  InputDecoration _inputDecoration(DesklineColors colors, String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: AppTypography.bodySmall.copyWith(color: colors.textMuted),
      filled: true,
      fillColor: colors.cardBackground,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      enabledBorder: OutlineInputBorder(
        borderSide: BorderSide(color: colors.borderColor, width: 1),
        borderRadius: BorderRadius.zero,
      ),
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.primaryRed, width: 1),
        borderRadius: BorderRadius.zero,
      ),
      errorBorder: OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.errorRed, width: 1),
        borderRadius: BorderRadius.zero,
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderSide: BorderSide(color: AppColors.errorRed, width: 1),
        borderRadius: BorderRadius.zero,
      ),
      counterStyle: AppTypography.badge.copyWith(color: colors.textMuted),
    );
  }
}
