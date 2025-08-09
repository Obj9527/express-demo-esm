import axios, { AxiosInstance } from 'axios';
import { ExternalErrorHandler } from '../java-system/utils/externalErrorHandler';

class PaymentApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // 创建支付订单
  async createPayment(paymentData: any) {
    try {
      const response = await this.client.post('/payments', paymentData);
      return response.data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: '支付系统',
        operation: '创建支付订单',
        requestData: paymentData
      });
    }
  }

  // 查询支付状态
  async getPaymentStatus(paymentId: string) {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      return ExternalErrorHandler.handle(error, {
        service: '支付系统',
        operation: '查询支付状态',
        requestData: { paymentId }
      });
    }
  }
}

export default PaymentApiClient;
