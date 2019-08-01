const mongoose = require('mongoose');

const stopLossSchema = new mongoose.Schema({
    symbol: { type: String, required: true, uppercase: true },
    stopLossPercent: { type: mongoose.Schema.Types.Decimal128, required: true },
    maxPrice: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    notify: { type: String, required: true, lowercase: true },
    requested: { type: Date, default: Date.now },
    hit: Date
});

stopLossSchema.index({ symbol: 1, notify: 1 }, { unique: true });

module.exports = mongoose.model('StopLoss', stopLossSchema);
