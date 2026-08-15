import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/firestore_service.dart';
import '../utils/maintenance_insights.dart';
import '../utils/number_format.dart';
import '../utils/user_facing_error.dart';
import 'maintenance_detail_screen.dart';

class MaintenanceInsightsScreen extends StatefulWidget {
  final String vin;

  const MaintenanceInsightsScreen({super.key, required this.vin});

  @override
  State<MaintenanceInsightsScreen> createState() =>
      _MaintenanceInsightsScreenState();
}

class _MaintenanceInsightsScreenState
    extends State<MaintenanceInsightsScreen> {
  bool _loading = true;
  MaintenanceInsights? _insights;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final firestoreService = context.read<FirestoreService>();
      final entries = await firestoreService.getMaintenanceEntries(
        widget.vin,
      );
      if (!mounted) return;
      setState(() {
        _insights = computeMaintenanceInsights(entries);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback: 'Insights could not be loaded. Please try again.',
            ),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Maintenance Insights - ${widget.vin}')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _insights == null
          ? const Center(child: Text('No data available.'))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: _buildSections(context, _insights!),
              ),
            ),
    );
  }

  List<Widget> _buildSections(BuildContext context, MaintenanceInsights i) {
    if (i.totalEntries == 0) {
      return const [
        Padding(
          padding: EdgeInsets.fromLTRB(8, 32, 8, 0),
          child: Text(
            'Add maintenance entries — with photos or receipts attached — '
            'to see spend breakdowns and trends here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
        ),
      ];
    }

    return [
      _SummaryCard(insights: i),
      const SizedBox(height: 16),
      if (i.spendByCategory.isNotEmpty) ...[
        _SpendBreakdownCard(
          title: 'SPEND BY CATEGORY',
          entries: i.spendByCategory
              .map((c) => (label: c.label, amount: c.amount))
              .toList(),
          totalSpend: i.totalSpend,
        ),
        const SizedBox(height: 16),
      ],
      if (i.spendByMonth.length > 1) ...[
        _SpendTrendCard(spendByMonth: i.spendByMonth),
        const SizedBox(height: 16),
      ],
      if (i.needsReview.isNotEmpty)
        _NeedsReviewCard(
          candidates: i.needsReview,
          vin: widget.vin,
          onEntryUpdated: _load,
        ),
    ];
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.insights});

  final MaintenanceInsights insights;

  @override
  Widget build(BuildContext context) {
    final coveragePercent = (insights.documentationCoverage * 100).round();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Total maintenance spend: ${formatCurrencyAmount(insights.totalSpend)}',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${insights.totalEntries} entr${insights.totalEntries == 1 ? 'y' : 'ies'}'
              ' • ${insights.totalAttachments} attachment${insights.totalAttachments == 1 ? '' : 's'}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            Text(
              'Documentation coverage: $coveragePercent%',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            Text(
              '${insights.entriesWithAttachments} of ${insights.totalEntries} entries have at least one attached photo or document.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (insights.averageConfidence != null) ...[
              const SizedBox(height: 12),
              Text(
                'Average extraction confidence: '
                '${(insights.averageConfidence! * 100).round()}%',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              Text(
                'Across ${insights.analyzedAttachmentCount} analyzed attachment${insights.analyzedAttachmentCount == 1 ? '' : 's'}.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SpendBreakdownCard extends StatelessWidget {
  const _SpendBreakdownCard({
    required this.title,
    required this.entries,
    required this.totalSpend,
  });

  final String title;
  final List<({String label, double amount})> entries;
  final double totalSpend;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 10),
            ...entries.map((entry) {
              final fraction = totalSpend > 0
                  ? (entry.amount / totalSpend).clamp(0.0, 1.0)
                  : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    SizedBox(
                      width: 110,
                      child: Text(
                        entry.label,
                        style: Theme.of(context).textTheme.bodySmall,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: fraction,
                          minHeight: 8,
                          backgroundColor: Theme.of(
                            context,
                          ).colorScheme.surfaceContainerHighest,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 64,
                      child: Text(
                        formatCurrencyAmount(entry.amount),
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _SpendTrendCard extends StatelessWidget {
  const _SpendTrendCard({required this.spendByMonth});

  final List<MonthlySpend> spendByMonth;

  @override
  Widget build(BuildContext context) {
    // Cap to the most recent 12 months so a long history doesn't produce an
    // unreadably squeezed chart.
    final recent = spendByMonth.length > 12
        ? spendByMonth.sublist(spendByMonth.length - 12)
        : spendByMonth;
    // Scale against only the displayed months — an older, undisplayed spike
    // would otherwise flatten every visible bar against an invisible max.
    final maxAmount = recent
        .map((m) => m.amount)
        .fold<double>(0, (a, b) => a > b ? a : b);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'SPEND OVER TIME',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 120,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: recent.map((month) {
                  final heightFraction =
                      maxAmount > 0 ? month.amount / maxAmount : 0.0;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(
                            month.amount > 0
                                ? formatCurrencyAmount(month.amount)
                                : '',
                            style: const TextStyle(fontSize: 9),
                          ),
                          const SizedBox(height: 2),
                          Container(
                            height: 80 * heightFraction,
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            month.label,
                            style: const TextStyle(fontSize: 9),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NeedsReviewCard extends StatelessWidget {
  const _NeedsReviewCard({
    required this.candidates,
    required this.vin,
    required this.onEntryUpdated,
  });

  final List<ReviewCandidate> candidates;
  final String vin;
  final VoidCallback onEntryUpdated;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  size: 18,
                  color: Theme.of(context).colorScheme.tertiary,
                ),
                const SizedBox(width: 6),
                const Text(
                  'NEEDS REVIEW',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'These entries have an attachment our AI had low confidence '
              'reading — double-check the extracted cost, date, and mileage.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 8),
            ...candidates.map(
              (candidate) => ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                title: Text(candidate.entry.title),
                subtitle: Text(
                  '${(candidate.confidence * 100).round()}% confidence',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MaintenanceDetailScreen(
                        vin: vin,
                        entryId: candidate.entry.id,
                      ),
                    ),
                  );
                  if (result == true) {
                    onEntryUpdated();
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
