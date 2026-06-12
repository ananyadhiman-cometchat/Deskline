/// Animation timing constants for the DeskLine application.
/// Provides consistent animation durations across all transitions.
class AppDurations {
  AppDurations._();

  /// Very quick transitions (micro-interactions)
  static const instant = Duration(milliseconds: 100);

  /// Fast transitions (hover states, small movements)
  static const fast = Duration(milliseconds: 200);

  /// Standard transition duration
  static const normal = Duration(milliseconds: 300);

  /// Slow transitions (page transitions, complex animations)
  static const slow = Duration(milliseconds: 500);
}
