import 'dart:async';

import 'package:cometchat_calls_sdk/cometchat_calls_sdk.dart';
import 'package:cometchat_chat_uikit/cometchat_chat_uikit.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:uuid/uuid.dart';

import '../../core/theme/color_scheme.dart';
import '../cometchat_config.dart';

/// Public function to join a meeting call from anywhere in the app
/// (e.g., tapping "Join" on a meeting message card).
/// Handles permissions, Calls SDK init, and navigates to the call screen.
void joinMeetingCall(BuildContext context, {required String sessionId, required bool isVideo}) {
  Navigator.of(context, rootNavigator: true).push(
    MaterialPageRoute(
      builder: (_) => _OngoingCallScreen(
        sessionId: sessionId,
        isVideo: isVideo,
      ),
    ),
  );
}

class CallButtonsWidget extends StatefulWidget {
  /// The CometChat UID of the call recipient (used for 1:1 calls).
  final String recipientUid;

  /// If provided, the call targets a group. Should be the cometchatConvoId (group GUID).
  final String? groupId;

  final bool showVideoButton;
  final bool showAudioButton;

  const CallButtonsWidget({
    super.key,
    required this.recipientUid,
    this.groupId,
    this.showVideoButton = true,
    this.showAudioButton = true,
  });

  @override
  State<CallButtonsWidget> createState() => _CallButtonsWidgetState();
}

class _CallButtonsWidgetState extends State<CallButtonsWidget> {
  bool _isInitiatingCall = false;

  Future<void> _initiateCall(String callType) async {
    if (_isInitiatingCall) return;

    setState(() => _isInitiatingCall = true);

    try {
      final isGroup = widget.groupId != null && widget.groupId!.isNotEmpty;
      debugPrint('[CallButtons] Initiating $callType call. isGroup=$isGroup, target=${isGroup ? widget.groupId : widget.recipientUid}');

      if (isGroup) {
        // ─── Group calls use "meeting" custom messages (NOT initiateCall) ───
        // This matches the web's CometChatMessageHeader behavior:
        // 1. Generate a unique session ID
        // 2. Send a custom message with type "meeting" to the group
        // 3. Navigate to the call screen immediately (the sender joins)
        // 4. Other group members see the meeting card and tap "Join"
        await _startGroupMeetingCall(callType);
      } else {
        // ─── 1:1 calls use the ringing channel (initiateCall) ───
        _startRingingCall(callType);
      }
    } catch (e, stack) {
      debugPrint('[CallButtons] EXCEPTION in _initiateCall: $e');
      debugPrint('[CallButtons] Stack: $stack');
      if (mounted) {
        setState(() => _isInitiatingCall = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Call failed: $e')),
        );
      }
    }
  }

  /// Start a group meeting call by sending a custom "meeting" message.
  /// Matches the web's CometChatCallButtons group behavior.
  Future<void> _startGroupMeetingCall(String callType) async {
    final sessionId = const Uuid().v4();

    // Send a custom message of type "meeting" to the group.
    // This creates the meeting card that other members can tap to join.
    //
    // IMPORTANT: customData must match the web UI Kit's exact format so that
    // the web's CometChatMessageList can render a working "Join" button.
    // The CometChat SDK's CustomMessage.getSessionId() reads the "sessionID"
    // (capital ID) key — without it, the web kit calls generateToken(undefined)
    // and throws an empty CometChatException. We include BOTH "sessionID" and
    // "sessionId" (plus lowercase "sessionid") to be fully compatible with the
    // kit and the SDK's call-session parsing.
    final callTypeStr = callType == CometChatCallType.video ? 'video' : 'audio';
    final customMessage = CustomMessage(
      receiverUid: widget.groupId!,
      type: MessageTypeConstants.meeting,
      receiverType: CometChatReceiverType.group,
      customData: {
        'sessionID': sessionId, // ← capital ID: what the web kit + SDK read
        'sessionId': sessionId, // ← camelCase: what the Flutter template reads
        'sessionid': sessionId, // ← lowercase: SDK CALL_SESSION_ID key
        'callType': callTypeStr,
      },
    );

    // Match the web kit: mark as custom category + increment unread count.
    // ADDITION: pushNotification triggers the background system push for offline users.
    customMessage.category = MessageCategoryConstants.custom;
    customMessage.metadata = {
      'incrementUnreadCount': true,
      'pushNotification': 'meeting',
    };

    final completer = Completer<void>();

    CometChat.sendCustomMessage(
      customMessage,
      onSuccess: (BaseMessage message) {
        debugPrint('[CallButtons] Meeting message sent. sessionId=$sessionId');
        if (!completer.isCompleted) completer.complete();
      },
      onError: (CometChatException e) {
        debugPrint('[CallButtons] ERROR sendCustomMessage: code=${e.code}, message=${e.message}');
        if (!completer.isCompleted) completer.completeError(e);
      },
    );

    await completer.future;

    if (!mounted) return;
    setState(() => _isInitiatingCall = false);

    // Navigate to the call screen — the initiator joins immediately
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        builder: (_) => _OngoingCallScreen(
          sessionId: sessionId,
          isVideo: callType == CometChatCallType.video,
        ),
      ),
    );
  }

  /// Start a 1:1 ringing call via CometChat.initiateCall.
  void _startRingingCall(String callType) {
    final call = Call(
      receiverUid: widget.recipientUid,
      receiverType: CometChatReceiverType.user,
      type: callType,
    );

    CometChat.initiateCall(
      call,
      onSuccess: (Call initiatedCall) {
        debugPrint('[CallButtons] 1:1 call initiated. sessionId=${initiatedCall.sessionId}');
        if (!mounted) return;
        setState(() => _isInitiatingCall = false);
        _showOutgoingCallScreen(initiatedCall);
      },
      onError: (CometChatException e) {
        debugPrint('[CallButtons] ERROR initiateCall: code=${e.code}, message=${e.message}, details=${e.details}');
        if (!mounted) return;
        setState(() => _isInitiatingCall = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Call failed: ${e.message ?? e.code ?? "Unknown error"}')),
        );
      },
    );
  }

  void _showOutgoingCallScreen(Call call) {
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        builder: (_) => _OngoingCallScreen(
          sessionId: call.sessionId!,
          isVideo: call.type == CometChatCallType.video,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.showAudioButton)
          _CallButton(
            icon: Icons.phone,
            label: 'Voice',
            color: colors.textPrimary,
            onPressed: () => _initiateCall(CometChatCallType.audio),
          ),
        if (widget.showAudioButton && widget.showVideoButton)
          const SizedBox(width: 8),
        if (widget.showVideoButton)
          _CallButton(
            icon: Icons.videocam,
            label: 'Video',
            color: colors.textPrimary,
            onPressed: () => _initiateCall(CometChatCallType.video),
          ),
      ],
    );
  }
}

