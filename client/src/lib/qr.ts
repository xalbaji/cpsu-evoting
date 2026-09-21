/* Small, dependency-free QR encoder for the short EV receipt payload. */

const QR_SIZE = 25;
const DATA_CODEWORDS = 34;
const ECC_CODEWORDS = 10;

function multiply(a: number, b: number) {
  let result = 0;
  let left = a;
  let right = b;
  while (right > 0) {
    if ((right & 1) !== 0) result ^= left;
    left = (left << 1) ^ ((left & 0x80) !== 0 ? 0x11d : 0);
    right >>>= 1;
  }
  return result & 0xff;
}

function bchRemainder(value: number, polynomial: number) {
  let remainder = value;
  const polynomialBits = 31 - Math.clz32(polynomial);
  while (remainder !== 0 && 31 - Math.clz32(remainder) >= polynomialBits) {
    remainder ^= polynomial << ((31 - Math.clz32(remainder)) - polynomialBits);
  }
  return remainder;
}

function errorCorrection(data: number[]) {
  let generator = [1];
  for (let i = 0; i < ECC_CODEWORDS; i += 1) {
    const next = Array(generator.length + 1).fill(0);
    const root = (() => {
      let value = 1;
      for (let j = 0; j < i; j += 1) value = multiply(value, 2);
      return value;
    })();
    generator.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= multiply(coefficient, root);
    });
    generator = next;
  }

  const remainder = Array(ECC_CODEWORDS).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ remainder[0];
    for (let i = 0; i < ECC_CODEWORDS - 1; i += 1) {
      remainder[i] = remainder[i + 1] ^ multiply(generator[i + 1], factor);
    }
    remainder[ECC_CODEWORDS - 1] = multiply(generator[ECC_CODEWORDS], factor);
  });
  return remainder;
}

function setFinder(matrix: Array<Array<boolean | null>>, centerX: number, centerY: number) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x < 0 || y < 0 || x >= QR_SIZE || y >= QR_SIZE) continue;
      const dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6
        && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      matrix[y][x] = dark;
    }
  }
}

function setAlignment(matrix: Array<Array<boolean | null>>, centerX: number, centerY: number) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      matrix[centerY + dy][centerX + dx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
    }
  }
}

function setFormatBits(matrix: Array<Array<boolean | null>>, mask = 0) {
  const formatData = (1 << 3) | mask; // error correction level L
  const bits = ((formatData << 10) | bchRemainder(formatData << 10, 0x537)) ^ 0x5412;
  for (let i = 0; i < 15; i += 1) {
    const dark = ((bits >>> i) & 1) !== 0;
    const verticalY = i < 6 ? i : i < 8 ? i + 1 : QR_SIZE - 15 + i;
    const horizontalX = i < 8 ? QR_SIZE - i - 1 : i === 8 ? 7 : 15 - i - 1;
    matrix[verticalY][8] = dark;
    matrix[8][horizontalX] = dark;
  }
  matrix[QR_SIZE - 8][8] = true;
}

function makeData(text: string) {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (bytes.length > 23) throw new Error("Receipt code is too long for the QR encoder");

  const bits: number[] = [];
  const appendBits = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  appendBits(0b0100, 4); // byte mode
  appendBits(bytes.length, 8);
  bytes.forEach((byte) => appendBits(byte, 8));
  appendBits(0, Math.min(4, DATA_CODEWORDS * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  let pad = 0;
  while (data.length < DATA_CODEWORDS) {
    data.push(pad % 2 === 0 ? 0xec : 0x11);
    pad += 1;
  }
  return [...data, ...errorCorrection(data)];
}

export function encodeReceiptQr(text: string): boolean[][] {
  const matrix: Array<Array<boolean | null>> = Array.from(
    { length: QR_SIZE },
    () => Array(QR_SIZE).fill(null),
  );

  setFinder(matrix, 0, 0);
  setFinder(matrix, QR_SIZE - 7, 0);
  setFinder(matrix, 0, QR_SIZE - 7);
  setAlignment(matrix, 18, 18);

  for (let i = 8; i < QR_SIZE - 8; i += 1) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Reserve the format-information cells before placing payload data.
  setFormatBits(matrix, 0);

  const codewords = makeData(text);
  let bitIndex = 0;
  let upward = true;
  for (let right = QR_SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let offset = 0; offset < QR_SIZE; offset += 1) {
      const y = upward ? QR_SIZE - 1 - offset : offset;
      for (let column = 0; column < 2; column += 1) {
        const x = right - column;
        if (matrix[y][x] !== null) continue;
        const byte = codewords[Math.floor(bitIndex / 8)] ?? 0;
        const dataBit = ((byte >>> (7 - (bitIndex % 8))) & 1) !== 0;
        const masked = (x + y) % 2 === 0; // mask 0
        matrix[y][x] = dataBit !== masked;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }

  return matrix.map((row) => row.map((cell) => cell === true));
}
