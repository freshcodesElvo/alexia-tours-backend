const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        // This helps if the server has trouble verifying certificates
        rejectUnauthorized: false 
    }
});

const sendReviewRequest = async (email, name, bookingId) => {
    // This link points to your frontend "hidden" review page
    const reviewLink = `https://alexiastours.co.ke/leave-review.html?booking=${bookingId}&name=${encodeURIComponent(name)}`;

    const mailOptions = {
        from: '"Alexia Tours" <your-email@gmail.com>',
        to: email,
        subject: `Welcome back, ${name}! How was your safari?`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #2d3748; text-align: center;">Asante for Traveling with Us!</h2>
                <p>Hi ${name},</p>
                <p>We hope you had an unforgettable experience on your recent safari. Our business grows on the feedback of our guests.</p>
                <p>Would you mind taking a minute to share your thoughts?</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${reviewLink}" style="background-color: #fbbf24; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Leave a Review
                    </a>
                </div>
                <p>Warm regards,<br>The Alexia Tours Team</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendReviewRequest };