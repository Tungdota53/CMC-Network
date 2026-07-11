import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { ProxyService } from './proxy.service';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpRequest: jest.Mock;

  beforeEach(async () => {
    httpRequest = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: HttpService, useValue: { request: httpRequest } },
      ],
    }).compile();
    service = module.get(ProxyService);
  });

  describe('findRoute', () => {
    it('matches the first path segment to a service prefix', () => {
      expect(service.findRoute('users/123')?.prefix).toBe('users');
      expect(service.findRoute('study-groups/abc/join-requests')?.prefix).toBe(
        'study-groups',
      );
    });

    it('ignores the query string when matching the prefix', () => {
      // Regression: a "/search?q=foo" path must still resolve to the search route.
      expect(service.findRoute('search?q=foo')?.prefix).toBe('search');
      expect(service.findRoute('marketplace?status=SOLD')?.prefix).toBe(
        'marketplace',
      );
    });

    it('returns null for an unknown prefix', () => {
      expect(service.findRoute('nope/1')).toBeNull();
    });
  });

  describe('forwardRequest', () => {
    it('forwards to the resolved service URL preserving the query string', async () => {
      httpRequest.mockReturnValueOnce(of({ status: 200, data: { ok: true } }));

      const result = await service.forwardRequest('GET', 'search?q=foo');

      expect(httpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/search?q=foo'),
        }),
      );
      expect(result.data).toEqual({ ok: true });
    });

    it('throws NotFound for an unroutable path without calling http', async () => {
      await expect(
        service.forwardRequest('GET', 'nope/1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(httpRequest).not.toHaveBeenCalled();
    });

    it('propagates the downstream status code instead of masking it as 500', async () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Request failed',
        response: { status: 403, data: { message: 'Forbidden' } },
      } as AxiosError;
      httpRequest.mockReturnValueOnce(throwError(() => axiosError));

      await expect(
        service.forwardRequest('DELETE', 'study-groups/1'),
      ).rejects.toMatchObject({
        // HttpException carrying the real downstream status.
        status: 403,
      });
    });

    it('returns 503 when the downstream service is unreachable (no response)', async () => {
      const axiosError = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
        response: undefined,
      } as AxiosError;
      httpRequest.mockReturnValueOnce(throwError(() => axiosError));

      await expect(
        service.forwardRequest('GET', 'users/1'),
      ).rejects.toMatchObject({
        status: 503,
      });
    });

    it('passes the upstream timeout option', async () => {
      httpRequest.mockReturnValueOnce(of({ status: 200, data: {} }));
      await service.forwardRequest('GET', 'users/1');
      expect(httpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ timeout: expect.any(Number) }),
      );
    });
  });
});
