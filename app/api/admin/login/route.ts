import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { method, body } = request;
    
    if (method !== 'POST') {
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { identifier, otp } = await body.json();

    // Here you would implement your logic to verify user by email, username, phone, and OTP
    // This is a placeholder for demonstration purposes.
    
    // Mock user validation for demonstration.
    const users = [
        { email: 'admin@example.com', username: 'admin', phone: '1234567890', otp: '123456' }
    ];

    const user = users.find(u => 
        (u.email === identifier || u.username === identifier || u.phone === identifier) &&
        u.otp === otp
    );

    if (!user) {
        return NextResponse.json({ error: 'Invalid login credentials or OTP' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Login successful' }, { status: 200 });
}