import 'dart:async';

import 'package:cometchat_chat_uikit/cometchat_chat_uikit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/theme_provider.dart';
import '../../shared/enums/ticket_status.dart';
import '../providers/cometchat_provider.dart';
import 'call_buttons_widget.dart' show joinMeetingCall;

/// Conversation type for the CometChat chat panel.
enum ConversationType {
  /// 1:1 chat between employee and agent (conversation tickets).
  oneOnOne,

  /// Group chat with employee, agent, and supervisor (escalation tickets).
  group,
}

/// A widget that displays the CometChat chat panel for a ticket.
///
/// Syncs [CometChatThemeMode.mode] to the app's current [ThemeMode] and
/// injects a matching [CometChatColorPalette] via Flutter's Theme extension
/// mechanism so CometChat widgets respect dark/light mode automatically.
///
/// Tap the expand icon in the header to open a fullscreen chat overlay.
class ChatPanelWidget extends ConsumerStatefulWidget {
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
  ConsumerState<ChatPanelWidget> createState() => _ChatPanelWidgetState();
}

class _ChatPanelWidgetState extends ConsumerState<ChatPanelWidget> {
  bool _isLoading = true;
  String? _error;
  User? _resolvedUser;
  Group? _resolvedGroup;
  bool _chatInitTriggered = false;

