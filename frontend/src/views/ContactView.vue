<template>
  <div class="contact-page">
    <Navbar />
    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="title">Contact</h1>
      </header>

      <form class="contact-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Name*</label>
          <div class="name-fields">
            <div class="field-wrapper">
              <input v-model="form.firstName" type="text" class="form-input" required />
              <span class="field-caption">First Name</span>
            </div>
            <div class="field-wrapper">
              <input v-model="form.lastName" type="text" class="form-input" required />
              <span class="field-caption">Last Name</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Company</label>
          <div class="field-wrapper">
            <input v-model="form.company" type="text" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email*</label>
          <div class="field-wrapper">
            <input v-model="form.email" type="email" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Subject*</label>
          <div class="field-wrapper">
            <input v-model="form.subject" type="text" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Message*</label>
          <div class="field-wrapper">
            <textarea v-model="form.message" class="form-textarea" rows="6" required></textarea>
          </div>
        </div>

        <div class="form-group">
          <span class="form-label"></span>
          <div class="field-wrapper">
            <!-- 明確 render 而不是用 class="cf-turnstile" 讓 api.js 自動掃描：
                 需要拿到 widgetId 才能在送出失敗後 reset，token 是一次性的，
                 不 reset 的話使用者修正錯誤後按第二次送出一定會被拒絕。 -->
            <div ref="turnstileEl"></div>
          </div>
        </div>

        <div class="form-group">
          <span class="form-label"></span>
          <div class="field-wrapper submit-row">
            <button type="submit" class="submit-button" :disabled="isSubmitting">
              {{ isSubmitting ? 'Sending…' : 'Submit' }}
            </button>
            <p v-if="resultMessage" :class="['result-message', resultOk ? 'ok' : 'error']">
              {{ resultMessage }}
            </p>
          </div>
        </div>
      </form>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import { submitContact } from '../api/contact';

// 建立 Turnstile widget 時登記的網域見 frontend/PLAN.md §7；本機開發打
// localhost/127.0.0.1 都在允許清單內，換一台機器或換 port 要記得那邊也要改。
const TURNSTILE_SITE_KEY = '0x4AAAAAAEI6IIi0G4_7qf21';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

const form = reactive({
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  subject: '',
  message: ''
});

const turnstileEl = ref(null);
const turnstileToken = ref('');
const isSubmitting = ref(false);
const resultMessage = ref('');
const resultOk = ref(false);

let widgetId = null;

/**
 * 動態載入 api.js 而不是寫在 index.html：Turnstile 只有這一頁用得到，
 * 其他頁面沒理由多下載一支腳本、多開一條到 challenges.cloudflare.com 的連線。
 * 用同一個 <script> id 判斷是否已載入，避免使用者在 SPA 內離開又切回這頁時重複注入。
 */
function loadTurnstileScript() {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const existing = document.getElementById('cf-turnstile-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Turnstile 載入失敗')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'cf-turnstile-script';
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Turnstile 載入失敗')));
    document.head.appendChild(script);
  });
}

function renderTurnstile() {
  if (!turnstileEl.value || !window.turnstile) return;
  widgetId = window.turnstile.render(turnstileEl.value, {
    sitekey: TURNSTILE_SITE_KEY,
    callback: (token) => {
      turnstileToken.value = token;
    },
    // token 逾時或使用者被要求重新驗證時清空，讓送出鈕的檢查能攔住過期的 token，
    // 而不是把一個已經失效的字串送到後端才被拒絕。
    'expired-callback': () => {
      turnstileToken.value = '';
    },
    'error-callback': () => {
      turnstileToken.value = '';
    }
  });
}

onMounted(async () => {
  try {
    await loadTurnstileScript();
    renderTurnstile();
  } catch (err) {
    console.error(err);
  }
});

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId);
  }
});

function clearForm() {
  form.firstName = '';
  form.lastName = '';
  form.company = '';
  form.email = '';
  form.subject = '';
  form.message = '';
}

async function handleSubmit() {
  if (!turnstileToken.value) {
    resultOk.value = false;
    resultMessage.value = '請完成上方的人機驗證';
    return;
  }

  isSubmitting.value = true;
  resultMessage.value = '';

  try {
    await submitContact({
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company || null,
      email: form.email,
      subject: form.subject,
      message: form.message,
      turnstileToken: turnstileToken.value
    });
    resultOk.value = true;
    resultMessage.value = '訊息已送出，謝謝聯絡！';
    clearForm();
  } catch (err) {
    // 失敗時刻意不清空表單：使用者不用把剛打的內容重打一次
    resultOk.value = false;
    resultMessage.value = err.message;
  } finally {
    // Turnstile token 是一次性的，不管成功或失敗都要 reset，
    // 否則使用者修正錯誤後按第二次送出，siteverify 一定會拒絕同一個 token。
    turnstileToken.value = '';
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
    }
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: var(--header-height, 80px);
  background-color: #ffffff;
}

.content-wrapper {
  flex: 1;
  max-width: 60%;
  margin: 0 auto;
  padding: 3rem 2rem;
  color: #000;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .content-wrapper {
    max-width: 85%;
  }
}

@media (max-width: 640px) {
  .content-wrapper {
    max-width: 100%;
  }
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 700px;
  margin: 4rem auto 0;
}

.form-group {
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: start;
  gap: 1rem;
}

.form-label {
  padding-top: 0.7rem;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
}

.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.name-fields {
  display: flex;
  gap: 1.5rem;
}

.name-fields .field-wrapper {
  flex: 1;
}

.field-caption {
  font-size: 12px;
  font-style: italic;
  color: #9ca3af;
}

.form-input,
.form-textarea {
  width: 100%;
  background-color: #e5e7eb;
  border: none;
  border-radius: 2px;
  padding: 0.75rem 1rem;
  font-size: 14px;
  font-family: inherit;
  color: #000000;
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
  min-height: 140px;
}

.form-input:focus,
.form-textarea:focus {
  outline: 2px solid #9ca3af;
  outline-offset: -2px;
}

.submit-button {
  align-self: flex-start;
  margin-left: 110px;
  padding: 0.9rem 2.5rem;
  background-color: #2d2d2d;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.submit-button:hover {
  background-color: #000000;
}

.submit-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.submit-row {
  flex-direction: row;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.result-message {
  margin: 0;
  font-size: 14px;
}

.result-message.ok {
  color: #15803d;
}

.result-message.error {
  color: #c33;
}

@media (max-width: 640px) {
  .form-group {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .name-fields {
    flex-direction: column;
    gap: 1rem;
  }

  .submit-button {
    margin-left: 0;
  }
}
</style>
