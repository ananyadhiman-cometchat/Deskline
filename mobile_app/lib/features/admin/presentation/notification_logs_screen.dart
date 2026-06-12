import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/admin_provider.dart';

class NotificationLogsScreen extends ConsumerWidget {
  const NotificationLogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationLogsProvider);
    return AppShell(child: notifications.when(data:(items)=>Column(children:[const SectionHeader(title:'NOTIFICATION LOGS'),const Padding(padding: EdgeInsets.all(8),child: TextField(decoration: InputDecoration(hintText:'Filter notifications'))),Padding(padding: const EdgeInsets.symmetric(horizontal:8),child: DropdownButtonFormField<String>(items: const [DropdownMenuItem(value:'all',child:Text('All Types'))],onChanged:null)),Expanded(child: ListView(children: items.map((n)=>ListTile(title: Text(n.title),subtitle: Text(n.body))).toList()))]),loading:()=>const Center(child:CircularProgressIndicator()),error: (error, stackTrace)=>const Text('Error')));
  }
}
