import { SupportedLanguage, SyntaxTheme } from '../types';

export interface Token {
  type:
    | 'keyword'
    | 'type'
    | 'function'
    | 'string'
    | 'number'
    | 'comment'
    | 'operator'
    | 'annotation'
    | 'preprocessor'
    | 'text';
  value: string;
}

const KEYWORDS_MAP: Record<SupportedLanguage, Set<string>> = {
  rust: new Set([
    'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else',
    'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop',
    'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self',
    'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use',
    'where', 'while'
  ]),
  c: new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
    'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline',
    'int', 'long', 'register', 'restrict', 'return', 'short', 'signed', 'sizeof',
    'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
  ]),
  cpp: new Set([
    'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit',
    'atomic_noexcept', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch',
    'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const',
    'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await',
    'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double',
    'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float',
    'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace',
    'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq',
    'private', 'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast',
    'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
    'static_cast', 'struct', 'switch', 'synchronized', 'template', 'this',
    'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename',
    'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq'
  ]),
  lua: new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
    'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
    'true', 'until', 'while'
  ]),
  luau: new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
    'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
    'true', 'until', 'while', 'export', 'type', 'typeof', 'continue'
  ]),
  python: new Set([
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
    'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
    'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
    'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
  ]),
  gdscript: new Set([
    'if', 'elif', 'else', 'for', 'while', 'match', 'break', 'continue', 'pass',
    'return', 'class', 'class_name', 'extends', 'is', 'as', 'self', 'super',
    'signal', 'func', 'static', 'const', 'enum', 'var', 'onready', 'export',
    'setget', 'breakpoint', 'assert', 'yield', 'await', 'void'
  ]),
  javascript: new Set([
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false',
    'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
    'new', 'null', 'return', 'static', 'super', 'switch', 'this', 'throw',
    'true', 'try', 'typeof', 'undefined', 'var', 'void', 'while', 'with', 'yield'
  ]),
  java: new Set([
    'abstract', 'assert', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'default', 'do', 'else', 'enum', 'extends', 'false', 'final', 'finally',
    'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'interface',
    'native', 'new', 'null', 'package', 'private', 'protected', 'public',
    'record', 'return', 'sealed', 'static', 'strictfp', 'super', 'switch',
    'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try',
    'var', 'void', 'volatile', 'while', 'yield'
  ]),
  go: new Set([
    'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
    'fallthrough', 'false', 'for', 'func', 'go', 'goto', 'if', 'import',
    'interface', 'iota', 'map', 'nil', 'package', 'range', 'return',
    'select', 'struct', 'switch', 'true', 'type', 'var'
  ]),
  csharp: new Set([
    'abstract', 'as', 'async', 'await', 'base', 'break', 'case', 'catch',
    'checked', 'class', 'const', 'continue', 'default', 'delegate', 'do',
    'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally',
    'fixed', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'interface',
    'internal', 'is', 'lock', 'namespace', 'new', 'null', 'operator', 'out',
    'override', 'params', 'private', 'protected', 'public', 'readonly',
    'record', 'ref', 'required', 'return', 'sealed', 'sizeof', 'stackalloc',
    'static', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
    'unchecked', 'unsafe', 'using', 'var', 'virtual', 'void', 'volatile',
    'while', 'yield'
  ]),
};

