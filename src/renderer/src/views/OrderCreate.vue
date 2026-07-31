<template>
  <div class="order-create-page">
    <div class="detail-topbar">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>返回</span>
      </button>
    </div>

    <div class="detail-hero" v-if="form.items.length">
      <div class="hero-meta">
        <div class="hero-label">订单总额</div>
        <div class="hero-value hero-amount">¥{{ totalAmount.toFixed(2) }}</div>
      </div>
      <div class="hero-divider"></div>
      <div class="hero-meta">
        <div class="hero-label">商品件数</div>
        <div class="hero-value">{{ totalQty }} 件</div>
      </div>
      <div class="hero-divider"></div>
      <div class="hero-meta">
        <div class="hero-label">配送方式</div>
        <div class="hero-value">
          <span class="delivery-tag" :class="form.delivery_method === 'self' ? 'delivery-tag-self' : 'delivery-tag-sf'">
            {{ form.delivery_method === 'self' ? '自送' : '顺丰' }}
          </span>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-main">
        <section class="info-card">
          <header class="info-card-header">
            <div class="header-icon" data-color="primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h2>订单信息</h2>
          </header>

          <div class="info-grid">
            <div class="info-item full-width">
              <span class="info-label">顾客</span>
              <el-select
                v-model="form.customer_id"
                filterable
                remote
                reserve-keyword
                placeholder="搜索或选择顾客"
                :remote-method="searchCustomers"
                :loading="customerLoading"
                @change="handleCustomerChange"
                style="width: 100%"
                size="default"
              >
                <el-option
                  v-for="c in customers"
                  :key="c.id"
                  :label="c.wechat_nickname"
                  :value="c.id"
                >
                  <div class="customer-option">
                    <span>{{ c.wechat_nickname }}</span>
                    <span class="customer-phone">{{ c.phone }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>

            <div class="info-item">
              <span class="info-label">配送方式</span>
              <div class="tab-bar">
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.delivery_method === 'self' }"
                  @click="form.delivery_method = 'self'; handleDeliveryChange()"
                >自送</button>
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.delivery_method === 'sf' }"
                  @click="form.delivery_method = 'sf'; handleDeliveryChange()"
                >顺丰</button>
              </div>
            </div>

            <div class="info-item" v-if="form.delivery_method === 'sf'">
              <span class="info-label">顺丰单号</span>
              <input
                v-model="form.sf_tracking_no"
                class="form-input"
                placeholder="填写顺丰运单号"
              />
            </div>

            <div class="info-item full-width">
              <span class="info-label">送餐地址</span>
              <textarea
                v-model="form.address"
                class="form-input form-textarea"
                rows="2"
                placeholder="详细地址"
              ></textarea>
            </div>

            <div class="info-item full-width">
              <span class="info-label">备注</span>
              <textarea
                v-model="form.remark"
                class="form-input form-textarea"
                rows="2"
                placeholder="特殊要求备注"
              ></textarea>
            </div>
          </div>
        </section>

        <section class="info-card">
          <header class="info-card-header">
            <div class="header-icon" data-color="accent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h2>商品明细</h2>
            <span class="header-meta" v-if="form.items.length">{{ form.items.length }} 项</span>
          </header>

          <div class="items-editor" v-if="products.length">
            <div class="items-header">
              <div class="col-index">序号</div>
              <div class="col-name">商品</div>
              <div class="col-qty">数量</div>
              <div class="col-price">单价</div>
              <div class="col-subtotal">小计</div>
              <div class="col-action"></div>
            </div>
            <div v-for="(item, index) in form.items" :key="index" class="item-edit-row">
              <div class="col-index">
                <div class="row-index">{{ index + 1 }}</div>
              </div>
              <div class="col-name">
                <el-select
                  v-model="item.product_id"
                  placeholder="选择商品"
                  size="default"
                  style="width: 100%"
                  @change="(val) => handleProductChange(index, val)"
                  filterable
                >
                  <el-option
                    v-for="p in products"
                    :key="p.id"
                    :label="`${p.name} ¥${Number(p.price).toFixed(2)}/${p.unit || '斤'}`"
                    :value="p.id"
                    :disabled="p.status !== 'available'"
                  >
                    <div class="product-option">
                      <span class="product-option-name">{{ p.name }}</span>
                      <span class="product-option-price">¥{{ Number(p.price).toFixed(2) }}/{{ p.unit || '斤' }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>
              <div class="col-qty">
                <div class="qty-control">
                  <button type="button" class="qty-btn" @click="decrementQty(index)" :disabled="item.qty <= 1">−</button>
                  <input
                    v-model.number="item.qty"
                    class="qty-input"
                    type="number"
                    min="1"
                    @input="clampQty(index)"
                  />
                  <button type="button" class="qty-btn" @click="incrementQty(index)">+</button>
                </div>
              </div>
              <div class="col-price">
                <span class="price-value">¥{{ Number(item.price || 0).toFixed(2) }}</span>
              </div>
              <div class="col-subtotal">
                <span class="subtotal-value">¥{{ ((item.qty || 0) * (item.price || 0)).toFixed(2) }}</span>
              </div>
              <div class="col-action">
                <button
                  type="button"
                  class="row-remove"
                  @click="removeItem(index)"
                  :disabled="form.items.length === 1"
                  title="删除商品"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>
            </div>

            <button class="add-item-btn" type="button" @click="addItem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="add-icon">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>添加商品</span>
            </button>

            <div class="items-summary">
              <div class="summary-line">
                <span class="summary-label">商品小计</span>
                <span class="summary-value">¥{{ totalAmount.toFixed(2) }}</span>
              </div>
              <div class="summary-line summary-total">
                <span class="summary-label">合计</span>
                <span class="summary-value summary-amount">¥{{ totalAmount.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <p>暂无可售商品，请先在"商品管理"中添加菜单</p>
          </div>
        </section>
      </div>

      <aside class="detail-side">
        <section class="info-card">
          <header class="info-card-header">
            <div class="header-icon" data-color="success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <h2>支付与结算</h2>
          </header>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">支付方式</span>
              <div class="tab-bar">
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.payment_method === 'wechat' }"
                  @click="form.payment_method = 'wechat'"
                >微信</button>
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.payment_method === 'alipay' }"
                  @click="form.payment_method = 'alipay'"
                >支付宝</button>
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.payment_method === 'cash' }"
                  @click="form.payment_method = 'cash'"
                >现金</button>
              </div>
            </div>

            <div class="info-item">
              <span class="info-label">支付状态</span>
              <div class="tab-bar">
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.payment_status === 'paid' }"
                  @click="form.payment_status = 'paid'"
                >已支付</button>
                <button
                  type="button"
                  class="tab-item"
                  :class="{ active: form.payment_status === 'unpaid' }"
                  @click="form.payment_status = 'unpaid'"
                >未支付</button>
              </div>
            </div>
          </div>

          <div class="summary-block">
            <div class="summary-line">
              <span class="summary-label">商品件数</span>
              <span class="summary-value">{{ totalQty }} 件</span>
            </div>
            <div class="summary-line summary-total">
              <span class="summary-label">订单总额</span>
              <span class="summary-value summary-amount">¥{{ totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </section>

        <div class="action-buttons">
          <button class="btn btn-primary btn-lg action-btn" @click="handleSubmit" :disabled="submitting">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{{ submitting ? '提交中...' : '提交订单' }}</span>
          </button>
          <button class="btn btn-secondary action-btn" @click="$router.back()">取消</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()
const submitting = ref(false)
const customerLoading = ref(false)
const customers = ref([])
const products = ref([])

const form = reactive({
  customer_id: null,
  delivery_method: 'self',
  address: '',
  sf_tracking_no: '',
  remark: '',
  payment_method: 'wechat',
  payment_status: 'paid',
  items: [{ product_id: null, name: '', qty: 1, price: 0, unit: '斤' }]
})

const totalQty = computed(() => {
  return form.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
})

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => {
    return sum + (Number(item.qty) || 0) * (Number(item.price) || 0)
  }, 0)
})

