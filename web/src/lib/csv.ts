/**
 * CSV 내보내기
 *
 * 엑셀에서 바로 열립니다.
 * 한글이 깨지지 않도록 파일 맨 앞에 BOM이라는 표식을 붙이는 것이 핵심입니다.
 * (이게 없으면 엑셀이 한글을 다른 글자로 잘못 읽습니다)
 *
 * 지금은 CSV만 만듭니다. 셀 병합·서식이 들어간 진짜 .xlsx 파일이 필요해지면
 * 라이브러리를 하나 붙이면 되고, 아래 컬럼 정의는 그대로 재사용할 수 있습니다.
 */

/** 값 하나를 CSV 칸에 넣을 수 있는 형태로 바꿉니다 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)

  // 쉼표·따옴표·줄바꿈이 들어있으면 통째로 따옴표로 감싸야 칸이 밀리지 않습니다.
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/** 머리글과 줄 목록으로 CSV 글자를 만듭니다 */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(','), ...rows.map((row) => row.map(cell).join(','))]
  return lines.join('\r\n')
}

/** 만든 CSV를 파일로 내려받게 합니다 (브라우저에서만 동작) */
export function downloadCsv(filename: string, csv: string): void {
  // ﻿ = BOM. 엑셀에게 "이건 UTF-8이야"라고 알려주는 표식입니다.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()

  // 다 쓴 주소는 정리해줍니다 (안 하면 메모리에 계속 남습니다)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 파일 이름에 붙일 오늘 날짜 (2026-07-28) */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
