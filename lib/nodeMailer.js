import nodemailer from 'nodemailer';

const sendOtpEmail = async (toEmail, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD
            },
        });

        const mailOptions = {
            from: '"Zero-secure-ai" <rajatbra22@gmail.com>',
            to: toEmail,
            subject: 'Your OTP Code',
            text: `Your OTP is ${otp}`,
            html: `<p>Your OTP code is <b>${otp}</b>. It will expire in 1 minute.</p>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ OTP Email sent:', info.response);
        return info.response;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        return null;
    }
};

export default sendOtpEmail;
