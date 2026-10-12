<script setup lang="ts">
import { useI18n } from '@/i18n'

const { t } = useI18n()

const REPO = 'https://github.com/notedeck-dev/misstore'

const FOOTER_LINKS = [
  { text: 'NoteDeck', href: 'https://notedeck.io' },
  { text: 'GitHub', href: REPO },
  { text: 'Issues', href: `${REPO}/issues` },
  { text: 'Contributing', href: `${REPO}/blob/main/CONTRIBUTING.md` },
  { text: 'Registry API', href: '/registry/index.json' },
]
</script>

<template>
  <!-- Hub GFooter / NoteDeck HubFooter 相当: 中央寄せのリンク列 + © -->
  <footer class="store-footer">
    <p class="footer-mark">mis<span>store</span></p>
    <p class="footer-say">{{ t.footer.say }}</p>
    <nav class="footer-links" :aria-label="t.footer.links">
      <a v-for="link in FOOTER_LINKS" :key="link.href" :href="link.href" target="_blank" rel="noopener">
        {{ link.text }}
      </a>
    </nav>
    <p class="footer-copyright">© 2026 NoteDeck</p>
  </footer>
</template>

<style scoped>
.store-footer {
  margin-top: var(--space-2xl);
  padding: var(--space-2lg) var(--space-md) var(--space-lg);
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.footer-mark {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--text);
}

.footer-mark span {
  background: var(--accent-grad);
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-say {
  max-width: 60ch;
  margin: var(--space-xs) auto 0;
  line-height: 1.6;
}

.footer-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-lg);
  margin-top: var(--space-md);
}

.footer-links a {
  color: var(--text-sub);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--duration-base) var(--ease-out);
}

.footer-links a:hover { color: var(--accent-text); }

.footer-copyright {
  margin-top: var(--space-md);
  opacity: 0.7;
}

@media (forced-colors: active) {
  .footer-mark span { color: CanvasText; -webkit-text-fill-color: CanvasText; }
}
</style>
