import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/admin_provider.dart';
import '../widgets/analytics_cards.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analytics = ref.watch(ticketAnalyticsProvider);
    return AppShell(
      child: analytics.when(
        data: (data) => ListView(children:[const SectionHeader(title:'ANALYTICS'),AnalyticsCards(analytics:data)]),
        loading: ()=> const Center(child:CircularProgressIndicator()),
        error: (error, stackTrace)=> const Text('Error'),
      ),
    );
  }
}
