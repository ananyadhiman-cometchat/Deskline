import 'package:flutter/material.dart';

import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/section_header.dart';
import '../../../shared/enums/department.dart';
import '../../../shared/models/agent_workload.dart';

class AgentLoadViewScreen extends StatelessWidget {
  const AgentLoadViewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const workloads = [
      AgentWorkload(
        userId: '1',
        name: 'Agent Smith',
        department: Department.it,
        openCount: 4,
        inProgressCount: 3,
        resolvedCount: 21,
      ),
      AgentWorkload(
        userId: '2',
        name: 'Agent Jane',
        department: Department.hr,
        openCount: 2,
        inProgressCount: 1,
        resolvedCount: 18,
      ),
    ];

    return AppShell(
      child: ListView(
        children: [
          const SectionHeader(title: 'AGENT LOAD VIEW'),
          ...workloads.map(
            (w) => Card(
              child: ListTile(
                title: Text(w.name),
                subtitle: Text(
                  'Open: ${w.openCount} | In Progress: ${w.inProgressCount} | Resolved: ${w.resolvedCount}',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
