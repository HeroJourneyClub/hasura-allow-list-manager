import { QueryCollection } from "./hasura";

export class QueryFilter {
  private queries: Record<string, Array<QueryCollection>> = {};
  private maxDay: number;
  private maxVersion: number;

  constructor(maxDay: number, maxVersion: number) {
    this.maxDay = maxDay;
    this.maxVersion = maxVersion;
  }

  public addQuery(timestamp: string, name: string, query: string) {
    if (!this.queries[timestamp]) {
      this.queries[timestamp] = [];
    }
    this.queries[timestamp].push({
      name,
      query,
    });
  }

  /**
   * Returns an array of queries to delete
   */
  public getQueriesToDelete(): Array<QueryCollection> {
    if (this.maxDay <= 0 || this.maxVersion <= 0) {
      return [];
    }

    const sortedKeys = Object.keys(this.queries).sort((a, b) => {
      return parseInt(b) - parseInt(a);
    });

    const k = this.getK(sortedKeys);
    const queriesToDelete: Array<QueryCollection> = [];

    if (k >= sortedKeys.length) {
      return queriesToDelete;
    }

    for (let i = k; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];

      if (key) {
        queriesToDelete.push(...this.queries[key]);
      }
    }

    return queriesToDelete;
  }

  /**
   * Get k. K is the number of queries that will not be deleted
   * and it is the higher number between maxVersion-K and maxDay-K.
   */
  public getK(sortedKeys: Array<string>): number {
    const daysK = this.getDaysK(sortedKeys);
    const versionK = Math.max(Math.min(this.maxVersion, sortedKeys.length), 1);

    return Math.max(daysK, versionK);
  }

  /**
   * Get K for days. K is the number of queries that will not be deleted.
   * Days-K is the number of timestamps that are not older than `maxDay`.
   */
  public getDaysK(sortedKeys: Array<string>): number {
    const treshold = Date.now() - (this.maxDay * 24 * 60 * 60 * 1000);

    let counter = 0;
    for (const key of sortedKeys) {
      if (parseInt(key) >= treshold) {
        counter++;
      }
    }

    return Math.max(counter, 1);
  }
}