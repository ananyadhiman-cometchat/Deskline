import 'package:flutter/material.dart';

import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/section_header.dart';

class TicketReassignmentScreen extends StatefulWidget {
  const TicketReassignmentScreen({super.key});

  @override
  State<TicketReassignmentScreen> createState() => _TicketReassignmentScreenState();
}

class _TicketReassignmentScreenState extends State<TicketReassignmentScreen> {
  String agent = 'Agent Smith';

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: ListView(
        children: [
          const SectionHeader(title: 'TICKET REASSIGNMENT'),
          DropdownButton<String>(
            value: agent,
            items: const [
              DropdownMenuItem(value: 'Agent Smith', child: Text('Agent Smith')),
              DropdownMenuItem(value: 'Agent Jane', child: Text('Agent Jane')),
            ],
            onChanged: (v) => setState(() => agent = v!),
          ),
          ElevatedButton(
            onPressed: () {},
            child: const Text('Reassign Ticket'),
          ),
        ],
      ),
    );
  }
}
