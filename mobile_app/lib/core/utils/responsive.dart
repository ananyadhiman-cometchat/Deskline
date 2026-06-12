import 'package:flutter/widgets.dart';

class Responsive {
  const Responsive._();

  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= 600;

  static double pagePadding(BuildContext context) =>
      isTablet(context) ? 32 : 16;
}