import nodemailer from 'nodemailer';

const sendOtpEmail = async (toEmail, otp, username) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD
            },
        });

        const mailOptions = {
            from: `"Zero-secure-ai" <${process.env.EMAIL_ID}>`,
            to: toEmail,
            subject: "Your OTP for ZeroTrust 'AI powered File Management system'",
            text: `Your OTP is ${otp}`,
            html: `<p>Hello <b>${username}!</b></p>
                    
                    <p>Your One time password(OTP) is <b>${otp}</b></p>
                    <p>Kindly Verify your ZeroTrust account by entering the OTP provided.</p>
                    <p>Enter the one time password for verification as it will expire in <b>1 minute</b>.</p>
                    <p>Kindly do not disclose the OTP to anyone.</p>
                    <p>We are delighted and looking forward for you to join the ZeroTrust AI community</p>
                    <p>Regards,</p>
                    <p>Team ZeroTrust AI</p>`,
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
