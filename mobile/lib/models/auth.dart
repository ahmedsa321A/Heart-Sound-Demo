import 'user.dart';

/// Registration data mirroring the React RegisterData interface.
class RegisterData {
  final String? fullName;
  final String? email;
  final String? password;
  final int? age;
  final String? gender;
  final String? familyHistory;
  final String? hypertension;
  final String? diabetes;
  final String? renalPathologies;
  final List<String>? chronicCardiac;

  const RegisterData({
    this.fullName,
    this.email,
    this.password,
    this.age,
    this.gender,
    this.familyHistory,
    this.hypertension,
    this.diabetes,
    this.renalPathologies,
    this.chronicCardiac,
  });

  Map<String, dynamic> toJson() => {
        if (fullName != null) 'fullName': fullName,
        if (email != null) 'email': email,
        if (password != null) 'password': password,
        if (age != null) 'age': age,
        if (gender != null) 'gender': gender,
        if (familyHistory != null) 'familyHistory': familyHistory,
        if (hypertension != null) 'hypertension': hypertension,
        if (diabetes != null) 'diabetes': diabetes,
        if (renalPathologies != null) 'renalPathologies': renalPathologies,
        if (chronicCardiac != null) 'chronicCardiac': chronicCardiac,
      };

  RegisterData copyWith({
    String? fullName,
    String? email,
    String? password,
    int? age,
    String? gender,
    String? familyHistory,
    String? hypertension,
    String? diabetes,
    String? renalPathologies,
    List<String>? chronicCardiac,
  }) {
    return RegisterData(
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      password: password ?? this.password,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      familyHistory: familyHistory ?? this.familyHistory,
      hypertension: hypertension ?? this.hypertension,
      diabetes: diabetes ?? this.diabetes,
      renalPathologies: renalPathologies ?? this.renalPathologies,
      chronicCardiac: chronicCardiac ?? this.chronicCardiac,
    );
  }

  RegisterData merge(RegisterData other) {
    return RegisterData(
      fullName: other.fullName ?? fullName,
      email: other.email ?? email,
      password: other.password ?? password,
      age: other.age ?? age,
      gender: other.gender ?? gender,
      familyHistory: other.familyHistory ?? familyHistory,
      hypertension: other.hypertension ?? hypertension,
      diabetes: other.diabetes ?? diabetes,
      renalPathologies: other.renalPathologies ?? renalPathologies,
      chronicCardiac: other.chronicCardiac ?? chronicCardiac,
    );
  }
}

class LoginCredentials {
  final String email;
  final String password;

  const LoginCredentials({required this.email, required this.password});

  Map<String, dynamic> toJson() => {'email': email, 'password': password};
}

class AuthResponse {
  final User? user;
  final String? msg;
  final bool success;

  const AuthResponse({this.user, this.msg, this.success = false});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      user: json['user'] != null
          ? User.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      msg: json['msg'] as String? ?? json['message'] as String?,
      success: json['success'] as bool? ?? false,
    );
  }
}

class VerifyOtpData {
  final String email;
  final String otp;

  const VerifyOtpData({required this.email, required this.otp});

  Map<String, dynamic> toJson() => {'email': email, 'otp': otp};
}
