import { firebaseApp } from "./admin/firebase-admin";
import { paypalCreate, paypalProcess } from "./paypal";
import { stripeIntent, stripeWebHook } from "./stripe";

const functions = require('firebase-functions');


////////////////////  STRIPE  //////////////////// 
export const stripeIntentFunction = functions.https.onRequest((request, response) => {
    return stripeIntent(request,response,firebaseApp);
  });  


 export const stripeWebHookFunction = functions.https.onRequest((request, response) => {
    return stripeWebHook(request,response,firebaseApp);
  });
  

////////////////////  PAYPAL  //////////////////// 
export const paypalCreateFunction = functions.https.onRequest((request, response) => {
    return paypalCreate(request,response,firebaseApp);
  });  

  export const paypalProcessFunction = functions.https.onRequest((request, response) => {
    return paypalProcess(request,response,firebaseApp);
  }); 