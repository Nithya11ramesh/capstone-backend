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
    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);

    // Ensure the amount is within the allowed limit
    if (amountInCents > 99999999) {
        return res.status(400).json({
            error: {
                message: 'Amount exceeds the maximum limit of $999,999.99',
            }
        });
    }
    try {
        
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: 'usd',
                payment_method: payment_method_id,
                confirm: true,
                return_url: 'http://localhost:5174/payment-success',
            });
    
            res.status(200).json(paymentIntent);
        } catch (error) {
            console.error('Payment Error:', error);
            res.status(500).json({ error: { message: error.message } });
        }
    });

    paymentRouter.get('/payment-status/:paymentIntentId', async (req, res) => {
        const { paymentIntentId } = req.params;
        
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            res.status(200).json({ status: paymentIntent.status });
        } catch (error) {
            console.error('Error fetching payment intent:', error);
            res.status(500).json({ error: 'Failed to retrieve payment intent.' });
        }
    });

export default paymentRouter;