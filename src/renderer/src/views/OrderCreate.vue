<template>
  <div class="page">
    <!-- 顶栏 -->
    <header class="topbar">
      <div class="topbar__left">
        <button class="btn btn--ghost" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn__icon">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          返回
        </button>
      </div>
      <div class="topbar__right">
        <div class="meta">
          <span class="meta__label">商品</span>
          <span class="meta__value">{{ totalQty }} 件</span>
        </div>
        <div class="meta meta--primary">
          <span class="meta__label">订单总额</span>
          <span class="meta__value meta__value--lg">¥{{ totalAmount.toFixed(2) }}</span>
        </div>
      </div>
    </header>

    <!-- 主表单卡 -->
    <section class="card">
      <!-- 顾客 + 电话 -->
      <div class="field-row">
        <div class="field field--md">
          <label class="field__label">顾客 <span class="req">*</span></label>
          <div class="customer-input-row">
            <button
              type="button"
              class="customer-switch-btn"
              :title="isNewCustomer ? '改为选择顾客' : '改为新顾客'"
              @click="isNewCustomer ? switchToExistingCustomer() : switchToNewCustomer()"
            >
              <svg v-if="isNewCustomer" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="switch-icon"><polyline points="15 18 9 12 15 6"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="switch-icon"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <div class="customer-input-main">
              <el-select
                v-if="!isNewCustomer"
                v-model="form.customer_id"
                filterable
                remote
                reserve-keyword
                placeholder="搜索顾客"
                :remote-method="searchCustomers"
                :loading="customerLoading"
                @change="handleCustomerChange"
                class="customer-select"
              >
                <el-option
                  v-for="c in customers"
                  :key="c.id"
                  :label="c.wechat_nickname"
                  :value="c.id"
                >
                  <div class="select-row">
                    <span>{{ c.wechat_nickname }}</span>
                    <span class="select-row__sub">{{ c.phone || '无手机' }}</span>
                  </div>
                </el-option>
              </el-select>
              <input
                v-else
                v-model="newCustomerNickname"
                class="customer-input"
                placeholder="输入新顾客昵称"
              />
            </div>
          </div>
        </div>

        <div class="field">
          <label class="field__label">电话 <span class="req">*</span></label>
          <input
            v-model="form.phone"
            class="field__control field__control--block"
            :placeholder="isNewCustomer ? '输入手机号' : '自动带出，可修改'"
          />
        </div>
      </div>

      <div class="field-row">
        <div class="field field--lg">
          <label class="field__label">送餐地址 <span class="req">*</span></label>
          <input v-model="form.address" class="field__control" placeholder="街道、楼栋、门牌号" />
        </div>
        <div class="field field--md">
          <label class="field__label">备注</label>
          <input v-model="form.remark" class="field__control" placeholder="忌口 / 送达时间等" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field__label">配送方式</label>
          <div class="seg">
            <button type="button" class="seg__btn" :class="{ 'is-active': form.delivery_method === 'self' }" @click="form.delivery_method = 'self'; handleDeliveryChange()">自送</button>
            <button type="button" class="seg__btn" :class="{ 'is-active': form.delivery_method === 'sf' }" @click="form.delivery_method = 'sf'; handleDeliveryChange()">顺丰</button>
          </div>
        </div>
        <div class="field" v-if="form.delivery_method === 'sf'">
          <label class="field__label">顺丰单号</label>
          <input v-model="form.sf_tracking_no" class="field__control" placeholder="SF1234567890" />
        </div>
        <div class="field field--md">
          <label class="field__label">订单标签</label>
          <div class="delivery-tags">
            <span
              v-for="tag in selectedOrderTags"
              :key="tag.id"
              class="delivery-tag-pill"
              :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }"
            >
              {{ tag.name }}
              <button type="button" class="delivery-tag-remove" @click.stop="removeOrderTag(tag.id)">×</button>
            </span>
            <div class="delivery-tag-add-wrap" v-if="selectedOrderTags.length < 10">
              <button type="button" class="delivery-tag-add-btn" @click.stop="showTagDropdown = !showTagDropdown">+ 标签</button>
              <div v-if="showTagDropdown" class="delivery-tag-dropdown" @click.stop>
                <button
                  v-for="tag in availableOrderTags"
                  :key="tag.id"
                  type="button"
                  class="delivery-tag-option"
                  :style="{ color: tag.color }"
                  @click="addOrderTag(tag)"
                >
                  {{ tag.name }}
                </button>
                <div v-if="availableOrderTags.length === 0" class="delivery-tag-option-empty">无可用标签</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 商品明细 -->
      <div class="section">
        <div class="section__head">
          <h3 class="section__title"><i class="section__bar"></i>商品明细</h3>
          <span class="tag tag--muted">{{ form.items.length }} 项</span>
        </div>

        <div v-if="products.length" class="data-table">
          <div class="data-table__head">
            <div class="cell cell--idx">#</div>
            <div class="cell cell--name">商品</div>
            <div class="cell cell--qty">数量</div>
            <div class="cell cell--num">单价</div>
            <div class="cell cell--num">小计</div>
            <div class="cell cell--act"></div>
          </div>

          <div v-for="(item, index) in form.items" :key="index" class="data-table__row">
            <div class="cell cell--idx">{{ index + 1 }}</div>
            <div class="cell cell--name">
              <el-select
                v-model="item.product_id"
                placeholder="选择商品"
                size="default"
                class="field__control--block"
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
                  <div class="select-row">
                    <span>{{ p.name }}</span>
                    <span class="select-row__sub select-row__sub--price">¥{{ Number(p.price).toFixed(2) }}/{{ p.unit || '斤' }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
            <div class="cell cell--qty">
              <div class="stepper">
                <button type="button" class="stepper__btn" @click="decrementQty(index)" :disabled="item.qty <= 1">−</button>
                <input v-model.number="item.qty" class="stepper__input" type="number" min="1" @input="clampQty(index)" />
                <span class="stepper__unit" v-if="item.unit">{{ item.unit }}</span>
                <button type="button" class="stepper__btn" @click="incrementQty(index)">+</button>
              </div>
            </div>
            <div class="cell cell--num"><span class="num">¥{{ Number(item.price || 0).toFixed(2) }}</span></div>
            <div class="cell cell--num"><span class="num num--strong">¥{{ ((item.qty || 0) * (item.price || 0)).toFixed(2) }}</span></div>
            <div class="cell cell--act">
              <button type="button" class="row-remove" @click="removeItem(index)" :disabled="form.items.length === 1" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button class="add-btn" type="button" @click="addItem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="add-btn__icon">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          添加商品
        </button>

        <div v-if="!products.length" class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty__icon">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p>暂无可售商品，请先在"商品管理"中添加菜单</p>
        </div>
      </div>
    </section>

    <!-- 底部操作栏 -->
    <footer class="bar">
      <div class="bar__left">
        <div class="field field--inline field--prominent">
          <label class="field__label field__label--prominent">支付方式</label>
          <div class="seg seg--prominent">
            <button type="button" class="seg__btn" :class="{ 'is-active': form.payment_method === 'wechat' }" @click="form.payment_method = 'wechat'">微信</button>
            <button type="button" class="seg__btn" :class="{ 'is-active': form.payment_method === 'alipay' }" @click="form.payment_method = 'alipay'">支付宝</button>
            <button type="button" class="seg__btn" :class="{ 'is-active': form.payment_method === 'cash' }" @click="form.payment_method = 'cash'">现金</button>
          </div>
        </div>
        <div class="field field--inline">
          <label class="field__label">支付状态</label>
          <div class="seg">
            <button type="button" class="seg__btn" :class="{ 'is-active': form.payment_status === 'paid' }" @click="form.payment_status = 'paid'">已支付</button>
            <button type="button" class="seg__btn" :class="{ 'is-active': form.payment_status === 'unpaid' }" @click="form.payment_status = 'unpaid'">未支付</button>
          </div>
        </div>
      </div>

      <div class="bar__right">
        <div class="final">
          <span class="final__label">应付</span>
          <span class="final__value">¥{{ totalAmount.toFixed(2) }}</span>
        </div>
        <button class="btn btn--ghost" @click="$router.back()">取消</button>
        <button class="btn btn--primary btn--lg" @click="handleSubmit" :disabled="submitting">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn__icon">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ submitting ? '提交中...' : '提交订单' }}
        </button>
      </div>
    </footer>
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
const isNewCustomer = ref(false)
const newCustomerNickname = ref('')
const allOrderTags = ref([])
const selectedTagIds = ref([])
const showTagDropdown = ref(false)

const selectedOrderTags = computed(() =>
  allOrderTags.value.filter(t => selectedTagIds.value.includes(t.id))
)

const availableOrderTags = computed(() =>
  allOrderTags.value.filter(t => !selectedTagIds.value.includes(t.id))
)

async function loadOrderTags() {
  try {
    const res = await api.tags.list({ category: 'order' })
    if (res.code === 200) {
      allOrderTags.value = res.data
    }
  } catch {}
}

function addOrderTag(tag) {
  if (!selectedTagIds.value.includes(tag.id)) {
    selectedTagIds.value.push(tag.id)
  }
  showTagDropdown.value = false
}

function removeOrderTag(tagId) {
  selectedTagIds.value = selectedTagIds.value.filter(id => id !== tagId)
}

const switchToNewCustomer = () => {
  isNewCustomer.value = true
  form.customer_id = null
  newCustomerNickname.value = ''
}

const switchToExistingCustomer = () => {
  isNewCustomer.value = false
  newCustomerNickname.value = ''
}

const form = reactive({
  customer_id: null,
  phone: '',
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
  switchToExistingCustomer()
  const customer = customers.value.find(c => c.id === customerId)
  if (customer) {
    if (customer.phone) form.phone = customer.phone
    if (customer.address) form.address = customer.address
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

const isValidPhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(String(phone).trim())
}

const handleSubmit = async () => {
  if (isNewCustomer.value) {
    if (!newCustomerNickname.value.trim()) {
      ElMessage.warning('请输入顾客昵称')
      return
    }
    if (!form.phone.trim()) {
      ElMessage.warning('请输入顾客电话')
      return
    }
    if (!isValidPhone(form.phone)) {
      ElMessage.warning('手机号格式不正确（11位手机号）')
      return
    }
  } else {
    if (!form.customer_id) {
      ElMessage.warning('请选择顾客')
      return
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      ElMessage.warning('手机号格式不正确（11位手机号）')
      return
    }
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
      customer_id: isNewCustomer.value ? null : form.customer_id,
      wechat_nickname: isNewCustomer.value ? newCustomerNickname.value.trim() : undefined,
      phone: form.phone.trim() || undefined,
      delivery_address: form.address,
      items: validItems.map(item => ({
        name: item.name,
        qty: Number(item.qty),
        price: Number(item.price),
        unit: item.unit
      })),
      order_total: totalAmount.value,
      delivery_method: form.delivery_method,
      sf_tracking_no: form.sf_tracking_no || undefined,
      remark: form.remark || undefined,
      payment_method: form.payment_method,
      payment_status: form.payment_status,
      tag_ids: selectedTagIds.value,
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
  loadOrderTags()
})
</script>

<style scoped>
/* ============================================================
   DESIGN TOKENS (本文件局部，覆盖 main.css)
   ============================================================ */
.page {
  --gap-page: 12px;
  --gap-row: 14px;
  --gap-control: 10px;
  --pad-card-y: 14px;
  --pad-card-x: 16px;
  --pad-bar: 10px 16px;
  --h-control: 36px;

  display: flex;
  flex-direction: column;
  gap: var(--gap-page);
  width: 100%;
}

/* ============================================================
   TOPBAR
   ============================================================ */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: var(--pad-bar);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.topbar__left,
.topbar__right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.meta + .meta { padding-left: 14px; border-left: 1px solid var(--border); }
.meta__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.meta__value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  font-family: 'SF Mono', 'Consolas', monospace;
}
.meta--primary .meta__label { color: var(--primary); }
.meta__value--lg {
  font-size: 20px;
  color: var(--primary);
  letter-spacing: -0.3px;
}

/* ============================================================
   CARD
   ============================================================ */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--pad-card-y) var(--pad-card-x);
  display: flex;
  flex-direction: column;
  gap: var(--gap-row);
}

