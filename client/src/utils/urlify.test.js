import { urlify } from './urlify';

describe('urlify', () => {
  describe('urlify with unicode slugs disabled (default)', () => {
    it('should return a correct slug which is escaped by urlify', () => {
      expect(urlify('This & That')).toBe('this-that');
      expect(urlify('The Price is $72.00!')).toBe('the-price-is-7200');
      expect(urlify('Lisboa é ótima à beira-mar')).toBe(
        'lisboa-e-otima-a-beira-mar',
      );
    });

    it('should keep leading spaces & convert to hyphens if supplied', () => {
      expect(urlify('  I like _ßpaces')).toBe('-i-like-_sspaces');
    });

    it('should allow a supplied locale to re-order downcode mapping', () => {
      // mix of characters that are transliterated differently across Russian/Ukrainian
      const chars = 'Ц-йи-Ґ-Х-щ';
      const ruTransliteration = 'c-ji-g-h-sh';
      const ukTransliteration = 'ts-iy-g-kh-shch';
      expect(urlify(chars)).toEqual(ruTransliteration); // by default the Russian values come through with priority
      expect(urlify('Ц-йи-Ґ-Х-щ', { locale: 'ru' })).toEqual(ruTransliteration);
      expect(urlify('Ц-йи-Ґ-Х-щ', { locale: 'uk' })).toEqual(ukTransliteration);

      // another example
      expect(urlify('Георгій', { locale: 'uk-UK' })).toEqual('heorhii');
      expect(urlify('Георгій', { locale: 'en' })).toEqual('georgij');
      expect(urlify('Георгій')).toEqual('georgij');
      expect(urlify('Георгій', { locale: 'ru' })).toEqual('georgij');
    });

    it('should support locale with normal urlify whitespace handling', () => {
      const title = 'жйи Проєкт   Герой Їжак Георгій ';
      const ruTransliteration2 = 'zhji-proyekt-geroj-yizhak-georgij';
      const ukTransliteration2 = 'zhiy-proyekt-heroi-yizhak-heorhii';
      expect(urlify(title)).toEqual(ruTransliteration2); // default ordering
      expect(urlify(title, { locale: 'en' })).toEqual(ruTransliteration2); // default ordering if no matches
      expect(urlify(title, { locale: 'ru' })).toEqual(ruTransliteration2);
      expect(urlify(title, { locale: 'uk' })).toEqual(ukTransliteration2);
    });
  });

  describe('urlify with unicode slugs enabled', () => {
    const options = { allowUnicode: true };

    it('should return a correct slug which is escaped by urlify', () => {
      expect(urlify('Before', options)).toBe('before');
      expect(urlify('The', options)).toBe('the');
      expect(urlify('Before the sun rises', options)).toBe(
        'before-the-sun-rises',
      );
      expect(urlify('ON', options)).toBe('on');
      expect(urlify('ON this day in november', options)).toBe(
        'on-this-day-in-november',
      );
      expect(urlify('This & That', options)).toBe('this-that');
      expect(urlify('The Price is $72.00!', options)).toBe('the-price-is-7200');
      expect(urlify('Lisboa é ótima à beira-mar', options)).toBe(
        'lisboa-é-ótima-à-beira-mar',
      );
    });

    it('should keep leading spaces & convert to hyphens if supplied', () => {
      expect(urlify('  I like _ßpaces', options)).toBe('-i-like-_ßpaces');
    });
  });
});
