import { shopeeSeeds } from "./catalogue.generated";
import { CONTACT } from "./contact";

export type Audience = "Nam" | "Nữ" | "Trẻ em" | "Unisex";

export type ProductColor = { name: string; hex: string };

/** một tổ hợp mua được — màu + size — với tồn kho riêng */
export type Variant = {
  id: string;
  color: string;
  size: string;
  stock: number;
};

export type Product = {
  /** giữ nguyên dạng ASCII: đây là định danh và đường dẫn URL */
  slug: string;
  name: string;
  category: string;
  audience: Audience;
  price: number;
  comparePrice?: number;
  image: string;
  hoverImage: string;
  isNew?: boolean;
  rating: number;
  reviews: number;
  description: string;
  details: string[];
  colors: ProductColor[];
  sizes: string[];
  /** mọi tổ hợp màu × size, dựng một lần khi nạp module */
  variants: Variant[];
};

/** hai tấm ảnh của mỗi sản phẩm cũng chính là gallery ở trang chi tiết */
export const galleryOf = (product: Product) => [product.image, product.hoverImage];

const SIZES = {
  tops: ["XS", "S", "M", "L", "XL"],
  bottoms: ["28", "30", "32", "34", "36"],
  kids: ["2T", "4T", "6T", "8T", "10T"],
} as const;

const COLORS = {
  sand: { name: "Cát", hex: "#d8c4a4" },
  cream: { name: "Kem", hex: "#f0e7d8" },
  clay: { name: "Đất nung", hex: "#b07a55" },
  espresso: { name: "Nâu đậm", hex: "#4a3728" },
  ink: { name: "Đen mực", hex: "#1c1714" },
  olive: { name: "Xanh ô liu", hex: "#6b6a45" },
  slate: { name: "Xám đá", hex: "#5d6570" },
  indigo: { name: "Xanh chàm", hex: "#3d4a63" },
  rust: { name: "Nâu gỉ", hex: "#a8503a" },
  fog: { name: "Xám sương", hex: "#c9c6bd" },
} satisfies Record<string, ProductColor>;

/**
 * Tồn kho phải giống hệt nhau ở server và ở trình duyệt, nên nó được suy ra từ
 * hash của khoá biến thể thay vì Math.random().
 */
const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const stockFor = (key: string) => {
  const n = hash(key) % 100;
  if (n < 8) return 0; // khoảng 8% biến thể hết hàng
  if (n < 22) return 1 + (n % 3); // vài biến thể "chỉ còn x sản phẩm"
  return 5 + (n % 11);
};

/**
 * Một sản phẩm trước khi được nở ra thành các biến thể.
 *
 * `variants` để trống thì tồn kho được suy ra từ hash (catalogue mẫu bên dưới);
 * hàng nhập từ Shopee mang theo tồn kho thật nên tự khai luôn.
 */
export type Seed = Omit<Product, "variants" | "sizes"> & {
  sizes: readonly string[];
  variants?: Variant[];
};

