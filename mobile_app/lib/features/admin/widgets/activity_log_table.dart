import 'package:flutter/material.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/typography.dart';
import '../../../shared/models/models.dart';

/// ActivityLogTable displays activity logs in a table format.
/// Theme-aware — adapts background and border colors.
class ActivityLogTable extends StatelessWidget {
  final List<ActivityLog> logs;
  final Function(ActivityLog)? onLogTapped;
  final bool isLoading;

  const ActivityLogTable({
    super.key,
    required this.logs,
    this.onLogTapped,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    final rows = logs.asMap().entries.map((entry) {
      final index = entry.key;
      final log = entry.value;
      return DataRow(
        cells: [
          DataCell(Text(log.userId)),
          DataCell(Text(log.action)),
          DataCell(Text('${log.entityType} ${log.entityId}')),
          DataCell(Text(_formatDate(log.createdAt))),
        ],
        onSelectChanged: onLogTapped != null
            ? (_) => onLogTapped!(logs[index])
            : null,
      );
    }).toList();

    return Container(
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
        borderRadius: BorderRadius.zero,
      ),
      child: Material(
        color: Colors.transparent,
        child: DataTable(
          headingRowHeight: 40,
          dataRowMinHeight: 48,
          dataRowMaxHeight: 56,
          horizontalMargin: 0,
          columnSpacing: 16,
          decoration: BoxDecoration(
            color: colors.cardBackground,
            border: Border.all(color: colors.borderColor, width: 1),
            borderRadius: BorderRadius.zero,
          ),
          headingTextStyle: AppTypography.sectionLabel.copyWith(
            color: colors.textPrimary,
          ),
          dataTextStyle: AppTypography.bodySmall.copyWith(
            color: colors.textPrimary,
          ),
          columns: const [
            DataColumn(label: Text('USER')),
            DataColumn(label: Text('ACTION')),
            DataColumn(label: Text('ENTITY')),
            DataColumn(label: Text('TIME')),
          ],
          rows: rows,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}
