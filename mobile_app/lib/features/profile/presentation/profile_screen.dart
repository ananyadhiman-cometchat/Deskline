import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/layout/app_shell.dart';
import '../../auth/providers/auth_provider.dart';

 class ProfileScreen extends ConsumerStatefulWidget{
 const ProfileScreen({super.key});
 @override ConsumerState<ProfileScreen> createState()=>_P();}
 class _P extends ConsumerState<ProfileScreen>{bool editing=false;@override Widget build(BuildContext c){final user=ref.watch(authStateProvider).user;return AppShell(child:ListView(children:[Align(alignment:Alignment.centerLeft,child:IconButton(onPressed:()=>context.pop(),icon:const Icon(Icons.arrow_back))),if(editing)...[TextFormField(initialValue:user?.name),TextFormField(initialValue:user?.email)] else ...[ListTile(leading:const CircleAvatar(child:Icon(Icons.person)),title:Text(user?.name??'User')),ListTile(title:Text(user?.email??''))],ListTile(title:Text(user?.role.name??'')),ListTile(title:Text(user?.department.name??'')),ElevatedButton(onPressed:(){setState(()=>editing=!editing);},child:Text(editing?'Save':'Edit Profile'))]));}}
 