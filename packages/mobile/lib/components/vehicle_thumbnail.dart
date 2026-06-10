import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../models/vehicle.dart';

class VehicleThumbnail extends StatelessWidget {
  final Vehicle vehicle;
  final double width;
  final double height;

  const VehicleThumbnail({
    super.key,
    required this.vehicle,
    this.width = 72,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = (vehicle.photoUrl ?? '').trim();
    if (imageUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: CachedNetworkImage(
          imageUrl: imageUrl,
          width: width,
          height: height,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            width: width,
            height: height,
            color: Colors.grey.shade200,
            child: const Icon(Icons.directions_car, size: 20),
          ),
          errorWidget: (context, url, error) => Container(
            width: width,
            height: height,
            color: Colors.grey.shade200,
            child: const Icon(Icons.directions_car, size: 20),
          ),
        ),
      );
    }

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(Icons.directions_car, size: 20),
    );
  }
}
