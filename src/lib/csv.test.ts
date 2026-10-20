import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('quotes cells containing commas, quotes and newlines', () => {
    expect(csvCell('Toronto, ON')).toBe('"Toronto, ON"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(csvCell('plain')).toBe('plain');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1 416 555 0123')).toBe("'+1 416 555 0123");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('renders empty values as blank cells', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });

  it('builds a document with BOM and CRLF line endings', () => {
    expect(toCsv(['a', 'b'], [[1, 'x,y']])).toBe('﻿a,b\r\n1,"x,y"\r\n');
  });
});
