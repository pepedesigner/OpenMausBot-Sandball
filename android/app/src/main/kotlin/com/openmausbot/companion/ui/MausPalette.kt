package com.openmausbot.companion.ui

/**
 * The mascot palette — `src/lib/mascot.ts` MAUS_COLORS, the same ten the desktop
 * and `ios/App/MausAvatar.swift` use, with the same fallback grey. Rooms are
 * always `"blue"` (that lives in `:core`'s `Chat.RoomChat.color`).
 *
 * Plain ARGB ints rather than `Color` so the mapping is unit-testable on the JVM.
 */
object MausPalette {
    const val FALLBACK: Int = 0xFF8E8E93.toInt()

    private val hex: Map<String, Int> = mapOf(
        "green" to 0xFF5F913B.toInt(),
        "blue" to 0xFF5C85C1.toInt(),
        "red" to 0xFFC4655A.toInt(),
        "orange" to 0xFFC79657.toInt(),
        "purple" to 0xFF8E56B3.toInt(),
        "cyan" to 0xFF549BB6.toInt(),
        "pink" to 0xFFBE6082.toInt(),
        "yellow" to 0xFFC0AB59.toInt(),
        "teal" to 0xFF4AA599.toInt(),
        "coral" to 0xFFC4764F.toInt(),
    )

    val names: Set<String> get() = hex.keys

    fun argb(name: String): Int = hex[name] ?: FALLBACK

    /**
     * Linear mix in sRGB, matching the `mix()` the desktop uses to build its
     * gradient stops. Not perceptually correct, and deliberately so: the point is
     * to land on the same colours as the other screen.
     */
    fun mix(from: Int, to: Int, amount: Double): Int {
        val t = amount.coerceIn(0.0, 1.0)
        fun channel(shift: Int): Int {
            val a = (from shr shift) and 0xFF
            val b = (to shr shift) and 0xFF
            return (a + (b - a) * t).toInt().coerceIn(0, 255)
        }
        return (0xFF shl 24) or
            (channel(16) shl 16) or
            (channel(8) shl 8) or
            channel(0)
    }

    private const val WHITE = 0xFFFFFFFF.toInt()
    private const val BLACK = 0xFF000000.toInt()

    /**
     * The face the body carries — `src/components/CursorAvatar.tsx`, `eyeColor`.
     * Dark, like a face carved into a sand sculpture; white eyes were right on
     * the dark neon bodies this app shipped with and wash out on sand.
     */
    const val FACE_INK: Int = 0xFF33261A.toInt()

    /**
     * The three gradient stops the desktop draws the mascot with: a 22% lift
     * toward white at the top left, the base colour, and a 12% drop toward black
     * — the sand material's own lighting, so a bot reads as a matte sphere.
     */
    fun gradient(name: String): List<Pair<Float, Int>> {
        val base = argb(name)
        return listOf(
            0f to mix(base, WHITE, 0.22),
            0.62f to base,
            1f to mix(base, BLACK, 0.12),
        )
    }
}
