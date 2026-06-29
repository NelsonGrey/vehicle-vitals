class GarageContext {
  final String userId;
  final String? orgId;
  final String? orgType;
  final String garageStorageMode;

  const GarageContext({
    required this.userId,
    this.orgId,
    this.orgType,
    this.garageStorageMode = 'user_scoped',
  });

  bool get usesOrgScopedVehicles =>
      orgId != null &&
      (garageStorageMode == 'org_scoped' ||
          garageStorageMode == 'dual_write');
}

bool isPreferencesVehicle(String vin) {
  return vin.trim().toLowerCase() == 'preferences';
}

String buildVehicleCollectionPath(
  GarageContext context, {
  String? vin,
}) {
  final useOrgScope =
      !isPreferencesVehicle(vin ?? '') && context.usesOrgScopedVehicles;

  if (useOrgScope) {
    return 'orgs/${context.orgId}/vehicles';
  }

  return 'users/${context.userId}/vehicles';
}

String buildVehicleDocumentPath(
  GarageContext context,
  String vin,
) {
  return '${buildVehicleCollectionPath(context, vin: vin)}/$vin';
}

String buildVehicleChildCollectionPath(
  GarageContext context,
  String vin,
  String childCollection,
) {
  return '${buildVehicleDocumentPath(context, vin)}/$childCollection';
}

String buildVehicleStorageBasePath(
  GarageContext context,
  String vin,
) {
  return buildVehicleDocumentPath(context, vin);
}
