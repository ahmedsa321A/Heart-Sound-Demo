import 'package:easy_localization/easy_localization.dart';

/// Validation error map (field name → error message).
typedef ValidationErrors = Map<String, String>;

final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Validate login form — mirrors React validateLogin.
ValidationErrors validateLogin({
  required String email,
  required String password,
}) {
  final errors = <String, String>{};

  if (email.trim().isEmpty) {
    errors['email'] = 'validation.emailRequired'.tr();
  } else if (!_emailRegex.hasMatch(email)) {
    errors['email'] = 'validation.invalidEmail'.tr();
  }

  if (password.isEmpty) {
    errors['password'] = 'validation.passwordRequired'.tr();
  }

  return errors;
}

/// Validate register step 1 — mirrors React validateRegisterStep1.
ValidationErrors validateRegisterStep1({
  required String fullName,
  required String email,
  required String password,
  required String age,
  required String gender,
}) {
  final errors = <String, String>{};

  if (fullName.trim().isEmpty) {
    errors['fullName'] = 'validation.fullNameRequired'.tr();
  } else if (fullName.trim().length < 3) {
    errors['fullName'] = 'validation.fullNameLength'.tr();
  }

  if (email.trim().isEmpty) {
    errors['email'] = 'validation.emailRequired'.tr();
  } else if (!_emailRegex.hasMatch(email)) {
    errors['email'] = 'validation.invalidEmail'.tr();
  }

  if (password.isEmpty) {
    errors['password'] = 'validation.passwordRequired'.tr();
  } else {
    if (password.length < 8) {
      errors['password'] = 'validation.passwordLength'.tr();
    } else if (!RegExp(r'[A-Z]').hasMatch(password)) {
      errors['password'] = 'validation.passwordUppercase'.tr();
    } else if (!RegExp(r'[a-z]').hasMatch(password)) {
      errors['password'] = 'validation.passwordLowercase'.tr();
    } else if (!RegExp(r'[0-9]').hasMatch(password)) {
      errors['password'] = 'validation.passwordNumber'.tr();
    }
  }

  if (age.isEmpty) {
    errors['age'] = 'validation.ageRequired'.tr();
  } else {
    final ageNum = int.tryParse(age);
    if (ageNum == null || ageNum < 1 || ageNum > 120) {
      errors['age'] = 'validation.invalidAge'.tr();
    }
  }

  if (gender.isEmpty) {
    errors['gender'] = 'validation.genderRequired'.tr();
  }

  return errors;
}

/// Validate register step 2 — mirrors React validateRegisterStep2.
ValidationErrors validateRegisterStep2({
  required String familyHistory,
  required String hypertension,
  required String diabetes,
  required String renalPathologies,
}) {
  final errors = <String, String>{};

  if (familyHistory.isEmpty) {
    errors['familyHistory'] = 'validation.familyHistoryRequired'.tr();
  }
  if (hypertension.isEmpty) {
    errors['hypertension'] = 'validation.hypertensionRequired'.tr();
  }
  if (diabetes.isEmpty) {
    errors['diabetes'] = 'validation.diabetesRequired'.tr();
  }
  if (renalPathologies.isEmpty) {
    errors['renalPathologies'] = 'validation.renalPathologiesRequired'.tr();
  }

  return errors;
}

/// Validate profile update — mirrors React validateProfile.
ValidationErrors validateProfile({
  required String fullName,
  required String age,
}) {
  final errors = <String, String>{};

  if (fullName.trim().isEmpty) {
    errors['fullName'] = 'validation.fullNameRequired'.tr();
  } else if (fullName.trim().length < 3) {
    errors['fullName'] = 'validation.fullNameLength'.tr();
  }

  if (age.isNotEmpty) {
    final ageNum = int.tryParse(age);
    if (ageNum == null || ageNum < 1 || ageNum > 120) {
      errors['age'] = 'validation.invalidAge'.tr();
    }
  }

  return errors;
}

/// Validate change password — mirrors React validateChangePassword.
ValidationErrors validateChangePassword({
  required String currentPassword,
  required String newPassword,
  required String confirmPassword,
}) {
  final errors = <String, String>{};

  if (currentPassword.isEmpty) {
    errors['currentPassword'] = 'validation.passwordRequired'.tr();
  }

  if (newPassword.isEmpty) {
    errors['newPassword'] = 'validation.passwordRequired'.tr();
  } else {
    if (newPassword.length < 8) {
      errors['newPassword'] = 'validation.passwordLength'.tr();
    } else if (!RegExp(r'[A-Z]').hasMatch(newPassword)) {
      errors['newPassword'] = 'validation.passwordUppercase'.tr();
    } else if (!RegExp(r'[a-z]').hasMatch(newPassword)) {
      errors['newPassword'] = 'validation.passwordLowercase'.tr();
    } else if (!RegExp(r'[0-9]').hasMatch(newPassword)) {
      errors['newPassword'] = 'validation.passwordNumber'.tr();
    }
  }

  if (newPassword != confirmPassword) {
    errors['confirmPassword'] = 'validation.passwordsDoNotMatch'.tr();
  }

  return errors;
}

/// Validate reset password — mirrors React validateResetPassword.
ValidationErrors validateResetPassword({
  required String password,
  required String confirmPassword,
}) {
  final errors = <String, String>{};

  if (password.isEmpty) {
    errors['password'] = 'validation.passwordRequired'.tr();
  } else {
    if (password.length < 8) {
      errors['password'] = 'validation.passwordLength'.tr();
    } else if (!RegExp(r'[A-Z]').hasMatch(password)) {
      errors['password'] = 'validation.passwordUppercase'.tr();
    } else if (!RegExp(r'[a-z]').hasMatch(password)) {
      errors['password'] = 'validation.passwordLowercase'.tr();
    } else if (!RegExp(r'[0-9]').hasMatch(password)) {
      errors['password'] = 'validation.passwordNumber'.tr();
    }
  }

  if (password != confirmPassword) {
    errors['confirmPassword'] = 'validation.passwordsDoNotMatch'.tr();
  }

  return errors;
}
