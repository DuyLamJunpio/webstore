/**
 * Ngưỡng "đơn in số lượng lớn" — chỗ website ngừng tự nhận đơn và giao lại cho
 * người thật báo giá.
 *
 * Áo lớp, áo nhóm vài chục chiếc thì studio tính đủ và khách đặt thẳng được.
 * Nhưng đồng phục công ty hay đơn hàng trăm áo thì con số studio đưa ra gần như
 * không bao giờ là con số cuối: còn thương lượng phôi, còn bảng size của cả tập
 * thể, còn thêu tên riêng, còn giao theo đợt. Để khách chuyển khoản theo một
 * báo giá tự động rồi shop gọi lại xin sửa là cách tệ nhất để mở đầu một đơn lớn.
 *
 * Một hằng số dùng chung cho ba nơi phải nói cùng một câu: studio `/in-ao`,
 * trang thanh toán, và máy chủ lúc chốt đơn.
 */

/** Từ ngần này áo in trở lên (tính cả đơn) thì mời khách liên hệ trực tiếp. */
export const BULK_PRINT_FROM = 50;

export const isBulkPrint = (qty: number) => qty >= BULK_PRINT_FROM;
