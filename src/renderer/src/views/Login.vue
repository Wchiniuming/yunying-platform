<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">黄</div>
        <h1 class="login-title">黄小帅麻辣鸡</h1>
        <p class="login-subtitle">订单管理系统</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
            class="form-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            class="form-input"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button btn-primary"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>默认账号: admin / 密码: admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import api from '@/api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const result = await api.auth.login(form.username, form.password)
      if (result.code === 200) {
        localStorage.setItem('token', 'logged-in')
        localStorage.setItem('username', result.data.username)
        router.push('/')
      } else {
        ElMessage.error(result.message || '登录失败')
      }
    } catch (error) {
      ElMessage.error('登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at top, rgba(232, 93, 4, 0.08) 0%, transparent 50%),
              var(--bg);
  padding: 20px;
  transition: background var(--transition-base) var(--ease-smooth);
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 48px 36px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  transition: background var(--transition-base) var(--ease-smooth),
              border-color var(--transition-base) var(--ease-smooth),
              box-shadow var(--transition-base) var(--ease-smooth);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 28px;
  margin: 0 auto 20px;
  box-shadow: 0 8px 24px -4px rgba(232, 93, 4, 0.35);
  transition: box-shadow var(--transition-base) var(--ease-smooth);
}

.login-header:hover .logo-icon {
  box-shadow: 0 12px 32px -4px rgba(232, 93, 4, 0.45);
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
  letter-spacing: 1px;
  transition: color var(--transition-base) var(--ease-smooth);
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  letter-spacing: 2px;
  transition: color var(--transition-base) var(--ease-smooth);
}

.login-form {
  margin-top: 28px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 1px var(--border);
  background: var(--surface);
  transition: box-shadow var(--transition-fast) var(--ease-smooth),
              background var(--transition-base) var(--ease-smooth);
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: var(--shadow-glow);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: var(--shadow-glow);
  background: var(--surface);
}

.login-form :deep(.el-input__inner) {
  color: var(--text);
  font-size: 15px;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--text-muted);
}

.login-form :deep(.el-input__prefix .el-icon) {
  color: var(--text-muted);
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  box-shadow: 0 4px 16px -4px rgba(232, 93, 4, 0.4);
  transition: transform var(--transition-fast) var(--ease-spring),
              box-shadow var(--transition-fast) var(--ease-smooth);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -4px rgba(232, 93, 4, 0.5);
}

.login-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px -2px rgba(232, 93, 4, 0.4);
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.login-footer p {
  font-size: 12px;
  color: var(--text-muted);
  transition: color var(--transition-base) var(--ease-smooth);
}

[data-theme="dark"] .login-container {
  background: radial-gradient(ellipse at top, rgba(232, 93, 4, 0.06) 0%, transparent 50%),
              var(--bg);
}

[data-theme="dark"] .login-card {
  background: var(--surface);
  border-color: var(--border);
}

[data-theme="dark"] .login-form :deep(.el-input__wrapper) {
  background: var(--surface-2);
}
</style>
