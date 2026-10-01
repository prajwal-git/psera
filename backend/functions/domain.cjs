'use strict';
const crypto = require('node:crypto');
function quote(products, items, coupon, settings = {}) {
 if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw new Error('Invalid bag');
 const normalized = new Map();
 for (const item of items) {
  if (!item || typeof item.productId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 || typeof item.polish !== 'string') throw new Error('Invalid item');
  const key = `${item.productId}:${item.polish}`;
  normalized.set(key, {...item, quantity:(normalized.get(key)?.quantity || 0)+item.quantity});
 }
 const lines = [], quantities = {};
 let subtotal = 0;
 for (const item of normalized.values()) {
  const p = products[item.productId];
  if (!p || !p.active || !Number.isSafeInteger(p.price) || p.price < 1 || !Array.isArray(p.polishes) || !p.polishes.includes(item.polish)) throw new Error('Product unavailable');
  quantities[item.productId] = (quantities[item.productId] || 0) + item.quantity;
  if (!Number.isSafeInteger(p.stock) || p.stock < quantities[item.productId]) throw new Error('Insufficient stock');
  const amount = p.price * item.quantity;
  if (!Number.isSafeInteger(amount)) throw new Error('Invalid amount');
  subtotal += amount;
  lines.push({productId:item.productId, sku:p.sku, name:p.name, polish:item.polish, quantity:item.quantity, price:p.price});
 }
 if (!Number.isSafeInteger(subtotal) || subtotal > 100000000) throw new Error('Order too large');
 const shippingFee = settings.shippingFee ?? 5900, freeShippingAt = settings.freeShippingAt ?? 99900;
 if (![shippingFee,freeShippingAt].every(n=>Number.isSafeInteger(n)&&n>=0)) throw new Error('Invalid shipping configuration');
 if (coupon && coupon !== 'WELCOME10') throw new Error('Invalid coupon');
 const discount = coupon === 'WELCOME10' ? Math.min(Math.floor(subtotal/10),20000) : 0;
 const shipping = subtotal >= freeShippingAt ? 0 : shippingFee;
 return {lines,quantities,subtotal,discount,shipping,total:subtotal-discount+shipping,currency:'INR'};
}
function validAddress(a) {
 if (!a || !['name','phone','street','city','state','pin'].every(k=>typeof a[k]==='string'&&a[k].trim().length>0&&a[k].length<=300)) throw new Error('Invalid address');
 if (!/^[6-9]\d{9}$/.test(a.phone) || !/^[1-9]\d{5}$/.test(a.pin)) throw new Error('Invalid phone or PIN code');
 return Object.fromEntries(['name','phone','street','city','state','pin'].map(k=>[k,a[k].trim()]));
}
function validSignature(orderId,paymentId,signature,secret) {
 if (typeof signature!=='string'||! /^[a-f0-9]{64}$/.test(signature) || typeof paymentId!=='string') return false;
 const expected=crypto.createHmac('sha256',secret).update(`${orderId}|${paymentId}`).digest('hex');
 return crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(signature,'hex'));
}
module.exports={quote,validAddress,validSignature};