/* ============================================================
   FIELDS
   ============================================================ */
.field-row {
  display: flex;
  gap: var(--gap-row);
  align-items: flex-start;
  flex-wrap: wrap;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.field--lg { flex: 2; min-width: 240px; }
.field--md { flex: 1; min-width: 200px; }
.field--sm { flex: 0 0 auto; }
.field--inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.field__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}
.field__label .req { color: var(--primary); margin-left: 2px; }

.field__control {
  width: 100%;
  height: var(--h-control);
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-family: var(--font);
  outline: none;
  transition: all var(--transition-fast);
}
.field__control::placeholder { color: var(--text-muted); }
.field__control:hover { border-color: var(--text-muted); }
.field__control:focus {
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}
.field__control--block { width: 100%; }

/* ============================================================
   SEGMENTED CONTROL
   ============================================================ */
.seg {
  display: inline-flex;
  height: var(--h-control);
  padding: 3px;
  gap: 2px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.seg__btn {
  height: 28px;
  padding: 0 14px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.seg__btn:hover { color: var(--text); }
.seg__btn.is-active {
  background: var(--surface);
  color: var(--primary);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
.seg--prominent {
  border-color: var(--primary);
}
.seg--prominent .seg__btn.is-active {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
.seg--prominent .seg__btn.is-active:hover {
  background: var(--primary-dark);
}
.field__label--prominent {
  color: var(--primary);
  font-weight: 600;
  font-size: 12px;
}

/* ============================================================
   DIVIDER
   ============================================================ */
.divider {
  height: 1px;
  background: var(--border-light);
}

/* ============================================================
   SECTION (区块标题)
   ============================================================ */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--gap-control);
}
.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.section__bar {
  width: 3px;
  height: 14px;
  background: var(--primary);
  border-radius: 2px;
}
.section__title--info .section__bar { background: #457B9D; }
.section__title--warning .section__bar { background: var(--warning); }

.tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: var(--radius-xs);
  font-size: 12px;
  font-weight: 600;
}
.tag--muted { background: var(--surface-2); color: var(--text-muted); }

/* ============================================================
   DATA TABLE
   ============================================================ */
.data-table {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.data-table__head,
.data-table__row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 200px 90px 100px 36px;
  gap: var(--gap-control);
  align-items: center;
  padding: 8px 12px;
}
.data-table__head {
  background: var(--surface-2);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-light);
}
.data-table__row {
  background: var(--surface);
  border-bottom: 1px solid var(--border-light);
  transition: background var(--transition-fast);
}
.data-table__row:last-child { border-bottom: none; }
.data-table__row:hover { background: var(--surface-2); }

.cell { font-size: 13px; color: var(--text); }
.cell--idx {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
}
.cell--num { text-align: right; }
.cell--act { text-align: center; }

.num { font-family: 'SF Mono', 'Consolas', monospace; color: var(--text-secondary); }
.num--strong { color: var(--text); font-weight: 700; }

/* ============================================================
   STEPPER (数量控件)
   ============================================================ */
.stepper {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 2px;
  gap: 2px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.stepper__btn {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.stepper__btn:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
}
.stepper__btn:disabled { opacity: 0.3; cursor: not-allowed; }
.stepper__input {
  width: 44px;
  height: 26px;
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
.stepper__input::-webkit-outer-spin-button,
.stepper__input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.stepper__unit {
  font-size: 11px;
  color: var(--text-muted);
  padding-right: 2px;
}

/* ============================================================
   ROW ACTIONS
   ============================================================ */
.row-remove {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}
.row-remove svg { width: 12px; height: 12px; }
.row-remove:hover:not(:disabled) {
  background: rgba(214, 40, 40, 0.1);
  color: var(--warning);
}
.row-remove:disabled { opacity: 0.3; cursor: not-allowed; }

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font);
  cursor: pointer;
  align-self: flex-start;
  transition: all var(--transition-fast);
}
.add-btn__icon { width: 13px; height: 13px; }
.add-btn:hover {
  border-style: solid;
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(232, 93, 4, 0.04);
}

/* ============================================================
   EMPTY STATE
   ============================================================ */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  text-align: center;
}
.empty__icon { width: 32px; height: 32px; opacity: 0.5; }
.empty p { font-size: 13px; margin: 0; }

