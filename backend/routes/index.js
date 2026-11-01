const express = require('express');
const { protect, allow } = require('../middleware/auth');
const validate = require('../middleware/validate');
const auth = require('../controllers/authController');
const scans = require('../controllers/scanController');
const devices = require('../controllers/deviceController');
const users = require('../controllers/userController');

const router = express.Router();

// wraps async handlers so errors go to the error middleware
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/auth/register', validate.register, wrap(auth.register));
router.post('/auth/login', wrap(auth.login));
router.get('/auth/me', protect, wrap(auth.me));

router.get('/scans', protect, wrap(scans.list));
router.get('/scans/stats', protect, wrap(scans.stats));
router.get('/scans/:id', protect, wrap(scans.getOne));
router.post('/scans', protect, allow('admin', 'analyst'), validate.scan, wrap(scans.create));
router.put('/scans/:id', protect, allow('admin', 'analyst'), validate.scan, wrap(scans.update));
router.delete('/scans/:id', protect, allow('admin', 'analyst'), wrap(scans.remove));

router.get('/devices', protect, wrap(devices.list));
router.get('/devices/:id', protect, wrap(devices.getOne));
router.post('/devices', protect, allow('admin'), validate.device, wrap(devices.create));
router.put('/devices/:id', protect, allow('admin'), validate.device, wrap(devices.update));
router.delete('/devices/:id', protect, allow('admin'), wrap(devices.remove));

router.get('/users', protect, allow('admin'), wrap(users.list));
router.put('/users/:id/role', protect, allow('admin'), wrap(users.updateRole));
router.delete('/users/:id', protect, allow('admin'), wrap(users.remove));

module.exports = router;