  @override
  void initState() {
    super.initState();
    // _initializeChat() is triggered in two ways:
    // 1. Via ref.listen in build() when cometchatProvider.isInitialized flips true.
    // 2. Via addPostFrameCallback here — covers the case where isInitialized is
    //    ALREADY true when the widget first mounts (e.g. user navigates to ticket
    //    detail after CometChat has already logged in).
    //
    // We cannot read ref here (initState runs before the first build), so we
    // schedule the check for after the first frame.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      // If CometChat is already initialized, kick off immediately.
      // ref.read is safe here (after first build).
      final state = ref.read(cometchatProvider);
      if (state.isInitialized) {
        _initializeChat();
      }
      // If not yet initialized, ref.listen in build() will fire when it becomes ready.
    });
  }

  Future<void> _initializeChat() async {
    if (_chatInitTriggered) return;
    _chatInitTriggered = true;
    // ignore: avoid_print
    print('[ChatPanel] _initializeChat() started for group=${widget.groupId} uid=${widget.recipientUid}');

    try {
      final bool isGroup = widget.conversationType == ConversationType.group;

      if (isGroup && widget.groupId != null) {
        // Fetch the real group from CometChat so the header shows the correct
        // name, member count, and avatar (not "0 Members" from an empty object).
        final completer = Completer<Group>();
        CometChat.getGroup(
          widget.groupId!,
          onSuccess: (Group group) {
            // ignore: avoid_print
            print('[ChatPanel] getGroup success: ${group.guid}');
            if (!completer.isCompleted) completer.complete(group);
          },
          onError: (CometChatException e) {
            // ignore: avoid_print
            print('[ChatPanel] getGroup error: ${e.message} — using fallback');
            // Fallback: construct a group with the GUID as the name
            if (!completer.isCompleted) {
              completer.complete(
                Group(guid: widget.groupId!, name: widget.groupId!, type: 'private'),
              );
            }
          },
        );
        // 10 s timeout — if SDK fires neither callback, fall back gracefully.
        _resolvedGroup = await completer.future.timeout(
          const Duration(seconds: 10),
          onTimeout: () {
            // ignore: avoid_print
            print('[ChatPanel] getGroup timed out — using fallback');
            return Group(guid: widget.groupId!, name: widget.groupId!, type: 'private');
          },
        );
      } else if (!isGroup && widget.recipientUid != null) {
        // Fetch the real user for 1:1 conversations.
        final completer = Completer<User>();
        CometChat.getUser(
          widget.recipientUid!,
          onSuccess: (User user) {
            if (!completer.isCompleted) completer.complete(user);
          },
          onError: (CometChatException e) {
            // ignore: avoid_print
            print('[ChatPanel] getUser error: ${e.message} — using fallback');
            if (!completer.isCompleted) {
              completer.complete(
                User(uid: widget.recipientUid!, name: widget.recipientUid!),
              );
            }
          },
        );
        // 10 s timeout
        _resolvedUser = await completer.future.timeout(
          const Duration(seconds: 10),
          onTimeout: () {
            // ignore: avoid_print
            print('[ChatPanel] getUser timed out — using fallback');
            return User(uid: widget.recipientUid!, name: widget.recipientUid!);
          },
        );
      }

      // ignore: avoid_print
      print('[ChatPanel] _initializeChat() complete. group=$_resolvedGroup user=$_resolvedUser');
      if (mounted) setState(() => _isLoading = false);
    } catch (e) {
      // ignore: avoid_print
      print('[ChatPanel] _initializeChat() error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to initialize chat: $e';
        });
      }
    }
  }

  bool get _hideComposer =>
      widget.ticketStatus == TicketStatus.resolved ||
      widget.ticketStatus == TicketStatus.closed;

  @override
  Widget build(BuildContext context) {
    // Keep CometChatThemeMode in sync with the app's ThemeMode so all
    // CometChatThemeHelper.getBrightness() calls return the right value.
    final themeMode = ref.watch(themeModeProvider);
    CometChatThemeMode.mode = themeMode;

    // React to CometChat becoming initialized AFTER the widget has already
    // mounted (covers the async case where login completes mid-lifecycle).
    // ref.listen fires on every state CHANGE — if CometChat was already
    // initialized when we mounted, initState's postFrameCallback handles it.
    ref.listen<CometChatState>(cometchatProvider, (previous, next) {
      if (next.isInitialized && !_chatInitTriggered) {
        _initializeChat();
      }
    });

    if (_isLoading) return _buildLoadingState();
    if (_error != null) return _buildErrorState();
    return _buildChatPanel(context);
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
            Text('Loading chat...', style: TextStyle(fontSize: 14, color: Colors.grey)),
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
            Icon(Icons.chat_bubble_outline, size: 32, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 12),
            Text('Chat unavailable', style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.error)),
            const SizedBox(height: 4),
            Text(_error ?? 'An error occurred', style: const TextStyle(fontSize: 12, color: Colors.grey), textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () {
                setState(() { _isLoading = true; _error = null; });
                _initializeChat();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatPanel(BuildContext context) {
    final User? user = _resolvedUser;
    final Group? group = _resolvedGroup;

    if (user == null && group == null) return const NoChatPlaceholder();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return _withCometChatPalette(
      context,
      child: Container(
        // Fixed height so Column children resolve correctly inside a ListView
        // (ListView provides unbounded height — Expanded cannot work there).
        height: 500,
        clipBehavior: Clip.hardEdge,
        decoration: BoxDecoration(
          // Use darker background in dark mode for better contrast
          color: isDark ? const Color(0xFF0F0F11) : Theme.of(context).colorScheme.surface,
          border: Border.all(
            color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
          ),
        ),
        child: Column(
          children: [
            // Minimal header: ticket name + fullscreen button (no CometChatMessageHeader)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
                  ),
                ),
              ),
              child: Row(
                children: [
                  // Group/User name
                  Expanded(
                    child: Text(
                      group?.name ?? user?.name ?? 'Chat',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Member count for groups
                  if (group != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Text(
                        '${group.membersCount} Members',
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                  // Fullscreen button (right side)
                  IconButton(
                    tooltip: 'Expand to fullscreen',
                    icon: const Icon(Icons.open_in_full, size: 18),
                    onPressed: () => _openFullscreen(context, user, group),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                  ),
                ],
              ),
            ),
            // Message list — fills remaining space within the bounded Container.
            // Wrapped in a LayoutBuilder + MediaQuery override so CometChat's
            // bubbles size to the ACTUAL container width (not the full screen
            // width), preventing the "RIGHT OVERFLOWED" horizontal overflow.
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final mq = MediaQuery.of(context);
                  return MediaQuery(
                    data: mq.copyWith(
                      size: Size(constraints.maxWidth, constraints.maxHeight),
                    ),
                    child: CometChatMessageList(
                      user: user,
                      group: group,
                      addTemplate: [_meetingMessageTemplate(widget.ticketStatus)],
                      messagesRequestBuilder: _buildMessagesRequestBuilder(user, group),
                    ),
                  );
                },
              ),
            ),
            if (!_hideComposer)
              CometChatMessageComposer(user: user, group: group)
            else
              _ReadOnlyBanner(ticketStatus: widget.ticketStatus),
          ],
        ),
      ),
    );
  }

  void _openFullscreen(BuildContext context, User? user, Group? group) {
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => _FullscreenChatPage(
          user: user,
          group: group,
          hideComposer: _hideComposer,
          ticketStatus: widget.ticketStatus,
        ),
      ),
    );
  }
}

