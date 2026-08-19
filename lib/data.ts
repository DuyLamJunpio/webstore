import type { RootCategory } from "./warehouse-map";
import { CONTACT } from "./contact";

export type Audience = "Nam" | "Nữ" | "Trẻ em" | "Unisex";

export type ProductColor = { name: string; hex: string };

/** một tổ hợp mua được — màu + size — với tồn kho riêng */
export type Variant = {
  id: string;
  color: string;
  size: string;
  stock: number;
  /**
   * Giá riêng của biến thể khi bên quản trị có đặt "giá riêng"; thiếu thì dùng
   * giá chung của sản phẩm. Để tuỳ chọn vì bản catalogue dự phòng không có.
   */
  price?: number;
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
  /** toàn bộ ảnh bên quản trị, đúng thứ tự đã sắp; thiếu thì suy ra từ hai ảnh trên */
  gallery?: string[];
  /** video mp4 bên quản trị, phát thẳng ở trang chi tiết */
  videos?: string[];
  isNew?: boolean;
  /** ISO 8601 ngày tạo bên quản trị, dùng để sắp "hàng mới về". */
  createdAt?: string;
  rating: number;
  reviews: number;
  /** lượt bán thật, chỉ đếm đơn đã hoàn thành — dùng để xếp "bán chạy" */
  sold?: number;
  /** item_id trên Shopee, để đối chiếu khi đồng bộ và để trỏ về gian hàng */
  shopeeItemId?: number;
  description: string;
  details: string[];
  colors: ProductColor[];
  sizes: string[];
  /** mọi tổ hợp màu × size, dựng một lần khi nạp module */
  variants: Variant[];
  /**
   * Bên quản trị có theo dõi tồn kho của mặt hàng này không. Tắt với hàng đặt
   * may hay hàng order: kho ghi 0 nhưng vẫn bán bình thường. Để tuỳ chọn vì bản
   * catalogue dự phòng chụp trước khi có cờ này không mang theo nó — thiếu thì
   * coi như có theo dõi, đúng cách chạy cũ.
   */
  manageStock?: boolean;
};

/** một ô trong gallery — ảnh tĩnh hoặc video mp4 */
export type Media = { type: "image" | "video"; src: string };

const uniqueMedia = (type: Media["type"], sources: string[]): Media[] =>
  [...new Set(sources)].map((src) => ({ type, src }));

/**
 * Bộ media của trang chi tiết. Ưu tiên `gallery` đầy đủ từ trang quản trị; hàng
 * đồng bộ trước khi có trường đó thì lùi về hai tấm ảnh của thẻ sản phẩm.
 * Bỏ trùng: sản phẩm chỉ có một ảnh thì hoverImage lặp lại chính nó, để nguyên
 * sẽ ra hai thumbnail giống hệt nhau và React báo trùng key.
 *
 * Sản phẩm chưa chụp ảnh mà đã có video thì video đứng luôn vai trò ảnh chính —
 * bày ảnh giữ chỗ bên cạnh một đoạn video là tự bôi xấu món hàng đang bán.
 */
export const galleryOf = (product: Product): Media[] => {
  const videos = uniqueMedia("video", product.videos ?? []);
  if (!product.gallery?.length && videos.length > 0) return videos;

  const stills = uniqueMedia(
    "image",
    product.gallery?.length ? product.gallery : [product.image, product.hoverImage],
  );
  return [...stills, ...videos];
};

/**
 * Hai ô đầu của gallery — thẻ sản phẩm dùng ô thứ nhất, ô thứ hai là ảnh đổi khi
 * rê chuột. Đọc từ `galleryOf` thay vì `product.image` để món chỉ có video cũng
 * hiện được khung hình của nó thay vì ảnh giữ chỗ.
 */
export const coverOf = (product: Product): [Media, Media] => {
  const [first, second] = galleryOf(product);
  return [first, second ?? first];
};

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

/* ── catalogue ─────────────────────────────────────────────────────── */

export type CategoryTile = { label: string; title: string; image: string; href: string };

/** Giá trị dựng nên bảng lọc, suy ra từ hàng đang bán nên không bao giờ lệch. */
export type ShopFacets = {
  categories: string[];
  sizes: string[];
  sizeGroups: Array<{ label: string; sizes: string[] }>;
  priceBounds: { min: number; max: number };
};

