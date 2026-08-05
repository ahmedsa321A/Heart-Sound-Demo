/// User model mirroring the React User & UserProfile interfaces.
class User {
  final String id;
  final String fullName;
  final String email;
  final int? age;
  final String? gender;
  final String? phoneNumber;
  final String? address;
  final String? createdAt;

  const User({
    required this.id,
    required this.fullName,
    required this.email,
    this.age,
    this.gender,
    this.phoneNumber,
    this.address,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String? ?? json['_id'] as String? ?? '',
      fullName: json['fullName'] as String? ?? json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      age: json['age'] as int?,
      gender: json['gender'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      address: json['address'] as String?,
      createdAt: json['createdAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'fullName': fullName,
        'email': email,
        if (age != null) 'age': age,
        if (gender != null) 'gender': gender,
        if (phoneNumber != null) 'phoneNumber': phoneNumber,
        if (address != null) 'address': address,
      };

  User copyWith({
    String? id,
    String? fullName,
    String? email,
    int? age,
    String? gender,
    String? phoneNumber,
    String? address,
    String? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      address: address ?? this.address,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