/// Injects a [CometChatColorPalette] into the Flutter Theme extension tree so
/// that all CometChat widgets below pick up the correct dark/light colours via
/// [CometChatThemeHelper.getColorPalette].
///
/// Uses the V5 ThemeExtension pattern — there is no CometChatThemeProvider
/// widget in V5; the palette is injected directly through Flutter's own
/// [Theme.of(context).extensions] mechanism.
Widget _withCometChatPalette(BuildContext context, {required Widget child}) {
  final isDark = Theme.of(context).brightness == Brightness.dark;

  final palette = isDark ? _darkPalette : _lightPalette;

  return Theme(
    data: Theme.of(context).copyWith(
      extensions: [
        ...Theme.of(context).extensions.values,
        palette,
      ],
    ),
    child: child,
  );
}

/// Dark colour palette for CometChat — true black/zinc surfaces matching the app.
final _darkPalette = CometChatColorPalette(
  primary: const Color(0xFFFF4655),
  // Backgrounds: darker to match DeskLine's app background
  background1: const Color(0xFF0F0F11),
  background2: const Color(0xFF141416),
  background3: const Color(0xFF1C1C1E),
  background4: const Color(0xFF2C2C2E),
  // Neutrals (text, icons)
  neutral100: const Color(0xFFF8FAFC),
  neutral200: const Color(0xFFE4E4E7),
  neutral300: const Color(0xFFA1A1AA),
  neutral400: const Color(0xFF71717A),
  neutral500: const Color(0xFF52525B),
  neutral600: const Color(0xFF3F3F46),
  neutral700: const Color(0xFF27272A),
  neutral800: const Color(0xFF18181B),
  neutral900: const Color(0xFF09090B),
  // Borders
  borderLight: const Color(0xFF27272A),
  borderDefault: const Color(0xFF3F3F46),
  borderDark: const Color(0xFF52525B),
  // Text
  textPrimary: const Color(0xFFF8FAFC),
  textSecondary: const Color(0xFFA1A1AA),
  textTertiary: const Color(0xFF71717A),
  textDisabled: const Color(0xFF52525B),
  textWhite: const Color(0xFFFFFFFF),
  // Icons
  iconPrimary: const Color(0xFFF8FAFC),
  iconSecondary: const Color(0xFFA1A1AA),
  iconTertiary: const Color(0xFF71717A),
  iconWhite: const Color(0xFFFFFFFF),
  // Alerts
  error: const Color(0xFFEF4444),
  warning: const Color(0xFFF59E0B),
  success: const Color(0xFF10B981),
  info: const Color(0xFF3B82F6),
  // Buttons
  buttonBackground: const Color(0xFFFF4655),
  buttonText: const Color(0xFFFFFFFF),
);

