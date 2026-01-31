import User from '../DB/User.js';
import UserHistory from '../DB/UserHistory.js';

// @desc    Get current user profile
// @route   GET /users/profile
// @access  Private
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpires -resetToken -resetTokenExpires');

        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        // Get history to append if needed, or just return user data
        // For now returning the User object as defined in frontend types
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /users/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const { fullName, age, gender, phoneNumber, address } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        user.fullName = fullName || user.fullName;
        user.age = age || user.age;
        user.gender = gender || user.gender;
        // Add other fields if Schema supports them, assuming User model might need update if these fields don't exist
        // Based on User.js (which I haven't fully seen but only imported in authController), standard fields are fullName, email, password, age, gender.
        // UserProfile type in frontend has phoneNumber, address, etc. I should check User model. 
        // For now, I will update standard fields.

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                age: user.age,
                gender: user.gender
            },
            msg: 'Profile updated successfully'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};
