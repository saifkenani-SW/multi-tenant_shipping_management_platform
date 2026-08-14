export interface ParcelCapabilities {
  canView: boolean;
  canUpdateStatus: boolean;
  canReceive: boolean;
  canDispatch: boolean;
  canCollect: boolean;
  canDeliver: boolean; // Virtual action based on Collect/Deliver context
}
