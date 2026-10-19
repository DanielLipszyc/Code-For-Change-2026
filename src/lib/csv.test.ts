import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a header from every key, in first-seen order", () => {
    expect(toCsv([{ a: 1 }, { b: 2, a: 3 }])).toBe("a,b\n1,\n3,2");
  });

  it("quotes cells with commas, quotes or line breaks", () => {
    expect(toCsv([{ notes: 'near "the" pond, north side\nby the trail' }])).toBe(
      'notes\n"near ""the"" pond, north side\nby the trail"',
    );
  });

  it("leaves empty values empty", () => {
    expect(toCsv([{ a: null, b: undefined, c: "" }])).toBe("a,b,c\n,,");
  });

  it("stops text cells from running as spreadsheet formulas", () => {
    const rows = [
      { notes: '=HYPERLINK("http://evil.example")' },
      { notes: "+1" },
      { notes: "-2" },
      { notes: "@SUM(A1)" },
    ];
    expect(toCsv(rows).split("\n").slice(1)).toEqual([
      `"'=HYPERLINK(""http://evil.example"")"`,
      "'+1",
      "'-2",
      "'@SUM(A1)",
    ]);
  });

  it("leaves negative numbers alone", () => {
    expect(toCsv([{ longitude: -82.32 }])).toBe("longitude\n-82.32");
  });
});
