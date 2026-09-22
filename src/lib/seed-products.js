const { variantKey } = require("./variantKey");

const LOW_STOCK_THRESHOLD = 5;

/**
 * Deterministic "starting" stock for a product variant, derived from the
 * product slug + size + color so the numbers are stable across reloads.
 * Mirrors the hash the frontend used to generate before it had a backend.
 */
function seedStock(slug, key) {
  const str = `${slug}::${key}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const bucket = hash % 100;
  if (bucket < 12) return 0; // ~12% of variants start sold out
  if (bucket < 30) return 1 + (hash % LOW_STOCK_THRESHOLD); // low stock
  return 8 + (hash % 35); // healthy stock
}

function buildStock(product) {
  const stock = {};
  for (const size of product.sizes) {
    for (const c of product.colors) {
      stock[variantKey(size, c.name)] = seedStock(product.slug, variantKey(size, c.name));
    }
  }
  return stock;
}

const rawProducts = [
  {
    id: "p-one-life",
    slug: "one-life-graphic-t-shirt",
    name: "ONE LIFE GRAPHIC T-SHIRT",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503341960582-b45751874cf0?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=900&auto=format&fit=crop",
    ],
    bg: "#F7F2E1",
    rating: 4.5,
    reviewCount: 451,
    price: 260,
    originalPrice: 300,
    discountPct: 40,
    description:
      "This graphic t-shirt which is perfect for any occasion. Crafted from a soft and breathable fabric, it offers superior comfort and style.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [
      { name: "Olive", hex: "#4a4028" },
      { name: "Forest", hex: "#26463a" },
      { name: "Navy", hex: "#2b3159" },
    ],
    featured: true,
  },
  {
    id: "p-polo-contrast",
    slug: "polo-with-contrast-trims",
    name: "Polo with Contrast Trims",
    images: ["https://images.unsplash.com/photo-1571945153237-4929e783af4a?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 4.0,
    reviewCount: 86,
    price: 212,
    originalPrice: 242,
    discountPct: 20,
    description:
      "A classic polo elevated with contrast-tipped trims on the collar and cuffs, cut from breathable piqué cotton.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [
      { name: "Teal", hex: "#1f6f7a" },
      { name: "White", hex: "#f5f5f5" },
      { name: "Black", hex: "#111111" },
    ],
  },
  {
    id: "p-gradient-graphic",
    slug: "gradient-graphic-t-shirt",
    name: "Gradient Graphic T-shirt",
    images: ["https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 3.5,
    reviewCount: 62,
    price: 145,
    description:
      "A bold gradient print takes center stage on this relaxed-fit crew neck tee, made from soft combed cotton.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [
      { name: "White", hex: "#f5f5f5" },
      { name: "Black", hex: "#111111" },
    ],
  },
  {
    id: "p-polo-tipping",
    slug: "polo-with-tipping-details",
    name: "Polo with Tipping Details",
    images: ["https://images.unsplash.com/photo-1622445275576-721325763afe?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 4.5,
    reviewCount: 118,
    price: 180,
    originalPrice: 242,
    discountPct: 20,
    description:
      "Micro-textured knit polo finished with tipped detailing at the collar placket for a sharp, sporty edge.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [
      { name: "Berry", hex: "#8a3b4a" },
      { name: "Navy", hex: "#20304f" },
    ],
  },
  {
    id: "p-black-striped",
    slug: "black-striped-t-shirt",
    name: "Black Striped T-shirt",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 5.0,
    reviewCount: 204,
    price: 120,
    originalPrice: 150,
    discountPct: 30,
    description:
      "Raglan-sleeve tee in a crisp vertical stripe with contrast black sleeves and ribbed crew neckline.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [{ name: "Black/White", hex: "#111111" }],
  },
  {
    id: "p-skinny-jeans",
    slug: "skinny-fit-jeans",
    name: "Skinny Fit Jeans",
    images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 3.5,
    reviewCount: 74,
    price: 240,
    originalPrice: 260,
    discountPct: 20,
    description:
      "Stretch-denim skinny jeans with a mid-rise waist and tapered leg for an everyday, streamlined silhouette.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large", "XX-Large"],
    colors: [{ name: "Indigo", hex: "#3b5170" }],
    isNew: true,
  },
  {
    id: "p-checkered-shirt",
    slug: "checkered-shirt",
    name: "Checkered Shirt",
    images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 4.5,
    reviewCount: 133,
    price: 180,
    description:
      "Brushed cotton flannel shirt in a classic buffalo check, with a button-down front and chest pocket.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [
      { name: "Red Check", hex: "#7a2634" },
      { name: "Navy Check", hex: "#26314f" },
    ],
    isNew: true,
  },
  {
    id: "p-sleeve-striped",
    slug: "sleeve-striped-t-shirt",
    name: "Sleeve Striped T-shirt",
    images: ["https://images.unsplash.com/photo-1503341960582-b45751874cf0?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 4.5,
    reviewCount: 91,
    price: 130,
    originalPrice: 160,
    discountPct: 30,
    description: "Pinstriped raglan tee with contrast black sleeves, finished with a ribbed crew neckline.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [{ name: "Orange/Black", hex: "#c1531f" }],
    isNew: true,
  },
  {
    id: "p-vertical-striped",
    slug: "vertical-striped-shirt",
    name: "Vertical Striped Shirt",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 5.0,
    reviewCount: 152,
    price: 212,
    originalPrice: 232,
    discountPct: 20,
    description: "Long-sleeve button-up in a fine vertical stripe, woven from breathable cotton poplin.",
    category: "formal",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [{ name: "Green", hex: "#3f5a44" }],
    featured: true,
  },
  {
    id: "p-courage-graphic",
    slug: "courage-graphic-t-shirt",
    name: "Courage Graphic T-shirt",
    images: ["https://images.unsplash.com/photo-1503341960582-b45751874cf0?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 4.0,
    reviewCount: 67,
    price: 145,
    description: "Oversized graphic tee with a distressed typographic print across the chest.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [{ name: "Orange", hex: "#c1531f" }],
    featured: true,
  },
  {
    id: "p-bermuda-shorts",
    slug: "loose-fit-bermuda-shorts",
    name: "Loose Fit Bermuda Shorts",
    images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 3.0,
    reviewCount: 45,
    price: 80,
    description: "Relaxed denim bermuda shorts with a lightly distressed finish, sitting just above the knee.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [{ name: "Light Wash", hex: "#7f9bb5" }],
    featured: true,
  },
  {
    id: "p-faded-skinny",
    slug: "faded-skinny-jeans",
    name: "Faded Skinny Jeans",
    images: ["https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 4.5,
    reviewCount: 98,
    price: 210,
    description: "Faded-wash skinny jeans in stretch denim with a slim tapered leg from hip to ankle.",
    category: "casual",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [{ name: "Black Fade", hex: "#2b2b2b" }],
    featured: true,
  },
  {
    id: "p-tape-tshirt",
    slug: "t-shirt-with-tape-details",
    name: "T-shirt with Tape Details",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop"],
    bg: "#F7F2E1",
    rating: 4.5,
    reviewCount: 109,
    price: 120,
    description: "Boxy-fit tee finished with shoulder tape detailing and a soft, heavyweight cotton hand-feel.",
    category: "gym",
    sizes: ["Small", "Medium", "Large", "X-Large"],
    colors: [{ name: "Black", hex: "#111111" }],
    isNew: true,
  },
];

function seedProducts() {
  const now = Date.now();
  return rawProducts.map((p, i) => ({
    ...p,
    custom: false,
    createdAt: now - (rawProducts.length - i) * 1000,
    stock: buildStock(p),
  }));
}

module.exports = { seedProducts, buildStock, variantKey, seedStock, LOW_STOCK_THRESHOLD };
