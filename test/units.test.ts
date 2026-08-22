import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convert, dimensionOf, supportedUnits } from '../src/units.ts';

const EPS = 1e-9;
function closeTo(actual: number, expected: number, msg?: string) {
  assert.ok(Math.abs(actual - expected) < EPS, msg ?? `${actual} !~ ${expected}`);
}

test('length: km to m', () => {
  closeTo(convert(1, 'km', 'm').value, 1000);
});

test('length: mi to ft', () => {
  // 1 mile is defined as exactly 5280 feet
  closeTo(convert(1, 'mi', 'ft').value, 5280);
});

test('length: identity conversion', () => {
  closeTo(convert(42, 'm', 'm').value, 42);
});

test('mass: lb to oz', () => {
  // 1 lb is defined as exactly 16 oz
  closeTo(convert(1, 'lb', 'oz').value, 16);
});

test('mass: kg to g', () => {
  closeTo(convert(2.5, 'kg', 'g').value, 2500);
});

test('time: day to hours to seconds', () => {
  closeTo(convert(1, 'd', 'h').value, 24);
  closeTo(convert(1, 'h', 's').value, 3600);
});

test('area: km2 to m2', () => {
  closeTo(convert(1, 'km2', 'm2').value, 1000000);
});

test('area: acre to m2', () => {
  // legal US definition, exact
  closeTo(convert(1, 'acre', 'm2').value, 4046.8564224);
});

test('area: mi2 to ft2', () => {
  // 1 mi2 is exactly 5280^2 = 27,878,400 ft2
  closeTo(convert(1, 'mi2', 'ft2').value, 27878400);
});

test('volume: gal to cup', () => {
  // 1 US gallon is exactly 16 cups
  closeTo(convert(1, 'gal', 'cup').value, 16);
});

test('volume: tbsp to tsp', () => {
  // 1 US tablespoon is exactly 3 teaspoons
  closeTo(convert(1, 'tbsp', 'tsp').value, 3);
});

test('volume: m3 to L', () => {
  closeTo(convert(1, 'm3', 'L').value, 1000);
});

test('temperature: boiling point C to F', () => {
  closeTo(convert(100, 'C', 'F').value, 212);
});

test('temperature: the point where C and F agree', () => {
  closeTo(convert(-40, 'F', 'C').value, -40);
});

test('temperature: absolute zero K to C', () => {
  closeTo(convert(0, 'K', 'C').value, -273.15);
});

test('temperature: freezing point C to K', () => {
  closeTo(convert(0, 'C', 'K').value, 273.15);
});

test('result carries the dimension it converted within', () => {
  assert.equal(convert(1, 'km', 'm').dimension, 'length');
  assert.equal(convert(1, 'kg', 'g').dimension, 'mass');
  assert.equal(convert(1, 's', 'min').dimension, 'time');
  assert.equal(convert(0, 'C', 'F').dimension, 'temperature');
});

test('rejects mismatched dimensions', () => {
  assert.throws(() => convert(1, 'km', 'kg'));
});

test('rejects unknown units', () => {
  assert.throws(() => convert(1, 'km', 'furlong'));
  assert.throws(() => convert(1, 'furlong', 'km'));
});

test('rejects non-finite values', () => {
  assert.throws(() => convert(NaN, 'm', 'km'));
  assert.throws(() => convert(Infinity, 'm', 'km'));
});

test('dimensionOf finds the right table', () => {
  assert.equal(dimensionOf('kg'), 'mass');
  assert.equal(dimensionOf('ft'), 'length');
  assert.equal(dimensionOf('min'), 'time');
  assert.equal(dimensionOf('m2'), 'area');
  assert.equal(dimensionOf('L'), 'volume');
});

test('dimensionOf returns null for unknown or temperature units', () => {
  assert.equal(dimensionOf('furlong'), null);
  // temperature units aren't in FACTORS; they're handled separately in convert()
  assert.equal(dimensionOf('C'), null);
});

test('supportedUnits lists every unit exactly once', () => {
  const units = supportedUnits();
  assert.equal(new Set(units).size, units.length);
  for (const u of ['m', 'km', 'kg', 'lb', 's', 'h', 'C', 'F', 'K', 'm2', 'acre', 'L', 'gal']) {
    assert.ok(units.includes(u), `missing ${u}`);
  }
});
