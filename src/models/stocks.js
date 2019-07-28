const mongoose = require('mongoose');

const stopLossSchema = new mongoose.Schema({
    symbol: { type: mongoose.Types.String, required: true },
    stopLossPercent: { type: mongoose.Types.Decimal128, required: true },
    maxPrice: { type: mongoose.Types.Decimal128, default: 0.0 },
    notify: { type: mongoose.Types.String, required: true },
    requested: { type: mongoose.Types.Date, default: Date.now },
    hit: mongoose.Types.Date
});

stopLossSchema.index({ symbol: 1, notify: 1 }, { unique: true });

module.exports = mongoose.model('StopLoss', stopLossSchema);