/// Light colour palette for CometChat — white surfaces.
final _lightPalette = CometChatColorPalette(
  primary: const Color(0xFFFF4655),
  background1: const Color(0xFFFFFFFF),
  background2: const Color(0xFFF7F7F7),
  background3: const Color(0xFFE5E7EB),
  background4: const Color(0xFFD1D5DB),
  neutral100: const Color(0xFF0F1923),
  neutral200: const Color(0xFF374151),
  neutral300: const Color(0xFF6B7280),
  neutral400: const Color(0xFF9CA3AF),
  neutral500: const Color(0xFFD1D5DB),
  neutral600: const Color(0xFFE5E7EB),
  neutral700: const Color(0xFFF3F4F6),
  neutral800: const Color(0xFFF9FAFB),
  neutral900: const Color(0xFFFFFFFF),
  borderLight: const Color(0xFFE5E7EB),
  borderDefault: const Color(0xFFD1D5DB),
  borderDark: const Color(0xFF9CA3AF),
  textPrimary: const Color(0xFF0F1923),
  textSecondary: const Color(0xFF6B7280),
  textTertiary: const Color(0xFF9CA3AF),
  textDisabled: const Color(0xFFD1D5DB),
  textWhite: const Color(0xFFFFFFFF),
  iconPrimary: const Color(0xFF0F1923),
  iconSecondary: const Color(0xFF6B7280),
  iconTertiary: const Color(0xFF9CA3AF),
  iconWhite: const Color(0xFFFFFFFF),
  error: const Color(0xFFEF4444),
  warning: const Color(0xFFF59E0B),
  success: const Color(0xFF10B981),
  info: const Color(0xFF3B82F6),
  buttonBackground: const Color(0xFFFF4655),
  buttonText: const Color(0xFFFFFFFF),
);

/// Builds a MessagesRequestBuilder that includes custom/meeting messages
/// in addition to the standard message types. Without this, the default
/// builder only fetches text/image/audio/video/file/action/interactive
/// categories — skipping "custom" entirely, so meeting call cards never appear.
MessagesRequestBuilder _buildMessagesRequestBuilder(User? user, Group? group) {
  final builder = MessagesRequestBuilder()
    ..categories = [
      CometChatMessageCategory.message,
      CometChatMessageCategory.action,
      CometChatMessageCategory.interactive,
      MessageCategoryConstants.custom, // ← THIS IS THE KEY FIX
    ]
    ..types = [
      CometChatMessageType.text,
      CometChatMessageType.image,
      CometChatMessageType.audio,
      CometChatMessageType.video,
      CometChatMessageType.file,
      MessageTypeConstants.groupActions,
      MessageTypeConstants.form,
      MessageTypeConstants.card,
      MessageTypeConstants.meeting, // ← meeting custom messages
    ]
    ..hideReplies = true;

  if (user != null) {
    builder.uid = user.uid;
  } else if (group != null) {
    builder.guid = group.guid;
  }

  return builder;
}

