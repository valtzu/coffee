import express from "express";
import PushSubscription from '../../models/push-subscription.js';
import CoffeeMaker from '../../models/coffeemaker.js';
import bodyParser from 'body-parser';
import base64url from 'urlsafe-base64';

import coffeeMakerRoutes from './coffeemakers.js';
import pushSubscriptionRoutes from './push-subscriptions.js';
import tplinkRoutes from './tplink.js';
import statsRoutes from './stats.js';

const router = express.Router();

const applicationServerKey = base64url.decode(process.env.VAPID_PUBLIC_KEY);
router.get('/vapid.pub', (req, res) => {
  res.send(applicationServerKey);
  res.end();
});

router.use(bodyParser.json({strict: true, limit: 1024}));

router.use('/coffeemakers', coffeeMakerRoutes);
router.use('/push-subscriptions', pushSubscriptionRoutes);
router.use('/tplink', tplinkRoutes);
router.use('/stats', statsRoutes);

router.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err,
  });
  res.end();
});

export default router;
