<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-contact">
        <p>ZHENDOKU | 石佳弘</p>
        <p>PHONE：+886 0986056305</p>
        <div class="footer-socials">
          <span>LINE：shallreturn</span>
          <span>INSTAGRAM：<a class="social-link" href="https://www.instagram.com/j_zh_fc/" target="_blank" rel="noopener noreferrer">j_zh_fc</a></span>
          <span>THREADS：<a class="social-link" href="https://www.threads.com/@j_zh_fc" target="_blank" rel="noopener noreferrer">j_zh_fc</a></span>
        </div>
      </div>
      <p class="footer-copyright">&copy; 2026 ZHENDOKU. 版權所有。</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  width: 100%;
  padding: 2rem;
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
  box-sizing: border-box;
}

.footer-content {
  max-width: 60%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .footer-content {
    max-width: 85%;
  }
}

@media (max-width: 640px) {
  .footer-content {
    max-width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

.footer-contact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #000000;
  font-size: 16px;
  text-align: left;
  margin-bottom: 18px;
}

.footer-contact p {
  margin: 0;
}

.footer-socials {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.social-link,
.social-link:link,
.social-link:visited,
.social-link:hover,
.social-link:active {
  color: #000000;
  text-decoration: none;
}

.footer-copyright {
  align-self: flex-end;
  margin: 0;
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}
</style>