const COMMON_TYPES: Record<SupportedLanguage, Set<string>> = {
  rust: new Set([
    'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
    'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
    'f32', 'f64', 'bool', 'char', 'str', 'String',
    'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc', 'RefCell', 'Mutex'
  ]),
  c: new Set([
    'int', 'char', 'float', 'double', 'short', 'long', 'void', 'size_t',
    'ssize_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
    'int8_t', 'int16_t', 'int32_t', 'int64_t', 'bool', 'FILE', 'NULL'
  ]),
  cpp: new Set([
    'string', 'vector', 'unique_ptr', 'shared_ptr', 'weak_ptr', 'map', 'unordered_map',
    'set', 'unordered_set', 'pair', 'tuple', 'array', 'optional', 'variant', 'size_t',
    'int', 'float', 'double', 'char', 'bool', 'void', 'auto'
  ]),
  lua: new Set(['string', 'number', 'boolean', 'table', 'function', 'thread', 'userdata']),
  luau: new Set([
    'string', 'number', 'boolean', 'table', 'thread', 'any', 'unknown', 'never', 'buffer',
    'Vector3', 'Vector2', 'CFrame', 'Color3', 'Instance', 'Ray', 'UDim2'
  ]),
  python: new Set([
    'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple', 'bytes',
    'object', 'type', 'Any', 'Optional', 'Union', 'List', 'Dict', 'Set', 'Tuple'
  ]),
  gdscript: new Set([
    'int', 'float', 'bool', 'String', 'StringName', 'NodePath', 'Vector2', 'Vector2i',
    'Rect2', 'Rect2i', 'Vector3', 'Vector3i', 'Transform2D', 'Plane', 'Quaternion',
    'AABB', 'Basis', 'Transform3D', 'Color', 'RID', 'Object', 'Node', 'Array',
    'Dictionary', 'Callable', 'Signal'
  ]),
  javascript: new Set([
    'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set', 'WeakMap',
    'WeakSet', 'Promise', 'Symbol', 'BigInt', 'Date', 'RegExp', 'Error',
    'Math', 'JSON', 'console', 'Intl', 'Proxy', 'Reflect'
  ]),
  java: new Set([
    'boolean', 'byte', 'char', 'short', 'int', 'long', 'float', 'double', 'void',
    'String', 'Object', 'Integer', 'Long', 'Double', 'Boolean', 'List', 'ArrayList',
    'Map', 'HashMap', 'Set', 'HashSet', 'Optional', 'Stream', 'System'
  ]),
  go: new Set([
    'any', 'bool', 'byte', 'comparable', 'complex64', 'complex128', 'error',
    'float32', 'float64', 'int', 'int8', 'int16', 'int32', 'int64', 'rune',
    'string', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr',
    'fmt', 'sync', 'context', 'make', 'append', 'len', 'cap'
  ]),
  csharp: new Set([
    'bool', 'byte', 'sbyte', 'char', 'decimal', 'double', 'float', 'int',
    'uint', 'nint', 'nuint', 'long', 'ulong', 'short', 'ushort', 'object',
    'string', 'dynamic', 'List', 'Dictionary', 'IEnumerable', 'Task',
    'ValueTask', 'Span', 'ReadOnlySpan', 'Console', 'StringBuilder', 'DateTime'
  ]),
};

