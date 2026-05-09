<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { useDrawerRootContext } from '../utils/drawerContext'

defineOptions({
	inheritAttrs: false,
})

const props = defineProps({
	disabled: {
		type: Boolean,
		default: false,
	},
})
const attrs = useAttrs()
const root = useDrawerRootContext()
const state = computed(() => root.open.value ? 'open' : 'closed')

function handleClick(event: MouseEvent) {
	if (props.disabled || event.defaultPrevented) return
	root.requestOpenChange(true)
}
</script>

<template>
	<button
		v-bind="attrs"
		type="button"
		:disabled="props.disabled || undefined"
		data-drawer-trigger=""
		:data-state="state"
		aria-haspopup="dialog"
		:aria-expanded="root.open.value ? 'true' : 'false'"
		:aria-controls="root.contentId.value"
		@click="handleClick"
	>
		<slot />
	</button>
</template>