/**
 * Toàn bộ những gì trang cần để vẽ, dựng một lần cho mỗi lượt nạp dữ liệu.
 *
 * Trước đây đây là các hằng số ở cấp module, đọc từ catalogue bake sẵn lúc
 * build: sửa sản phẩm bên quản trị là phải chạy `npm run sync:warehouse` rồi
 * build lại thì web mới đổi. Giờ dữ liệu đến lúc chạy, nên mọi thứ phải dựng
 * được từ dữ liệu truyền vào thay vì nằm cứng trong module.
 */
export type Catalogue = {
  products: Product[];
  /** ô "Mua theo danh mục" ở trang chủ */
  tiles: CategoryTile[];
  newArrivals: Product[];
  seasonalDrop: Product[];
  bestSellers: Product[];
  bestSellerFilters: string[];
  facets: ShopFacets;
  /** lúc trang quản trị chốt số liệu này */
  syncedAt: string | null;
  /** true khi không gọi được trang quản trị và đang dùng bản chụp dự phòng */
  stale: boolean;
};

const uniqueSorted = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, "vi"));

/** Các khối trên trang chủ chỉ cần đủ số ô; hàng mới về được ưu tiên trước. */
/** Mới nhất trước, theo ngày tạo thật bên quản trị. */
const moiNhatTruoc = (a: Product, b: Product) => {
  // Sản phẩm chưa có ngày tạo (bản chụp dự phòng cũ) xếp xuống cuối, chứ không
  // được coi là mới nhất chỉ vì so sánh với undefined trả về 0.
  const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
  const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
  return tb - ta;
};

const firstFew = (products: Product[], count: number): Product[] =>
  [...products].sort(moiNhatTruoc).slice(0, count);

/**
 * Gom size thành nhóm để bảng lọc gắn nhãn được.
 *
 * Chỉ giữ lại size thật sự có hàng, và bất kỳ size nào không thuộc ba nhóm quen
 * thuộc — "Freesize", "2XL", size do shop tự đặt — vẫn được gom vào nhóm cuối
 * thay vì biến mất khỏi bộ lọc.
 */
const groupSizes = (allSizes: string[]) => {
  const present = new Set<string>(allSizes);
  const groups = [
    { label: "Áo", sizes: SIZES.tops.filter((size) => present.has(size)) as string[] },
    {
      label: "Quần (eo, inch)",
      sizes: SIZES.bottoms.filter((size) => present.has(size)) as string[],
    },
    { label: "Trẻ em (tuổi)", sizes: SIZES.kids.filter((size) => present.has(size)) as string[] },
  ].filter((group) => group.sizes.length > 0);

  const grouped = new Set<string>(groups.flatMap((group) => group.sizes));
  const rest = allSizes.filter((size) => !grouped.has(size));
  if (rest.length > 0) groups.push({ label: groups.length > 0 ? "Khác" : "Size", sizes: rest });

  return groups;
};

export type CatalogueInput = {
  seeds: Seed[];
  rootCategories: RootCategory[];
  subCategories: Array<{ name: string; count: number }>;
  syncedAt?: string | null;
  stale?: boolean;
};

