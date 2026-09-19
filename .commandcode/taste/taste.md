# Taste

## Communication
- Opens issues by pasting raw build/runtime logs and stack traces with no prose or explicit ask, expecting the agent to autonomously diagnose the root cause and ship the fix (including asking follow-up questions only at the end). Confidence: 0.6
- Terse UI complaints can describe gesture/scroll behavior rather than layout ("the arrangement of cards ... especially in scroll" meant swipe handling, not spacing), and "like X component" references may target behavior/appearance only, not the inner content of the user's existing components; when the interpretation is uncertain, ask a targeted multiple-choice question with concrete symptom/scope options instead of guessing and shipping — the user reacts strongly to fixes that miss their intent ("you don't understand me", "you still don't understand me"). Confidence: 0.7

## Environment & tooling
- Develops on Windows (paths like `E:\...`, backslash separators, `cmd.exe`-flavored shell rather than POSIX — `/dev/null`, `;`-chained commands and `seq` loops fail there). Prefer Windows-safe commands (`nul`, one command per call, `curl --retry`) in this workspace. Confidence: 0.7
- Works in the React Native / Expo (expo-router) + Convex stack, configured via `EXPO_PUBLIC_*` env vars and EAS profiles. Confidence: 0.6
