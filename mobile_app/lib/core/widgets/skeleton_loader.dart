import 'package:flutter/material.dart';

import '../theme/color_scheme.dart';

/// SkeletonLoader displays shimmer placeholders while content is loading.
/// Matches the web's `.skeleton` class with linear gradient animation.
///
/// Usage:
/// ```dart
/// SkeletonLoader.text(lines: 3)
/// SkeletonLoader.card(count: 2)
/// SkeletonLoader.title()
/// ```
class SkeletonLoader extends StatefulWidget {
  final SkeletonType type;
  final int count;

  const SkeletonLoader({
    super.key,
    required this.type,
    this.count = 1,
  });

  /// Multiple text lines
  const SkeletonLoader.text({super.key, int lines = 3})
      : type = SkeletonType.text,
        count = lines;

  /// Card-sized skeleton blocks
  const SkeletonLoader.card({super.key, this.count = 1})
      : type = SkeletonType.card;

  /// Title-sized skeleton
  const SkeletonLoader.title({super.key})
      : type = SkeletonType.title,
        count = 1;

  @override
  State<SkeletonLoader> createState() => _SkeletonLoaderState();
}

class _SkeletonLoaderState extends State<SkeletonLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(widget.count, (index) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: index < widget.count - 1 ? _spacingForType : 0,
              ),
              child: _buildSkeleton(colors),
            );
          }),
        );
      },
    );
  }

  double get _spacingForType {
    switch (widget.type) {
      case SkeletonType.text:
        return 8;
      case SkeletonType.card:
        return 12;
      case SkeletonType.title:
        return 12;
    }
  }

  Widget _buildSkeleton(DesklineColors colors) {
    final double height;
    final double? width;

    switch (widget.type) {
      case SkeletonType.text:
        height = 14;
        width = null; // full width
      case SkeletonType.card:
        height = 80;
        width = null;
      case SkeletonType.title:
        height = 20;
        width = null;
    }

    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.zero,
        gradient: LinearGradient(
          begin: Alignment(-1.0 + 2.0 * _controller.value, 0),
          end: Alignment(1.0 + 2.0 * _controller.value, 0),
          colors: colors.isDark
              ? [
                  const Color(0xFF27272A),
                  const Color(0xFF3F3F46),
                  const Color(0xFF27272A),
                ]
              : [
                  const Color(0xFFF0F0F0),
                  const Color(0xFFE8E8E8),
                  const Color(0xFFF0F0F0),
                ],
        ),
      ),
    );
  }
}

enum SkeletonType { text, card, title }
