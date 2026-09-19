// Mechanical slate->forest transform for AI goal components.
// Property-anchored replacements only (safe: values are identical in light mode).
const fs = require('fs');

const PROP = [
  // [regex, replacement]
  [/backgroundColor: '#FFFFFF'/g, 'backgroundColor: T.card'],
  [/backgroundColor: '#F8FAFC'/g, 'backgroundColor: T.input'],
  [/backgroundColor: '#FFF7ED'/g, 'backgroundColor: T.accentWash'],
  [/backgroundColor: '#F1F5F9'/g, 'backgroundColor: T.bubbleAlt'],
  [/backgroundColor: '#EA580C'/g, 'backgroundColor: T.accentFill'],
  [/backgroundColor: '#EF4444'/g, 'backgroundColor: T.danger'],
  [/backgroundColor: '#FEE2E2'/g, 'backgroundColor: T.dangerWash'],
  [/backgroundColor: '#FEF2F2'/g, 'backgroundColor: T.dangerWash'],
  [/backgroundColor: '#CBD5E1'/g, 'backgroundColor: T.borderStrong'],
  [/backgroundColor: '#E2E8F0'/g, 'backgroundColor: T.border'],
  [/backgroundColor: '#EFF6FF'/g, 'backgroundColor: T.infoWash'],
  [/backgroundColor: '#DBEAFE'/g, 'backgroundColor: T.infoWash'],
  [/backgroundColor: '#F5F3FF'/g, 'backgroundColor: T.specialWash'],
  [/backgroundColor: '#EDE9FE'/g, 'backgroundColor: T.specialWash'],
  [/backgroundColor: '#E9D5FF'/g, 'backgroundColor: T.specialWash'],
  [/backgroundColor: '#ECFDF5'/g, 'backgroundColor: T.successWash'],
  [/backgroundColor: '#DCFCE7'/g, 'backgroundColor: T.successWash'],
  [/backgroundColor: '#D1FAE5'/g, 'backgroundColor: T.successWash'],
  [/backgroundColor: '#FFFBEB'/g, 'backgroundColor: T.warningWash'],
  [/backgroundColor: '#FDE68A'/g, 'backgroundColor: T.warningWash'],
  [/backgroundColor: '#FEF3C7'/g, 'backgroundColor: T.warningWash'],
  [/backgroundColor: '#0F172A'/g, 'backgroundColor: T.text'],
  [/backgroundColor: '#1E293B'/g, 'backgroundColor: T.text'],

  [/borderColor: '#E2E8F0'/g, 'borderColor: T.border'],
  [/borderColor: '#CBD5E1'/g, 'borderColor: T.borderStrong'],
  [/borderColor: '#FED7AA'/g, 'borderColor: T.accentBorder'],
  [/borderColor: '#F97316'/g, 'borderColor: T.accentBorder'],
  [/borderTopColor: '#E2E8F0'/g, 'borderTopColor: T.border'],
  [/borderBottomColor: '#E2E8F0'/g, 'borderBottomColor: T.border'],
  [/borderLeftColor: '#E2E8F0'/g, 'borderLeftColor: T.border'],
  [/borderRightColor: '#E2E8F0'/g, 'borderRightColor: T.border'],
  [/borderColor: '#BFDBFE'/g, 'borderColor: T.border'],
  [/borderColor: '#DBEAFE'/g, 'borderColor: T.border'],
  [/borderColor: '#E9D5FF'/g, 'borderColor: T.accentBorder'],
  [/borderColor: '#D1FAE5'/g, 'borderColor: T.border'],
  [/borderColor: '#A7F3D0'/g, 'borderColor: T.border'],
  [/borderColor: '#FDE68A'/g, 'borderColor: T.warningWash'],
  [/borderColor: '#FEF3C7'/g, 'borderColor: T.warningWash'],
  [/borderColor: '#059669'/g, 'borderColor: T.success'],
  [/borderColor: '#10B981'/g, 'borderColor: T.success'],

  [/color: '#0F172A'/g, 'color: T.text'],
  [/color: '#1E293B'/g, 'color: T.text'],
  [/color: '#334155'/g, 'color: T.textBody'],
  [/color: '#475569'/g, 'color: T.textSecondary'],
  [/color: '#64748B'/g, 'color: T.textMuted'],
  [/color: '#94A3B8'/g, 'color: T.textMuted'],
  [/color: '#E2E8F0'/g, 'color: T.textMuted'],
  [/color: '#EA580C'/g, 'color: T.accent'],
  [/color: '#F97316'/g, 'color: T.accent'],
  [/color: '#C2410C'/g, 'color: T.accent'],
  [/color: '#9A3412'/g, 'color: T.accent'],
  [/color: '#431407'/g, 'color: T.accent'],
  [/color: '#FFF'/g, 'color: T.accentFillText'],
  [/color: '#FFFFFF'/g, 'color: T.accentFillText'],
  [/color: '#EF4444'/g, 'color: T.danger'],
  [/color: '#DC2626'/g, 'color: T.danger'],
  [/color: '#B91C1C'/g, 'color: T.danger'],
  [/color: '#059669'/g, 'color: T.success'],
  [/color: '#10B981'/g, 'color: T.success'],
  [/color: '#16A34A'/g, 'color: T.success'],
  [/color: '#15803D'/g, 'color: T.success'],
  [/color: '#047857'/g, 'color: T.success'],
  [/color: '#065F46'/g, 'color: T.success'],
  [/color: '#D97706'/g, 'color: T.warning'],
  [/color: '#B45309'/g, 'color: T.warning'],
  [/color: '#F59E0B'/g, 'color: T.warning'],
  [/color: '#92400E'/g, 'color: T.warning'],
  [/color: '#78350F'/g, 'color: T.warning'],
  [/color: '#2563EB'/g, 'color: T.info'],
  [/color: '#1D4ED8'/g, 'color: T.info'],
  [/color: '#3B82F6'/g, 'color: T.info'],
  [/color: '#1E40AF'/g, 'color: T.info'],
  [/color: '#7C3AED'/g, 'color: T.special'],
  [/color: '#8B5CF6'/g, 'color: T.special'],
  [/color: '#6D28D9'/g, 'color: T.special'],
  [/color: '#A855F7'/g, 'color: T.special'],
  [/color: '#C026D3'/g, 'color: T.special'],
];

