import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/dio_provider.dart';
import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/ticket_api_service.dart';
import '../providers/comments_provider.dart';

/// Communication thread widget matching the web's TicketCommunicationThread.
/// Shows existing comments and allows sending new messages.
/// Visible to all roles. Input hidden when ticket is closed.
class CommunicationThread extends ConsumerStatefulWidget {
  final String ticketId;
  final TicketStatus ticketStatus;

  const CommunicationThread({
    super.key,
    required this.ticketId,
    required this.ticketStatus,
  });

  @override
  ConsumerState<CommunicationThread> createState() =>
      _CommunicationThreadState();
}

class _CommunicationThreadState extends ConsumerState<CommunicationThread> {
  final _controller = TextEditingController();
  bool _isSending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _sendComment() async {
    final body = _controller.text.trim();
    if (body.isEmpty) return;

    setState(() => _isSending = true);
    try {
      final dioClient = ref.read(dioClientProvider);
      final apiService = TicketApiService(dioClient);
      await apiService.addComment(widget.ticketId, body);
      _controller.clear();
      ref.invalidate(ticketCommentsProvider(widget.ticketId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send message: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    final commentsAsync = ref.watch(ticketCommentsProvider(widget.ticketId));
    final currentUser = ref.watch(authStateProvider).user;
    final isClosed = widget.ticketStatus == TicketStatus.closed;

    return Container(
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Comments list
          commentsAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(AppSpacing.lg),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primaryRed,
                  ),
                ),
              ),
            ),
            error: (_, __) => Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Center(
                child: Text(
                  'Could not load messages.',
                  style:
                      AppTypography.bodySmall.copyWith(color: colors.textMuted),
                ),
              ),
            ),
            data: (comments) {
              if (comments.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Center(
                    child: Text(
                      'No messages yet.',
                      style: AppTypography.bodySmall
                          .copyWith(color: colors.textMuted),
                    ),
                  ),
                );
              }
              return Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  children: comments
                      .map((c) => _buildCommentBubble(c, currentUser, colors))
                      .toList(),
                ),
              );
            },
          ),

          // Input area (hidden when closed)
          if (!isClosed) ...[
            Divider(height: 1, color: colors.borderColor),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      enabled: !_isSending,
                      style: AppTypography.bodySmall
                          .copyWith(color: colors.textPrimary),
                      maxLines: 3,
                      minLines: 1,
                      decoration: InputDecoration(
                        hintText: 'Type your message...',
                        hintStyle: AppTypography.bodySmall
                            .copyWith(color: colors.textMuted),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.zero,
                          borderSide: BorderSide(color: colors.borderColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.zero,
                          borderSide: BorderSide(color: colors.borderColor),
                        ),
                        focusedBorder: const OutlineInputBorder(
                          borderRadius: BorderRadius.zero,
                          borderSide: BorderSide(color: AppColors.primaryRed),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  SizedBox(
                    width: 44,
                    height: 44,
                    child: IconButton(
                      onPressed: _isSending ? null : _sendComment,
                      style: IconButton.styleFrom(
                        backgroundColor: AppColors.primaryRed,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.zero,
                        ),
                      ),
                      icon: _isSending
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.send, color: Colors.white, size: 18),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCommentBubble(
    TicketComment comment,
    User? currentUser,
    DesklineColors colors,
  ) {
    final isMine = comment.userId == currentUser?.id;
    final isAi = comment.isAi;
    final commentUserName = comment.user?.name ?? 'Unknown';
    final commentUserRole = comment.user?.role ?? '';

    // Time formatting
    final diff = DateTime.now().difference(comment.createdAt);
    String timeLabel;
    if (diff.inMinutes < 60) {
      timeLabel = '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      timeLabel = '${diff.inHours}h ago';
    } else {
      timeLabel = '${diff.inDays}d ago';
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Align(
        alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
        child: Column(
          crossAxisAlignment:
              isMine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Sender info
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isAi)
                  Icon(Icons.smart_toy, size: 12, color: AppColors.primaryRed)
                else if (commentUserRole == 'agent' ||
                    commentUserRole == 'supervisor')
                  Icon(Icons.shield, size: 12, color: Colors.amber.shade600)
                else
                  Icon(Icons.person, size: 12, color: colors.textMuted),
                const SizedBox(width: 4),
                Text(
                  isAi ? 'AI Assistant' : '$commentUserName ($commentUserRole)',
                  style:
                      AppTypography.caption.copyWith(color: colors.textMuted),
                ),
                const SizedBox(width: 6),
                Text(
                  timeLabel,
                  style:
                      AppTypography.caption.copyWith(color: colors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 4),
            // Message bubble
            Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: isAi
                    ? AppColors.primaryRed
                    : isMine
                        ? const Color(0xFF0F1923)
                        : colors.surface,
                border: Border.all(
                  color: (isAi || isMine)
                      ? Colors.transparent
                      : colors.borderColor,
                  width: 1,
                ),
              ),
              child: Text(
                comment.body,
                style: AppTypography.bodySmall.copyWith(
                  color: (isAi || isMine) ? Colors.white : colors.textPrimary,
                  height: 1.6,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
