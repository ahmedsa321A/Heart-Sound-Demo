import nodemailer from 'nodemailer';

const SENDER_NAME = 'HeartAi App';

/**
 * Production: Brevo's HTTP API (BREVO_API_KEY + EMAIL_FROM) — works on hosts that block SMTP ports,
 * such as Render's free tier.
 */
const sendWithBrevo = async (options) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
            accept: 'application/json'
        },
        body: JSON.stringify({
            sender: { name: SENDER_NAME, email: process.env.EMAIL_FROM },
            to: [{ email: options.email }],
            subject: options.subject,
            htmlContent: options.html,
            textContent: options.message
        })
    });
    if (!response.ok) {
        throw new Error(`Brevo API error ${response.status}: ${await response.text()}`);
    }
};

/** Local development fallback: Gmail SMTP with an app password (EMAIL_USER + EMAIL_PASS). */
const sendWithGmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    await transporter.sendMail({
        from: `"${SENDER_NAME}" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    });
};

const sendEmail = async (options) => {
    try {
        if (process.env.BREVO_API_KEY) {
            await sendWithBrevo(options);
        } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await sendWithGmail(options);
        } else if (process.env.NODE_ENV !== 'production') {
            // No email provider configured locally: print the email so OTPs can still be used
            console.log(`[dev email] to=${options.email} subject="${options.subject}"\n${options.message}`);
        } else {
            throw new Error('No email provider configured (set BREVO_API_KEY and EMAIL_FROM)');
        }
    } catch (error) {
        console.error('Email Failed!');
        console.error('Reason:', error.message);
        if (error.responseCode === 535) {
            console.error('TIP: Your Gmail App Password is wrong or 2FA is off.');
        }
        throw error;
    }
};

export default sendEmail;
