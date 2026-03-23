export interface OrderPaidPayload {
  orderCode: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  eventName: string;
  totalAmount: number;
  athleteCount: number;
  paymentMethod: string;
  transactionId: string;
  paidAt: string;
}
