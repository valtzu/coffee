import express from "express";
import CoffeeMaker from '../../models/coffeemaker.js';

const router = express.Router();

/**
 * Middleware to create a CoffeeMaker instance into the request when request body is available
 */
router.use(async (req, res, next) => {

  if (["PUT"].includes(req.method)) {
    // Set CoffeeMaker instance to the request
    req.coffeeMaker = new CoffeeMaker(req.body);

    // Always set/override domain from the request headers
    req.coffeeMaker.set({domain: req.hostname});
  }

  return next();
});

router.get('/', async (req, res, next) => {
  const state = res.locals.coffeeMaker.state || {};
  const previous = state.previous || {};

  res.json({
    power: previous.power > 5,
    state: previous
  });

  res.end();
});

router.put('/', async (req, res, next) => {
  /** @type {CoffeeMaker} */
  const oldCoffeeMaker = res.locals.coffeeMaker;

  /** @type {CoffeeMaker} */
  const newCoffeeMaker = req.coffeeMaker;

  if (!newCoffeeMaker.cloud || !newCoffeeMaker.cloud.email || !newCoffeeMaker.cloud.token) {
    // 403 Forbidden
    res.status(403);
    res.end();
    return;
  }

  if (oldCoffeeMaker.domain !== newCoffeeMaker.domain) {
    // 409 Concflict, as replacing the object would change the primary key (not allowed)
    res.status(409);
    res.end();
    return;
  }

  if (!oldCoffeeMaker.isNew()) {
    oldCoffeeMaker.stopListening();
    await oldCoffeeMaker.destroy();
  }

  await newCoffeeMaker.save();

  try {
    /**
     * Try to get emeter status
     * Succeeded reply is an indication of active device
     * and therefore we can start polling
     */
    await newCoffeeMaker.cloud.getEmeterStatus();
    newCoffeeMaker.startListening();
  } catch (err) {
    console.error(err);
    newCoffeeMaker.stopListening();
    res.status(503);
    res.end();
  }

  res.status(204);
  res.end();
});

export default router;
