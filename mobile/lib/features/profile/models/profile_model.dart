
class ProfileModel {
  final String id;
  final String email;
  final String fullName;
  final String phone;
  final String? profileImageUrl;

  ProfileModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phone,
    this.profileImageUrl,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      id: json['id'],
      email: json['email'],
      fullName: json['fullName'],
      phone: json['phone'],
      profileImageUrl: json['profileImageUrl'] ,
    );
  }

  ProfileModel copyWith({
  String? id,
  String? email,
  String? fullName,
  String? phone,
  String? profileImageUrl,
}) {
  return ProfileModel(
    id: id ?? this.id,
    email: email ?? this.email,
    fullName: fullName ?? this.fullName,
    phone: phone ?? this.phone,
    profileImageUrl: profileImageUrl ?? this.profileImageUrl,
  );
}
}
