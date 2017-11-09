import * as fullAPI from '../index';
import * as remoteDOM from '../remote';
import * as localDOM from '../local';

describe('index tests', () => {
  it('should export both remoteDOM and localDOM APIs', () => {
    expect(fullAPI.remote).toBe(remoteDOM);
    expect(fullAPI.local).toBe(localDOM);
  });
});
