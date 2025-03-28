export enum HitType {
  /**
   * User has seen a URL
   *
   */
  PAGE_VIEW = 'PAGEVIEW',

  /**
   * User has seen a URL
   *
   */
     // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
     PAGE= 'PAGEVIEW',

  /**
   * User has seen a screen.
   *
   */
  SCREEN_VIEW = 'SCREENVIEW',
  /**
   * User has seen a screen.
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  SCREEN = 'SCREENVIEW',

  /**
   * User has made a transaction.
   *
   */
  TRANSACTION = 'TRANSACTION',

  /**
   * Item bought in a transaction.
   *
   */
  ITEM = 'ITEM',

  /**
   * User has made a specific action.
   *
   */
  EVENT = 'EVENT',

}
