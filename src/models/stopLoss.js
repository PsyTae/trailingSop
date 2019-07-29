const mongoose = require('mongoose');

const stopLossSchema = new mongoose.Schema({
    symbol: { type: mongoose.Schema.Types.String, required: true },
    stopLossPercent: { type: mongoose.Schema.Types.Decimal128, required: true },
    maxPrice: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    notify: { type: mongoose.Schema.Types.String, required: true, lowercase: true },
    requested: { type: mongoose.Schema.Types.Date, default: Date.now },
    hit: mongoose.Schema.Types.Date
});

stopLossSchema.index({ symbol: 1, notify: 1 }, { unique: true });

module.exports = mongoose.model('StopLoss', stopLossSchema);
