<script setup lang="ts">
import type { DrawerHandleProps } from '../utils/drawerTypes'
import { useOptionalDrawerRootContext } from '../utils/drawerContext'
import { useOptionalDrawerGestureContext } from '../utils/drawerGestureContext'

defineProps<DrawerHandleProps>()

const root = useOptionalDrawerRootContext()
const gesture = useOptionalDrawerGestureContext()

function shouldOwnGesture() {
	return Boolean(root?.handleOnly.value && gesture)
}

function handlePointerDown(event: PointerEvent) {
	if (!shouldOwnGesture()) return
	event.stopPropagation()
	gesture?.handlePointerDown(event)
}

function handlePointerMove(event: PointerEvent) {
	if (!shouldOwnGesture()) return
	event.stopPropagation()
	gesture?.handlePointerMove(event)
}

function handlePointerUp(event: PointerEvent) {
	if (!shouldOwnGesture()) return
	event.stopPropagation()
	gesture?.handlePointerUp(event)
}

function handlePointerCancel(event: PointerEvent) {
	if (!shouldOwnGesture()) return
	event.stopPropagation()
	gesture?.handlePointerCancel(event)
}

function handleLostPointerCapture(event: PointerEvent) {
	if (!shouldOwnGesture()) return
	event.stopPropagation()
	gesture?.handleLostPointerCapture(event)
}
</script>

<template>
	<div
		aria-hidden="true"
		data-drawer-handle=""
		:class="['drawer-handle', $props.class]"
		@pointerdown="handlePointerDown"
		@pointermove="handlePointerMove"
		@pointerup="handlePointerUp"
		@pointercancel="handlePointerCancel"
		@lostpointercapture="handleLostPointerCapture"
	>
		<span data-drawer-handle-hitarea="" aria-hidden="true" />
	</div>
</template>
