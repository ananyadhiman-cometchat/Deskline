import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/admin_provider.dart';
import '../widgets/user_table.dart';

class UserManagementScreen extends ConsumerWidget {
 const UserManagementScreen({super.key});
 @override Widget build(BuildContext context, WidgetRef ref){final users=ref.watch(mockUsersProvider);return AppShell(child: users.when(data:(data)=>ListView(children:[const SectionHeader(title:'USER MANAGEMENT'),Row(children:[ElevatedButton(onPressed:(){showDialog(context: context,builder:(context)=>const AlertDialog(title:Text('Create User'),content:Text('Create user workflow ready for repository wiring.')));}, child: const Text('Create User')),const SizedBox(width:8),ElevatedButton(onPressed:(){showDialog(context: context,builder:(context)=>const AlertDialog(title:Text('Edit User'),content:Text('Select a user from the table to edit.')));}, child: const Text('Edit User')),const SizedBox(width:8),ElevatedButton(onPressed:(){showDialog(context: context,builder:(context)=>AlertDialog(title: const Text('Deactivate User'),content: const Text('Deactivate selected user?'),actions:[TextButton(onPressed:()=>Navigator.of(context).pop(), child: const Text('Cancel')),TextButton(onPressed:()=>Navigator.of(context).pop(), child: const Text('Confirm'))]));}, child: const Text('Deactivate'))]),UserTable(users:data)]),loading:()=>const Center(child:CircularProgressIndicator()),error: (error, stackTrace)=>const Text('Error')));}
}