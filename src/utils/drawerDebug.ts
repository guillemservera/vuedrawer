import type { DrawerDirection } from './drawerTypes'

const DRAWER_DEBUG_QUERY_KEY = 'drawerDebug'
const MAX_DEBUG_LINES = 250
const PANEL_ID = 'vuedrawer-debug-panel'
const HEADER_ID = 'vuedrawer-debug-header'
const TEXTAREA_ID = 'vuedrawer-debug-textarea'
const SHELL_ID = 'vuedrawer-debug-shell'

let nextDrawerDebugId = 1
let debugLines: string[] = []
let panelInitialized = false
let panelExpanded = false

function getWindowObject() {
	if (typeof window === 'undefined') return null
	return window as Window & typeof globalThis
}

function isDebugQueryEnabled() {
	const windowObject = getWindowObject()
	if (!windowObject) return false
	const searchParams = new URLSearchParams(windowObject.location.search)
	const value = searchParams.get(DRAWER_DEBUG_QUERY_KEY)
	return value === '1' || value === 'true'
}

function updatePanelText() {
	if (typeof document === 'undefined') return
	const textarea = document.getElementById(TEXTAREA_ID) as HTMLTextAreaElement | null
	if (!textarea) return
	textarea.value = debugLines.join('\n')
	textarea.scrollTop = textarea.scrollHeight
}

function updatePanelVisibility() {
	if (typeof document === 'undefined') return
	const shell = document.getElementById(SHELL_ID)
	const header = document.getElementById(HEADER_ID)
	const textarea = document.getElementById(TEXTAREA_ID) as HTMLTextAreaElement | null
	if (!shell || !header || !textarea) return

	shell.setAttribute('style', [
		'pointer-events:auto',
		'display:flex',
		'flex-direction:column',
		'gap:8px',
		'align-items:stretch',
		panelExpanded
			? 'width:min(28rem, calc(100vw - 16px))'
			: 'width:auto',
	].join(';'))

	header.style.display = panelExpanded ? 'flex' : 'none'
	textarea.style.display = panelExpanded ? 'block' : 'none'

	const panelButtons = shell.querySelectorAll<HTMLButtonElement>('[data-drawer-debug-panel-action="true"]')
	for (const button of panelButtons) {
		button.style.display = panelExpanded ? 'inline-flex' : 'none'
	}

	const collapseButton = shell.querySelector<HTMLButtonElement>('[data-drawer-debug-collapse="true"]')
	if (collapseButton) {
		collapseButton.textContent = panelExpanded ? 'Hide' : 'DBG'
		collapseButton.setAttribute('aria-label', panelExpanded ? 'Hide drawer debug panel' : 'Show drawer debug panel')
		collapseButton.style.alignSelf = panelExpanded ? 'flex-end' : 'stretch'
	}
}

function copyDebugLines() {
	const text = debugLines.join('\n')
	if (!text) return

	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		navigator.clipboard.writeText(text).catch(() => {
			fallbackCopyDebugLines()
		})
		return
	}

	fallbackCopyDebugLines()
}

function fallbackCopyDebugLines() {
	if (typeof document === 'undefined') return
	const textarea = document.getElementById(TEXTAREA_ID) as HTMLTextAreaElement | null
	if (!textarea) return
	textarea.focus()
	textarea.select()
	textarea.setSelectionRange(0, textarea.value.length)
	try {
		document.execCommand('copy')
	}
	catch {
		// Ignore fallback copy failures.
	}
}

export function isDrawerDebugEnabled() {
	return isDebugQueryEnabled()
}

export function createDrawerDebugId(direction: DrawerDirection, nested: boolean) {
	const label = nested ? `${direction}-nested` : direction
	const id = nextDrawerDebugId
	nextDrawerDebugId += 1
	return `${label}#${id}`
}

