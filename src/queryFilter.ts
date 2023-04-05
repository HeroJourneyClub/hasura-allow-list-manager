import { QueryCollection } from "./hasura";

type Query = {
  fullName: string;
  query: string;
  timestamp: string;
};

export class QueryFilter {
  private queries: Record<string, Array<Query>> = {};
  private maxDay: number;
  private maxVersion: number;

  constructor(maxDay: number, maxVersion: number) {
    this.maxDay = maxDay;
    this.maxVersion = maxVersion;
  }

  public addQuery(timestamp: string, fullName: string, name: string, query: string) {
    if (!this.queries[name]) {
      this.queries[name] = [];
    }
    this.queries[name].push({
      fullName,
      query,
      timestamp,
    });
  }

  public getQueriesToDelete(): Array<QueryCollection> {
    if (this.maxDay <= 0 && this.maxVersion <= 0) {
      return [];
    }

    const deleteByDays = this.getQueriesToDeleteByDays();
    const deleteByVersion = this.getQueriesToDeleteByVersion();

    if (this.maxDay <= 0) {
      return deleteByVersion;
    }

    if (this.maxVersion <= 0) {
      return deleteByDays;
    }

    return deleteByDays.filter((q) => deleteByVersion.some((q2) => q.name === q2.name));
  }

  public getQueriesToDeleteByDays(): Array<QueryCollection> {
    const queriesToDelete: Array<QueryCollection> = [];

    for (const key of Object.keys(this.queries)) {
      const query = this.queries[key];

      for (const q of query) {
        const timestamp = parseInt(q.timestamp);
        const threshold = Date.now() - (this.maxDay * 24 * 60 * 60 * 1000);
        if (timestamp < threshold) {
          queriesToDelete.push({
            name: q.fullName,
            query: q.query,
          });
        }
      }
    }

    return queriesToDelete;
  }

  public getQueriesToDeleteByVersion(): Array<QueryCollection> {
    const queriesToDelete: Array<QueryCollection> = [];

    for (const key of Object.keys(this.queries)) {
      const query = this.queries[key];
      if (query.length <= this.maxVersion) {
        continue;
      }

      query.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

      for (let i = this.maxVersion; i < query.length; i++) {
        queriesToDelete.push({
          name: query[i].fullName,
          query: query[i].query,
        });
      }
    }

    return queriesToDelete;
  }
}