const demoSeeds: Seed[] = [
  {
    slug: "everyday-hoodie",
    name: "Áo Hoodie Hằng Ngày",
    category: "Hoodie",
    audience: "Unisex",
    price: 1700000,
    comparePrice: 2230000,
    image: "/images/p-everyday-hoodie-1.png",
    hoverImage: "/images/p-everyday-hoodie-2.png",
    isNew: true,
    rating: 4.8,
    reviews: 214,
    description:
      "Áo hoodie vải nỉ da cá dày vừa phải, phom rộng thoải mái, mũ hai lớp. Đủ mềm để mặc ở nhà và đủ đứng phom để mặc ra phố.",
    details: [
      "Nỉ da cá cotton hữu cơ 380 gsm",
      "Phom rộng — chọn nhỏ hơn một size nếu muốn dáng gọn",
      "Bo tay và gấu dệt rib, dây mũ cùng màu",
      "Giặt máy nước lạnh, phơi ngang",
    ],
    colors: [COLORS.sand, COLORS.espresso, COLORS.ink],
    sizes: SIZES.tops,
  },
  {
    slug: "lightweight-jacket",
    name: "Áo Khoác Nhẹ",
    category: "Áo khoác",
    audience: "Nam",
    price: 3200000,
    image: "/images/p-lightweight-jacket-1.png",
    hoverImage: "/images/p-lightweight-jacket-2.png",
    isNew: true,
    rating: 4.7,
    reviews: 96,
    description:
      "Áo khoác một lớp cho những ngày giao mùa. Cản gió tốt, gấp gọn được và đủ nhã để khoác ngoài đồ công sở.",
    details: [
      "Vỏ polyester tái chế, bề mặt lì không bóng",
      "Chống thấm nước nhẹ, không dùng hoá chất fluor",
      "Hai túi hai bên và một túi ngực bên trong",
      "Phom vừa — khoác vừa vặn bên ngoài áo hoodie",
    ],
    colors: [COLORS.olive, COLORS.slate, COLORS.ink],
    sizes: SIZES.tops,
  },
  {
    slug: "zipper-jacket",
    name: "Áo Khoác Khoá Kéo",
    category: "Áo khoác",
    audience: "Nam",
    price: 3630000,
    comparePrice: 4380000,
    image: "/images/p-zipper-jacket-1.png",
    hoverImage: "/images/p-zipper-jacket-2.png",
    rating: 4.6,
    reviews: 141,
    description:
      "Áo khoá kéo tối giản, cổ trụ đứng, thân hơi ngắn. Chiếc áo khoác mặc được với mọi món bạn đang có sẵn trong tủ.",
    details: [
      "Vải chéo pha cotton–nylon, mặt trong chải lông",
      "Khoá YKK hai chiều, có nẹp che khoá",
      "Cổ và bo tay dệt rib",
      "Phom vừa",
    ],
    colors: [COLORS.espresso, COLORS.ink, COLORS.fog],
    sizes: SIZES.tops,
  },
  {
    slug: "relaxed-fit-cardigan",
    name: "Áo Cardigan Dáng Rộng",
    category: "Cardigan",
    audience: "Nữ",
    price: 2450000,
    image: "/images/p-cardigan-1.png",
    hoverImage: "/images/p-cardigan-2.png",
    rating: 4.9,
    reviews: 178,
    description:
      "Áo len cài nút dáng dài, vai trễ. Khoác ngoài áo thun hay váy là đã đủ trọn bộ đồ.",
    details: [
      "Len merino pha cotton, dệt kim cỡ 12",
      "Vai trễ, phom oversize",
      "Nút làm từ hạt cọ corozo",
      "Giặt tay hoặc chế độ giặt len",
    ],
    colors: [COLORS.cream, COLORS.clay, COLORS.fog],
    sizes: SIZES.tops,
  },
  {
    slug: "kids-graphic-t-shirt",
    name: "Áo Thun In Hình Trẻ Em",
    category: "Áo thun",
    audience: "Trẻ em",
    price: 600000,
    image: "/images/p-kids-tee-1.png",
    hoverImage: "/images/p-kids-tee-2.png",
    rating: 4.7,
    reviews: 88,
    description:
      "Áo thun mặc hằng ngày, chất mềm, hình in gốc nước bền màu qua nhiều lần giặt — và qua cả những buổi chạy nhảy ngoài sân.",
    details: [
      "Cotton chải kỹ 180 gsm",
      "Mực in gốc nước, không dùng plastisol",
      "Viền cổ bọc gọn, không cấn da",
      "Giặt máy nước ấm",
    ],
    colors: [COLORS.cream, COLORS.indigo, COLORS.rust],
    sizes: SIZES.kids,
  },
  {
    slug: "classic-hoodie",
    name: "Áo Hoodie Cổ Điển",
    category: "Hoodie",
    audience: "Unisex",
    price: 1800000,
    image: "/images/p-classic-hoodie-1.png",
    hoverImage: "/images/p-classic-hoodie-2.png",
    rating: 4.8,
    reviews: 302,
    description:
      "Chiếc hoodie nguyên bản của TBC. Thân suông, tay ráp, chiếc mũ vẫn giữ nguyên phom sau cả năm mặc.",
    details: [
      "Nỉ bông chải mặt trong 400 gsm",
      "Tay ráp, phom suông",
      "Túi kangaroo",
      "Vải đã xử lý co — chọn đúng size thường mặc",
    ],
    colors: [COLORS.ink, COLORS.sand, COLORS.olive],
    sizes: SIZES.tops,
  },
  {
    slug: "kids-jogger-pants",
    name: "Quần Jogger Trẻ Em",
    category: "Quần",
    audience: "Trẻ em",
    price: 800000,
    image: "/images/p-kids-jogger-1.png",
    hoverImage: "/images/p-kids-jogger-2.png",
    rating: 4.6,
    reviews: 64,
    description:
      "Lưng chun, ống bo chun, túi sâu. Thoải mái để chạy nhảy và đủ đơn giản để bé tự mặc.",
    details: [
      "Vải nỉ chân cua thành phần cotton là chính",
      "Có dây rút bên trong điều chỉnh được",
      "Gia cố phần đầu gối",
      "Giặt máy nước ấm, sấy nhiệt thấp",
    ],
    colors: [COLORS.slate, COLORS.olive, COLORS.ink],
    sizes: SIZES.kids,
  },
  {
    slug: "oversized-graphic-tee",
    name: "Áo Thun Oversize In Hình",
    category: "Áo thun",
    audience: "Unisex",
    price: 1130000,
    image: "/images/p-graphic-tee-1.png",
    hoverImage: "/images/p-graphic-tee-2.png",
    isNew: true,
    rating: 4.5,
    reviews: 127,
    description:
      "Áo thun vải dày phom vuông, giữ dáng tốt. Vai rộng, thân ngắn, hình in cố ý để nhỏ.",
    details: [
      "Cotton dày 240 gsm",
      "Phom vuông — chọn nhỏ hơn một size nếu muốn dáng vừa",
      "Cổ dệt rib, gấu may hai kim",
      "Giặt máy nước lạnh",
    ],
    colors: [COLORS.cream, COLORS.ink, COLORS.rust],
    sizes: SIZES.tops,
  },
  {
    slug: "graphic-sweatshirt",
    name: "Áo Nỉ In Hình",
    category: "Áo len",
    audience: "Unisex",
    price: 2050000,
    image: "/images/p-graphic-sweatshirt-1.png",
    hoverImage: "/images/p-graphic-sweatshirt-2.png",
    rating: 4.7,
    reviews: 155,
    description:
      "Áo nỉ cổ tròn, mặt trong chải mềm, hình thêu cùng tông ở ngực. Cách mặc logo một cách kín đáo.",
    details: [
      "Nỉ pha cotton 360 gsm",
      "Hình thêu cùng tông màu áo",
      "Cổ, bo tay và gấu dệt rib",
      "Phom vừa",
    ],
    colors: [COLORS.fog, COLORS.espresso, COLORS.indigo],
    sizes: SIZES.tops,
  },
  {
    slug: "kids-puffer-jacket",
    name: "Áo Phao Trẻ Em",
    category: "Áo khoác",
    audience: "Trẻ em",
    price: 1900000,
    comparePrice: 2380000,
    image: "/images/p-kids-puffer-1.png",
    hoverImage: "/images/p-kids-puffer-2.png",
    isNew: true,
    rating: 4.9,
    reviews: 73,
    description:
      "Ấm mà không cồng kềnh. Bông tái chế, mũ ôm không bị tuột, có ngăn che đầu khoá để không cấn cằm.",
    details: [
      "Vỏ và bông đều từ polyester tái chế",
      "Xử lý chống thấm nước nhẹ",
      "Bo tay và gấu chun",
      "Viền phản quang ở lưng áo",
    ],
    colors: [COLORS.rust, COLORS.indigo, COLORS.ink],
    sizes: SIZES.kids,
  },
  {
    slug: "soft-knit-sweater",
    name: "Áo Len Mềm",
    category: "Áo len",
    audience: "Nữ",
    price: 2200000,
    image: "/images/p-knit-sweater-1.png",
    hoverImage: "/images/p-knit-sweater-2.png",
    rating: 4.8,
    reviews: 199,
    description:
      "Áo len cổ tròn sợi mảnh, mặc lót trong áo khoác không bị dồn vải. Đủ mềm để mặc trực tiếp lên da.",
    details: [
      "Len merino pha, dệt kim cỡ 14",
      "Phom vừa hơi ôm",
      "Cổ, bo tay và gấu dệt rib",
      "Giặt chế độ len, phơi ngang",
    ],
    colors: [COLORS.cream, COLORS.clay, COLORS.olive],
    sizes: SIZES.tops,
  },
  {
    slug: "kids-everyday-hoodie",
    name: "Áo Hoodie Trẻ Em",
    category: "Hoodie",
    audience: "Trẻ em",
    price: 950000,
    image: "/images/p-kids-hoodie-1.png",
    hoverImage: "/images/p-kids-hoodie-2.png",
    rating: 4.7,
    reviews: 112,
    description:
      "Bản thu nhỏ của Áo Hoodie Hằng Ngày — vẫn là nỉ da cá cotton, mềm hơn một chút và bỏ dây mũ cho an toàn.",
    details: [
      "Nỉ da cá cotton hữu cơ 320 gsm",
      "Không có dây mũ — đạt chuẩn an toàn cho trẻ",
      "Túi kangaroo",
      "Giặt máy nước ấm",
    ],
    colors: [COLORS.sand, COLORS.rust, COLORS.slate],
    sizes: SIZES.kids,
  },
  {
    slug: "utility-cargo-pants",
    name: "Quần Cargo Túi Hộp",
    category: "Quần",
    audience: "Nam",
    price: 2380000,
    image: "/images/p-cargo-pants-1.png",
    hoverImage: "/images/p-cargo-pants-2.png",
    isNew: true,
    rating: 4.6,
    reviews: 134,
    description:
      "Quần cargo ống suông, túi hộp may sát thân quần nên không bị phồng. Tinh thần workwear nhưng gọn gàng hơn.",
    details: [
      "Vải ripstop cotton có độ co giãn nhẹ",
      "Ống suông, lưng vừa",
      "Sáu túi, các điểm chịu lực may chặn",
      "Giặt máy nước lạnh, phơi treo",
    ],
    colors: [COLORS.olive, COLORS.sand, COLORS.ink],
    sizes: SIZES.bottoms,
  },
  {
    slug: "high-waist-wide-leg-jeans",
    name: "Quần Jeans Ống Rộng Lưng Cao",
    category: "Quần",
    audience: "Nữ",
    price: 2750000,
    image: "/images/p-wide-jeans-1.png",
    hoverImage: "/images/p-wide-jeans-2.png",
    rating: 4.8,
    reviews: 246,
    description:
      "Denim thô lưng cao, ống rộng đổ thẳng. Càng mặc càng mềm theo dáng người mà vẫn giữ phom cả ngày.",
    details: [
      "Denim cotton thô 13 oz",
      "Lưng cao, ống rộng",
      "Cửa quần cài nút, chỉ may cùng tông",
      "Lộn trái khi giặt, dùng nước lạnh",
    ],
    colors: [COLORS.indigo, COLORS.fog, COLORS.ink],
    sizes: SIZES.bottoms,
  },
];

