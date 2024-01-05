export type CommonHit = {
  protocolVersion?: string
  userIp?: string
  documentReferrer?: string
  viewportSize?: string
  screenResolution?: string
  documentEncoding?: string
  screenColorDepth?: string
  userLanguage?: string
  javaEnabled?: string
  flashVersion?: string
  queueTime?: string
  currentSessionTimeStamp?: string
  sessionNumber?: string
}

export type TransactionHit = CommonHit & {
  transactionId: string
  affiliation: string
  totalRevenue?: number
  shippingCost?: number
  shippingMethod?: string
  taxes?: number
  currency?: string
  paymentMethod?: string
  itemCount?: number
  couponCode?: string
  documentLocation?: string
  pageTitle?: string
}

export type ItemHit = CommonHit & {
  transactionId: string
  name: string
  price?: number
  code?: string
  category?: string
  quantity?: number
  documentLocation?: string
  pageTitle?: string
}

export type EventHit = CommonHit & {
  category: 'Action Tracking' | 'User Engagement'
  action: string
  label?: string
  value?: number
  documentLocation?: string
  pageTitle?: string
}

export type ScreenViewHit = CommonHit & {
  documentLocation: string
  pageTitle: string
}

export type PageViewHit = CommonHit & {
  documentLocation: string
  pageTitle: string
}

/**
 * @deprecated This hit model will be removed on next major version.
 * Please use IHit types instead
 */
export type HitShape =
  | { type: 'Screen'; data: ScreenViewHit }
  | { type: 'Page'; data: PageViewHit }
  | { type: 'Transaction'; data: TransactionHit }
  | { type: 'Item'; data: ItemHit }
  | { type: 'Event'; data: EventHit }
