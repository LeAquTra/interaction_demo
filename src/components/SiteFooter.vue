<script setup lang="ts">
import BrandMark from './BrandMark.vue'
import UiIcon from './UiIcon.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer page-surface">
    <div class="container">
      <div class="footer__top">
        <div class="footer__identity">
          <BrandMark :badge="false" />
          <p class="footer__tagline">An instrument for algorithmic systems.</p>
        </div>

        <nav class="footer__nav" aria-label="Footer navigation">
          <a href="#field" class="footer__link">Field</a>
          <a href="#method" class="footer__link">Method</a>
          <a href="#runtime" class="footer__link">Runtime</a>
          <a href="#field" class="footer__link footer__link--top">
            Back to top
            <UiIcon name="arrow-up-right" :size="12" />
          </a>
        </nav>
      </div>

      <div class="footer__bottom">
        <span class="mono footer__meta">© {{ year }} AXIOM FIELD LAB</span>
        <span class="footer__status mono">
          <span class="status-dot" aria-hidden="true"></span>
          All systems nominal
        </span>
        <span class="mono footer__meta footer__meta--right">CANVAS 2D · NO TRACKERS</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: 48px 0 30px;
  border-top: 1px solid var(--color-graphite);
}

.footer__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 40px;
}

.footer__identity {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer__tagline {
  color: var(--color-ash);
  font-size: 12px;
  line-height: 1.5;
}

.footer__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 20px;
}

.footer__link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-fog);
  font-size: 12px;
  line-height: 1.4;
  transition: color 160ms var(--ease-soft);
}

.footer__link:hover {
  color: var(--color-paper);
}

.footer__link--top {
  margin-left: 12px;
}

.footer__bottom {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 56px;
  padding-top: 18px;
  border-top: 1px solid var(--color-graphite);
}

.footer__meta {
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.035em;
}

.footer__meta--right {
  margin-left: auto;
}

.footer__status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-ash);
  font-size: 9px;
  letter-spacing: 0.035em;
}

.footer__status .status-dot {
  width: 4px;
  height: 4px;
  box-shadow: none;
}

@media (max-width: 720px) {
  .footer {
    padding-top: 36px;
  }

  .footer__top {
    flex-direction: column;
    gap: 24px;
  }

  .footer__nav {
    gap: 12px 16px;
  }

  .footer__link--top {
    margin-left: 0;
  }

  .footer__bottom {
    flex-wrap: wrap;
    gap: 10px 16px;
    margin-top: 36px;
  }

  .footer__meta--right {
    width: 100%;
    margin-left: 0;
  }
}
</style>
