import 'dart:async';
import 'dart:developer';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  MapboxMap? mapBoxMapController;
  StreamSubscription<geo.Position>? userPositionStream;
  geo.Position? _currentPosition;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _requestLocationPermission();
  }

  @override
  void dispose() {
    userPositionStream?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('جاري تحديد موقعك...'),
                ],
              ),
            )
          : _errorMessage != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _isLoading = true;
                        _errorMessage = null;
                      });
                      _requestLocationPermission();
                    },
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            )
          : MapWidget(
              onMapCreated: _onMapCreated,
              styleUri: MapboxStyles.STANDARD,
              cameraOptions: CameraOptions(
                center: Point(
                  coordinates: Position(
                    _currentPosition!.longitude,
                    _currentPosition!.latitude,
                  ),
                ),
                zoom: 15.0,
              ),
            ),
    );
  }

  void _onMapCreated(MapboxMap controller) {
    setState(() {
      mapBoxMapController = controller;
    });

    // تفعيل مكون الموقع
    mapBoxMapController?.location.updateSettings(
      LocationComponentSettings(enabled: true, pulsingEnabled: true),
    );
  }

  Future<void> _requestLocationPermission() async {
    // 1. التأكد من أن خدمة الموقع مفعلة
    final serviceEnabled = await geo.Geolocator.isLocationServiceEnabled();

    if (!serviceEnabled) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'خدمة الموقع غير مفعلة. يرجى تفعيلها من الإعدادات.';
      });
      debugPrint('Location service is disabled');
      return;
    }

    // 2. معرفة حالة الصلاحية
    var permission = await geo.Geolocator.checkPermission();

    // 3. طلب الصلاحية
    if (permission == geo.LocationPermission.denied) {
      permission = await geo.Geolocator.requestPermission();
    }

    // 4. المستخدم رفض
    if (permission == geo.LocationPermission.denied) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'تم رفض صلاحية الموقع. يرجى منح الصلاحية من الإعدادات.';
      });
      debugPrint('Location permission denied');
      return;
    }

    // 5. المستخدم رفض نهائيًا
    if (permission == geo.LocationPermission.deniedForever) {
      setState(() {
        _isLoading = false;
        _errorMessage =
            'تم رفض صلاحية الموقع نهائياً. يرجى منح الصلاحية من الإعدادات.';
      });
      debugPrint('Location permission permanently denied');
      return;
    }

    // 6. لدينا الصلاحية
    debugPrint('Location permission granted');

    // الحصول على الموقع الحالي
    await _getCurrentLocationAndCenterMap();

    // بدء الاستماع لتحديثات الموقع
    _startLocationStream();
  }

  // دالة للحصول على الموقع الحالي وتوسيط الخريطة عليه
  Future<void> _getCurrentLocationAndCenterMap() async {
    try {
      geo.Position position = await geo.Geolocator.getCurrentPosition(
        locationSettings: const geo.LocationSettings(
          accuracy: geo.LocationAccuracy.high,
        ),
      );

      setState(() {
        _currentPosition = position;
        _isLoading = false;
        _errorMessage = null;
      });

      debugPrint('Location found: ${position.latitude}, ${position.longitude}');
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'تعذر الحصول على موقعك. يرجى المحاولة مرة أخرى.';
      });
      debugPrint('Error getting current location: $e');
    }
  }

  // دالة لبدء الاستماع لتحديثات الموقع
  void _startLocationStream() {
    geo.LocationSettings locationSettings = geo.LocationSettings(
      accuracy: geo.LocationAccuracy.high,
      distanceFilter: 10, // تحديث عند تحرك 10 متر
    );

    userPositionStream?.cancel();
    userPositionStream =
        geo.Geolocator.getPositionStream(
          locationSettings: locationSettings,
        ).listen((geo.Position position) {
          if (mapBoxMapController != null && mounted) {
            setState(() {
              _currentPosition = position;
            });

            // تحديث الكاميرا عند تغير الموقع
            mapBoxMapController?.setCamera(
              CameraOptions(
                center: Point(
                  coordinates: Position(position.longitude, position.latitude),
                ),
                zoom: 15.0,
              ),
            );
            debugPrint(
              'Location updated: ${position.latitude}, ${position.longitude}',
            );
          }
        });
  }

  // دالة مساعدة لتحميل صورة الماركر (اختياري)
  Future<Uint8List> loadHQMarkerImage() async {
    var byteData = await rootBundle.load("assets/images/profile.png");
    return byteData.buffer.asUint8List();
  }
}
