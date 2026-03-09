// Authentication Utilities

// Admin credentials validation
const adminCredentials = {
    username: 'admin',
    password: 'securepassword123' // Store hashed passwords in production
};

export function validateAdminCredentials(username, password) {
    return username === adminCredentials.username && password === adminCredentials.password;
}

// OTP Management
let otpStore = {};

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

export function sendOTP(username) {
    const otp = generateOTP();
    otpStore[username] = otp;
    console.log(`OTP sent to ${username}: ${otp}`); // Replace with actual send functionality
}

export function validateOTP(username, otp) {
    return otpStore[username] === otp;
}

// Password functions
export function hashPassword(password) {
    // Implement hashing
    return password; // Replace with real hashing
}

export function validatePassword(password) {
    // Implement validation logic 
    return password.length >= 8; // Example: Minimum length of 8
}

export function changePassword(oldPassword, newPassword) {
    if (validatePassword(newPassword)) {
        // Update password logic here
        console.log('Password changed successfully');
    } else {
        console.log('New password does not meet criteria');
    }
}