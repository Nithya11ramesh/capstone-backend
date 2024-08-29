import express from 'express';
import stripe from '../config/stripe.js';
import { authenticate } from '../middleware/auth.js';

const paymentRouter = express.Router();

// Payment routes
// paymentRouter.post('/payment/:enrollmentId', authenticate, async (req, res) => {

//     const { payment_method_id, amount, enrollment_id } = req.body;

//     try {
//         const paymentIntent = await stripe.paymentIntents.create({
//             payment_method: payment_method_id,
//             amount: amount * 100, // Convert amount to cents
//             currency: 'usd', // Adjust currency as needed
//             description: `Payment for Enrollment ID: ${enrollment_id}`,
//             confirm: true,
//             automatic_payment_methods: {
//                 enabled: true,
//                 allow_redirects: 'never', // Disable redirects
//             },
//         });

//         // Handle successful payment (update enrollment status, etc.)
//         // For simplicity, assume enrollment update logic here

//         res.status(200).json({ message: 'Payment successful!', paymentIntent });
//     } catch (error) {
//         console.error('Payment failed:', error);
//         res.status(500).json({ error: 'Payment failed.' });
//     }
// });
paymentRouter.post('/payment/:enrollmentId', authenticate, async (req, res) => {
    const { payment_method_id, amount, enrollment_id } = req.body;
    console.log("reqBody:", req.body);
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            payment_method: payment_method_id,
            amount: amount * 100, // Convert amount to cents
            currency: 'usd',
            description: `Payment for Enrollment ID: ${enrollment_id}`,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
        });

        // Handle successful payment (update enrollment status, etc.)
        res.status(200).json({ message: 'Payment successful!', paymentIntent });
    } catch (error) {
        console.error('Payment failed:', error);
        res.status(500).json({ error: 'Payment failed.' });
    }
});


export default paymentRouter;