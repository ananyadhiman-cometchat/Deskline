import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/admin_provider.dart';

class ActivityLogsScreen extends ConsumerWidget {
 const ActivityLogsScreen({super.key});
 @override Widget build(BuildContext context, WidgetRef ref){final logs=ref.watch(activityLogsProvider);return AppShell(child: logs.when(data:(items)=>Column(children:[const SectionHeader(title:'ACTIVITY LOGS'),const Padding(padding: EdgeInsets.all(8),child: TextField(decoration: InputDecoration(hintText:'Search activity logs by action/user'))),Padding(padding: const EdgeInsets.symmetric(horizontal:8),child: DropdownButtonFormField<String>(items: const [DropdownMenuItem(value:'all',child:Text('All Actions'))],onChanged:null)),Expanded(child: ListView(children: items.map((e)=>ListTile(title: Text(e.action),subtitle: Text(e.entityType))).toList()))]),loading:()=>const Center(child:CircularProgressIndicator()),error: (error, stackTrace)=>const Text('Error')));}
}