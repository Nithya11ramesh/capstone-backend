import dotenv from 'dotenv';
import stripePackage from 'stripe';

dotenv.config();
const stripe = new stripePackage(process.env.STRIPE_SECRET_KEY);

export default stripe;