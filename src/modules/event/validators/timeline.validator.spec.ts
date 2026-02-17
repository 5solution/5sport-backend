import { BadRequestException } from '@nestjs/common';
import { validateTimeline } from './timeline.validator';

describe('validateTimeline', () => {
  const validFields = {
    eventStartTime: '2026-03-01T08:00:00Z',
    eventEndTime: '2026-03-02T18:00:00Z',
    editInfoOpenTime: '2026-02-01T00:00:00Z',
    editInfoCloseTime: '2026-02-28T23:59:59Z',
    checkinOpenTime: '2026-03-01T06:00:00Z',
    checkinCloseTime: '2026-03-01T10:00:00Z',
    allowTransfer: true,
    transferOpenTime: '2026-02-15T00:00:00Z',
    transferCloseTime: '2026-02-28T23:59:59Z',
  };

  it('should pass with valid timeline', () => {
    expect(() => validateTimeline(validFields)).not.toThrow();
  });

  it('should throw if eventEndTime <= eventStartTime', () => {
    expect(() =>
      validateTimeline({
        ...validFields,
        eventEndTime: '2026-03-01T07:00:00Z',
      }),
    ).toThrow(BadRequestException);
  });

  it('should throw if eventEndTime equals eventStartTime', () => {
    expect(() =>
      validateTimeline({
        ...validFields,
        eventEndTime: '2026-03-01T08:00:00Z',
      }),
    ).toThrow(BadRequestException);
  });

  it('should throw if editInfoCloseTime <= editInfoOpenTime', () => {
    expect(() =>
      validateTimeline({
        ...validFields,
        editInfoCloseTime: '2026-01-31T00:00:00Z',
      }),
    ).toThrow(BadRequestException);
  });

  it('should throw if transferCloseTime <= transferOpenTime when allowTransfer', () => {
    expect(() =>
      validateTimeline({
        ...validFields,
        transferCloseTime: '2026-02-14T00:00:00Z',
      }),
    ).toThrow(BadRequestException);
  });

  it('should not validate transfer times when allowTransfer is false', () => {
    expect(() =>
      validateTimeline({
        ...validFields,
        allowTransfer: false,
        transferOpenTime: '2026-03-01T00:00:00Z',
        transferCloseTime: '2026-02-01T00:00:00Z',
      }),
    ).not.toThrow();
  });

  it('should throw if checkinCloseTime <= checkinOpenTime', () => {
    expect(() =>
      validateTimeline({
        ...validFields,
        checkinCloseTime: '2026-03-01T05:00:00Z',
      }),
    ).toThrow(BadRequestException);
  });

  it('should pass with Date objects', () => {
    expect(() =>
      validateTimeline({
        eventStartTime: new Date('2026-03-01T08:00:00Z'),
        eventEndTime: new Date('2026-03-02T18:00:00Z'),
        editInfoOpenTime: new Date('2026-02-01T00:00:00Z'),
        editInfoCloseTime: new Date('2026-02-28T23:59:59Z'),
        checkinOpenTime: new Date('2026-03-01T06:00:00Z'),
        checkinCloseTime: new Date('2026-03-01T10:00:00Z'),
      }),
    ).not.toThrow();
  });

  it('should pass with partial fields (only what is provided)', () => {
    expect(() =>
      validateTimeline({
        eventStartTime: '2026-03-01T08:00:00Z',
        eventEndTime: '2026-03-02T18:00:00Z',
      }),
    ).not.toThrow();
  });

  it('should collect multiple errors', () => {
    try {
      validateTimeline({
        eventStartTime: '2026-03-02T18:00:00Z',
        eventEndTime: '2026-03-01T08:00:00Z',
        editInfoOpenTime: '2026-02-28T23:59:59Z',
        editInfoCloseTime: '2026-02-01T00:00:00Z',
        checkinOpenTime: '2026-03-01T10:00:00Z',
        checkinCloseTime: '2026-03-01T06:00:00Z',
      });
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const response = (e as BadRequestException).getResponse();
      expect((response as any).message).toHaveLength(3);
    }
  });
});
