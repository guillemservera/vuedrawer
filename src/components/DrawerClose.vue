<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { PropType } from 'vue'
import { useDrawerRootContext } from '../utils/drawerContext'
import type { DrawerAnimation, DrawerCloseScope, DrawerRootContext } from '../utils/drawerTypes'

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
	scope: {
		type: String as PropType<DrawerCloseScope>,
		default: 'current',
		validator: (value: string) => ['current', 'all'].includes(value),
	},
})
const attrs = useAttrs()
const root = useDrawerRootContext()
const state = computed(() => root.open.value ? 'open' : 'closed')

function getCloseTargets() {
	const targets: DrawerRootContext[] = [root]
	if (props.scope !== 'all') return targets

	let target: DrawerRootContext = root
	while (target.parentContext) {
		target = target.parentContext
		targets.push(target)
	}

	return targets
}

function handleClick(event: MouseEvent) {
	if (props.disabled || event.defaultPrevented) return
	const targets = getCloseTargets()
	const rootTarget = targets.at(-1)
	if (!rootTarget) return

	for (const target of targets.slice(0, -1)) {
		target.setSkipCloseAnimation(true)
		target.setGestureClosing(false)
		target.requestOpenChange(false)
	}

	rootTarget.requestOpenChange(false, { animation: props.animation })
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
