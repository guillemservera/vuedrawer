<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { PropType } from 'vue'
import { useDrawerRootContext } from '../utils/drawerContext'
import type { DrawerAnimation } from '../utils/drawerTypes'

defineOptions({
	inheritAttrs: false,
})

const props = defineProps({
	animation: {
		type: String as PropType<DrawerAnimation>,
		default: undefined,
	},
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
	root.requestOpenChange(false, { animation: props.animation })
}
</script>

<template>
	<button
		v-bind="attrs"
		type="button"
		:disabled="props.disabled || undefined"
		data-drawer-close=""
		:data-state="state"
		@click="handleClick"
	>
		<slot />
	</button>
</template>