/**
 * Hàng thật thay thế catalogue mẫu ngay khi `npm run import:shopee` chạy xong.
 * Trước lúc đó trang vẫn có đồ để hiển thị, nên không bao giờ rơi vào trạng thái trống.
 */
const seeds: Seed[] = shopeeSeeds.length > 0 ? shopeeSeeds : demoSeeds;

/**
 * Giá thử thanh toán.
 *
 * `NEXT_PUBLIC_TEST_PRICE=1000` ép mọi món về 1.000 ₫ để chuyển khoản thật mà
 * không tốn tiền thật. Bỏ biến đó đi là bảng giá trở lại nguyên vẹn — cố ý làm
 * bằng biến môi trường thay vì sửa thẳng số trong catalogue, vì sửa tay thì
 * phải nhớ khôi phục đúng từng mức giá trước khi bán, và quên một dòng là bán lỗ.
 *
 * Phải có tiền tố NEXT_PUBLIC_: giá hiển thị ở cả máy chủ lẫn trình duyệt, biến
 * chỉ có ở một phía sẽ làm hai bên vẽ ra hai con số khác nhau và hỏng hydrate.
 */
const TEST_PRICE = Math.floor(Number(process.env.NEXT_PUBLIC_TEST_PRICE ?? 0));

/** true khi đang chạy giá thử — checkout đọc cờ này để bỏ luôn phí giao hàng */
export const IS_TEST_PRICING = Number.isFinite(TEST_PRICE) && TEST_PRICE > 0;

