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

export const validateLogin = ({ email, password }: LoginProps, errors: AuthErrors) => {
    // Email Validation
    if (!email?.trim()) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Invalid email address";
    }

    // Password Validation
    if (!password) {
        errors.password = "Password is required";
    }
};

export const validateRegisterStep1 = ({
    fullName,
    email,
    password,
    age,
    gender,
}: RegisterStep1Props, errors: AuthErrors) => {
    // Full Name
    if (!fullName?.trim()) {
        errors.fullName = "Full name is required";
    } else if (fullName.trim().length < 3) {
        errors.fullName = "Full name must be at least 3 characters";
    }

    // Email
    if (!email?.trim()) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Invalid email address";
    }

    // Password
    if (!password) {
        errors.password = "Password is required";
    } else {
        if (password.length < 8) {
            errors.password = "Password must be at least 8 characters";
        }
        if (!/[A-Z]/.test(password)) {
            errors.password = "Password must contain at least one uppercase letter";
        }
        if (!/[a-z]/.test(password)) {
            errors.password = "Password must contain at least one lowercase letter";
        }
        if (!/[0-9]/.test(password)) {
            errors.password = "Password must contain at least one number";
        }
    }

    // Age
    if (!age) {
        errors.age = "Age is required";
    } else {
        const ageNum = Number(age);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
            errors.age = "Please enter a valid age";
        }
    }

    // Gender
    if (!gender) {
        errors.gender = "Gender is required";
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
}: RegisterStep2Props, errors: AuthErrors) => {
    if (!familyHistory) errors.familyHistory = "Family history is required";
    if (!hypertension) errors.hypertension = "Hypertension status is required";
    if (!diabetes) errors.diabetes = "Diabetes status is required";
    if (!renalPathologies) errors.renalPathologies = "Renal pathologies status is required";
};