export function ensureDrawerDebugPanel() {
	if (!isDrawerDebugEnabled() || panelInitialized || typeof document === 'undefined') return

	const existingPanel = document.getElementById(PANEL_ID)
	if (existingPanel) {
		panelInitialized = true
		updatePanelText()
		return
	}

	const container = document.createElement('div')
	container.id = PANEL_ID
	container.setAttribute('style', [
		'position:fixed',
		'top:max(8px, env(safe-area-inset-top))',
		'right:8px',
		'z-index:2147483647',
		'font:12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace',
		'pointer-events:none',
	].join(';'))

	const shell = document.createElement('div')
	shell.id = SHELL_ID
	shell.setAttribute('style', [
		'pointer-events:auto',
		'display:flex',
		'flex-direction:column',
		'gap:8px',
		'align-items:flex-end',
	].join(';'))

	const header = document.createElement('div')
	header.id = HEADER_ID
	header.setAttribute('style', [
		'display:flex',
		'align-items:center',
		'justify-content:space-between',
		'gap:8px',
		'padding:10px',
		'background:Canvas',
		'color:CanvasText',
		'border:1px solid ButtonBorder',
		'border-radius:12px',
		'box-shadow:0 10px 30px rgba(15, 23, 42, 0.18)',
	].join(';'))

	const title = document.createElement('strong')
	title.textContent = 'Drawer Debug'
	title.setAttribute('style', 'display:none;')

	const actions = document.createElement('div')
	actions.setAttribute('style', 'display:flex;gap:6px;')

	const textarea = document.createElement('textarea')
	textarea.id = TEXTAREA_ID
	textarea.readOnly = true
	textarea.setAttribute('style', [
		'width:100%',
		'display:none',
		'min-height:180px',
		'max-height:50vh',
		'padding:8px',
		'border-radius:8px',
		'border:1px solid ButtonBorder',
		'background:Canvas',
		'color:CanvasText',
		'resize:vertical',
		'box-sizing:border-box',
		'-webkit-appearance:none',
	].join(';'))

	const makeButton = (label: string, onClick: () => void) => {
		const button = document.createElement('button')
		button.type = 'button'
		button.textContent = label
		button.setAttribute('style', [
			'border:none',
			'border-radius:999px',
			'padding:6px 10px',
			'background:ButtonFace',
			'color:ButtonText',
			'font:inherit',
			'touch-action:manipulation',
			'display:inline-flex',
			'align-items:center',
			'justify-content:center',
		].join(';'))
		button.addEventListener('click', onClick)
		return button
	}

	const collapseButton = makeButton('DBG', () => {
		panelExpanded = !panelExpanded
		title.style.display = panelExpanded ? 'block' : 'none'
		updatePanelVisibility()
		if (panelExpanded) {
			updatePanelText()
		}
	})
	collapseButton.setAttribute('data-drawer-debug-collapse', 'true')
	collapseButton.setAttribute('style', [
		collapseButton.getAttribute('style') ?? '',
		'background:Canvas',
		'border:1px solid ButtonBorder',
		'box-shadow:0 10px 30px rgba(15, 23, 42, 0.18)',
	].join(';'))

	const copyButton = makeButton('Copy', copyDebugLines)
	copyButton.setAttribute('data-drawer-debug-panel-action', 'true')

	const clearButton = makeButton('Clear', () => {
		debugLines = []
		updatePanelText()
	})
	clearButton.setAttribute('data-drawer-debug-panel-action', 'true')

	actions.appendChild(copyButton)
	actions.appendChild(clearButton)

	header.appendChild(title)
	header.appendChild(actions)
	shell.appendChild(collapseButton)
	shell.appendChild(header)
	shell.appendChild(textarea)
	container.appendChild(shell)
	document.body.appendChild(container)
	panelInitialized = true
	updatePanelVisibility()
	updatePanelText()
}

function formatValue(value: unknown): string {
	if (value === null) return 'null'
	if (value === undefined) return 'undefined'
	if (typeof value === 'string') return value
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)
	if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value)
		}
		catch {
			return '[object]'
		}
	}
	return String(value)
}

export function logDrawerDebug(source: string, event: string, details?: Record<string, unknown>) {
	if (!isDrawerDebugEnabled()) return
	ensureDrawerDebugPanel()

	const now = new Date()
	const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`
	const detailsText = details
		? Object.entries(details)
				.map(([key, value]) => `${key}=${formatValue(value)}`)
				.join(' ')
		: ''
	const line = `${timestamp} ${source} ${event}${detailsText ? ` ${detailsText}` : ''}`

	debugLines.push(line)
	if (debugLines.length > MAX_DEBUG_LINES) {
		debugLines = debugLines.slice(debugLines.length - MAX_DEBUG_LINES)
	}

	updatePanelText()
}