// Kêu to một lần lúc khởi động máy chủ. Deploy nhầm với biến này còn bật thì cả
// cửa hàng bán 1.000 ₫ một món, và không có gì trên giao diện nói cho biết điều đó.
if (IS_TEST_PRICING && typeof window === "undefined") {
  console.warn(
    `\n⚠  GIÁ THỬ ĐANG BẬT — mọi sản phẩm bán ${TEST_PRICE} ₫, miễn phí giao hàng.` +
      `\n   Xoá NEXT_PUBLIC_TEST_PRICE khỏi .env trước khi bán hàng thật.\n`,
  );
}

export const products: Product[] = seeds.map((seed) => ({
  ...seed,
  ...(IS_TEST_PRICING
    ? // bỏ luôn comparePrice: giữ lại thì trang sản phẩm khoe "giảm 99%"
      { price: TEST_PRICE, comparePrice: undefined }
    : {}),
  sizes: [...seed.sizes],
  variants:
    seed.variants ??
    seed.colors.flatMap((color) =>
      seed.sizes.map((size) => ({
        id: `${seed.slug}__${color.name}__${size}`,
        color: color.name,
        size,
        stock: stockFor(`${seed.slug}|${color.name}|${size}`),
      })),
    ),
}));

/**
 * Các khối trên trang chủ ghim sẵn vài sản phẩm chọn lọc.
 *
 * Khi catalogue mẫu bị thay bằng hàng thật từ Shopee thì những slug đó biến
 * mất, nên danh sách được bù cho đủ số ô thay vì làm vỡ trang — hàng mới về
 * được ưu tiên trước.
 */
