import { barangays as psgcBarangays } from "psgc"

const allBarangays = psgcBarangays.all()

// Get the first few barangays to debug
const samples = allBarangays.slice(0, 10)

console.log("=== Debugging Barangay and City Codes ===\n")

samples.forEach((barangay, index) => {
  const rawCode = barangay.code
  const codeAsString = barangay.code.toString()
  const padded10 = barangay.code.toString().padStart(10, "0")
  const padded9 = barangay.code.toString().padStart(9, "0")

  // Current approach in the script
  const originalCode = barangay.code.toString()
  const cityCodeCurrent = originalCode.substring(0, 7) + "00"

  // Alternative: using padded 9-digit code
  const cityCodeAlt = padded9.substring(0, 7) + "00"

  console.log(`\nBarangay ${index + 1}: ${barangay.name}`)
  console.log(`  Raw code type: ${typeof rawCode}`)
  console.log(`  Raw code value: ${rawCode}`)
  console.log(`  As string: "${codeAsString}" (${codeAsString.length} chars)`)
  console.log(`  Padded to 10: "${padded10}"`)
  console.log(`  Padded to 9: "${padded9}"`)
  console.log(`  City code (current): "${cityCodeCurrent}" (${cityCodeCurrent.length} chars)`)
  console.log(`  City code (alternative): "${cityCodeAlt}" (${cityCodeAlt.length} chars)`)
})

// Also check what city codes are being generated
console.log("\n\n=== Sample City Codes from seedCities logic ===\n")

samples.forEach((barangay, index) => {
  const code = barangay.code.toString().padStart(9, "0")
  const regionCode = code.substring(0, 2)
  const provinceCode = code.substring(2, 4)
  const districtCode = code.substring(4, 6)
  const cityCode = code.substring(6, 7)

  const fullCityCode = regionCode + provinceCode + districtCode + cityCode + "00"

  console.log(`Barangay: ${barangay.name}`)
  console.log(`  Full city code: "${fullCityCode}" (${fullCityCode.length} chars)`)
})