export function buildCatalogue({
  seeds,
  rootCategories,
  subCategories,
  syncedAt = null,
  stale = false,
}: CatalogueInput): Catalogue {
  const products: Product[] = seeds.map((seed) => ({
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

  const categories = uniqueSorted(products.map((p) => p.category));
  const sizes = uniqueSorted(products.flatMap((p) => p.sizes));
  const prices = products.map((p) => p.price);

  /*
   * Ô "Mua theo danh mục" — mỗi ô là một danh mục gốc có hàng, link lọc theo
   * đúng các danh mục con của nó. Ảnh lấy từ ảnh danh mục khai bên quản trị;
   * chưa có thì mượn ảnh sản phẩm đầu trong nhánh, vì ô trống trông rất hụt.
   */
  const tiles: CategoryTile[] = rootCategories.map((root) => {
    const inBranch = products.find((p) => root.children.includes(p.category));
    const filters = (root.children.length > 0 ? root.children : [root.name])
      .map((name) => `category=${encodeURIComponent(name)}`)
      .join("&");

    return {
      label: `${root.count} sản phẩm`,
      title: root.name,
      image: root.image ?? inBranch?.image ?? "/images/placeholder.svg",
      href: `/shop?${filters}`,
    };
  });

  return {
    products,
    tiles,
    newArrivals: firstFew(products, 5),
    // seasonalDrop giữ lại cho kiểu dữ liệu cũ, nhưng khối bộ sưu tập trên trang
    // chủ giờ lấy sản phẩm chủ shop tự tích, không dùng danh sách này nữa.
    seasonalDrop: [],
    /*
     * Bán chạy nhất xếp theo lượt bán thật. Chưa có đơn hoàn thành nào thì giữ
     * nguyên thứ tự — số lượt bán bịa ra để sắp xếp còn tệ hơn là không sắp xếp.
     */
    bestSellers: products.some((p) => (p.sold ?? 0) > 0)
      ? [...products].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
      : products,
    /*
     * Tab lọc ở khối "Bán chạy nhất": danh mục nhiều hàng nhất lên trước — sáu
     * danh mục đầu bảng chữ cái thường rơi vào những nhóm chỉ có một hai sản
     * phẩm, bấm vào là ra dãy trống.
     */
    bestSellerFilters: [
      "Tất cả",
      ...(subCategories.length > 0
        ? subCategories.slice(0, 6).map((c) => c.name)
        : categories.slice(0, 6)),
    ],
    facets: {
      categories,
      sizes,
      sizeGroups: groupSizes(sizes),
      // Catalogue rỗng thì Math.min(...[]) ra Infinity và bảng lọc hiện "∞".
      priceBounds: {
        min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
        max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 0,
      },
    },
    syncedAt,
    stale,
  };
}

/** Catalogue rỗng — khi vừa không gọi được quản trị vừa chưa có bản chụp nào. */
export const EMPTY_CATALOGUE: Catalogue = buildCatalogue({
  seeds: [],
  rootCategories: [],
  subCategories: [],
  stale: true,
});

/* ── tra cứu ───────────────────────────────────────────────────────── */

export const getProduct = (catalogue: Catalogue, slug: string) =>
  catalogue.products.find((p) => p.slug === slug);

export const findVariant = (product: Product, color: string, size: string) =>
  product.variants.find((v) => v.color === color && v.size === size);

// Hàng không theo dõi tồn kho luôn còn bán: số tồn của nó không nói lên điều gì.
export const inStock = (product: Product) =>
  product.manageStock === false || product.variants.some((v) => v.stock > 0);

export const allAudiences: Audience[] = ["Nam", "Nữ", "Trẻ em", "Unisex"];

export const allColors: ProductColor[] = Object.values(COLORS).sort((a, b) =>
  a.name.localeCompare(b.name, "vi"),
);

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

export function filterProducts(catalogue: Catalogue, query: ShopQuery): Product[] {
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

  const { products } = catalogue;

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
    newest: moiNhatTruoc,
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
export function facetCounts(catalogue: Catalogue, query: ShopQuery): FacetCounts {
  const countBy = (
    key: "categories" | "audiences" | "sizes" | "colors",
    values: string[],
    valuesOf: (product: Product) => string[],
  ) => {
    const base = filterProducts(catalogue, { ...query, [key]: [] });
    return Object.fromEntries(
      values.map((value) => [value, base.filter((p) => valuesOf(p).includes(value)).length]),
    );
  };

  return {
    categories: countBy("categories", catalogue.facets.categories, (p) => [p.category]),
    audiences: countBy("audiences", allAudiences, (p) => [p.audience]),
    sizes: countBy("sizes", catalogue.facets.sizes, (p) => p.sizes),
    colors: countBy(
      "colors",
      allColors.map((c) => c.name),
      (p) => p.colors.map((c) => c.name),
    ),
  };
}

export const relatedProducts = (catalogue: Catalogue, product: Product, limit = 4) =>
  catalogue.products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => {
      const score = (p: Product) =>
        (p.category === product.category ? 2 : 0) + (p.audience === product.audience ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, limit);

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
