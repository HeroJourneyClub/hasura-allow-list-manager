import { QueryFilter } from "../queryFilter";

describe('Query Filter', () => {
  it('should not filter out any queries if only 1 version', () => {
    const queryFilter = new QueryFilter(1, 1);
    queryFilter.addQuery('1', 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery('1', 'GetMoreData___(fullname)', 'GetMoreData', 'query2');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(0);
  });

  it('should keep all filters if timestamp is between now and version max days', () => {
    const queryFilter = new QueryFilter(11, 1);
    const timestamp = Date.now() - (10 * 24 * 60 * 60 * 1000);
    queryFilter.addQuery(`${timestamp}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp}`, 'GetMoreData___(fullname)', 'GetMoreData', 'query2');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(0);
  });

  it('should filter out if timestamp is not between now and version max days', () => {
    const queryFilter = new QueryFilter(1, 1);
    const timestamp = Date.now();
    const secondTimestamp = timestamp - (2 * 24 * 60 * 60 * 1000);
    queryFilter.addQuery(`${secondTimestamp}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${secondTimestamp}`, 'GetMoreData2___(fullname)', 'GetMoreData', 'query2');

    queryFilter.addQuery(`${timestamp}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp}`, 'GetMoreData___(fullname)', 'GetMoreData', 'query2');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(2);
    expect(queriesToDelete).toContainEqual({
      name: 'GetData2___(fullname)',
      query: 'query',
    });
    expect(queriesToDelete).toContainEqual({
      name: 'GetMoreData2___(fullname)',
      query: 'query2',
    });
  });

  it('should not delete any queries if max version or max day is 0', () => {
    const queryFilter = new QueryFilter(0, 0);
    const timestamp = Date.now();
    const secondTimestamp = timestamp - (2 * 24 * 60 * 60 * 1000);
    queryFilter.addQuery(`${secondTimestamp}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${secondTimestamp}`, 'GetMoreData2___(fullname)', 'GetMoreData', 'query2');

    queryFilter.addQuery(`${timestamp}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp}`, 'GetMoreData___(fullname)', 'GetMoreData', 'query2');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(0);
  });

  it('should not delete any queries if max version or max day is less than 0', () => {
    const queryFilter = new QueryFilter(-1, -1);
    const timestamp = Date.now();
    const secondTimestamp = timestamp - (2 * 24 * 60 * 60 * 1000);
    queryFilter.addQuery(`${secondTimestamp}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${secondTimestamp}`, 'GetMoreData2___(fullname)', 'GetMoreData', 'query2');

    queryFilter.addQuery(`${timestamp}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp}`, 'GetMoreData___(fullname)', 'GetMoreData', 'query2');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(0);
  });

  it('should keep 3 (delete 2) queries if max day is greater than max version', () => {
    const queryFilter = new QueryFilter(10, 1);
    const timestamp = Date.now();
    queryFilter.addQuery(`${timestamp - (1 * 24 * 60 * 60 * 1000)}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (3 * 24 * 60 * 60 * 1000)}`, 'GetData1___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (5 * 24 * 60 * 60 * 1000)}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (11 * 24 * 60 * 60 * 1000)}`, 'GetData3___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (12 * 24 * 60 * 60 * 1000)}`, 'GetData4___(fullname)', 'GetData', 'query');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(2);
  });

  it('should keep 3 (delete 2) queries if max day is greater than max version', () => {
    const queryFilter = new QueryFilter(10, 1);
    const timestamp = Date.now();
    queryFilter.addQuery(`${timestamp - (1 * 24 * 60 * 60 * 1000)}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (3 * 24 * 60 * 60 * 1000)}`, 'GetData1___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (5 * 24 * 60 * 60 * 1000)}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (11 * 24 * 60 * 60 * 1000)}`, 'GetData3___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (12 * 24 * 60 * 60 * 1000)}`, 'GetData4___(fullname)', 'GetData', 'query');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(2);
  });

  it('should keep 3 (delete 2) queries if max version is greater than max day', () => {
    const queryFilter = new QueryFilter(1, 3);
    const timestamp = Date.now();
    queryFilter.addQuery(`${timestamp - (1 * 24 * 60 * 60 * 1000)}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (3 * 24 * 60 * 60 * 1000)}`, 'GetData1___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (5 * 24 * 60 * 60 * 1000)}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (11 * 24 * 60 * 60 * 1000)}`, 'GetData3___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (12 * 24 * 60 * 60 * 1000)}`, 'GetData4___(fullname)', 'GetData', 'query');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(2);
  });

  it('should delete all but 1 query if max day and version are 1', () => {
    const queryFilter = new QueryFilter(1, 1);
    const timestamp = Date.now();
    queryFilter.addQuery(`${timestamp - (1 * 24 * 60 * 60 * 1000)}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (3 * 24 * 60 * 60 * 1000)}`, 'GetData1___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (5 * 24 * 60 * 60 * 1000)}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (11 * 24 * 60 * 60 * 1000)}`, 'GetData3___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (12 * 24 * 60 * 60 * 1000)}`, 'GetData4___(fullname)', 'GetData', 'query');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(4);
  });

  it('should delete all but 1 query if max day and version are 1', () => {
    const queryFilter = new QueryFilter(1, 1);
    const timestamp = Date.now();
    queryFilter.addQuery(`${timestamp - (1 * 24 * 60 * 60 * 1000)}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (3 * 24 * 60 * 60 * 1000)}`, 'GetData1___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (5 * 24 * 60 * 60 * 1000)}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (11 * 24 * 60 * 60 * 1000)}`, 'GetData3___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (12 * 24 * 60 * 60 * 1000)}`, 'GetData4___(fullname)', 'GetData', 'query');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(4);
  });

  it('should all but 1 version if max version is 1 and max day 0', () => {
    const queryFilter = new QueryFilter(0, 1);
    const timestamp = Date.now();
    queryFilter.addQuery(`${timestamp - (1 * 24 * 60 * 60 * 1000)}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (3 * 24 * 60 * 60 * 1000)}`, 'GetData1___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (5 * 24 * 60 * 60 * 1000)}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (11 * 24 * 60 * 60 * 1000)}`, 'GetData3___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (12 * 24 * 60 * 60 * 1000)}`, 'GetData4___(fullname)', 'GetData', 'query');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(4);
  });

  it('should all but 1 version if max version is 0 and max day 1', () => {
    const queryFilter = new QueryFilter(1, 0);
    const timestamp = Date.now();
    queryFilter.addQuery(`${timestamp - (1 * 24 * 60 * 60 * 1000)}`, 'GetData___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (3 * 24 * 60 * 60 * 1000)}`, 'GetData1___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (5 * 24 * 60 * 60 * 1000)}`, 'GetData2___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (11 * 24 * 60 * 60 * 1000)}`, 'GetData3___(fullname)', 'GetData', 'query');
    queryFilter.addQuery(`${timestamp - (12 * 24 * 60 * 60 * 1000)}`, 'GetData4___(fullname)', 'GetData', 'query');

    const queriesToDelete = queryFilter.getQueriesToDelete();
    expect(queriesToDelete).toHaveLength(4);
  });
});
