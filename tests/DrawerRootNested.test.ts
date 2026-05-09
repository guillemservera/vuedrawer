import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import DrawerContent from '../src/components/DrawerContent.vue'
import DrawerOverlay from '../src/components/DrawerOverlay.vue'
import { useDrawerRootContext } from '../src/utils/drawerContext'
import DrawerRoot from '../src/components/DrawerRoot.vue'
import DrawerRootNested from '../src/components/DrawerRootNested.vue'

vi.mock('../src/composables/useDrawerScrollLock', () => ({
	useDrawerScrollLock: () => undefined,
}))

vi.mock('../src/utils/drawerDebug', () => ({
	createDrawerDebugId: () => 'bottom#test',
	ensureDrawerDebugPanel: () => undefined,
	isDrawerDebugEnabled: () => false,
	logDrawerDebug: () => undefined,
}))

const Harness = defineComponent({
	components: {
		DrawerContent,
		DrawerOverlay,
		DrawerRoot,
		DrawerRootNested,
	},
	setup() {
		const open = ref(true)
		const childOpen = ref(true)

		return {
			open,
			childOpen,
		}
	},
	template: `
		<DrawerRoot v-model:open="open">
			<DrawerOverlay />
			<DrawerContent />
			<DrawerRootNested v-model:open="childOpen">
				<DrawerOverlay />
				<DrawerContent />
				<div />
			</DrawerRootNested>
		</DrawerRoot>
	`,
})

const ContextProbe = defineComponent({
	setup(_, { expose }) {
		const root = useDrawerRootContext()
		expose({ root })
		return () => null
	},
})

const NestedInstantHarness = defineComponent({
	components: {
		ContextProbe,
		DrawerContent,
		DrawerOverlay,
		DrawerRoot,
		DrawerRootNested,
	},
	setup() {
		const open = ref(true)
		const childOpen = ref(true)

		return {
			open,
			childOpen,
		}
	},
	template: `
		<DrawerRoot v-model:open="open">
			<DrawerOverlay />
			<DrawerContent />
			<ContextProbe ref="parentProbe" />
			<DrawerRootNested v-model:open="childOpen">
				<DrawerOverlay />
				<DrawerContent />
				<ContextProbe ref="childProbe" />
			</DrawerRootNested>
		</DrawerRoot>
	`,
})

describe('DrawerRootNested', () => {
	it('forces nested drawers closed when the parent drawer closes', async () => {
		const wrapper = mount(Harness)

		expect((wrapper.vm as unknown as { childOpen: boolean }).childOpen).toBe(true)

		;(wrapper.vm as unknown as { open: boolean }).open = false
		await nextTick()
		await nextTick()

		expect((wrapper.vm as unknown as { childOpen: boolean }).childOpen).toBe(false)
	})

	it('keeps the parent restore animation at the normal duration after an instant nested dismiss', async () => {
		const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
			callback(0)
			return 1
		})
		const wrapper = mount(NestedInstantHarness, {
			attachTo: document.body,
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		await nextTick()

		const probes = wrapper.findAllComponents(ContextProbe)
		const parentProbe = probes[0]!.vm.$.exposed as {
			root: ReturnType<typeof useDrawerRootContext>
		}

		;(wrapper.vm as unknown as { childOpen: boolean }).childOpen = false
		await nextTick()

		expect(parentProbe.root.contentElement.value?.style.transition).toContain('420ms')

		wrapper.unmount()
		requestAnimationFrameSpy.mockRestore()
	})

	it('starts the parent nested transform in the same tick as the child opens', async () => {
		const wrapper = mount(NestedInstantHarness, {
			attachTo: document.body,
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		await nextTick()

		const probes = wrapper.findAllComponents(ContextProbe)
		const parentProbe = probes[0]!.vm.$.exposed as {
			root: ReturnType<typeof useDrawerRootContext>
		}

		const transform = parentProbe.root.contentElement.value?.style.transform ?? ''
		expect(transform).toContain('scale')
		expect(transform).toContain('translate3d')

		wrapper.unmount()
	})
})