const JSX_ATTR = [
  [/color="#EA580C"/g, 'color={T.accent}'],
  [/color="#F97316"/g, 'color={T.accent}'],
  [/color="#C2410C"/g, 'color={T.accent}'],
  [/color="#475569"/g, 'color={T.textSecondary}'],
  [/color="#64748B"/g, 'color={T.textMuted}'],
  [/color="#94A3B8"/g, 'color={T.textMuted}'],
  [/color="#0F172A"/g, 'color={T.text}'],
  [/color="#1E293B"/g, 'color={T.text}'],
  [/color="#FFF"/g, 'color={T.accentFillText}'],
  [/color="#FFFFFF"/g, 'color={T.accentFillText}'],
  [/color="#EF4444"/g, 'color={T.danger}'],
  [/color="#DC2626"/g, 'color={T.danger}'],
  [/color="#059669"/g, 'color={T.success}'],
  [/color="#10B981"/g, 'color={T.success}'],
  [/color="#16A34A"/g, 'color={T.success}'],
  [/color="#2563EB"/g, 'color={T.info}'],
  [/color="#7C3AED"/g, 'color={T.special}'],
  [/color="#8B5CF6"/g, 'color={T.special}'],
  [/color="#D97706"/g, 'color={T.warning}'],
  [/color="#F59E0B"/g, 'color={T.warning}'],
  [/placeholderTextColor="#94A3B8"/g, 'placeholderTextColor={T.placeholder}'],
  [/placeholderTextColor="#64748B"/g, 'placeholderTextColor={T.placeholder}'],
];

const file = process.argv[2];
const mode = process.argv[3] || 'hook'; // 'hook' = component calls useTheme; 'props' = colors/isDarkMode are props

let src = fs.readFileSync(file, 'utf8');

// 1) convert static sheet to factory
const before = src;
src = src.replace('const styles = StyleSheet.create({', 'const createStyles = (T: any) => StyleSheet.create({');
if (src === before) {
  console.log('SKIP (no static styles found):', file);
  process.exit(0);
}

// 2) property + JSX replacements
for (const [re, rep] of PROP.concat(JSX_ATTR)) src = src.replace(re, rep);

// 3) imports + hook wiring
if (!src.includes('getAiTheme')) {
  src = src.replace(
    "import { Ionicons } from '@expo/vector-icons';",
    "import { Ionicons } from '@expo/vector-icons';\nimport useTheme from '@/hooks/useTheme';\nimport { getAiTheme } from '@/utils/aiGoalTheme';"
  );
  const hookLine =
    mode === 'hook'
      ? "  const { colors, isDarkMode } = useTheme();\n  const T = getAiTheme(colors, isDarkMode);\n  const styles = createStyles(T);\n"
      : "  const T = getAiTheme(colors, isDarkMode);\n  const styles = createStyles(T);\n";
  // insert after the component's opening `}) => {` line (CRLF-safe)
  const re = /\r?\n\}\) => \{\r?\n/;
  const m = re.exec(src);
  if (!m) { console.log('NEEDS MANUAL WIRING:', file); process.exit(1); }
  const idx = m.index;
  const ins = src.includes('\r\n') ? hookLine.replace(/\n/g, '\r\n') : hookLine;
  src = src.slice(0, idx + m[0].length) + ins + src.slice(idx + m[0].length);
}

fs.writeFileSync(file, src);

// 4) residual hex report
const lines = src.split('\n');
const residual = [];
lines.forEach((l, i) => {
  const m = l.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}(?![0-9A-Fa-f])/g);
  if (m) residual.push(`${i + 1}: ${l.trim().slice(0, 110)}`);
});
console.log(`OK ${file}\n-- residuals --\n${residual.join('\n')}`);
