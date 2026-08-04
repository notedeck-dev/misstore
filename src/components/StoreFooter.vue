<template>
  <footer class="store-footer">
    <div class="footer-line">
      <span class="footer-mark">mis<span>store</span></span>
      <span class="footer-say">
        NoteDeck / Misskey の拡張ストア。カタログは静的 JSON なので、他のクライアントからも読めます。
      </span>
      <nav class="footer-links" aria-label="関連リンク">
        <a href="https://notedeck.io" target="_blank" rel="noopener">NoteDeck</a>
        <a href="https://github.com/notedeck-dev/misstore" target="_blank" rel="noopener">GitHub</a>
        <a href="/registry/index.json">Registry API</a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.store-footer {
  border-top: 1px solid var(--border);
  margin-top: var(--space-2xl);
}

.footer-line {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-lg);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs) var(--space-md);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.footer-mark {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--text);
  white-space: nowrap;
}

.footer-mark span { color: var(--accent-text); }

.footer-say {
  flex: 1;
  min-width: 18ch;
  line-height: 1.6;
}

.footer-links {
  display: flex;
  gap: var(--space-md);
  flex-shrink: 0;
}

.footer-links a {
  color: var(--text-sub);
  text-decoration: none;
  white-space: nowrap;
  border-bottom: 1px solid transparent;
  transition: color var(--duration-base) var(--ease-out),
              border-color var(--duration-base) var(--ease-out);
}

.footer-links a:hover {
  color: var(--accent-text);
  border-bottom-color: var(--accent);
}

@media (max-width: 800px) {
  .footer-line { padding: var(--space-md); }
}
</style>
