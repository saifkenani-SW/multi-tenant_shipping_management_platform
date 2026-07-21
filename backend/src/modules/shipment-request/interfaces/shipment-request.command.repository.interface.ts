import { ShipmentRequest } from '../domain/shipment-request.entity';

export interface CreateShipmentRequestData {
  customerProfileId: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLat?: number;
  senderLng?: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverLat?: number;
  receiverLng?: number;
  expectedPiecesCount: number;
  expectedTotalWeightKg?: number;
  notes?: string;
  targetTenantId?: string;
}

export interface IShipmentRequestCommandRepository {
  create(data: CreateShipmentRequestData): Promise<ShipmentRequest>;
  findById(id: string): Promise<ShipmentRequest | null>;
  findCustomerProfileIdByUserId(userId: string): Promise<string | null>;

  /** يوافق على عرض سعر واحد، يرفض الباقي تلقائياً، ويحدد target_tenant_id */
  approveQuotation(shipmentRequestId: string, quotationId: string): Promise<void>;

  /** موافقة الموظف: بضربة وحدة بينشئ customer_shipment وبيحول الحالة لـ CONVERTED */
  acceptByEmployee(shipmentRequestId: string): Promise<void>;

  reject(id: string, reason?: string): Promise<void>;
  cancel(id: string, reason?: string): Promise<void>;

  /** هل في طرد وحد عالأقل وصل حالة COLLECTED؟ */
  hasCollectedParcel(shipmentRequestId: string): Promise<boolean>;
}
