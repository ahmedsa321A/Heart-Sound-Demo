export interface AuthErrors {
    email?: string;
    password?: string;
    fullName?: string;
    age?: string;
    gender?: string;
    [key: string]: string | undefined;
}

export interface LoginProps {
    email?: string;
    password?: string;
}

export interface RegisterStep1Props {
    fullName?: string;
    email?: string;
    password?: string;
    age?: string | number;
    gender?: string;
}

export const validateLogin = ({ email, password }: LoginProps, errors: AuthErrors, t: (key: string) => string) => {
    // Email Validation
    if (!email?.trim()) {
        errors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = t('validation.invalidEmail');
    }

    // Password Validation
    if (!password) {
        errors.password = t('validation.passwordRequired');
    }
};

export const validateRegisterStep1 = ({
    fullName,
    email,
    password,
    age,
    gender,
}: RegisterStep1Props, errors: AuthErrors, t: (key: string) => string) => {
    // Full Name
    if (!fullName?.trim()) {
        errors.fullName = t('validation.fullNameRequired');
    } else if (fullName.trim().length < 3) {
        errors.fullName = t('validation.fullNameLength');
    }

    // Email
    if (!email?.trim()) {
        errors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = t('validation.invalidEmail');
    }

    // Password
    if (!password) {
        errors.password = t('validation.passwordRequired');
    } else {
        if (password.length < 8) {
            errors.password = t('validation.passwordLength');
        }
        if (!/[A-Z]/.test(password)) {
            errors.password = t('validation.passwordUppercase');
        }
        if (!/[a-z]/.test(password)) {
            errors.password = t('validation.passwordLowercase');
        }
        if (!/[0-9]/.test(password)) {
            errors.password = t('validation.passwordNumber');
        }
    }

    // Age
    if (!age) {
        errors.age = t('validation.ageRequired');
    } else {
        const ageNum = Number(age);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
            errors.age = t('validation.invalidAge');
        }
    }

    // Gender
    if (!gender) {
        errors.gender = t('validation.genderRequired');
    }
};

export interface RegisterStep2Props {
    familyHistory?: string;
    hypertension?: string;
    diabetes?: string;
    renalPathologies?: string;
}

export const validateRegisterStep2 = ({
    familyHistory,
    hypertension,
    diabetes,
    renalPathologies
}: RegisterStep2Props, errors: AuthErrors, t: (key: string) => string) => {
    if (!familyHistory) errors.familyHistory = t('validation.familyHistoryRequired');
    if (!hypertension) errors.hypertension = t('validation.hypertensionRequired');
    if (!diabetes) errors.diabetes = t('validation.diabetesRequired');
    if (!renalPathologies) errors.renalPathologies = t('validation.renalPathologiesRequired');
};

export interface ProfileUpdateProps {
    fullName?: string;
    age?: string | number;
}

export const validateProfile = ({ fullName, age }: ProfileUpdateProps, errors: AuthErrors, t: (key: string) => string) => {
    // Full Name
    if (!fullName?.trim()) {
        errors.fullName = t('validation.fullNameRequired');
    } else if (fullName.trim().length < 3) {
        errors.fullName = t('validation.fullNameLength');
    }

    // Age
    if (age) {
        const ageNum = Number(age);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
            errors.age = t('validation.invalidAge');
        }
    }
};

export interface ChangePasswordProps {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

export const validateChangePassword = ({ currentPassword, newPassword, confirmPassword }: ChangePasswordProps, errors: AuthErrors, t: (key: string) => string) => {
    if (!currentPassword) {
        errors.currentPassword = t('validation.passwordRequired');
    }

    if (!newPassword) {
        errors.newPassword = t('validation.passwordRequired');
    } else {
        if (newPassword.length < 8) {
            errors.newPassword = t('validation.passwordLength');
        }
        if (!/[A-Z]/.test(newPassword)) {
            errors.newPassword = t('validation.passwordUppercase');
        }
        if (!/[a-z]/.test(newPassword)) {
            errors.newPassword = t('validation.passwordLowercase');
        }
        if (!/[0-9]/.test(newPassword)) {
            errors.newPassword = t('validation.passwordNumber');
        }
    }

    if (newPassword !== confirmPassword) {
        errors.confirmPassword = t('validation.passwordsDoNotMatch');
    }
};

export interface ResetPasswordProps {
    password?: string;
    confirmPassword?: string;
}

export const validateResetPassword = ({ password, confirmPassword }: ResetPasswordProps, errors: AuthErrors, t: (key: string) => string) => {
    if (!password) {
        errors.password = t('validation.passwordRequired');
    } else {
        if (password.length < 8) {
            errors.password = t('validation.passwordLength');
        }
        if (!/[A-Z]/.test(password)) {
            errors.password = t('validation.passwordUppercase');
        }
        if (!/[a-z]/.test(password)) {
            errors.password = t('validation.passwordLowercase');
        }
        if (!/[0-9]/.test(password)) {
            errors.password = t('validation.passwordNumber');
        }
    }

    if (password !== confirmPassword) {
        errors.confirmPassword = t('validation.passwordsDoNotMatch');
    }
};

// Helper to map backend messages to translation keys
export const getTranslatedMessage = (message: string, t: (key: string) => string): string => {
    // Normalization to handle potential slight variations or casing
    const lowerMsg = message?.toLowerCase()?.trim();

    if (!lowerMsg) return message;

    if (lowerMsg.includes('user already exists')) return t('auth.userExists');
    if (lowerMsg.includes('invalid credentials')) return t('auth.invalidCredentials');
    if (lowerMsg.includes('verify your email')) return t('auth.emailVerifyFirst');
    if (lowerMsg.includes('server error')) return t('auth.serverError');
    if (lowerMsg.includes('logged in successfully')) return t('auth.loginSuccess');
    if (lowerMsg.includes('email sent')) return t('auth.emailSent');
    if (lowerMsg.includes('login failed')) return t('auth.loginFailed');
    if (lowerMsg.includes('registration failed')) return t('auth.registrationFailed');
    if (lowerMsg.includes('verification failed')) return t('auth.verificationFailed');
    if (lowerMsg.includes('not authenticated')) return t('auth.notAuthenticated');
    if (lowerMsg.includes('password changed successfully')) return t('profile.passwordChangedSuccess');
    if (lowerMsg.includes('account verified! you can now login')) return t('auth.verifiedLogin');
    if (lowerMsg.includes('if that email exists')) return t('auth.forgotPasswordEmailSent');
    if (lowerMsg.includes('password reset code sent')) return t('auth.forgotPasswordEmailSent');
    if (lowerMsg.includes('invalid otp or otp has expired')) return t('auth.invalidOrExpiredOTP');
    if (lowerMsg.includes('password reset successful')) return t('auth.resetSuccess');
    if (lowerMsg.includes('otp verified successfully')) return t('auth.otpVerifiedReset');
    if (lowerMsg.includes('invalid or expired otp')) return t('auth.invalidOrExpiredOTP');

    // Password Change Errors
    if (lowerMsg.includes('please provide current password')) return t('validation.provideAllFields');
    if (lowerMsg.includes('new password and confirmation do not match')) return t('validation.newPasswordMismatch');
    if (lowerMsg.includes('new password must be at least 8 characters')) return t('validation.newPasswordLength');
    if (lowerMsg.includes('new password must be different')) return t('validation.samePassword');
    if (lowerMsg.includes('user not found')) return t('validation.userNotFound');
    if (lowerMsg.includes('current password is incorrect')) return t('validation.currentPasswordIncorrect');


    // Return original if no match found
    return message;
};

