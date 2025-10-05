// Function to convert hex to rgba with opacity
export const hexToRgba = (hex: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    console.log(`Converting ${hex} with opacity ${opacity} to ${rgba}`);
    return rgba;
  }
  console.log(`Failed to parse hex color: ${hex}, returning as is`);
  return hex;
};
