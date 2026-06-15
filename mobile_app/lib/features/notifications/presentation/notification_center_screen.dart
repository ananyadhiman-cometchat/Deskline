import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/layout/app_shell.dart';
import '../providers/notification_provider.dart';
import '../../../shared/services/refresh_service.dart';

class NotificationCenterScreen extends ConsumerStatefulWidget{
 const NotificationCenterScreen({super.key});
 @override ConsumerState<NotificationCenterScreen> createState()=>_N();
}
class _N extends ConsumerState<NotificationCenterScreen>{bool unread=false;@override Widget build(BuildContext c){var items=ref.watch(notificationListProvider);if(unread){items=items.where((e)=>!e.isRead).toList();}final today=items.where((e)=>DateTime.now().difference(e.createdAt).inDays<1).toList();final older=items.where((e)=>DateTime.now().difference(e.createdAt).inDays>=1).toList();return AppShell(child:RefreshIndicator(onRefresh:()=>RefreshService.refreshNotifications(ref),child:Column(children:[Align(alignment:Alignment.centerLeft,child:Tooltip(message:'Back',child:IconButton(onPressed:()=>context.pop(),icon:const Icon(Icons.arrow_back)))),SwitchListTile(value:unread,onChanged:(v)=>setState(()=>unread=v),title:const Text('Unread only')),Expanded(child:ListView(children:[const ListTile(title:Text('Today')),...today.map((n)=>ListTile(title:Text(n.title),subtitle:Text(n.body),trailing:TextButton(onPressed:(){},child:const Text('Read')))),const ListTile(title:Text('Older')),...older.map((n)=>ListTile(title:Text(n.title),subtitle:Text(n.body),trailing:TextButton(onPressed:(){},child:const Text('Read'))))]))])));}}