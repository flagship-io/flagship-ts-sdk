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
