import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import DrawerContent from '../src/components/DrawerContent.vue'
import DrawerRoot from '../src/components/DrawerRoot.vue'

vi.mock('../src/composables/useDrawerScrollLock', () => ({
	useDrawerScrollLock: () => undefined,
}))

vi.mock('../src/utils/drawerDebug', () => ({
	createDrawerDebugId: () => 'bottom#test',
	ensureDrawerDebugPanel: () => undefined,
	isDrawerDebugEnabled: () => false,
	logDrawerDebug: () => undefined,
}))

describe('Drawer', () => {
	it('emits content:error and closes when a child throws during render', async () => {
		const Boom = defineComponent({
			name: 'Boom',
			setup() {
				return () => {
					throw new Error('drawer content render failed')
				}
			},
		})

		const wrapper = mount(DrawerRoot, {
			props: {
				defaultOpen: true,
			},
			slots: {
				default: () => h(DrawerContent, null, {
					default: () => h(Boom),
				}),
			},
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		await nextTick()

		expect(wrapper.emitted('content:error')).toBeTruthy()
		expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
	})
})
