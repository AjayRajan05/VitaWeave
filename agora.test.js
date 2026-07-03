require('dotenv').config(); 

import { AgoraVideoService } from './lib/agora.ts';

describe('Agora Video Integration', () => {
  test('Service initialization', () => {
    const videoService = new AgoraVideoService();
    expect(videoService.isInitialized).toBe(false);
  });

  test('Channel joining', async () => {
    const videoService = new AgoraVideoService();
    await videoService.initialize();
    const result = await videoService.joinChannel({ channelName: 'test-channel' });
    expect(result).toBe(true);
  });
});