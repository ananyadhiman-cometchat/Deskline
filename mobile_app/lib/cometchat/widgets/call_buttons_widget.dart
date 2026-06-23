import 'dart:async';

import 'package:cometchat_calls_sdk/cometchat_calls_sdk.dart';
import 'package:cometchat_chat_uikit/cometchat_chat_uikit.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../core/theme/color_scheme.dart';

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

      final call = Call(
        receiverUid: isGroup ? widget.groupId! : widget.recipientUid,
        receiverType: isGroup
            ? CometChatReceiverType.group
            : CometChatReceiverType.user,
        type: callType,
      );

      CometChat.initiateCall(
        call,
        onSuccess: (Call initiatedCall) {
          debugPrint('[CallButtons] Call initiated successfully. sessionId=${initiatedCall.sessionId}');
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

  void _showOutgoingCallScreen(Call call) {
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        builder: (_) => _OngoingCallScreen(
          sessionId: call.sessionId!,
          isVideo: call.type == CometChatCallType.video,
          recipientUid: widget.recipientUid,
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

class _OngoingCallScreen extends StatefulWidget {
  final String sessionId;
  final bool isVideo;
  final String recipientUid;

  const _OngoingCallScreen({
    required this.sessionId,
    required this.isVideo,
    required this.recipientUid,
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
    // The Chat SDK is already init'd (CometChat.initiateCall succeeded),
    // but the Calls SDK has its own lifecycle.
    await _ensureCallsSdkReady();

    _joinSession();
  }

  /// Initialize + login the Calls SDK if not already done.
  Future<void> _ensureCallsSdkReady() async {
    try {
      // Check if already logged in
      final loggedInUser = CometChatCalls.getLoggedInUser();
      if (loggedInUser != null) {
        debugPrint('[OngoingCall] Calls SDK already logged in');
        return;
      }
    } catch (_) {
      // getLoggedInUser may throw if not initialized
    }

    try {
      // Init the Calls SDK
      const appId = '16802226f2533cd8a';
      const region = 'in';

      final callAppSettings = (CallAppSettingBuilder()
            ..appId = appId
            ..region = region)
          .build();

      final initCompleter = Completer<void>();
      CometChatCalls.init(
        callAppSettings,
        onSuccess: (_) {
          if (!initCompleter.isCompleted) initCompleter.complete();
        },
        onError: (CometChatCallsException e) {
          debugPrint('[OngoingCall] Calls SDK init error: ${e.message}');
          if (!initCompleter.isCompleted) initCompleter.completeError(e);
        },
      );
      await initCompleter.future;
      debugPrint('[OngoingCall] ✓ Calls SDK initialized');

      // Login with the auth token from the Chat SDK
      final authToken = await CometChat.getUserAuthToken();
      if (authToken != null && authToken.isNotEmpty) {
        final loginCompleter = Completer<void>();
        CometChatCalls.loginWithAuthToken(
          authToken: authToken,
          onSuccess: (_) {
            if (!loginCompleter.isCompleted) loginCompleter.complete();
          },
          onError: (CometChatCallsException e) {
            debugPrint('[OngoingCall] Calls SDK login error: ${e.message}');
            if (!loginCompleter.isCompleted) loginCompleter.completeError(e);
          },
        );
        await loginCompleter.future;
        debugPrint('[OngoingCall] ✓ Calls SDK logged in');
      }
    } catch (e) {
      debugPrint('[OngoingCall] Calls SDK setup failed: $e');
      // Continue anyway — joinSession might still work if the SDK was partially initialized
    }
  }

  void _joinSession() {
    final settings = (SessionSettingsBuilder()
          ..startAudioMuted(false)
          ..startVideoPaused(!widget.isVideo))
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
        // Register session listeners (like the official sample)
        _callSession = CallSession.getInstance();
        _callSession?.addSessionStatusListener(this);
        _callSession?.addButtonClickListener(this);
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

  /// Re-initialize the Calls SDK after a session ends (required per official sample —
  /// the SDK's internal state gets cleared after a session).
  Future<void> _reinitializeAndPop() async {
    try {
      const appId = '16802226f2533cd8a';
      const region = 'in';
      final callAppSettings = (CallAppSettingBuilder()
            ..appId = appId
            ..region = region)
          .build();
      final completer = Completer<void>();
      CometChatCalls.init(callAppSettings,
          onSuccess: (_) { if (!completer.isCompleted) completer.complete(); },
          onError: (_) { if (!completer.isCompleted) completer.complete(); });
      await completer.future;
    } catch (_) {}

    if (mounted) Navigator.of(context, rootNavigator: true).pop();
  }

  // ─── SessionStatusListeners ───────────────────────────────────────

  @override
  void onSessionJoined() {
    debugPrint('[OngoingCall] Session joined');
  }

  @override
  void onSessionLeft() {
    debugPrint('[OngoingCall] Session left');
    _reinitializeAndPop();
  }

  @override
  void onConnectionClosed() {
    debugPrint('[OngoingCall] Connection closed');
    _reinitializeAndPop();
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
    _reinitializeAndPop();
  }

  // ─── ButtonClickListeners ─────────────────────────────────────────

  @override
  void onLeaveSessionButtonClicked() {
    debugPrint('[OngoingCall] Leave button clicked');
    _reinitializeAndPop();
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
              // The SDK's call widget includes its own controls (mute, camera, end call)
              // — do NOT add custom controls on top of it.
              SizedBox.expand(child: _callWidget),
          ],
        ),
      ),
    );
  }
}
