import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'process.env.DEMO_EMAIL', // Replace with your Gmail email address
        pass: 'process.env.DEMO_PASSWORD', // Replace with your Gmail password (consider using environment variables)
    },
});

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: 'process.env.DEMO_EMAIL',
        to,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export default { sendEmail };