const { Resend } = require('resend');

// Initialize with your new API key
const resend = new Resend(process.env.RESEND_API_KEY);

const sendReviewRequest = async (email, name, bookingId) => {
    try {
        const { data, error } = await resend.emails.send({
            // Since you're on a free Resend tier, use 'onboarding@resend.dev' 
            // until you verify your alexiastours.co.ke domain.
            from: 'Alexia Tours <onboarding@resend.dev>',
            to: [email],
            subject: `Welcome back, ${name}! How was your safari?`,
            html: `
                <div style="font-family: sans-serif; text-align: center;">
                    <h2>Asante for choosing Alexia Tours!</h2>
                    <p>Hi ${name}, we hope you enjoyed your adventure. Could you share your experience with us?</p>
                    <a href="https://alexia-tours.netlify.app/leave-review.html?booking=${bookingId}&name=${name}" 
                       style="background: #fbbf24; padding: 12px 20px; color: black; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Leave a Review
                    </a>
                </div>
            `
        });

        if (error) {
            return console.error("Resend Error:", error);
        }

        console.log("Review invitation sent via API! ID:", data.id);
    } catch (err) {
        console.error("Critical Mailer Error:", err);
    }
};

module.exports = { sendReviewRequest };