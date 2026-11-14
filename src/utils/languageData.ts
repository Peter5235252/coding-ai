import { AutocompleteItem, SupportedLanguage } from '../types';

export interface LanguageMeta {
  id: SupportedLanguage;
  name: string;
  extension: string;
  category: 'Systems' | 'Scripting' | 'Game Engine' | 'Application & Web';
  paradigm: string;
  defaultCode: string;
  tagline: string;
  compiler: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageMeta> = {
  rust: {
    id: 'rust',
    name: 'Rust',
    extension: '.rs',
    category: 'Systems',
    paradigm: 'Safe Systems & Zero-Cost Abstractions',
    tagline: 'Memory safety without garbage collection via ownership & borrow checking.',
    compiler: 'rustc 1.84 (edition 2024)',
    defaultCode: `// Zenith Code - Rust Environment
// Explore ownership, borrowing, and zero-cost abstractions

fn main() {
    let message: &str = "Zenith Rust Kernel Initialized";
    println!("{}", message);

    let numbers = vec![10, 25, 42, 99];
    let sum: i32 = numbers.iter().sum();
    println!("Vector sum: {}", sum);
}
`,
  },
  c: {
    id: 'c',
    name: 'C',
    extension: '.c',
    category: 'Systems',
    paradigm: 'Procedural, Direct Memory & Pointers',
    tagline: 'The bedrock of operating systems: manual allocation and raw memory pointers.',
    compiler: 'GCC 14 (C17 Standard)',
    defaultCode: `// Zenith Code - C Environment
// Master pointers, stack vs heap allocation, and struct alignment

#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    float value;
} Item;

int main(void) {
    Item item = { .id = 101, .value = 98.6f };
    printf("Item ID: %d, Value: %.2f\\n", item.id, item.value);

    // Examine memory footprint
    printf("Size of Item on stack: %zu bytes\\n", sizeof(Item));
    return 0;
}
`,
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    category: 'Systems',
    paradigm: 'RAII, Object-Oriented & Generic Templates',
    tagline: 'High-performance systems programming with modern RAII and smart pointers.',
    compiler: 'Clang 19 (C++20 Standard)',
    defaultCode: `// Zenith Code - C++ Environment
// Explore RAII, smart pointers, and standard library containers

#include <iostream>
#include <vector>
#include <memory>
#include <string>

class Node {
public:
    std::string tag;
    explicit Node(std::string t) : tag(std::move(t)) {
        std::cout << "[RAII] Node constructed: " << tag << "\\n";
    }
    ~Node() {
        std::cout << "[RAII] Node destroyed: " << tag << "\\n";
    }
};

int main() {
    auto node = std::make_unique<Node>("RootNode");
    std::vector<int> buffer = {1, 2, 4, 8, 16};
    
    std::cout << "Buffer elements: ";
    for (int n : buffer) {
        std::cout << n << " ";
    }
    std::cout << "\\n";
    return 0;
}
`,
  },
  lua: {
    id: 'lua',
    name: 'Lua',
    extension: '.lua',
    category: 'Scripting',
    paradigm: 'Lightweight Multi-paradigm & Table Metaprogramming',
    tagline: 'Fast, embeddable scripting engine with unified table structures.',
    compiler: 'Lua 5.4 JIT Compatible',
    defaultCode: `-- Zenith Code - Lua Environment
-- Tables represent arrays, dictionaries, and objects via metatables

local function create_vector(x, y)
    local v = { x = x, y = y }
    local mt = {
        __add = function(a, b)
            return create_vector(a.x + b.x, a.y + b.y)
        end,
        __tostring = function(self)
            return string.format("(%d, %d)", self.x, self.y)
        end
    }
    return setmetatable(v, mt)
end

local v1 = create_vector(5, 10)
local v2 = create_vector(2, 4)
local v3 = v1 + v2

print("Vector Result: " .. tostring(v3))
`,
  },
  luau: {
    id: 'luau',
    name: 'Luau',
    extension: '.luau',
    category: 'Game Engine',
    paradigm: 'Gradually Typed Fast Scripting (Roblox / Open Source)',
    tagline: 'High-performance typed Lua derivative with strict static analysis and Roblox datatypes.',
    compiler: 'Luau 0.650 (Strict Mode)',
    defaultCode: `--!strict
-- Zenith Code - Luau Environment
-- Explore static type annotations, nominal typing, and task scheduler

type Vector2D = {
    x: number,
    y: number
}

local function compute_distance(p1: Vector2D, p2: Vector2D): number
    local dx: number = p2.x - p1.x
    local dy: number = p2.y - p1.y
    return math.sqrt(dx * dx + dy * dy)
end

local pointA: Vector2D = { x = 0, y = 0 }
local pointB: Vector2D = { x = 3, y = 4 }

local dist: number = compute_distance(pointA, pointB)
print("Luau Euclidean Distance:", dist)
`,
  },
  python: {
    id: 'python',
    name: 'Python',
    extension: '.py',
    category: 'Scripting',
    paradigm: 'High-level, Dynamic & Expressive Multi-paradigm',
    tagline: 'Clean syntax for algorithms, data modeling, and rapid system prototyping.',
    compiler: 'CPython 3.13',
    defaultCode: `# Zenith Code - Python Environment
# Explore list comprehensions, type hints, and generators

def generate_primes(limit: int):
    """Sieve-style generator for prime numbers."""
    primes: list[int] = []
    for candidate in range(2, limit + 1):
        if all(candidate % p != 0 for p in primes):
            primes.append(candidate)
            yield candidate

if __name__ == "__main__":
    found = list(generate_primes(30))
    print("Primes under 30:", found)
`,
  },
  gdscript: {
    id: 'gdscript',
    name: 'GDScript',
    extension: '.gd',
    category: 'Game Engine',
    paradigm: 'Node-Based Event-Driven (Godot 4 Engine)',
    tagline: 'Godot-native language tightly coupled to scenes, nodes, and signals.',
    compiler: 'Godot 4.3 Script Engine',
    defaultCode: `# Zenith Code - GDScript Environment
# Explore Godot node trees, signals, and typed exports

extends Node

signal health_depleted(current_score: int)

@export var max_health: int = 100
var current_health: int = 100

func _ready() -> void:
    print("PlayerNode spawned into scene tree.")
    take_damage(35)

func take_damage(amount: int) -> void:
    current_health = maxi(0, current_health - amount)
    print("Damage taken: ", amount, " | Remaining HP: ", current_health)
    if current_health == 0:
        health_depleted.emit(500)
`,
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    category: 'Application & Web',
    paradigm: 'Event-Driven, Functional & Prototypal Multi-paradigm',
    tagline: 'Asynchronous closures, higher-order array methods, and dynamic objects.',
    compiler: 'Node.js 22 (ES2024 Native)',
    defaultCode: `// Zenith Code - JavaScript Environment
// Explore closures, higher-order array methods, and clean functional patterns

function createCounter(start = 0) {
    let count = start;
    return () => {
        count += 1;
        return count;
    };
}

const nextTick = createCounter(10);
const values = [1, 2, 3, 4].map((n) => n * nextTick());

console.log("Transformed values:", values);
console.log("Total sum:", values.reduce((acc, n) => acc + n, 0));
`,
  },
  java: {
    id: 'java',
    name: 'Java',
    extension: '.java',
    category: 'Application & Web',
    paradigm: 'Strongly Typed Object-Oriented & JVM Bytecode',
    tagline: 'Class-based architecture, generics, interfaces, and managed JVM execution.',
    compiler: 'OpenJDK 21 LTS (javac)',
    defaultCode: `// Zenith Code - Java Environment
// Explore strong typing, classes, streams, and JVM execution

import java.util.List;

public class Main {
    record Task(String name, int priority) {}

    public static void main(String[] args) {
        List<Task> queue = List.of(
            new Task("Parse Tokens", 2),
            new Task("Allocate Stack", 1),
            new Task("Render Frame", 3)
        );

        queue.stream()
            .filter(t -> t.priority() >= 2)
            .forEach(t -> System.out.println("Priority Task: " + t.name()));
    }
}
`,
  },
  go: {
    id: 'go',
    name: 'Go',
    extension: '.go',
    category: 'Systems',
    paradigm: 'CSP Concurrency, Interfaces & Simple Value Semantics',
    tagline: 'Fast native binaries, goroutines, channels, and explicit error handling.',
    compiler: 'Go 1.23 (gc compiler)',
    defaultCode: `// Zenith Code - Go Environment
// Explore structs, slices, goroutines, and channel communication

package main

import "fmt"

type Job struct {
    ID    int
    Label string
}

func main() {
    jobs := []Job{
        {ID: 1, Label: "Parse"},
        {ID: 2, Label: "Compile"},
        {ID: 3, Label: "Link"},
    }

    done := make(chan string, len(jobs))
    for _, job := range jobs {
        go func(j Job) {
            done <- fmt.Sprintf("[#%d] %s complete", j.ID, j.Label)
        }(job)
    }

    for i := 0; i < len(jobs); i++ {
        fmt.Println(<-done)
    }
}
`,
  },
  csharp: {
    id: 'csharp',
    name: 'C#',
    extension: '.cs',
    category: 'Application & Web',
    paradigm: 'Modern Multi-Paradigm, LINQ & .NET CLR',
    tagline: 'LINQ pipelines, strong typing, properties, and managed .NET execution.',
    compiler: '.NET / C# Compiler',
    defaultCode: `// Zenith Code - C# Environment
// Explore classes, LINQ pipelines, and string interpolation

using System;
using System.Collections.Generic;
using System.Linq;

class Metric
{
    public string Name { get; set; }
    public double Value { get; set; }
    public Metric(string name, double value)
    {
        Name = name;
        Value = value;
    }
}

class Program
{
    static void Main()
    {
        var metrics = new List<Metric>
        {
            new Metric("LatencyMs", 14.2),
            new Metric("Throughput", 840.0),
            new Metric("ErrorRate", 0.0)
        };

        var active = metrics
            .Where(m => m.Value > 0)
            .Select(m => $"{m.Name}: {m.Value:F1}");

        foreach (var line in active)
        {
            Console.WriteLine(line);
        }
    }
}
`,
  },
};

// Autocomplete suggestions per language
export const AUTOCOMPLETE_DICTIONARY: Record<SupportedLanguage, AutocompleteItem[]> = {
  rust: [
    { label: 'fn', insertText: 'fn ${1:name}(${2}) -> ${3:()} {\n    ${0}\n}', type: 'snippet', detail: 'Function definition' },
    { label: 'let mut', insertText: 'let mut ${1:var} = ${2};', type: 'snippet', detail: 'Mutable binding' },
    { label: 'struct', insertText: 'struct ${1:Name} {\n    ${0}\n}', type: 'snippet', detail: 'Struct declaration' },
    { label: 'enum', insertText: 'enum ${1:Name} {\n    ${2},\n}', type: 'snippet', detail: 'Enum declaration' },
    { label: 'impl', insertText: 'impl ${1:Type} {\n    ${0}\n}', type: 'snippet', detail: 'Implementation block' },
    { label: 'match', insertText: 'match ${1:expr} {\n    ${2:Pattern} => ${3},\n    _ => ${0},\n}', type: 'snippet', detail: 'Pattern match' },
    { label: 'println!', insertText: 'println!("${1}", ${2});', type: 'function', detail: 'Macro: Print with newline' },
    { label: 'Vec::new()', insertText: 'Vec::new()', type: 'function', detail: 'Construct empty growable vector' },
    { label: 'Option', insertText: 'Option<${1:T}>', type: 'type', detail: 'Type representing Some(T) or None' },
    { label: 'Result', insertText: 'Result<${1:T}, ${2:E}>', type: 'type', detail: 'Type representing Ok(T) or Err(E)' },
    { label: 'pub', insertText: 'pub ', type: 'keyword', detail: 'Visibility modifier' },
    { label: 'todo!', insertText: 'todo!()', type: 'function', detail: 'Unimplemented placeholder macro' },
    { label: 'assert_eq!', insertText: 'assert_eq!(${1:left}, ${2:right});', type: 'function', detail: 'Assert equality test' },
    { label: 'i32', insertText: 'i32', type: 'type', detail: '32-bit signed integer' },
    { label: 'usize', insertText: 'usize', type: 'type', detail: 'Pointer-sized unsigned integer' },
    { label: 'String', insertText: 'String', type: 'type', detail: 'Growable UTF-8 heap string' },
    { label: '&str', insertText: '&str', type: 'type', detail: 'String slice reference' },
  ],
  c: [
    { label: 'main', insertText: 'int main(int argc, char *argv[]) {\n    ${0}\n    return 0;\n}', type: 'snippet', detail: 'C Main entry point' },
    { label: 'printf', insertText: 'printf("${1:%d}\\n", ${2});', type: 'function', detail: 'Formatted output to stdout' },
    { label: 'malloc', insertText: '(${1:type}*)malloc(${2:count} * sizeof(${1:type}));', type: 'function', detail: 'Heap dynamic memory allocation' },
    { label: 'free', insertText: 'free(${1:ptr});', type: 'function', detail: 'Deallocate heap pointer' },
    { label: 'sizeof', insertText: 'sizeof(${1:type})', type: 'keyword', detail: 'Memory footprint in bytes' },
    { label: 'struct', insertText: 'typedef struct {\n    ${1}\n} ${2:Name};', type: 'snippet', detail: 'Typedef struct declaration' },
    { label: '#include <stdio.h>', insertText: '#include <stdio.h>\n', type: 'snippet', detail: 'Standard I/O header' },
    { label: '#include <stdlib.h>', insertText: '#include <stdlib.h>\n', type: 'snippet', detail: 'Standard Library header' },
    { label: '#include <string.h>', insertText: '#include <string.h>\n', type: 'snippet', detail: 'String manipulation header' },
    { label: 'NULL', insertText: 'NULL', type: 'constant', detail: 'Null pointer constant ((void*)0)' },
    { label: 'typedef', insertText: 'typedef ', type: 'keyword', detail: 'Type alias definition' },
    { label: 'const', insertText: 'const ', type: 'keyword', detail: 'Read-only qualifier' },
  ],
  cpp: [
    { label: 'cout', insertText: 'std::cout << ${1} << std::endl;', type: 'function', detail: 'Stream output to stdout' },
    { label: 'std::vector', insertText: 'std::vector<${1:int}> ${2:vec};', type: 'type', detail: 'Dynamic contiguous array' },
    { label: 'std::make_unique', insertText: 'std::make_unique<${1:Type}>(${2})', type: 'function', detail: 'Create exclusive owned smart pointer' },
    { label: 'std::shared_ptr', insertText: 'std::shared_ptr<${1:Type}>', type: 'type', detail: 'Reference-counted smart pointer' },
    { label: 'class', insertText: 'class ${1:Name} {\npublic:\n    ${1:Name}() = default;\nprivate:\n    ${0}\n};', type: 'snippet', detail: 'C++ class definition' },
    { label: 'template', insertText: 'template <typename ${1:T}>\n${0}', type: 'snippet', detail: 'Template generic declaration' },
    { label: 'auto', insertText: 'auto ', type: 'keyword', detail: 'Automatic type deduction' },
    { label: 'constexpr', insertText: 'constexpr ', type: 'keyword', detail: 'Compile-time evaluated expression' },
    { label: 'nullptr', insertText: 'nullptr', type: 'constant', detail: 'Type-safe null pointer literal' },
    { label: 'for (range)', insertText: 'for (const auto& ${1:item} : ${2:collection}) {\n    ${0}\n}', type: 'snippet', detail: 'Range-based for loop' },
  ],
  lua: [
    { label: 'function', insertText: 'local function ${1:name}(${2})\n    ${0}\nend', type: 'snippet', detail: 'Local function declaration' },
    { label: 'table.insert', insertText: 'table.insert(${1:tbl}, ${2:val})', type: 'function', detail: 'Append value to array table' },
    { label: 'table.remove', insertText: 'table.remove(${1:tbl}, ${2:pos})', type: 'function', detail: 'Remove element at index' },
    { label: 'setmetatable', insertText: 'setmetatable(${1:tbl}, ${2:mt})', type: 'function', detail: 'Set metatable for operator overloading' },
    { label: 'for pairs', insertText: 'for ${1:k}, ${2:v} in pairs(${3:tbl}) do\n    ${0}\nend', type: 'snippet', detail: 'Iterate dictionary keys and values' },
    { label: 'for ipairs', insertText: 'for ${1:i}, ${2:v} in ipairs(${3:tbl}) do\n    ${0}\nend', type: 'snippet', detail: 'Iterate 1-indexed sequential array' },
    { label: 'print', insertText: 'print(${1})', type: 'function', detail: 'Output formatted text to console' },
    { label: 'local', insertText: 'local ', type: 'keyword', detail: 'Declare lexically scoped variable' },
    { label: 'nil', insertText: 'nil', type: 'constant', detail: 'Absence of value' },
  ],
  luau: [
    { label: '--!strict', insertText: '--!strict\n', type: 'snippet', detail: 'Enable strict static type checking' },
    { label: 'type alias', insertText: 'type ${1:Name} = {\n    ${0}\n}', type: 'snippet', detail: 'Define custom structural type' },
    { label: 'export type', insertText: 'export type ${1:Name} = ${2}', type: 'snippet', detail: 'Export reusable module type' },
    { label: 'task.wait', insertText: 'task.wait(${1:seconds})', type: 'function', detail: 'Non-blocking cooperative yield' },
    { label: 'task.spawn', insertText: 'task.spawn(${1:func})', type: 'function', detail: 'Spawn asynchronous thread' },
    { label: 'typeof', insertText: 'typeof(${1:val})', type: 'function', detail: 'Runtime type check with Roblox datatypes' },
    { label: 'Vector3.new', insertText: 'Vector3.new(${1:x}, ${2:y}, ${3:z})', type: 'function', detail: 'Roblox 3D vector datatype' },
    { label: 'Instance.new', insertText: 'Instance.new("${1:Part}")', type: 'function', detail: 'Create engine game instance' },
    { label: 'continue', insertText: 'continue', type: 'keyword', detail: 'Skip to next loop iteration' },
  ],
  python: [
    { label: 'def', insertText: 'def ${1:func}(${2}) -> ${3:None}:\n    ${0}\n', type: 'snippet', detail: 'Function definition with type hints' },
    { label: 'class', insertText: 'class ${1:ClassName}:\n    def __init__(self, ${2}):\n        ${0}\n', type: 'snippet', detail: 'Class declaration with constructor' },
    { label: 'if __name__', insertText: 'if __name__ == "__main__":\n    ${0}', type: 'snippet', detail: 'Script entry point guard' },
    { label: 'list comprehension', insertText: '[${1:x} for ${1:x} in ${2:iterable} if ${3:condition}]', type: 'snippet', detail: 'List comprehension' },
    { label: 'dict comprehension', insertText: '{${1:k}: ${2:v} for ${1:k}, ${2:v} in ${3:iterable}}', type: 'snippet', detail: 'Dictionary comprehension' },
    { label: 'print', insertText: 'print(f"${1}")', type: 'function', detail: 'Print formatted f-string' },
    { label: 'enumerate', insertText: 'enumerate(${1:iterable})', type: 'function', detail: 'Iterate with index pairs' },
    { label: 'zip', insertText: 'zip(${1:a}, ${2:b})', type: 'function', detail: 'Aggregate elements across iterables' },
    { label: 'lambda', insertText: 'lambda ${1:x}: ${2:expr}', type: 'snippet', detail: 'Anonymous inline function' },
  ],
  gdscript: [
    { label: 'extends', insertText: 'extends ${1:Node}\n', type: 'keyword', detail: 'Inherit from Godot base class' },
    { label: '@export', insertText: '@export var ${1:property}: ${2:float} = ${3:0.0}', type: 'snippet', detail: 'Inspector-editable property' },
    { label: '@onready', insertText: '@onready var ${1:node}: ${2:Node} = $${3:NodePath}', type: 'snippet', detail: 'Deferred scene tree initialization' },
    { label: 'signal', insertText: 'signal ${1:event_name}(${2:param})', type: 'snippet', detail: 'Custom event emitter signal' },
    { label: 'func _ready', insertText: 'func _ready() -> void:\n    ${0}', type: 'snippet', detail: 'Called when node enters active scene' },
    { label: 'func _process', insertText: 'func _process(delta: float) -> void:\n    ${0}', type: 'snippet', detail: 'Called every frame with delta time' },
    { label: 'Vector2', insertText: 'Vector2(${1:x}, ${2:y})', type: 'type', detail: '2D coordinates vector' },
    { label: 'Vector3', insertText: 'Vector3(${1:x}, ${2:y}, ${3:z})', type: 'type', detail: '3D coordinates vector' },
    { label: 'emit_signal', insertText: '${1:signal_name}.emit(${2})', type: 'function', detail: 'Emit signal to listeners' },
    { label: 'queue_free', insertText: 'queue_free()', type: 'function', detail: 'Safely queue node deletion at end of frame' },
  ],
  javascript: [
    { label: 'function', insertText: 'function ${1:name}(${2:params}) {\n    ${0}\n}', type: 'snippet', detail: 'Function declaration' },
    { label: 'const arrow', insertText: 'const ${1:name} = (${2:params}) => {\n    ${0}\n};', type: 'snippet', detail: 'Arrow function expression' },
    { label: 'console.log', insertText: 'console.log(${1});', type: 'function', detail: 'Write output to console' },
    { label: 'map', insertText: '${1:arr}.map((${2:item}) => ${0})', type: 'function', detail: 'Transform every element into a new array' },
    { label: 'filter', insertText: '${1:arr}.filter((${2:item}) => ${0})', type: 'function', detail: 'Keep elements matching predicate' },
    { label: 'reduce', insertText: '${1:arr}.reduce((acc, ${2:cur}) => ${3:acc + cur}, ${4:0})', type: 'function', detail: 'Fold array into a single value' },
    { label: 'async function', insertText: 'async function ${1:name}(${2}) {\n    const ${3:res} = await ${0};\n}', type: 'snippet', detail: 'Async/await function' },
    { label: 'Promise', insertText: 'new Promise((resolve, reject) => {\n    ${0}\n})', type: 'type', detail: 'Asynchronous completion container' },
  ],
  java: [
    { label: 'main', insertText: 'public static void main(String[] args) {\n    ${0}\n}', type: 'snippet', detail: 'Java entry point method' },
    { label: 'System.out.println', insertText: 'System.out.println(${1});', type: 'function', detail: 'Print line to standard output' },
    { label: 'class', insertText: 'public class ${1:Name} {\n    ${0}\n}', type: 'snippet', detail: 'Class declaration' },
    { label: 'record', insertText: 'record ${1:Name}(${2:String id, int value}) {}', type: 'snippet', detail: 'Immutable data carrier record' },
    { label: 'ArrayList', insertText: 'List<${1:String}> ${2:list} = new ArrayList<>();', type: 'type', detail: 'Resizable ordered list collection' },
    { label: 'HashMap', insertText: 'Map<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();', type: 'type', detail: 'Key-value hash table' },
    { label: 'for (each)', insertText: 'for (${1:var} ${2:item} : ${3:collection}) {\n    ${0}\n}', type: 'snippet', detail: 'Enhanced for-each loop' },
    { label: '@Override', insertText: '@Override\n', type: 'keyword', detail: 'Ensure method overrides superclass contract' },
  ],
  go: [
    { label: 'func', insertText: 'func ${1:name}(${2:params}) ${3:error} {\n    ${0}\n}', type: 'snippet', detail: 'Function declaration' },
    { label: 'struct', insertText: 'type ${1:Name} struct {\n    ${0}\n}', type: 'snippet', detail: 'Struct type definition' },
    { label: 'interface', insertText: 'type ${1:Name} interface {\n    ${0}\n}', type: 'snippet', detail: 'Interface contract definition' },
    { label: 'fmt.Println', insertText: 'fmt.Println(${1})', type: 'function', detail: 'Print line to standard output' },
    { label: 'fmt.Sprintf', insertText: 'fmt.Sprintf("${1:%v}", ${2})', type: 'function', detail: 'Format values into a string' },
    { label: 'make(chan)', insertText: 'make(chan ${1:int}, ${2:1})', type: 'function', detail: 'Allocate buffered channel' },
    { label: 'if err != nil', insertText: 'if err != nil {\n    return ${0:err}\n}', type: 'snippet', detail: 'Idiomatic Go error check' },
    { label: 'for range', insertText: 'for ${1:i}, ${2:v} := range ${3:slice} {\n    ${0}\n}', type: 'snippet', detail: 'Range iteration loop' },
  ],
  csharp: [
    { label: 'Console.WriteLine', insertText: 'Console.WriteLine(${1});', type: 'function', detail: 'Write line to console output' },
    { label: 'record', insertText: 'record ${1:Name}(${2:string Label, int Value});', type: 'snippet', detail: 'Immutable positional record type' },
    { label: 'class', insertText: 'class ${1:Name}\n{\n    ${0}\n}', type: 'snippet', detail: 'Class definition' },
    { label: 'foreach', insertText: 'foreach (var ${1:item} in ${2:collection})\n{\n    ${0}\n}', type: 'snippet', detail: 'Iterate collection items' },
    { label: 'LINQ Where', insertText: '${1:items}.Where(${2:x} => ${0})', type: 'function', detail: 'Filter sequence elements cleanly' },
    { label: 'LINQ Select', insertText: '${1:items}.Select(${2:x} => ${0})', type: 'function', detail: 'Project sequence elements' },
    { label: 'async Task', insertText: 'async Task<${1:int}> ${2:RunAsync}()\n{\n    ${0}\n}', type: 'snippet', detail: 'Asynchronous Task method' },
    { label: 'List<T>', insertText: 'new List<${1:string}>()', type: 'type', detail: 'Generic dynamic list collection' },
  ],
};
