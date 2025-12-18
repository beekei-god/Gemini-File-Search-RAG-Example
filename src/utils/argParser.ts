/**
 * 명령줄 인자를 파싱하는 유틸리티 함수
 */

type ParseOptions = {
  /**
   * 플래그 옵션 목록 (예: ['--model', '--store'])
   * 이 옵션들은 --key value 형태로 파싱됩니다
   */
  flags?: string[];
  /**
   * 첫 번째 위치 인자를 저장할 키 이름
   * 예: 'storeName'이면 첫 번째 인자가 parsed.storeName에 저장됨
   */
  firstPositional?: string;
  /**
   * 나머지 위치 인자들을 저장할 키 이름
   * 예: 'question'이면 나머지 인자들이 공백으로 합쳐져서 parsed.question에 저장됨
   */
  restPositional?: string;
};

/**
 * 명령줄 인자를 파싱합니다.
 *
 * @param argv - 파싱할 인자 배열 (보통 process.argv.slice(2))
 * @param options - 파싱 옵션
 * @returns 파싱된 결과 객체
 *
 * @example
 * // 플래그 옵션만 파싱
 * const args = parseArgs(['--model', 'gemini-2.5-flash', '--store', 'my-store']);
 * // { model: 'gemini-2.5-flash', store: 'my-store' }
 *
 * @example
 * // 첫 번째 위치 인자 파싱
 * const args = parseArgs(['my-store'], { firstPositional: 'storeName' });
 * // { storeName: 'my-store' }
 *
 * @example
 * // 플래그와 위치 인자 모두 파싱
 * const args = parseArgs(
 *   ['--model', 'gemini-2.5-flash', 'What is this?'],
 *   { flags: ['--model'], restPositional: 'question' }
 * );
 * // { model: 'gemini-2.5-flash', question: 'What is this?' }
 */
export function parseArgs<T extends Record<string, any> = Record<string, any>>(
  argv: string[],
  options: ParseOptions = {}
): T {
  const parsed: Record<string, any> = {};
  const { flags = [], firstPositional, restPositional } = options;

  let positionalIndex = 0;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    // 플래그 옵션 처리
    if (flags.includes(arg) && argv[i + 1]) {
      const key = arg.replace(/^--/, "");
      parsed[key] = argv[++i];
      continue;
    }

    // 위치 인자 처리
    if (!arg.startsWith("--")) {
      if (positionalIndex === 0 && firstPositional) {
        parsed[firstPositional] = arg;
        positionalIndex++;
      } else if (restPositional) {
        if (!parsed[restPositional]) {
          parsed[restPositional] = arg;
        } else {
          parsed[restPositional] = `${parsed[restPositional]} ${arg}`;
        }
        positionalIndex++;
      }
    }
  }

  return parsed as T;
}