/* ============================================================
   BAR (底部操作栏)
   ============================================================ */
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.bar__left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.bar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.final {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding-right: 12px;
  margin-right: 4px;
  border-right: 1px solid var(--border);
}
.final__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.final__value {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  font-family: 'SF Mono', 'Consolas', monospace;
  letter-spacing: -0.5px;
}

/* ============================================================
   BUTTONS
   ============================================================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--h-control);
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn__icon { width: 14px; height: 14px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 6px rgba(232, 93, 4, 0.25);
}
.btn--primary:hover:not(:disabled) {
  background: var(--primary-dark);
  box-shadow: var(--shadow-glow-hover);
  transform: translateY(-1px);
}

.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--surface);
  color: var(--text);
  border-color: var(--text-muted);
}

.btn--lg { height: 40px; padding: 0 20px; font-size: 14px; }

/* ============================================================
   SELECT OPTIONS (下拉项内容)
   ============================================================ */
.select-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.select-row__sub {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Consolas', monospace;
}
.select-row__sub--price {
  color: var(--primary);
  font-weight: 600;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 1100px) {
  .field-row { flex-wrap: wrap; }
  .field--lg { flex: 1 1 100%; }
  .field--md { flex: 1 1 calc(50% - 7px); min-width: 0; }
  .data-table__head,
  .data-table__row {
    grid-template-columns: 28px minmax(0, 1fr) 180px 80px 90px 32px;
    gap: 8px;
  }
}
@media (max-width: 768px) {
  .topbar { flex-wrap: wrap; }
  .topbar__right .meta:not(.meta--primary) { display: none; }
  .field-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .field--lg, .field--md { flex: 1 1 100%; min-width: 0; }
  .bar { flex-direction: column; align-items: stretch; gap: 10px; }
  .bar__left { justify-content: space-between; }
  .bar__right { justify-content: space-between; }
  .final { border-right: none; padding: 0; margin: 0; }
  .data-table__head { display: none; }
  .data-table__row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 10px 12px;
  }
}

