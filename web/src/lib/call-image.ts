/**
 * 공모 대표 이미지
 *
 * 관리자가 이미지를 올리면 그걸 쓰고, 아직 없으면 제목을 바탕으로
 * 색이 다른 기본 이미지를 만들어 보여줍니다.
 * (이미지가 없다고 회색 네모만 나오면 시연할 때 보기 안 좋아서입니다)
 *
 * 만드는 방식은 SVG를 글자로 조립해 data URI로 넘기는 것입니다.
 * 외부 파일이 필요 없어서 인터넷 없이도 뜹니다.
 */

/** 제목이 같으면 항상 같은 색이 나오도록 하는 아주 단순한 해시 */
function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 100000
  }
  return h
}

/** 재단 팔레트에서 뽑은 배경 조합 (진한색, 연한색) */
const PALETTE: [string, string][] = [
  ['#1d7a5f', '#a8ddc9'],
  ['#993c1d', '#f0c4b2'],
  ['#854f0b', '#f0d5a8'],
  ['#0f6e56', '#b6e3d3'],
  ['#3f5f8a', '#bdcde4'],
  ['#6b4a86', '#d3c2e2'],
]

/**
 * 공모 카드에 쓸 기본 이미지를 만듭니다.
 * @param title 공모 제목 — 색을 정하는 데 쓰고, 이미지 안에 글자로도 넣습니다
 */
export function placeholderImage(title: string): string {
  const [dark, light] = PALETTE[hash(title) % PALETTE.length]

  // 제목이 길면 잘라서 두 줄로 나눕니다
  const words = title.split(' ')
  const mid = Math.ceil(words.length / 2)
  const line1 = words.slice(0, mid).join(' ')
  const line2 = words.slice(mid).join(' ')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${dark}"/>
      <stop offset="100%" stop-color="${light}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <circle cx="540" cy="70" r="130" fill="#ffffff" opacity="0.10"/>
  <circle cx="90" cy="310" r="90" fill="#ffffff" opacity="0.08"/>
  <text x="44" y="${line2 ? 178 : 196}" fill="#ffffff" font-size="34" font-weight="600"
        font-family="'Apple SD Gothic Neo','Malgun Gothic',sans-serif">${escapeXml(line1)}</text>
  ${
    line2
      ? `<text x="44" y="222" fill="#ffffff" font-size="34" font-weight="600"
        font-family="'Apple SD Gothic Neo','Malgun Gothic',sans-serif">${escapeXml(line2)}</text>`
      : ''
  }
  <text x="44" y="290" fill="#ffffff" opacity="0.75" font-size="17"
        font-family="'Apple SD Gothic Neo','Malgun Gothic',sans-serif">함께일하는재단</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** SVG 안에 글자를 넣을 때 깨지지 않게 특수문자를 바꿔줍니다 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 공모에 쓸 이미지 주소를 정합니다. 올린 이미지 우선, 없으면 기본 이미지. */
export function callImageSrc(call: { title: string; image?: string }): string {
  return call.image || placeholderImage(call.title)
}
