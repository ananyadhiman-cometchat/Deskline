import 'package:flutter/material.dart';

import '../theme/color_scheme.dart';
import '../theme/typography.dart';

/// DataTableCard presents tabular data with border-driven design.
/// Theme-aware — adapts background and border colors.
class DataTableCard<T> extends StatelessWidget {
  final List<String> columnHeaders;
  final List<List<T>> rows;
  final List<bool>? rowActive;
  final Function(T)? onRowTapped;
  final bool showVerticalDividers;
  final double dataRowMinHeight;
  final double dataRowMaxHeight;

  const DataTableCard({
    super.key,
    required this.columnHeaders,
    required this.rows,
    this.rowActive,
    this.onRowTapped,
    this.showVerticalDividers = false,
    this.dataRowMinHeight = 48,
    this.dataRowMaxHeight = 56,
  });

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

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
          dataRowMinHeight: dataRowMinHeight,
          dataRowMaxHeight: dataRowMaxHeight,
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
          columns: columnHeaders
              .map((h) => DataColumn(label: Text(h.toUpperCase())))
              .toList(),
          rows: rows.asMap().entries.map((entry) {
            final index = entry.key;
            final row = entry.value;
            return DataRow(
              selected: rowActive?[index] ?? false,
              cells: row.map((cell) {
                return DataCell(
                  Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: Text(
                      cell.toString(),
                      style: AppTypography.bodySmall.copyWith(
                        color: colors.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                );
              }).toList(),
              onSelectChanged: onRowTapped != null
                  ? (_) => onRowTapped!(rows[index].first)
                  : null,
            );
          }).toList(),
        ),
      ),
    );
  }
}
