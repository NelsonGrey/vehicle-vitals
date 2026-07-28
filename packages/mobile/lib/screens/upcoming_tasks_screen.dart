import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../components/app_bottom_nav.dart';
import '../models/vehicle.dart';
import '../services/calendar_service.dart';
import '../services/firestore_service.dart';
import '../services/maintenance_plan_service.dart';
import '../theme/design_tokens.dart';
import '../theme/tailwind_utilities.dart';
import '../utils/number_format.dart';
import '../utils/user_facing_error.dart';
import 'maintenance_list_screen.dart';

class UpcomingTasksScreen extends StatefulWidget {
  const UpcomingTasksScreen({super.key});

  @override
  State<UpcomingTasksScreen> createState() => _UpcomingTasksScreenState();
}

class _UpcomingTasksScreenState extends State<UpcomingTasksScreen> {
  List<Map<String, dynamic>> _upcomingItems = [];
  List<Map<String, dynamic>> _savedReminders = [];
  Set<String> _savedReminderKeys = <String>{};
  Set<String> _savingReminderKeys = <String>{};
  Set<String> _actingReminderIds = <String>{};
  List<Map<String, String>> _calendarTargets = const [
    {'id': 'google', 'name': 'Google Calendar (opens app/browser)'},
    {'id': 'apple', 'name': 'Apple Calendar (share .ics file)'},
    {'id': 'ics', 'name': 'ICS file'},
  ];
  String _calendarTarget = 'google';
  bool _loading = true;
  final CalendarService _calendarService = CalendarService();
  final MaintenancePlanService _maintenancePlanService =
      MaintenancePlanService();
  // Vehicles whose make/model has no manufacturer interval data on file
  // (MaintenancePlan.modelSpecific is false, so the items shown are a
  // generic estimate, not real manufacturer data). Tracked separately so
  // the empty state can say "we don't have manufacturer data for this
  // vehicle" instead of the indistinguishable "all caught up, well
  // maintained."
  List<Vehicle> _unsupportedVehicles = [];

  String _buildReminderKey(String vin, String serviceType) =>
      '$vin:$serviceType';

  String _serviceTypeForItem(Map<String, dynamic> item) {
    return (item['id'] ?? item['description'] ?? 'maintenance').toString();
  }

