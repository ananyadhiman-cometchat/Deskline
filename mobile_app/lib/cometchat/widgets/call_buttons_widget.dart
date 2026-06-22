import 'package:cometchat_calls_sdk/cometchat_calls_sdk.dart';
import 'package:cometchat_chat_uikit/cometchat_chat_uikit.dart';
import 'package:flutter/material.dart';

import '../../core/theme/color_scheme.dart';

/// Custom call buttons widget for ticket detail pages.
///
/// Renders audio and video call buttons that initiate CometChat calls
/// in Ringing mode to the specified recipient. Uses the raw 5.x Calls SDK
/// with Chat SDK signaling (dual-SDK pattern).
///
/// Requirements: 7.1, 7.3, 7.6
class CallButtonsWidget extends StatefulWidget {
  /// The CometChat UID of the call recipient (agent or employee).
  final String recipientUid;

  /// Whether to show the video call button. Defaults to true.
  final bool showVideoButton;

  /// Whether to show the audio call button. Defaults to true.
  final bool showAudioButton;

  const CallButtonsWidget({
    super.key,
    required this.recipientUid,
    this.showVideoButton = true,
    this.showAudioButton = true,
  });

  @override
  State<CallButtonsWidget> createState() => _CallButtonsWidgetState();
}

class _CallButtonsWidgetState extends State<CallButtonsWidget> {
  bool _isInitiatingCall = false;

  /// Initiates a call to the recipient using CometChat Chat SDK signaling.
  Future<void> _initiateCall(String callType) async {
    if (_isInitiatingCall) return;

    setState(() => _isInitiatingCall = true);

    try {
      final call = Call(
        receiverUid: widget.recipientUid,
        receiverType: CometChatReceiverType.user,
        type: callType,
      );

      CometChat.initiateCall(
        call,
        onSuccess: (Call initiatedCall) {
          if (!mounted) return;
          setState(() => _isInitiatingCall = false);
          // Navigate to outgoing call screen with the session ID
          _showOutgoingCallScreen(initiatedCall);
        },
        onError: (CometChatException e) {
          if (!mounted) return;
          setState(() => _isInitiatingCall = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to initiate call: ${e.message ?? "Unknown error"}'),
            ),
          );
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isInitiatingCall = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Call failed: $e')),
        );
      }
    }
  }

  /// Navigates to the outgoing/ongoing call screen after call initiation.
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
            isLoading: _isInitiatingCall,
            onPressed: () => _initiateCall(CometChatCallType.audio),
          ),
        if (widget.showAudioButton && widget.showVideoButton)
          const SizedBox(width: 8),
        if (widget.showVideoButton)
          _CallButton(
            icon: Icons.videocam,
            label: 'Video',
            color: colors.textPrimary,
            isLoading: _isInitiatingCall,
            onPressed: () => _initiateCall(CometChatCallType.video),
          ),
      ],
    );
  }
}

/// Individual call button with icon and optional label.
class _CallButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool isLoading;
  final VoidCallback onPressed;

  const _CallButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.isLoading,
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
          onTap: isLoading ? null : onPressed,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: color,
                    ),
                  )
                : Icon(icon, color: color, size: 22),
          ),
        ),
      ),
    );
  }
}

/// Ongoing call screen that joins the WebRTC session via CometChatCalls.joinSession.
///
/// Renders the call widget returned by joinSession and provides
/// mute, camera toggle, and end call controls.
///
/// Requirements: 7.3, 7.6
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

