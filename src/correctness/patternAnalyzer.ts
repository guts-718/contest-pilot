export function analyzePattern(input: string): string[] {
  const patterns: string[] = [];
  //console.log("input: ", input);
  const nums = input
    .split(/\s+/)
    .map(x => Number(x))
    .filter(x => !isNaN(x));
   // console.log("nums: ",nums);

  if (nums.length <= 1) return patterns;

  // sorted ascending
  if (nums.every((v, i, a) => i === 0 || a[i - 1] <= v))
    patterns.push("sorted ascending");

  // sorted descending
  if (nums.every((v, i, a) => i === 0 || a[i - 1] >= v))
    patterns.push("sorted descending");

  // all equal
  if (nums.every(v => v === nums[0]))
    patterns.push("all values equal");

  // duplicates
  if (new Set(nums).size !== nums.length)
    patterns.push("contains duplicates");

  // powers of two
  if (nums.every(v => v > 0 && (v & (v - 1)) === 0))
    patterns.push("powers of two");

  return patterns;
}