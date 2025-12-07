import { generatePassId } from '../pass-generator';

describe('Pass Generator', () => {
  describe('generatePassId', () => {
    it('should generate pass ID in PREFIX-NNNN format', () => {
      const passId = generatePassId('VIS', 1);
      expect(passId).toBe('VIS-0001');
    });

    it('should pad sequence numbers correctly', () => {
      expect(generatePassId('VIS', 1)).toBe('VIS-0001');
      expect(generatePassId('VIS', 10)).toBe('VIS-0010');
      expect(generatePassId('VIS', 100)).toBe('VIS-0100');
      expect(generatePassId('VIS', 1000)).toBe('VIS-1000');
      expect(generatePassId('VIS', 9999)).toBe('VIS-9999');
    });

    it('should handle different prefixes', () => {
      expect(generatePassId('EVENT', 1)).toBe('EVENT-0001');
      expect(generatePassId('CONF', 42)).toBe('CONF-0042');
      expect(generatePassId('A', 1)).toBe('A-0001');
    });

    it('should handle large sequence numbers', () => {
      expect(generatePassId('VIS', 10000)).toBe('VIS-10000');
      expect(generatePassId('VIS', 99999)).toBe('VIS-99999');
    });
  });
});
