/** Key format used throughout the API/frontend for a product's per-variant stock map. */
function variantKey(size, color) {
  return `${size}__${color}`;
}

module.exports = { variantKey };
