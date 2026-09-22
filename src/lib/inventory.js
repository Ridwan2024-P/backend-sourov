const { variantKey } = require("./variantKey");

const LOW_STOCK_THRESHOLD = 5;

function getStockLevel(qty) {
  if (qty <= 0) return "out-of-stock";
  if (qty <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

module.exports = { LOW_STOCK_THRESHOLD, getStockLevel, variantKey };
