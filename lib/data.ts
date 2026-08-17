import { shopeeCategories, shopeeSeeds } from "./catalogue.generated";
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
  /** lượt bán tích luỹ trên Shopee — chỉ có ở hàng đồng bộ qua API, dùng để xếp "bán chạy" */
  sold?: number;
  /** item_id trên Shopee, để đối chiếu khi đồng bộ và để trỏ về gian hàng */
  shopeeItemId?: number;
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
 * Một sản phẩm trước khi được nở ra thành các biến thể.
 *
 * `variants` luôn có: mọi sản phẩm đều đến từ trang quản trị và mang theo
 * tồn kho thật của từng size × màu.
 */
export type Seed = Omit<Product, "variants" | "sizes"> & {
  sizes: readonly string[];
  variants?: Variant[];
};

/**
 * Toàn bộ catalogue lấy từ trang quản trị — không còn dữ liệu mẫu nào.
 *
 *   npm run sync:warehouse
 *
 * Trước đây file này có sẵn một catalogue mẫu để trang không bao giờ trống, và
 * tồn kho của nó được suy ra từ hash tên biến thể. Đã bỏ cả hai: hàng mẫu trông
 * y hệt hàng thật nên rất dễ lỡ bán một món không tồn tại, còn tồn kho bịa ra
 * thì cho khách đặt hàng đã hết. Thà trang trống và báo rõ.
 */
const seeds: Seed[] = shopeeSeeds;

if (seeds.length === 0 && typeof window === "undefined") {
  console.warn(
    "\n⚠  Catalogue đang trống — chưa đồng bộ từ trang quản trị." +
      "\n   Chạy: npm run sync:warehouse\n",
  );
}

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
  // Biến thể luôn đến từ trang quản trị kèm tồn kho thật. Không còn đường
  // nào dựng biến thể "ảo": sản phẩm chưa khai size/màu thì đơn giản là
  // không mua được, thay vì bày ra tổ hợp không tồn tại.
  variants: seed.variants ?? [],
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

/**
 * Tab lọc ở khối "Bán chạy nhất".
 *
 * Khi có dữ liệu Shopee thì lấy danh mục nhiều hàng nhất lên trước — sáu danh
 * mục đầu bảng chữ cái thường rơi vào những nhóm chỉ có một hai sản phẩm, bấm
 * vào là ra dãy trống.
 */
export const bestSellerFilters: string[] = [
  "Tất cả",
  ...(shopeeCategories.length > 0
    ? shopeeCategories.slice(0, 6).map((c) => c.name)
    : allCategories.slice(0, 6)),
];

/**
 * Bán chạy nhất: xếp theo lượt bán thật lấy từ `get_item_extra_info`.
 *
 * Catalogue mẫu không có `sold`, lúc đó thứ tự giữ nguyên như trước — số lượt
 * bán bịa ra để sắp xếp còn tệ hơn là không sắp xếp.
 */
export const bestSellers: Product[] =
  products.some((p) => (p.sold ?? 0) > 0)
    ? [...products].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
    : products;

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

/**
 * Đánh giá của khách — trống cho tới khi có đánh giá thật.
 *
 * Trước đây đây là những lời khen và tên khách do người viết code nghĩ ra.
 * Bằng chứng xã hội bịa ra thì tệ hơn là không có: khách tin vào nó để quyết
 * định mua. Khi nào shop có đánh giá thật thì đổ vào mảng này.
 */
export const testimonials: TestimonialTile[] = [];

/**
 * Bài viết — trống cho tới khi shop tự viết.
 * Ba bài mẫu trước đây có ngày tháng và nội dung bịa.
 */
export const journal: Array<{ slug: string; title: string; excerpt: string; date: string; image: string }> = [];

/**
 * Ảnh cộng đồng — trống cho tới khi nối Instagram thật.
 * Sáu ảnh mẫu trước đây không phải ảnh khách của shop.
 */
export const instagramFeed: Array<{ src: string; alt: string }> = [];

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
