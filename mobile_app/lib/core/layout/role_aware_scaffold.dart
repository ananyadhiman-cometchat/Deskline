import 'package:flutter/material.dart';

import '../theme/color_scheme.dart';
import '../theme/typography.dart';

/// RoleAwareScaffold wraps content with role-specific navigation.
/// Supports mobile (bottom nav) and tablet (side drawer) layouts.
class RoleAwareScaffold extends StatelessWidget {
  final String title;
  final Widget body;
  final List<NavigationItem> navigationItems;
  final VoidCallback? onNavItemPressed;

  const RoleAwareScaffold({
    super.key,
    required this.title,
    required this.body,
    required this.navigationItems,
    this.onNavItemPressed,
  });

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;

    if (width >= 600) {
      // Tablet/desktop layout with side drawer
      return Scaffold(
        drawer: Drawer(
          child: Column(
            children: [
              DrawerHeader(
                decoration: BoxDecoration(
                  color: AppColors.navy,
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.person,
                      color: AppColors.white,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      title.toUpperCase(),
                      style: AppTypography.navigationLabel.copyWith(
                        color: AppColors.white,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: navigationItems
                      .map(
                        (item) => ListTile(
                          title: Row(
                            children: [
                              Icon(
                                item.icon,
                                color: item.active
                                    ? AppColors.primaryRed
                                    : AppColors.navy,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                item.label.toUpperCase(),
                                style: AppTypography.body.copyWith(
                                  color: item.active
                                      ? AppColors.primaryRed
                                      : AppColors.navy,
                                ),
                              ),
                            ],
                          ),
                          onTap: onNavItemPressed,
                        ),
                      )
                      .toList(),
                ),
              ),
            ],
          ),
        ),
        body: body,
      );
    }

    // Mobile layout with bottom navigation
    return Scaffold(
      body: body,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          border: Border(
            top: BorderSide(color: AppColors.border, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.white,
          selectedItemColor: AppColors.primaryRed,
          unselectedItemColor: AppColors.mutedText,
          items: navigationItems
              .map(
                (item) => BottomNavigationBarItem(
                  icon: Icon(
                    item.icon,
                    size: 24,
                  ),
                  label: item.label.toUpperCase(),
                ),
              )
              .toList(),
          currentIndex: navigationItems.indexWhere((i) => i.active),
          onTap: (index) => onNavItemPressed?.call(),
        ),
      ),
    );
  }
}

class NavigationItem {
  final String label;
  final IconData icon;
  final bool active;

  const NavigationItem({
    required this.label,
    required this.icon,
    this.active = false,
  });
}
