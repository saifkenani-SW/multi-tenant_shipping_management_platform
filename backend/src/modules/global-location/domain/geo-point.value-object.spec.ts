import { GeoPoint } from './geo-point.value-object';

describe('GeoPoint', () => {
  it('يقبل إحداثيات صحيحة', () => {
    const point = new GeoPoint(35.9106, 31.9539);

    expect(point.longitude).toBe(35.9106);
    expect(point.latitude).toBe(31.9539);
  });

  it.each([
    ['خط طول أكبر من 180', 181, 0],
    ['خط طول أصغر من -180', -181, 0],
    ['خط عرض أكبر من 90', 0, 91],
    ['خط عرض أصغر من -90', 0, -91],
    ['قيمة غير رقمية', Number.NaN, 0],
  ])('يرفض %s', (_label, longitude, latitude) => {
    expect(() => new GeoPoint(longitude, latitude)).toThrow(RangeError);
  });

  it('يقبل الحدود القصوى', () => {
    expect(() => new GeoPoint(180, 90)).not.toThrow();
    expect(() => new GeoPoint(-180, -90)).not.toThrow();
  });

  describe('fromNullable', () => {
    it('يرجّع null عند غياب الاثنين', () => {
      expect(GeoPoint.fromNullable(null, null)).toBeNull();
      expect(GeoPoint.fromNullable(undefined, undefined)).toBeNull();
    });

    it('يرفض إحداثياً واحداً لأن نصف نقطة خطأ إدخال', () => {
      expect(() => GeoPoint.fromNullable(35.9, null)).toThrow(RangeError);
      expect(() => GeoPoint.fromNullable(null, 31.9)).toThrow(RangeError);
    });

    it('يبني النقطة عند اكتمالهما', () => {
      const point = GeoPoint.fromNullable(35.9106, 31.9539);

      expect(point).toBeInstanceOf(GeoPoint);
      expect(point?.longitude).toBe(35.9106);
    });

    it('يتعامل مع الصفر كقيمة صحيحة لا كغياب', () => {
      const point = GeoPoint.fromNullable(0, 0);

      expect(point).toBeInstanceOf(GeoPoint);
      expect(point?.longitude).toBe(0);
    });
  });
});
