import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

describe('API health', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
    }
  });

  it('returns health response', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
