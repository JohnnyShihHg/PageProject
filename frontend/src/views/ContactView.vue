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

        <button type="submit" class="submit-button">Submit</button>
      </form>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';

const form = reactive({
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  subject: '',
  message: ''
});

function handleSubmit() {
  console.log('contact form submit (not wired up yet)', { ...form });
}

onMounted(() => {
  window.scrollTo(0, 0);
});
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