const curated = (slugs: string[], count: number): Product[] => {
  const picked = slugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((product): product is Product => product !== undefined);

  const backfill = [...products].sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
  for (const product of backfill) {
    if (picked.length >= count) break;
    if (!picked.includes(product)) picked.push(product);
  }
  return picked.slice(0, count);
};

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const findVariant = (product: Product, color: string, size: string) =>
  product.variants.find((v) => v.color === color && v.size === size);

export const inStock = (product: Product) => product.variants.some((v) => v.stock > 0);

export const newArrivals = curated([
  "everyday-hoodie",
  "lightweight-jacket",
  "oversized-graphic-tee",
  "kids-puffer-jacket",
  "utility-cargo-pants",
], 5);

export const seasonalDrop = curated([
  "zipper-jacket",
  "relaxed-fit-cardigan",
  "kids-puffer-jacket",
  "kids-everyday-hoodie",
], 4);

/** ── bộ lọc cửa hàng, suy ra từ danh mục nên không bao giờ lệch ────────── */

const uniqueSorted = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, "vi"));

export const allCategories = uniqueSorted(products.map((p) => p.category));

/** tab lọc ở khối "Bán chạy nhất" — bám theo danh mục thật đang có hàng */
export const bestSellerFilters: string[] = ["Tất cả", ...allCategories.slice(0, 6)];

export const allAudiences: Audience[] = ["Nam", "Nữ", "Trẻ em", "Unisex"];

export const allSizes = uniqueSorted(products.flatMap((p) => p.sizes));

/**
 * Gom size thành nhóm để bảng lọc gắn nhãn được.
 *
 * Chỉ giữ lại size thật sự có hàng, và bất kỳ size nào không thuộc ba nhóm quen
 * thuộc — "Freesize", "2XL", size do shop tự đặt — vẫn được gom vào nhóm cuối
 * thay vì biến mất khỏi bộ lọc.
 */
export const sizeGroups: Array<{ label: string; sizes: string[] }> = (() => {
  const present = new Set<string>(allSizes);
  const groups = [
    { label: "Áo", sizes: SIZES.tops.filter((size) => present.has(size)) as string[] },
    { label: "Quần (eo, inch)", sizes: SIZES.bottoms.filter((size) => present.has(size)) as string[] },
    { label: "Trẻ em (tuổi)", sizes: SIZES.kids.filter((size) => present.has(size)) as string[] },
  ].filter((group) => group.sizes.length > 0);

  const grouped = new Set<string>(groups.flatMap((group) => group.sizes));
  const rest = allSizes.filter((size) => !grouped.has(size));
  if (rest.length > 0) groups.push({ label: groups.length > 0 ? "Khác" : "Size", sizes: rest });

  return groups;
})();