  Map<String, dynamic>? _findReminder(String vin, String serviceType) {
    for (final reminder in _savedReminders) {
      if (reminder['vin'] == vin && reminder['serviceType'] == serviceType) {
        return reminder;
      }
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _loadUpcomingTasks();
  }

  Future<void> _loadUpcomingTasks() async {
    setState(() => _loading = true);

    try {
      final firestoreService = context.read<FirestoreService>();
      final vehicles = await firestoreService.getVehicles();
      final calendarPrefs = await _calendarService.getCalendarPreferences();
      final rawTargets = await _calendarService.getAvailableCalendars();

      final normalizedTargets = rawTargets
          .map(
            (target) => {
              'id': (target['id'] ?? '').toString(),
              'name': (target['name'] ?? target['id'] ?? '').toString(),
            },
          )
          .where((target) => target['id']!.isNotEmpty)
          .toList();

      var selectedCalendarTarget = (calendarPrefs['calendarId'] ?? 'google')
          .toString();
      if (normalizedTargets.isNotEmpty &&
          !normalizedTargets.any(
            (target) => target['id'] == selectedCalendarTarget,
          )) {
        selectedCalendarTarget = normalizedTargets.first['id']!;
      }

      final allUpcoming = <Map<String, dynamic>>[];
      final nextSavedReminders = <Map<String, dynamic>>[];
      final nextSavedReminderKeys = <String>{};
      final nextUnsupportedVehicles = <Vehicle>[];

      for (final vehicle in vehicles) {
        final currentMileage = vehicle.mileage;
        MaintenancePlan? plan;
        if (currentMileage > 0) {
          try {
            plan = await _maintenancePlanService.getMaintenancePlan(
              vin: vehicle.vin,
              currentMileage: currentMileage,
              make: vehicle.make,
              model: vehicle.model,
            );
          } catch (_) {
            // Leave plan null; treated as unsupported below.
          }
        }
        if (plan == null || !plan.modelSpecific) {
          nextUnsupportedVehicles.add(vehicle);
        }

        try {
          final reminders = await firestoreService.getReminders(vehicle.vin);
          for (final reminder in reminders) {
            final serviceType = (reminder['serviceType'] ?? 'maintenance')
                .toString();
            final status = (reminder['status'] ?? 'active').toString();
            nextSavedReminders.add({...reminder, 'vin': vehicle.vin});
            if (status != 'completed' && status != 'dismissed') {
              nextSavedReminderKeys.add(
                _buildReminderKey(vehicle.vin, serviceType),
              );
            }
          }
        } catch (e) {
          // Don't let one vehicle's bad data blank out every other
          // vehicle's already-loaded reminders.
          debugPrint('Failed to load reminders for ${vehicle.vin}: $e');
        }

        final upcoming = (plan?.items ?? const <MaintenancePlanItem>[]).map((
          item,
        ) {
          final milesUntilDue = (item.nextDueMileage - currentMileage).clamp(
            0,
            1 << 30,
          );
          return {
            'id': item.serviceType,
            'description': formatServiceTypeLabel(item.serviceType),
            'frequency':
                'Every ${formatWithCommas(item.intervalMiles)} miles or ${item.intervalMonths} months',
            'interval': item.intervalMiles,
            'nextDueMileage': item.nextDueMileage,
            'milesUntilDue': milesUntilDue,
          };
        });

        for (final item in upcoming) {
          allUpcoming.add({...item, 'vehicle': vehicle});
        }
      }

      // Sort by miles until due (most urgent first)
      allUpcoming.sort(
        (a, b) =>
            (a['milesUntilDue'] as int).compareTo(b['milesUntilDue'] as int),
      );

      setState(() {
        _upcomingItems = allUpcoming;
        _savedReminders = nextSavedReminders;
        _savedReminderKeys = nextSavedReminderKeys;
        _calendarTargets = normalizedTargets.isNotEmpty
            ? normalizedTargets
            : _calendarTargets;
        _calendarTarget = selectedCalendarTarget;
        _unsupportedVehicles = nextUnsupportedVehicles;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userFacingError(
                e,
                fallback:
                    'Maintenance Plan could not be loaded. Please try again.',
              ),
            ),
          ),
        );
      }
    }
  }

  Color _getUrgencyColor(int milesUntilDue) {
    final scheme = Theme.of(context).colorScheme;
    if (milesUntilDue <= 1000) return scheme.error;
    if (milesUntilDue <= 5000) return scheme.secondary;
    return scheme.primary;
  }

  Color _getUrgencyBackgroundColor(int milesUntilDue) {
    if (milesUntilDue <= 1000) {
      return Theme.of(context).colorScheme.error.withValues(alpha: 0.08);
    }
    if (milesUntilDue <= 5000) {
      return Theme.of(context).colorScheme.secondary.withValues(alpha: 0.1);
    }
    return Theme.of(context).colorScheme.primary.withValues(alpha: 0.08);
  }

  String _getUrgencyLabel(int milesUntilDue) {
    if (milesUntilDue <= 1000) return 'Urgent';
    if (milesUntilDue <= 5000) return 'Soon';
    return 'Upcoming';
  }

  // 35 mi/day matches web's "Average driving" default (packages/web/src
  // /pages/UpcomingTasks.tsx's effectiveDailyMiles) — previously this used
  // a separate, undocumented 100 mi/day assumption, so the same vehicle
  // could show a meaningfully different predicted due date on mobile vs.
  // web. Keep these two constants in sync.
  static const int _milesPerDay = 35;

  DateTime _estimateDueDate(int milesUntilDue) {
    final dayOffset = (milesUntilDue / _milesPerDay).ceil().clamp(1, 180);
    return DateTime.now().add(Duration(days: dayOffset));
  }

  Future<void> _addItemToCalendar(
    Vehicle vehicle,
    Map<String, dynamic> item,
  ) async {
    try {
      final dueDate = _estimateDueDate(item['milesUntilDue'] as int);
      final event = await _calendarService.addMaintenanceToCalendar(
        vehicleVin: vehicle.vin,
        title: item['description'] as String,
        description: 'Maintenance reminder from Vehicle-Vitals',
        dueDate: dueDate,
        vehicleInfo: '${vehicle.year} ${vehicle.make} ${vehicle.model}',
        target: _calendarTarget,
      );

      await _openCalendarDestination(event);

      if (!mounted) return;
      final target = (event['target'] ?? 'calendar').toString();
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Calendar event created for $target.'),
          backgroundColor: colorScheme.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      final colorScheme = Theme.of(context).colorScheme;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback: 'The calendar event could not be created. Try again.',
            ),
          ),
          backgroundColor: colorScheme.error,
        ),
      );
    }
  }

  Future<void> _openCalendarDestination(Map<String, dynamic> event) async {
    final actionUrl = (event['actionUrl'] ?? '').toString().trim();
    final downloadUrl = (event['downloadUrl'] ?? '').toString().trim();

    if (actionUrl.isNotEmpty) {
      final actionUri = Uri.tryParse(actionUrl);
      if (actionUri != null) {
        final launched = await launchUrl(
          actionUri,
          mode: LaunchMode.externalApplication,
        );
        if (launched) {
          return;
        }
      }
    }

    if (downloadUrl.isEmpty) {
      return;
    }

    if (downloadUrl.startsWith('data:text/calendar')) {
      final separatorIndex = downloadUrl.indexOf(',');
      if (separatorIndex == -1) {
        return;
      }

      final encodedPayload = downloadUrl.substring(separatorIndex + 1);
      final decodedPayload = Uri.decodeComponent(encodedPayload);
      final tempDir = await getTemporaryDirectory();
      final icsFile = File(
        '${tempDir.path}/vehicle-vitals-${DateTime.now().millisecondsSinceEpoch}.ics',
      );
      await icsFile.writeAsString(decodedPayload);

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(icsFile.path)],
          text: 'Calendar event from Vehicle-Vitals',
        ),
      );
      return;
    }

    final downloadUri = Uri.tryParse(downloadUrl);
    if (downloadUri != null) {
      await launchUrl(downloadUri, mode: LaunchMode.externalApplication);
    }
  }

  String _calendarTargetLabel() {
    for (final target in _calendarTargets) {
      if (target['id'] == _calendarTarget) {
        return target['name'] ?? _calendarTarget;
      }
    }
    return _calendarTarget;
  }

  Future<void> _saveReminder(Vehicle vehicle, Map<String, dynamic> item) async {
    final firestoreService = context.read<FirestoreService>();
    final colorScheme = Theme.of(context).colorScheme;
    final serviceType = _serviceTypeForItem(item);
    final reminderKey = _buildReminderKey(vehicle.vin, serviceType);

    if (_savedReminderKeys.contains(reminderKey)) {
      return;
    }

    setState(() {
      _savingReminderKeys = {..._savingReminderKeys, reminderKey};
    });

    try {
      final created = await firestoreService.addReminder(vehicle.vin, {
        'title': item['description'],
        'description': '${vehicle.year} ${vehicle.make} ${vehicle.model}',
        'serviceType': serviceType,
        'frequency': item['frequency'],
        'interval': item['interval'],
        'nextDueMileage': item['nextDueMileage'],
        'milesUntilDue': item['milesUntilDue'],
        'status': 'active',
      });

      if (!mounted) return;
      setState(() {
        _savedReminders = [
          {...created, 'vin': vehicle.vin, 'serviceType': serviceType},
          ..._savedReminders,
        ];
        _savedReminderKeys = {..._savedReminderKeys, reminderKey};
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Reminder saved.'),
          backgroundColor: colorScheme.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback: 'The reminder could not be saved. Try again.',
            ),
          ),
          backgroundColor: colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _savingReminderKeys = {..._savingReminderKeys}..remove(reminderKey);
        });
      }
    }
  }

  Future<void> _completeReminder(Map<String, dynamic> reminder) async {
    final reminderId = reminder['id']?.toString();
    final vin = reminder['vin']?.toString();
    final serviceType = (reminder['serviceType'] ?? 'maintenance').toString();
    if (reminderId == null || vin == null) return;

    final colorScheme = Theme.of(context).colorScheme;
    setState(() {
      _actingReminderIds = {..._actingReminderIds, reminderId};
    });
    try {
      await context.read<FirestoreService>().completeReminder(vin, reminderId);
      if (!mounted) return;
      setState(() {
        _savedReminders = _savedReminders
            .map(
              (r) => r['id'] == reminderId ? {...r, 'status': 'completed'} : r,
            )
            .toList();
        _savedReminderKeys = {..._savedReminderKeys}
          ..remove(_buildReminderKey(vin, serviceType));
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Reminder marked complete.'),
          backgroundColor: colorScheme.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback: 'The reminder could not be completed. Try again.',
            ),
          ),
          backgroundColor: colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _actingReminderIds = {..._actingReminderIds}..remove(reminderId);
        });
      }
    }
  }

  Future<void> _snoozeReminder(Map<String, dynamic> reminder) async {
    final reminderId = reminder['id']?.toString();
    final vin = reminder['vin']?.toString();
    if (reminderId == null || vin == null) return;

    final colorScheme = Theme.of(context).colorScheme;
    final snoozedUntil = DateTime.now()
        .add(const Duration(days: 14))
        .toIso8601String()
        .split('T')
        .first;

    setState(() {
      _actingReminderIds = {..._actingReminderIds, reminderId};
    });
    try {
      await context.read<FirestoreService>().snoozeReminder(
        vin,
        reminderId,
        snoozedUntil,
      );
      if (!mounted) return;
      setState(() {
        _savedReminders = _savedReminders
            .map(
              (r) => r['id'] == reminderId
                  ? {...r, 'status': 'snoozed', 'snoozedUntil': snoozedUntil}
                  : r,
            )
            .toList();
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Reminder snoozed for 14 days.'),
          backgroundColor: colorScheme.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback: 'The reminder could not be snoozed. Try again.',
            ),
          ),
          backgroundColor: colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _actingReminderIds = {..._actingReminderIds}..remove(reminderId);
        });
      }
    }
  }

  Future<void> _dismissReminder(Map<String, dynamic> reminder) async {
    final reminderId = reminder['id']?.toString();
    final vin = reminder['vin']?.toString();
    final serviceType = (reminder['serviceType'] ?? 'maintenance').toString();
    if (reminderId == null || vin == null) return;

    final colorScheme = Theme.of(context).colorScheme;
    setState(() {
      _actingReminderIds = {..._actingReminderIds, reminderId};
    });
    try {
      await context.read<FirestoreService>().dismissReminder(vin, reminderId);
      if (!mounted) return;
      setState(() {
        _savedReminders = _savedReminders
            .map(
              (r) => r['id'] == reminderId ? {...r, 'status': 'dismissed'} : r,
            )
            .toList();
        _savedReminderKeys = {..._savedReminderKeys}
          ..remove(_buildReminderKey(vin, serviceType));
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Reminder dismissed.'),
          backgroundColor: colorScheme.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback: 'The reminder could not be dismissed. Try again.',
            ),
          ),
          backgroundColor: colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _actingReminderIds = {..._actingReminderIds}..remove(reminderId);
        });
      }
    }
  }

  Future<void> _restoreReminder(Map<String, dynamic> reminder) async {
    final reminderId = reminder['id']?.toString();
    final vin = reminder['vin']?.toString();
    final serviceType = (reminder['serviceType'] ?? 'maintenance').toString();
    if (reminderId == null || vin == null) return;

    final colorScheme = Theme.of(context).colorScheme;
    setState(() {
      _actingReminderIds = {..._actingReminderIds, reminderId};
    });
    try {
      await context.read<FirestoreService>().reopenReminder(vin, reminderId);
      if (!mounted) return;
      setState(() {
        _savedReminders = _savedReminders
            .map((r) => r['id'] == reminderId ? {...r, 'status': 'active'} : r)
            .toList();
        _savedReminderKeys = {
          ..._savedReminderKeys,
          _buildReminderKey(vin, serviceType),
        };
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Reminder restored.'),
          backgroundColor: colorScheme.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            userFacingError(
              e,
              fallback: 'The reminder could not be restored. Try again.',
            ),
          ),
          backgroundColor: colorScheme.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _actingReminderIds = {..._actingReminderIds}..remove(reminderId);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Maintenance Plan')),
        body: const Center(child: CircularProgressIndicator()),
        bottomNavigationBar: const AppBottomNav(currentIndex: 1),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance Plan'),
        actions: [
          IconButton(
            icon: const Icon(Icons.storefront_outlined),
            tooltip: 'Shops & Services',
            onPressed: () => context.push('/app/service-providers'),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadUpcomingTasks,
          ),
        ],
      ),
      body: _upcomingItems.isEmpty ? _buildEmptyState() : _buildUpcomingList(),
      bottomNavigationBar: const AppBottomNav(currentIndex: 1),
    );
  }

  Widget _buildEmptyState() {
    final missingScheduleData = _unsupportedVehicles.isNotEmpty;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              missingScheduleData ? Icons.info_outline : Icons.event_available,
              size: 64,
              color: AppDesignTokens.colorScheme(
                Theme.of(context).brightness,
              ).primary,
            ),
            const SizedBox(height: 16),
            Text(
              missingScheduleData
                  ? 'Recommendations are not available yet'
                  : 'No upcoming items found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              missingScheduleData
                  ? 'Add current mileage and recent service records, then check the owner’s manual for manufacturer requirements.'
                  : 'There are no saved reminders or available recommendations right now. This is not a guarantee that maintenance is complete.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(
                  context,
                ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
              ),
            ),
            if (missingScheduleData) ...[
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  "We don't have manufacturer maintenance data for "
                  '${_unsupportedVehicles.map((v) => '${v.year} ${v.make} ${v.model}').join(', ')}, '
                  'so confirm requirements for '
                  '${_unsupportedVehicles.length == 1 ? 'this vehicle' : 'these vehicles'} before relying on the plan.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.tertiary,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 8,
              children: [
                ElevatedButton(
                  onPressed: () => context.go('/app'),
                  child: const Text('Review Garage'),
                ),
                TextButton(
                  onPressed: () => context.push('/app/instructions'),
                  child: const Text('Open Help'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingList() {
    final urgentCount = _upcomingItems
        .where((item) => (item['milesUntilDue'] as int) <= 1000)
        .length;
    final soonCount = _upcomingItems
        .where(
          (item) =>
              (item['milesUntilDue'] as int) > 1000 &&
              (item['milesUntilDue'] as int) <= 5000,
        )
        .length;

    return Column(
      children: [
        Container(
          margin: EdgeInsets.fromLTRB(
            TwSpace.s4,
            TwSpace.s4,
            TwSpace.s4,
            TwSpace.s3,
          ),
          padding: EdgeInsets.all(TwSpace.s4),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(TwRadius.lg),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Reminder Center',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              SizedBox(height: TwSpace.s2),
              Text(
                'Urgent: $urgentCount  •  Soon: $soonCount  •  Queue: ${_upcomingItems.length}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              SizedBox(height: TwSpace.s2),
              Text(
                'Recommendations shown are based on available vehicle and service data.',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
              ),
              SizedBox(height: TwSpace.s2),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'New events go to: ${_calendarTargetLabel()}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.push('/app/calendar-preferences'),
                    child: const Text('Change'),
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: EdgeInsets.fromLTRB(TwSpace.s4, 0, TwSpace.s4, TwSpace.s4),
            itemCount: _upcomingItems.length + 1, // +1 for legend
            itemBuilder: (context, index) {
              if (index == _upcomingItems.length) {
                return _buildLegend();
              }

              final item = _upcomingItems[index];
              final vehicle = item['vehicle'] as Vehicle;
              final serviceType = _serviceTypeForItem(item);
              final reminder = _findReminder(vehicle.vin, serviceType);
              final reminderStatus = (reminder?['status'] ?? '').toString();
              final reminderKey = _buildReminderKey(vehicle.vin, serviceType);
              final isReminderBusy =
                  _savingReminderKeys.contains(reminderKey) ||
                  (reminder != null &&
                      _actingReminderIds.contains(
                        reminder['id']?.toString() ?? '',
                      ));
              final milesUntilDue = item['milesUntilDue'] as int;

              return Card(
                margin: EdgeInsets.only(bottom: TwSpace.s3),
                color: _getUrgencyBackgroundColor(milesUntilDue),
                child: Padding(
                  padding: EdgeInsets.all(TwSpace.s4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item['description'] as String,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ),
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: TwSpace.s2,
                              vertical: TwSpace.s1,
                            ),
                            decoration: BoxDecoration(
                              color: _getUrgencyColor(
                                milesUntilDue,
                              ).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(TwRadius.sm),
                              border: Border.all(
                                color: _getUrgencyColor(
                                  milesUntilDue,
                                ).withValues(alpha: 0.3),
                              ),
                            ),
                            child: Text(
                              _getUrgencyLabel(milesUntilDue),
                              style: TextStyle(
                                color: _getUrgencyColor(milesUntilDue),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          if (reminder != null) ...[
                            SizedBox(width: TwSpace.s2),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: TwSpace.s2,
                                vertical: TwSpace.s1,
                              ),
                              decoration: BoxDecoration(
                                color: Theme.of(
                                  context,
                                ).colorScheme.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(
                                  TwRadius.sm,
                                ),
                              ),
                              child: Text(
                                'Reminder: ${reminderStatus.isEmpty ? 'active' : reminderStatus}',
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.primary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      SizedBox(height: TwSpace.s2),
                      Text(
                        '${vehicle.year} ${vehicle.make} ${vehicle.model}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(
                            context,
                          ).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
                        ),
                      ),
                      SizedBox(height: TwSpace.s1),
                      Text(
                        item['frequency'] as String,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(
                            context,
                          ).textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                        ),
                      ),
                      SizedBox(height: TwSpace.s3),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Due at: ${formatWithCommas(item['nextDueMileage'] as int)} miles',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.color
                                      ?.withValues(alpha: 0.7),
                                ),
                          ),
                          Text(
                            'Miles until due: ${formatWithCommas(milesUntilDue)}',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.color
                                      ?.withValues(alpha: 0.7),
                                ),
                          ),
                          SizedBox(height: TwSpace.s3),
                          Wrap(
                            spacing: TwSpace.s2,
                            runSpacing: TwSpace.s2,
                            children: [
                              OutlinedButton(
                                onPressed: () =>
                                    _addItemToCalendar(vehicle, item),
                                child: const Text('Add to Calendar'),
                              ),
                              OutlinedButton(
                                onPressed: isReminderBusy
                                    ? null
                                    : reminder == null
                                    ? () => _saveReminder(vehicle, item)
                                    : () {
                                        showModalBottomSheet<void>(
                                          context: context,
                                          builder: (context) {
                                            return SafeArea(
                                              child: Column(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  if (reminderStatus !=
                                                      'completed')
                                                    ListTile(
                                                      leading: const Icon(
                                                        Icons
                                                            .check_circle_outline,
                                                      ),
                                                      title: const Text(
                                                        'Mark Reminder Complete',
                                                      ),
                                                      onTap: () {
                                                        Navigator.of(
                                                          context,
                                                        ).pop();
                                                        _completeReminder(
                                                          reminder,
                                                        );
                                                      },
                                                    ),
                                                  if (reminderStatus !=
                                                      'snoozed')
                                                    ListTile(
                                                      leading: const Icon(
                                                        Icons.snooze,
                                                      ),
                                                      title: const Text(
                                                        'Snooze 14 Days',
                                                      ),
                                                      onTap: () {
                                                        Navigator.of(
                                                          context,
                                                        ).pop();
                                                        _snoozeReminder(
                                                          reminder,
                                                        );
                                                      },
                                                    ),
                                                  if (reminderStatus !=
                                                      'dismissed')
                                                    ListTile(
                                                      leading: const Icon(
                                                        Icons.cancel,
                                                      ),
                                                      title: const Text(
                                                        'Dismiss',
                                                      ),
                                                      onTap: () {
                                                        Navigator.of(
                                                          context,
                                                        ).pop();
                                                        _dismissReminder(
                                                          reminder,
                                                        );
                                                      },
                                                    ),
                                                  if (reminderStatus ==
                                                          'dismissed' ||
                                                      reminderStatus ==
                                                          'completed')
                                                    ListTile(
                                                      leading: const Icon(
                                                        Icons.restore,
                                                      ),
                                                      title: const Text(
                                                        'Restore',
                                                      ),
                                                      onTap: () {
                                                        Navigator.of(
                                                          context,
                                                        ).pop();
                                                        _restoreReminder(
                                                          reminder,
                                                        );
                                                      },
                                                    ),
                                                ],
                                              ),
                                            );
                                          },
                                        );
                                      },
                                child: Text(
                                  reminder == null
                                      ? 'Save Reminder'
                                      : 'Reminder Actions',
                                ),
                              ),
                              ElevatedButton(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          MaintenanceListScreen(
                                            vin: vehicle.vin,
                                          ),
                                    ),
                                  );
                                },
                                child: const Text('Mark Complete'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLegend() {
    return Container(
      margin: EdgeInsets.only(top: TwSpace.s4),
      padding: EdgeInsets.all(TwSpace.s4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(TwRadius.lg),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Legend',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: Theme.of(
                context,
              ).textTheme.titleSmall?.color?.withValues(alpha: 0.7),
            ),
          ),
          SizedBox(height: TwSpace.s2),
          Row(
            children: [
              _buildLegendItem(
                'Urgent (≤1,000 miles)',
                Theme.of(context).colorScheme.error.withValues(alpha: 0.2),
                Theme.of(context).colorScheme.error,
              ),
              SizedBox(width: TwSpace.s4),
              _buildLegendItem(
                'Soon (≤5,000 miles)',
                Theme.of(context).colorScheme.secondary.withValues(alpha: 0.2),
                Theme.of(context).colorScheme.secondary,
              ),
              SizedBox(width: TwSpace.s4),
              _buildLegendItem(
                'Upcoming (>5,000 miles)',
                Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                Theme.of(context).colorScheme.primary,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(
    String label,
    Color backgroundColor,
    Color textColor,
  ) {
    return Expanded(
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          SizedBox(width: TwSpace.s2),
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: textColor, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