class _CallButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onPressed;

  const _CallButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$label call',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: onPressed,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Icon(icon, color: color, size: 22),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// _OngoingCallScreen — Displays the active call session
// ═══════════════════════════════════════════════════════════════

class _OngoingCallScreen extends StatefulWidget {
  final String sessionId;
  final bool isVideo;

  const _OngoingCallScreen({
    required this.sessionId,
    required this.isVideo,
  });

  @override
  State<_OngoingCallScreen> createState() => _OngoingCallScreenState();
}

class _OngoingCallScreenState extends State<_OngoingCallScreen>
    implements SessionStatusListeners, ButtonClickListeners {
  Widget? _callWidget;
  bool _isJoining = true;
  String? _error;
  CallSession? _callSession;

  @override
  void initState() {
    super.initState();
    _requestPermissionsAndJoin();
  }

  @override
  void dispose() {
    _callSession?.removeSessionStatusListener(this);
    _callSession?.removeButtonClickListener(this);
    super.dispose();
  }

  /// Request camera + microphone permissions, then join the call session.
  Future<void> _requestPermissionsAndJoin() async {
    final micStatus = await Permission.microphone.request();
    final camStatus = await Permission.camera.request();

    if (micStatus.isDenied || camStatus.isDenied) {
      if (mounted) {
        setState(() {
          _error = 'Camera and microphone permissions are required for calls. '
              'Please allow them in your device settings.';
          _isJoining = false;
        });
      }
      return;
    }

    // Ensure the Calls SDK is initialized before joining.
    await _ensureCallsSdkReady();

    _joinSession();
  }

  /// Login the v5 Calls SDK if not already logged in.
  Future<void> _ensureCallsSdkReady() async {
    try {
      final loggedInUser = CometChatCalls.getLoggedInUser();
      if (loggedInUser != null) {
        debugPrint('[OngoingCall] Calls SDK already logged in');
        return;
      }
    } catch (_) {}

    try {
      final authToken = await CometChat.getUserAuthToken();
      if (authToken != null && authToken.isNotEmpty) {
        final loginCompleter = Completer<void>();
        CometChatCalls.loginWithAuthToken(
          authToken: authToken,
          onSuccess: (_) {
            debugPrint('[OngoingCall] ✓ Calls SDK logged in');
            if (!loginCompleter.isCompleted) loginCompleter.complete();
          },
          onError: (CometChatCallsException e) {
            debugPrint('[OngoingCall] Calls SDK login error: ${e.message}');
            if (!loginCompleter.isCompleted) loginCompleter.completeError(e);
          },
        );
        await loginCompleter.future;
      } else {
        debugPrint('[OngoingCall] No auth token available for Calls login');
      }
    } catch (e) {
      debugPrint('[OngoingCall] Calls SDK login failed: $e');
    }
  }

  void _joinSession() {
    final settings = (SessionSettingsBuilder()
          ..startAudioMuted(false)
          ..startVideoPaused(!widget.isVideo)
          ..setType(widget.isVideo ? SessionType.video : SessionType.audio))
        .build();

    CometChatCalls.joinSession(
      sessionId: widget.sessionId,
      sessionSettings: settings,
      onSuccess: (Widget? callWidget) {
        debugPrint('[OngoingCall] joinSession success. Widget returned: ${callWidget != null}');
        if (!mounted) return;
        setState(() {
          _callWidget = callWidget;
          _isJoining = false;
        });
        _callSession = CallSession.getInstance();
        _callSession?.addSessionStatusListener(this);
        _callSession?.addButtonClickListener(this);

        // Fallback poller in case SDK listeners don't fire
        _startEndCallPoller();
      },
      onError: (CometChatCallsException e) {
        debugPrint('[OngoingCall] ERROR joinSession: ${e.message}');
        if (!mounted) return;
        setState(() {
          _error = e.message ?? 'Failed to join call session';
          _isJoining = false;
        });
      },
    );
  }

  /// Polls every 2 seconds to detect session end as a safety net.
  void _startEndCallPoller() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) return false;
      final session = CallSession.getInstance();
      if (session == null && _callWidget != null) {
        debugPrint('[OngoingCall] Poller detected session ended');
        _endCallAndPop();
        return false;
      }
      return mounted;
    });
  }

  /// End the call properly and navigate back.
  ///
  /// This does THREE things:
  /// 1. Leaves the WebRTC session (local user disconnects from media)
  /// 2. Tells CometChat's signaling layer the call is ended (so it's no longer
  ///    "ongoing" and other users can start new calls)
  /// 3. Re-initializes the Calls SDK for future calls
  bool _hasPopped = false;

  Future<void> _endCallAndPop() async {
    if (_hasPopped) return;
    _hasPopped = true;

    // 1. Leave the WebRTC session
    try {
      await _callSession?.leaveSession();
    } catch (e) {
      debugPrint('[OngoingCall] leaveSession error (non-fatal): $e');
    }

    // 2. End the call in CometChat's signaling system.
    //    We try this for 1:1 calls; group meetings will gracefully fail since they lack a call entity.
    try {
      final endCompleter = Completer<void>();
      CometChat.endCall(
        widget.sessionId,
        onSuccess: (Call endedCall) {
          debugPrint('[OngoingCall] ✓ CometChat.endCall succeeded for session=${widget.sessionId}');
          if (!endCompleter.isCompleted) endCompleter.complete();
        },
        onError: (CometChatException e) {
          // Non-fatal: the session may already be ended by the other party or it's a group meeting
          debugPrint('[OngoingCall] endCall error (non-fatal): code=${e.code}, msg=${e.message}');
          if (!endCompleter.isCompleted) endCompleter.complete();
        },
      );
      await endCompleter.future;
    } catch (e) {
      debugPrint('[OngoingCall] endCall exception (non-fatal): $e');
    }

    // 3. Pop back to ticket detail immediately
    if (mounted) {
      Navigator.of(context, rootNavigator: true).pop();
    }
    
    // Step 4 (Re-init Calls SDK) was removed as initializing the native Calls SDK
    // multiple times during the app lifecycle causes a fatal crash on iOS.
  }

  // ─── SessionStatusListeners ───────────────────────────────────────

  @override
  void onSessionJoined() {
    debugPrint('[OngoingCall] Session joined');
  }

  @override
  void onSessionLeft() {
    debugPrint('[OngoingCall] Session left');
    _endCallAndPop();
  }

  @override
  void onConnectionClosed() {
    debugPrint('[OngoingCall] Connection closed');
    _endCallAndPop();
  }

  @override
  void onConnectionLost() {
    debugPrint('[OngoingCall] Connection lost');
  }

  @override
  void onConnectionRestored() {
    debugPrint('[OngoingCall] Connection restored');
  }

  @override
  void onSessionTimedOut() {
    debugPrint('[OngoingCall] Session timed out');
    _endCallAndPop();
  }

  // ─── ButtonClickListeners ─────────────────────────────────────────

  @override
  void onLeaveSessionButtonClicked() {
    debugPrint('[OngoingCall] Leave button clicked');
    _endCallAndPop();
  }

  @override
  void onChangeLayoutButtonClicked() {}
  @override
  void onChatButtonClicked() {}
  @override
  void onParticipantListButtonClicked() {}
  @override
  void onRaiseHandButtonClicked() {}
  @override
  void onRecordingToggleButtonClicked() {}
  @override
  void onShareInviteButtonClicked() {}
  @override
  void onSwitchCameraButtonClicked() {}
  @override
  void onToggleAudioButtonClicked() {}
  @override
  void onToggleVideoButtonClicked() {}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: Stack(
          children: [
            if (_isJoining)
              const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text('Connecting...', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ],
                ),
              )
            else if (_error != null)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 48),
                      const SizedBox(height: 16),
                      Text(_error!, style: const TextStyle(color: Colors.white, fontSize: 14), textAlign: TextAlign.center),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.of(context, rootNavigator: true).pop(),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                ),
              )
            else if (_callWidget != null)
              SizedBox.expand(child: _callWidget),
          ],
        ),
      ),
    );
  }
}