export function tokenizeCode(code: string, language: SupportedLanguage): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = code.length;

  const keywords = KEYWORDS_MAP[language] || KEYWORDS_MAP.rust;
  const types = COMMON_TYPES[language] || COMMON_TYPES.rust;

  while (i < len) {
    const char = code[i];

    // C / C++ / C# Preprocessor directives (#include, #region, #nullable, etc.)
    if ((language === 'c' || language === 'cpp' || language === 'csharp') && char === '#') {
      let prep = '';
      while (i < len && code[i] !== '\n') {
        prep += code[i];
        i++;
      }
      tokens.push({ type: 'preprocessor', value: prep });
      continue;
    }

    // GDScript / Python / Java annotations (@export, @Override, etc.)
    if (char === '@' && (language === 'gdscript' || language === 'python' || language === 'java')) {
      let annot = '@';
      i++;
      while (i < len && /[a-zA-Z0-9_]/.test(code[i])) {
        annot += code[i];
        i++;
      }
      tokens.push({ type: 'annotation', value: annot });
      continue;
    }

    // Luau strict/nonstrict pragmas (--!strict)
    if (code.slice(i, i + 3) === '--!' && language === 'luau') {
      let pragma = '';
      while (i < len && code[i] !== '\n') {
        pragma += code[i];
        i++;
      }
      tokens.push({ type: 'annotation', value: pragma });
      continue;
    }

    // Comments: // or /* */ for C/C++/Rust/JavaScript/Java/Go/C#
    if (
      (language === 'c' ||
        language === 'cpp' ||
        language === 'rust' ||
        language === 'javascript' ||
        language === 'java' ||
        language === 'go' ||
        language === 'csharp') &&
      char === '/' &&
      i + 1 < len
    ) {
      if (code[i + 1] === '/') {
        let comment = '';
        while (i < len && code[i] !== '\n') {
          comment += code[i];
          i++;
        }
        tokens.push({ type: 'comment', value: comment });
        continue;
      } else if (code[i + 1] === '*') {
        let comment = '/*';
        i += 2;
        while (i < len && !(code[i - 1] === '*' && code[i] === '/')) {
          comment += code[i];
          i++;
        }
        if (i < len) {
          comment += code[i];
          i++;
        }
        tokens.push({ type: 'comment', value: comment });
        continue;
      }
    }

    // Comments: # for Python / GDScript
    if ((language === 'python' || language === 'gdscript') && char === '#') {
      let comment = '';
      while (i < len && code[i] !== '\n') {
        comment += code[i];
        i++;
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    // Comments: -- for Lua / Luau
    if ((language === 'lua' || language === 'luau') && char === '-' && code[i + 1] === '-') {
      let comment = '';
      if (code.slice(i, i + 4) === '--[[') {
        comment = '--[[';
        i += 4;
        while (i < len && code.slice(i, i + 2) !== ']]') {
          comment += code[i];
          i++;
        }
        if (i < len) {
          comment += ']]';
          i += 2;
        }
      } else {
        while (i < len && code[i] !== '\n') {
          comment += code[i];
          i++;
        }
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    // Python Triple Quotes """ or '''
    if (language === 'python' && (code.slice(i, i + 3) === '"""' || code.slice(i, i + 3) === "'''")) {
      const q = code.slice(i, i + 3);
      let str = q;
      i += 3;
      while (i < len && code.slice(i, i + 3) !== q) {
        str += code[i];
        i++;
      }
      if (i < len) {
        str += q;
        i += 3;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // C# interpolated ($"..."), verbatim (@"..."), or combined strings
    if (
      language === 'csharp' &&
      ((char === '$' && code[i + 1] === '"') ||
        (char === '@' && code[i + 1] === '"') ||
        (code.slice(i, i + 3) === '$@"' || code.slice(i, i + 3) === '@$"'))
    ) {
      let str = '';
      while (i < len && code[i] !== '"') {
        str += code[i];
        i++;
      }
      if (i < len && code[i] === '"') {
        str += '"';
        i++;
        while (i < len) {
          if (code[i] === '\\' && i + 1 < len) {
            str += code[i] + code[i + 1];
            i += 2;
            continue;
          }
          if (code[i] === '"') {
            str += '"';
            i++;
            break;
          }
          str += code[i];
          i++;
        }
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Strings: single, double, JS template / Go raw backtick quotes
    if (char === '"' || char === "'" || ((language === 'javascript' || language === 'go') && char === '`')) {
      const quote = char;
      let str = quote;
      i++;
      while (i < len) {
        if (code[i] === '\\' && i + 1 < len) {
          str += code[i] + code[i + 1];
          i += 2;
          continue;
        }
        if (code[i] === quote) {
          str += quote;
          i++;
          break;
        }
        str += code[i];
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Numbers (integers, floats, hex, binary)
    if (/[0-9]/.test(char) || (char === '.' && i + 1 < len && /[0-9]/.test(code[i + 1]))) {
      let num = '';
      while (i < len && /[0-9a-fA-FxXbBoOeE_.]/.test(code[i])) {
        num += code[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Word tokens: identifiers, keywords, types, functions
    if (/[a-zA-Z_]/.test(char)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_]/.test(code[i])) {
        word += code[i];
        i++;
      }

      // Check if followed by ! for Rust macros (e.g. println!, format!)
      if (language === 'rust' && i < len && code[i] === '!') {
        word += '!';
        i++;
        tokens.push({ type: 'function', value: word });
        continue;
      }

      // Check if followed by ( for function call
      let nextNonSpace = i;
      while (nextNonSpace < len && (code[nextNonSpace] === ' ' || code[nextNonSpace] === '\t')) {
        nextNonSpace++;
      }
      const isFunction = nextNonSpace < len && code[nextNonSpace] === '(';

      if (keywords.has(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (types.has(word) || /^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        tokens.push({ type: 'type', value: word });
      } else if (isFunction) {
        tokens.push({ type: 'function', value: word });
      } else {
        tokens.push({ type: 'text', value: word });
      }
      continue;
    }

    // Operators & Punctuation
    if (/[+\-*/%=<>!&|^~?:;,.]/.test(char)) {
      let op = char;
      i++;
      while (i < len && /[+\-*/%=<>!&|^~?:;,.]/.test(code[i])) {
        op += code[i];
        i++;
      }
      tokens.push({ type: 'operator', value: op });
      continue;
    }

    // Whitespace and other characters
    tokens.push({ type: 'text', value: char });
    i++;
  }

  return tokens;
}

// Converts tokens into stylized HTML with warm, non-neon syntax highlighting
export function highlightTokensToHtml(
  tokens: Token[],
  syntaxTheme: SyntaxTheme = 'warm-botanical'
): string {
  return tokens
    .map((token) => {
      const escaped = token.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (syntaxTheme === 'ink-mono' || syntaxTheme === 'monochrome-titanium') {
        switch (token.type) {
          case 'keyword':
            return `<span style="color:#f5f2eb;font-weight:600;">${escaped}</span>`;
          case 'type':
            return `<span style="color:#d6d1c7;text-decoration:underline;text-decoration-color:rgba(214,209,199,0.35);">${escaped}</span>`;
          case 'function':
            return `<span style="color:#e7e2d8;font-weight:500;">${escaped}</span>`;
          case 'string':
            return `<span style="color:#a8a296;font-style:italic;">${escaped}</span>`;
          case 'number':
            return `<span style="color:#ebe6dc;">${escaped}</span>`;
          case 'comment':
            return `<span style="color:#78746c;font-style:italic;">${escaped}</span>`;
          case 'annotation':
          case 'preprocessor':
            return `<span style="color:#d6d1c7;font-weight:600;">${escaped}</span>`;
          case 'operator':
            return `<span style="color:#b8b2a6;">${escaped}</span>`;
          default:
            return `<span style="color:#eae5db;">${escaped}</span>`;
        }
      }

      if (syntaxTheme === 'warm-amber' || syntaxTheme === 'amber-terminal') {
        switch (token.type) {
          case 'keyword':
            return `<span style="color:#e6a15c;font-weight:600;">${escaped}</span>`;
          case 'type':
            return `<span style="color:#ebd086;font-weight:500;">${escaped}</span>`;
          case 'function':
            return `<span style="color:#f2be7e;">${escaped}</span>`;
          case 'string':
            return `<span style="color:#c9a97c;font-style:italic;">${escaped}</span>`;
          case 'number':
            return `<span style="color:#f2d89f;">${escaped}</span>`;
          case 'comment':
            return `<span style="color:#857d72;font-style:italic;">${escaped}</span>`;
          case 'annotation':
          case 'preprocessor':
            return `<span style="color:#d98c5f;font-weight:600;">${escaped}</span>`;
          case 'operator':
            return `<span style="color:#c99c6b;">${escaped}</span>`;
          default:
            return `<span style="color:#f2eadb;">${escaped}</span>`;
        }
      }

      if (syntaxTheme === 'soft-pastel' || syntaxTheme === 'pastel-soft') {
        switch (token.type) {
          case 'keyword':
            return `<span style="color:#df9399;font-weight:600;">${escaped}</span>`;
          case 'type':
            return `<span style="color:#87bfb5;font-weight:500;">${escaped}</span>`;
          case 'function':
            return `<span style="color:#e5c882;">${escaped}</span>`;
          case 'string':
            return `<span style="color:#9dc493;font-style:italic;">${escaped}</span>`;
          case 'number':
            return `<span style="color:#bfa6d4;">${escaped}</span>`;
          case 'comment':
            return `<span style="color:#878c86;font-style:italic;">${escaped}</span>`;
          case 'annotation':
          case 'preprocessor':
            return `<span style="color:#bfa6d4;font-weight:600;">${escaped}</span>`;
          case 'operator':
            return `<span style="color:#a4b8c4;">${escaped}</span>`;
          default:
            return `<span style="color:#ebe7df;">${escaped}</span>`;
        }
      }

      // Default: Warm Botanical - Earthy, natural, non-neon tokens
      switch (token.type) {
        case 'keyword':
          return `<span style="color:#e38c7d;font-weight:600;">${escaped}</span>`;
        case 'type':
          return `<span style="color:#84bfb2;font-weight:500;">${escaped}</span>`;
        case 'function':
          return `<span style="color:#e6c57a;font-weight:500;">${escaped}</span>`;
        case 'string':
          return `<span style="color:#9fc48d;font-style:italic;">${escaped}</span>`;
        case 'number':
          return `<span style="color:#e0a472;font-weight:500;">${escaped}</span>`;
        case 'comment':
          return `<span style="color:#8c9188;font-style:italic;">${escaped}</span>`;
        case 'annotation':
          return `<span style="color:#c2a6cf;font-weight:600;">${escaped}</span>`;
        case 'preprocessor':
          return `<span style="color:#e38c7d;font-weight:600;">${escaped}</span>`;
        case 'operator':
          return `<span style="color:#b2c4be;">${escaped}</span>`;
        default:
          return `<span style="color:#efeae0;">${escaped}</span>`;
      }
    })
    .join('');
}
