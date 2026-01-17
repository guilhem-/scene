const { generateId } = require('../server/utils/idGenerator');

describe('idGenerator', () => {
  describe('generateId', () => {
    test('should generate an ID starting with "perf_"', () => {
      const id = generateId();
      expect(id.startsWith('perf_')).toBe(true);
    });

    test('should generate an ID with correct length (perf_ + 8 chars = 13)', () => {
      const id = generateId();
      expect(id.length).toBe(13);
    });

    test('should only contain lowercase alphanumeric characters after prefix', () => {
      const id = generateId();
      const suffix = id.slice(5);
      expect(suffix).toMatch(/^[a-z0-9]+$/);
    });

    test('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });
});
