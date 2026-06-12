import 'package:flutter/material.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/typography.dart';
import '../../../shared/models/models.dart';

/// UserTable displays a list of users in a table format.
/// Theme-aware — adapts background and border colors.
class UserTable extends StatelessWidget {
  final List<User> users;
  final Function(User)? onUserTapped;
  final bool isLoading;

  const UserTable({
    super.key,
    required this.users,
    this.onUserTapped,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    final rows = users.asMap().entries.map((entry) {
      final index = entry.key;
      final user = entry.value;
      return DataRow(
        cells: [
          DataCell(Text(user.name)),
          DataCell(Text(user.email)),
          DataCell(Text(user.role.name)),
          DataCell(Text(user.department.name)),
          DataCell(Text(user.isActive ? 'Active' : 'Inactive')),
        ],
        onSelectChanged: onUserTapped != null
            ? (_) => onUserTapped!(users[index])
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
            DataColumn(label: Text('NAME')),
            DataColumn(label: Text('EMAIL')),
            DataColumn(label: Text('ROLE')),
            DataColumn(label: Text('DEPARTMENT')),
            DataColumn(label: Text('STATUS')),
          ],
          rows: rows,
        ),
      ),
    );
  }
}