/// Creates a CometChatMessageTemplate for "meeting" custom messages.
/// This renders the "Voice/Video call — Join" card in the message list,
/// matching the web's behavior.
///
/// [ticketStatus] controls whether tapping "Join" actually starts a call.
/// When the ticket is [TicketStatus.resolved] or [TicketStatus.closed],
/// the Join button shows an informational snackbar instead of navigating
/// to the call screen. This prevents the crash that occurs when
/// CometChatCalls.joinSession() is called for a session that belongs to
/// a terminated conversation.
CometChatMessageTemplate _meetingMessageTemplate(TicketStatus ticketStatus) {
  // Guard: calls are disabled for resolved or closed tickets
  final callsDisabled =
      ticketStatus == TicketStatus.resolved ||
      ticketStatus == TicketStatus.closed;

  return CometChatMessageTemplate(
    type: MessageTypeConstants.meeting,
    category: MessageCategoryConstants.custom,
    contentView: (BaseMessage message, BuildContext context,
        BubbleAlignment alignment,
        {AdditionalConfigurations? additionalConfigurations}) {
      final customData = (message as CustomMessage).customData ?? {};
      final callType = customData['callType'] ?? 'audio';
      // Read sessionId from any of the key variants the web kit / SDK may use.
      final sessionId = (customData['sessionID'] ??
          customData['sessionId'] ??
          customData['sessionid'] ??
          '') as String;
      final sentAt = message.sentAt;
      final dateStr = sentAt != null
          ? '${sentAt.day} ${_monthName(sentAt.month)}, ${sentAt.hour.toString().padLeft(2, '0')}:${sentAt.minute.toString().padLeft(2, '0')} ${sentAt.hour >= 12 ? 'PM' : 'AM'}'
          : '';

      return GestureDetector(
        onTap: () {
          if (callsDisabled) {
            // ── GUARD: calls disabled for resolved / closed tickets ──
            // Show informational message instead of crashing the app by
            // calling joinSession() on a terminated conversation session.
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Calls are disabled — this ticket has been resolved or closed.',
                ),
                duration: Duration(seconds: 3),
              ),
            );
            return;
          }
          if (sessionId.isEmpty) return;
          // Navigate to the call screen
          joinMeetingCall(context, sessionId: sessionId, isVideo: callType == 'video');
        },
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            // Dim the card when calls are disabled so it visually signals
            // the call is no longer active.
            color: callsDisabled
                ? const Color(0xFFFF4655).withValues(alpha: 0.4)
                : const Color(0xFFFF4655),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      callType == 'video' ? Icons.videocam : Icons.phone,
                      color: const Color(0xFFFF4655),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        callType == 'video' ? 'Video call' : 'Voice call',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      if (dateStr.isNotEmpty)
                        Text(
                          dateStr,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Divider(color: Colors.white30, height: 1),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  // Label changes when ticket is closed/resolved
                  callsDisabled ? 'Call ended' : 'Join',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: callsDisabled ? 0.5 : 0.9),
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

String _monthName(int month) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1];
}

/// Full-screen chat page pushed by the expand button in [ChatPanelWidget].
class _FullscreenChatPage extends ConsumerWidget {
  final User? user;
  final Group? group;
  final bool hideComposer;
  final TicketStatus ticketStatus;

  const _FullscreenChatPage({
    required this.user,
    required this.group,
    required this.hideComposer,
    required this.ticketStatus,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    CometChatThemeMode.mode = themeMode;

    return Scaffold(
      body: SafeArea(
        child: _withCometChatPalette(
          context,
          child: Column(
            children: [
              // Single header row: group/user name + exit fullscreen icon (right)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  border: Border(
                    bottom: BorderSide(
                      color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        group?.name ?? user?.name ?? 'Chat',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (group != null)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Text(
                          '${group!.membersCount} Members',
                          style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                      ),
                    IconButton(
                      tooltip: 'Exit fullscreen',
                      icon: const Icon(Icons.close_fullscreen, size: 20),
                      onPressed: () => Navigator.of(context).pop(),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                    ),
                  ],
                ),
              ),
              // Message list — fills all available space
              Expanded(
                child: CometChatMessageList(
                  user: user,
                  group: group,
                  addTemplate: [_meetingMessageTemplate(ticketStatus)],
                  messagesRequestBuilder: _buildMessagesRequestBuilder(user, group),
                ),
              ),
              // Composer — fits at the bottom with no clipping
              if (!hideComposer)
                CometChatMessageComposer(user: user, group: group)
              else
                _ReadOnlyBanner(ticketStatus: ticketStatus),
            ],
          ),
        ),
      ),
    );
  }
}

/// Read-only banner shown instead of the composer when a ticket is resolved/closed.
class _ReadOnlyBanner extends StatelessWidget {
  final TicketStatus ticketStatus;

  const _ReadOnlyBanner({required this.ticketStatus});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.2),
          ),
        ),
      ),
      child: Text(
        'This conversation is read-only — the ticket has been '
        '${ticketStatus == TicketStatus.resolved ? "resolved" : "closed"}.',
        style: const TextStyle(fontSize: 12, color: Colors.grey),
        textAlign: TextAlign.center,
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
            Icon(Icons.chat_bubble_outline, size: 32, color: Colors.grey),
            SizedBox(height: 8),
            Text(
              'No active chat',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.grey),
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
