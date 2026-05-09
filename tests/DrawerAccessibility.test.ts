import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import DrawerClose from '../src/components/DrawerClose.vue'
import DrawerContent from '../src/components/DrawerContent.vue'
import DrawerDescription from '../src/components/DrawerDescription.vue'
import DrawerPortal from '../src/components/DrawerPortal.vue'
import DrawerRoot from '../src/components/DrawerRoot.vue'
import DrawerTitle from '../src/components/DrawerTitle.vue'
import DrawerTrigger from '../src/components/DrawerTrigger.vue'

vi.mock('../src/composables/useDrawerScrollLock', () => ({
	useDrawerScrollLock: () => undefined,
}))

vi.mock('../src/utils/drawerDebug', () => ({
	createDrawerDebugId: () => 'bottom#test',
	ensureDrawerDebugPanel: () => undefined,
	isDrawerDebugEnabled: () => false,
	logDrawerDebug: () => undefined,
}))

describe('Drawer accessibility primitives', () => {
	it('links title and description to dialog content automatically', async () => {
		const Harness = defineComponent({
			components: {
				DrawerContent,
				DrawerDescription,
				DrawerRoot,
				DrawerTitle,
			},
			template: `
				<DrawerRoot default-open>
					<DrawerContent>
						<DrawerTitle>Portfolio filters</DrawerTitle>
						<DrawerDescription>Choose the visible market filters.</DrawerDescription>
					</DrawerContent>
				</DrawerRoot>
			`,
		})

		const wrapper = mount(Harness, {
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		await nextTick()
		await nextTick()

		const content = wrapper.get('[data-drawer-content]')
		const title = wrapper.get('h2')
		const description = wrapper.get('p')

		expect(content.attributes('role')).toBe('dialog')
		expect(content.attributes('aria-modal')).toBe('true')
		expect(content.attributes('aria-labelledby')).toBe(title.attributes('id'))
		expect(content.attributes('aria-describedby')).toBe(description.attributes('id'))
	})

	it('opens with DrawerTrigger and closes with DrawerClose', async () => {
		const Harness = defineComponent({
			components: {
				DrawerClose,
				DrawerContent,
				DrawerRoot,
				DrawerTrigger,
			},
			setup() {
				const open = ref(false)
				return { open }
			},
			template: `
				<DrawerRoot v-model:open="open">
					<DrawerTrigger class="open-button">Open</DrawerTrigger>
					<DrawerContent>
						<DrawerClose class="close-button">Close</DrawerClose>
					</DrawerContent>
				</DrawerRoot>
			`,
		})

		const wrapper = mount(Harness, {
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		const trigger = wrapper.get('[data-drawer-trigger]')
		expect(trigger.attributes('aria-haspopup')).toBe('dialog')
		expect(trigger.attributes('aria-expanded')).toBe('false')

		await trigger.trigger('click')
		await nextTick()

		expect((wrapper.vm as unknown as { open: boolean }).open).toBe(true)
		expect(wrapper.get('[data-drawer-trigger]').attributes('aria-expanded')).toBe('true')
		expect(wrapper.get('[data-drawer-trigger]').attributes('aria-controls')).toBe(wrapper.get('[data-drawer-content]').attributes('id'))

		await wrapper.get('[data-drawer-close]').trigger('click')
		await nextTick()

		expect((wrapper.vm as unknown as { open: boolean }).open).toBe(false)
	})

	it('teleports to a configured portal target', async () => {
		const target = document.createElement('div')
		target.id = 'drawer-test-portal'
		document.body.appendChild(target)

		const Harness = defineComponent({
			components: {
				DrawerContent,
				DrawerPortal,
				DrawerRoot,
			},
			template: `
				<DrawerRoot default-open>
					<DrawerPortal to="#drawer-test-portal">
						<DrawerContent />
					</DrawerPortal>
				</DrawerRoot>
			`,
		})

		const wrapper = mount(Harness, {
			attachTo: document.body,
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		await nextTick()

		expect(target.querySelector('[data-drawer-content]')).toBeTruthy()

		wrapper.unmount()
		target.remove()
	})

	it('hides outside content from assistive tech while a modal drawer is open', async () => {
		const outside = document.createElement('main')
		outside.id = 'outside-app'
		document.body.appendChild(outside)

		const Harness = defineComponent({
			components: {
				DrawerContent,
				DrawerRoot,
			},
			setup() {
				const open = ref(true)
				return { open }
			},
			template: `
				<DrawerRoot v-model:open="open">
					<DrawerContent />
				</DrawerRoot>
			`,
		})

		const wrapper = mount(Harness, {
			attachTo: document.body,
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		await nextTick()
		expect(outside.getAttribute('aria-hidden')).toBe('true')

		;(wrapper.vm as unknown as { open: boolean }).open = false
		await nextTick()
		expect(outside.hasAttribute('aria-hidden')).toBe(false)

		wrapper.unmount()
		outside.remove()
	})

	it('allows outside pointer dismissal to be prevented', async () => {
		const outside = document.createElement('button')
		outside.type = 'button'
		document.body.appendChild(outside)

		const Harness = defineComponent({
			components: {
				DrawerContent,
				DrawerRoot,
			},
			setup() {
				const open = ref(true)
				return { open }
			},
			template: `
				<DrawerRoot v-model:open="open">
					<DrawerContent @pointer-down-outside="$event.preventDefault()" />
				</DrawerRoot>
			`,
		})

		const wrapper = mount(Harness, {
			attachTo: document.body,
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		await nextTick()
		outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
		await nextTick()

		expect((wrapper.vm as unknown as { open: boolean }).open).toBe(true)

		wrapper.unmount()
		outside.remove()
	})

	it('keeps programmatic focus inside modal content', async () => {
		const outside = document.createElement('button')
		outside.type = 'button'
		document.body.appendChild(outside)

		const Harness = defineComponent({
			components: {
				DrawerContent,
				DrawerRoot,
			},
			template: `
				<DrawerRoot default-open>
					<DrawerContent>
						<button class="inside-button" type="button">Inside</button>
					</DrawerContent>
				</DrawerRoot>
			`,
		})

		const wrapper = mount(Harness, {
			attachTo: document.body,
			global: {
				stubs: {
					Transition: false,
				},
			},
		})

		await nextTick()
		outside.focus()
		await nextTick()

		expect(document.activeElement).toBe(wrapper.get('.inside-button').element)

		wrapper.unmount()
		outside.remove()
	})
})
