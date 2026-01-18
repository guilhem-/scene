const request = require('supertest');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { app } = require('../server/index');

const TEST_DATA_DIR = path.join(__dirname, '../data');
const TEST_PERFORMANCES_FILE = path.join(TEST_DATA_DIR, 'performances.json');

describe('API Endpoints', () => {
  beforeEach(async () => {
    // Reset data before each test
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    await fs.writeFile(TEST_PERFORMANCES_FILE, JSON.stringify({
      version: '1.0',
      performances: []
    }));
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  describe('GET /api/performances', () => {
    test('should return empty array when no performances exist', async () => {
      const res = await request(app).get('/api/performances');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('should return all performances', async () => {
      const testData = {
        version: '1.0',
        performances: [
          { id: 'perf_1', title: 'Performance 1', performerName: 'Artist 1' },
          { id: 'perf_2', title: 'Performance 2', performerName: 'Artist 2' }
        ]
      };
      await fs.writeFile(TEST_PERFORMANCES_FILE, JSON.stringify(testData));

      const res = await request(app).get('/api/performances');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Performance 1');
    });
  });

  describe('POST /api/performances', () => {
    test('should create a new performance', async () => {
      const res = await request(app)
        .post('/api/performances')
        .field('title', 'New Performance')
        .field('performerName', 'Test Artist')
        .field('performerPseudo', 'TestPseudo')
        .field('startOffsetMinutes', '1')
        .field('startOffsetSeconds', '30');

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Performance');
      expect(res.body.performerName).toBe('Test Artist');
      expect(res.body.performerPseudo).toBe('TestPseudo');
      expect(res.body.startOffset).toEqual({ minutes: 1, seconds: 30 });
      expect(res.body.id).toMatch(/^perf_/);
      expect(res.body.isOver).toBe(false);
    });

    test('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/performances')
        .field('performerName', 'Test Artist');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title and performer name are required');
    });

    test('should return 400 if performerName is missing', async () => {
      const res = await request(app)
        .post('/api/performances')
        .field('title', 'Test Title');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title and performer name are required');
    });

    test('should create performance with default values for optional fields', async () => {
      const res = await request(app)
        .post('/api/performances')
        .field('title', 'Minimal Performance')
        .field('performerName', 'Artist');

      expect(res.status).toBe(201);
      expect(res.body.performerPseudo).toBe('');
      expect(res.body.startOffset).toEqual({ minutes: 0, seconds: 0 });
      expect(res.body.musicFile).toBeNull();
    });
  });

  describe('PUT /api/performances/:id', () => {
    let performanceId;

    beforeEach(async () => {
      // Create a performance to update
      const res = await request(app)
        .post('/api/performances')
        .field('title', 'Original Title')
        .field('performerName', 'Original Artist');
      performanceId = res.body.id;
    });

    test('should update performance title', async () => {
      const res = await request(app)
        .put(`/api/performances/${performanceId}`)
        .field('title', 'Updated Title');

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.performerName).toBe('Original Artist');
    });

    test('should update performance isOver status', async () => {
      const res = await request(app)
        .put(`/api/performances/${performanceId}`)
        .field('isOver', 'true');

      expect(res.status).toBe(200);
      expect(res.body.isOver).toBe(true);
    });

    test('should update multiple fields', async () => {
      const res = await request(app)
        .put(`/api/performances/${performanceId}`)
        .field('title', 'New Title')
        .field('performerName', 'New Artist')
        .field('performerPseudo', 'NewPseudo')
        .field('startOffsetMinutes', '2')
        .field('startOffsetSeconds', '45');

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Title');
      expect(res.body.performerName).toBe('New Artist');
      expect(res.body.performerPseudo).toBe('NewPseudo');
      expect(res.body.startOffset).toEqual({ minutes: 2, seconds: 45 });
    });

    test('should return 404 for non-existent performance', async () => {
      const res = await request(app)
        .put('/api/performances/nonexistent_id')
        .field('title', 'Updated');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Performance not found');
    });
  });

  describe('DELETE /api/performances/:id', () => {
    let performanceId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/performances')
        .field('title', 'To Delete')
        .field('performerName', 'Artist');
      performanceId = res.body.id;
    });

    test('should delete a performance', async () => {
      const res = await request(app).delete(`/api/performances/${performanceId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's deleted
      const getRes = await request(app).get('/api/performances');
      expect(getRes.body.length).toBe(0);
    });

    test('should return 404 for non-existent performance', async () => {
      const res = await request(app).delete('/api/performances/nonexistent_id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Performance not found');
    });
  });

  describe('PUT /api/performances/reorder', () => {
    let perf1Id, perf2Id, perf3Id;

    beforeEach(async () => {
      const res1 = await request(app)
        .post('/api/performances')
        .field('title', 'First')
        .field('performerName', 'Artist 1');
      perf1Id = res1.body.id;

      const res2 = await request(app)
        .post('/api/performances')
        .field('title', 'Second')
        .field('performerName', 'Artist 2');
      perf2Id = res2.body.id;

      const res3 = await request(app)
        .post('/api/performances')
        .field('title', 'Third')
        .field('performerName', 'Artist 3');
      perf3Id = res3.body.id;
    });

    test('should reorder performances', async () => {
      const newOrder = [perf3Id, perf1Id, perf2Id];

      const res = await request(app)
        .put('/api/performances/reorder')
        .send({ order: newOrder });

      expect(res.status).toBe(200);
      expect(res.body[0].id).toBe(perf3Id);
      expect(res.body[1].id).toBe(perf1Id);
      expect(res.body[2].id).toBe(perf2Id);
    });

    test('should return 400 if order is not an array', async () => {
      const res = await request(app)
        .put('/api/performances/reorder')
        .send({ order: 'not-an-array' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Order must be an array of IDs');
    });

    test('should handle partial order (some IDs missing)', async () => {
      const res = await request(app)
        .put('/api/performances/reorder')
        .send({ order: [perf2Id] });

      expect(res.status).toBe(200);
      expect(res.body[0].id).toBe(perf2Id);
      // Other performances should still exist
      expect(res.body.length).toBe(3);
    });
  });

  describe('GET /api/performances/:id/music', () => {
    test('should return 404 for non-existent performance', async () => {
      const res = await request(app).get('/api/performances/nonexistent_id/music');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Performance not found');
    });

    test('should return 404 if performance has no music file', async () => {
      const createRes = await request(app)
        .post('/api/performances')
        .field('title', 'No Music')
        .field('performerName', 'Artist');

      const res = await request(app).get(`/api/performances/${createRes.body.id}/music`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('No music file for this performance');
    });
  });

  describe('Static Assets', () => {
    test('should serve background image from /assets/logo-caramanga.webp', async () => {
      const res = await request(app).get('/assets/logo-caramanga.webp');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/image/);
    });

    test('should have logo image in header on index page', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('class="header-logo"');
      expect(res.text).toContain('src="/assets/logo-caramanga.webp"');
    });

    test('should have theme toggle switch in header', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="theme-toggle"');
      expect(res.text).toContain('class="theme-toggle"');
      expect(res.text).toContain('class="toggle-slider"');
    });

    test('should have dark theme CSS variables defined', async () => {
      const res = await request(app).get('/css/variables.css');

      expect(res.status).toBe(200);
      expect(res.text).toContain('[data-theme="dark"]');
      expect(res.text).toContain('--color-bg: #0f172a');
    });

    test('should have offset fields disabled by default in form', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="form-offset-min"');
      expect(res.text).toContain('id="form-offset-sec"');
      // Both should have disabled attribute
      expect(res.text).toMatch(/id="form-offset-min"[^>]*disabled/);
      expect(res.text).toMatch(/id="form-offset-sec"[^>]*disabled/);
    });

    test('should have offset section with disabled class', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('id="time-section"');
      expect(res.text).toContain('time-section disabled');
    });
  });

  describe('File Upload', () => {
    test('should create performance with music file', async () => {
      // Create a simple test audio file
      const testAudioPath = path.join(TEST_DATA_DIR, 'test.mp3');
      await fs.writeFile(testAudioPath, Buffer.from('fake audio data'));

      const res = await request(app)
        .post('/api/performances')
        .field('title', 'With Music')
        .field('performerName', 'Artist')
        .attach('musicFile', testAudioPath);

      expect(res.status).toBe(201);
      expect(res.body.musicFile).not.toBeNull();
      expect(res.body.musicFile.originalName).toBe('test.mp3');

      // Clean up test file
      await fs.unlink(testAudioPath);
    });
  });
});
