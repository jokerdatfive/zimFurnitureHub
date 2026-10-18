export type LeadStatus =
  | 'NEW'
  | 'QUALIFIED_LEAD'
  | 'HOT_LEAD'
  | 'SUPPORT'
  | 'SPAM'
  | 'IRRELEVANT';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ExtractedMetadata {
  budget: string | null;
  product_interest: string | null;
  urgency: string | null;
  location?: string | null;
  timeline?: string | null;
  action_required?: string | null;
  is_layby?: boolean;
  is_pending_order?: boolean;
  is_payment_promise?: boolean;
  payment_method?: string | null;
  agreed_price?: number | null;
  deposit_amount?: number | null;
  delivery_location?: string | null;
}

export interface WaContact {
  id: string;
  remote_jid: string;
  phone_number: string;
  push_name: string | null;
  lead_status: LeadStatus;
  lead_score: number;
  ai_summary: string | null;
  extracted_metadata: ExtractedMetadata;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface WaMessage {
  id: string;
  evolution_message_id: string;
  contact_id: string;
  from_me: boolean;
  message_type: 'text' | 'audio' | 'image' | 'document' | string;
  content: string | null;
  raw_payload?: any;
  ai_processed: boolean;
  intent: string | null;
  urgency: UrgencyLevel | null;
  created_at: string;
}

export interface AILeadAnalysisResult {
  is_lead: boolean;
  lead_status: LeadStatus;
  lead_score: number;
  intent:
    | 'pricing_inquiry'
    | 'ready_to_buy'
    | 'layby_request'
    | 'order_placement'
    | 'payment_promise'
    | 'booking_request'
    | 'customer_support'
    | 'general_greeting'
    | 'spam';
  urgency: UrgencyLevel;
  summary: string;
  is_layby?: boolean;
  is_pending_order?: boolean;
  is_payment_promise?: boolean;
  extracted_data: {
    budget: string | null;
    product_or_service: string | null;
    timeline: string | null;
    action_required: string;
    payment_method?: string | null;
    agreed_price?: number | null;
    deposit_amount?: number | null;
    delivery_location?: string | null;
  };
}

export interface EvolutionConnectionState {
  instance: string;
  state: 'open' | 'connecting' | 'close' | 'refused' | string;
  status: number;
}
