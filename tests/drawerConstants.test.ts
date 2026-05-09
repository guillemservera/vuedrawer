import { describe, expect, it } from 'vitest'
import {
	DRAWER_NESTED_DISPLACEMENT,
	getCloseDirectionSign,
	getClosedTransform,
	getNestedTransform,
	getTranslateStyles,
	isVerticalDrawer,
} from '../src/utils/drawerConstants'

describe('drawerConstants', () => {
	it('maps directions to the correct close sign', () => {
		expect(getCloseDirectionSign('bottom')).toBe(1)
		expect(getCloseDirectionSign('right')).toBe(1)
		expect(getCloseDirectionSign('top')).toBe(-1)
		expect(getCloseDirectionSign('left')).toBe(-1)
	})

	it('identifies vertical drawers correctly', () => {
		expect(isVerticalDrawer('bottom')).toBe(true)
		expect(isVerticalDrawer('top')).toBe(true)
		expect(isVerticalDrawer('left')).toBe(false)
		expect(isVerticalDrawer('right')).toBe(false)
	})

	it('builds translate values in the close direction for each drawer side', () => {
		expect(getTranslateStyles('bottom', 24)).toBe('translate3d(0, 24px, 0)')
		expect(getTranslateStyles('top', 24)).toBe('translate3d(0, -24px, 0)')
		expect(getTranslateStyles('left', 24)).toBe('translate3d(-24px, 0, 0)')
		expect(getTranslateStyles('right', 24)).toBe('translate3d(24px, 0, 0)')
	})

	it('returns off-screen closed transforms for each direction', () => {
		expect(getClosedTransform('bottom')).toContain('100%')
		expect(getClosedTransform('top')).toContain('-100%')
		expect(getClosedTransform('left')).toContain('-100%')
		expect(getClosedTransform('right')).toContain('100%')
	})

	it('keeps nested transform neutral when fully closed', () => {
		expect(getNestedTransform('bottom', 1)).toBe('scale(1) translate3d(0, 0px, 0)')
		expect(getNestedTransform('left', 1)).toBe('scale(1) translate3d(0px, 0, 0)')
	})

	it('applies the expected nested displacement when fully open', () => {
		expect(getNestedTransform('bottom', 0)).toContain(`${DRAWER_NESTED_DISPLACEMENT * -1}px`)
		expect(getNestedTransform('left', 0)).toContain(`${DRAWER_NESTED_DISPLACEMENT}px`)
	})
})
