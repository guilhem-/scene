const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const {
  ensureDataStructure,
  readPerformances,
  writePerformances,
  createPerformanceDir,
  deletePerformanceDir,
  getMusicFilePath,
  getStoredPath,
  DATA_DIR
} = require('../server/utils/fileManager');

const TEST_DATA_DIR = path.join(__dirname, '../data');
const TEST_PERFORMANCES_FILE = path.join(TEST_DATA_DIR, 'performances.json');

describe('fileManager', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore if doesn't exist
    }
  });

  afterAll(async () => {
    // Clean up after all tests
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore if doesn't exist
    }
  });

  describe('ensureDataStructure', () => {
    test('should create data directory if it does not exist', async () => {
      await ensureDataStructure();
      const exists = fsSync.existsSync(TEST_DATA_DIR);
      expect(exists).toBe(true);
    });

    test('should create performances.json with initial structure', async () => {
      await ensureDataStructure();
      const exists = fsSync.existsSync(TEST_PERFORMANCES_FILE);
      expect(exists).toBe(true);

      const content = JSON.parse(await fs.readFile(TEST_PERFORMANCES_FILE, 'utf-8'));
      expect(content).toEqual({
        version: '1.0',
        performances: []
      });
    });

    test('should not overwrite existing performances.json', async () => {
      await ensureDataStructure();

      const testData = {
        version: '1.0',
        performances: [{ id: 'test_123', title: 'Test' }]
      };
      await fs.writeFile(TEST_PERFORMANCES_FILE, JSON.stringify(testData));

      await ensureDataStructure();

      const content = JSON.parse(await fs.readFile(TEST_PERFORMANCES_FILE, 'utf-8'));
      expect(content.performances.length).toBe(1);
    });
  });

  describe('readPerformances', () => {
    test('should read performances from file', async () => {
      await ensureDataStructure();
      const data = await readPerformances();
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('performances');
      expect(Array.isArray(data.performances)).toBe(true);
    });
  });

  describe('writePerformances', () => {
    test('should write performances to file', async () => {
      const testData = {
        version: '1.0',
        performances: [
          { id: 'perf_abc123', title: 'Test Performance' }
        ]
      };

      await writePerformances(testData);

      const content = JSON.parse(await fs.readFile(TEST_PERFORMANCES_FILE, 'utf-8'));
      expect(content).toEqual(testData);
    });
  });

  describe('createPerformanceDir', () => {
    test('should create a directory for a performance', async () => {
      const perfId = 'perf_test123';
      const dir = await createPerformanceDir(perfId);

      expect(dir).toBe(path.join(TEST_DATA_DIR, perfId));
      expect(fsSync.existsSync(dir)).toBe(true);
    });
  });

  describe('deletePerformanceDir', () => {
    test('should delete a performance directory', async () => {
      const perfId = 'perf_test456';
      await createPerformanceDir(perfId);
      const dir = path.join(TEST_DATA_DIR, perfId);

      expect(fsSync.existsSync(dir)).toBe(true);

      await deletePerformanceDir(perfId);

      expect(fsSync.existsSync(dir)).toBe(false);
    });

    test('should not throw if directory does not exist', async () => {
      await expect(deletePerformanceDir('nonexistent_id')).resolves.not.toThrow();
    });
  });

  describe('getMusicFilePath', () => {
    test('should return correct full path for music file', () => {
      const filePath = getMusicFilePath('perf_abc', 'music_file.mp3');
      expect(filePath).toBe(path.join(TEST_DATA_DIR, 'perf_abc', 'music_file.mp3'));
    });
  });

  describe('getStoredPath', () => {
    test('should return correct relative stored path', () => {
      const storedPath = getStoredPath('perf_abc', 'music_file.mp3');
      expect(storedPath).toBe('data/perf_abc/music_file.mp3');
    });
  });
});