const searchCustomers = async (keyword) => {
  if (!keyword) {
    customers.value = []
    return
  }
  customerLoading.value = true
  try {
    const result = await api.customer.search(keyword)
    if (result.code === 200) {
      customers.value = result.data || []
    }
  } catch (error) {
    console.error('搜索顾客失败:', error)
  } finally {
    customerLoading.value = false
  }
}

const handleCustomerChange = (customerId) => {
  const customer = customers.value.find(c => c.id === customerId)
  if (customer && customer.address) {
    form.address = customer.address
  }
}

const handleDeliveryChange = () => {
  form.sf_tracking_no = ''
}

const loadProducts = async () => {
  try {
    const result = await api.product.list({ status: 'available' })
    if (result.code === 200) {
      products.value = result.data || []
    }
  } catch (error) {
    console.error('加载商品失败:', error)
    ElMessage.error('加载商品菜单失败')
  }
}

const handleProductChange = (index, productId) => {
  const product = products.value.find(p => p.id === productId)
  const item = form.items[index]
  if (product) {
    item.name = product.name
    item.price = Number(product.price) || 0
    item.unit = product.unit || '斤'
  }
}

const incrementQty = (index) => {
  form.items[index].qty = (Number(form.items[index].qty) || 1) + 1
}

const decrementQty = (index) => {
  if (form.items[index].qty > 1) {
    form.items[index].qty -= 1
  }
}

