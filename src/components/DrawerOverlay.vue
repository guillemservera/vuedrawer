<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { logDrawerDebug } from '../utils/drawerDebug'
import { useDrawerRootContext } from '../utils/drawerContext'

defineOptions({
	inheritAttrs: false,
})

const attrs = useAttrs()
const root = useDrawerRootContext()

const shouldShow = computed(() => root.open.value || root.gestureClosing.value)
const shouldUseInstantLeave = computed(() => root.skipCloseAnimation.value)
const closeAnimation = computed(() => root.closeAnimationOverride.value ?? root.closeAnimation.value)
const leaveActiveClass = computed(() => {
	const classes = ['drawer-overlay-leave-active', `drawer-overlay-leave-active--${closeAnimation.value}`]
	if (shouldUseInstantLeave.value) {
		classes.push('drawer-overlay-leave-active--instant')
	}
	return classes.join(' ')
})
const overlayPointerId = ref<number | null>(null)

function assignOverlayRef(el: unknown) {
	if (!el) {
		root.registerOverlayElement(null)
		return
	}
	root.registerOverlayElement(el instanceof HTMLElement ? el : null)
}

function handleOverlayPointerDown(event: PointerEvent) {
	if (event.target !== event.currentTarget) return
	logDrawerDebug(root.debugId, 'overlay:pointerdown')
	if (!root.modal.value) return
	root.handleDismissAttempt(event)
	if (event.defaultPrevented || !root.dismissible.value) return
	overlayPointerId.value = event.pointerId ?? -1
	event.stopPropagation()
	event.preventDefault()
}

function handleOverlayPointerUp(event: PointerEvent) {
	if (event.target !== event.currentTarget) return
	const pointerId = event.pointerId ?? -1
	if (overlayPointerId.value !== pointerId) return

	overlayPointerId.value = null
	event.stopPropagation()
	event.preventDefault()
	root.requestOpenChange(false)
}

function handleOverlayPointerCancel(event: PointerEvent) {
	const pointerId = event.pointerId ?? -1
	if (overlayPointerId.value === pointerId) {
		overlayPointerId.value = null
	}
}
</script>

<template>
	<Transition
		:appear="root.shouldAnimateInitialOpen.value"
		enter-active-class="drawer-overlay-enter-active"
		enter-from-class="drawer-overlay-enter-from"
		enter-to-class="drawer-overlay-enter-to"
		:leave-active-class="leaveActiveClass"
		leave-from-class="drawer-overlay-leave-from"
		leave-to-class="drawer-overlay-leave-to"
	>
		<div
			v-if="shouldShow"
			:ref="assignOverlayRef"
			v-bind="attrs"
			data-drawer-overlay=""
			:data-modal="root.modal.value ? 'true' : 'false'"
			:data-snap-points="root.open.value && root.hasSnapPoints.value ? 'true' : 'false'"
			:data-snap-points-overlay="root.open.value && root.hasSnapPoints.value && root.shouldFadeOverlay.value ? 'true' : 'false'"
			:data-state="root.open.value ? 'open' : 'closed'"
			:data-close-animation="closeAnimation"
			:class="['drawer-overlay', { 'drawer-overlay--non-modal': !root.modal.value }]"
			@pointerdown="handleOverlayPointerDown"
			@pointerup="handleOverlayPointerUp"
			@pointercancel="handleOverlayPointerCancel"
		/>
	</Transition>
</template>
