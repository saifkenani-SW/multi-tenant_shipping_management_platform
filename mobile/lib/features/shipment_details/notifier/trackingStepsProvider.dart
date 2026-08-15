
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/shipment_details/models/TrackingStepModel.dart';

final trackingStepsProvider = Provider<List<TrackingStepModel>>((ref) {
  return [
    TrackingStepModel(
      title: 'Created',
      subtitle: 'Oct 12, 09:15 AM',
      isCompleted: true,
      isCurrent: false,
    ),
    TrackingStepModel(
      title: 'Picked Up',
      subtitle: 'Oct 12, 02:30 PM',
      isCompleted: true,
      isCurrent: false,
    ),
    TrackingStepModel(
      title: 'In Transit',
      subtitle: 'Arrived at Hub 4',
      isCompleted: true,
      isCurrent: true,
    ),
    TrackingStepModel(
      title: 'Delivered',
      subtitle: 'Estimated Oct 15',
      isCompleted: false,
      isCurrent: false,
    ),
  ];
});
