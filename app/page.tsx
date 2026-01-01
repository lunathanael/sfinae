'use client';

import { useRef, useLayoutEffect, memo } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('cpp', cpp);

const cppCode = `template<typename T>
struct has_iterator {
    template<typename U>
    static auto test(int) -> decltype(std::begin(std::declval<U&>()), std::end(std::declval<U&>()), std::true_type{});
    template<typename>
    static std::false_type test(...);
    using type = decltype(test<T>(0));
    static constexpr bool value = type::value;
};

template<typename T>
constexpr bool has_iterator_v = has_iterator<T>::value;

template<typename T>
struct has_size {
    template<typename U>
    static auto test(int) -> decltype(std::declval<U>().size(), std::true_type{});
    template<typename>
    static std::false_type test(...);
    using type = decltype(test<T>(0));
    static constexpr bool value = type::value;
};

template<typename T>
auto serialize(T&& t) -> std::enable_if_t<has_iterator_v<std::decay_t<T>>, void> {
    for (auto&& elem : t) { serialize(elem); }
}

template<typename T>
auto serialize(T&& t) -> std::enable_if_t<!has_iterator_v<std::decay_t<T>>, void> {
    write(std::forward<T>(t));
}

template<typename T>
struct is_callable {
    template<typename U>
    static auto test(int) -> decltype(std::declval<U>()(), std::true_type{});
    template<typename>
    static std::false_type test(...);
    using type = decltype(test<T>(0));
    static constexpr bool value = type::value;
};

template<typename F, typename... Args>
auto invoke_if_callable(F&& f, Args&&... args) -> std::enable_if_t<is_callable<F>::value, decltype(f())> {
    return std::forward<F>(f)();
}

template<typename F, typename... Args>
auto invoke_if_callable(F&& f, Args&&... args) -> std::enable_if_t<!is_callable<F>::value, void> {
    std::forward<F>(f)(std::forward<Args>(args)...);
}

template<typename T>
struct has_value_type {
    template<typename U>
    static auto test(int) -> decltype(typename U::value_type{}, std::true_type{});
    template<typename>
    static std::false_type test(...);
    using type = decltype(test<T>(0));
    static constexpr bool value = type::value;
};

template<typename Container>
auto get_first(Container&& c) -> std::enable_if_t<has_iterator_v<Container>, decltype(*std::begin(c))> {
    return *std::begin(c);
}

template<typename T>
struct is_container {
    static constexpr bool value = has_iterator_v<T> && has_size_v<T>;
};

template<typename T>
using enable_if_container = std::enable_if_t<is_container<T>::value, int>;

template<typename T>
struct has_push_back {
    template<typename U>
    static auto test(int) -> decltype(std::declval<U>().push_back(std::declval<typename U::value_type>()), std::true_type{});
    template<typename>
    static std::false_type test(...);
    using type = decltype(test<T>(0));
    static constexpr bool value = type::value;
};

template<typename T>
struct has_emplace_back {
    template<typename U>
    static auto test(int) -> decltype(std::declval<U>().emplace_back(), std::true_type{});
    template<typename>
    static std::false_type test(...);
    using type = decltype(test<T>(0));
    static constexpr bool value = type::value;
};

template<typename Container, typename Value>
auto add_element(Container& c, Value&& v) -> std::enable_if_t<has_emplace_back<Container>::value, void> {
    c.emplace_back(std::forward<Value>(v));
}

template<typename Container, typename Value>
auto add_element(Container& c, Value&& v) -> std::enable_if_t<has_push_back<Container>::value && !has_emplace_back<Container>::value, void> {
    c.push_back(std::forward<Value>(v));
}

template<typename T>
struct is_arithmetic {
    static constexpr bool value = std::is_arithmetic_v<T>;
};

template<typename T>
struct has_operator_plus {
    template<typename U>
    static auto test(int) -> decltype(std::declval<U>() + std::declval<U>(), std::true_type{});
    template<typename>
    static std::false_type test(...);
    using type = decltype(test<T>(0));
    static constexpr bool value = type::value;
};

template<typename T>
auto add(T&& a, T&& b) -> std::enable_if_t<has_operator_plus<std::decay_t<T>>::value, decltype(a + b)> {
    return std::forward<T>(a) + std::forward<T>(b);
}

template<typename T>
struct has_reserve {
    template<typename U>
    static auto test(int) -> decltype(std::declval<U>().reserve(0), std::true_type{});
    template<typename>
    static std::false_type test(...);
    using type = decltype(test<T>(0));
    static constexpr bool value = type::value;
};

template<typename Container>
auto optimize_capacity(Container& c, size_t n) -> std::enable_if_t<has_reserve<Container>::value, void> {
    c.reserve(n);
}

template<typename Container>
auto optimize_capacity(Container& c, size_t n) -> std::enable_if_t<!has_reserve<Container>::value, void> {}

template<typename...> using void_t = void;

template<typename T, typename = void>
struct is_iterable : std::false_type {};

template<typename T>
struct is_iterable<T, void_t<decltype(std::begin(std::declval<T>())), decltype(std::end(std::declval<T>()))>> : std::true_type {};

template<typename T>
constexpr bool is_iterable_v = is_iterable<T>::value;

template<typename T>
auto process_iterable(T&& t) -> std::enable_if_t<is_iterable_v<T>, void> {
    for (const auto& item : t) { process(item); }
}

template<typename T>
auto process_iterable(T&& t) -> std::enable_if_t<!is_iterable_v<T>, void> {
    process_single(std::forward<T>(t));
}
`;

