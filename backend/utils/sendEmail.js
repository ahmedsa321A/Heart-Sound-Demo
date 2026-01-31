import nodemailer from 'nodemailer';

const sendEmail = async (options) => {

    // 1. Create the Transporter (The Connector to Google)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // This automatically sets the correct host/port for Gmail
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Define the Email
    const mailOptions = {
        from: `"HeartAi App" <${process.env.EMAIL_USER}>`, // Sender address
        to: options.email, // Receiver address
        subject: options.subject,
        text: options.message, // Fallback plain text
        html: options.html, // HTML content
    };

    // 3. Send It
    try {
        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error("Email Failed!");
        console.error("Reason:", error.message);

        // Detailed troubleshooting if it fails
        if (error.responseCode === 535) {
            console.error("TIP: Your App Password in .env is wrong or 2FA is off.");
        }
        throw error;
    }
};

export default sendEmail;