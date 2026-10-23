import JsBarcode from 'jsbarcode'

// Encode with Code 128, including its checksum and ten-module quiet zones.
export function barcodeSvg(value) {
  const encoded = {}
  JsBarcode(encoded, value, { format: 'CODE128', displayValue: false })
  const bits = encoded.encodings.map(part => part.data).join('')
  const bars = Array.from(bits, (bit, index) => bit === '1'
    ? `<rect x="${index + 10}" y="0" width="1" height="70"/>` : '').join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bits.length + 20} 70" preserveAspectRatio="none"><rect width="100%" height="100%" fill="white"/><g fill="black">${bars}</g></svg>`
}
