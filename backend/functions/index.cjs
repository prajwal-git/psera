'use strict';
// Test-only backend starter. The delivered mobile app uses a local repository.
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {onSchedule}=require('firebase-functions/v2/scheduler');
const {defineSecret}=require('firebase-functions/params');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {quote,validAddress,validSignature}=require('./domain.cjs');
initializeApp();const db=getFirestore();
const keyId=defineSecret('RAZORPAY_KEY_ID'),keySecret=defineSecret('RAZORPAY_KEY_SECRET');
const options={region:'asia-south1',enforceAppCheck:true,maxInstances:5};
function user(r){if(!r.auth)throw new HttpsError('unauthenticated','Sign in first.');return r.auth.uid;}
function admin(r){const uid=user(r);if(r.auth.token.admin!==true)throw new HttpsError('permission-denied','Admin role required.');return uid;}
function convert(e){if(e instanceof HttpsError)return e;return new HttpsError('failed-precondition',e.message||'Unable to process request.');}
function token(r){if(typeof r.data.requestId!=='string'||! /^[a-zA-Z0-9_-]{8,80}$/.test(r.data.requestId))throw new HttpsError('invalid-argument','A stable request ID is required.');return r.data.requestId;}
async function productsAndSettings(reader,items){
 if(!Array.isArray(items)||!items.length||items.length>50)throw new Error('Invalid bag');
 const ids=[...new Set(items.map(x=>x.productId))];
 if(!ids.every(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)))throw new Error('Invalid product ID');
 const refs=ids.map(id=>db.doc(`products/${id}`));
 const snaps=await reader.getAll(...refs,db.doc('settings/store'));
 return {products:Object.fromEntries(snaps.slice(0,ids.length).map((s,i)=>[ids[i],s.data()])),settings:snaps.at(-1).data()||{}};
}
exports.quoteCart=onCall(options,async r=>{user(r);try{const data=await productsAndSettings(db,r.data.items);return quote(data.products,r.data.items,r.data.coupon,data.settings);}catch(e){throw convert(e);}});
async function reserve(r,payment){
 const uid=user(r),requestId=token(r);const address=validAddress(r.data.address);const ref=db.doc(`orders/${uid}_${requestId}`);
 return db.runTransaction(async t=>{
  const existing=await t.get(ref);if(existing.exists)return {id:ref.id,...existing.data()};
  const data=await productsAndSettings(t,r.data.items);const q=quote(data.products,r.data.items,r.data.coupon,data.settings);
  const order={uid,address,items:q.lines,subtotal:q.subtotal,discount:q.discount,shipping:q.shipping,total:q.total,currency:q.currency,status:payment==='cod'?'confirmed':'awaiting_payment',paymentStatus:payment==='cod'?'unpaid':'pending',method:payment,createdAt:FieldValue.serverTimestamp(),expiresAtMs:Date.now()+20*60*1000,testMode:true,stockReserved:true};
  for(const [id,n]of Object.entries(q.quantities))t.update(db.doc(`products/${id}`),{stock:FieldValue.increment(-n)});
  t.create(ref,order);return {id:ref.id,...order};
 });
}
exports.createDemoCodOrder=onCall(options,async r=>{try{const o=await reserve(r,'cod');return {orderId:o.id,total:o.total,currency:o.currency,testMode:true};}catch(e){throw convert(e);}});
async function razor(path,method='GET',body){
 if(!keyId.value().startsWith('rzp_test_'))throw new HttpsError('failed-precondition','This backend starter only permits Razorpay TEST credentials.');
 const response=await fetch(`https://api.razorpay.com/v1/${path}`,{method,headers:{Authorization:`Basic ${Buffer.from(`${keyId.value()}:${keySecret.value()}`).toString('base64')}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new HttpsError('unavailable','Payment gateway request failed. Retry with the same request ID.');return response.json();
}
exports.createTestPaymentOrder=onCall({...options,secrets:[keyId,keySecret]},async r=>{
 try{
  const uid=user(r),o=await reserve(r,'razorpay');
  if(o.method!=='razorpay'||o.status!=='awaiting_payment'||o.expiresAtMs<Date.now())throw new Error('Order is not payable.');
  if(o.gatewayOrderId)return {orderId:o.id,gatewayOrderId:o.gatewayOrderId,total:o.total,currency:'INR',keyId:keyId.value(),testMode:true};
  // Claim the gateway creation step so concurrent retries cannot create duplicate gateway orders.
  const ref=db.doc(`orders/${o.id}`);const claim=await db.runTransaction(async t=>{const snap=await t.get(ref);const data=snap.data();if(data.gatewayOrderId)return data.gatewayOrderId;if(data.gatewayCreating)throw new Error('Gateway order is being prepared; retry shortly.');t.update(ref,{gatewayCreating:true});return null;});
  if(claim)return {orderId:o.id,gatewayOrderId:claim,total:o.total,currency:'INR',keyId:keyId.value(),testMode:true};
  // On a timeout, keep gatewayCreating true: an admin must reconcile with Razorpay before retrying.
  const gateway=await razor('orders','POST',{amount:o.total,currency:'INR',receipt:o.id.slice(-40),notes:{pseraOrderId:o.id,uid}});
  await ref.update({gatewayOrderId:gateway.id,gatewayCreating:false});return {orderId:o.id,gatewayOrderId:gateway.id,total:o.total,currency:'INR',keyId:keyId.value(),testMode:true};
 }catch(e){throw convert(e);}
});
exports.verifyTestPayment=onCall({...options,secrets:[keyId,keySecret]},async r=>{
 const uid=user(r);try{
  if(typeof r.data.orderId!=='string'||! /^[a-zA-Z0-9_-]{8,220}$/.test(r.data.orderId)||typeof r.data.paymentId!=='string'||! /^pay_[a-zA-Z0-9]+$/.test(r.data.paymentId))throw new Error('Invalid payment reference');
  const ref=db.doc(`orders/${r.data.orderId}`),snap=await ref.get(),o=snap.data();
  if(!o||o.uid!==uid)throw new HttpsError('permission-denied','Order not found.');
  if(!o.gatewayOrderId||!validSignature(o.gatewayOrderId,r.data.paymentId,r.data.signature,keySecret.value()))throw new Error('Invalid payment signature');
  const p=await razor(`payments/${r.data.paymentId}`);
  if(p.order_id!==o.gatewayOrderId||p.amount!==o.total||p.currency!=='INR'||p.status!=='captured')throw new Error('Payment is not captured for this order amount');
  await db.runTransaction(async t=>{const latest=await t.get(ref),data=latest.data();if(data.paymentStatus==='paid'){if(data.paymentId!==p.id)throw new Error('Payment mismatch');return;}if(data.status!=='awaiting_payment'||!data.stockReserved)throw new Error('Reservation expired; admin reconciliation required');t.update(ref,{paymentId:p.id,paymentStatus:'paid',status:'confirmed',paidAt:FieldValue.serverTimestamp()});});return {verified:true,testMode:true};
 }catch(e){throw convert(e);}
});
exports.expireTestReservations=onSchedule({schedule:'every 15 minutes',region:'asia-south1'},async()=>{
 const orders=await db.collection('orders').where('status','==','awaiting_payment').where('expiresAtMs','<',Date.now()).limit(100).get();
 for(const snap of orders.docs){await db.runTransaction(async t=>{const fresh=await t.get(snap.ref),o=fresh.data();if(o.status!=='awaiting_payment'||!o.stockReserved)return;if(o.gatewayOrderId||o.gatewayCreating){t.update(snap.ref,{needsReconciliation:true});return;}for(const item of o.items)t.update(db.doc(`products/${item.productId}`),{stock:FieldValue.increment(item.quantity)});t.update(snap.ref,{status:'expired',stockReserved:false});});}
});
exports.adminUpsertProduct=onCall(options,async r=>{
 admin(r);const p=r.data.product;
 if(!p||typeof p.id!=='string'||! /^[a-zA-Z0-9_-]{1,100}$/.test(p.id)||typeof p.name!=='string'||p.name.length<1||p.name.length>200||typeof p.sku!=='string'||!Number.isSafeInteger(p.price)||p.price<1||!Number.isSafeInteger(p.stock)||p.stock<0||!Array.isArray(p.polishes)||!p.polishes.every(x=>typeof x==='string'&&x.length<50)||typeof p.active!=='boolean')throw new HttpsError('invalid-argument','Invalid product');
 const allowed=['sku','name','category','description','material','images','price','mrp','stock','polishes','active','featured','newArrival'];const clean=Object.fromEntries(allowed.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]));
 await db.doc(`products/${p.id}`).set({...clean,updatedAt:FieldValue.serverTimestamp()},{merge:true});return {saved:true};
});
exports.adminSetOrderStatus=onCall(options,async r=>{admin(r);if(typeof r.data.orderId!=='string'||! /^[a-zA-Z0-9_-]{8,220}$/.test(r.data.orderId)||!['processing','packed','shipped','out_for_delivery','delivered'].includes(r.data.status))throw new HttpsError('invalid-argument','Invalid status');await db.runTransaction(async t=>{const ref=db.doc(`orders/${r.data.orderId}`),snap=await t.get(ref),o=snap.data();if(!o||!['confirmed','processing','packed','shipped','out_for_delivery'].includes(o.status))throw new HttpsError('failed-precondition','Order cannot enter fulfilment.');t.update(ref,{status:r.data.status,updatedAt:FieldValue.serverTimestamp()});});return {updated:true};});
