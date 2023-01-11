const functions = require("firebase-functions");
const paypal = require("paypal-rest-sdk");
import axios from "axios";

const cors = require("cors")({
  origin: true,
});

paypal.configure({
  mode: "sandbox",
  client_id: functions.config().paypal.client_id,
  client_secret: functions.config().paypal.client_secret,
});

export const paypalCreate = async (req, res, admin): Promise<any> => {
  return cors(req, res, async () => {
    const payload = req.body;

    const successUrl =
      "https://us-central1-gelato-gasless-nft.cloudfunctions.net/paypalProcessFunction";

    console.log(payload);
    // 1.Set up a payment information object, Build PayPal payment request

    const db = admin.database();
    const ref = db.ref("paypal");
    const newRef = ref.push();
    const key = newRef.key;

    newRef.set(payload.data);

    const payReq = JSON.stringify({
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: successUrl,
        cancel_url: "http://localhost:4200",
      },
      transactions: [
        {
          amount: {
            total: 50,
            currency: "EUR",
          },
          // This is the payment transaction description. Maximum length: 127
          description: "Gasless NFT", // req.body.id
          // reference_id string .Optional. The merchant-provided ID for the purchase unit. Maximum length: 256.
          // reference_id: req.body.uid,
          custom: key,
          soft_descriptor: "Gasless NFt",
          // "invoice_number": req.body.uid,A
        },
      ],
    });



    // 2.Initialize the payment and redirect the user.
    paypal.payment.create(payReq, (error, payment) => {
      const links = {};
      if (error) {
        console.error(error.response);
        console.error(error.response.details);
        res.status("500").send(error);
      } else {
        // Capture HATEOAS links
        payment.links.forEach((linkObj) => {
          links[linkObj.rel] = {
            href: linkObj.href,
            method: linkObj.method,
          };
        });
        // If redirect url present, redirect user
        if (links.hasOwnProperty("approval_url")) {
  
          console.info(links["approval_url"].href);
       

          res.status(200).send(JSON.stringify(links["approval_url"].href));
        } else {
          console.error("no redirect URI present");
          res.status("500").end();
        }
      }
    });
    //   } else {
    //     res.status('500').send('error');
    //   }
  });
};

// 3.Complete the payment. Use the payer and payment IDs provided in the query string following the redirect.
export const paypalProcess = async (req, res, admin): Promise<any> => {
  return cors(req, res, async () => {
    const paymentId = req.query.paymentId;
    const payerId = {
      payer_id: req.query.PayerID,
    };
    const r = await paypal.payment.execute(
      paymentId,
      payerId,
      async (error, payment) => {
        if (error) {
          console.error(error);
          res.status(204).send({ status: "KOA" });
        } else {
          if (payment.state === "approved") {
            const custom = payment.transactions[0].custom;

            const db = admin.database();
            const ref = db.ref(`paypal/${custom}`);
           
            const snapshot = await ref.once("value");
            const data = snapshot.val();
         

            const RELAY_URL = "https://relay.gelato.digital";

            let response = (
              await axios.post(
                `${RELAY_URL}/relays/v2/sponsored-call-erc2771`,
                data
              )
            ).data; 
     
            console.log(response);
            res.redirect(302, "https://gelato-gasless-nft.web.app/landing");

               } else {
            console.warn("payment.state: not approved ?");
            res.redirect(302, "https://gelato-gasless-nft.web.app/landing");
                }
        }
      }
    );
  });
};