// Memoize the code block to prevent re-rendering during scroll/animations
const CodeBlock = memo(function CodeBlock({ code }: { code: string }) {
    return (
        <div className="code-block">
            <SyntaxHighlighter
                language="cpp"
                style={oneDark}
                customStyle={{
                    margin: 0,
                    padding: '1rem 2rem',
                    background: 'transparent',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    textDecoration: 'none',
                    whiteSpace: 'pre',
                    overflow: 'hidden',
                }}
                codeTagProps={{
                    style: { textDecoration: 'none' }
                }}
                showLineNumbers={false}
                wrapLines={false}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
});

export default function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentWrapperRef = useRef<HTMLDivElement>(null);

    // Create a block that repeats the code a few times to ensure we have scrolling room
    const content = useRef(Array(3).fill(cppCode)).current;

    // Handle initial setup
    useLayoutEffect(() => {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        const container = containerRef.current;
        if (!container) return;

        // Start at top for the animation
        container.scrollTop = 0;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const pageHeight = scrollHeight / 3;

            // If we scroll near the top (into the first block)
            if (scrollTop < pageHeight * 0.1) {
                container.scrollTop = scrollTop + pageHeight;
            }
            // If we scroll near the bottom (into the third block)
            else if (scrollTop > pageHeight * 1.9) {
                container.scrollTop = scrollTop - pageHeight;
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAnimationEnd = () => {
        const container = containerRef.current;
        const wrapper = contentWrapperRef.current;

        if (!container || !wrapper) return;

        // Calculate the target scroll position
        const scrollHeight = container.scrollHeight;
        const pageHeight = scrollHeight / 3;

        // This must happen synchronously to prevent jump:
        // 1. Remove the animation class (removes transform)
        // 2. Set scrollTop to the position the transform was showing
        wrapper.classList.remove('animate-slide-content');
        container.scrollTop = pageHeight;
    };

    return (
        <div className="relative w-full h-screen bg-[#0d1117] overflow-hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

            {/* Scrollable Container */}
            <div
                ref={containerRef}
                className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div
                    ref={contentWrapperRef}
                    className="w-full opacity-30 blur-[1px] animate-slide-content"
                    onAnimationEnd={handleAnimationEnd}
                >
                    {content.map((code, idx) => (
                        <CodeBlock key={idx} code={code} />
                    ))}
                </div>
            </div>

            {/* Top fade */}
            <div className="fixed top-0 left-0 right-0 bg-gradient-to-b from-[#0d1117] via-[#0d1117]/80 to-transparent h-32 pointer-events-none z-20" />

            {/* Bottom fade */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/80 to-transparent h-32 pointer-events-none z-20" />

            {/* Vignette (fixes bright edges) */}
            <div className="fixed inset-0 vignette z-20" />

            {/* Center Content */}
            <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
                <div className="text-center px-8">
                    {/* Removed drop-shadow to fix animation lag */}
                    <h1
                        className="text-6xl font-bold tracking-tight text-[#58a6ff] md:text-7xl lg:text-8xl animate-fade-in-up delay-100"
                        style={{ fontFamily: 'var(--font-space)' }}
                    >
                        SFINAE
                    </h1>
                    <p
                        className="mt-6 text-base text-[#8b949e] md:text-lg lg:text-xl font-medium tracking-wide animate-fade-in-up delay-300"
                        style={{ fontFamily: 'var(--font-space)' }}
                    >
                        Substitution Failure Is Not An Error
                    </p>
                </div>
            </div>

            {/* Overlay for readability */}
            <div className="fixed inset-0 bg-gradient-to-b from-[#0d1117]/40 via-transparent to-[#0d1117]/40 pointer-events-none z-10" />
        </div>
    );
}
