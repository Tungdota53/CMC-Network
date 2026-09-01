import 'reflect-metadata';
import { PATH_METADATA } from '@nestjs/common/constants';
import { LiveStreamsController } from './live-streams.controller';

describe('LiveStreamsController routes', () => {
  it('uses an explicit active segment so GET is not captured by /posts/:id', () => {
    const path = Reflect.getMetadata(
      PATH_METADATA,
      LiveStreamsController.prototype.listActive,
    );
    expect(path).toBe('active');
  });
});
