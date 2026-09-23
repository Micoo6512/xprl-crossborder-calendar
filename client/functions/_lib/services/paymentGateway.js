/**
 * 支付网关适配层。
 *
 * V1.0 使用 mock 实现，不发生真实扣款。
 * 接入真实支付时（支付宝当面付 / 微信 Native 支付）：
 *   1. createPayment：调用对应 SDK 下单，返回真实收银台 payUrl / 二维码链接；
 *   2. verifyCallback：在异步通知路由中验签、校验金额，返回订单归属与支付结果。
 * 上层 order.service 只依赖下面两个接口，无需感知具体渠道。
 */
export const providerCode = 'mock';

/**
 * @param {{id:number, amount:number, planCode:string}} order
 */
export async function createPayment(order) {
  return {
    provider: providerCode,
    gatewayOrderId: `MOCK-${order.id}`,
    payUrl: `/mock-cashier/${order.id}`,
  };
}

/**
 * 模拟异步通知验签结果。真实渠道在此完成签名验证与金额比对。
 */
export async function verifyCallback(/* payload */) {
  return { success: true };
}
