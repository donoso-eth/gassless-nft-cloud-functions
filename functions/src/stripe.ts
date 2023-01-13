import axios from 'axios';

const functions = require('firebase-functions');

const cors = require('cors')({
    origin: true,
  });
  
  const STRIPE_KEY = functions.config().stripe.testkey;
  
  let stripe = require('stripe')(STRIPE_KEY);

export const stripeIntent = async (req, res, admin): Promise<any> => {
    return cors(req, res, async () => {
    
  
      const payload = req.body;
      try {
     
        console.log(JSON.stringify(payload.data));
  
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 5000,
            currency: 'eur',
            description: 'Awesome Gelato Gasless NFT',
            metadata: payload.data,
          });
        
          res
            .status(200)
            .send({
              msg: 'ok',
              clientSecret: paymentIntent.client_secret,
            });
   
      } catch (error) {
        console.log(error);
        res.status(200).send({ msg: 'nok' });
      }
    });
  };


export const stripeWebHook = async (req, res, admin): Promise<any> => {
    return cors(req, res, async () => {
        const endpointSecret = functions.config().stripe.testendpoint;
      const sig = req.headers['stripe-signature'];
  
      let event;
  
      try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
  
      // Handle the checkout.session.completed event
      if (event.type === 'charge.succeeded') {
        const charge = event.data.object;
  
        // Fulfill the purchase...
        const data = charge.metadata

        console.log(JSON.stringify(data))
        
        const RELAY_URL = "https://relay.gelato.digital";

        let response=  (await axios.post(`${RELAY_URL}/relays/v2/sponsored-call-erc2771`, data)).data;
       

        return res.status(200).send({ msg: 'ok' });

     
      } else if (event.type === 'charge.failed') {
        console.warn('payment.state: not approved ?');
        return res.status(200).send({ msg: 'ko' });
      }
    });
  };
  