export const allColors: ProductColor[] = Object.values(COLORS).sort((a, b) =>
  a.name.localeCompare(b.name, "vi"),
);

export const priceBounds = {
  min: Math.floor(Math.min(...products.map((p) => p.price))),
  max: Math.ceil(Math.max(...products.map((p) => p.price))),
};

export const sortOptions = [
  { value: "featured", label: "Nổi bật" },
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá thấp đến cao" },
  { value: "price-desc", label: "Giá cao đến thấp" },
  { value: "rating", label: "Đánh giá cao nhất" },
  { value: "name", label: "Tên A–Z" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

export type ShopQuery = {
  q?: string;
  categories?: string[];
  audiences?: string[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  isNew?: boolean;
  inStock?: boolean;
  sort?: SortValue;
};

/** bỏ dấu để "ao khoac" vẫn tìm ra "áo khoác" */
const deburr = (value: string) =>
  value
    .normalize("NFD")
    // viết bằng mã escape thay vì ký tự thật, vì dấu tổ hợp là ký tự vô hình
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const matchesText = (product: Product, q: string) => {
  // các trường ngắn, đúng trọng tâm: đây là nơi quyết định phần lớn kết quả
  const labels = deburr(
    [product.name, product.category, product.audience, ...product.colors.map((c) => c.name)].join(
      " ",
    ),
  );
  // phần văn xuôi: mô tả và thông tin chất liệu
  const prose = deburr([product.description, ...product.details].join(" "));
  const query = deburr(q).trim();
  const words = query.split(/\s+/).filter(Boolean);

  // Mọi từ đều phải xuất hiện trong phần nhãn, để "hoodie trẻ em" thu hẹp kết quả
  // chứ không mở rộng. Cố ý không quét phần văn xuôi theo từng từ: tiếng Việt có
  // quá nhiều từ đơn âm phổ biến ("áo", "quần") nên chỉ một từ cũng kéo về gần hết
  // danh mục. Văn xuôi chỉ khớp khi cả cụm xuất hiện, để những từ khoá về chất
  // liệu như "cotton" hay "merino" vẫn tìm được.
  if (words.every((word) => labels.includes(word))) return true;
  return query.length >= 4 && prose.includes(query);
};

export function filterProducts(query: ShopQuery): Product[] {
  const {
    q,
    categories,
    audiences,
    sizes,
    colors,
    minPrice,
    maxPrice,
    onSale,
    isNew,
    inStock: stockOnly,
    sort = "featured",
  } = query;

  const result = products.filter((product) => {
    if (q && !matchesText(product, q)) return false;
    if (categories?.length && !categories.includes(product.category)) return false;
    if (audiences?.length && !audiences.includes(product.audience)) return false;
    if (sizes?.length && !product.sizes.some((size) => sizes.includes(size))) return false;
    if (colors?.length && !product.colors.some((color) => colors.includes(color.name))) return false;
    if (minPrice !== undefined && product.price < minPrice) return false;
    if (maxPrice !== undefined && product.price > maxPrice) return false;
    if (onSale && !product.comparePrice) return false;
    if (isNew && !product.isNew) return false;
    if (stockOnly && !inStock(product)) return false;
    return true;
  });

  const order = products.map((p) => p.slug);
  const sorters: Record<SortValue, (a: Product, b: Product) => number> = {
    featured: (a, b) => order.indexOf(a.slug) - order.indexOf(b.slug),
    newest: (a, b) => Number(!!b.isNew) - Number(!!a.isNew),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    name: (a, b) => a.name.localeCompare(b.name, "vi"),
  };

  return result.sort(sorters[sort] ?? sorters.featured);
}

export type FacetCounts = {
  categories: Record<string, number>;
  audiences: Record<string, number>;
  sizes: Record<string, number>;
  colors: Record<string, number>;
};

/**
 * Mỗi giá trị lọc sẽ cho ra bao nhiêu sản phẩm. Một nhóm lọc được đếm trên truy
 * vấn đã bỏ đi lựa chọn của *chính nó*, nên khi tick thêm một màu thì không bao
 * giờ hiện "(0)" cạnh một màu đang nhìn thấy trên màn hình.
 */
export function facetCounts(query: ShopQuery): FacetCounts {
  const countBy = (
    key: "categories" | "audiences" | "sizes" | "colors",
    values: string[],
    valuesOf: (product: Product) => string[],
  ) => {
    const base = filterProducts({ ...query, [key]: [] });
    return Object.fromEntries(
      values.map((value) => [value, base.filter((p) => valuesOf(p).includes(value)).length]),
    );
  };

  return {
    categories: countBy("categories", allCategories, (p) => [p.category]),
    audiences: countBy("audiences", allAudiences, (p) => [p.audience]),
    sizes: countBy("sizes", allSizes, (p) => p.sizes),
    colors: countBy("colors", allColors.map((c) => c.name), (p) => p.colors.map((c) => c.name)),
  };
}

export const relatedProducts = (product: Product, limit = 4) =>
  products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => {
      const score = (p: Product) =>
        (p.category === product.category ? 2 : 0) + (p.audience === product.audience ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, limit);

export const categories = [
  {
    label: "Dành cho Nam",
    title: "Tự Tin Trong Từng Ngày",
    image: "/images/cat-men.png",
    href: "/shop?audience=Nam",
  },
  {
    label: "Dành cho Nữ",
    title: "Thiết Kế Cho Nhịp Sống Hiện Đại",
    image: "/images/cat-women.png",
    href: "/shop?audience=N%E1%BB%AF",
  },
  {
    label: "Dành cho Trẻ Em",
    title: "Thoải Mái Cho Mọi Cuộc Phiêu Lưu",
    image: "/images/cat-kids.png",
    href: "/shop?audience=Tr%E1%BA%BB%20em",
  },
];

export const promises = [
  {
    icon: "ship" as const,
    title: "Giao Hàng Toàn Quốc",
    body: "Chúng tôi giao đến mọi tỉnh thành, nhanh và đáng tin cậy. Theo dõi đơn hàng và nhận hàng ở bất cứ đâu bạn đang ở.",
  },
  {
    icon: "leaf" as const,
    title: "Chất Liệu Bền Vững",
    body: "Mỗi món đồ đều làm từ nguyên liệu có nguồn gốc trách nhiệm. Mặc đẹp mà vẫn nhẹ lòng với môi trường.",
  },
  {
    icon: "return" as const,
    title: "Đổi Trả Miễn Phí 30 Ngày",
    body: "Chưa hài lòng? Đổi trả trong vòng 30 ngày và được hoàn tiền đầy đủ. Không hỏi lý do, không rườm rà.",
  },
  {
    icon: "shield" as const,
    title: "Thanh Toán An Toàn",
    body: "Mua sắm yên tâm với thanh toán được mã hoá. Hỗ trợ mọi phương thức thanh toán phổ biến.",
  },
];

export type TestimonialTile =
  | { type: "quote"; quote: string; author: string }
  | { type: "image"; src: string; alt: string };

export const testimonials: TestimonialTile[] = [
  {
    type: "quote",
    quote: "Thiết kế đơn giản, mặc rất thoải mái, giao hàng nhanh. Đúng thứ mình đang tìm.",
    author: "Minh Anh",
  },
  { type: "image", src: "/images/testi-1.png", alt: "Khách hàng mặc áo blazer của TBC" },
  {
    type: "quote",
    quote: "Kiểu dáng gọn gàng, đi đâu cũng hợp. Chất lượng và độ tỉ mỉ thấy rõ.",
    author: "Quốc Bảo",
  },
  {
    type: "quote",
    quote: "Chất lượng vượt mong đợi. Món nào cũng đứng phom và vừa vặn.",
    author: "Thuỳ Linh",
  },
  { type: "image", src: "/images/testi-2.png", alt: "Khách hàng mặc áo len của TBC" },
  {
    type: "quote",
    quote: "Vải chạm tay rất thích, form mặc dễ chịu. Tuần nào mình cũng lấy ra mặc.",
    author: "Gia Huy",
  },
  {
    type: "quote",
    quote: "Hiện đại, thoải mái và dễ phối đồ. Đơn nào cũng thấy đáng tiền.",
    author: "Hải Đăng",
  },
  { type: "image", src: "/images/testi-3.png", alt: "Khách hàng mặc áo khoác bomber của TBC" },
  {
    type: "quote",
    quote: "Đồ cơ bản mặc hằng ngày mà cảm giác cao cấp. Mình đã đặt thêm lần nữa.",
    author: "Ngọc Trâm",
  },
];

export const journal = [
  {
    slug: "tu-do-co-ban",
    title: "Xây Dựng Tủ Đồ Cơ Bản",
    excerpt: "Những món đồ dễ phối giúp việc mặc gì mỗi sáng trở nên nhẹ nhàng hơn.",
    date: "25 Tháng 6, 2026",
    image: "/images/journal-1.png",
  },
  {
    slug: "phoi-lop-mua-he",
    title: "Phối Lớp Mùa Hè Thật Dễ",
    excerpt: "Những món mỏng nhẹ tạo chiều sâu cho outfit mà vẫn thoáng mát.",
    date: "23 Tháng 6, 2026",
    image: "/images/journal-2.png",
  },
  {
    slug: "chon-dang-quan-jeans",
    title: "Cẩm Nang Chọn Dáng Quần Jeans",
    excerpt: "Tìm đúng phom quần với hướng dẫn về các dáng jeans hiện đại.",
    date: "21 Tháng 6, 2026",
    image: "/images/journal-3.png",
  },
];

export const instagramFeed = [
  { src: "/images/ig-1.png", alt: "Ảnh cộng đồng — áo len đỏ" },
  { src: "/images/ig-2.png", alt: "Ảnh cộng đồng — áo hoodie xám" },
  { src: "/images/ig-3.png", alt: "Ảnh cộng đồng — áo khoác phối lớp" },
  { src: "/images/ig-4.png", alt: "Ảnh cộng đồng — set đồ màu kem" },
  { src: "/images/ig-5.png", alt: "Ảnh cộng đồng — áo hoodie đỏ" },
  { src: "/images/ig-6.png", alt: "Ảnh cộng đồng — áo thun xanh và quần jogger" },
];

export const footerNav = [
  {
    title: "Trang",
    links: [
      { label: "Trang chủ", href: "/" },
      { label: "Cửa hàng", href: "/shop" },
      { label: "Bài viết", href: "/#journal" },
      { label: "Về chúng tôi", href: "/#categories" },
      { label: "Câu hỏi thường gặp", href: "/#promises" },
      { label: "Liên hệ", href: "/#newsletter" },
    ],
  },
  {
    title: "Bộ sưu tập",
    links: [
      { label: "Đồ nam", href: "/shop?audience=Nam" },
      { label: "Đồ nữ", href: "/shop?audience=N%E1%BB%AF" },
      { label: "Đồ trẻ em", href: "/shop?audience=Tr%E1%BA%BB%20em" },
      { label: "Bán chạy nhất", href: "/shop?sort=rating" },
      { label: "Đang giảm giá", href: "/shop?sale=1" },
      { label: "Hàng mới về", href: "/shop?new=1" },
    ],
  },
  {
    title: "Pháp lý",
    links: [
      { label: "Chính sách bảo mật", href: "/#top" },
      { label: "Điều khoản dịch vụ", href: "/#top" },
      { label: "Chính sách đổi trả", href: "/#top" },
      { label: "Chính sách giao hàng", href: "/#top" },
      { label: "Chính sách cookie", href: "/#top" },
    ],
  },
  {
    title: "Kết nối",
    /**
     * Chỉ liệt kê kênh có thật. Trước đây cột này có Instagram, X và Pinterest
     * cùng trỏ về `/#instagram` — link chết khiến khách bấm vào rồi quay ra,
     * tệ hơn hẳn so với không hiện gì.
     *
     * Footer tự chọn cách mở dựa trên `href`: `/` đi trong ứng dụng, `http` mở
     * tab mới, `tel:` giao cho máy quay số.
     */
    links: [
      { label: "Fanpage Facebook", href: CONTACT.facebookUrl },
      { label: "Nhắn Zalo", href: CONTACT.zaloUrl },
      { label: `Hotline ${CONTACT.phoneDisplay}`, href: CONTACT.phoneHref },
      { label: "Gian hàng Shopee", href: "/#shopee" },
    ],
  },
];

/**
 * Đồng Việt Nam, không có phần lẻ.
 *
 * Giá trong catalogue chính là số tiền chuyển khoản — không quy đổi, không làm
 * tròn ở khâu thanh toán, nên con số khách nhìn thấy khớp từng đồng với số
 * PayOS nhận.
 */
export const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
