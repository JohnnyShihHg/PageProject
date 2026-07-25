<template>
  <div class="home-container">
    <!-- Premium Header/Navbar -->
    <header class="navbar">
      <div class="nav-brand">
        <span class="logo-dot"></span>
        <span class="logo-text">NEXUS</span>
      </div>
      <nav class="nav-links">
        <a href="#features" class="nav-link">特點</a>
        <a href="#about" class="nav-link">關於我們</a>
        <a href="#contact" class="nav-link">聯絡我們</a>
      </nav>
      <div class="nav-action">
        <button class="btn btn-outline">登入</button>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg-overlay"></div>
      
      <div class="hero-content">
        <div class="badge">
          <span class="badge-dot"></span>
          <span>探索未來的全新體驗</span>
        </div>
        
        <h1 class="hero-title">
          用極致設計與科技<br>
          <span class="gradient-text">重塑您的數位視界</span>
        </h1>
        
        <p class="hero-subtitle">
          我們結合美學與頂尖技術，為您打造極具現代感、流暢且具高互動性的網頁體驗。在這裡，您的每個創意都將轉化為無限可能。
        </p>
        
        <div class="hero-cta">
          <button class="btn btn-primary" @click="exploreMore">
            探索更多
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="arrow-icon"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
          <button class="btn btn-secondary">
            聯絡我們
          </button>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="scroll-indicator" @click="scrollToFeatures">
        <span class="mouse">
          <span class="wheel"></span>
        </span>
        <span class="scroll-text">向下捲動</span>
      </div>
    </section>

    <!-- Additional section to show layout capability -->
    <section id="features" class="features-section">
      <div class="section-header">
        <h2 class="section-title">我們的核心優勢</h2>
        <p class="section-desc">透過三大核心支柱，我們為您開拓更廣闊的商業前景</p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          </div>
          <h3>響應式設計 (RWD)</h3>
          <p>完美適應所有裝置，無論是手機、平板還是桌面，都能提供極佳的視覺與操作體驗。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          </div>
          <h3>流暢微互動</h3>
          <p>匠心獨具的細節設計與動態反饋，使每次點擊與瀏覽都充滿令人愉悅的生命力。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
          </div>
          <h3>極致加載效能</h3>
          <p>現代化代碼架構優化，極速載入，無縫呈現，讓您的訪客告別等待。</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>&copy; 2026 NEXUS. 版權所有。打造數位極致體驗的最佳夥伴。</p>
    </footer>
  </div>
</template>

<script setup>
const exploreMore = () => {
  alert('歡迎進入 NEXUS！即將為您開啟探索之旅。');
};

const scrollToFeatures = () => {
  const element = document.getElementById('features');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #0f172a;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 4rem;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-sizing: border-box;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-dot {
  width: 10px;
  height: 10px;
  background-color: #6366f1;
  border-radius: 50%;
  box-shadow: 0 0 12px #6366f1;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: #ffffff;
}

.nav-links {
  display: flex;
  gap: 2.5rem;
}

.nav-link {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #ffffff;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-outline {
  background: transparent;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #ffffff;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.6);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 2rem;
  box-sizing: border-box;
  background-image: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

.hero-bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, #0f172a 100%);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 850px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 2rem;
  animation: pulse 2s infinite;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background-color: #818cf8;
  border-radius: 50%;
}

.hero-title {
  font-size: 3.75rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -1px;
  color: #ffffff;
  margin-bottom: 1.5rem;
}

.gradient-text {
  background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
  max-width: 650px;
  line-height: 1.6;
  margin-bottom: 2.5rem;
}

.hero-cta {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.btn-primary:hover .arrow-icon {
  transform: translateX(4px);
}

/* Scroll Indicator */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.scroll-indicator:hover {
  opacity: 1;
}

.mouse {
  width: 24px;
  height: 38px;
  border: 2px solid #94a3b8;
  border-radius: 12px;
  position: relative;
  display: block;
}

.wheel {
  width: 4px;
  height: 8px;
  background-color: #6366f1;
  border-radius: 2px;
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  animation: scrollWheel 2s infinite;
}

.scroll-text {
  font-size: 0.75rem;
  color: #94a3b8;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* Features Section */
.features-section {
  padding: 6rem 4rem;
  background-color: #0f172a;
  position: relative;
  z-index: 10;
}

.section-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 4rem auto;
}

.section-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
}

.section-desc {
  font-size: 1.1rem;
  color: #94a3b8;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1.25rem;
  padding: 2.5rem 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-8px);
  background: rgba(30, 41, 59, 0.7);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  width: 50px;
  height: 50px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  background: #6366f1;
  color: #ffffff;
}

.feature-card h3 {
  font-size: 1.25rem;
  color: #ffffff;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.feature-card p {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
}

/* Footer */
.footer {
  padding: 3rem 2rem;
  text-align: center;
  background-color: #0b0f19;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: #64748b;
  font-size: 0.9rem;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
  }
}

@keyframes scrollWheel {
  0% {
    opacity: 0;
    top: 6px;
  }
  30% {
    opacity: 1;
  }
  90% {
    opacity: 0;
    top: 22px;
  }
  100% {
    opacity: 0;
    top: 6px;
  }
}

/* Responsive Design (RWD) */
@media (max-width: 1024px) {
  .navbar {
    padding: 1.25rem 2rem;
  }
  
  .hero-title {
    font-size: 3rem;
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .nav-links {
    display: none; /* Hide nav links on mobile for simplicity, or we could keep it minimal */
  }
  
  .navbar {
    padding: 1rem 1.5rem;
  }
  
  .hero-title {
    font-size: 2.25rem;
  }
  
  .hero-subtitle {
    font-size: 1.05rem;
    margin-bottom: 2rem;
  }
  
  .hero-cta {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
    gap: 0.75rem;
  }
  
  .btn {
    width: 100%;
  }
  
  .features-section {
    padding: 4rem 1.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .feature-card {
    padding: 2rem 1.5rem;
  }
}
</style>