const clampQty = (index) => {
  const v = Number(form.items[index].qty)
  if (!v || v < 1) form.items[index].qty = 1
}

const addItem = () => {
  form.items.push({ product_id: null, name: '', qty: 1, price: 0, unit: '斤' })
}

const removeItem = (index) => {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
  }
}

const handleSubmit = async () => {
  if (!form.customer_id) {
    ElMessage.warning('请选择顾客')
    return
  }
  if (!form.address.trim()) {
    ElMessage.warning('请填写送餐地址')
    return
  }

  const validItems = form.items.filter(item => item.product_id && item.price > 0)
  if (validItems.length === 0) {
    ElMessage.warning('请至少添加一个有效商品')
    return
  }

  submitting.value = true
  try {
    const submitData = {
      ...form,
      items: validItems.map(item => ({
        name: item.name,
        qty: Number(item.qty),
        price: Number(item.price),
        unit: item.unit
      })),
      order_total: totalAmount.value
    }

    const result = await api.order.create(submitData)
    if (result.code === 200) {
      ElMessage.success('订单创建成功')
      router.push('/orders')
    } else {
      ElMessage.error(result.message || '创建失败')
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    ElMessage.error('创建失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.order-create-page {
  width: 100%;
}

.detail-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-smooth);
  font-family: var(--font);
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.back-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(232, 93, 4, 0.04);
  transform: translateX(-2px);
}

.detail-hero {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 20px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.hero-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.hero-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.hero-value.hero-amount {
  font-size: 24px;
  color: var(--primary);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.hero-divider {
  width: 1px;
  height: 32px;
  background: var(--border);
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  align-items: start;
}

.detail-main,
.detail-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.info-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
}

.info-card-header h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  flex: 1;
}

.header-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon svg {
  width: 16px;
  height: 16px;
}

.header-icon[data-color="primary"] { background: rgba(232, 93, 4, 0.1); color: var(--primary); }
.header-icon[data-color="accent"] { background: rgba(250, 163, 7, 0.12); color: var(--accent); }
.header-icon[data-color="success"] { background: rgba(45, 106, 79, 0.12); color: var(--success); }
.header-icon[data-color="warning"] { background: rgba(214, 40, 40, 0.1); color: var(--warning); }
.header-icon[data-color="info"] { background: rgba(69, 123, 157, 0.12); color: #457B9D; }

.header-meta {
  font-size: 12px;
  color: var(--text-muted);
  padding: 3px 8px;
  background: var(--surface-2);
  border-radius: var(--radius-xs);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.delivery-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
}

.delivery-tag-self { background: var(--success-bg); color: var(--success-text); }
.delivery-tag-sf { background: var(--info-bg); color: var(--info-text); }

/* ===== Items Editor ===== */
.items-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.items-header,
.item-edit-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 130px 100px 110px 40px;
  gap: 12px;
  align-items: center;
}

.items-header {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.col-action {
  text-align: right;
}

.item-edit-row {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-light);
}

.items-editor .item-edit-row:last-of-type {
  border-bottom: none;
}

.row-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.product-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.product-option-name {
  font-size: 13px;
  color: var(--text);
}

.product-option-price {
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
  font-family: 'SF Mono', 'Consolas', monospace;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px;
  background: var(--surface);
}

.qty-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  border: none;
  background: var(--surface-2);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.qty-btn:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
}

.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-input {
  width: 50px;
  border: none;
  outline: none;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  background: transparent;
  font-family: var(--font);
  -moz-appearance: textfield;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.price-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Consolas', monospace;
}

.subtotal-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  font-family: 'SF Mono', 'Consolas', monospace;
}

.row-remove {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  margin-left: auto;
}

.row-remove svg {
  width: 14px;
  height: 14px;
}

.row-remove:hover:not(:disabled) {
  background: rgba(214, 40, 40, 0.1);
  color: var(--warning);
}

.row-remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-item-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  margin-top: 8px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-smooth);
  align-self: flex-start;
  font-family: var(--font);
}

.add-icon {
  width: 14px;
  height: 14px;
}

.add-item-btn:hover {
  border-color: var(--primary);
  border-style: solid;
  color: var(--primary);
  background: rgba(232, 93, 4, 0.04);
}

.items-summary {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.summary-label {
  color: var(--text-secondary);
}

.summary-value {
  color: var(--text);
  font-weight: 500;
}

.summary-line.summary-total {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.summary-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--text-muted);
  gap: 12px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.4;
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
  justify-content: center;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

@media (max-width: 1100px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-hero {
    flex-wrap: wrap;
    gap: 16px 24px;
  }

  .hero-divider {
    display: none;
  }
}
</style>