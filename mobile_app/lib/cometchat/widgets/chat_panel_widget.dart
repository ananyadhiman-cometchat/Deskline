import 'package:flutter/material.dart';

import '../../shared/enums/ticket_status.dart';

/// Conversation type for the CometChat chat panel.
enum ConversationType {
  /// 1:1 chat between employee and agent (conversation tickets).
  oneOnOne,

  /// Group chat with employee, agent, and supervisor (escalation tickets).
  group,
}

/// A widget that displays the CometChat chat panel for a ticket.
///
/// This widget renders the CometChat messaging UI (CometChatMessages)
/// embedded within the ticket detail page. It supports both 1:1 conversations
/// (conversation tickets) and group conversations (escalation tickets).
///
/// The widget handles:
/// - Loading state while CometChat initializes
/// - Displaying a placeholder when no conversation exists
/// - Hiding the message composer when the ticket is resolved/closed
/// - Both 1:1 (User) and group (Group) conversation rendering
class ChatPanelWidget extends StatefulWidget {
  /// The CometChat conversation ID stored on the ticket.
  final String conversationId;

  /// Whether this is a 1:1 or group conversation.
  final ConversationType conversationType;

  /// Current ticket status — used to hide composer on resolved/closed tickets.
  final TicketStatus ticketStatus;

  /// The UID of the recipient (for 1:1 conversations).
  /// Required when [conversationType] is [ConversationType.oneOnOne].
  final String? recipientUid;

  /// The group ID (for group conversations).
  /// Required when [conversationType] is [ConversationType.group].
  final String? groupId;

  const ChatPanelWidget({
    super.key,
    required this.conversationId,
    required this.conversationType,
    required this.ticketStatus,
    this.recipientUid,
    this.groupId,
  }) : assert(
          (conversationType == ConversationType.oneOnOne &&
                  recipientUid != null) ||
              (conversationType == ConversationType.group && groupId != null),
        );

  @override
  State<ChatPanelWidget> createState() => _ChatPanelWidgetState();
}

class _ChatPanelWidgetState extends State<ChatPanelWidget> {
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    try {
      // Allow CometChat SDK to be ready before rendering messages.
      // The actual SDK init is handled by the cometchat_init module (task 10.1).
      // Here we just add a brief delay to ensure the widget tree is stable.
      await Future.delayed(const Duration(milliseconds: 300));

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to initialize chat: $e';
        });
      }
    }
  }

  /// Whether the message composer should be hidden.
  /// Hides composer when ticket is resolved or closed (read-only mode).
  bool get _hideComposer =>
      widget.ticketStatus == TicketStatus.resolved ||
      widget.ticketStatus == TicketStatus.closed;

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return _buildLoadingState();
    }

    if (_error != null) {
      return _buildErrorState();
    }

    return _buildChatPanel();
  }

  Widget _buildLoadingState() {
    return Container(
      height: 400,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text(
              'Loading chat...',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border.all(
          color: Theme.of(context).colorScheme.error.withValues(alpha: 0.3),
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 32,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 12),
            Text(
              'Chat unavailable',
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).colorScheme.error,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _error ?? 'An error occurred',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () {
                setState(() {
                  _isLoading = true;
                  _error = null;
                });
                _initializeChat();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  /// Builds the CometChat messages panel.
  ///
  /// Uses CometChatMessages from the Flutter UI Kit, configured with
  /// either a User (1:1) or Group (group chat) object.
  ///
  /// Note: The actual CometChat widget integration requires the
  /// `cometchat_chat_uikit` package. This widget provides the container
  /// and configuration; the CometChatMessages widget renders the full
  /// messaging experience (message list, composer, header).
  Widget _buildChatPanel() {
    // Placeholder for CometChatMessages widget from Flutter UI Kit.
    // Once `cometchat_chat_uikit` is added to pubspec.yaml, this will be:
    //
    // if (widget.conversationType == ConversationType.oneOnOne) {
    //   final user = User(uid: widget.recipientUid!, name: '');
    //   return CometChatMessages(
    //     user: user,
    //     hideMessageComposer: _hideComposer,
    //   );
    // } else {
    //   final group = Group(
    //     guid: widget.groupId!,
    //     name: '',
    //     type: 'public',
    //   );
    //   return CometChatMessages(
    //     group: group,
    //     hideMessageComposer: _hideComposer,
    //   );
    // }

    return Container(
      height: 400,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        children: [
          // Chat header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Theme.of(context)
                      .colorScheme
                      .outline
                      .withValues(alpha: 0.2),
                ),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  widget.conversationType == ConversationType.group
                      ? Icons.group
                      : Icons.chat_bubble_outline,
                  size: 20,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  widget.conversationType == ConversationType.group
                      ? 'Group Chat'
                      : 'Direct Chat',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                if (_hideComposer)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Read-only',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.orange,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          // Message area placeholder — will be replaced by CometChatMessages
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.chat,
                    size: 48,
                    color: Theme.of(context)
                        .colorScheme
                        .primary
                        .withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'CometChat Messages',
                    style: TextStyle(
                      fontSize: 14,
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Conversation: ${widget.conversationId}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  if (widget.conversationType == ConversationType.oneOnOne &&
                      widget.recipientUid != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Recipient: ${widget.recipientUid}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                  if (widget.conversationType == ConversationType.group &&
                      widget.groupId != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Group: ${widget.groupId}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ],
              ),
            ),
          ),
          // Composer area (hidden when read-only)
          if (!_hideComposer)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context)
                        .colorScheme
                        .outline
                        .withValues(alpha: 0.2),
                  ),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .outline
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      alignment: Alignment.centerLeft,
                      child: const Text(
                        'Type a message...',
                        style: TextStyle(fontSize: 14, color: Colors.grey),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.send,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// A placeholder widget shown when no CometChat conversation exists for a ticket.
class NoChatPlaceholder extends StatelessWidget {
  const NoChatPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 150,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 32,
              color: Colors.grey,
            ),
            SizedBox(height: 8),
            Text(
              'No active chat',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
            SizedBox(height: 4),
            Text(
              'Chat will be available once an agent is assigned',
              style: TextStyle(fontSize: 12, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
