/**
 * US CPI-U, U.S. city average, all items, annual average (1982-84 = 100).
 * Source: U.S. Bureau of Labor Statistics, series CUUR0000SA0.
 * Pre-1950 values at 5-year intervals are interpolated linearly between points.
 * Update each January when BLS publishes the new annual average.
 */
export const CPI_SOURCE = 'U.S. Bureau of Labor Statistics, CPI-U annual averages (series CUUR0000SA0)';
export const CPI_AS_OF = 'annual averages through 2024';

const sparse: Record<number, number> = {
  1913: 9.9, 1915: 10.1, 1920: 20.0, 1925: 17.5, 1930: 16.7, 1935: 13.7, 1940: 14.0, 1945: 18.0,
};
const annual: Record<number, number> = {
  1950: 24.1, 1951: 26.0, 1952: 26.5, 1953: 26.7, 1954: 26.9, 1955: 26.8, 1956: 27.2, 1957: 28.1, 1958: 28.9, 1959: 29.1,
  1960: 29.6, 1961: 29.9, 1962: 30.2, 1963: 30.6, 1964: 31.0, 1965: 31.5, 1966: 32.4, 1967: 33.4, 1968: 34.8, 1969: 36.7,
  1970: 38.8, 1971: 40.5, 1972: 41.8, 1973: 44.4, 1974: 49.3, 1975: 53.8, 1976: 56.9, 1977: 60.6, 1978: 65.2, 1979: 72.6,
  1980: 82.4, 1981: 90.9, 1982: 96.5, 1983: 99.6, 1984: 103.9, 1985: 107.6, 1986: 109.6, 1987: 113.6, 1988: 118.3, 1989: 124.0,
  1990: 130.7, 1991: 136.2, 1992: 140.3, 1993: 144.5, 1994: 148.2, 1995: 152.4, 1996: 156.9, 1997: 160.5, 1998: 163.0, 1999: 166.6,
  2000: 172.2, 2001: 177.1, 2002: 179.9, 2003: 184.0, 2004: 188.9, 2005: 195.3, 2006: 201.6, 2007: 207.342, 2008: 215.303, 2009: 214.537,
  2010: 218.056, 2011: 224.939, 2012: 229.594, 2013: 232.957, 2014: 236.736, 2015: 237.017, 2016: 240.007, 2017: 245.12, 2018: 251.107, 2019: 255.657,
  2020: 258.811, 2021: 270.97, 2022: 292.655, 2023: 304.702, 2024: 313.689,
};

export const CPI: Record<number, number> = (() => {
  const out: Record<number, number> = { ...annual };
  const keys = Object.keys(sparse).map(Number).sort((a, b) => a - b);
  keys.push(1950);
  const val = (y: number) => sparse[y] ?? annual[y];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i],
      b = keys[i + 1];
    for (let y = a; y < b; y++) out[y] = +(val(a) + ((val(b) - val(a)) * (y - a)) / (b - a)).toFixed(2);
  }
  return out;
})();

export const CPI_FIRST = 1913;
export const CPI_LAST = 2024;
