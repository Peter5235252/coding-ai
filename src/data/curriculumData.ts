import { CurriculumLesson, SupportedLanguage } from '../types';

export const CURRICULUM_LESSONS: Record<SupportedLanguage, CurriculumLesson[]> = {
  rust: [
    {
      id: 'rust-1-ownership',
      language: 'rust',
      tier: 'memory_and_types',
      title: 'Ownership & Move Semantics',
      description: 'Understand how Rust eliminates garbage collection by enforcing unique variable ownership at compile time.',
      theory: [
        'Each value in Rust has an owner variable.',
        'There can only be one owner at a time.',
        'When the owner goes out of scope, the value is automatically dropped (freed).',
        'Assigning a heap-allocated String moves ownership rather than copying bytes.'
      ],
      probingQuestion: 'If ownership moves when passing a String to a function, how does Rust prevent double-free errors?',
      starterCode: `fn main() {
    let s1 = String::from("Zenith Core");
    
    // Task: Pass s1 to consume_and_measure, or borrow it with a reference (&s1)
    // Fix the code so s1 can still be used after measurement!
    let length = measure_string(&s1);

    println!("Original: {}, Length: {}", s1, length);
}

// Modify signature to borrow instead of taking ownership:
fn measure_string(s: &String) -> usize {
    s.len()
}
`,
      solutionHint: 'Use an immutable reference &String instead of passing the owned String.',
      verificationRule: {
        mustContain: ['&String', '&s1'],
        description: 'Pass s1 as a borrowed reference &String to preserve ownership in main.',
      },
      xpReward: 60,
    },
    {
      id: 'rust-2-borrowing',
      language: 'rust',
      tier: 'memory_and_types',
      title: 'Mutable Borrowing & Aliasing Rules',
      description: 'Rust guarantees absence of data races: you can have either any number of immutable references, or exactly one mutable reference, but never both simultaneously.',
      theory: [
        'References must always be valid (no dangling pointers).',
        'You cannot create a &mut reference while any & reference is still active in scope.',
        'This compile-time invariant prevents concurrent reader/writer race conditions.'
      ],
      probingQuestion: 'Why does allowing multiple mutable references in the same scope invite undefined behavior in concurrent code?',
      starterCode: `fn append_marker(text: &mut String) {
    text.push_str(" [VERIFIED]");
}

fn main() {
    let mut log_entry = String::from("Transaction 4092");
    
    // Borrow mutably and apply update
    append_marker(&mut log_entry);
    
    println!("Updated Log: {}", log_entry);
}
`,
      solutionHint: 'Ensure you pass &mut log_entry and declare let mut log_entry.',
      verificationRule: {
        mustContain: ['&mut', 'push_str'],
        description: 'Declare a mutable String and pass it as &mut reference.',
      },
      xpReward: 70,
    },
    {
      id: 'rust-3-pattern-matching',
      language: 'rust',
      tier: 'idiomatic_patterns',
      title: 'Exhaustive Pattern Matching & Option',
      description: 'Rust eliminates null pointer exceptions by replacing null with the Option<T> enum and forcing exhaustive pattern matching.',
      theory: [
        'Option<T> is either Some(value) or None.',
        'The compiler will reject any match statement that forgets to handle None.',
        'Use if let or match to extract values safely.'
      ],
      probingQuestion: 'What fundamental software defect does mandatory enum exhaustion solve at compile time?',
      starterCode: `fn parse_port(input: &str) -> Option<u16> {
    input.parse::<u16>().ok()
}

fn main() {
    let raw_port = "8080";
    let port_opt = parse_port(raw_port);

    // Task: Match on port_opt exhaustively:
    match port_opt {
        Some(port) => println!("Binding server to port: {}", port),
        None => println!("Invalid port string provided"),
    }
}
`,
      solutionHint: 'Match both Some(port) and None branches exhaustively.',
      verificationRule: {
        mustContain: ['Some', 'None', 'match'],
        description: 'Exhaustively handle Some and None using match.',
      },
      xpReward: 80,
    },
  ],
  c: [
    {
      id: 'c-1-pointers',
      language: 'c',
      tier: 'foundation',
      title: 'Pointers & Memory Addresses',
      description: 'Master raw memory addressing: the difference between a variable, its address in RAM (&), and dereferencing (*).',
      theory: [
        'Every variable occupies physical bytes on the stack.',
        'The unary & operator retrieves the memory address of an lvalue.',
        'The unary * operator dereferences a pointer, reading or modifying the byte at that address.'
      ],
      probingQuestion: 'What does a pointer hold, and what distinguishes a pointer on 32-bit vs 64-bit architecture?',
      starterCode: `#include <stdio.h>

void swap(int *a, int *b) {
    // Task: Implement pointer-based in-place swap
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main(void) {
    int x = 10;
    int y = 99;
    printf("Before: x=%d, y=%d\\n", x, y);

    swap(&x, &y);

    printf("After:  x=%d, y=%d\\n", x, y);
    return 0;
}
`,
      solutionHint: 'Pass the addresses &x and &y, and dereference inside swap using *a and *b.',
      verificationRule: {
        mustContain: ['*a', '*b', '&x', '&y'],
        description: 'Use pointer dereferencing to swap values in place.',
      },
      xpReward: 60,
    },
    {
      id: 'c-2-malloc-free',
      language: 'c',
      tier: 'memory_and_types',
      title: 'Dynamic Heap Allocation & Lifecycles',
      description: 'Allocate runtime buffers with malloc, check for NULL allocation failures, and rigorously prevent memory leaks with free.',
      theory: [
        'Stack memory is fixed and reclaimed when functions return.',
        'Heap memory persists until explicitly released with free().',
        'Failing to call free() causes memory leaks; using a freed pointer causes use-after-free.'
      ],
      probingQuestion: 'Why is it critical to assign NULL to a pointer immediately after freeing it?',
      starterCode: `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    size_t count = 5;
    int *buffer = (int *)malloc(count * sizeof(int));
    if (buffer == NULL) {
        fprintf(stderr, "Allocation failed\\n");
        return 1;
    }

    for (size_t i = 0; i < count; i++) {
        buffer[i] = (int)(i * 10);
        printf("buffer[%zu] = %d (address: %p)\\n", i, buffer[i], (void*)&buffer[i]);
    }

    // Always free dynamic memory when finished:
    free(buffer);
    buffer = NULL;

    printf("Heap buffer safely deallocated.\\n");
    return 0;
}
`,
      solutionHint: 'Verify that malloc allocates count * sizeof(int), followed by free(buffer) and buffer = NULL.',
      verificationRule: {
        mustContain: ['malloc', 'free', 'sizeof'],
        description: 'Allocate dynamic buffer with malloc and release with free.',
      },
      xpReward: 75,
    },
  ],
  cpp: [
    {
      id: 'cpp-1-raii',
      language: 'cpp',
      tier: 'memory_and_types',
      title: 'RAII & std::unique_ptr',
      description: 'Resource Acquisition Is Initialization (RAII) ties resource lifespan to object lifetime, automating cleanup through deterministic destructors.',
      theory: [
        'std::unique_ptr represents exclusive ownership of a heap resource.',
        'When std::unique_ptr goes out of scope, its destructor invokes delete automatically.',
        'It cannot be copied, only moved, guaranteeing zero double-free or dangling pointers.'
      ],
      probingQuestion: 'How does RAII solve the problem of memory leaks when exceptions are thrown midway through a function?',
      starterCode: `#include <iostream>
#include <memory>
#include <string>

class SocketHandle {
public:
    std::string ip;
    explicit SocketHandle(std::string addr) : ip(std::move(addr)) {
        std::cout << "[Connect] Socket opened to " << ip << "\\n";
    }
    ~SocketHandle() {
        std::cout << "[Disconnect] Socket closed automatically\\n";
    }
    void send_packet(const std::string& data) {
        std::cout << "Sending: " << data << " to " << ip << "\\n";
    }
};

int main() {
    // Task: Use std::make_unique to instantiate SocketHandle safely
    auto sock = std::make_unique<SocketHandle>("192.168.1.100");
    sock->send_packet("PING_PAYLOAD");

    // Destructor runs deterministically when main finishes!
    return 0;
}
`,
      solutionHint: 'Use std::make_unique<SocketHandle>("...") for exception-safe heap allocation.',
      verificationRule: {
        mustContain: ['make_unique', 'unique_ptr'],
        description: 'Manage lifecycle using std::unique_ptr.',
      },
      xpReward: 70,
    },
  ],
  lua: [
    {
      id: 'lua-1-tables',
      language: 'lua',
      tier: 'foundation',
      title: 'Tables as Universal Data Structures',
      description: 'In Lua, tables are the only data structuring mechanism, functioning simultaneously as associative arrays, numeric sequences, and hash maps.',
      theory: [
        'Lua arrays are 1-indexed tables.',
        'Tables can contain mixed keys (strings, numbers, functions).',
        'Use ipairs for numeric sequences, and pairs for arbitrary hash keys.'
      ],
      probingQuestion: 'Why does Lua use a single unified data structure (table) instead of separate array, set, and dict primitives?',
      starterCode: `-- Master Lua table manipulation
local inventory = {
    "Iron Sword",
    "Health Potion",
    "Grand Shield"
}

-- Insert a new item into the sequence
table.insert(inventory, "Magic Scroll")

-- Print all items with 1-based indexing
for index, item in ipairs(inventory) do
    print(string.format("[%d] %s", index, item))
end
`,
      solutionHint: 'Use table.insert to append and iterate using ipairs.',
      verificationRule: {
        mustContain: ['table.insert', 'ipairs'],
        description: 'Append to table and iterate with ipairs.',
      },
      xpReward: 50,
    },
    {
      id: 'lua-2-metatables',
      language: 'lua',
      tier: 'idiomatic_patterns',
      title: 'Metatables & Metamethods',
      description: 'Unlock Lua OOP and operator overloading using metatables with metamethods like __index, __add, and __tostring.',
      theory: [
        'Every table can have a metatable attached via setmetatable.',
        '__index controls fallbacks when a key does not exist on the primary table.',
        'Metatables enable classes, prototype inheritance, and custom algebra.'
      ],
      probingQuestion: 'What happens behind the scenes in the Lua VM when table.field is read and field is nil?',
      starterCode: `local Account = {}
Account.__index = Account

function Account.new(balance)
    local self = setmetatable({}, Account)
    self.balance = balance or 0
    return self
end

function Account:deposit(amount)
    self.balance = self.balance + amount
    print("Deposited: " .. amount .. " | Current Balance: " .. self.balance)
end

local my_acc = Account.new(100)
my_acc:deposit(50)
`,
      solutionHint: 'Define Account.__index = Account and wrap instances with setmetatable({}, Account).',
      verificationRule: {
        mustContain: ['setmetatable', '__index'],
        description: 'Implement OOP prototype using setmetatable and __index.',
      },
      xpReward: 80,
    },
  ],
  luau: [
    {
      id: 'luau-1-typing',
      language: 'luau',
      tier: 'foundation',
      title: 'Strict Mode & Static Type Checking',
      description: 'Luau adds a robust, gradual type system on top of Lua. Annotate variables, structural shapes, and function signatures with --!strict.',
      theory: [
        'Add --!strict at the top of the script to enable complete type inference and checking.',
        'Use type Name = { field: type } for structural typing.',
        'Function return types use : return_type syntax.'
      ],
      probingQuestion: 'How does static type checking in Luau prevent runtime bugs before deploying to production game environments?',
      starterCode: `--!strict

type PlayerData = {
    username: string,
    level: number,
    isAlive: boolean
}

local function format_player(data: PlayerData): string
    return string.format("Player %s (Level %d) - Status: %s", 
        data.username, 
        data.level, 
        data.isAlive and "Active" or "Fallen"
    )
end

local player: PlayerData = {
    username = "ZenithHero",
    level = 42,
    isAlive = true
}

print(format_player(player))
`,
      solutionHint: 'Ensure --!strict is at the top and type PlayerData is declared.',
      verificationRule: {
        mustContain: ['--!strict', 'type PlayerData', ': string'],
        description: 'Define custom structural type and enforce with --!strict pragma.',
      },
      xpReward: 65,
    },
  ],
  python: [
    {
      id: 'python-1-comprehensions',
      language: 'python',
      tier: 'foundation',
      title: 'Idiomatic List & Dict Comprehensions',
      description: 'Write expressive, performant data transformations in a single declarative line instead of imperative loop accumulators.',
      theory: [
        'List comprehensions: [expr for item in iterable if condition].',
        'Dict comprehensions: {key_expr: val_expr for item in iterable}.',
        'Comprehensions are optimized at bytecode level in CPython.'
      ],
      probingQuestion: 'When does a generator expression (expr for x in seq) become more memory-efficient than a list comprehension?',
      starterCode: `def square_evens(numbers: list[int]) -> list[int]:
    # Task: Replace imperative loop with an idiomatic list comprehension
    return [n * n for n in numbers if n % 2 == 0]

data = [1, 2, 3, 4, 5, 6, 7, 8]
result = square_evens(data)
print(f"Squared Evens: {result}")
`,
      solutionHint: 'Use [n * n for n in numbers if n % 2 == 0].',
      verificationRule: {
        mustContain: ['for', 'if', '% 2'],
        description: 'Use a list comprehension with conditional filter.',
      },
      xpReward: 50,
    },
    {
      id: 'python-2-generators',
      language: 'python',
      tier: 'memory_and_types',
      title: 'Memory-Efficient Streaming with Generators',
      description: 'Process infinite or massive streams with yield, producing values on demand without allocating massive lists in RAM.',
      theory: [
        'A function containing yield returns a generator iterator object.',
        'Execution freezes at yield and resumes upon next() call.',
        'Enables O(1) memory space complexity when processing arbitrarily large data sets.'
      ],
      probingQuestion: 'What happens to local variables and instruction pointers inside a generator function between successive yields?',
      starterCode: `def fibonacci_stream(limit: int):
    """Yields Fibonacci numbers up to limit count."""
    a, b = 0, 1
    for _ in range(limit):
        yield a
        a, b = b, a + b

if __name__ == "__main__":
    fib_seq = list(fibonacci_stream(8))
    print(f"Fibonacci Stream: {fib_seq}")
`,
      solutionHint: 'Use yield a and multiple assignment a, b = b, a + b.',
      verificationRule: {
        mustContain: ['yield', 'fibonacci_stream'],
        description: 'Implement streaming sequence generator using yield.',
      },
      xpReward: 70,
    },
  ],
  gdscript: [
    {
      id: 'gdscript-1-signals',
      language: 'gdscript',
      tier: 'idiomatic_patterns',
      title: 'Signals & Event-Driven Decoupling',
      description: 'Godot design principle: Call down, Signal up. Use signals to emit events without tightly coupling child nodes to parent managers.',
      theory: [
        'Define custom signals with: signal event_name(args).',
        'Emit signals with: event_name.emit(value).',
        'Connect listeners with: signal_name.connect(callable).',
        'Decoupled architecture allows nodes to be tested and swapped in isolation.'
      ],
      probingQuestion: 'Why does the Godot architectural tenet "Call Down, Signal Up" prevent cyclic dependencies in scene trees?',
      starterCode: `extends Node

signal level_completed(time_taken: float, stars: int)

func finish_level(time_elapsed: float) -> void:
    var stars_awarded: int = 3 if time_elapsed < 60.0 else 2
    print("Level finished in: ", time_elapsed, "s")
    
    # Task: Emit the level_completed signal
    level_completed.emit(time_elapsed, stars_awarded)

func _ready() -> void:
    # Connect signal to local listener for demonstration
    level_completed.connect(_on_level_completed)
    finish_level(45.2)

func _on_level_completed(time: float, stars: int) -> void:
    print("Listener received completion: Stars = ", stars)
`,
      solutionHint: 'Use level_completed.emit(...) to fire the event.',
      verificationRule: {
        mustContain: ['signal', 'emit', 'connect'],
        description: 'Declare signal, connect listener, and emit with parameters.',
      },
      xpReward: 75,
    },
  ],
  javascript: [
    {
      id: 'js-1-closures',
      language: 'javascript',
      tier: 'foundation',
      title: 'Lexical Closures & Encapsulation',
      description: 'Understand how inner functions retain live references to outer lexical variables after the outer function has returned.',
      theory: [
        'A closure bundles a function together with references to its surrounding lexical environment.',
        'Outer variables remain alive in heap closure cells as long as the returned function is reachable.',
        'This enables private state without exposing mutable properties directly.'
      ],
      probingQuestion: 'Why does calling createAccumulator() twice give two independent totals instead of sharing one counter?',
      starterCode: `function createAccumulator(initial = 0) {
    let total = initial;
    return function add(amount) {
        total += amount;
        return total;
    };
}

const score = createAccumulator(10);
console.log(score(5));
console.log(score(12));
`,
      solutionHint: 'Keep total inside createAccumulator and mutate/return it from the inner function.',
      verificationRule: {
        mustContain: ['function', 'return'],
        description: 'Return an inner closure that captures and updates state.',
      },
      xpReward: 50,
    },
    {
      id: 'js-2-array-pipelines',
      language: 'javascript',
      tier: 'idiomatic_patterns',
      title: 'Immutable Pipelines with map, filter & reduce',
      description: 'Transform collections cleanly without mutating original arrays using composable higher-order methods.',
      theory: [
        'map() and filter() allocate a new array without altering the input collection.',
        'reduce() folds elements left-to-right into any target summary value.',
        'Chaining pure steps eliminates off-by-one index bugs.'
      ],
      probingQuestion: 'When chaining .filter().map() on very large arrays, how many intermediate arrays are allocated?',
      starterCode: `const readings = [18, -4, 24, 31, -1, 12];

const validAverage = readings
    .filter((v) => v >= 0)
    .reduce((acc, v, _, arr) => acc + v / arr.length, 0);

console.log("Valid average:", validAverage.toFixed(2));
`,
      solutionHint: 'Filter out negative values first, then compute the average in reduce.',
      verificationRule: {
        mustContain: ['.filter', '.reduce'],
        description: 'Chain filter and reduce cleanly.',
      },
      xpReward: 60,
    },
  ],
  java: [
    {
      id: 'java-1-records',
      language: 'java',
      tier: 'foundation',
      title: 'Immutable Data Modeling with Java Records',
      description: 'Use concise Java 21 records to model immutable value objects with automatic equals(), hashCode(), and toString().',
      theory: [
        'Records declare shallowly immutable data carriers in a single line.',
        'Fields in a record are implicitly private and final.',
        'Compact constructors allow clean validation before field assignment.'
      ],
      probingQuestion: 'How do records differ from standard mutable POJO classes when used as keys in a HashMap?',
      starterCode: `import java.util.List;

public class Main {
    record Measurement(String sensor, double value) {
        Measurement {
            if (value < 0) throw new IllegalArgumentException("Negative reading");
        }
    }

    public static void main(String[] args) {
        List<Measurement> items = List.of(
            new Measurement("Temp-A", 22.5),
            new Measurement("Temp-B", 25.0)
        );
        items.forEach(m -> System.out.println(m.sensor() + ": " + m.value()));
    }
}
`,
      solutionHint: 'Declare a record with accessor methods and iterate with forEach.',
      verificationRule: {
        mustContain: ['record', 'public static void main'],
        description: 'Define a Java record and inspect its fields in main().',
      },
      xpReward: 55,
    },
    {
      id: 'java-2-streams',
      language: 'java',
      tier: 'idiomatic_patterns',
      title: 'Declarative Data Pipelines with Java Streams',
      description: 'Process lists lazily using Java Stream intermediate operations and terminal collectors.',
      theory: [
        'Intermediate operations like filter() and map() are lazy until a terminal operation runs.',
        'Terminal operations like toList() or sum() trigger execution in a single pass.',
        'Streams avoid external iterator state bugs.'
      ],
      probingQuestion: 'Why does a Stream print nothing if you forget a terminal operation like forEach() or toList()?',
      starterCode: `import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Integer> scores = List.of(42, 85, 91, 60, 77);

        int highTotal = scores.stream()
            .filter(s -> s >= 75)
            .mapToInt(Integer::intValue)
            .sum();

        System.out.println("High score sum: " + highTotal);
    }
}
`,
      solutionHint: 'Use .stream().filter(...).mapToInt(...).sum().',
      verificationRule: {
        mustContain: ['.stream()', '.filter('],
        description: 'Filter and aggregate values using a Java Stream pipeline.',
      },
      xpReward: 70,
    },
  ],
  go: [
    {
      id: 'go-1-channels',
      language: 'go',
      tier: 'foundation',
      title: 'Goroutines & Channel Synchronization',
      description: 'Do not communicate by sharing memory; instead, share memory by communicating through typed Go channels.',
      theory: [
        'Goroutines are lightweight user-space threads multiplexed onto OS threads by the Go runtime.',
        'Unbuffered channels synchronize sender and receiver on handoff.',
        'Buffered channels hold up to N queued elements before blocking senders.'
      ],
      probingQuestion: 'What happens if a goroutine sends to an unbuffered channel when no receiver is ready?',
      starterCode: `package main

import "fmt"

func computeSquares(nums []int, out chan<- int) {
    for _, n := range nums {
        out <- n * n
    }
    close(out)
}

func main() {
    ch := make(chan int, 4)
    go computeSquares([]int{2, 4, 6, 8}, ch)

    for sq := range ch {
        fmt.Println("Square:", sq)
    }
}
`,
      solutionHint: 'Close the channel inside the producer so for range ch terminates cleanly.',
      verificationRule: {
        mustContain: ['go ', 'chan', 'close('],
        description: 'Spawn a goroutine that writes to and closes a channel.',
      },
      xpReward: 65,
    },
    {
      id: 'go-2-interfaces',
      language: 'go',
      tier: 'idiomatic_patterns',
      title: 'Implicit Interfaces & Small Contracts',
      description: 'Go types satisfy interfaces implicitly without an implements keyword, encouraging small decoupled abstractions.',
      theory: [
        'Any struct implementing all methods of an interface satisfies it automatically.',
        'Prefer small 1-2 method interfaces like fmt.Stringer or io.Reader.',
        'Value receivers vs pointer receivers control whether values or pointers satisfy the interface.'
      ],
      probingQuestion: 'Why does Go let packages define interfaces locally rather than coupling them to the concrete implementation package?',
      starterCode: `package main

import "fmt"

type Describable interface {
    Describe() string
}

type Sensor struct {
    Name string
    Temp float64
}

func (s Sensor) Describe() string {
    return fmt.Sprintf("%s reads %.1f C", s.Name, s.Temp)
}

func main() {
    var item Describable = Sensor{Name: "Core", Temp: 41.5}
    fmt.Println(item.Describe())
}
`,
      solutionHint: 'Implement Describe() string on Sensor so it satisfies Describable.',
      verificationRule: {
        mustContain: ['interface', 'func ('],
        description: 'Satisfy an interface implicitly via a method receiver.',
      },
      xpReward: 60,
    },
  ],
  csharp: [
    {
      id: 'csharp-1-linq',
      language: 'csharp',
      tier: 'foundation',
      title: 'Deferred Execution with LINQ Queries',
      description: 'Use C# LINQ extension methods to filter and transform sequences declaratively with deferred evaluation.',
      theory: [
        'LINQ queries return IEnumerable<T> iterators that execute lazily during enumeration.',
        'Combining .Where() and .Select() creates composable zero-boilerplate data pipelines.',
        'Materialize results only when needed using .ToList() or foreach.'
      ],
      probingQuestion: 'Why does modifying a source list before iterating a LINQ query affect the output?',
      starterCode: `using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static void Main()
    {
        var numbers = new List<int> { 3, 8, 15, 22, 9, 14 };

        var evensSquared = numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n);

        Console.WriteLine(string.Join(", ", evensSquared));
    }
}
`,
      solutionHint: 'Chain .Where(n => n % 2 == 0) and .Select(n => n * n).',
      verificationRule: {
        mustContain: ['.Where(', '.Select('],
        description: 'Filter even numbers and square them using LINQ.',
      },
      xpReward: 55,
    },
    {
      id: 'csharp-2-pattern-matching',
      language: 'csharp',
      tier: 'idiomatic_patterns',
      title: 'Records & Switch Pattern Matching',
      description: 'Combine C# immutable records with switch expressions to write exhaustive, expressive domain logic.',
      theory: [
        'Switch expressions return values directly from concise pattern arms.',
        'Relational patterns (e.g. >= 90) and property patterns eliminate nested if/else chains.',
        'Compiler exhaustiveness checks warn when a case is unhandled.'
      ],
      probingQuestion: 'How do value types (struct / record struct) differ from reference classes on the .NET heap vs stack?',
      starterCode: `using System;

record Reading(string Kind, int Level);

class Program
{
    static string Classify(Reading r) => r switch
    {
        { Level: >= 80 } => $"{r.Kind}: High",
        { Level: >= 40 } => $"{r.Kind}: Nominal",
        _ => $"{r.Kind}: Low"
    };

    static void Main()
    {
        Console.WriteLine(Classify(new Reading("Battery", 85)));
        Console.WriteLine(Classify(new Reading("Signal", 25)));
    }
}
`,
      solutionHint: 'Use a C# property pattern switch expression.',
      verificationRule: {
        mustContain: ['switch', 'record'],
        description: 'Match a C# record with a switch expression.',
      },
      xpReward: 65,
    },
  ],
};
