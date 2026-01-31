export const getOtpEmailTemplate = (otp) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HeartAi Verification</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f4f7f6;
                margin: 0;
                padding: 0;
                color: #333333;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            }
            .header {
                background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%);
                padding: 40px 0;
                text-align: center;
            }
            .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }
            .content {
                padding: 40px;
                text-align: center;
            }
            .verification-text {
                font-size: 16px;
                line-height: 1.6;
                color: #4b5563;
                margin-bottom: 30px;
            }
            .otp-code {
                background-color: #f0fdfa;
                border: 2px dashed #0d9488;
                border-radius: 12px;
                font-size: 36px;
                font-weight: 800;
                color: #0f766e;
                padding: 20px;
                margin: 0 auto 30px;
                letter-spacing: 8px;
                display: inline-block;
                width: fit-content;
            }
            .expiry-text {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 40px;
            }
            .footer {
                background-color: #f9fafb;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                border-top: 1px solid #e5e7eb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>HeartAi</h1>
            </div>
            <div class="content">
                <h2 style="color: #111827; margin-top: 0;">Verify Your Account</h2>
                <p class="verification-text">
                    Thank you for joining HeartAi. To complete your registration, please use the verification code below.
                </p>
                
                <div class="otp-code">
                    ${otp}
                </div>

                <p class="expiry-text">
                    This code will expire in 10 minutes.<br>
                    If you didn't request this code, please ignore this email.
                </p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} HeartAi. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;
};
