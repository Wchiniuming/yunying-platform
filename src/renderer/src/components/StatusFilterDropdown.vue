<template>
  <div class="status-filter" ref="containerRef">
    <button
      class="status-filter__trigger"
      :class="{ 'is-active': isOpen, 'has-value': modelValue !== '' }"
      @click="toggleDropdown"
      type="button"
    >
      <span class="status-filter__value">
        {{ selectedLabel }}
      </span>
      <svg
        v-if="modelValue !== ''"
        class="status-filter__clear"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        @click.stop="clearValue"
      >
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <svg
        v-else
        class="status-filter__arrow"
        :class="{ 'is-open': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <Transition name="dropdown-fade">
      <div
        v-if="isOpen"
        class="status-filter__panel"
      >
        <div
          v-for="option in options"
          :key="option.value"
          class="status-filter__option"
          :class="{ 'is-selected': option.value === modelValue }"
          @click="selectOption(option)"
        >
          {{ option.label }}
          <svg
            v-if="option.value === modelValue"
            class="status-filter__check"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '状态'
  },
  options: {
    type: Array,
    default: () => [
      { label: '全部', value: '' },
      { label: '待接单', value: 'pending' },
      { label: '制作中', value: 'preparing' },
      { label: '待取餐', value: 'waiting_pickup' },
      { label: '配送中', value: 'delivering' },
      { label: '已送达', value: 'delivered' },
      { label: '已完成', value: 'completed' },
      { label: '已取消', value: 'cancelled' }
    ]
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const containerRef = ref(null)

const selectedLabel = computed(() => {
  const found = props.options.find(opt => opt.value === props.modelValue)
  return found ? found.label : props.placeholder
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectOption(option) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

function clearValue() {
  emit('update:modelValue', '')
  emit('change', '')
  isOpen.value = false
}

function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.status-filter {
  position: relative;
  display: inline-block;
}

.status-filter__trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font);
  min-width: 90px;
  box-sizing: border-box;
  height: 36px;
}

.status-filter__trigger:hover {
  border-color: var(--primary);
}

.status-filter__trigger.is-active {
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}

.status-filter__trigger:not(.has-value) .status-filter__value {
  color: var(--text-muted);
}

.status-filter__value {
  flex: 1;
  text-align: left;
}

.status-filter__arrow {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.status-filter__arrow.is-open {
  transform: rotate(180deg);
}

.status-filter__clear {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
  cursor: pointer;
  transition: color 0.12s;
}

.status-filter__clear:hover {
  color: var(--text);
}

.status-filter__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
  padding: 4px 0;
}

.status-filter__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.status-filter__option:hover {
  background: rgba(232, 93, 4, 0.08);
}

.status-filter__option.is-selected {
  color: var(--primary);
  font-weight: 600;
  background: rgba(232, 93, 4, 0.05);
}

.status-filter__check {
  width: 14px;
  height: 14px;
  color: var(--primary);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
