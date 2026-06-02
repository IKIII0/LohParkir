import { WebSocket } from 'ws';
import { wss } from '../index';

export type WsEventType =
  | 'SCAN_EVENT'
  | 'NEW_REPORT'
  | 'REPORT_STATUS_CHANGED'
  | 'NEW_TRANSACTION'
  | 'EMERGENCY_ALERT'
  | 'STATS_UPDATE';

export interface WsMessage {
  event: WsEventType;
  data: unknown;
  timestamp: string;
}

export function wsBroadcast(event: WsEventType, data: unknown): void {
  const message: WsMessage = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  const json = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}