class _OngoingCallScreenState extends State<_OngoingCallScreen> {
  Widget? _callWidget;
  bool _isMuted = false;
  bool _isCameraOff = false;
  bool _isJoining = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _joinSession();
  }

  /// Joins the WebRTC session using the 5.x Calls SDK.
  void _joinSession() {
    final settings = (SessionSettingsBuilder()
          ..startAudioMuted(false)
          ..startVideoPaused(!widget.isVideo))
        .build();

    CometChatCalls.joinSession(
      sessionId: widget.sessionId,
      sessionSettings: settings,
      onSuccess: (Widget? callWidget) {
        if (!mounted) return;
        setState(() {
          _callWidget = callWidget;
          _isJoining = false;
        });
      },
      onError: (CometChatCallsException e) {
        if (!mounted) return;
        setState(() {
          _error = e.message ?? 'Failed to join call session';
          _isJoining = false;
        });
      },
    );
  }

  /// Toggle audio mute using CallSession instance controls.
  void _toggleMute() {
    final session = CallSession.getInstance();
    if (session == null) return;

    if (_isMuted) {
      session.unMuteAudio();
    } else {
      session.muteAudio();
    }
    setState(() => _isMuted = !_isMuted);
  }

  /// Toggle camera on/off using CallSession instance controls.
  void _toggleCamera() {
    final session = CallSession.getInstance();
    if (session == null) return;

    if (_isCameraOff) {
      session.resumeVideo();
    } else {
      session.pauseVideo();
    }
    setState(() => _isCameraOff = !_isCameraOff);
  }

  /// End the call: leave session, abort foreground service, pop screen.
  Future<void> _endCall() async {
    await CallSession.getInstance()?.leaveSession();
    await CometChatOngoingCallService.abort();

    if (mounted) {
      Navigator.of(context, rootNavigator: true).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: Stack(
          children: [
            // Call view
            if (_isJoining)
              const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Connecting...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              )
            else if (_error != null)
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 48),
                    const SizedBox(height: 16),
                    Text(
                      _error!,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context, rootNavigator: true).pop(),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              )
            else if (_callWidget != null)
              SizedBox.expand(child: _callWidget),

            // Call controls overlay
            if (!_isJoining && _error == null)
              Positioned(
                left: 0,
                right: 0,
                bottom: 32,
                child: _CallControls(
                  isMuted: _isMuted,
                  isCameraOff: _isCameraOff,
                  onToggleMute: _toggleMute,
                  onToggleCamera: _toggleCamera,
                  onEndCall: _endCall,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Call control buttons: mute, camera toggle, end call.
///
/// Requirements: 7.6
class _CallControls extends StatelessWidget {
  final bool isMuted;
  final bool isCameraOff;
  final VoidCallback onToggleMute;
  final VoidCallback onToggleCamera;
  final VoidCallback onEndCall;

  const _CallControls({
    required this.isMuted,
    required this.isCameraOff,
    required this.onToggleMute,
    required this.onToggleCamera,
    required this.onEndCall,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Mute button
        Semantics(
          button: true,
          label: isMuted ? 'Unmute microphone' : 'Mute microphone',
          child: _ControlButton(
            icon: isMuted ? Icons.mic_off : Icons.mic,
            backgroundColor: isMuted ? Colors.white : Colors.white24,
            iconColor: isMuted ? Colors.black : Colors.white,
            onPressed: onToggleMute,
          ),
        ),
        const SizedBox(width: 20),
        // End call button
        Semantics(
          button: true,
          label: 'End call',
          child: _ControlButton(
            icon: Icons.call_end,
            backgroundColor: Colors.red,
            iconColor: Colors.white,
            size: 64,
            onPressed: onEndCall,
          ),
        ),
        const SizedBox(width: 20),
        // Camera toggle button
        Semantics(
          button: true,
          label: isCameraOff ? 'Turn camera on' : 'Turn camera off',
          child: _ControlButton(
            icon: isCameraOff ? Icons.videocam_off : Icons.videocam,
            backgroundColor: isCameraOff ? Colors.white : Colors.white24,
            iconColor: isCameraOff ? Colors.black : Colors.white,
            onPressed: onToggleCamera,
          ),
        ),
      ],
    );
  }
}

/// A circular call control button.
class _ControlButton extends StatelessWidget {
  final IconData icon;
  final Color backgroundColor;
  final Color iconColor;
  final double size;
  final VoidCallback onPressed;

  const _ControlButton({
    required this.icon,
    required this.backgroundColor,
    required this.iconColor,
    this.size = 52,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: backgroundColor,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: iconColor, size: size * 0.45),
      ),
    );
  }
}