.toggle-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.customer-input-row {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
  transition: border-color 0.15s;
}

.customer-input-row:focus-within {
  border-color: var(--primary);
}

.customer-switch-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--surface-2);
  border: none;
  border-right: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.customer-switch-btn:hover {
  background: rgba(232, 93, 4, 0.08);
  color: var(--primary);
}

.customer-input-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.customer-select {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
}

.customer-select :deep(.el-select__wrapper) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  height: 36px;
  min-height: 36px !important;
  padding: 0 10px !important;
}

.customer-select :deep(.el-select__inner) {
  border: none !important;
  background: transparent !important;
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  height: 36px !important;
  line-height: 36px !important;
  padding: 0 !important;
}

.customer-select :deep(.el-input) {
  border: none !important;
  width: 100%;
  height: 36px;
}

.customer-select :deep(.el-input__wrapper) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  height: 36px;
  line-height: 36px;
  padding: 0 10px !important;
}

.customer-select :deep(.el-input__inner) {
  border: none !important;
  background: transparent !important;
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  height: 36px !important;
  line-height: 36px !important;
  padding: 0 !important;
}

.customer-input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  background: transparent;
  color: var(--text);
  border-radius: 0;
}

.customer-input::placeholder {
  color: var(--text-muted);
}

.switch-icon {
  width: 14px;
  height: 14px;
}

.delivery-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.delivery-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
}

.delivery-tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  color: inherit;
  opacity: 0.7;
}

.delivery-tag-remove:hover {
  opacity: 1;
}

.delivery-tag-add-wrap {
  position: relative;
}

.delivery-tag-add-btn {
  padding: 3px 10px;
  border: 1px dashed var(--border-light);
  border-radius: 20px;
  background: none;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
}

.delivery-tag-add-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.delivery-tag-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  min-width: 140px;
  z-index: 300;
  overflow: hidden;
}

.delivery-tag-option {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: none;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
}

.delivery-tag-option:hover {
  background: var(--surface-2);
}

.delivery-tag-option-empty {
  padding: 8px 14px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>