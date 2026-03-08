// otp.ts

export function generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return otp;
}

export function validateOTP(inputOtp: string, originalOtp: string): boolean {
    return inputOtp === originalOtp;
}